import React, { useState } from 'react';
import { Calendar, ChevronDown, MessageSquare, Building2, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';
import {
  formatearPlata,
  formatearMes,
  generarMensajeWhatsAppProveedor,
  copiarAlPortapapeles,
} from '../utils/helpers';
import { OrderTable } from './OrderTable';
import { OrderMobileCard } from './OrderMobileCard';

interface MonthGroupsViewProps {
  pedidos: Pedido[];
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void;
  onCompletarPago: (id: string) => void;
  onCopiarWhatsApp: (p: Pedido) => void;
  onEditar: (p: Pedido) => void;
  onEliminar: (p: Pedido) => void;
  onMostrarToast: (msg: string, tipo?: 'success' | 'error') => void;
}

export const MonthGroupsView: React.FC<MonthGroupsViewProps> = ({
  pedidos,
  onCambiarEstado,
  onCompletarPago,
  onCopiarWhatsApp,
  onEditar,
  onEliminar,
  onMostrarToast,
}) => {
  const [colapsados, setColapsados] = useState<Record<string, boolean>>({});

  const toggleColapso = (mesKey: string) => {
    setColapsados((prev) => ({
      ...prev,
      [mesKey]: !prev[mesKey],
    }));
  };

  // Group orders by month
  const gruposMes = new Map<string, Pedido[]>();
  pedidos.forEach((p) => {
    const mesKey = p.mesPedido && p.mesPedido.trim() ? p.mesPedido.trim() : 'sin-mes';
    if (!gruposMes.has(mesKey)) {
      gruposMes.set(mesKey, []);
    }
    gruposMes.get(mesKey)!.push(p);
  });

  // Sort descending by month (newest months first: e.g. 2026-11, 2026-10)
  const mesesOrdenados = Array.from(gruposMes.keys()).sort((a, b) => {
    if (a === 'sin-mes') return 1;
    if (b === 'sin-mes') return -1;
    return b.localeCompare(a);
  });

  const handleCopiarProveedorDelMes = async (nombreProv: string, itemsMes: Pedido[], mesStr: string) => {
    const itemsProv = itemsMes.filter((p) => (p.proveedor?.trim() || 'Sin proveedor') === nombreProv);
    const texto = generarMensajeWhatsAppProveedor(nombreProv, itemsProv, mesStr);
    const ok = await copiarAlPortapapeles(texto);
    if (ok) {
      onMostrarToast(`Pedido de ${formatearMes(mesStr)} para "${nombreProv}" copiado`);
    } else {
      onMostrarToast('No se pudo copiar el texto', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {mesesOrdenados.map((mesKey) => {
        const items = gruposMes.get(mesKey) || [];
        const estaColapsado = !!colapsados[mesKey];
        const etiquetaMes = mesKey === 'sin-mes' ? 'Sin mes asignado' : formatearMes(mesKey);

        let totalVentaMes = 0;
        let totalCostoMes = 0;
        let totalSenaMes = 0;
        let saldoPendienteMes = 0;
        let pendientesPedir = 0;

        // Group by supplier within this month for wholesale breakdown
        const proveedoresDelMes = new Map<string, Pedido[]>();

        items.forEach((p) => {
          const v = Number(p.precioVenta) || 0;
          const s = Number(p.sena) || 0;
          const c = Number(p.precioCosto) || 0;
          const saldo = Math.max(0, v - s);

          totalVentaMes += v;
          totalSenaMes += s;
          totalCostoMes += c;
          saldoPendienteMes += saldo;
          if (p.estado === 'Pendiente de pedir') pendientesPedir++;

          const prov = p.proveedor && p.proveedor.trim() ? p.proveedor.trim() : 'Sin proveedor';
          if (!proveedoresDelMes.has(prov)) {
            proveedoresDelMes.set(prov, []);
          }
          proveedoresDelMes.get(prov)!.push(p);
        });

        const gananciaMes = totalVentaMes - totalCostoMes;
        const margenMes = totalVentaMes > 0 ? Math.round((gananciaMes / totalVentaMes) * 100) : 0;

        return (
          <div
            key={mesKey}
            className="bg-[#14171c] rounded-3xl border border-[#272c35]/90 shadow-2xl overflow-hidden transition"
          >
            {/* Header of Month Batch */}
            <div
              onClick={() => toggleColapso(mesKey)}
              className="bg-gradient-to-r from-[#08090b] via-[#101216] to-[#14171c] px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 cursor-pointer hover:bg-[#1c2026] transition border-b border-[#272c35]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-2xl bg-[#0b0c0e] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] transition-transform duration-200 ${
                    estaColapsado ? '-rotate-90' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#d4af37]" />
                      <span>{etiquetaMes}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/15 text-[#f3d06b] border border-[#d4af37]/30">
                      {items.length} {items.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                    {pendientesPedir > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {pendientesPedir} por pedir al proveedor
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ciclo de compra y pedidos mensuales • {proveedoresDelMes.size} {proveedoresDelMes.size === 1 ? 'proveedor' : 'proveedores'}
                  </p>
                </div>
              </div>

              {/* Month KPI Badges */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 bg-[#08090b]/90 px-3.5 py-2.5 rounded-2xl border border-[#272c35]">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ventas del Mes
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {formatearPlata(totalVentaMes)}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-[#272c35]"></div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Costo Proveedores
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-300">
                    {formatearPlata(totalCostoMes)}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-[#272c35]"></div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Ganancia ({margenMes}%)
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      gananciaMes >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {gananciaMes >= 0 ? '+' : ''}
                    {formatearPlata(gananciaMes)}
                  </span>
                </div>

                {saldoPendienteMes > 0 && (
                  <>
                    <div className="h-6 w-[1px] bg-[#272c35]"></div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Falta Cobrar
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-400">
                        {formatearPlata(saldoPendienteMes)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {!estaColapsado && (
              <div className="space-y-3">
                {/* Supplier Sub-breakdown chips for this month */}
                <div className="px-4 sm:px-6 pt-3 pb-1 flex flex-wrap items-center gap-2 border-b border-[#272c35]/50 bg-[#101216]">
                  <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    Proveedores en {etiquetaMes}:
                  </span>
                  {Array.from(proveedoresDelMes.entries()).map(([nombreProv, lista]) => {
                    const costoProv = lista.reduce((acc, curr) => acc + (Number(curr.precioCosto) || 0), 0);
                    return (
                      <div
                        key={nombreProv}
                        className="bg-[#0b0c0e] border border-[#272c35] rounded-xl px-2.5 py-1 text-xs flex items-center gap-2 text-slate-200"
                      >
                        <span className="font-semibold text-[#f7e5a8]">{nombreProv}</span>
                        <span className="text-[11px] text-slate-400">
                          ({lista.length} u. • {formatearPlata(costoProv)})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopiarProveedorDelMes(nombreProv, items, mesKey)}
                          title="Copiar lista de compras de este proveedor en este mes para WhatsApp"
                          className="text-[#d4af37] hover:text-[#faeaad] p-0.5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <OrderTable
                    pedidos={items}
                    onCambiarEstado={onCambiarEstado}
                    onCompletarPago={onCompletarPago}
                    onCopiarWhatsApp={onCopiarWhatsApp}
                    onEditar={onEditar}
                    onEliminar={onEliminar}
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
