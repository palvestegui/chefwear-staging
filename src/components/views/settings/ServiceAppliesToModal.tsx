import React from 'react';
import { X, Check, Globe, Layers, Sparkles, Edit3 } from 'lucide-react';
import { normalizeServiceApplicability } from '../../../utils/serviceUtils';

export interface ServiceAppliesToModalProps {
  service: any;
  serviceIndex: number;
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
}

export const ServiceAppliesToModal: React.FC<ServiceAppliesToModalProps> = ({
  service,
  serviceIndex,
  settingsForm,
  setSettingsForm,
  onClose
}) => {
  const standardGarments = Object.keys(settingsForm.garments || {});
  const specialPresets = settingsForm.specialPresets || { "UDI Especial": settingsForm.udiPricing || {} };

  const currentService = normalizeServiceApplicability(
    service,
    standardGarments,
    specialPresets
  );

  const isGlobal = currentService.isGlobal === true;
  const currentStandard = currentService.appliesToStandard || [];
  const currentSpecial = currentService.appliesToSpecial || {};

  const updateService = (updater: (srv: any) => any) => {
    const updatedServices = [...(settingsForm.services || [])];
    const target = updatedServices[serviceIndex] || {};
    const updated = updater({ ...target });
    updatedServices[serviceIndex] = updated;

    setSettingsForm((p: any) => ({
      ...p,
      services: updatedServices
    }));
  };

  const handleToggleGlobal = () => {
    const nextIsGlobal = !isGlobal;
    updateService((srv) => {
      if (nextIsGlobal) {
        return {
          ...srv,
          isGlobal: true,
          garment: 'Global',
          appliesToStandard: [...standardGarments],
          appliesToSpecial: Object.keys(specialPresets).reduce((acc: any, pKey) => {
            acc[pKey] = Object.keys(specialPresets[pKey] || {});
            return acc;
          }, {})
        };
      } else {
        return {
          ...srv,
          isGlobal: false,
          garment: currentStandard[0] || standardGarments[0] || 'Mandil',
          appliesToStandard: [...currentStandard],
          appliesToSpecial: { ...currentSpecial }
        };
      }
    });
  };

  const handleToggleStandardGarment = (garmentName: string) => {
    updateService((srv) => {
      const normalized = normalizeServiceApplicability(srv, standardGarments, specialPresets);
      const list = [...(normalized.appliesToStandard || [])];
      let nextList: string[];
      if (list.includes(garmentName)) {
        nextList = list.filter(g => g !== garmentName);
      } else {
        nextList = [...list, garmentName];
      }

      return {
        ...srv,
        isGlobal: false,
        garment: nextList[0] || '',
        appliesToStandard: nextList,
        appliesToSpecial: normalized.appliesToSpecial || {}
      };
    });
  };

  const handleToggleAllStandard = (select: boolean) => {
    updateService((srv) => {
      const normalized = normalizeServiceApplicability(srv, standardGarments, specialPresets);
      const nextList = select ? [...standardGarments] : [];
      return {
        ...srv,
        isGlobal: false,
        garment: nextList[0] || '',
        appliesToStandard: nextList,
        appliesToSpecial: normalized.appliesToSpecial || {}
      };
    });
  };

  const handleToggleSpecialGarment = (presetKey: string, garmentName: string) => {
    updateService((srv) => {
      const normalized = normalizeServiceApplicability(srv, standardGarments, specialPresets);
      const specialMap = { ...(normalized.appliesToSpecial || {}) };
      const currentList = [...(specialMap[presetKey] || [])];
      
      let nextList: string[];
      if (currentList.includes(garmentName)) {
        nextList = currentList.filter(g => g !== garmentName);
      } else {
        nextList = [...currentList, garmentName];
      }

      specialMap[presetKey] = nextList;

      return {
        ...srv,
        isGlobal: false,
        appliesToStandard: normalized.appliesToStandard || [],
        appliesToSpecial: specialMap
      };
    });
  };

  const handleToggleAllSpecial = (presetKey: string, select: boolean) => {
    updateService((srv) => {
      const normalized = normalizeServiceApplicability(srv, standardGarments, specialPresets);
      const specialMap = { ...(normalized.appliesToSpecial || {}) };
      specialMap[presetKey] = select ? Object.keys(specialPresets[presetKey] || {}) : [];

      return {
        ...srv,
        isGlobal: false,
        appliesToStandard: normalized.appliesToStandard || [],
        appliesToSpecial: specialMap
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex justify-between items-start gap-3 bg-stone-900/60">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <Sparkles size={16} />
              </span>
              <h3 className="font-black text-sm uppercase tracking-wider text-stone-200">
                Prendas Compatibles
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
              <label className="text-xs text-amber-400 font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <Edit3 size={13} className="text-amber-500" /> Servicio:
              </label>
              <input
                type="text"
                value={service.name || ''}
                onChange={(e) => {
                  const newName = e.target.value;
                  updateService((srv) => ({ ...srv, name: newName }));
                }}
                placeholder="Nombre del servicio (Ej. Bordado de Logo, Tiros Cruzados)..."
                className="bg-stone-950 border border-stone-700 hover:border-stone-600 focus:border-amber-500 text-amber-300 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl outline-none transition w-full max-w-md placeholder:text-stone-600 shadow-inner"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 text-xs">
          {/* Global Toggle Option */}
          <div
            onClick={handleToggleGlobal}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              isGlobal
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isGlobal ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-500'}`}>
                <Globe size={18} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider">
                  ⚡ Servicio Global (Todas las Prendas)
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Aplica automáticamente a todos los ítems de Tab A y de todos los Tarifarios Especiales de Tab B.
                </p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs transition ${
              isGlobal ? 'bg-amber-500 border-amber-400 text-stone-950' : 'border-stone-700 bg-stone-950 text-transparent'
            }`}>
              ✓
            </div>
          </div>

          {/* Granular Section (Active when not global) */}
          <div className={`space-y-6 transition-opacity ${isGlobal ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {/* Tab A Section */}
            <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/80 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-amber-500" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-stone-300">
                    Tab A: Prendas Estándar
                  </h4>
                  <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-bold">
                    {currentStandard.length} de {standardGarments.length}
                  </span>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleToggleAllStandard(true)}
                    className="text-amber-400 hover:underline uppercase"
                  >
                    Todas
                  </button>
                  <span className="text-stone-700">|</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAllStandard(false)}
                    className="text-stone-500 hover:text-stone-300 uppercase"
                  >
                    Ninguna
                  </button>
                </div>
              </div>

              {standardGarments.length === 0 ? (
                <p className="text-stone-500 italic text-xs">No hay prendas registradas en Tab A.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {standardGarments.map(gName => {
                    const isSelected = currentStandard.includes(gName);
                    return (
                      <button
                        key={gName}
                        type="button"
                        onClick={() => handleToggleStandardGarment(gName)}
                        className={`px-3 py-2 rounded-xl text-left font-bold transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <span className="truncate">{gName}</span>
                        <span className={`text-[10px] ml-1 font-black ${isSelected ? 'text-amber-400' : 'text-stone-700'}`}>
                          {isSelected ? '✓' : '+'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tab B Section */}
            <div className="space-y-4">
              <h4 className="font-black text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Sparkles size={14} />
                Tab B: Tarifarios Especiales
              </h4>

              {Object.keys(specialPresets).map(presetKey => {
                const presetGarments = Object.keys(specialPresets[presetKey] || {});
                const selectedInPreset = currentSpecial[presetKey] || [];

                return (
                  <div key={presetKey} className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/80 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs uppercase tracking-wider text-stone-300">
                          {presetKey}
                        </span>
                        {presetKey === 'UDI Especial' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-black">
                            UDI
                          </span>
                        )}
                        <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-bold">
                          {selectedInPreset.length} de {presetGarments.length}
                        </span>
                      </div>
                      <div className="flex gap-2 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleToggleAllSpecial(presetKey, true)}
                          className="text-amber-400 hover:underline uppercase"
                        >
                          Todas
                        </button>
                        <span className="text-stone-700">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAllSpecial(presetKey, false)}
                          className="text-stone-500 hover:text-stone-300 uppercase"
                        >
                          Ninguna
                        </button>
                      </div>
                    </div>

                    {presetGarments.length === 0 ? (
                      <p className="text-stone-500 italic text-xs">No hay prendas registradas en este tarifario.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {presetGarments.map(gName => {
                          const isSelected = selectedInPreset.includes(gName);
                          return (
                            <button
                              key={gName}
                              type="button"
                              onClick={() => handleToggleSpecialGarment(presetKey, gName)}
                              className={`px-3 py-2 rounded-xl text-left font-bold transition flex items-center justify-between border ${
                                isSelected
                                  ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                              }`}
                            >
                              <span className="truncate">{gName}</span>
                              <span className={`text-[10px] ml-1 font-black ${isSelected ? 'text-amber-400' : 'text-stone-700'}`}>
                                {isSelected ? '✓' : '+'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/60 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Check size={14} /> Listo
          </button>
        </div>
      </div>
    </div>
  );
};
