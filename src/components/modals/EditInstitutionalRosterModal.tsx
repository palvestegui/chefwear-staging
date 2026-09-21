import React, { useState, useEffect } from 'react';
import { X, Users, Plus, FileSpreadsheet, Save, Loader2, Sparkles, Lock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { InstitutionalEmployee, expandRosterToOrderItems, provisionInstitutionalContacts } from '../../utils/institutionalOrderUtils';
import { ensureCorporateAccountExists } from '../../utils/accountContactMutations';
import { InstitutionalRosterTable } from './newOrder/InstitutionalRosterTable';
import { ExcelImportModal } from './newOrder/ExcelImportModal';
import { EmployeeCustomMeasurementsModal } from './newOrder/EmployeeCustomMeasurementsModal';
import { RosterGarmentTemplateBar, GarmentTemplate } from './roster/RosterGarmentTemplateBar';

interface EditInstitutionalRosterModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  db: any;
  pricing?: any;
  masterContacts?: any[];
  readOnly?: boolean;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'A Medida'];

export const EditInstitutionalRosterModal: React.FC<EditInstitutionalRosterModalProps> = ({
  order,
  isOpen,
  onClose,
  db,
  pricing,
  masterContacts = [],
  readOnly = false
}) => {
  const [roster, setRoster] = useState<InstitutionalEmployee[]>([]);
  const [bulkSize, setBulkSize] = useState<string>('M');
  const [bulkCountInput, setBulkCountInput] = useState<string>('5');
  const [showExcelImport, setShowExcelImport] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [customMeasureTarget, setCustomMeasureTarget] = useState<{
    empIndex: number;
    garmentIndex: number;
  } | null>(null);

  const [templates, setTemplates] = useState<GarmentTemplate[]>([]);

  useEffect(() => {
    if (!order || !isOpen) return;

    const seen = new Set<string>();
    const extractedTemplates: GarmentTemplate[] = [];

    if (order.institutionalRoster && Array.isArray(order.institutionalRoster) && order.institutionalRoster.length > 0) {
      const firstEmp = order.institutionalRoster[0];
      (firstEmp.garments || []).forEach((g: any) => {
        extractedTemplates.push({
          name: g.garmentName || 'Prenda',
          fabric: g.fabric || 'Drill de 8oz',
          fabricColor: g.fabricColor || ''
        });
      });
    } else if (order.items && order.items.length > 0) {
      order.items.forEach((it: any) => {
        const key = `${it.name}_${it.fabric || ''}_${it.fabricColor || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          extractedTemplates.push({
            name: it.name,
            fabric: it.fabric || 'Drill de 8oz',
            fabricColor: it.fabricColor || ''
          });
        }
      });
    }

    if (extractedTemplates.length === 0) {
      extractedTemplates.push({ name: 'Filipina', fabric: 'Drill de 8oz', fabricColor: '' });
    }
    setTemplates(extractedTemplates);

    if (order.institutionalRoster && Array.isArray(order.institutionalRoster) && order.institutionalRoster.length > 0) {
      setRoster(JSON.parse(JSON.stringify(order.institutionalRoster)));
    } else if (order.items && order.items.length > 0) {
      const empMap = new Map<string, InstitutionalEmployee>();
      order.items.forEach((it: any, idx: number) => {
        const empName = it.recipientName || `Empleado #${idx + 1}`;
        if (!empMap.has(empName)) {
          empMap.set(empName, {
            id: `emp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            fullName: it.recipientName || '',
            phone: it.recipientPhone || '',
            role: it.recipientRole || 'Personal',
            notes: it.recipientNotes || it.notes || '',
            garments: []
          });
        }
        const emp = empMap.get(empName)!;
        emp.garments.push({
          garmentName: it.name,
          fabric: it.fabric || 'Drill de 8oz',
          fabricColor: it.fabricColor || '',
          size: it.size || 'M',
          measurements: it.measurements || {},
          pocketName: it.pocketName || (it.embroideries?.[0] ? it.embroideries[0].replace('Nombre en Bolsillo: ', '') : ''),
          embroideries: it.embroideries || []
        });
      });
      setRoster(Array.from(empMap.values()));
    } else {
      setRoster([]);
    }
    setSaveSuccess(false);
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleUpdateTemplate = (idx: number, field: 'name' | 'fabric' | 'fabricColor', value: string) => {
    const updated = [...templates];
    if (!updated[idx]) return;
    updated[idx] = { ...updated[idx], [field]: value };
    setTemplates(updated);

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
    const availFabrics = pricing?.garments?.[garmentName] ? Object.keys(pricing.garments[garmentName]) : ['Drill de 8oz', 'Gabardina de 2da'];
    const defaultFabric = availFabrics[0] || 'Drill de 8oz';
    const newTpl = { name: garmentName, fabric: defaultFabric, fabricColor: '' };
    setTemplates(prev => [...prev, newTpl]);

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

  const handleRemoveTemplateColumn = (idx: number) => {
    if (templates.length <= 1) {
      alert("El pedido institucional debe incluir al menos 1 prenda.");
      return;
    }
    setTemplates(prev => prev.filter((_, i) => i !== idx));
    setRoster(prev => prev.map(emp => ({
      ...emp,
      garments: (emp.garments || []).filter((_, i) => i !== idx)
    })));
  };

  const buildGarments = (size = 'M') =>
    templates.map(gt => ({
      garmentName: gt.name,
      fabric: gt.fabric || 'Drill de 8oz',
      fabricColor: gt.fabricColor || '',
      size: /mandil|gorro|delantal|cofia|bandana/i.test(gt.name) ? 'STD' : size,
      measurements: {},
      pocketName: '',
      embroideries: []
    }));

  const handleAddEmployee = () => {
    setRoster(prev => [
      ...prev,
      {
        id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fullName: '',
        phone: '',
        role: 'Personal',
        notes: '',
        garments: buildGarments('M')
      }
    ]);
  };

  const handleGenerateBatch = () => {
    const count = Math.min(Math.max(parseInt(bulkCountInput, 10) || 1, 1), 300);
    const baseTs = Date.now();
    const newRows: InstitutionalEmployee[] = Array.from({ length: count }, (_, i) => ({
      id: `emp-${baseTs}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: '',
      phone: '',
      role: 'Personal',
      notes: '',
      garments: buildGarments(bulkSize || 'M')
    }));
    setRoster(prev => [...prev, ...newRows]);
  };

  const handleApplyBulkSize = () => {
    setRoster(prev =>
      prev.map(emp => ({
        ...emp,
        garments: (emp.garments || []).map(g => {
          const isStd = /mandil|gorro|delantal|cofia|bandana/i.test(g.garmentName);
          return { ...g, size: isStd ? 'STD' : bulkSize };
        })
      }))
    );
  };

  const handleSaveToOrder = async () => {
    if (!db || !order?.id) return;
    setIsSaving(true);

    try {
      const commonServices = order.services || [];
      const updatedItems = expandRosterToOrderItems(roster, commonServices);
      const finalItems = updatedItems.length > 0 ? updatedItems : order.items;

      let accountId = order.accountId || 'ACC-000';
      let companyName = order.companyName || order.customer || 'Corporativo';

      if (!accountId || accountId === 'create_new' || accountId.includes('NEW') || (accountId === 'ACC-000' && companyName !== 'Cliente Particular')) {
        try {
          const ensuredAcc = await ensureCorporateAccountExists({
            accountId,
            companyName,
            clientType: order.clientType || 'Empresa / Corporate',
            pricingTier: order.pricingTier || 'Estándar Raleo'
          }, [], db);
          accountId = ensuredAcc.accountId;
          companyName = ensuredAcc.accountName;
        } catch (err) {
          console.warn('Error ensuring account in EditInstitutionalRosterModal:', err);
        }
      }

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        institutionalRoster: roster,
        items: finalItems,
        accountId,
        companyName,
        isInstitutional: true,
        updatedAt: Date.now()
      });

      await provisionInstitutionalContacts(
        roster, 
        { accountId, companyName, clientType: order.clientType, pricingTier: order.pricingTier }, 
        masterContacts, 
        db
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error updating institutional roster on order:', err);
      setIsSaving(false);
    }
  };

  const currentEmpForMeasurements = customMeasureTarget !== null ? roster[customMeasureTarget.empIndex] : null;
  const currentGarmentForMeasurements = customMeasureTarget !== null && currentEmpForMeasurements ? currentEmpForMeasurements.garments?.[customMeasureTarget.garmentIndex] : null;

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-[110] p-4 flex justify-center items-center overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-6xl rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 my-auto h-[90vh] max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">
                  Gestionar Nómina de Empleados
                </h3>
                {readOnly && (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Lock size={11} /> Modo Lectura de Taller
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Orden #{order.id} • {order.customer} ({roster.length} empleados)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 bg-stone-950 border border-stone-800 rounded-2xl transition self-end sm:self-auto cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Template Bar */}
        <RosterGarmentTemplateBar
          templates={templates}
          pricing={pricing}
          onUpdateTemplate={handleUpdateTemplate}
          onAddTemplateColumn={handleAddTemplateColumn}
          onRemoveTemplateColumn={handleRemoveTemplateColumn}
          readOnly={readOnly}
        />

        {/* Action Toolbar */}
        {!readOnly && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 p-3 rounded-2xl border border-stone-800 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddEmployee}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} className="text-amber-400" /> + 1 Empleado
              </button>

              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1">
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
                  className="px-2.5 py-1 text-amber-400 hover:text-amber-300 text-[11px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Generar Filas
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowExcelImport(true)}
                className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Pegar desde Excel / Sheets
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Talla Rápida:</span>
              <select
                value={bulkSize}
                onChange={e => setBulkSize(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-400 outline-none focus:border-amber-500"
              >
                {AVAILABLE_SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyBulkSize}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} className="text-amber-400" /> A Todos
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Table Section */}
        <div className="flex-1 min-h-[350px] flex flex-col overflow-hidden">
          <InstitutionalRosterTable
            roster={roster}
            setRoster={setRoster}
            garmentTemplates={templates}
            availableSizes={AVAILABLE_SIZES}
            onOpenCustomMeasurements={(empIndex, garmentIndex) => {
              setCustomMeasureTarget({ empIndex, garmentIndex });
            }}
            readOnly={readOnly}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-stone-800 shrink-0">
          <div className="text-xs font-mono text-stone-400">
            {roster.filter(e => e.fullName.trim() !== '').length} de {roster.length} empleados con nombre asignado
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {readOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-black uppercase text-xs tracking-wider rounded-2xl transition cursor-pointer"
              >
                Cerrar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveToOrder}
                  className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Guardando...
                    </>
                  ) : saveSuccess ? (
                    <>✓ Nómina Actualizada</>
                  ) : (
                    <>
                      <Save size={16} /> Guardar y Sincronizar Orden
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ExcelImportModal
        show={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        garmentTemplates={templates}
        onImport={(imported) => {
          setRoster(imported);
          setShowExcelImport(false);
        }}
      />

      {currentEmpForMeasurements && currentGarmentForMeasurements && (
        <EmployeeCustomMeasurementsModal
          show={customMeasureTarget !== null}
          onClose={() => setCustomMeasureTarget(null)}
          employeeName={currentEmpForMeasurements.fullName || 'Empleado'}
          garment={currentGarmentForMeasurements}
          readOnly={readOnly}
          onSaveMeasurements={newMeasures => {
            if (readOnly) return;
            if (customMeasureTarget) {
              const { empIndex, garmentIndex } = customMeasureTarget;
              setRoster(prev => {
                const copy = [...prev];
                const emp = { ...copy[empIndex] };
                const garments = [...(emp.garments || [])];
                if (garments[garmentIndex]) {
                  garments[garmentIndex] = {
                    ...garments[garmentIndex],
                    measurements: newMeasures,
                    size: 'A Medida'
                  };
                }
                emp.garments = garments;
                copy[empIndex] = emp;
                return copy;
              });
            }
            setCustomMeasureTarget(null);
          }}
        />
      )}
    </div>
  );
};
