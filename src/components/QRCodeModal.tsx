import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { copiarAlPortapapeles } from '../utils/helpers';

interface QRCodeModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onMostrarToast: (msg: string, tipo?: 'success' | 'error') => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  abierto,
  onCerrar,
  onMostrarToast,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [urlApp, setUrlApp] = useState<string>('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    // Determine current public URL
    const url = window.location.origin && window.location.origin !== 'null'
      ? window.location.href
      : 'https://ais-pre-qv2kys5eavaora6g4fskax-424367485692.us-west1.run.app';

    setUrlApp(url);

    QRCode.toDataURL(url, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#08090b',
        light: '#fbf3d5',
      },
    })
      .then((data) => setQrDataUrl(data))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [abierto]);

  if (!abierto) return null;

  const handleCopiarUrl = async () => {
    const ok = await copiarAlPortapapeles(urlApp);
    if (ok) {
      setCopiado(true);
      onMostrarToast('¡Enlace de la app copiado!');
      setTimeout(() => setCopiado(false), 2500);
    } else {
      onMostrarToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleCompartirNativo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TOLK IMPORTADOS App',
          text: 'App privada de pedidos y finanzas para TOLK IMPORTADOS',
          url: urlApp,
        });
        onMostrarToast('Compartido con éxito');
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopiarUrl();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs" onClick={onCerrar}></div>

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-[#14171c] text-left shadow-2xl transition-all w-full max-w-md border border-[#d4af37]/40 p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#272c35] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Usar en el Celular</h3>
                <p className="text-[11px] text-slate-400">Escanea con tu cámara o copia el enlace</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1c2026] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-3 bg-gradient-to-br from-[#f7e5a8] via-[#d4af37] to-[#b8860b] rounded-2xl shadow-xl gold-glow-subtle">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR de la App"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl block"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-700 font-bold">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="text-xs text-[#f3d06b] font-semibold mt-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Abre la cámara de tu celular y apunta al código
            </p>
          </div>

          {/* URL & Copy row */}
          <div className="bg-[#0b0c0e] p-2.5 rounded-2xl border border-[#272c35] flex items-center justify-between gap-2">
            <input
              type="text"
              readOnly
              value={urlApp}
              className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopiarUrl}
              className="px-3 py-1.5 rounded-xl bg-[#1c2026] hover:bg-[#272c35] text-xs font-bold text-[#f7e5a8] border border-[#d4af37]/30 flex items-center gap-1 transition active:scale-95"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={handleCompartirNativo}
              className="p-1.5 rounded-xl bg-[#1c2026] hover:bg-[#272c35] text-[#f7e5a8] border border-[#d4af37]/30 transition active:scale-95"
              title="Compartir enlace"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick instructions for Android & iOS */}
          <div className="bg-[#08090b] p-3 rounded-2xl border border-[#272c35] space-y-2 text-[11px] text-slate-300">
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#d4af37]">Android:</span>
              <span>Abre en Chrome, toca los 3 puntos arriba a la derecha y selecciona <strong>"Instalar aplicación"</strong> o "Agregar a pantalla principal".</span>
            </div>
            <div className="border-t border-[#272c35]/60"></div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#d4af37]">iPhone:</span>
              <span>Abre en Safari, toca el botón de <strong>Compartir</strong> (abajo) y elige <strong>"Agregar al inicio"</strong>.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-full py-2.5 rounded-xl bg-[#0b0c0e] hover:bg-[#1c2026] text-slate-300 text-xs font-bold border border-[#272c35] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
