import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { SpecialGarmentCard } from './SpecialGarmentCard';
import { ContractBundleManager } from './ContractBundleManager';
import { StickySpecialSaveBar } from './StickySpecialSaveBar';
import { getDefaultTierDiscountRules } from '../../../utils/discountRulesUtils';
import { SpecialPresetBundle } from '../../../types/pricing';

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
  onRequestSave?: () => void;
  isSaving?: boolean;
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
  invalidPriceFields,
  onRequestSave,
  isSaving
}) => {
  // Clean slate: Tab B starts with zero hardcoded presets if empty
  const currentPresets: Record<string, any> = settingsForm.specialPresets || {};
  const presetKeys = Object.keys(currentPresets);

  const effectiveActivePreset = currentPresets[activeSpecialPreset]
    ? activeSpecialPreset
    : (presetKeys[0] || '');
  const activePresetData: Record<string, any> = effectiveActivePreset ? (currentPresets[effectiveActivePreset] || {}) : {};

  // Current bundles for active preset
  const allBundlesMap: Record<string, SpecialPresetBundle[]> = settingsForm.specialPresetBundles || {};
  const currentBundles: SpecialPresetBundle[] = effectiveActivePreset ? (allBundlesMap[effectiveActivePreset] || []) : [];
  const availableGarments = Object.keys(activePresetData);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<string | null>(null);

  const handleCreatePreset = () => {
    const name = newPresetNameInput.trim();
    if (!name) return;
    if (currentPresets[name]) {
      alert("Ya existe un tarifario especial con este nombre.");
      return;
    }

    const updated = { ...currentPresets, [name]: {} };
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
  };

  const handleDeletePreset = (presetToDelete: string) => {
    const updatedPresets = { ...currentPresets };
    delete updatedPresets[presetToDelete];

    const updatedServicesMap = { ...(settingsForm.specialPresetServices || {}) };
    delete updatedServicesMap[presetToDelete];

    const updatedIncludedMap = { ...(settingsForm.specialPresetIncludedServices || {}) };
    delete updatedIncludedMap[presetToDelete];

    const updatedBundlesMap = { ...(settingsForm.specialPresetBundles || {}) };
    delete updatedBundlesMap[presetToDelete];

    const updatedTierDiscounts = { ...(settingsForm.discountRulesByTier || {}) };
    delete updatedTierDiscounts[presetToDelete];

    const updatedDiscountsMap = { ...(settingsForm.specialPresetDiscounts || {}) };
    delete updatedDiscountsMap[presetToDelete];

    setSettingsForm((p: any) => ({
      ...p,
      specialPresets: updatedPresets,
      specialPresetServices: updatedServicesMap,
      specialPresetIncludedServices: updatedIncludedMap,
      specialPresetBundles: updatedBundlesMap,
      discountRulesByTier: updatedTierDiscounts,
      specialPresetDiscounts: updatedDiscountsMap
    }));

    const nextPreset = Object.keys(updatedPresets)[0] || '';
    setActiveSpecialPreset(nextPreset);
    setConfirmDeleteModal(null);
    setConfirmDeletePreset(null);
  };

  const handleAddGarmentToActivePreset = () => {
    const gName = newPresetInput.trim();
    if (!gName || !effectiveActivePreset) return;
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
  };

  // Bundle handlers
  const handleAddNewBundle = () => {
    if (!effectiveActivePreset) return;
    const newBundle: SpecialPresetBundle = {
      id: `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `Nuevo Paquete ${currentBundles.length + 1}`,
      garments: []
    };
    const updatedBundlesMap = {
      ...allBundlesMap,
      [effectiveActivePreset]: [...currentBundles, newBundle]
    };
    setSettingsForm((p: any) => ({
      ...p,
      specialPresetBundles: updatedBundlesMap
    }));
  };

  const handleUpdateBundleName = (bIdx: number, newName: string) => {
    if (!effectiveActivePreset) return;
    const nextList = currentBundles.map((b, idx) => (idx === bIdx ? { ...b, name: newName } : b));
    setSettingsForm((p: any) => ({
      ...p,
      specialPresetBundles: {
        ...allBundlesMap,
        [effectiveActivePreset]: nextList
      }
    }));
  };

  const handleToggleGarmentInBundle = (bIdx: number, garmentName: string) => {
    if (!effectiveActivePreset) return;
    const nextList = currentBundles.map((b, idx) => {
      if (idx !== bIdx) return b;
      const gList = b.garments || [];
      const updatedGarments = gList.includes(garmentName)
        ? gList.filter(g => g !== garmentName)
        : [...gList, garmentName];
      return { ...b, garments: updatedGarments };
    });
    setSettingsForm((p: any) => ({
      ...p,
      specialPresetBundles: {
        ...allBundlesMap,
        [effectiveActivePreset]: nextList
      }
    }));
  };

  const handleDeleteBundle = (bIdx: number) => {
    if (!effectiveActivePreset) return;
    const nextList = currentBundles.filter((_, idx) => idx !== bIdx);
    setSettingsForm((p: any) => ({
      ...p,
      specialPresetBundles: {
        ...allBundlesMap,
        [effectiveActivePreset]: nextList
      }
    }));
  };

  // 1. Clean Empty State (Zero Hardcoded Presets)
  if (presetKeys.length === 0 && !showAddPresetInput) {
    return (
      <div className="animate-in fade-in space-y-6">
        <div className="bg-stone-950 border border-stone-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Plus size={28} />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              No hay Tarifarios Especiales Creados
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-mono">
              Cree convenios comerciales y tarifarios corporativos dedicados por cliente institucional o colegio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPresetInput(true)}
            className="text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} /> Nuevo Tarifario Especial
          </button>
        </div>

        {onRequestSave && <StickySpecialSaveBar onSave={onRequestSave} isSaving={isSaving} />}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">
            Tarifarios Especiales Contratados ({presetKeys.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddPresetInput(!showAddPresetInput)}
            className="text-[10px] font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Plus size={12} /> Nuevo Tarifario Especial
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
                {pKey === 'UDI Especial' && (
                  <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-black">
                    UDI
                  </span>
                )}
              </button>
            ))}
          </div>

          {effectiveActivePreset && (
            <button
              type="button"
              onClick={() => setConfirmDeleteModal(effectiveActivePreset)}
              className="text-[10px] font-black uppercase text-stone-500 hover:text-red-500 border border-stone-800 hover:border-red-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} /> Eliminar {effectiveActivePreset}
            </button>
          )}
        </div>

        {/* Inline form to create new special preset */}
        {showAddPresetInput && (
          <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Crear Nuevo Tarifario Especial
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nombre del Tarifario (Ej. Colegio San Agustín, Fridosa...)"
                value={newPresetNameInput}
                onChange={e => setNewPresetNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreatePreset();
                }}
                className="flex-1 bg-stone-900 border border-stone-800 p-2.5 rounded-xl text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleCreatePreset}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowAddPresetInput(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-3 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {effectiveActivePreset ? (
        <>
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
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddGarmentToActivePreset();
              }}
              className="flex-1 bg-stone-900 border border-stone-800 p-2.5 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddGarmentToActivePreset}
              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus size={12} /> Añadir Prenda
            </button>
          </div>

          {/* Multi-Bundle Manager for Active Preset */}
          <ContractBundleManager
            currentBundles={currentBundles}
            availableGarments={availableGarments}
            activePresetData={activePresetData}
            onAddBundle={handleAddNewBundle}
            onUpdateBundleName={handleUpdateBundleName}
            onToggleGarment={handleToggleGarmentInBundle}
            onDeleteBundle={handleDeleteBundle}
          />
        </>
      ) : null}

      {/* Sticky Bottom Save Bar */}
      {onRequestSave && <StickySpecialSaveBar onSave={onRequestSave} isSaving={isSaving} />}

      {/* Confirmation Modal to Delete Preset */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-black text-white uppercase tracking-tight text-center">
              ¿Eliminar Tarifario Especial?
            </h3>
            <p className="text-xs text-stone-400 text-center leading-relaxed">
              Se eliminará <strong className="text-amber-400">{confirmDeleteModal}</strong> con todas sus prendas,
              servicios vinculados y paquetes asociados.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="flex-1 bg-stone-800 text-stone-300 font-bold py-2.5 rounded-xl text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePreset(confirmDeleteModal)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-xs uppercase"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
