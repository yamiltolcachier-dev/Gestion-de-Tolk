import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  mensaje: string | null;
  tipo: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ mensaje, tipo }) => {
  if (!mensaje) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-none">
      <div className="bg-[#08090b]/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#d4af37]/60 flex items-center gap-3 text-xs sm:text-sm font-semibold backdrop-blur-md">
        {tipo === 'error' ? (
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
        )}
        <span>{mensaje}</span>
      </div>
    </div>
  );
};
