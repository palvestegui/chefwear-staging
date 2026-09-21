import React, { useState, useMemo } from 'react';
import { Plus, Globe, Layers, Search, X, Trash2, Sliders, CheckCircle2 } from 'lucide-react';
import { ServiceAppliesToModal } from './ServiceAppliesToModal';
import { ExclusionGroupsModal } from './ExclusionGroupsModal';
import {
  getApplicabilitySummary,
  DEFAULT_EXCLUSION_GROUPS,
  CATEGORY_FILTERS,
  ServiceCategoryKey,
  matchesCategory,
  normalizeText
} from '../../../utils/serviceUtils';

export interface ServiceItemData {
  name?: string;
  type?: string;
  price?: number | null;
  exclusionGroup?: string;
  isGlobal?: boolean;
  garment?: string;
  appliesToStandard?: string[];
  appliesToSpecial?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface ServicesCatalogTabProps {
  settingsForm: {
    services?: ServiceItemData[];
    exclusionGroups?: string[];
    garments?: Record<string, unknown>;
    specialPresets?: Record<string, Record<string, unknown>>;
    udiPricing?: Record<string, unknown>;
    [key: string]: unknown;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<unknown>>;
}

export const ServicesCatalogTab: React.FC<ServicesCatalogTabProps> = ({
  settingsForm,
  setSettingsForm
}) => {
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<ServiceCategoryKey>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [isExclusionGroupsModalOpen, setIsExclusionGroupsModalOpen] = useState(false);

  const standardGarments = Object.keys(settingsForm.garments || {});
  const specialPresets = (settingsForm.specialPresets || { "UDI Especial": settingsForm.udiPricing || {} }) as Record<string, Record<string, unknown>>;
  const allServices: ServiceItemData[] = settingsForm.services || [];
  const customExclusionGroups = (settingsForm.exclusionGroups || []) as string[];

  const availableExclusionGroups = useMemo(() => {
    const baseGroups = (customExclusionGroups && customExclusionGroups.length > 0)
      ? customExclusionGroups
      : DEFAULT_EXCLUSION_GROUPS;
    const groups = new Set<string>(baseGroups.map(g => g.trim().toUpperCase()).filter(Boolean));
    allServices.forEach(s => {
      if (s.exclusionGroup && typeof s.exclusionGroup === 'string') {
        const trimmed = s.exclusionGroup.trim().toUpperCase();
        if (trimmed) groups.add(trimmed);
      }
    });
    return Array.from(groups).sort();
  }, [allServices, customExclusionGroups]);

  const updateServiceField = (originalIndex: number, field: string, value: unknown) => {
    const updated = [...allServices];
    updated[originalIndex] = {
      ...updated[originalIndex],
      [field]: value
    };
    setSettingsForm((prev: unknown) => {
      const prevObj = (typeof prev === 'object' && prev !== null ? prev : {}) as Record<string, unknown>;
      return { ...prevObj, services: updated };
    });
  };

  const handleUpdateServicesAndGroups = (updatedServices: ServiceItemData[], updatedGroups: string[]) => {
    setSettingsForm((prev: unknown) => {
      const prevObj = (typeof prev === 'object' && prev !== null ? prev : {}) as Record<string, unknown>;
      return {
        ...prevObj,
        services: updatedServices,
        exclusionGroups: updatedGroups
      };
    });
  };

  const handleAddService = () => {
    const newService: ServiceItemData = {
      name: 'Nuevo Servicio Adicional',
      type: 'Costo Adicional',
      price: null,
      exclusionGroup: '',
      isGlobal: true,
      garment: 'Global',
      appliesToStandard: [...standardGarments],
      appliesToSpecial: Object.keys(specialPresets).reduce<Record<string, string[]>>((acc, pKey) => {
        acc[pKey] = Object.keys(specialPresets[pKey] || {});
        return acc;
      }, {})
    };

    const updated = [newService, ...allServices];
    setSettingsForm((prev: unknown) => {
      const prevObj = (typeof prev === 'object' && prev !== null ? prev : {}) as Record<string, unknown>;
      return { ...prevObj, services: updated };
    });
    setSelectedServiceIndex(0);
  };

  const handleDeleteService = (idx: number) => {
    const updated = [...allServices];
    updated.splice(idx, 1);
    setSettingsForm((prev: unknown) => {
      const prevObj = (typeof prev === 'object' && prev !== null ? prev : {}) as Record<string, unknown>;
      return { ...prevObj, services: updated };
    });
    if (selectedServiceIndex === idx) {
      setSelectedServiceIndex(null);
    }
    setConfirmDeleteIdx(null);
  };

  const filteredServices = useMemo(() => {
    const term = normalizeText(searchTerm);

    return allServices
      .map((srv, originalIndex) => ({ srv, originalIndex }))
      .filter(({ srv }) => {
        if (!matchesCategory(srv, activeCategory)) {
          return false;
        }

        if (!term) {
          return true;
        }

        const nameNorm = normalizeText(srv.name);
        const groupNorm = normalizeText(srv.exclusionGroup);
        const typeNorm = normalizeText(srv.type);
        const garmentNorm = normalizeText(srv.garment);
        const stdList = Array.isArray(srv.appliesToStandard) ? srv.appliesToStandard.map(normalizeText).join(' ') : '';
        const specList = srv.appliesToSpecial ? Object.values(srv.appliesToSpecial).flat().map(normalizeText).join(' ') : '';

        return (
          nameNorm.includes(term) ||
          groupNorm.includes(term) ||
          typeNorm.includes(term) ||
          garmentNorm.includes(term) ||
          stdList.includes(term) ||
          specList.includes(term)
        );
      });
  }, [allServices, activeCategory, searchTerm]);

  return (
    <div className="animate-in fade-in space-y-5">
      {/* Unified Search, Group Manager & Category Filter Toolbar */}
      <div className="bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800/90 shadow-sm space-y-3">
        {/* Row 1: Search Input & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80 md:w-96 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, grupo excluyente, prenda o tipo..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 font-medium outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-200 rounded-lg transition cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              id="btn-manage-exclusion-groups"
              onClick={() => setIsExclusionGroupsModalOpen(true)}
              className="bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-800 hover:border-amber-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sliders size={14} className="text-amber-400" />
              <span>Gestionar Grupos</span>
            </button>
            <button
              type="button"
              onClick={handleAddService}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus size={15} /> Nuevo Servicio
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map(cat => {
            const isSelected = activeCategory === cat.key;
            const label = cat.key === 'ALL' ? `Todos (${allServices.length})` : cat.label;
            return (
              <button
                key={cat.key}
                type="button"
                id={`filter-pill-${cat.key.toLowerCase()}`}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                    : 'bg-stone-950/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 border border-stone-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid with 3-Tier Zero-Truncation Card Layout */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800/60 flex flex-col items-center justify-center gap-3">
          <p className="text-stone-400 text-sm">No se encontraron servicios coincidentes con los filtros.</p>
          {(searchTerm || activeCategory !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('ALL');
              }}
              className="text-amber-400 text-xs font-bold hover:underline cursor-pointer"
            >
              Restablecer filtros de búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredServices.map(({ srv, originalIndex }) => {
            const summary = getApplicabilitySummary(srv, standardGarments, specialPresets);
            const isGlobal = srv.isGlobal === true || srv.garment === 'Global';

            return (
              <div
                key={`service-card-${originalIndex}`}
                id={`service-card-${originalIndex}`}
                className="bg-stone-900/80 border border-stone-800 hover:border-stone-700/90 rounded-2xl p-3 shadow-sm flex flex-col justify-between gap-2.5 transition-all group relative"
              >
                {/* Row 1 (Header - Full Width): #ID badge + Service Name Input + Delete Action */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-black text-[11px] flex items-center justify-center">
                    #{originalIndex + 1}
                  </span>

                  <input
                    type="text"
                    value={srv.name || ''}
                    title={srv.name || ''}
                    onChange={e => updateServiceField(originalIndex, 'name', e.target.value)}
                    className="bg-stone-950/90 border border-stone-800/80 focus:border-amber-500/80 px-2.5 py-1.5 rounded-xl font-bold text-stone-100 outline-none text-xs flex-1 transition placeholder:text-stone-600 min-w-0"
                    placeholder="Nombre del servicio..."
                  />

                  {confirmDeleteIdx === originalIndex ? (
                    <div className="flex items-center gap-1 bg-red-950/90 border border-red-800/80 px-2 py-0.5 rounded-xl animate-in fade-in shrink-0">
                      <span className="text-[10px] font-black text-red-300">¿Borrar?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(originalIndex)}
                        className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded transition cursor-pointer"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIdx(null)}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-400 text-[9px] font-bold uppercase px-1 py-0.5 rounded transition cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteIdx(originalIndex)}
                      className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800/80 rounded-xl transition shrink-0 cursor-pointer"
                      title="Eliminar este servicio"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Row 2: Compatible Garments tag, Service Type badge/selector, and Price input (Bs) */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-800/60">
                  {/* Compatible Garments tag */}
                  <button
                    type="button"
                    onClick={() => setSelectedServiceIndex(originalIndex)}
                    className={`flex-1 min-w-0 text-left px-2.5 py-1.5 rounded-xl border transition flex items-center justify-between gap-1.5 group/btn cursor-pointer ${
                      isGlobal
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
                        : 'bg-stone-950/90 border-stone-800/80 text-stone-300 hover:border-stone-700 hover:text-white'
                    }`}
                    title={`Prendas Compatibles: ${summary}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {isGlobal ? (
                        <Globe size={12} className="text-amber-400 shrink-0" />
                      ) : (
                        <Layers size={12} className="text-amber-500 shrink-0" />
                      )}
                      <span className="text-[10px] font-bold truncate">
                        {summary}
                      </span>
                    </div>
                    <Sliders size={11} className="text-stone-500 group-hover/btn:text-amber-400 shrink-0" />
                  </button>

                  {/* Service Type badge / select */}
                  <div className="shrink-0 w-28 sm:w-32">
                    <select
                      value={srv.type || 'Costo Adicional'}
                      onChange={e => updateServiceField(originalIndex, 'type', e.target.value)}
                      className="w-full bg-stone-950/90 text-[10px] font-bold text-stone-200 px-2 py-1.5 rounded-xl border border-stone-800/80 outline-none truncate hover:border-stone-700 focus:border-amber-500/50 transition cursor-pointer"
                      title={srv.type || 'Costo Adicional'}
                    >
                      <option value="Costo Adicional">Costo Adicional</option>
                      <option value="Opción de Confección">Opción Confección</option>
                      <option value="Costo Adicional Editable">Costo Editable</option>
                      <option value="Variante Base">Variante Base</option>
                      <option value="Escala de Volumen (Logos)">Escala Logos</option>
                    </select>
                  </div>

                  {/* Price Input (Bs) */}
                  <div className="relative shrink-0 w-20 sm:w-24">
                    <input
                      type="number"
                      placeholder={srv.type === 'Escala de Volumen (Logos)' ? "Escala" : "0"}
                      value={srv.type === 'Escala de Volumen (Logos)' ? '' : (srv.price ?? '')}
                      onChange={e => {
                        const nVal = e.target.value === '' ? null : parseFloat(e.target.value);
                        updateServiceField(originalIndex, 'price', nVal);
                      }}
                      disabled={srv.type === 'Escala de Volumen (Logos)'}
                      className={`bg-stone-950/90 px-2 py-1.5 rounded-xl w-full text-right font-mono text-amber-400 font-bold outline-none border border-stone-800/80 focus:border-amber-500 text-xs transition pr-6 ${
                        srv.type === 'Escala de Volumen (Logos)' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-500 font-mono pointer-events-none">
                      Bs
                    </span>
                  </div>
                </div>

                {/* Row 3: Standalone Exclusion Group selector row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/40 text-[10px]">
                  <span className="font-bold text-stone-500 uppercase tracking-wider shrink-0">
                    Grupo Excluyente:
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 max-w-xs justify-end">
                    <select
                      value={srv.exclusionGroup ? srv.exclusionGroup.trim().toUpperCase() : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__MANAGE__') {
                          setIsExclusionGroupsModalOpen(true);
                        } else {
                          updateServiceField(originalIndex, 'exclusionGroup', val ? val.trim().toUpperCase() : '');
                        }
                      }}
                      className={`bg-stone-950/90 border px-2.5 py-1 rounded-xl text-[10px] font-black uppercase outline-none transition cursor-pointer max-w-[200px] truncate ${
                        srv.exclusionGroup
                          ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                          : 'border-stone-800/80 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <option value="">Sin exclusión</option>
                      {availableExclusionGroups.map(grp => (
                        <option key={grp} value={grp}>{grp}</option>
                      ))}
                      <option value="__MANAGE__">⚙️ Gestionar grupos...</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Save Bar for Immediate Action */}
      <div className="sticky bottom-3 z-20 bg-stone-900/95 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            <strong className="text-white">{filteredServices.length}</strong> de <strong className="text-amber-400">{allServices.length}</strong> servicios
          </span>
        </div>
        <button
          type="submit"
          form="settings-form"
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <CheckCircle2 size={15} /> Guardar Servicios
        </button>
      </div>

      {/* Target Items Modal */}
      {selectedServiceIndex !== null && allServices[selectedServiceIndex] && (
        <ServiceAppliesToModal
          service={allServices[selectedServiceIndex]}
          serviceIndex={selectedServiceIndex}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm as unknown as React.Dispatch<React.SetStateAction<unknown>>}
          onClose={() => setSelectedServiceIndex(null)}
        />
      )}

      {/* Dedicated Exclusion Groups Manager Modal */}
      <ExclusionGroupsModal
        isOpen={isExclusionGroupsModalOpen}
        onClose={() => setIsExclusionGroupsModalOpen(false)}
        services={allServices}
        onUpdateServices={handleUpdateServicesAndGroups}
        customExclusionGroups={customExclusionGroups}
      />
    </div>
  );
};
