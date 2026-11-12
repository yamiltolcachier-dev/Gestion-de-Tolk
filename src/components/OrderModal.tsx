import React, { useState, useEffect } from 'react';
import { X, Package, Check, Sparkles, Calendar } from 'lucide-react';
import { Pedido, EstadoPedido } from '../types';
import { formatearPlata, generarId, formatearMes, obtenerMesActual } from '../utils/helpers';

interface OrderModalProps {
  abierto: boolean;
  pedidoAEditar: Pedido | null;
  proveedoresSugeridos: string[];
  onCerrar: () => void;
  onGuardar: (pedido: Pedido) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  abierto,
  pedidoAEditar,
  proveedoresSugeridos,
  onCerrar,
  onGuardar,
}) => {
  const [cliente, setCliente] = useState('');
  const [estado, setEstado] = useState<EstadoPedido>('Pendiente de pedir');
  const [mesPedido, setMesPedido] = useState<string>(obtenerMesActual());
  const [articulo, setArticulo] = useState('');
  const [numero, setNumero] = useState('');
  const [color, setColor] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [notas, setNotas] = useState('');
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [sena, setSena] = useState<string>('');
  const [precioCosto, setPrecioCosto] = useState<string>('');

  useEffect(() => {
    if (pedidoAEditar) {
      setCliente(pedidoAEditar.cliente);
      setEstado(pedidoAEditar.estado);
      setMesPedido(pedidoAEditar.mesPedido || obtenerMesActual());
      setArticulo(pedidoAEditar.articulo);
      setNumero(pedidoAEditar.numero || '');
      setColor(pedidoAEditar.color || '');
      setProveedor(pedidoAEditar.proveedor || '');
      setNotas(pedidoAEditar.notas || '');
      setPrecioVenta(pedidoAEditar.precioVenta ? String(pedidoAEditar.precioVenta) : '');
      setSena(pedidoAEditar.sena !== undefined ? String(pedidoAEditar.sena) : '');
      setPrecioCosto(pedidoAEditar.precioCosto ? String(pedidoAEditar.precioCosto) : '');
    } else {
      setCliente('');
      setEstado('Pendiente de pedir');
      setMesPedido(obtenerMesActual());
      setArticulo('');
      setNumero('');
      setColor('');
      setProveedor('');
      setNotas('');
      setPrecioVenta('');
      setSena('');
      setPrecioCosto('');
    }
  }, [pedidoAEditar, abierto]);

  if (!abierto) return null;

  const numVenta = parseFloat(precioVenta) || 0;
  const numSena = parseFloat(sena) || 0;
  const numCosto = parseFloat(precioCosto) || 0;

  const ganancia = numVenta - numCosto;
  const saldoCliente = Math.max(0, numVenta - numSena);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !articulo.trim()) return;

    const nuevoPedido: Pedido = {
      id: pedidoAEditar ? pedidoAEditar.id : generarId(),
      cliente: cliente.trim(),
      estado,
      mesPedido: mesPedido.trim() || obtenerMesActual(),
      articulo: articulo.trim(),
      numero: numero.trim() || undefined,
      color: color.trim() || undefined,
      proveedor: proveedor.trim() || undefined,
      notas: notas.trim() || undefined,
      precioVenta: numVenta,
      sena: numSena,
      precioCosto: numCosto,
      fechaCreacion: pedidoAEditar ? pedidoAEditar.fechaCreacion : new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    onGuardar(nuevoPedido);
  };

  const handleSaldarCompleto = () => {
    setSena(precioVenta);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
        onClick={onCerrar}
      ></div>

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-[#14171c] text-left shadow-2xl transition-all w-full max-w-xl border border-[#d4af37]/40">
          {/* Edit Mode Banner */}
          {pedidoAEditar && (
            <div className="bg-[#d4af37]/15 border-b border-[#d4af37]/30 px-5 py-2 flex items-center gap-2 text-[#f3d06b] text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Modificando pedido existente de {pedidoAEditar.cliente}</span>
            </div>
          )}

          {/* Modal Header */}
          <div className="bg-[#0b0c0e] px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#272c35]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {pedidoAEditar ? 'Editar Pedido' : 'Nuevo Pedido'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {pedidoAEditar
                    ? 'Actualiza los datos del encargo'
                    : 'Carga el encargo y calcula finanzas en tiempo real'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="text-slate-400 hover:text-[#d4af37] p-2 rounded-xl hover:bg-[#1c2026] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Row 1: Cliente, Mes del Pedido & Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ej: Marcos Rossi"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Mes del Pedido *</span>
                </label>
                <input
                  type="month"
                  required
                  value={mesPedido}
                  onChange={(e) => setMesPedido(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37] [color-scheme:dark]"
                />
                <p className="text-[10px] text-[#f3d06b] mt-0.5 font-medium truncate">
                  {formatearMes(mesPedido)}
                </p>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoPedido)}
                  className="w-full px-2.5 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Pendiente de pedir">🟡 Pendiente</option>
                  <option value="Pedido al proveedor">🔵 Pedido</option>
                  <option value="Listo para entregar">🟣 Listo</option>
                  <option value="Entregado">🟢 Entregado</option>
                </select>
              </div>
            </div>

            {/* Row 2: Artículo, Talle y Color */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Artículo *
                </label>
                <input
                  type="text"
                  required
                  value={articulo}
                  onChange={(e) => setArticulo(e.target.value)}
                  placeholder="Ej: Zapatillas Jordan Retro High"
                  className="w-full px-3.5 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Talle / N°
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej: 41 / L"
                  className="w-full px-3 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ej: Negro / Oro"
                  className="w-full px-3 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Row 3: Proveedor & Observaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  list="sugerenciasProveedores"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Ej: Importadora Central"
                  className="w-full px-3.5 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
                <datalist id="sugerenciasProveedores">
                  {proveedoresSugeridos.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Retira en persona / WhatsApp"
                  className="w-full px-3.5 py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Row 4: Financial Calculation Matrix */}
            <div className="bg-[#0b0c0e] p-3.5 sm:p-4 rounded-2xl border border-[#272c35] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Venta */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Precio Venta ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-[#14171c] border border-[#272c35] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Seña / Cobrado */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Seña o Entrega ($)
                    </label>
                    {numVenta > 0 && numSena !== numVenta && (
                      <button
                        type="button"
                        onClick={handleSaldarCompleto}
                        className="text-[10px] text-[#f3d06b] hover:underline"
                      >
                        100% Pagado
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#d4af37] font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sena}
                      onChange={(e) => setSena(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-[#14171c] border border-[#272c35] rounded-xl text-sm font-bold text-[#f3d06b] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Costo */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Precio Costo ($)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-rose-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={precioCosto}
                      onChange={(e) => setPrecioCosto(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-[#14171c] border border-[#272c35] rounded-xl text-sm font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Financial Feedback */}
              <div className="pt-2.5 border-t border-[#272c35] grid grid-cols-2 gap-2.5">
                <div className="bg-[#14171c] p-2.5 rounded-xl border border-[#272c35]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Balance Ganancia
                  </span>
                  <span
                    className={`text-base font-black ${
                      ganancia >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ganancia >= 0 ? '+' : ''}
                    {formatearPlata(ganancia)}
                  </span>
                </div>

                <div className="bg-[#14171c] p-2.5 rounded-xl border border-[#272c35]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Saldo Restante Cliente
                  </span>
                  <span
                    className={`text-base font-black ${
                      saldoCliente <= 0 && numVenta > 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {saldoCliente <= 0 && numVenta > 0
                      ? 'Pagado ($0)'
                      : formatearPlata(saldoCliente)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCerrar}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#272c35] bg-[#0b0c0e] text-slate-300 text-xs sm:text-sm font-semibold hover:bg-[#1c2026] hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f3d06b] via-[#d4af37] to-[#b8860b] text-[#08090b] text-xs sm:text-sm font-extrabold shadow-lg shadow-[#d4af37]/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{pedidoAEditar ? 'Guardar Cambios' : 'Registrar Pedido'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
