import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { GarmentServicesSection } from './GarmentServicesSection';

export interface SpecialGarmentCardProps {
  garment: string;
  effectiveActivePreset: string;
  currentPresets: Record<string, any>;
  activePresetData: Record<string, any>;
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  newPresetFabricInputs: Record<string, string>;
  setNewPresetFabricInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  invalidPriceFields: Set<string>;
}

import { BASE_GARMENT_OPTIONS, getInferredBaseFamily } from '../../../utils/specialGarmentUtils';

export { BASE_GARMENT_OPTIONS, getInferredBaseFamily };

export const SpecialGarmentCard: React.FC<SpecialGarmentCardProps> = ({
  garment,
  effectiveActivePreset,
  currentPresets,
  activePresetData,
  settingsForm,
  setSettingsForm,
  newPresetFabricInputs,
  setNewPresetFabricInputs,
  invalidPriceFields
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(garment);
  const [confirmDeleteGarment, setConfirmDeleteGarment] = useState(false);
  const [showServicesConfig, setShowServicesConfig] = useState(false);

  const rawGarmentRecord = activePresetData[garment] || {};
  const currentBaseGarment: string = rawGarmentRecord.baseGarment || getInferredBaseFamily(garment);

  // Fabrics: all keys except 'baseGarment'
  const fabricKeys = Object.keys(rawGarmentRecord).filter(k => k !== 'baseGarment');

  const allServices: any[] = settingsForm.services || [];

  // Filter services compatible with chosen Prenda Base
  const compatibleServices = allServices.filter((srv: any) => {
    if (srv.isGlobal === true) return true;
    if (srv.garment === currentBaseGarment) return true;
    if (Array.isArray(srv.appliesToStandard) && srv.appliesToStandard.includes(currentBaseGarment)) return true;
    return false;
  });

  // Section A: Included Services in Base Price
  const includedServicesMap = settingsForm.specialPresetIncludedServices || {};
  const presetIncluded = includedServicesMap[effectiveActivePreset] || {};
  const garmentIncludedList: string[] = presetIncluded[garment] || [];

  // Section B: Optional Services enabled in sales
  const optionalServicesMap = settingsForm.specialPresetServices || {};
  const presetOptional = optionalServicesMap[effectiveActivePreset] || {};
  const garmentOptionalList: string[] = presetOptional[garment] || [];

  const handleBaseGarmentChange = (newBase: string) => {
    const updatedPresets = { ...currentPresets };
    const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
    const updatedGarment = { ...(updatedPresetData[garment] || {}) };
    updatedGarment.baseGarment = newBase;
    updatedPresetData[garment] = updatedGarment;
    updatedPresets[effectiveActivePreset] = updatedPresetData;

    setSettingsForm((p: any) => ({
      ...p,
      specialPresets: updatedPresets,
      udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing
    }));
  };

  const handleToggleIncluded = (srvName: string) => {
    const updatedIncludedMap = { ...(settingsForm.specialPresetIncludedServices || {}) };
    const updatedPreset = { ...(updatedIncludedMap[effectiveActivePreset] || {}) };
    const currentList = [...(updatedPreset[garment] || [])];

    const nextList = currentList.includes(srvName)
      ? currentList.filter(s => s !== srvName)
      : [...currentList, srvName];

    updatedPreset[garment] = nextList;
    updatedIncludedMap[effectiveActivePreset] = updatedPreset;

    setSettingsForm((p: any) => ({
      ...p,
      specialPresetIncludedServices: updatedIncludedMap
    }));
  };

  const handleToggleOptional = (srvName: string) => {
    const updatedOptionalMap = { ...(settingsForm.specialPresetServices || {}) };
    const updatedPreset = { ...(updatedOptionalMap[effectiveActivePreset] || {}) };
    const currentList = [...(updatedPreset[garment] || [])];

    const nextList = currentList.includes(srvName)
      ? currentList.filter(s => s !== srvName)
      : [...currentList, srvName];

    updatedPreset[garment] = nextList;
    updatedOptionalMap[effectiveActivePreset] = updatedPreset;

    setSettingsForm((p: any) => ({
      ...p,
      specialPresetServices: updatedOptionalMap
    }));
  };

  const handleToggleAllIncluded = (enableAll: boolean) => {
    const updatedIncludedMap = { ...(settingsForm.specialPresetIncludedServices || {}) };
    const updatedPreset = { ...(updatedIncludedMap[effectiveActivePreset] || {}) };

    updatedPreset[garment] = enableAll ? compatibleServices.map(s => s.name) : [];
    updatedIncludedMap[effectiveActivePreset] = updatedPreset;

    setSettingsForm((p: any) => ({
      ...p,
      specialPresetIncludedServices: updatedIncludedMap
    }));
  };

  const handleToggleAllOptional = (enableAll: boolean) => {
    const updatedOptionalMap = { ...(settingsForm.specialPresetServices || {}) };
    const updatedPreset = { ...(updatedOptionalMap[effectiveActivePreset] || {}) };

    updatedPreset[garment] = enableAll ? compatibleServices.map(s => s.name) : [];
    updatedOptionalMap[effectiveActivePreset] = updatedPreset;

    setSettingsForm((p: any) => ({
      ...p,
      specialPresetServices: updatedOptionalMap
    }));
  };

  const handleSaveGarmentName = () => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === garment) {
      setEditedName(garment);
      setIsEditingName(false);
      return;
    }

    const updatedPresets = { ...currentPresets };
    const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };

    if (updatedPresetData[trimmed] && trimmed.toLowerCase() !== garment.toLowerCase()) {
      alert('Ya existe una prenda con este nombre en este tarifario.');
      return;
    }

    const garmentData = updatedPresetData[garment];
    delete updatedPresetData[garment];
    updatedPresetData[trimmed] = garmentData;
    updatedPresets[effectiveActivePreset] = updatedPresetData;

    // Migrate included and optional services maps
    const incMap = { ...(settingsForm.specialPresetIncludedServices || {}) };
    if (incMap[effectiveActivePreset]?.[garment]) {
      incMap[effectiveActivePreset][trimmed] = incMap[effectiveActivePreset][garment];
      delete incMap[effectiveActivePreset][garment];
    }

    const optMap = { ...(settingsForm.specialPresetServices || {}) };
    if (optMap[effectiveActivePreset]?.[garment]) {
      optMap[effectiveActivePreset][trimmed] = optMap[effectiveActivePreset][garment];
      delete optMap[effectiveActivePreset][garment];
    }

    // Update bundles that reference this garment
    const bundlesMap = { ...(settingsForm.specialPresetBundles || {}) };
    if (Array.isArray(bundlesMap[effectiveActivePreset])) {
      bundlesMap[effectiveActivePreset] = bundlesMap[effectiveActivePreset].map((b: any) => ({
        ...b,
        garments: (b.garments || []).map((g: string) => (g === garment ? trimmed : g))
      }));
    }

    setSettingsForm((p: any) => ({
      ...p,
      specialPresets: updatedPresets,
      udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing,
      specialPresetIncludedServices: incMap,
      specialPresetServices: optMap,
      specialPresetBundles: bundlesMap
    }));

    setIsEditingName(false);
  };

  const handleDeleteGarment = () => {
    const updatedPresets = { ...currentPresets };
    const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
    delete updatedPresetData[garment];
    updatedPresets[effectiveActivePreset] = updatedPresetData;

    // Remove from services & bundles maps
    const incMap = { ...(settingsForm.specialPresetIncludedServices || {}) };
    if (incMap[effectiveActivePreset]?.[garment]) {
      delete incMap[effectiveActivePreset][garment];
    }

    const optMap = { ...(settingsForm.specialPresetServices || {}) };
    if (optMap[effectiveActivePreset]?.[garment]) {
      delete optMap[effectiveActivePreset][garment];
    }

    const bundlesMap = { ...(settingsForm.specialPresetBundles || {}) };
    if (Array.isArray(bundlesMap[effectiveActivePreset])) {
      bundlesMap[effectiveActivePreset] = bundlesMap[effectiveActivePreset].map((b: any) => ({
        ...b,
        garments: (b.garments || []).filter((g: string) => g !== garment)
      }));
    }

    setSettingsForm((p: any) => ({
      ...p,
      specialPresets: updatedPresets,
      udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing,
      specialPresetIncludedServices: incMap,
      specialPresetServices: optMap,
      specialPresetBundles: bundlesMap
    }));

    setConfirmDeleteGarment(false);
  };

  return (
    <div className="col-span-1 bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3.5 flex flex-col justify-between">
      <div>
        {/* Header with commercial name & action buttons */}
        <div className="flex justify-between items-center border-b border-stone-900 pb-2.5 min-h-[36px]">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 flex-1 mr-2">
              <input
                type="text"
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveGarmentName();
                  if (e.key === 'Escape') {
                    setEditedName(garment);
                    setIsEditingName(false);
                  }
                }}
                className="bg-stone-900 border border-amber-500/60 px-2.5 py-1 rounded-lg text-xs font-black text-amber-400 outline-none w-full uppercase"
                placeholder="Nombre comercial..."
              />
              <button
                type="button"
                onClick={handleSaveGarmentName}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                title="Guardar nombre"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedName(garment);
                  setIsEditingName(false);
                }}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition"
                title="Cancelar"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs truncate">
                {garment}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditedName(garment);
                  setIsEditingName(true);
                }}
                className="p-1 text-stone-600 hover:text-amber-400 transition rounded"
                title="Editar nombre de la prenda"
              >
                <Edit2 size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1">
            {confirmDeleteGarment ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDeleteGarment}
                  className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded transition"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteGarment(false)}
                  className="bg-stone-800 text-stone-400 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded transition"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteGarment(true)}
                className="p-1 text-stone-600 hover:text-red-500 transition rounded"
                title="Eliminar prenda del tarifario"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Prenda Base Dropdown Selector */}
        <div className="mt-2.5 flex items-center justify-between bg-stone-900/60 px-3 py-1.5 rounded-xl border border-stone-850">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
            Patrón Base:
          </span>
          <select
            value={currentBaseGarment}
            onChange={e => handleBaseGarmentChange(e.target.value)}
            className="bg-stone-950 border border-stone-800 text-amber-400 font-bold text-[10px] rounded-lg px-2 py-1 outline-none uppercase focus:border-amber-500/50"
          >
            {BASE_GARMENT_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="bg-stone-900 text-stone-200">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Fabrics and Pricing list */}
        <div className="flex flex-col gap-2 mt-3">
          {fabricKeys.map(fabric => (
            <div key={fabric} className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-xl border border-stone-800/80">
              <span className="font-bold text-stone-300 text-xs truncate flex-1">{fabric}</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={rawGarmentRecord[fabric]}
                    onChange={e => {
                      const nVal = parseFloat(e.target.value) || 0;
                      const updatedPresets = { ...currentPresets };
                      const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
                      const updatedGarment = { ...(updatedPresetData[garment] || {}) };
                      updatedGarment[fabric] = nVal;
                      updatedPresetData[garment] = updatedGarment;
                      updatedPresets[effectiveActivePreset] = updatedPresetData;

                      setSettingsForm((p: any) => ({
                        ...p,
                        specialPresets: updatedPresets,
                        udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing
                      }));
                    }}
                    className={`bg-stone-950 px-2 py-1 rounded-lg w-20 text-right font-mono font-bold outline-none border text-xs transition-colors ${
                      invalidPriceFields.has(`tabB:${effectiveActivePreset}:${garment}:${fabric}`)
                        ? 'border-red-500/90 bg-red-950/30 text-red-400'
                        : 'border-stone-700 text-amber-400 focus:border-amber-500'
                    }`}
                  />
                  <span className="ml-1 text-[10px] font-mono text-stone-500 font-bold">Bs</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updatedPresets = { ...currentPresets };
                    const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
                    const updatedGarment = { ...(updatedPresetData[garment] || {}) };
                    delete updatedGarment[fabric];
                    updatedPresetData[garment] = updatedGarment;
                    updatedPresets[effectiveActivePreset] = updatedPresetData;

                    setSettingsForm((p: any) => ({
                      ...p,
                      specialPresets: updatedPresets,
                      udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing
                    }));
                  }}
                  className="p-1 text-stone-600 hover:text-red-500 transition"
                  title="Eliminar tela"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add fabric to garment */}
        <div className="pt-2.5 mt-2 border-t border-stone-900 flex gap-1.5 items-center">
          <input
            type="text"
            placeholder="Añadir tela (Ej. Drill de 8oz)..."
            value={newPresetFabricInputs[garment] || ''}
            onChange={e => setNewPresetFabricInputs(prev => ({ ...prev, [garment]: e.target.value }))}
            className="flex-1 bg-stone-900 border border-stone-850 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-stone-200 outline-none focus:border-amber-500/50"
          />
          <button
            type="button"
            onClick={() => {
              const fabricName = (newPresetFabricInputs[garment] || '').trim();
              if (!fabricName) return;
              const updatedPresets = { ...currentPresets };
              const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
              const updatedGarment = { ...(updatedPresetData[garment] || {}) };
              if (updatedGarment[fabricName] !== undefined) {
                alert('Esta tela ya existe para esta prenda.');
                return;
              }
              updatedGarment[fabricName] = 0;
              updatedPresetData[garment] = updatedGarment;
              updatedPresets[effectiveActivePreset] = updatedPresetData;

              setSettingsForm((p: any) => ({
                ...p,
                specialPresets: updatedPresets,
                udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing
              }));
              setNewPresetFabricInputs(prev => ({ ...prev, [garment]: '' }));
            }}
            className="bg-stone-900 hover:bg-stone-800 text-amber-400 p-1.5 rounded-lg border border-stone-800 transition flex items-center justify-center"
            title="Añadir tela a la prenda"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Servicios Adicionales (Tab C) Section Modularized */}
      <GarmentServicesSection
        showServicesConfig={showServicesConfig}
        setShowServicesConfig={setShowServicesConfig}
        compatibleServices={compatibleServices}
        allServicesCount={allServices.length}
        isIncluded={srvName => garmentIncludedList.includes(srvName)}
        isOptional={srvName => garmentOptionalList.includes(srvName)}
        onToggleIncluded={handleToggleIncluded}
        onToggleOptional={handleToggleOptional}
        onToggleAllIncluded={handleToggleAllIncluded}
        onToggleAllOptional={handleToggleAllOptional}
      />
    </div>
  );
};
