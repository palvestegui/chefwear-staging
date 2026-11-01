import React from 'react';
import { Link2, Unlink, Scissors } from 'lucide-react';
import { TAILORING_12_POINTS } from '../../utils/contactUtils';

export interface Tailoring12PointsGridProps {
  measurements: Record<string, string | number | undefined>;
  onChangeMeasurements: (updated: Record<string, string>) => void;
  isPantalonWaistOverridden: boolean;
  setIsPantalonWaistOverridden: (val: boolean) => void;
}

export const Tailoring12PointsGrid: React.FC<Tailoring12PointsGridProps> = ({
  measurements,
  onChangeMeasurements,
  isPantalonWaistOverridden,
  setIsPantalonWaistOverridden
}) => {
  const filipinaPoints = TAILORING_12_POINTS.filter((p) => p.group === 'filipina');
  const pantalonPoints = TAILORING_12_POINTS.filter((p) => p.group === 'pantalon');

  const getValue = (key: string, alt: string): string => {
    const val = measurements[key] ?? measurements[alt];
    return val !== undefined && val !== null ? String(val) : '';
  };

  const handlePointChange = (key: string, alt: string, value: string) => {
    const next: Record<string, string> = {};
    // Copy existing string values
    Object.entries(measurements).forEach(([k, v]) => {
      if (v !== undefined && v !== null) next[k] = String(v);
    });

    next[key] = value;
    if (alt) next[alt] = value;

    // Smart Waist Pairing
    if (key === 'F_Cintura' && !isPantalonWaistOverridden) {
      next['P_Cintura'] = value;
    } else if (key === 'P_Cintura') {
      const fVal = getValue('F_Cintura', 'cintura');
      if (value !== fVal) {
        setIsPantalonWaistOverridden(true);
      }
    }

    onChangeMeasurements(next);
  };

  const toggleWaistSync = () => {
    if (isPantalonWaistOverridden) {
      // Re-synchronize
      const fVal = getValue('F_Cintura', 'cintura');
      const next: Record<string, string> = {};
      Object.entries(measurements).forEach(([k, v]) => {
        if (v !== undefined && v !== null) next[k] = String(v);
      });
      next['P_Cintura'] = fVal;
      setIsPantalonWaistOverridden(false);
      onChangeMeasurements(next);
    } else {
      setIsPantalonWaistOverridden(true);
    }
  };

  return (
    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-4">
      {/* Header with Smart Waist Pairing indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Scissors size={14} className="text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
            Matriz de Medidas de Taller (12 Puntos)
          </span>
        </div>

        <button
          type="button"
          onClick={toggleWaistSync}
          title={
            isPantalonWaistOverridden
              ? 'Haga clic para resincronizar la cintura de pantalón con la filipina'
              : 'La cintura de pantalón se actualiza automáticamente con la de filipina'
          }
          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer border ${
            isPantalonWaistOverridden
              ? 'bg-amber-950/40 text-amber-400 border-amber-800/40 hover:bg-amber-900/50'
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50'
          }`}
        >
          {isPantalonWaistOverridden ? (
            <>
              <Unlink size={11} className="text-amber-400" />
              <span>Cintura Desvinculada</span>
            </>
          ) : (
            <>
              <Link2 size={11} className="text-emerald-400" />
              <span>Cintura Sincronizada</span>
            </>
          )}
        </button>
      </div>

      {/* Subgroup A: Filipina (8 Puntos) */}
      <div className="space-y-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 block">
          A. Filipina / Superior (8 Puntos)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {filipinaPoints.map((pt) => {
            const val = getValue(pt.key, pt.alt);
            return (
              <div
                key={pt.key}
                className="bg-stone-900/90 border border-stone-800/90 rounded-xl p-2 flex flex-col justify-between hover:border-stone-700 transition"
              >
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tight truncate block mb-1">
                  {pt.label}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    value={val}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    onChange={(e) => handlePointChange(pt.key, pt.alt, e.target.value)}
                    placeholder="0"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg py-1 px-2 pr-7 text-xs font-mono font-bold text-amber-300 focus:border-amber-500 outline-none"
                  />
                  <span className="absolute right-2 text-[10px] font-mono text-stone-500 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subgroup B: Pantalón (4 Puntos) */}
      <div className="space-y-2 pt-2 border-t border-stone-900">
        <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 block">
          B. Pantalón / Inferior (4 Puntos)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pantalonPoints.map((pt) => {
            const val = getValue(pt.key, pt.alt);
            const isSyncedWaist = pt.key === 'P_Cintura' && !isPantalonWaistOverridden;
            return (
              <div
                key={pt.key}
                className="bg-stone-900/90 border border-stone-800/90 rounded-xl p-2 flex flex-col justify-between hover:border-stone-700 transition"
              >
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tight truncate block mb-1 flex items-center gap-1">
                  {pt.label}
                  {isSyncedWaist && <Link2 size={9} className="text-emerald-400 shrink-0" />}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    value={val}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    onChange={(e) => handlePointChange(pt.key, pt.alt, e.target.value)}
                    placeholder="0"
                    className={`w-full bg-stone-950 border rounded-lg py-1 px-2 pr-7 text-xs font-mono font-bold focus:border-amber-500 outline-none ${
                      isSyncedWaist
                        ? 'border-emerald-800/50 text-emerald-300'
                        : 'border-stone-800 text-amber-300'
                    }`}
                  />
                  <span className="absolute right-2 text-[10px] font-mono text-stone-500 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
