import React from 'react';
import { List, Calendar, Building2, Plus, QrCode } from 'lucide-react';
import { ModoVista } from '../types';

interface MobileBottomNavProps {
  modoVista: ModoVista;
  setModoVista: (modo: ModoVista) => void;
  onNuevoPedido: () => void;
  onAbrirQR: () => void;
  onExportarExcel: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  modoVista,
  setModoVista,
  onNuevoPedido,
  onAbrirQR,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08090b]/95 backdrop-blur-lg border-t border-[#272c35] pb-safe px-2 py-1.5 shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around">
        {/* Tab Lista General */}
        <button
          type="button"
          onClick={() => setModoVista('lista')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            modoVista === 'lista'
              ? 'text-[#f3d06b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[10px] font-bold mt-0.5">Pedidos</span>
        </button>

        {/* Tab Por Mes */}
        <button
          type="button"
          onClick={() => setModoVista('mes')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            modoVista === 'mes'
              ? 'text-[#f3d06b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[10px] font-bold mt-0.5">Por Mes</span>
        </button>

        {/* Center Floating Action Button (New Order) */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={onNuevoPedido}
            title="Nuevo Pedido"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e5be49] via-[#d4af37] to-[#f7e5a8] text-[#08090b] flex items-center justify-center shadow-lg shadow-[#d4af37]/35 active:scale-90 transition border border-[#fff0b8]"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab Proveedor */}
        <button
          type="button"
          onClick={() => setModoVista('proveedor')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            modoVista === 'proveedor'
              ? 'text-[#f3d06b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[10px] font-bold mt-0.5">Proveedores</span>
        </button>

        {/* Tab QR Celular */}
        <button
          type="button"
          onClick={onAbrirQR}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-[#d4af37] transition"
        >
          <QrCode className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Celular</span>
        </button>
      </div>
    </nav>
  );
};
