import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Check, 
  Sparkles,
  Layers,
  Lock
} from 'lucide-react';
import { Contact } from '../../../types';
import { 
  InstitutionalEmployee
} from '../../../utils/institutionalOrderUtils';
import { InstitutionalRosterTable } from './InstitutionalRosterTable';
import { ExcelImportModal } from './ExcelImportModal';
import { EmployeeCustomMeasurementsModal } from './EmployeeCustomMeasurementsModal';
import { RosterGarmentTemplateBar, GarmentTemplate, PricingGarmentsConfig } from '../roster/RosterGarmentTemplateBar';

export interface GarmentTemplateInput {
  name: string;
  fabric?: string;
  fabricColor?: string;
}

interface InstitutionalRosterModalProps {
  show: boolean;
  onClose: () => void;
  roster: InstitutionalEmployee[];
  setRoster: React.Dispatch<React.SetStateAction<InstitutionalEmployee[]>>;
  garmentTemplates: GarmentTemplateInput[];
  companyName: string;
  accountId: string;
  clientType?: string;
  pricing?: PricingGarmentsConfig | null;
  existingAccountContacts?: Contact[];
  onConfirmSync: (updatedRoster: InstitutionalEmployee[]) => void;
  readOnly?: boolean;
}

export const InstitutionalRosterModal: React.FC<InstitutionalRosterModalProps> = ({
  show,
  onClose,
  roster,
  setRoster,
  garmentTemplates,
  companyName,
  accountId,
  clientType,
  pricing,
  existingAccountContacts = [],
  onConfirmSync,
  readOnly = false
}) => {
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [measurementModalState, setMeasurementModalState] = useState<{
    show: boolean;
    empIndex: number;
    garmentIndex: number;
  }>({
    show: false,
    empIndex: 0,
    garmentIndex: 0
  });

  const [bulkCountInput, setBulkCountInput] = useState<string>('5');
  const [globalSizeInput, setGlobalSizeInput] = useState<string>('M');

  // Alias referencing employee roster for domain clarity
  const employeeRoster = roster;

  // Interactive templates state
  const [templateGarments, setTemplateGarments] = useState<GarmentTemplate[]>(() => {
    if (garmentTemplates && garmentTemplates.length > 0) {
      return garmentTemplates.map(g => ({
        name: g.name,
        fabric: g.fabric || 'Drill de 8oz',
        fabricColor: g.fabricColor || ''
      }));
    }
    return [
      { name: 'Filipina', fabric: 'Drill de 8oz', fabricColor: '' },
      { name: 'Mandil', fabric: 'Gabardina de 2da', fabricColor: '' },
      { name: 'Gorro', fabric: 'Gabardina de 2da', fabricColor: '' }
    ];
  });

  // Re-sync templates ONLY when modal opens (transitioning from false to true)
  // This prevents infinite loops or state overwrites when parent re-renders while modal is active
  const prevShowRef = useRef(false);
  useEffect(() => {
    if (show && !prevShowRef.current) {
      if (garmentTemplates && garmentTemplates.length > 0) {
        setTemplateGarments(garmentTemplates.map(g => ({
          name: g.name,
          fabric: g.fabric || 'Drill de 8oz',
          fabricColor: g.fabricColor || ''
        })));
      }
    }
    prevShowRef.current = show;
  }, [show, garmentTemplates]);

  if (!show) return null;

  const handleUpdateTemplate = (idx: number, field: 'name' | 'fabric' | 'fabricColor', value: string) => {
    const updated = [...templateGarments];
    if (!updated[idx]) return;
    updated[idx] = { ...updated[idx], [field]: value };
    setTemplateGarments(updated);

    // Sync all rows in the roster
    setRoster(prev => prev.map(emp => {
      const gList = [...(emp.garments || [])];
      if (gList[idx]) {
        gList[idx] = {
          ...gList[idx],
          garmentName: field === 'name' ? value : gList[idx].garmentName,
          fabric: field === 'fabric' ? value : gList[idx].fabric,
          fabricColor: field === 'fabricColor' ? value : gList[idx].fabricColor,
        };
      }
      return { ...emp, garments: gList };
    }));
  };

  const handleAddTemplateColumn = (garmentName: string = 'Mandil') => {
    const availFabrics = (pricing?.garments && pricing.garments[garmentName])
      ? Object.keys(pricing.garments[garmentName])
      : ['Drill de 8oz', 'Gabardina de 2da'];
    const defaultFabric = availFabrics[0] || 'Drill de 8oz';
    const newTpl: GarmentTemplate = { name: garmentName, fabric: defaultFabric, fabricColor: '' };
    setTemplateGarments(prev => [...prev, newTpl]);

    const isStd = /mandil|gorro|delantal|cofia|bandana/i.test(garmentName);
    setRoster(prev => prev.map(emp => ({
      ...emp,
      garments: [
        ...(emp.garments || []),
        {
          garmentName,
          fabric: defaultFabric,
          fabricColor: '',
          size: isStd ? 'STD' : 'M',
          measurements: {},
          services: [],
          pocketName: '',
          embroideries: []
        }
      ]
    })));
  };

  const handleRemoveTemplateGarment = (index: number) => {
    if (templateGarments.length <= 1) {
      alert("El pedido institucional debe incluir al menos 1 prenda.");
      return;
    }
    setTemplateGarments(prev => prev.filter((_, i) => i !== index));
    setRoster(prev => prev.map(emp => ({
      ...emp,
      garments: (emp.garments || []).filter((_, i) => i !== index)
    })));
  };

  const buildGarmentsForEmp = (size = 'M') =>
    templateGarments.map(gt => ({
      garmentName: gt.name,
      fabric: gt.fabric || 'Drill de 8oz',
      fabricColor: gt.fabricColor || '',
      size: /mandil|gorro|delantal|cofia|bandana/i.test(gt.name) ? 'STD' : size,
      measurements: {},
      services: []
    }));

  const handleAddSingleEmployee = () => {
    setRoster(prev => [
      ...prev,
      {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        fullName: '',
        phone: '',
        role: 'Personal',
        garments: buildGarmentsForEmp('M')
      }
    ]);
  };

  const handleGenerateBatch = () => {
    const count = Math.min(Math.max(parseInt(bulkCountInput, 10) || 1, 1), 300);
    const baseTs = Date.now();
    const newRows: InstitutionalEmployee[] = Array.from({ length: count }, (_, i) => ({
      id: `emp-${baseTs}-${i}-${Math.random().toString(36).substr(2, 6)}`,
      fullName: '',
      phone: '',
      role: 'Personal',
      garments: buildGarmentsForEmp(globalSizeInput || 'M')
    }));
    setRoster(prev => [...prev, ...newRows]);
  };

  const handleLoadExistingContacts = () => {
    if (!existingAccountContacts || existingAccountContacts.length === 0) {
      alert(`No se encontraron contactos previos vinculados a la cuenta ${companyName || accountId}.`);
      return;
    }

    const loaded: InstitutionalEmployee[] = existingAccountContacts.map((c, i) => ({
      id: `emp-exist-${c.contactId || c.id || i}`,
      contactId: c.contactId || c.id,
      fullName: c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`.trim() || `Empleado ${i+1}`,
      phone: c.phone || '',
      email: c.email || '',
      role: c.role || 'Personal',
      garments: templateGarments.map(gt => {
        const isStd = /mandil|gorro|delantal|cofia|bandana/i.test(gt.name);
        const sizingKey = `talla_${gt.name.toLowerCase().replace(/\s+/g, '_')}`;
        const savedSize = (c.sizingMatrix && typeof c.sizingMatrix[sizingKey] === 'string')
          ? (c.sizingMatrix[sizingKey] as string)
          : (isStd ? 'STD' : 'M');
        return {
          garmentName: gt.name,
          fabric: gt.fabric || 'Drill de 8oz',
          fabricColor: gt.fabricColor || '',
          size: savedSize,
          measurements: (c.sizingMatrix as Record<string, string | number>) || {},
          services: []
        };
      })
    }));

    setRoster(prev => {
      const existingNames = new Set(prev.map(p => p.fullName.trim().toLowerCase()).filter(Boolean));
      const filtered = loaded.filter(l => !existingNames.has(l.fullName.trim().toLowerCase()));
      return [...prev, ...filtered];
    });
  };

  const handleApplyGlobalSizeToAll = () => {
    setRoster(prev => prev.map(emp => ({
      ...emp,
      garments: (emp.garments || []).map(g => {
        const isStd = /mandil|gorro|delantal|cofia|bandana/i.test(g.garmentName);
        return { ...g, size: isStd ? 'STD' : globalSizeInput };
      })
    })));
  };

  const handleSaveAndClose = () => {
    const formattedRoster = roster.map((r, idx) => ({
      ...r,
      fullName: r.fullName && r.fullName.trim().length > 0 ? r.fullName.trim() : `Empleado #${idx + 1}`
    }));
    onConfirmSync(formattedRoster);
    onClose();
  };

  const activeEmpForModal = employeeRoster[measurementModalState.empIndex];
  const activeGarmentForModal = activeEmpForModal?.garments?.[measurementModalState.garmentIndex] || null;
  const totalGarmentsCalculated = employeeRoster.reduce((acc, emp) => acc + (emp.garments?.length || 0), 0);

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-[70] p-4 flex justify-center items-center overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-6xl rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 my-auto h-[90vh] max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <Users size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-stone-200 uppercase tracking-tight">
                    Nómina de Empleados y Tallas Institucionales
                  </h3>
                  {readOnly && (
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Lock size={11} /> Modo Lectura de Taller
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 font-medium flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400 font-bold">{companyName || 'Empresa Corporativa'}</span>
                  <span>•</span>
                  <span className="bg-stone-800 px-2 py-0.5 rounded text-[10px] font-mono text-stone-300">
                    {employeeRoster.length} Empleados ({totalGarmentsCalculated} Prendas Totales)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {readOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cerrar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                <Check size={16} /> Confirmar Asignación ({employeeRoster.length})
              </button>
            )}
            <button onClick={onClose} className="text-stone-500 hover:text-red-400 transition p-1 cursor-pointer">
              <X size={26} />
            </button>
          </div>
        </div>

        {/* Dynamic Template Bar */}
        <RosterGarmentTemplateBar
          templates={templateGarments}
          pricing={pricing}
          onUpdateTemplate={handleUpdateTemplate}
          onAddTemplateColumn={handleAddTemplateColumn}
          onRemove={handleRemoveTemplateGarment}
          readOnly={readOnly}
        />

        {/* Toolbar & Fast Action Controls */}
        {!readOnly && (
          <div className="bg-stone-950/80 border border-stone-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddSingleEmployee}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} /> + 1 Empleado
              </button>

              <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-1 gap-1">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={bulkCountInput}
                  onChange={e => setBulkCountInput(e.target.value)}
                  className="w-14 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-stone-200 outline-none text-center"
                />
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  Generar Filas
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowExcelImport(true)}
                className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Pegar desde Excel / Sheets
              </button>

              {existingAccountContacts && existingAccountContacts.length > 0 && (
                <button
                  type="button"
                  onClick={handleLoadExistingContacts}
                  className="px-3.5 py-2 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/60 text-purple-300 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers size={14} /> Cargar Contactos Existentes ({existingAccountContacts.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Talla Rápida:</span>
              <select
                value={globalSizeInput}
                onChange={e => setGlobalSizeInput(e.target.value)}
                className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-bold text-stone-200 outline-none"
              >
                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyGlobalSizeToAll}
                title="Aplica esta talla a todas las prendas entalladas de la nómina"
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-[10px] font-bold text-amber-400 rounded-lg uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} /> A Todos
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Table Section */}
        <div className="flex-1 min-h-[350px] flex flex-col overflow-hidden">
          <InstitutionalRosterTable
            roster={employeeRoster}
            setRoster={setRoster}
            garmentTemplates={templateGarments}
            clientType={clientType}
            onOpenCustomMeasurements={(empIndex, garmentIndex) => {
              setMeasurementModalState({ show: true, empIndex, garmentIndex });
            }}
            readOnly={readOnly}
          />
        </div>

        {/* Footer info and quick summary */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-500 pt-2 border-t border-stone-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cada empleado quedará registrado automáticamente en el CRM vinculado a esta empresa.</span>
          </div>
          <div className="flex items-center gap-3">
            {readOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cerrar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRoster([])}
                  className="text-[10px] text-red-500/80 hover:text-red-400 font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Limpiar Nómina
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Confirmar y Guardar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-modals */}
        <ExcelImportModal
          show={showExcelImport}
          onClose={() => setShowExcelImport(false)}
          onImport={importedRows => {
            setRoster(prev => [...prev, ...importedRows]);
          }}
          garmentTemplates={templateGarments}
        />

        <EmployeeCustomMeasurementsModal
          show={measurementModalState.show}
          onClose={() => setMeasurementModalState(prev => ({ ...prev, show: false }))}
          employeeName={activeEmpForModal?.fullName || `Empleado #${measurementModalState.empIndex + 1}`}
          garment={activeGarmentForModal}
          readOnly={readOnly}
          onSaveMeasurements={newMeasures => {
            if (readOnly) return;
            setRoster(prev => {
              const copy = [...prev];
              const emp = { ...copy[measurementModalState.empIndex] };
              const garments = [...(emp.garments || [])];
              if (garments[measurementModalState.garmentIndex]) {
                garments[measurementModalState.garmentIndex] = {
                  ...garments[measurementModalState.garmentIndex],
                  measurements: newMeasures,
                  size: 'A Medida'
                };
              }
              emp.garments = garments;
              copy[measurementModalState.empIndex] = emp;
              return copy;
            });
          }}
        />
      </div>
    </div>
  );
};
