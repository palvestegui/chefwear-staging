import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { isServiceApplicable, normalizeServiceApplicability } from '../../../utils/serviceUtils';

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

  const allServices: any[] = settingsForm.services || [];
  const standardGarments = Object.keys(settingsForm.garments || {});

  const isServiceAllowed = (srv: any): boolean => {
    return isServiceApplicable(srv, {
      garmentName: garment,
      presetKey: effectiveActivePreset,
      isUdiMode: effectiveActivePreset === 'UDI Especial',
      allStandardGarments: standardGarments,
      allSpecialPresets: currentPresets
    });
  };

  const toggleService = (srvIndex: number) => {
    const updatedServices = [...allServices];
    const srv = normalizeServiceApplicability(updatedServices[srvIndex], standardGarments, currentPresets);
    const specialMap = { ...(srv.appliesToSpecial || {}) };
    const currentList = [...(specialMap[effectiveActivePreset] || [])];

    let nextList: string[];
    if (currentList.includes(garment)) {
      nextList = currentList.filter(g => g !== garment);
    } else {
      nextList = [...currentList, garment];
    }

    specialMap[effectiveActivePreset] = nextList;

    updatedServices[srvIndex] = {
      ...srv,
      isGlobal: false,
      appliesToSpecial: specialMap
    };

    setSettingsForm((p: any) => ({
      ...p,
      services: updatedServices
    }));
  };

  const toggleAllServices = (allowAll: boolean) => {
    const updatedServices = allServices.map(rawSrv => {
      const srv = normalizeServiceApplicability(rawSrv, standardGarments, currentPresets);
      const specialMap = { ...(srv.appliesToSpecial || {}) };
      const currentList = [...(specialMap[effectiveActivePreset] || [])];

      let nextList = currentList;
      if (allowAll) {
        if (!nextList.includes(garment)) nextList.push(garment);
      } else {
        nextList = nextList.filter(g => g !== garment);
      }

      specialMap[effectiveActivePreset] = nextList;

      return {
        ...srv,
        isGlobal: false,
        appliesToSpecial: specialMap
      };
    });

    setSettingsForm((p: any) => ({
      ...p,
      services: updatedServices
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

    // Also update any service mapping referencing the old garment name
    const updatedServices = allServices.map(rawSrv => {
      const srv = normalizeServiceApplicability(rawSrv, standardGarments, currentPresets);
      const specialMap = { ...(srv.appliesToSpecial || {}) };
      if (specialMap[effectiveActivePreset]?.includes(garment)) {
        specialMap[effectiveActivePreset] = specialMap[effectiveActivePreset].map(g => g === garment ? trimmed : g);
      }
      return {
        ...srv,
        appliesToSpecial: specialMap
      };
    });

    setSettingsForm((p: any) => ({
      ...p,
      specialPresets: updatedPresets,
      udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing,
      services: updatedServices
    }));

    setIsEditingName(false);
  };

  const handleDeleteGarment = () => {
    const updatedPresets = { ...currentPresets };
    const updatedPresetData = { ...(updatedPresets[effectiveActivePreset] || {}) };
    delete updatedPresetData[garment];
    updatedPresets[effectiveActivePreset] = updatedPresetData;

    // Remove reference from services
    const updatedServices = allServices.map(rawSrv => {
      const srv = normalizeServiceApplicability(rawSrv, standardGarments, currentPresets);
      const specialMap = { ...(srv.appliesToSpecial || {}) };
      if (specialMap[effectiveActivePreset]?.includes(garment)) {
        specialMap[effectiveActivePreset] = specialMap[effectiveActivePreset].filter(g => g !== garment);
      }
      return {
        ...srv,
        appliesToSpecial: specialMap
      };
    });

    setSettingsForm((p: any) => ({
      ...p,
      specialPresets: updatedPresets,
      udiPricing: effectiveActivePreset === 'UDI Especial' ? updatedPresetData : p.udiPricing,
      services: updatedServices
    }));

    setConfirmDeleteGarment(false);
  };

  const activeServicesCount = allServices.filter(s => isServiceAllowed(s)).length;

  return (
    <div className="col-span-1 bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3.5 flex flex-col justify-between">
      <div>
        {/* Header with garment name & action buttons */}
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
                placeholder="Nombre de la prenda..."
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

        {/* Fabrics and Pricing list */}
        <div className="flex flex-col gap-2 mt-3">
          {Object.keys(activePresetData[garment] || {}).map(fabric => (
            <div key={fabric} className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-xl border border-stone-800/80">
              <span className="font-bold text-stone-300 text-xs truncate flex-1">{fabric}</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={activePresetData[garment][fabric]}
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

      {/* Servicios Adicionales (Tab C) Section */}
      <div className="pt-3 border-t border-stone-900">
        <button
          type="button"
          onClick={() => setShowServicesConfig(!showServicesConfig)}
          className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-amber-400 transition py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className={activeServicesCount > 0 ? 'text-amber-500' : 'text-stone-600'} />
            Servicios Adicionales (Tab C)
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${activeServicesCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-stone-900 text-stone-500'}`}>
              {activeServicesCount} de {allServices.length} activos
            </span>
            {showServicesConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>

        {showServicesConfig && (
          <div className="mt-2.5 p-3 bg-stone-900/90 rounded-xl border border-stone-800 space-y-2.5 animate-in fade-in">
            <div className="flex justify-between items-center pb-1.5 border-b border-stone-800/80">
              <span className="text-[9px] font-bold uppercase text-stone-500 tracking-wider">
                Servicios compatibles con esta prenda:
              </span>
              <div className="flex gap-2 text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => toggleAllServices(true)}
                  className="text-amber-400 hover:underline uppercase"
                >
                  Todos
                </button>
                <span className="text-stone-700">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllServices(false)}
                  className="text-stone-500 hover:text-stone-300 uppercase"
                >
                  Ninguno
                </button>
              </div>
            </div>

            {allServices.length === 0 ? (
              <p className="text-[10px] text-stone-500 italic py-1">
                No hay servicios creados en Tab C.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {allServices.map((srv: any, idx: number) => {
                  const allowed = isServiceAllowed(srv);
                  return (
                    <button
                      key={`${srv.name}-${idx}`}
                      type="button"
                      onClick={() => toggleService(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition border flex items-center gap-1.5 ${
                        allowed
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700 hover:text-stone-400'
                      }`}
                    >
                      <span>{allowed ? '✓' : '+'}</span>
                      <span>{srv.name}</span>
                      {srv.price !== null && srv.price !== undefined && srv.price > 0 && (
                        <span className="opacity-75 font-mono text-[8px]">(Bs{srv.price})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
