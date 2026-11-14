/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PackageOpen, Plus, Sparkles, Smartphone, Download, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import { Pedido, EstadoPedido, ModoVista, FiltroPago, ResumenFinanciero } from './types';
import {
  STORAGE_KEY,
  PEDIDOS_EJEMPLO,
  copiarAlPortapapeles,
  generarMensajeWhatsAppCliente,
  exportarCSV,
  exportarCopiaSeguridadLocalStorage,
  formatearMes,
} from './utils/helpers';
import {
  subscribeToAuth,
  subscribeToOrders,
  ensureUserProfile,
  signInWithGoogle,
  signOutFirebase,
  createOrderInCloud,
  updateOrderInCloud,
  updateOrderStatusInCloud,
  updateOrderPaymentInCloud,
  deleteOrderInCloud,
  syncLocalOrdersToCloud,
  sanitizeOrderId,
} from './firebase';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { FiltersBar } from './components/FiltersBar';
import { OrderTable } from './components/OrderTable';
import { OrderMobileCard } from './components/OrderMobileCard';
import { SupplierGroupsView } from './components/SupplierGroupsView';
import { MonthGroupsView } from './components/MonthGroupsView';
import { OrderModal } from './components/OrderModal';
import { QRCodeModal } from './components/QRCodeModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FirebaseSyncBar } from './components/FirebaseSyncBar';
import { Toast } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [localPedidos, setLocalPedidos] = useState<Pedido[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error al cargar pedidos:', e);
    }
    return PEDIDOS_EJEMPLO;
  });

  // Firebase Auth & Cloud Firestore state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudPedidos, setCloudPedidos] = useState<Pedido[]>([]);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const prevCloudIdsRef = useRef<Set<string>>(new Set());

  // State for search and filters
  const [busqueda, setBusqueda] = useState('');
  const [modoVista, setModoVista] = useState<ModoVista>('lista');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('todos');

  // Modal states
  const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState<Pedido | null>(null);
  const [modalQR, setModalQR] = useState(false);

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    abierto: boolean;
    titulo: string;
    mensaje: string;
    textoConfirmar?: string;
    esPeligroso?: boolean;
    accion: () => void;
  }>({
    abierto: false,
    titulo: '',
    mensaje: '',
    accion: () => {},
  });

  // Toast notification state
  const [toast, setToast] = useState<{
    mensaje: string | null;
    tipo: 'success' | 'error';
  }>({
    mensaje: null,
    tipo: 'success',
  });

  // Save to localStorage whenever localPedidos change (preserves existing local persistence)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localPedidos));
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
    }
  }, [localPedidos]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        try {
          await ensureUserProfile(firebaseUser);
        } catch (err) {
          console.error('Error al verificar perfil de usuario:', err);
        }
      } else {
        setCloudPedidos([]);
        prevCloudIdsRef.current = new Set();
      }
    });
    return () => unsub();
  }, []);

  // Listen to Firestore orders ONLY when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const unsub = subscribeToOrders(
      user.uid,
      (nextCloud) => {
        const nextIds = new Set(nextCloud.map((o) => sanitizeOrderId(o.id)));
        const removedFromCloud = new Set<string>();
        prevCloudIdsRef.current.forEach((oldId) => {
          if (!nextIds.has(oldId)) {
            removedFromCloud.add(oldId);
          }
        });
        prevCloudIdsRef.current = nextIds;

        setCloudPedidos(nextCloud);

        // Merge cloud updates into localPedidos without ever discarding unsynced local-only orders
        setLocalPedidos((prevLocal) => {
          const cloudById = new Map(nextCloud.map((c) => [sanitizeOrderId(c.id), c]));
          const updatedLocal: Pedido[] = [];
          const seenIds = new Set<string>();

          prevLocal.forEach((loc) => {
            const sid = sanitizeOrderId(loc.id);
            if (removedFromCloud.has(sid)) {
              // Deleted on another synced device
              return;
            }
            const fromCloud = cloudById.get(sid);
            updatedLocal.push(fromCloud || loc);
            seenIds.add(sid);
          });

          // Prepend brand new orders coming from other devices
          const newFromCloud = nextCloud.filter((c) => !seenIds.has(sanitizeOrderId(c.id)));
          return [...newFromCloud, ...updatedLocal];
        });
      },
      (err) => {
        console.error('Error en sincronización de Firestore:', err);
        mostrarToast('Error de permisos o conexión con Firebase', 'error');
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // Compute cloud-synced vs local-only orders
  const cloudIdSet = useMemo(
    () => new Set(cloudPedidos.map((o) => sanitizeOrderId(o.id))),
    [cloudPedidos]
  );

  const localOnlyPedidos = useMemo(() => {
    if (!user) return localPedidos;
    return localPedidos.filter((p) => !cloudIdSet.has(sanitizeOrderId(p.id)));
  }, [user, localPedidos, cloudIdSet]);

  // Active pedidos list: if signed in, combines cloud + unsynced local orders so nothing is ever lost
  const pedidos = useMemo(() => {
    if (!user) return localPedidos;
    return [...cloudPedidos, ...localOnlyPedidos];
  }, [user, localPedidos, cloudPedidos, localOnlyPedidos]);

  const mostrarToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast((prev) => (prev.mensaje === mensaje ? { mensaje: null, tipo: 'success' } : prev));
    }, 3200);
  };

  // Calculate unique suppliers
  const proveedoresUnicos = useMemo(() => {
    const setProv = new Set<string>();
    pedidos.forEach((p) => {
      if (p.proveedor && p.proveedor.trim()) {
        setProv.add(p.proveedor.trim());
      }
    });
    return Array.from(setProv).sort((a, b) => a.localeCompare(b));
  }, [pedidos]);

  // Calculate available months sorted descending (newest first)
  const mesesDisponibles = useMemo(() => {
    const setMeses = new Set<string>();
    pedidos.forEach((p) => {
      if (p.mesPedido && p.mesPedido.trim()) {
        setMeses.add(p.mesPedido.trim());
      }
    });
    return Array.from(setMeses).sort((a, b) => b.localeCompare(a));
  }, [pedidos]);

  // Calculate overall metrics
  const stats: ResumenFinanciero = useMemo(() => {
    let totalVentas = 0;
    let totalSenas = 0;
    let saldoPendiente = 0;
    let totalCosto = 0;
    let pedidosConSaldo = 0;

    pedidos.forEach((p) => {
      const v = Number(p.precioVenta) || 0;
      const s = Number(p.sena) || 0;
      const c = Number(p.precioCosto) || 0;
      const saldo = Math.max(0, v - s);

      totalVentas += v;
      totalSenas += s;
      saldoPendiente += saldo;
      totalCosto += c;
      if (saldo > 0) pedidosConSaldo++;
    });

    const gananciaTotal = totalVentas - totalCosto;
    const margen = totalVentas > 0 ? Math.round((gananciaTotal / totalVentas) * 100) : 0;

    return {
      totalVentas,
      totalSenas,
      saldoPendiente,
      totalCosto,
      gananciaTotal,
      margen,
      cantPedidos: pedidos.length,
      pedidosConSaldo,
    };
  }, [pedidos]);

  // Filtered orders list
  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    return pedidos.filter((p) => {
      // Search matching
      const coincideBusqueda =
        !q ||
        (p.cliente && p.cliente.toLowerCase().includes(q)) ||
        (p.articulo && p.articulo.toLowerCase().includes(q)) ||
        (p.proveedor && p.proveedor.toLowerCase().includes(q)) ||
        (p.mesPedido && formatearMes(p.mesPedido).toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.numero && p.numero.toString().toLowerCase().includes(q)) ||
        (p.notas && p.notas.toLowerCase().includes(q));

      if (!coincideBusqueda) return false;

      // Month matching
      const mesActual = p.mesPedido?.trim() || '';
      if (filtroMes === '__sin_mes__' && mesActual !== '') return false;
      if (filtroMes !== 'todos' && filtroMes !== '__sin_mes__' && mesActual !== filtroMes) {
        return false;
      }

      // Supplier matching
      const provActual = p.proveedor?.trim() || '';
      if (filtroProveedor === '__sin_proveedor__' && provActual !== '') return false;
      if (filtroProveedor !== 'todos' && filtroProveedor !== '__sin_proveedor__' && provActual !== filtroProveedor) {
        return false;
      }

      // Status matching
      if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;

      // Payment matching
      const v = Number(p.precioVenta) || 0;
      const s = Number(p.sena) || 0;
      const saldo = Math.max(0, v - s);

      if (filtroPago === 'pendiente' && saldo <= 0) return false;
      if (filtroPago === 'pagado' && saldo > 0) return false;

      return true;
    });
  }, [pedidos, busqueda, filtroMes, filtroProveedor, filtroEstado, filtroPago]);

  // Reset all active filters
  const handleResetFiltros = () => {
    setBusqueda('');
    setFiltroMes('todos');
    setFiltroProveedor('todos');
    setFiltroEstado('todos');
    setFiltroPago('todos');
  };

  // Firebase Auth & Sync Handlers
  const handleSignInGoogle = async () => {
    setSyncingCloud(true);
    try {
      const loggedUser = await signInWithGoogle();
      mostrarToast(`Conectado como ${loggedUser.displayName || loggedUser.email}`);
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err);
      mostrarToast('No se pudo iniciar sesión con Google', 'error');
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOutFirebase();
      mostrarToast('Sesión cerrada (tus datos locales siguen seguros)');
    } catch {
      mostrarToast('Error al cerrar sesión', 'error');
    }
  };

  const handleUploadLocalToCloud = async () => {
    if (!user || localOnlyPedidos.length === 0) return;
    setSyncingCloud(true);
    try {
      const count = await syncLocalOrdersToCloud(user.uid, localOnlyPedidos);
      mostrarToast(`¡${count} ${count === 1 ? 'pedido subido' : 'pedidos subidos'} a Firebase!`);
    } catch (err) {
      console.error('Error subiendo pedidos a la nube:', err);
      mostrarToast('Error al subir pedidos a Firebase', 'error');
    } finally {
      setSyncingCloud(false);
    }
  };

  // Actions on orders (writes to LocalStorage AND to Firestore when signed in)
  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoPedido) => {
    setLocalPedidos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
    );
    mostrarToast(`Estado actualizado: ${nuevoEstado}`);

    if (user && cloudIdSet.has(sanitizeOrderId(id))) {
      try {
        await updateOrderStatusInCloud(user.uid, id, nuevoEstado);
      } catch (err) {
        console.error('Error actualizando estado en la nube:', err);
        mostrarToast('No se pudo sincronizar el cambio de estado', 'error');
      }
    }
  };

  const handleCompletarPago = async (id: string) => {
    const target = pedidos.find((p) => p.id === id);
    if (!target) return;

    setLocalPedidos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sena: item.precioVenta } : item))
    );
    mostrarToast('¡Pago saldado al 100%!');

    if (user && cloudIdSet.has(sanitizeOrderId(id))) {
      try {
        await updateOrderPaymentInCloud(user.uid, id, target.precioVenta);
      } catch (err) {
        console.error('Error actualizando pago en la nube:', err);
        mostrarToast('No se pudo sincronizar el pago en la nube', 'error');
      }
    }
  };

  const handleCopiarWhatsApp = async (p: Pedido) => {
    const texto = generarMensajeWhatsAppCliente(p);
    const ok = await copiarAlPortapapeles(texto);
    if (ok) {
      mostrarToast(`Resumen de "${p.cliente}" copiado para WhatsApp`);
    } else {
      mostrarToast('No se pudo copiar el texto', 'error');
    }
  };

  const handleEditar = (p: Pedido) => {
    setPedidoAEditar(p);
    setModalPedidoAbierto(true);
  };

  const handleEliminar = (p: Pedido) => {
    setConfirmConfig({
      abierto: true,
      titulo: '¿Eliminar pedido?',
      mensaje: `Se borrará el encargo de "${p.cliente}" (${p.articulo}). Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      esPeligroso: true,
      accion: async () => {
        setLocalPedidos((prev) => prev.filter((item) => item.id !== p.id));
        setConfirmConfig((prev) => ({ ...prev, abierto: false }));
        mostrarToast('Pedido eliminado correctamente');

        if (user && cloudIdSet.has(sanitizeOrderId(p.id))) {
          try {
            await deleteOrderInCloud(user.uid, p.id);
          } catch (err) {
            console.error('Error eliminando pedido en la nube:', err);
            mostrarToast('No se pudo eliminar en Firebase', 'error');
          }
        }
      },
    });
  };

  const handleGuardarPedido = async (pedidoGuardado: Pedido) => {
    if (pedidoAEditar) {
      setLocalPedidos((prev) =>
        prev.map((item) => (item.id === pedidoGuardado.id ? pedidoGuardado : item))
      );
      mostrarToast('Pedido actualizado con éxito');
    } else {
      setLocalPedidos((prev) => [pedidoGuardado, ...prev]);
      mostrarToast('Nuevo pedido registrado en TOLK IMPORTADOS');
    }
    setModalPedidoAbierto(false);
    setPedidoAEditar(null);

    if (user) {
      try {
        const yaEnNube = cloudIdSet.has(sanitizeOrderId(pedidoGuardado.id));
        if (pedidoAEditar && yaEnNube) {
          await updateOrderInCloud(user.uid, pedidoGuardado);
        } else {
          await createOrderInCloud(user.uid, pedidoGuardado);
        }
      } catch (err) {
        console.error('Error guardando pedido en Firebase:', err);
        mostrarToast('Guardado local ok, pero falló la sincronización en Firebase', 'error');
      }
    }
  };

  // Backups and sample loaders
  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (event) => {
      try {
        const datos = JSON.parse(event.target?.result as string);
        if (Array.isArray(datos)) {
          setLocalPedidos(datos);
          mostrarToast(`Se restauraron ${datos.length} pedidos`);
        } else {
          mostrarToast('Formato JSON no válido', 'error');
        }
      } catch {
        mostrarToast('Error al procesar el archivo JSON', 'error');
      }
      e.target.value = '';
    };
    lector.readAsText(archivo);
  };

  const handleExportarCopiaSeguridad = () => {
    const resultado = exportarCopiaSeguridadLocalStorage();
    if (resultado.ok) {
      mostrarToast(
        `Copia de seguridad descargada (${resultado.count} ${resultado.count === 1 ? 'pedido' : 'pedidos'})`
      );
    } else if (resultado.reason === 'empty') {
      mostrarToast('No se encontraron pedidos guardados en LocalStorage', 'error');
    } else {
      mostrarToast('Error al exportar la copia de seguridad', 'error');
    }
  };

  const handleCargarEjemplos = () => {
    setLocalPedidos((prev) => [...PEDIDOS_EJEMPLO, ...prev]);
    mostrarToast('Se agregaron pedidos de prueba');
  };

  const handleLimpiarTodo = () => {
    setConfirmConfig({
      abierto: true,
      titulo: '¿Borrar todos los pedidos locales?',
      mensaje: 'Esta acción vaciará la lista local de pedidos en este dispositivo.',
      textoConfirmar: 'Borrar Todo',
      esPeligroso: true,
      accion: () => {
        setLocalPedidos([]);
        mostrarToast('Todos los pedidos locales han sido eliminados');
        setConfirmConfig((prev) => ({ ...prev, abierto: false }));
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-[#f4f4f6]">
      {/* Top Header */}
      <Header
        pedidos={pedidos}
        onNuevoPedido={() => {
          setPedidoAEditar(null);
          setModalPedidoAbierto(true);
        }}
        onImportarJSON={handleImportarJSON}
        onCargarEjemplos={handleCargarEjemplos}
        onLimpiarTodo={handleLimpiarTodo}
        onAbrirQR={() => setModalQR(true)}
        onMostrarToast={mostrarToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-12">
        {/* Mobile App Banner (Quick tap to install or open QR) */}
        <div className="sm:hidden bg-gradient-to-r from-[#14171c] via-[#1c2026] to-[#14171c] rounded-2xl p-3 border border-[#d4af37]/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">App Móvil TOLK</p>
              <p className="text-[10px] text-slate-400">Guárdala en tu pantalla de inicio</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalQR(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#d4af37] text-[#08090b] font-bold text-xs flex items-center gap-1 active:scale-95 transition"
          >
            <Sparkles className="w-3 h-3 stroke-[2.5]" />
            <span>Instalar</span>
          </button>
        </div>

        {/* Sincronización en la Nube (Firebase Auth + Firestore) */}
        <FirebaseSyncBar
          user={user}
          authReady={authReady}
          syncing={syncingCloud}
          localOnlyCount={localOnlyPedidos.length}
          cloudCount={cloudPedidos.length}
          onSignIn={handleSignInGoogle}
          onSignOut={handleSignOutGoogle}
          onUploadLocal={handleUploadLocalToCloud}
        />

        {/* Botón Temporal de Respaldo Directo desde LocalStorage */}
        <div className="bg-[#14171c] rounded-2xl p-3 sm:px-4 sm:py-3 border border-[#d4af37]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Respaldo Preventivo (LocalStorage)</p>
              <p className="text-[11px] text-slate-400">
                Descarga todos tus pedidos guardados en este dispositivo antes de migrar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportarCopiaSeguridad}
            className="bg-gradient-to-r from-[#f3d06b] via-[#d4af37] to-[#b8860b] hover:from-[#fcebc2] hover:to-[#d4af37] text-[#08090b] font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#d4af37]/20 transition active:scale-95 whitespace-nowrap"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>EXPORTAR COPIA DE SEGURIDAD</span>
          </button>
        </div>

        {/* 1. Dashboard KPI Cards */}
        <DashboardStats stats={stats} />

        {/* 2. Filters & Mode Switcher */}
        <FiltersBar
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          modoVista={modoVista}
          setModoVista={setModoVista}
          proveedoresUnicos={proveedoresUnicos}
          filtroProveedor={filtroProveedor}
          setFiltroProveedor={setFiltroProveedor}
          mesesDisponibles={mesesDisponibles}
          filtroMes={filtroMes}
          setFiltroMes={setFiltroMes}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          filtroPago={filtroPago}
          setFiltroPago={setFiltroPago}
          totalPedidos={pedidos.length}
          pedidosFiltradosCount={pedidosFiltrados.length}
          onResetFiltros={handleResetFiltros}
        />

        {/* 3. Empty State if no orders match */}
        {pedidosFiltrados.length === 0 ? (
          <section className="bg-[#14171c] rounded-3xl border border-[#272c35]/80 py-14 px-4 text-center shadow-xl">
            <div className="w-14 h-14 bg-[#0b0c0e] border border-[#d4af37]/30 text-[#d4af37] rounded-2xl flex items-center justify-center mx-auto mb-3.5">
              <PackageOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">No hay pedidos para mostrar</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Comienza registrando un encargo para TOLK IMPORTADOS o ajusta los filtros de búsqueda.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPedidoAEditar(null);
                  setModalPedidoAbierto(true);
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f3d06b] to-[#b8860b] text-[#08090b] text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Cargar nuevo pedido</span>
              </button>
              {pedidos.length === 0 && (
                <button
                  type="button"
                  onClick={handleCargarEjemplos}
                  className="inline-flex items-center gap-1.5 bg-[#0b0c0e] hover:bg-[#1c2026] text-slate-200 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#272c35] transition"
                >
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Cargar ejemplos</span>
                </button>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* View Mode 1: Lista General (Table for Desktop + Cards for Mobile) */}
            {modoVista === 'lista' && (
              <section className="bg-[#14171c] rounded-3xl border border-[#272c35]/80 shadow-2xl overflow-hidden">
                {/* Desktop View */}
                <div className="hidden lg:block">
                  <OrderTable
                    pedidos={pedidosFiltrados}
                    onCambiarEstado={handleCambiarEstado}
                    onCompletarPago={handleCompletarPago}
                    onCopiarWhatsApp={handleCopiarWhatsApp}
                    onEditar={handleEditar}
                    onEliminar={handleEliminar}
                  />
                </div>

                {/* Mobile & Tablet Card View */}
                <div className="lg:hidden divide-y divide-[#272c35]/70">
                  {pedidosFiltrados.map((p) => (
                    <OrderMobileCard
                      key={p.id}
                      pedido={p}
                      onCambiarEstado={handleCambiarEstado}
                      onCompletarPago={handleCompletarPago}
                      onCopiarWhatsApp={handleCopiarWhatsApp}
                      onEditar={handleEditar}
                      onEliminar={handleEliminar}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* View Mode 2: Por Mes (Ciclos mensuales de pedidos) */}
            {modoVista === 'mes' && (
              <MonthGroupsView
                pedidos={pedidosFiltrados}
                onCambiarEstado={handleCambiarEstado}
                onCompletarPago={handleCompletarPago}
                onCopiarWhatsApp={handleCopiarWhatsApp}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
                onMostrarToast={mostrarToast}
              />
            )}

            {/* View Mode 3: Agrupar por Proveedor */}
            {modoVista === 'proveedor' && (
              <SupplierGroupsView
                pedidos={pedidosFiltrados}
                onCambiarEstado={handleCambiarEstado}
                onCompletarPago={handleCompletarPago}
                onCopiarWhatsApp={handleCopiarWhatsApp}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
                onMostrarToast={mostrarToast}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-[#272c35]/60 mt-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 mb-16 sm:mb-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#d4af37] tracking-wider">TOLK IMPORTADOS</span>
          <span>•</span>
          <span>Sistema Privado de Control y Pedidos</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Datos almacenados de forma segura y privada en este navegador.
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        modoVista={modoVista}
        setModoVista={setModoVista}
        onNuevoPedido={() => {
          setPedidoAEditar(null);
          setModalPedidoAbierto(true);
        }}
        onAbrirQR={() => setModalQR(true)}
        onExportarExcel={() => {
          if (pedidos.length === 0) {
            mostrarToast('No hay pedidos para exportar', 'error');
            return;
          }
          exportarCSV(pedidos);
          mostrarToast('Archivo Excel descargado');
        }}
      />

      {/* Modals */}
      <OrderModal
        abierto={modalPedidoAbierto}
        pedidoAEditar={pedidoAEditar}
        proveedoresSugeridos={proveedoresUnicos}
        onCerrar={() => {
          setModalPedidoAbierto(false);
          setPedidoAEditar(null);
        }}
        onGuardar={handleGuardarPedido}
      />

      <QRCodeModal
        abierto={modalQR}
        onCerrar={() => setModalQR(false)}
        onMostrarToast={mostrarToast}
      />

      <ConfirmationModal
        abierto={confirmConfig.abierto}
        titulo={confirmConfig.titulo}
        mensaje={confirmConfig.mensaje}
        textoConfirmar={confirmConfig.textoConfirmar}
        esPeligroso={confirmConfig.esPeligroso}
        onConfirmar={confirmConfig.accion}
        onCancelar={() => setConfirmConfig((prev) => ({ ...prev, abierto: false }))}
      />

      {/* Notifications & Connectivity status */}
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} />
      <OfflineIndicator />
    </div>
  );
}
