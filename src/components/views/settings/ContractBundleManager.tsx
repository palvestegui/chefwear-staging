import React from 'react';
import { Trash2 } from 'lucide-react';
import { SpecialPresetBundle } from '../../../types/pricing';

export interface ContractBundleManagerProps {
  currentBundles: SpecialPresetBundle[];
  availableGarments: string[];
  activePresetData: Record<string, any>;
  onAddBundle: () => void;
  onUpdateBundleName: (index: number, name: string) => void;
  onToggleGarment: (index: number, garment: string) => void;
  onDeleteBundle: (index: number) => void;
}

export const ContractBundleManager: React.FC<ContractBundleManagerProps> = ({
  currentBundles,
  availableGarments,
  activePresetData,
  onAddBundle,
  onUpdateBundleName,
  onToggleGarment,
  onDeleteBundle
}) => {
  // Helper to calculate total price of garments in bundle
  const calculateBundleTotal = (bundleGarments: string[]): number => {
    return bundleGarments.reduce((sum, gName) => {
      const gData = activePresetData[gName];
      if (!gData) return sum;
      // Get first fabric price found
      for (const key of Object.keys(gData)) {
        if (key === 'baseGarment') continue;
        const val = Number(gData[key]);
        if (!isNaN(val) && val > 0) return sum + val;
      }
      return sum;
    }, 0);
  };

  return (
    <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 space-y-4">
      <div className="flex justify-between items-center border-b border-stone-800 pb-2">
        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          📦 Paquetes / Bundles Contratados ({currentBundles.length})
        </span>
        <button
          type="button"
          onClick={onAddBundle}
          className="text-[10px] font-black uppercase bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 px-3 py-1.5 rounded-lg transition"
        >
          + Añadir Paquete
        </button>
      </div>

      {currentBundles.length === 0 ? (
        <p className="text-xs text-stone-500 italic py-2">
          No hay paquetes creados para este convenio. Haga clic en "+ Añadir Paquete" para armar combos (ej. Paquete Cocina, Paquete Bartender).
        </p>
      ) : (
        currentBundles.map((bundle, bIdx) => {
          const bundleTotal = calculateBundleTotal(bundle.garments || []);
          return (
            <div key={bundle.id || bIdx} className="bg-stone-900/60 p-4 rounded-xl border border-stone-850 space-y-3">
              <div className="flex justify-between items-center gap-3">
                <input
                  type="text"
                  value={bundle.name}
                  onChange={e => onUpdateBundleName(bIdx, e.target.value)}
                  placeholder="Nombre del paquete (Ej: Paquete Cocina, Paquete Bartender)..."
                  className="bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-200 outline-none flex-1 uppercase"
                />
                {bundleTotal > 0 && (
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    Total Estimado: Bs{bundleTotal}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteBundle(bIdx)}
                  className="text-stone-500 hover:text-red-400 p-1.5 transition"
                  title="Eliminar paquete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Prendas que componen este paquete:
                </span>
                {availableGarments.length === 0 ? (
                  <p className="text-[10px] text-stone-600 italic">
                    Añada prendas a este tarifario arriba para poder incluirlas en el paquete.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableGarments.map(gName => {
                      const isIncluded = (bundle.garments || []).includes(gName);
                      return (
                        <button
                          key={gName}
                          type="button"
                          onClick={() => onToggleGarment(bIdx, gName)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition border flex items-center gap-1 ${
                            isIncluded
                              ? 'bg-amber-600 text-white border-amber-500'
                              : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
                          }`}
                        >
                          <span>{isIncluded ? '✓' : '+'}</span>
                          <span>{gName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
