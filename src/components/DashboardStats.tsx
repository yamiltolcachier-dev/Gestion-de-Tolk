import React from 'react';
import { ShoppingBag, DollarSign, Clock, Package, TrendingUp } from 'lucide-react';
import { ResumenFinanciero } from '../types';
import { formatearPlata } from '../utils/helpers';

interface DashboardStatsProps {
  stats: ResumenFinanciero;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <section aria-label="Resumen Financiero" className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
      {/* Total Ventas */}
      <div className="bg-[#14171c] rounded-2xl p-3.5 sm:p-5 border border-[#272c35]/80 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Ventas</span>
          <div className="p-1.5 sm:p-2 bg-[#1c2026] text-[#d4af37] rounded-xl border border-[#272c35]">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {formatearPlata(stats.totalVentas)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            {stats.cantPedidos} {stats.cantPedidos === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
      </div>

      {/* Total Señas / Entregado */}
      <div className="bg-[#14171c] rounded-2xl p-3.5 sm:p-5 border border-[#272c35]/80 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Señas / Cobrado</span>
          <div className="p-1.5 sm:p-2 bg-[#d4af37]/10 text-[#d4af37] rounded-xl border border-[#d4af37]/20">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-lg sm:text-2xl font-black text-[#f3d06b] tracking-tight">
            {formatearPlata(stats.totalSenas)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            Dinero recibido
          </p>
        </div>
      </div>

      {/* Saldo a Cobrar */}
      <div className="bg-[#14171c] rounded-2xl p-3.5 sm:p-5 border border-[#272c35]/80 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Saldo a Cobrar</span>
          <div className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-lg sm:text-2xl font-black text-amber-400 tracking-tight">
            {formatearPlata(stats.saldoPendiente)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            {stats.pedidosConSaldo} con saldo restante
          </p>
        </div>
      </div>

      {/* Costo Proveedores */}
      <div className="bg-[#14171c] rounded-2xl p-3.5 sm:p-5 border border-[#272c35]/80 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Costo Proveedor</span>
          <div className="p-1.5 sm:p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="text-lg sm:text-2xl font-black text-slate-200 tracking-tight">
            {formatearPlata(stats.totalCosto)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            Inversión mercadería
          </p>
        </div>
      </div>

      {/* Balance / Ganancia Neta Card (Full width on mobile 2-col span) */}
      <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-[#14171c] via-[#101216] to-[#08090b] text-white rounded-2xl p-3.5 sm:p-5 border border-[#d4af37]/40 gold-border-glow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#d4af37]">Balance Ganancia</span>
          <div className="p-1.5 sm:p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between lg:block">
          <p className={`text-xl sm:text-2xl font-black tracking-tight ${stats.gananciaTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.gananciaTotal >= 0 ? '+' : ''}{formatearPlata(stats.gananciaTotal)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            Margen estimado: <strong className="text-slate-200 font-semibold">{stats.margen}%</strong>
          </p>
        </div>
      </div>
    </section>
  );
};
