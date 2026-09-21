import React from 'react';
import { Plus, Check, Edit2, Trash2, X } from 'lucide-react';

export interface BasePricingTabProps {
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  newProductInput: string;
  setNewProductInput: (val: string) => void;
  newFabricInputs: Record<string, string>;
  setNewFabricInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editingName: string | null;
  setEditingName: (val: string | null) => void;
  tempName: string;
  setTempName: (val: string) => void;
  handleRename: (oldName: string, newName: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (val: string | null) => void;
  invalidPriceFields: Set<string>;
}

export const BasePricingTab: React.FC<BasePricingTabProps> = ({
  settingsForm,
  setSettingsForm,
  newProductInput,
  setNewProductInput,
  newFabricInputs,
  setNewFabricInputs,
  editingName,
  setEditingName,
  tempName,
  setTempName,
  handleRename,
  confirmDelete,
  setConfirmDelete,
  invalidPriceFields
}) => {
  return (
    <div className="animate-in fade-in space-y-6">
      {/* Registrar nueva prenda / producto */}
      <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 space-y-4">
        <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
          <Plus size={14}/> Registrar Nueva Prenda / Producto
        </h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre de la prenda (Ej. Chaqueta, Delantal, Cofia...)"
            value={newProductInput}
            onChange={e => setNewProductInput(e.target.value)}
            className="flex-1 bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              const trimmedName = newProductInput.trim();
              if (!trimmedName) return;
              if ((settingsForm.garments as any)[trimmedName]) {
                alert("Esta prenda ya existe en el catálogo.");
                return;
              }
              const standardFabrics = {
                "Tornado (Bull Denim)": { priceRaleo: 0, priceB2B: 0 },
                "Drill de 6oz": { priceRaleo: 0, priceB2B: 0 },
                "Drill de 8oz": { priceRaleo: 0, priceB2B: 0 },
                "Gabardina de 1ra": { priceRaleo: 0, priceB2B: 0 },
                "Gabardina de 2da": { priceRaleo: 0, priceB2B: 0 }
              };
              setSettingsForm((p: any) => ({
                ...p,
                garments: {
                  ...p.garments,
                  [trimmedName]: standardFabrics
                }
              }));
              setNewProductInput('');
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Plus size={14}/> Agregar Producto
          </button>
        </div>
      </div>

      <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Base por Prenda y Tela (Bs)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(settingsForm.garments || {}).map(garment => (
          <div key={garment} className="col-span-1 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex justify-between items-center border-b border-stone-900 pb-2 gap-2 min-h-[32px]">
              {editingName === garment ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRename(garment, tempName);
                      } else if (e.key === 'Escape') {
                        setEditingName(null);
                      }
                    }}
                    className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100 font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1 min-w-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(garment, tempName)}
                    className="text-emerald-500 hover:text-emerald-400 p-1 shrink-0"
                    title="Confirmar"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingName(null)}
                    className="text-stone-400 hover:text-stone-300 p-1 shrink-0"
                    title="Cancelar"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs truncate">{garment}</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(garment);
                      setTempName(garment);
                    }}
                    className="text-stone-500 hover:text-amber-500 p-1 transition-colors shrink-0"
                    title="Editar nombre del producto"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              {confirmDelete === garment ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsForm((p: any) => {
                        const updatedGarments = { ...p.garments } as any;
                        delete updatedGarments[garment];
                        return { ...p, garments: updatedGarments };
                      });
                      setConfirmDelete(null);
                    }}
                    className="text-[9px] font-black uppercase bg-red-600 hover:bg-red-500 text-white tracking-widest px-2 py-0.5 rounded transition-all"
                  >
                    Sí, Borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="text-[9px] font-black uppercase bg-stone-800 text-stone-400 hover:text-stone-300 tracking-widest px-2 py-0.5 rounded transition-all"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(garment)}
                  className="text-[9px] font-black uppercase text-stone-600 hover:text-red-500 tracking-widest flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-stone-800 bg-stone-900/30"
                >
                  <Trash2 size={10}/> Eliminar
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-2.5">
              {Object.keys((settingsForm.garments as any)[garment] || {}).map(fabric => {
                if (garment === 'Gorro' && (fabric.includes('Tornado') || fabric.includes('Gabardina de 1ra'))) return null;
                const valObj = (settingsForm.garments as any)[garment][fabric];
                const raleoVal = typeof valObj === 'object' && valObj !== null ? (valObj.priceRaleo ?? 0) : (typeof valObj === 'number' ? valObj : 0);
                const b2bVal = typeof valObj === 'object' && valObj !== null ? (valObj.priceB2B ?? 0) : (typeof valObj === 'number' ? valObj : 0);

                return (
                  <div key={fabric} className="flex flex-col gap-2 bg-stone-900 p-2.5 rounded-lg border border-stone-850">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-stone-200 text-xs break-words">{fabric}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsForm((p: any) => {
                            const updatedGarments = { ...p.garments } as any;
                            if (updatedGarments[garment]) {
                              const copy = { ...updatedGarments[garment] };
                              delete copy[fabric];
                              updatedGarments[garment] = copy;
                            }
                            return { ...p, garments: updatedGarments };
                          });
                        }}
                        className="p-1.5 text-stone-500 hover:text-red-500 transition-colors border border-transparent hover:border-stone-800 rounded bg-stone-950/50 shrink-0"
                        title="Eliminar tela"
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* RALEO Input */}
                      <div className={`flex items-center justify-between bg-stone-950 px-2.5 py-1.5 rounded border transition-colors ${
                        invalidPriceFields.has(`tabA:${garment}:${fabric}:raleo`) ? 'border-red-500/90 bg-red-950/20' : 'border-stone-800'
                      }`} title="Precio Minorista / Raleo">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider shrink-0">RALEO</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[10px] font-bold text-stone-500 shrink-0">Bs</span>
                          <input 
                            type="number" 
                            value={raleoVal} 
                            onChange={e => {
                              const nVal = parseFloat(e.target.value) || 0;
                              setSettingsForm((p: any) => {
                                const updatedGarments = { ...p.garments } as any;
                                const currentG = { ...(updatedGarments[garment] || {}) };
                                currentG[fabric] = { priceRaleo: nVal, priceB2B: b2bVal };
                                updatedGarments[garment] = currentG;
                                return { ...p, garments: updatedGarments };
                              });
                            }} 
                            className="bg-transparent w-16 text-right font-mono text-stone-200 font-bold outline-none text-xs"
                          />
                        </div>
                      </div>

                      {/* B2B Input */}
                      <div className={`flex items-center justify-between bg-stone-950 px-2.5 py-1.5 rounded border transition-colors ${
                        invalidPriceFields.has(`tabA:${garment}:${fabric}:b2b`) ? 'border-red-500/90 bg-red-950/20' : 'border-stone-800'
                      }`} title="Precio Mayorista / B2B">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider shrink-0">B2B</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[10px] font-bold text-amber-600/70 shrink-0">Bs</span>
                          <input 
                            type="number" 
                            value={b2bVal} 
                            onChange={e => {
                              const nVal = parseFloat(e.target.value) || 0;
                              setSettingsForm((p: any) => {
                                const updatedGarments = { ...p.garments } as any;
                                const currentG = { ...(updatedGarments[garment] || {}) };
                                currentG[fabric] = { priceRaleo: raleoVal, priceB2B: nVal };
                                updatedGarments[garment] = currentG;
                                return { ...p, garments: updatedGarments };
                              });
                            }} 
                            className="bg-transparent w-16 text-right font-mono text-amber-500 font-bold outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Añadir nueva tela / material */}
            <div className="pt-2 border-t border-stone-900/50 flex gap-1.5 items-center">
              <input
                type="text"
                placeholder="Nueva tela..."
                value={newFabricInputs[garment] || ''}
                onChange={e => setNewFabricInputs(prev => ({ ...prev, [garment]: e.target.value }))}
                className="flex-1 bg-stone-900 border border-stone-850 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-stone-200 outline-none focus:border-amber-500/30"
              />
              <button
                type="button"
                onClick={() => {
                  const fabricName = (newFabricInputs[garment] || '').trim();
                  if (!fabricName) return;
                  if ((settingsForm.garments as any)[garment][fabricName] !== undefined) {
                    alert("Esta tela ya existe para esta prenda.");
                    return;
                  }
                  setSettingsForm((p: any) => ({
                    ...p,
                    garments: {
                      ...p.garments,
                      [garment]: {
                        ...(p.garments as any)[garment],
                        [fabricName]: { priceRaleo: 0, priceB2B: 0 }
                      }
                    }
                  }));
                  setNewFabricInputs(prev => ({ ...prev, [garment]: '' }));
                }}
                className="bg-stone-900 hover:bg-stone-800 text-amber-500 p-1.5 rounded-lg border border-stone-800 transition"
                title="Añadir tela"
              >
                <Plus size={12}/>
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
