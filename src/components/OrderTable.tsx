import React from 'react';
import { DollarSign, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';
import { formatearPlata, obtenerBadgeEstado, formatearMes } from '../utils/helpers';

interface OrderTableProps {
  pedidos: Pedido[];
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void;
  onCompletarPago: (id: string) => void;
  onCopiarWhatsApp: (p: Pedido) => void;
  onEditar: (p: Pedido) => void;
  onEliminar: (p: Pedido) => void;
  ocultarColumnaProveedor?: boolean;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  pedidos,
  onCambiarEstado,
  onCompletarPago,
  onCopiarWhatsApp,
  onEditar,
  onEliminar,
  ocultarColumnaProveedor = false,
}) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#0b0c0e]/90 border-b border-[#272c35] text-[11px] font-bold uppercase tracking-wider text-[#f3d06b]">
            <th className="py-3.5 px-4">Cliente / Campaña</th>
            <th className="py-3.5 px-4">Artículo</th>
            <th className="py-3.5 px-3 text-center">Nro / Talle</th>
            <th className="py-3.5 px-3">Color</th>
            {!ocultarColumnaProveedor && <th className="py-3.5 px-4">Proveedor</th>}
            <th className="py-3.5 px-4 text-right">Precio Venta</th>
            <th className="py-3.5 px-4 text-right">Seña / Entrega</th>
            <th className="py-3.5 px-4 text-right">Precio Costo</th>
            <th className="py-3.5 px-4 text-right bg-[#08090b]/50">Balance</th>
            <th className="py-3.5 px-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#272c35]/70 text-sm">
          {pedidos.map((p) => {
            const venta = Number(p.precioVenta) || 0;
            const sena = Number(p.sena) || 0;
            const costo = Number(p.precioCosto) || 0;
            const ganancia = venta - costo;
            const saldoRestante = Math.max(0, venta - sena);
            const estaPagado = saldoRestante <= 0;
            const badge = obtenerBadgeEstado(p.estado);

            return (
              <tr key={p.id} className="hover:bg-[#1c2026]/50 transition group">
                {/* Cliente / Estado / Mes */}
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{p.cliente}</span>
                    {p.mesPedido && (
                      <span className="text-[10px] bg-[#d4af37]/10 text-[#f7e5a8] border border-[#d4af37]/25 px-1.5 py-0.5 rounded font-medium">
                        {formatearMes(p.mesPedido)}
                      </span>
                    )}
                  </div>
                  {p.notas && (
                    <div className="text-[11px] text-slate-400 mt-0.5 italic max-w-xs truncate">
                      {p.notas}
                    </div>
                  )}
                  <div className="mt-1.5">
                    <select
                      value={p.estado}
                      onChange={(e) => onCambiarEstado(p.id, e.target.value as EstadoPedido)}
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none bg-[#0b0c0e] ${badge.clase}`}
                    >
                      <option className="bg-[#14171c] text-amber-300" value="Pendiente de pedir">
                        🟡 Pendiente de pedir
                      </option>
                      <option className="bg-[#14171c] text-sky-300" value="Pedido al proveedor">
                        🔵 Pedido al proveedor
                      </option>
                      <option className="bg-[#14171c] text-purple-300" value="Listo para entregar">
                        🟣 Listo para entregar
                      </option>
                      <option className="bg-[#14171c] text-emerald-300" value="Entregado">
                        🟢 Entregado
                      </option>
                    </select>
                  </div>
                </td>

                {/* Artículo */}
                <td className="py-3.5 px-4 align-top font-medium text-slate-200">
                  {p.articulo}
                </td>

                {/* Número / Talle */}
                <td className="py-3.5 px-3 align-top text-center">
                  {p.numero ? (
                    <span className="inline-block bg-[#0b0c0e] text-[#f3d06b] font-bold text-xs px-2.5 py-0.5 rounded-lg border border-[#272c35]">
                      {p.numero}
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>

                {/* Color */}
                <td className="py-3.5 px-3 align-top text-slate-300 text-xs">
                  {p.color || <span className="text-slate-600">-</span>}
                </td>

                {/* Proveedor */}
                {!ocultarColumnaProveedor && (
                  <td className="py-3.5 px-4 align-top">
                    {p.proveedor ? (
                      <span className="text-xs font-semibold text-[#f7e5a8] bg-[#d4af37]/10 border border-[#d4af37]/25 px-2 py-0.5 rounded-md">
                        {p.proveedor}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs italic">Sin asignar</span>
                    )}
                  </td>
                )}

                {/* Precio Venta */}
                <td className="py-3.5 px-4 align-top text-right font-bold text-white">
                  {formatearPlata(venta)}
                </td>

                {/* Seña / Entrega */}
                <td className="py-3.5 px-4 align-top text-right">
                  <div className="font-bold text-[#f3d06b]">{formatearPlata(sena)}</div>
                  {estaPagado ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded mt-0.5">
                      Pagado 100%
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-400 block mt-0.5">
                      Falta: {formatearPlata(saldoRestante)}
                    </span>
                  )}
                </td>

                {/* Precio Costo */}
                <td className="py-3.5 px-4 align-top text-right font-medium text-slate-300">
                  {formatearPlata(costo)}
                </td>

                {/* Balance (Ganancia) */}
                <td className="py-3.5 px-4 align-top text-right bg-[#08090b]/40">
                  <span
                    className={`font-black text-sm ${
                      ganancia >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ganancia >= 0 ? '+' : ''}
                    {formatearPlata(ganancia)}
                  </span>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">
                    Ganancia
                  </span>
                </td>

                {/* Acciones */}
                <td className="py-3.5 px-4 align-top text-center">
                  <div className="flex items-center justify-center gap-1">
                    {!estaPagado && (
                      <button
                        type="button"
                        onClick={() => onCompletarPago(p.id)}
                        title="Completar pago (Saldar 100%)"
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/15 rounded-lg transition"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onCopiarWhatsApp(p)}
                      title="Copiar resumen para WhatsApp"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-[#272c35] rounded-lg transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditar(p)}
                      title="Editar pedido"
                      className="p-1.5 text-[#d4af37] hover:bg-[#d4af37]/15 rounded-lg transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEliminar(p)}
                      title="Eliminar pedido"
                      className="p-1.5 text-rose-400 hover:bg-rose-500/15 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
