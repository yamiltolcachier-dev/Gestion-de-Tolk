import React, { useState } from 'react';
import { ChevronDown, MessageSquare, Building2, Package } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';
import { formatearPlata, generarMensajeWhatsAppProveedor, copiarAlPortapapeles } from '../utils/helpers';
import { OrderTable } from './OrderTable';
import { OrderMobileCard } from './OrderMobileCard';

interface SupplierGroupsViewProps {
  pedidos: Pedido[];
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void;
  onCompletarPago: (id: string) => void;
  onCopiarWhatsApp: (p: Pedido) => void;
  onEditar: (p: Pedido) => void;
  onEliminar: (p: Pedido) => void;
  onMostrarToast: (msg: string, tipo?: 'success' | 'error') => void;
}

export const SupplierGroupsView: React.FC<SupplierGroupsViewProps> = ({
  pedidos,
  onCambiarEstado,
  onCompletarPago,
  onCopiarWhatsApp,
  onEditar,
  onEliminar,
  onMostrarToast,
}) => {
  // Map of collapsed state by supplier name
  const [colapsados, setColapsados] = useState<Record<string, boolean>>({});

  const toggleColapso = (nombreProv: string) => {
    setColapsados((prev) => ({
      ...prev,
      [nombreProv]: !prev[nombreProv],
    }));
  };

  // Group orders by supplier
  const grupos = new Map<string, Pedido[]>();
  pedidos.forEach((p) => {
    const prov = p.proveedor && p.proveedor.trim() ? p.proveedor.trim() : 'Sin proveedor asignado';
    if (!grupos.has(prov)) {
      grupos.set(prov, []);
    }
    grupos.get(prov)!.push(p);
  });

  const proveedoresOrdenados = Array.from(grupos.keys()).sort((a, b) => {
    if (a === 'Sin proveedor asignado') return 1;
    if (b === 'Sin proveedor asignado') return -1;
    return a.localeCompare(b);
  });

  const handleCopiarMayorista = async (nombreProv: string, items: Pedido[]) => {
    const texto = generarMensajeWhatsAppProveedor(nombreProv, items);
    const ok = await copiarAlPortapapeles(texto);
    if (ok) {
      onMostrarToast(`Lista mayorista de "${nombreProv}" copiada para WhatsApp`);
    } else {
      onMostrarToast('No se pudo copiar el texto', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {proveedoresOrdenados.map((nombreProv) => {
        const items = grupos.get(nombreProv) || [];
        const estaColapsado = !!colapsados[nombreProv];

        let totalVentaProv = 0;
        let totalCostoProv = 0;
        let pendientesPedir = 0;

        items.forEach((p) => {
          totalVentaProv += Number(p.precioVenta) || 0;
          totalCostoProv += Number(p.precioCosto) || 0;
          if (p.estado === 'Pendiente de pedir') pendientesPedir++;
        });

        const gananciaProv = totalVentaProv - totalCostoProv;

        return (
          <div
            key={nombreProv}
            className="bg-[#14171c] rounded-2xl border border-[#272c35]/90 shadow-xl overflow-hidden transition"
          >
            {/* Group Header */}
            <div
              onClick={() => toggleColapso(nombreProv)}
              className="bg-gradient-to-r from-[#08090b] via-[#101216] to-[#14171c] px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-[#1c2026] transition border-b border-[#272c35]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl bg-[#0b0c0e] border border-[#272c35] flex items-center justify-center text-[#d4af37] transition-transform duration-200 ${
                    estaColapsado ? '-rotate-90' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#d4af37]" />
                      <span>{nombreProv}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/15 text-[#f3d06b] border border-[#d4af37]/30">
                      {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                    </span>
                    {pendientesPedir > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {pendientesPedir} por pedir
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toca para {estaColapsado ? 'expandir' : 'contraer'} los pedidos de este proveedor
                  </p>
                </div>
              </div>

              {/* Wholesale Totals Bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-[#08090b]/80 px-3.5 py-2 rounded-xl border border-[#272c35]">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Costo Proveedor
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-300">
                    {formatearPlata(totalCostoProv)}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-[#272c35]"></div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ventas
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {formatearPlata(totalVentaProv)}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-[#272c35]"></div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Ganancia
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      gananciaProv >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {gananciaProv >= 0 ? '+' : ''}
                    {formatearPlata(gananciaProv)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopiarMayorista(nombreProv, items);
                  }}
                  title="Copiar lista de compras para enviar al proveedor por WhatsApp"
                  className="ml-auto px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Pedido Mayorista</span>
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {!estaColapsado && (
              <div>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <OrderTable
                    pedidos={items}
                    onCambiarEstado={onCambiarEstado}
                    onCompletarPago={onCompletarPago}
                    onCopiarWhatsApp={onCopiarWhatsApp}
                    onEditar={onEditar}
                    onEliminar={onEliminar}
                    ocultarColumnaProveedor={true}
                  />
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden divide-y divide-[#272c35]/70">
                  {items.map((p) => (
                    <OrderMobileCard
                      key={p.id}
                      pedido={p}
                      onCambiarEstado={onCambiarEstado}
                      onCompletarPago={onCompletarPago}
                      onCopiarWhatsApp={onCopiarWhatsApp}
                      onEditar={onEditar}
                      onEliminar={onEliminar}
                      ocultarProveedor={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
