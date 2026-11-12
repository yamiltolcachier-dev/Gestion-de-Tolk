import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  esPeligroso?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  esPeligroso = false,
  onConfirmar,
  onCancelar,
}) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={onCancelar}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#14171c] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#272c35] text-center space-y-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              esPeligroso
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                : 'bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">{titulo}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{mensaje}</p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#272c35] bg-[#0b0c0e] text-slate-300 text-xs sm:text-sm font-semibold hover:bg-[#1c2026] transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow ${
                esPeligroso
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#08090b]'
              }`}
            >
              {textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
