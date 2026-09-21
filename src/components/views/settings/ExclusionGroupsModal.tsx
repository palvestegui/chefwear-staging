import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Sliders } from 'lucide-react';
import { DEFAULT_EXCLUSION_GROUPS } from '../../../utils/serviceUtils';
import { ServiceItemData } from './ServicesCatalogTab';

interface ExclusionGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItemData[];
  onUpdateServices: (updatedServices: ServiceItemData[], updatedGroups: string[]) => void;
  customExclusionGroups?: string[];
}

export const ExclusionGroupsModal: React.FC<ExclusionGroupsModalProps> = ({
  isOpen,
  onClose,
  services,
  onUpdateServices,
  customExclusionGroups = []
}) => {
  const [newGroupCode, setNewGroupCode] = useState('');
  const [editingGroup, setEditingGroup] = useState<{ original: string; current: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local state for immediate, smooth in-place UI updates
  const [localServices, setLocalServices] = useState<ServiceItemData[]>(services);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);

  // Synchronize when modal opens or when external services/groups change
  useEffect(() => {
    if (!isOpen) return;
    setLocalServices(services);

    const customClean = (customExclusionGroups || [])
      .map(g => g.trim().toUpperCase())
      .filter(Boolean);

    const usedInServices = services
      .map(s => s.exclusionGroup?.trim().toUpperCase())
      .filter((g): g is string => Boolean(g));

    let initialList: string[];
    if (customClean.length > 0) {
      initialList = Array.from(new Set([...customClean, ...usedInServices]));
    } else {
      initialList = Array.from(new Set([...DEFAULT_EXCLUSION_GROUPS, ...usedInServices]));
    }

    setActiveGroups(initialList.sort());
  }, [isOpen, services, customExclusionGroups]);

  if (!isOpen) return null;

  const handleAddGroup = () => {
    setErrorMessage(null);
    const code = newGroupCode.trim().toUpperCase();
    if (!code) return;

    if (activeGroups.includes(code)) {
      setErrorMessage(`El grupo "${code}" ya existe.`);
      return;
    }

    const updatedGroups = Array.from(new Set([...activeGroups, code])).sort();
    setActiveGroups(updatedGroups);
    onUpdateServices(localServices, updatedGroups);
    setNewGroupCode('');
  };

  const handleSaveRename = () => {
    if (!editingGroup) return;
    setErrorMessage(null);
    const oldCode = editingGroup.original.trim().toUpperCase();
    const newCode = editingGroup.current.trim().toUpperCase();

    if (!newCode) {
      setErrorMessage('El código de grupo no puede estar vacío.');
      return;
    }

    if (newCode === oldCode) {
      setEditingGroup(null);
      return;
    }

    if (activeGroups.includes(newCode) && newCode !== oldCode) {
      setErrorMessage(`El grupo "${newCode}" ya existe.`);
      return;
    }

    // 1. Rename across all services in localServices
    const updatedServices = localServices.map(s => {
      if (s.exclusionGroup?.trim().toUpperCase() === oldCode) {
        return { ...s, exclusionGroup: newCode };
      }
      return s;
    });

    // 2. Replace old group name with new group name in active groups list:
    // (prev.map(g => g === oldName ? newName : g))
    // Filter out oldCode so it is never orphaned if it was a default code and now has 0 services
    const updatedGroups = Array.from(
      new Set(
        activeGroups.map(g => (g === oldCode ? newCode : g))
      )
    ).sort();

    // 3. Immediately update modal's local state in place:
    setLocalServices(updatedServices);
    setActiveGroups(updatedGroups);

    // 4. Notify parent
    onUpdateServices(updatedServices, updatedGroups);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupToDelete: string) => {
    const code = groupToDelete.trim().toUpperCase();
    // Unlink from local services
    const updatedServices = localServices.map(s => {
      if (s.exclusionGroup?.trim().toUpperCase() === code) {
        return { ...s, exclusionGroup: '' };
      }
      return s;
    });

    const updatedGroups = activeGroups.filter(g => g !== code);
    setLocalServices(updatedServices);
    setActiveGroups(updatedGroups);
    onUpdateServices(updatedServices, updatedGroups);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-100">
                Gestionar Grupos Excluyentes
              </h3>
              <p className="text-[11px] text-stone-400">
                Opciones que se anulan mutuamente en la misma prenda (ej. MANGA, CUELLO).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Add New Group input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
            Agregar Nuevo Grupo
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupCode}
              onChange={e => setNewGroupCode(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGroup();
                }
              }}
              placeholder="CÓDIGO (EJ. BROCHE, ESPALDA)"
              className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-500 px-3 py-2 rounded-xl text-xs font-black text-amber-400 outline-none uppercase placeholder:text-stone-600"
            />
            <button
              type="button"
              disabled={!newGroupCode.trim()}
              onClick={handleAddGroup}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl transition disabled:opacity-40 cursor-pointer"
            >
              <Plus size={14} />
              <span>Agregar</span>
            </button>
          </div>
          {errorMessage && (
            <p className="text-[11px] font-bold text-red-400 mt-1">{errorMessage}</p>
          )}
        </div>

        {/* List of active groups */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-wider">
            <span>Grupos Disponibles ({activeGroups.length})</span>
            <span>Servicios Asignados</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {activeGroups.map(grp => {
              const assignedCount = localServices.filter(
                s => s.exclusionGroup?.trim().toUpperCase() === grp
              ).length;
              const isEditing = editingGroup?.original === grp;

              return (
                <div
                  key={grp}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-950/80 border border-stone-800/80 hover:border-stone-700 transition"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        autoFocus
                        value={editingGroup.current}
                        onChange={e =>
                          setEditingGroup(prev =>
                            prev ? { ...prev, current: e.target.value.toUpperCase() } : null
                          )
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') setEditingGroup(null);
                        }}
                        className="bg-stone-900 border border-amber-500 px-2 py-1 rounded-lg text-xs font-black text-amber-400 outline-none uppercase flex-1 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleSaveRename}
                        className="p-1 text-emerald-400 hover:bg-emerald-950/50 rounded-lg cursor-pointer"
                        title="Guardar nombre"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGroup(null)}
                        className="p-1 text-stone-500 hover:bg-stone-800 rounded-lg cursor-pointer"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black uppercase text-amber-400 tracking-wide truncate">
                        {grp}
                      </span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-800">
                        {assignedCount} {assignedCount === 1 ? 'servicio' : 'servicios'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingGroup({ original: grp, current: grp })}
                        className="p-1.5 text-stone-500 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                        title="Renombrar código en todo el catálogo"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(grp)}
                        className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                        title="Eliminar grupo y desvincular de servicios"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
