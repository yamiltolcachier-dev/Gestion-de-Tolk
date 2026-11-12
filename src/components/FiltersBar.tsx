import React from 'react';
import { Search, X, List, Building2, Filter, RotateCcw, Calendar } from 'lucide-react';
import { FiltroPago, ModoVista } from '../types';
import { formatearMes } from '../utils/helpers';

interface FiltersBarProps {
  busqueda: string;
  setBusqueda: (val: string) => void;
  modoVista: ModoVista;
  setModoVista: (modo: ModoVista) => void;
  proveedoresUnicos: string[];
  filtroProveedor: string;
  setFiltroProveedor: (val: string) => void;
  mesesDisponibles: string[];
  filtroMes: string;
  setFiltroMes: (val: string) => void;
  filtroEstado: string;
  setFiltroEstado: (val: string) => void;
  filtroPago: FiltroPago;
  setFiltroPago: (val: FiltroPago) => void;
  totalPedidos: number;
  pedidosFiltradosCount: number;
  onResetFiltros: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  busqueda,
  setBusqueda,
  modoVista,
  setModoVista,
  proveedoresUnicos,
  filtroProveedor,
  setFiltroProveedor,
  mesesDisponibles,
  filtroMes,
  setFiltroMes,
  filtroEstado,
  setFiltroEstado,
  filtroPago,
  setFiltroPago,
  totalPedidos,
  pedidosFiltradosCount,
  onResetFiltros,
}) => {
  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    filtroProveedor !== 'todos' ||
    filtroMes !== 'todos' ||
    filtroEstado !== 'todos' ||
    filtroPago !== 'todos';

  return (
    <section className="bg-[#14171c] rounded-2xl p-3 sm:p-4 border border-[#272c35]/80 shadow-lg space-y-3">
      {/* Top search & Mode switcher */}
      <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, artículo, mes, proveedor, talle..."
            className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-[#0b0c0e] border border-[#272c35] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#d4af37]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Switcher Tabs (Lista, Por Mes, Por Proveedor) */}
        <div className="flex bg-[#08090b] p-1 rounded-xl border border-[#272c35] self-start lg:self-auto w-full lg:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setModoVista('lista')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              modoVista === 'lista'
                ? 'bg-gradient-to-r from-[#e5be49] to-[#d4af37] text-[#08090b] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Lista General</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVista('mes')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              modoVista === 'mes'
                ? 'bg-gradient-to-r from-[#e5be49] to-[#d4af37] text-[#08090b] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Por Mes</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVista('proveedor')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              modoVista === 'proveedor'
                ? 'bg-gradient-to-r from-[#e5be49] to-[#d4af37] text-[#08090b] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Por Proveedor</span>
          </button>
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#272c35]/80">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
          <Filter className="w-3 h-3 text-[#d4af37]" />
          <span>Filtros:</span>
        </div>

        {/* Month Filter */}
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="bg-[#0b0c0e] border border-[#272c35] text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#d4af37]"
        >
          <option value="todos">Todos los meses</option>
          {mesesDisponibles.map((m) => (
            <option key={m} value={m}>
              🗓️ {formatearMes(m)}
            </option>
          ))}
          <option value="__sin_mes__">Sin mes asignado</option>
        </select>

        {/* Supplier Filter */}
        <select
          value={filtroProveedor}
          onChange={(e) => setFiltroProveedor(e.target.value)}
          className="bg-[#0b0c0e] border border-[#272c35] text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#d4af37]"
        >
          <option value="todos">Todos los proveedores</option>
          {proveedoresUnicos.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
          <option value="__sin_proveedor__">Sin proveedor asignado</option>
        </select>

        {/* Status Filter */}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-[#0b0c0e] border border-[#272c35] text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#d4af37]"
        >
          <option value="todos">Todos los estados</option>
          <option value="Pendiente de pedir">🟡 Pendiente de pedir</option>
          <option value="Pedido al proveedor">🔵 Pedido al proveedor</option>
          <option value="Listo para entregar">🟣 Listo para entregar</option>
          <option value="Entregado">🟢 Entregado</option>
        </select>

        {/* Payment Filter */}
        <select
          value={filtroPago}
          onChange={(e) => setFiltroPago(e.target.value as FiltroPago)}
          className="bg-[#0b0c0e] border border-[#272c35] text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#d4af37]"
        >
          <option value="todos">Todos los pagos</option>
          <option value="pendiente">Con saldo a cobrar</option>
          <option value="pagado">Pagado 100%</option>
        </select>

        {/* Clear Filters Button */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onResetFiltros}
            className="text-xs text-[#f3d06b] hover:text-[#faeaad] flex items-center gap-1 underline underline-offset-2 ml-auto px-2 py-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar filtros</span>
          </button>
        )}

        <span className="text-[11px] text-slate-500 ml-auto sm:ml-2">
          {pedidosFiltradosCount} de {totalPedidos}
        </span>
      </div>
    </section>
  );
};
