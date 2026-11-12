/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PackageOpen, Plus, Sparkles, Smartphone, Download } from 'lucide-react';
import { Pedido, EstadoPedido, ModoVista, FiltroPago, ResumenFinanciero } from './types';
import {
  STORAGE_KEY,
  PEDIDOS_EJEMPLO,
  copiarAlPortapapeles,
  generarMensajeWhatsAppCliente,
  exportarCSV,
  formatearMes,
} from './utils/helpers';
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
import { Toast } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
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

  // Save to localStorage whenever pedidos change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
    }
  }, [pedidos]);

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

  // Actions on orders
  const handleCambiarEstado = (id: string, nuevoEstado: EstadoPedido) => {
    setPedidos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
    );
    mostrarToast(`Estado actualizado: ${nuevoEstado}`);
  };

  const handleCompletarPago = (id: string) => {
    setPedidos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sena: item.precioVenta } : item))
    );
    mostrarToast('¡Pago saldado al 100%!');
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
      accion: () => {
        setPedidos((prev) => prev.filter((item) => item.id !== p.id));
        mostrarToast('Pedido eliminado correctamente');
        setConfirmConfig((prev) => ({ ...prev, abierto: false }));
      },
    });
  };

  const handleGuardarPedido = (pedidoGuardado: Pedido) => {
    if (pedidoAEditar) {
      setPedidos((prev) =>
        prev.map((item) => (item.id === pedidoGuardado.id ? pedidoGuardado : item))
      );
      mostrarToast('Pedido actualizado con éxito');
    } else {
      setPedidos((prev) => [pedidoGuardado, ...prev]);
      mostrarToast('Nuevo pedido registrado en TOLK IMPORTADOS');
    }
    setModalPedidoAbierto(false);
    setPedidoAEditar(null);
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
          setPedidos(datos);
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

  const handleCargarEjemplos = () => {
    setPedidos((prev) => [...PEDIDOS_EJEMPLO, ...prev]);
    mostrarToast('Se agregaron pedidos de prueba');
  };

  const handleLimpiarTodo = () => {
    setConfirmConfig({
      abierto: true,
      titulo: '¿Borrar todos los pedidos?',
      mensaje: 'Esta acción vaciará toda la lista de pedidos registrada en este dispositivo.',
      textoConfirmar: 'Borrar Todo',
      esPeligroso: true,
      accion: () => {
        setPedidos([]);
        mostrarToast('Todos los pedidos han sido eliminados');
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
