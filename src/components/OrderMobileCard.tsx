import React from 'react';
import { DollarSign, MessageSquare, Edit3, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';
import { formatearPlata, obtenerBadgeEstado, formatearMes } from '../utils/helpers';

interface OrderMobileCardProps {
  pedido: Pedido;
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void;
  onCompletarPago: (id: string) => void;
  onCopiarWhatsApp: (p: Pedido) => void;
  onEditar: (p: Pedido) => void;
  onEliminar: (p: Pedido) => void;
  ocultarProveedor?: boolean;
}

export const OrderMobileCard: React.FC<OrderMobileCardProps> = ({
  pedido: p,
  onCambiarEstado,
  onCompletarPago,
  onCopiarWhatsApp,
  onEditar,
  onEliminar,
  ocultarProveedor = false,
}) => {
  const venta = Number(p.precioVenta) || 0;
  const sena = Number(p.sena) || 0;
  const costo = Number(p.precioCosto) || 0;
  const ganancia = venta - costo;
  const saldoRestante = Math.max(0, venta - sena);
  const estaPagado = saldoRestante <= 0;
  const badge = obtenerBadgeEstado(p.estado);

  return (
    <div className="p-3.5 sm:p-4 space-y-3 bg-[#14171c]/60 hover:bg-[#14171c] transition border-b border-[#272c35]/70 last:border-b-0">
      {/* Top Header of Card */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-white text-base truncate">{p.cliente}</h4>
            {p.mesPedido && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f7e5a8] bg-[#d4af37]/15 border border-[#d4af37]/30 px-1.5 py-0.5 rounded">
                <Calendar className="w-2.5 h-2.5 text-[#d4af37]" />
                {formatearMes(p.mesPedido)}
              </span>
            )}
            {estaPagado && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Pagado
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5 leading-snug">
            {p.articulo}
            {p.numero && (
              <span className="text-[11px] bg-[#0b0c0e] text-[#f3d06b] border border-[#272c35] px-1.5 py-0.5 rounded font-bold ml-1.5 inline-block">
                Talle: {p.numero}
              </span>
            )}
            {p.color && (
              <span className="text-[11px] text-slate-400 ml-1.5 inline-block">
                • {p.color}
              </span>
            )}
          </p>
          {p.notas && (
            <p className="text-[11px] text-slate-400 italic mt-0.5 break-words">
              {p.notas}
            </p>
          )}
        </div>

        {/* Status Dropdown Pill */}
        <select
          value={p.estado}
          onChange={(e) => onCambiarEstado(p.id, e.target.value as EstadoPedido)}
          className={`text-[11px] font-bold px-2 py-1 rounded-full border focus:outline-none bg-[#0b0c0e] ${badge.clase}`}
        >
          <option className="bg-[#14171c]" value="Pendiente de pedir">
            🟡 Pendiente
          </option>
          <option className="bg-[#14171c]" value="Pedido al proveedor">
            🔵 Pedido
          </option>
          <option className="bg-[#14171c]" value="Listo para entregar">
            🟣 Listo
          </option>
          <option className="bg-[#14171c]" value="Entregado">
            🟢 Entregado
          </option>
        </select>
      </div>

      {/* Supplier Tag if not hidden */}
      {!ocultarProveedor && p.proveedor && (
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="font-semibold text-slate-500 text-[11px]">Proveedor:</span>
          <span className="bg-[#d4af37]/10 border border-[#d4af37]/25 px-2 py-0.5 rounded text-[#f7e5a8] text-[11px] font-semibold">
            {p.proveedor}
          </span>
        </div>
      )}

      {/* Financial Matrix (Mobile Grid 4 boxes) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0b0c0e] p-2.5 rounded-xl border border-[#272c35] text-xs">
        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Precio Venta</span>
          <span className="font-bold text-white text-sm">{formatearPlata(venta)}</span>
        </div>

        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Seña / Cobrado</span>
          <span className="font-bold text-[#f3d06b] text-sm">{formatearPlata(sena)}</span>
          {!estaPagado && (
            <span className="block text-[10px] font-bold text-amber-400 mt-0.5">
              Resta: {formatearPlata(saldoRestante)}
            </span>
          )}
        </div>

        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Costo Proveedor</span>
          <span className="font-medium text-slate-300 text-sm">{formatearPlata(costo)}</span>
        </div>

        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Balance Ganancia</span>
          <span
            className={`font-black text-sm ${
              ganancia >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {ganancia >= 0 ? '+' : ''}
            {formatearPlata(ganancia)}
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
        {!estaPagado && (
          <button
            type="button"
            onClick={() => onCompletarPago(p.id)}
            className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Saldar 100%</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onCopiarWhatsApp(p)}
          className="px-2.5 py-1.5 bg-[#1c2026] hover:bg-[#272c35] text-slate-200 border border-[#272c35] rounded-xl text-xs font-medium flex items-center gap-1 active:scale-95 transition"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => onEditar(p)}
          className="px-2.5 py-1.5 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#f7e5a8] border border-[#d4af37]/30 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Editar</span>
        </button>

        <button
          type="button"
          onClick={() => onEliminar(p)}
          className="p-1.5 text-rose-400 hover:bg-rose-500/15 rounded-xl border border-transparent hover:border-rose-500/30 active:scale-95 transition"
          title="Eliminar pedido"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
