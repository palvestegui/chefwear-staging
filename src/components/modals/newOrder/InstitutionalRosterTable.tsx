import React, { useMemo } from 'react';
import { Trash2, Ruler, UserCheck } from 'lucide-react';
import { InstitutionalEmployee, GarmentAllocation } from '../../../utils/institutionalOrderUtils';
import { getRolesForAccountType } from '../../../utils/constants';

interface InstitutionalRosterTableProps {
  roster: InstitutionalEmployee[];
  setRoster: React.Dispatch<React.SetStateAction<InstitutionalEmployee[]>>;
  garmentTemplates: Array<{ name: string; fabric?: string; fabricColor?: string }>;
  clientType?: string;
  onOpenCustomMeasurements: (empIndex: number, garmentIndex: number) => void;
  availableSizes?: string[];
  readOnly?: boolean;
}

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'A Medida'];

const isTailoredGarment = (name: string): boolean => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('mandil') || norm.includes('gorro') || norm.includes('delantal') || norm.includes('cofia') || norm.includes('bandana')) {
    return false;
  }
  return norm.includes('filipina') || norm.includes('pantalon') || norm.includes('pantalón') || norm.includes('chaqueta') || norm.includes('camisa');
};

const isSizeApplicable = (name: string): boolean => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('mandil') || norm.includes('gorro') || norm.includes('delantal') || norm.includes('cofia') || norm.includes('bandana')) {
    return false;
  }
  return true;
};

export const InstitutionalRosterTable: React.FC<InstitutionalRosterTableProps> = ({
  roster,
  setRoster,
  garmentTemplates,
  clientType,
  onOpenCustomMeasurements,
  availableSizes = STANDARD_SIZES,
  readOnly = false
}) => {
  const availableRoles = useMemo(() => getRolesForAccountType(clientType), [clientType]);

  const handleUpdateEmployee = <K extends keyof InstitutionalEmployee>(
    index: number,
    field: K,
    value: InstitutionalEmployee[K]
  ) => {
    if (readOnly) return;
    setRoster(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUpdateGarment = <K extends keyof GarmentAllocation>(
    empIndex: number,
    garmentIndex: number,
    field: K,
    value: GarmentAllocation[K]
  ) => {
    if (readOnly) return;
    setRoster(prev => {
      const copy = [...prev];
      const emp = { ...copy[empIndex] };
      const garments = [...(emp.garments || [])];
      if (garments[garmentIndex]) {
        garments[garmentIndex] = { ...garments[garmentIndex], [field]: value };
        if (field === 'pocketName') {
          garments[garmentIndex].embroideries = value ? [`Nombre en Bolsillo: ${value}`] : [];
        }
      }
      emp.garments = garments;
      copy[empIndex] = emp;
      return copy;
    });
  };

  const handleRemoveEmployee = (index: number) => {
    if (readOnly) return;
    setRoster(prev => prev.filter((_, i) => i !== index));
  };

  if (roster.length === 0) {
    return (
      <div className="bg-stone-950 border border-stone-800/80 rounded-2xl p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <UserCheck size={24} />
        </div>
        <h5 className="text-sm font-black text-stone-200 uppercase tracking-tight">
          No hay empleados en la nómina todavía
        </h5>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Utiliza los botones de arriba para agregar empleados manualmente, aplicar una plantilla de prendas o importar masivamente desde Excel.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-inner flex flex-col flex-1 min-h-[320px] h-full">
      <div className="overflow-auto flex-1 min-h-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-900/95 sticky top-0 z-10 text-[9px] font-black uppercase tracking-wider text-stone-400 border-b border-stone-800 select-none backdrop-blur-sm">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3 min-w-[170px]">Nombre Completo</th>
              <th className="py-3 px-3 min-w-[120px]">Teléfono</th>
              <th className="py-3 px-3 min-w-[130px]">Cargo / Rol</th>
              {garmentTemplates.map((gt, gIdx) => (
                <th key={gIdx} className="py-3 px-3 min-w-[200px] bg-stone-900/40 border-l border-stone-800/80">
                  <div className="flex flex-col">
                    <span className="text-amber-400 font-bold">{gt.name}</span>
                    <span className="text-[9px] text-amber-200/90 font-mono truncate font-semibold">
                      {gt.fabric || 'Drill de 8oz'}{gt.fabricColor ? ` • ${gt.fabricColor}` : ''}
                    </span>
                    <span className="text-[8px] text-stone-500 font-mono">
                      {isSizeApplicable(gt.name) ? 'Talla & Bordado' : 'Bordado / Talla Única'}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 min-w-[150px] border-l border-stone-800/80">Notas / Obs.</th>
              {!readOnly && <th className="py-3 px-3 w-12 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-900 text-xs">
            {roster.map((emp, empIdx) => (
              <tr key={emp.id || `row-${empIdx}`} className="hover:bg-stone-900/40 transition">
                <td className="py-2.5 px-3 text-center font-mono font-bold text-[11px] text-stone-500">
                  {empIdx + 1}
                </td>
                <td className="py-2.5 px-3">
                  {readOnly ? (
                    <span className="font-bold text-stone-200 text-xs">{emp.fullName || `Empleado #${empIdx + 1}`}</span>
                  ) : (
                    <input
                      type="text"
                      value={emp.fullName || ''}
                      onChange={e => handleUpdateEmployee(empIdx, 'fullName', e.target.value)}
                      placeholder={`Empleado #${empIdx + 1}`}
                      className="w-full bg-stone-900/70 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-200 focus:border-amber-500 outline-none"
                    />
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {readOnly ? (
                    <span className="text-stone-300 font-mono text-xs font-medium">{emp.phone || '-'}</span>
                  ) : (
                    <input
                      type="text"
                      value={emp.phone || ''}
                      onChange={e => handleUpdateEmployee(empIdx, 'phone', e.target.value)}
                      placeholder="WhatsApp"
                      className="w-full bg-stone-900/70 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-300 focus:border-amber-500 outline-none"
                    />
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {readOnly ? (
                    <span className="inline-block bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-300">
                      {emp.role || 'Personal'}
                    </span>
                  ) : (() => {
                    const isCustom = emp.role === 'OTRO' || (!!emp.role && !availableRoles.includes(emp.role));
                    const selectValue = isCustom ? 'OTRO' : (emp.role || availableRoles[0] || 'OTRO');
                    return (
                      <div className="flex flex-col gap-1">
                        <select
                          value={selectValue}
                          onChange={e => handleUpdateEmployee(empIdx, 'role', e.target.value)}
                          className="w-full bg-stone-900/70 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-300 focus:border-amber-500 outline-none"
                        >
                          {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {isCustom && (
                          <input
                            type="text"
                            value={emp.role === 'OTRO' ? '' : (emp.role || '')}
                            onChange={e => handleUpdateEmployee(empIdx, 'role', e.target.value)}
                            placeholder="Rol manual..."
                            autoFocus
                            className="w-full bg-stone-900/70 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-amber-400 focus:border-amber-500 outline-none"
                          />
                        )}
                      </div>
                    );
                  })()}
                </td>
                {garmentTemplates.map((gt, gIdx) => {
                  const gAlloc = emp.garments?.[gIdx] || {
                    garmentName: gt.name,
                    size: isSizeApplicable(gt.name) ? 'M' : 'STD',
                    pocketName: '',
                    measurements: {}
                  };
                  const needsSize = isSizeApplicable(gt.name);
                  const needsTailoring = isTailoredGarment(gt.name);
                  const hasCustom = gAlloc.measurements && Object.keys(gAlloc.measurements).length > 0;

                  return (
                    <td key={gIdx} className="py-2.5 px-3 bg-stone-950/40 border-l border-stone-850">
                      <div className="flex items-center gap-1.5">
                        {readOnly ? (
                          <span className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-400 font-mono shrink-0">
                            {gAlloc.size || (needsSize ? 'M' : 'STD')}
                          </span>
                        ) : needsSize ? (
                          <select
                            value={gAlloc.size || 'M'}
                            onChange={e => handleUpdateGarment(empIdx, gIdx, 'size', e.target.value)}
                            className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs font-bold text-amber-400 outline-none focus:border-amber-500"
                          >
                            {availableSizes.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-stone-400 shrink-0">
                            STD
                          </span>
                        )}
                        {readOnly ? (
                          <span className="text-[11px] font-bold text-stone-300 truncate flex-1 px-1">
                            {gAlloc.pocketName || <span className="text-stone-600 font-normal italic">Sin bordado</span>}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={gAlloc.pocketName || ''}
                            onChange={e => handleUpdateGarment(empIdx, gIdx, 'pocketName', e.target.value)}
                            placeholder="Bordado / Nombre"
                            className="w-full bg-stone-900/70 border border-stone-800 rounded-lg px-2 py-1 text-[11px] font-bold text-stone-300 focus:border-amber-500 outline-none"
                          />
                        )}
                        {needsTailoring && (
                          <button
                            type="button"
                            title="Medidas Personalizadas (cm)"
                            onClick={() => onOpenCustomMeasurements(empIdx, gIdx)}
                            className={`p-1.5 rounded-lg border transition ${
                              hasCustom
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-amber-400'
                            }`}
                          >
                            <Ruler size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 border-l border-stone-850">
                  {readOnly ? (
                    <span className="text-xs text-stone-400 italic truncate block max-w-[150px]">
                      {emp.notes || '-'}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={emp.notes || ''}
                      onChange={e => handleUpdateEmployee(empIdx, 'notes', e.target.value)}
                      placeholder="Obs. (ej. Manga 3/4)"
                      className="w-full bg-stone-900/70 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 placeholder:text-stone-600 focus:border-amber-500 outline-none"
                    />
                  )}
                </td>
                {!readOnly && (
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(empIdx)}
                      className="text-stone-600 hover:text-red-400 p-1.5 rounded-lg transition cursor-pointer"
                      title="Eliminar empleado"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-stone-900/90 border-t border-stone-800 px-4 py-2 flex items-center justify-between text-[11px] text-stone-400 font-mono select-none">
        <span>Total: <strong className="text-stone-200">{roster.length}</strong> empleados</span>
        <span className="text-amber-500/90 font-bold">{garmentTemplates.length} prendas configuradas</span>
      </div>
    </div>
  );
};
