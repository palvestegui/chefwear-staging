import React from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';

export interface GarmentTemplate {
  name: string;
  fabric: string;
  fabricColor: string;
}

export interface PricingGarmentsConfig {
  garments?: Record<string, Record<string, number>>;
  [key: string]: unknown;
}

interface RosterGarmentTemplateBarProps {
  templates: GarmentTemplate[];
  pricing?: PricingGarmentsConfig | null;
  onUpdateTemplate: (idx: number, field: 'name' | 'fabric' | 'fabricColor', value: string) => void;
  onAddTemplateColumn: (garmentName?: string) => void;
  onRemoveTemplateColumn?: (idx: number) => void;
  onRemove?: (idx: number) => void;
  commonGarments?: string[];
  readOnly?: boolean;
}

const DEFAULT_COMMON_GARMENTS = ['Filipina', 'Pantalón', 'Mandil', 'Gorro', 'Delantal', 'Cofia', 'Chaqueta', 'Camisa'];

export const RosterGarmentTemplateBar: React.FC<RosterGarmentTemplateBarProps> = ({
  templates,
  pricing,
  onUpdateTemplate,
  onAddTemplateColumn,
  onRemoveTemplateColumn,
  onRemove,
  commonGarments = DEFAULT_COMMON_GARMENTS,
  readOnly = false
}) => {
  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>, tIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    if (onRemove) {
      onRemove(tIdx);
    } else if (onRemoveTemplateColumn) {
      onRemoveTemplateColumn(tIdx);
    }
  };

  return (
    <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 shrink-0 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
          <Sparkles size={12} /> Configuración de Prendas del Pedido Institucional
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddTemplateColumn('Mandil');
            }}
            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> Añadir Prenda
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {templates.map((tpl, tIdx) => {
          const baseAvailFabrics = (pricing?.garments && pricing.garments[tpl.name]) 
            ? Object.keys(pricing.garments[tpl.name])
            : ['Drill de 8oz', 'Gabardina', 'Gabardina de 2da', 'Tornado (Bull Denim)', 'Jean'];
          const selectableFabrics = Array.from(new Set([...baseAvailFabrics, tpl.fabric].filter(Boolean)));

          return (
            <div key={tIdx} className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col gap-1.5 relative">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-black text-amber-500 font-mono">Prenda #{tIdx + 1}</span>
                {!readOnly && templates.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, tIdx)}
                    className="text-stone-600 hover:text-red-400 transition p-0.5 cursor-pointer"
                    title="Eliminar columna de prenda"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {readOnly ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between bg-stone-950/80 border border-stone-800/80 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs font-black text-stone-200">{tpl.name}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">{tpl.fabric || 'Drill'}</span>
                  </div>
                  {tpl.fabricColor ? (
                    <div className="text-[10px] font-mono font-medium text-stone-400 px-1 truncate">
                      Color: <strong className="text-stone-300">{tpl.fabricColor}</strong>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={tpl.name}
                      onChange={e => onUpdateTemplate(tIdx, 'name', e.target.value)}
                      className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs font-black text-stone-200 outline-none focus:border-amber-500"
                    >
                      {commonGarments.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <select
                      value={tpl.fabric}
                      onChange={e => onUpdateTemplate(tIdx, 'fabric', e.target.value)}
                      className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 outline-none focus:border-amber-500"
                    >
                      {selectableFabrics.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={tpl.fabricColor || ''}
                    onChange={e => onUpdateTemplate(tIdx, 'fabricColor', e.target.value)}
                    placeholder="Color (ej. Azul, Negro)"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-[11px] font-medium text-stone-300 placeholder:text-stone-600 outline-none focus:border-amber-500"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
