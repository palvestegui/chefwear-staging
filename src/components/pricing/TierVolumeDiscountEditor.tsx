import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { VolumeTierRule } from '../../types/pricing';

export interface TierVolumeDiscountEditorProps {
  activeTier: string;
  volumeDiscountEnabled: boolean;
  volumeTiers: VolumeTierRule[];
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateTiers: (tiers: VolumeTierRule[]) => void;
}

export const TierVolumeDiscountEditor: React.FC<TierVolumeDiscountEditorProps> = ({
  activeTier,
  volumeDiscountEnabled,
  volumeTiers,
  onToggleEnabled,
  onUpdateTiers
}) => {
  const handleAddTier = () => {
    const last = volumeTiers[volumeTiers.length - 1];
    const newMin = last ? last.minQuantity + 6 : 6;
    const newPct = last ? Math.min(25, last.discountPercent + 3) : 3;
    const next = [...volumeTiers, { minQuantity: newMin, discountPercent: newPct }].sort(
      (a, b) => a.minQuantity - b.minQuantity
    );
    onUpdateTiers(next);
  };

  const handleUpdateTier = (index: number, field: keyof VolumeTierRule, val: number) => {
    const next = volumeTiers.map((t, idx) => {
      if (idx !== index) return t;
      return { ...t, [field]: Math.max(0, val) };
    });
    onUpdateTiers(next);
  };

  const handleRemoveTier = (index: number) => {
    onUpdateTiers(volumeTiers.filter((_, idx) => idx !== index));
  };

  return (
    <div className="bg-stone-900/40 p-3.5 rounded-xl border border-stone-800/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-stone-300">
            Descuento Automático por Volumen
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={volumeDiscountEnabled}
            onChange={e => onToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {volumeDiscountEnabled && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-wider text-stone-400 px-1">
            <div className="col-span-6">Desde (Piezas)</div>
            <div className="col-span-4">Descuento %</div>
            <div className="col-span-2 text-right">Acción</div>
          </div>

          {volumeTiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="number"
                min="1"
                value={tier.minQuantity}
                onChange={e => handleUpdateTier(idx, 'minQuantity', parseInt(e.target.value) || 1)}
                className="col-span-6 bg-stone-950 border border-stone-800 p-2 rounded-lg text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={tier.discountPercent}
                onChange={e => handleUpdateTier(idx, 'discountPercent', parseInt(e.target.value) || 0)}
                className="col-span-4 bg-stone-950 border border-stone-800 p-2 rounded-lg text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
              />
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveTier(idx)}
                  className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddTier}
            className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-stone-800 hover:border-amber-500/40 text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-amber-400 transition flex items-center justify-center gap-1.5"
          >
            <Plus size={12} /> Añadir Escala de Volumen
          </button>
        </div>
      )}
    </div>
  );
};
