import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Plus,
  QrCode,
  Smartphone,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Pedido } from '../types';
import { exportarCSV, exportarJSON } from '../utils/helpers';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  pedidos: Pedido[];
  onNuevoPedido: () => void;
  onImportarJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCargarEjemplos: () => void;
  onLimpiarTodo: () => void;
  onAbrirQR: () => void;
  onMostrarToast: (msg: string, tipo?: 'success' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  pedidos,
  onNuevoPedido,
  onImportarJSON,
  onCargarEjemplos,
  onLimpiarTodo,
  onAbrirQR,
  onMostrarToast,
}) => {
  const [menuRespaldoAbierto, setMenuRespaldoAbierto] = useState(false);
  const [mostrarGuiaIOS, setMostrarGuiaIOS] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Close backup dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuRespaldoAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    if (pedidos.length === 0) {
      onMostrarToast('No hay pedidos para exportar a Excel', 'error');
      return;
    }
    exportarCSV(pedidos);
    onMostrarToast('Archivo Excel (.csv) descargado');
  };

  const handleExportJSON = () => {
    if (pedidos.length === 0) {
      onMostrarToast('No hay pedidos para respaldar', 'error');
      return;
    }
    exportarJSON(pedidos);
    setMenuRespaldoAbierto(false);
    onMostrarToast('Copia de respaldo (.json) descargada');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) onMostrarToast('¡App instalada con éxito!');
    } else if (isIOS) {
      setMostrarGuiaIOS(true);
    } else {
      onAbrirQR();
    }
  };

  return (
    <>
      <header className="bg-[#08090b]/95 backdrop-blur-md text-slate-100 sticky top-0 z-40 border-b border-[#272c35]/80 shadow-2xl pt-safe">
        {/* Fine gold line on top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/80 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 gap-2.5 sm:gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-3">
                {/* Hexagonal TOL-K Logo SVG */}
                <div className="relative flex-shrink-0 w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]">
                  <svg viewBox="0 0 120 132" className="w-11 h-12 sm:w-13 sm:h-14" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="headerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#faeaad" />
                        <stop offset="35%" stopColor="#e5be49" />
                        <stop offset="70%" stopColor="#c9961a" />
                        <stop offset="100%" stopColor="#f3d06b" />
                      </linearGradient>
                      <linearGradient id="headerGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff0b8" />
                        <stop offset="50%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#966909" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="60,5 113,35.5 113,96.5 60,127 7,96.5 7,35.5"
                      fill="#0b0c0e"
                      stroke="url(#headerGoldStroke)"
                      strokeWidth="5.5"
                      strokeLinejoin="miter"
                    />
                    <polygon
                      points="60,12 106.5,39 106.5,93 60,120 13.5,93 13.5,39"
                      fill="none"
                      stroke="url(#headerGoldGrad)"
                      strokeWidth="0.9"
                      opacity="0.45"
                    />
                    <rect x="27" y="42" width="66" height="4.2" rx="1" fill="url(#headerGoldGrad)" />
                    <text
                      x="60"
                      y="75.5"
                      textAnchor="middle"
                      fill="url(#headerGoldGrad)"
                      fontFamily="'Oswald', sans-serif"
                      fontWeight="700"
                      fontSize="27"
                      letterSpacing="1.2"
                    >
                      TOL-K
                    </text>
                    <rect x="27" y="85" width="66" height="4.2" rx="1" fill="url(#headerGoldGrad)" />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-xl font-extrabold tracking-wider gold-text-gradient uppercase">
                      TOLK IMPORTADOS
                    </h1>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest bg-[#d4af37]/15 text-[#f3d06b] border border-[#d4af37]/30">
                      APP
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Gestión de Pedidos & Finanzas</span>
                    <span className="hidden md:inline text-slate-500">• Optimizado para Celular</span>
                  </p>
                </div>
              </div>

              {/* Quick Mobile Action Buttons in Header */}
              <div className="flex sm:hidden items-center gap-1.5">
                <button
                  type="button"
                  onClick={onAbrirQR}
                  title="Abrir en celular"
                  className="p-2 rounded-xl bg-[#14171c] border border-[#272c35] text-[#d4af37] active:scale-95 transition"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNuevoPedido}
                  className="bg-gradient-to-r from-[#e5be49] to-[#b8860b] text-[#08090b] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo</span>
                </button>
              </div>
            </div>

            {/* Desktop Action Group */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Scan / Open on Mobile Phone Button */}
              <button
                type="button"
                onClick={onAbrirQR}
                title="Abrir en celular mediante código QR"
                className="bg-[#14171c] hover:bg-[#1c2026] text-slate-200 border border-[#272c35] hover:border-[#d4af37]/40 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition active:scale-95"
              >
                <Smartphone className="w-4 h-4 text-[#d4af37]" />
                <span>Usar en Celular</span>
              </button>

              {/* Install PWA Button if not already running standalone */}
              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  title="Instalar como App en tu dispositivo"
                  className="bg-[#14171c] hover:bg-[#1c2026] text-[#f7e5a8] border border-[#d4af37]/40 hover:border-[#d4af37] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#e5be49]" />
                  <span>Instalar App</span>
                </button>
              )}

              {/* Export to Excel */}
              <button
                type="button"
                onClick={handleExportCSV}
                title="Descargar tabla compatible con Excel (.csv)"
                className="bg-[#14171c] hover:bg-[#1c2026] text-slate-200 border border-[#272c35] hover:border-[#d4af37]/40 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel</span>
              </button>

              {/* Backup Menu */}
              <div className="relative inline-block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuRespaldoAbierto(!menuRespaldoAbierto)}
                  className="bg-[#14171c] hover:bg-[#1c2026] text-slate-200 border border-[#272c35] hover:border-[#d4af37]/40 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#d4af37]" />
                  <span>Respaldo</span>
                </button>

                {menuRespaldoAbierto && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#14171c] rounded-2xl shadow-2xl border border-[#272c35] py-2 z-50 text-slate-200 text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#1c2026] flex items-center gap-2.5 transition text-slate-200"
                    >
                      <Download className="w-4 h-4 text-[#d4af37]" />
                      <span>Guardar copia (.JSON)</span>
                    </button>

                    <label className="w-full text-left px-4 py-2.5 hover:bg-[#1c2026] flex items-center gap-2.5 cursor-pointer transition text-slate-200">
                      <Upload className="w-4 h-4 text-sky-400" />
                      <span>Restaurar copia (.JSON)</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          onImportarJSON(e);
                          setMenuRespaldoAbierto(false);
                        }}
                      />
                    </label>

                    <div className="border-t border-[#272c35] my-1"></div>

                    <button
                      type="button"
                      onClick={() => {
                        onCargarEjemplos();
                        setMenuRespaldoAbierto(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#1c2026] text-slate-300 hover:text-[#f3d06b] flex items-center gap-2.5 transition"
                    >
                      <RotateCcw className="w-4 h-4 text-[#d4af37]" />
                      <span>Cargar pedidos de prueba</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onLimpiarTodo();
                        setMenuRespaldoAbierto(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 flex items-center gap-2.5 transition text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar todos los pedidos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Main New Order Button */}
              <button
                type="button"
                onClick={onNuevoPedido}
                className="bg-gradient-to-r from-[#f3d06b] via-[#d4af37] to-[#b8860b] hover:from-[#fcebc2] hover:to-[#d4af37] text-[#08090b] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nuevo Pedido</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* iOS Installation Instruction Guide Modal */}
      {mostrarGuiaIOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-[#101216] border border-[#d4af37]/40 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Instalar en iPhone / iPad</h3>
              <p className="text-xs text-slate-400 mt-1">
                Para tener la app en tu pantalla de inicio como una aplicación nativa:
              </p>
            </div>
            <div className="text-left bg-[#08090b] p-3.5 rounded-xl border border-[#272c35] text-xs text-slate-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#d4af37]">1.</span>
                <span>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de Safari.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#d4af37]">2.</span>
                <span>Desplaza hacia abajo y selecciona <strong>"Agregar al inicio"</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#d4af37]">3.</span>
                <span>Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMostrarGuiaIOS(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#08090b] font-bold text-sm shadow transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
