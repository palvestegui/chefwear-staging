import React, { useState } from 'react';
import { ChefHat, AlertTriangle, Copy, Check, ExternalLink, RefreshCw, LogIn } from 'lucide-react';
import { AuthErrorInfo } from '../../types';

interface LoginViewProps {
  onLogin: () => void;
  onBypassLogin: () => void;
  authError: AuthErrorInfo | null;
  onClearError: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBypassLogin, authError, onClearError }) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const domainToCopy = authError?.domain || currentDomain;
  const firebaseSettingsUrl = 'https://console.firebase.google.com/project/azafran-staging/authentication/settings';

  const handleCopyDomain = async () => {
    if (!domainToCopy) return;
    try {
      await navigator.clipboard.writeText(domainToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = domainToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 border-t-4 border-amber-500">
      <div className="bg-stone-900/90 border border-stone-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-center space-y-6 shadow-2xl backdrop-blur-sm">
        {/* Brand Crest */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ChefHat size={32} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black text-amber-500 uppercase tracking-tighter drop-shadow-md">
                AZAFRÁN CHEFWEAR
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40">
                STAGING
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest mt-1">
              Confección de Autor • Sistema de Gestión y Logística
            </p>
          </div>
        </div>

        {/* Diagnostic Card for Firebase unauthorized domain */}
        {authError?.code === 'auth/unauthorized-domain' && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-left space-y-3.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>Dominio No Autorizado en Firebase</span>
            </div>

            <p className="text-stone-300 leading-relaxed text-xs">
              Firebase Authentication requiere que este dominio esté registrado en la lista de dominios autorizados del proyecto <strong className="text-amber-300 font-mono">azafran-staging</strong>:
            </p>

            <div className="bg-stone-950 border border-stone-800 p-2.5 rounded-xl font-mono text-[11px] text-amber-300 select-all flex items-center justify-between gap-2">
              <span className="truncate">{domainToCopy}</span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-sans text-[11px] font-bold transition shrink-0 border border-stone-700 active:scale-95"
                title="Copiar dominio al portapapeles"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] text-stone-400 border-t border-stone-800/80">
              <p className="font-semibold text-stone-300">Pasos para autorizar:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Abre la consola de Firebase en la pestaña de configuración.</li>
                <li>En <strong>Dominios autorizados</strong>, haz clic en <strong>Agregar dominio</strong>.</li>
                <li>Pega <code className="text-amber-300 font-mono text-[10px]">{domainToCopy}</code> (o <code className="text-amber-300 font-mono text-[10px]">run.app</code>) y guarda.</li>
              </ol>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition"
              >
                <span>Abrir Consola de Firebase</span>
                <ExternalLink size={13} />
              </a>
              <button
                type="button"
                onClick={onClearError}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition"
              >
                Cerrar Aviso
              </button>
            </div>
          </div>
        )}

        {/* Generic Auth Error */}
        {authError && authError.code !== 'auth/unauthorized-domain' && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-left space-y-2 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px]">Error de Autenticación</span>
              <button onClick={onClearError} className="text-stone-400 hover:text-stone-200 text-[10px]">Descartar</button>
            </div>
            <p className="text-stone-300 text-xs">{authError.message}</p>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onLogin}
            className="w-full bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-stone-950 font-black py-3.5 px-4 rounded-2xl uppercase tracking-widest text-xs transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            {authError?.code === 'auth/unauthorized-domain' ? (
              <>
                <RefreshCw size={15} />
                <span>Reintentar Inicio de Sesión</span>
              </>
            ) : (
              <>
                <LogIn size={15} />
                <span>Iniciar Sesión con Google</span>
              </>
            )}
          </button>
          
          <div className="pt-3 border-t border-amber-500/30 w-full flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-mono text-center font-bold">
              Ambiente Staging • Acceso Rápido
            </span>
            <button
              type="button"
              onClick={onBypassLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>⚡</span> Entrar como Don Pablo (SuperAdmin)
            </button>
          </div>

          <p className="text-[10px] text-stone-500 font-medium">
            Acceso restringido para el personal de Azafrán Chefwear
          </p>
        </div>
      </div>
    </div>
  );
};
