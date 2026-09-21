import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SpecialGarmentCard } from './SpecialGarmentCard';
import { getUdiBundleBreakdown } from '../../../utils/udiPackageUtils';
import { getDefaultTierDiscountRules } from '../../../utils/discountRulesUtils';

export interface SpecialPresetsTabProps {
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  activeSpecialPreset: string;
  setActiveSpecialPreset: (val: string) => void;
  showAddPresetInput: boolean;
  setShowAddPresetInput: (val: boolean) => void;
  newPresetNameInput: string;
  setNewPresetNameInput: (val: string) => void;
  newPresetInput: string;
  setNewPresetInput: (val: string) => void;
  newPresetFabricInputs: Record<string, string>;
  setNewPresetFabricInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  confirmDeletePreset: string | null;
  setConfirmDeletePreset: (val: string | null) => void;
  invalidPriceFields: Set<string>;
}

export const SpecialPresetsTab: React.FC<SpecialPresetsTabProps> = ({
  settingsForm,
  setSettingsForm,
  activeSpecialPreset,
  setActiveSpecialPreset,
  showAddPresetInput,
  setShowAddPresetInput,
  newPresetNameInput,
  setNewPresetNameInput,
  newPresetInput,
  setNewPresetInput,
  newPresetFabricInputs,
  setNewPresetFabricInputs,
  confirmDeletePreset,
  setConfirmDeletePreset,
  invalidPriceFields
}) => {
  const currentPresets = settingsForm.specialPresets || { "UDI Especial": settingsForm.udiPricing || {} };
  const presetKeys = Object.keys(currentPresets);
  const effectiveActivePreset = currentPresets[activeSpecialPreset] ? activeSpecialPreset : (presetKeys[0] || 'UDI Especial');
  const activePresetData = currentPresets[effectiveActivePreset] || {};

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Tarifarios Especiales Contratados</h3>
          <button
            type="button"
            onClick={() => setShowAddPresetInput(!showAddPresetInput)}
            className="text-[10px] font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
          >
            <Plus size={12}/> Nuevo Tarifario Especial
          </button>
        </div>

        {/* Preset Selector Pills & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {presetKeys.map(pKey => (
              <button
                key={pKey}
                type="button"
                onClick={() => setActiveSpecialPreset(pKey)}
                className={`px-3 py-1.5 rounded-xl text-xs uppercase transition-all flex items-center gap-1.5 ${
                  effectiveActivePreset === pKey
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 font-black shadow-sm'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800 font-bold'
                }`}
              >
                {pKey}
                {pKey === 'UDI Especial' && <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-black">UDI</span>}
              </button>
            ))}
          </div>

          {effectiveActivePreset !== 'UDI Especial' && (
            <div>
              {confirmDeletePreset === effectiveActivePreset ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...currentPresets };
                      delete updated[effectiveActivePreset];
                      const updatedServicesMap = { ...(settingsForm.specialPresetServices || {}) };
                      delete updatedServicesMap[effectiveActivePreset];
                      const updatedTierDiscounts = { ...(settingsForm.discountRulesByTier || {}) };
                      delete updatedTierDiscounts[effectiveActivePreset];
                      const updatedDiscountsMap = { ...(settingsForm.specialPresetDiscounts || {}) };
                      delete updatedDiscountsMap[effectiveActivePreset];
                      setSettingsForm((p: any) => ({
                        ...p,
                        specialPresets: updated,
                        specialPresetServices: updatedServicesMap,
                        discountRulesByTier: updatedTierDiscounts,
                        specialPresetDiscounts: updatedDiscountsMap
                      }));
                      setActiveSpecialPreset('UDI Especial');
                      setConfirmDeletePreset(null);
                    }}
                    className="text-[10px] font-black uppercase bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition"
                  >
                    Sí, Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePreset(null)}
                    className="text-[10px] font-bold uppercase bg-stone-800 text-stone-300 px-2.5 py-1 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeletePreset(effectiveActivePreset)}
                  className="text-[10px] font-black uppercase text-stone-500 hover:text-red-500 border border-stone-800 hover:border-red-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 size={12}/> Eliminar {effectiveActivePreset}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline form to create new special preset */}
        {showAddPresetInput && (
          <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Crear Nuevo Tarifario Especial</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nombre del Tarifario (Ej. Colegio San Agustín, Fridosa...)"
                value={newPresetNameInput}
                onChange={e => setNewPresetNameInput(e.target.value)}
                className="flex-1 bg-stone-900 border border-stone-800 p-2.5 rounded-xl text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  const name = newPresetNameInput.trim();
                  if (!name) return;
                  if (currentPresets[name]) {
                    alert("Ya existe un tarifario con este nombre.");
                    return;
                  }
                  const defaultPresetContent = {
                    "Mandil": { "Tornado (Bull Denim)": 0, "Drill de 8oz": 0 },
                    "Filipina": { "Tornado (Bull Denim)": 0, "Drill de 8oz": 0 },
                    "Pantalón": { "Tornado (Bull Denim)": 0, "Drill de 8oz": 0 },
                    "Gorro": { "Drill de 8oz": 0 }
                  };
                  const updated = { ...currentPresets, [name]: defaultPresetContent };
                  const defaultRules = getDefaultTierDiscountRules(name);
                  const updatedTierDiscounts = {
                    ...(settingsForm.discountRulesByTier || {}),
                    [name]: defaultRules
                  };
                  const updatedDiscounts = { 
                    ...(settingsForm.specialPresetDiscounts || {}),
                    [name]: { ...defaultRules }
                  };
                  setSettingsForm((p: any) => ({
                    ...p,
                    specialPresets: updated,
                    discountRulesByTier: updatedTierDiscounts,
                    specialPresetDiscounts: updatedDiscounts
                  }));
                  setActiveSpecialPreset(name);
                  setNewPresetNameInput('');
                  setShowAddPresetInput(false);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowAddPresetInput(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-3 py-2.5 rounded-xl uppercase tracking-wider transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Banner for UDI Bundle */}
      {effectiveActivePreset === 'UDI Especial' && (() => {
        const breakdown = getUdiBundleBreakdown(activePresetData);
        const mP = breakdown.mandil.price;
        const fP = breakdown.filipina.price;
        const pP = breakdown.pantalon.price;
        const gP = breakdown.gorro.price;
        const sumP = breakdown.total;
        return (
          <div className="bg-amber-950/30 border border-amber-500/20 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-amber-200/90 shadow-sm">
            <span className="uppercase tracking-wide">📦 Paquete Completo UDI: Mandil ({mP} Bs) + Filipina ({fP} Bs) + Pantalón ({pP} Bs) + Gorro ({gP} Bs)</span>
            <span className="font-mono font-black text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              Total: {sumP} Bs
            </span>
          </div>
        );
      })()}

      {/* Garment Cards Grid for Active Preset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(activePresetData).map(garment => (
          <SpecialGarmentCard
            key={garment}
            garment={garment}
            effectiveActivePreset={effectiveActivePreset}
            currentPresets={currentPresets}
            activePresetData={activePresetData}
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            newPresetFabricInputs={newPresetFabricInputs}
            setNewPresetFabricInputs={setNewPresetFabricInputs}
            invalidPriceFields={invalidPriceFields}
          />
        ))}
      </div>

      {/* Add garment to preset */}
      <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Añadir nueva prenda a este tarifario..."
          value={newPresetInput}
          onChange={e => setNewPresetInput(e.target.value)}
          className="flex-1 bg-stone-900 border border-stone-800 p-2.5 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500"
        />
        <button
          type="button"
          onClick={() => {
            const gName = newPresetInput.trim();
            if (!gName) return;
            const updatedPresets = { ...currentPresets };
            const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
            if (updatedPresetData[gName]) {
              alert("Esta prenda ya existe en este tarifario.");
              return;
            }
            updatedPresetData[gName] = { "Drill de 8oz": 0 };
            updatedPresets[effectiveActivePreset] = updatedPresetData;

            setSettingsForm((p: any) => ({
              ...p,
              specialPresets: updatedPresets,
              udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing
            }));
            setNewPresetInput('');
          }}
          className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-sm"
        >
          <Plus size={12}/> Añadir Prenda
        </button>
      </div>
    </div>
  );
};
