import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export interface StickySpecialSaveBarProps {
  onSave: () => void;
  isSaving?: boolean;
}

export const StickySpecialSaveBar: React.FC<StickySpecialSaveBarProps> = ({
  onSave,
  isSaving = false
}) => {
  return (
    <div className="sticky bottom-4 z-40 bg-stone-900/95 backdrop-blur border border-amber-500/40 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Cambios en Tarifarios Especiales y Convenios Corporativos</span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="w-full sm:w-auto px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Guardando...
          </>
        ) : (
          <>
            <CheckCircle2 size={15} /> Guardar Tarifarios Especiales
          </>
        )}
      </button>
    </div>
  );
};
