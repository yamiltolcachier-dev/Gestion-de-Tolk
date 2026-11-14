import React from 'react';
import { User } from 'firebase/auth';
import { Cloud, CloudUpload, LogIn, LogOut, Loader2 } from 'lucide-react';

interface FirebaseSyncBarProps {
  user: User | null;
  authReady: boolean;
  syncing: boolean;
  localOnlyCount: number;
  cloudCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onUploadLocal: () => void;
}

export const FirebaseSyncBar: React.FC<FirebaseSyncBarProps> = ({
  user,
  authReady,
  syncing,
  localOnlyCount,
  cloudCount,
  onSignIn,
  onSignOut,
  onUploadLocal,
}) => {
  if (!authReady) {
    return null;
  }

  return (
    <div className="bg-[#14171c] rounded-2xl p-3 sm:px-4 sm:py-3 border border-[#272c35]/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-lg">
      {user ? (
        <>
          <div className="flex items-center gap-2.5 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Cuenta'}
                className="w-8 h-8 rounded-full border border-[#d4af37]/40 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-white truncate">
                  {user.displayName || user.email}
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Nube activa ({cloudCount})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {localOnlyCount > 0
                  ? `Tienes ${localOnlyCount} ${localOnlyCount === 1 ? 'pedido local aún no subido' : 'pedidos locales aún no subidos'} a tu cuenta.`
                  : 'Sincronizado en tiempo real entre todos tus dispositivos.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {localOnlyCount > 0 && (
              <button
                type="button"
                onClick={onUploadLocal}
                disabled={syncing}
                className="bg-gradient-to-r from-[#f3d06b] via-[#d4af37] to-[#b8860b] hover:from-[#fcebc2] hover:to-[#d4af37] disabled:opacity-60 text-[#08090b] font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#d4af37]/20 transition active:scale-95"
              >
                {syncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>
                  {syncing
                    ? 'Subiendo...'
                    : `Subir ${localOnlyCount} ${localOnlyCount === 1 ? 'local' : 'locales'} a la nube`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="bg-[#0b0c0e] hover:bg-[#1c2026] text-slate-300 hover:text-white border border-[#272c35] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Sincronización en la Nube (Firebase)</p>
              <p className="text-[11px] text-slate-400">
                Conecta tu cuenta de Google para sincronizar pedidos entre celular y PC sin perder tus datos locales.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            disabled={syncing}
            className="bg-[#0b0c0e] hover:bg-[#1c2026] text-[#f7e5a8] border border-[#d4af37]/40 hover:border-[#d4af37] disabled:opacity-60 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
            ) : (
              <LogIn className="w-4 h-4 text-[#d4af37]" />
            )}
            <span>Conectar con Google</span>
          </button>
        </>
      )}
    </div>
  );
};
