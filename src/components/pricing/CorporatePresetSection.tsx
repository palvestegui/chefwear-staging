import React from 'react';
import { Award, Package } from 'lucide-react';
import { SpecialPresetBundle } from '../../types';

export interface CorporatePresetSectionProps {
  corporatePresets: Record<string, Record<string, Record<string, number> | number>> | null;
  bundlesByPreset?: Record<string, SpecialPresetBundle[]>;
  searchQuery?: string;
}

export const CorporatePresetSection: React.FC<CorporatePresetSectionProps> = ({
  corporatePresets,
  bundlesByPreset = {},
  searchQuery = ''
}) => {
  if (!corporatePresets || Object.keys(corporatePresets).length === 0) {
    return null;
  }

  const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const calculateBundleTotal = (bundleGarments: string[], presetGarments: Record<string, any>): number => {
    return bundleGarments.reduce((sum, gName) => {
      const gData = presetGarments[gName];
      if (!gData) return sum;
      if (typeof gData === 'number') return sum + gData;
      for (const key of Object.keys(gData)) {
        if (key === 'baseGarment') continue;
        const val = Number(gData[key]);
        if (!isNaN(val) && val > 0) return sum + val;
      }
      return sum;
    }, 0);
  };

  return (
    <div className="space-y-10 pt-6 border-t border-stone-800">
      {Object.entries(corporatePresets).map(([presetKey, presetData]) => {
        const rawGarments: Record<string, any> = (presetData && typeof presetData === 'object') ? presetData : {};
        const garmentKeys = Object.keys(rawGarments);
        const bundles: SpecialPresetBundle[] = bundlesByPreset[presetKey] || [];

        // Filter garments if searching
        const filteredGarments = garmentKeys.filter(gName => {
          if (tokens.length === 0) return true;
          const gData = rawGarments[gName] || {};
          const fabricKeys = typeof gData === 'object' && gData !== null
            ? Object.keys(gData).filter(k => k !== 'baseGarment')
            : [];
          const combinedText = `${presetKey.toLowerCase()} ${gName.toLowerCase()} ${fabricKeys.join(' ').toLowerCase()}`;
          return tokens.every(token =>
            presetKey.toLowerCase().includes(token) ||
            gName.toLowerCase().includes(token) ||
            fabricKeys.some(f => f.toLowerCase().includes(token)) ||
            combinedText.includes(token)
          );
        });

        // If searching and this preset has no matching garments, skip rendering
        if (tokens.length > 0 && filteredGarments.length === 0) {
          return null;
        }

        return (
          <div key={presetKey} className="space-y-5 animate-in fade-in">
            {/* Header and Controls for Corporate Preset */}
            <div className="bg-stone-950 p-5 md:p-6 rounded-2xl border border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-amber-500 text-sm md:text-base uppercase tracking-wider">
                    {presetKey}
                  </h4>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                    Tarifario Especial Contratado
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-bold mt-1 font-mono">
                  Precios fijos acordados para este cliente o convenio corporativo.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800 shrink-0">
                <Award size={14} className="text-amber-400" />
                <span>Convenio Activo</span>
              </div>
            </div>

            {/* Configured Bundles Banner (if any exist for this preset) */}
            {bundles.length > 0 && (
              <div className="space-y-2">
                {bundles.map((bundle) => {
                  const bTotal = calculateBundleTotal(bundle.garments || [], rawGarments);
                  return (
                    <div
                      key={bundle.id || bundle.name}
                      className="bg-amber-950/30 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-amber-200/90 shadow-sm"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Package size={15} className="text-amber-400 shrink-0" />
                        <span className="uppercase tracking-wide font-black text-white">
                          {bundle.name}:
                        </span>
                        <span className="text-stone-300 font-mono text-[11px]">
                          {bundle.garments && bundle.garments.length > 0
                            ? bundle.garments.join(' + ')
                            : '(Sin prendas seleccionadas)'}
                        </span>
                      </div>
                      {bTotal > 0 && (
                        <span className="font-mono font-black text-amber-400 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-lg shrink-0">
                          Total: Bs{bTotal}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Garment Cards Grid for Active Corporate Preset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGarments.map((garment) => {
                const garmentFabrics = rawGarments[garment] || {};
                const fabricKeys = typeof garmentFabrics === 'object' && garmentFabrics !== null
                  ? Object.keys(garmentFabrics).filter(k => k !== 'baseGarment')
                  : [];

                return (
                  <div key={garment} className="col-span-1 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-stone-900 pb-2">
                      <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs truncate">
                        {garment}
                      </h4>
                      {garmentFabrics.baseGarment && (
                        <span className="text-[9px] font-mono font-bold text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded uppercase">
                          Base: {garmentFabrics.baseGarment}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {fabricKeys.map((fabric) => {
                        const priceValue = typeof garmentFabrics[fabric] === 'number'
                          ? garmentFabrics[fabric]
                          : (typeof garmentFabrics === 'number' ? garmentFabrics : 0);

                        return (
                          <div key={fabric} className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-lg border border-stone-800">
                            <span className="font-bold text-stone-300 text-xs truncate flex-1">
                              {fabric}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="bg-stone-950 px-3 py-1 rounded border border-stone-700 text-amber-500 text-xs font-mono font-bold text-right">
                                <span className="text-[10px] text-stone-500 mr-1">Bs</span>
                                {priceValue}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {fabricKeys.length === 0 && typeof garmentFabrics === 'number' && (
                        <div className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-lg border border-stone-800">
                          <span className="font-bold text-stone-300 text-xs truncate flex-1">
                            Estándar
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="bg-stone-950 px-3 py-1 rounded border border-stone-700 text-amber-500 text-xs font-mono font-bold text-right">
                              <span className="text-[10px] text-stone-500 mr-1">Bs</span>
                              {garmentFabrics}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
