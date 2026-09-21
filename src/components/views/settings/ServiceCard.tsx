import React, { useState } from 'react';
import { Trash2, Sliders, Globe, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { getApplicabilitySummary } from '../../../utils/serviceUtils';

export interface ServiceCardProps {
  srv: any;
  index: number;
  originalIndex: number;
  allServices: any[];
  standardGarments: string[];
  specialPresets: Record<string, any>;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  onOpenAppliesToModal: () => void;
  onDeleteService: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  srv,
  index,
  originalIndex,
  allServices,
  standardGarments,
  specialPresets,
  setSettingsForm,
  onOpenAppliesToModal,
  onDeleteService
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applicabilitySummary = getApplicabilitySummary(srv, standardGarments, specialPresets);
  const isGlobal = srv.isGlobal === true || srv.garment === 'Global';

  const updateField = (field: string, value: any) => {
    const updated = [...allServices];
    updated[originalIndex] = {
      ...updated[originalIndex],
      [field]: value
    };
    setSettingsForm((p: any) => ({ ...p, services: updated }));
  };

  return (
    <div className="bg-stone-900/70 border-2 border-stone-800/90 hover:border-stone-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 transition-all duration-200 group relative">
      {/* Top Header: Badge, Service Name, Exclusion Group, Delete Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Index Counter Badge */}
          <span className="shrink-0 w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-black text-xs flex items-center justify-center">
            #{index + 1}
          </span>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={srv.name || ''}
              onChange={e => updateField('name', e.target.value)}
              className="bg-stone-950 border border-stone-800 focus:border-amber-500/80 px-3 py-1.5 rounded-xl font-bold text-stone-100 outline-none text-xs sm:text-sm w-full transition placeholder:text-stone-600"
              placeholder="Nombre del servicio (Ej. Bordado de Logo, Tiros Cruzados)..."
            />
          </div>
        </div>

        {/* Delete Confirmation Button */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/80 px-2.5 py-1 rounded-xl animate-in fade-in">
              <span className="text-[10px] font-black uppercase text-red-300 flex items-center gap-1">
                <AlertCircle size={12} /> ¿Eliminar?
              </span>
              <button
                type="button"
                onClick={onDeleteService}
                className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded transition"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-400 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-800/80 rounded-xl transition flex items-center gap-1 text-xs"
              title="Eliminar este servicio adicional"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Grupo Excluyente, Prendas Compatibles, Tipo de Impacto, Precio Sugerido */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
        {/* Grupo Excluyente */}
        <div className="md:col-span-3 flex flex-col justify-end space-y-1">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
            Grupo Excluyente
          </label>
          <input
            type="text"
            placeholder="Opcional (Ej. TIROS, MANGA)..."
            value={srv.exclusionGroup || ''}
            onChange={e => updateField('exclusionGroup', e.target.value)}
            className="bg-stone-950 text-stone-300 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-stone-700 outline-none w-full uppercase placeholder:text-stone-600 transition"
          />
        </div>

        {/* Prendas Compatibles (Tab A & Tab B) */}
        <div className="md:col-span-4 flex flex-col justify-end space-y-1">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              Prendas Compatibles
            </span>
            <span className="text-[9px] text-stone-500 font-bold">Tab A & Tab B</span>
          </label>
          <button
            type="button"
            onClick={onOpenAppliesToModal}
            className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-center justify-between gap-2 group/btn ${
              isGlobal
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:border-amber-500/70'
                : 'bg-stone-950 border-stone-800 text-stone-200 hover:border-stone-700 hover:text-white'
            }`}
            title="Editar a qué prendas aplica este servicio"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isGlobal ? (
                <Globe size={13} className="text-amber-400 shrink-0" />
              ) : (
                <Layers size={13} className="text-amber-500 shrink-0" />
              )}
              <span className="text-xs font-bold truncate">
                {applicabilitySummary}
              </span>
            </div>
            <span className="p-1 bg-stone-800 group-hover/btn:bg-amber-600 group-hover/btn:text-white text-stone-400 rounded-lg transition shrink-0">
              <Sliders size={11} />
            </span>
          </button>
        </div>

        {/* Tipo de Impacto */}
        <div className="md:col-span-3 flex flex-col justify-end space-y-1">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
            Tipo de Servicio
          </label>
          <select
            value={srv.type || 'Costo Adicional'}
            onChange={e => updateField('type', e.target.value)}
            className="bg-stone-950 text-xs font-bold text-stone-200 px-3 py-2 rounded-xl border border-stone-800 outline-none w-full appearance-none hover:border-stone-700 focus:border-amber-500/50 transition cursor-pointer"
          >
            <option value="Opción de Confección">Opción de Confección</option>
            <option value="Costo Adicional">Costo Adicional</option>
            <option value="Costo Adicional Editable">Costo Adicional Editable</option>
            <option value="Variante Base">Variante Base</option>
            <option value="Escala de Volumen (Logos)">Escala de Volumen (Logos)</option>
          </select>
        </div>

        {/* Precio Sugerido */}
        <div className="md:col-span-2 flex flex-col justify-end space-y-1">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
            Precio Sugerido
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              placeholder={srv.type === 'Escala de Volumen (Logos)' ? "[Escalado]" : "[Editable]"}
              value={srv.type === 'Escala de Volumen (Logos)' ? '' : (srv.price ?? '')}
              onChange={e => {
                const nVal = e.target.value === '' ? null : parseFloat(e.target.value);
                updateField('price', nVal);
              }}
              disabled={srv.type === 'Escala de Volumen (Logos)'}
              className={`bg-stone-950 px-3 py-2 rounded-xl w-full text-right font-mono text-amber-400 font-bold outline-none border border-stone-800 focus:border-amber-500 text-xs transition pr-8 ${srv.type === 'Escala de Volumen (Logos)' ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <span className="absolute right-2.5 text-[10px] font-bold text-stone-500 font-mono pointer-events-none">
              Bs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
