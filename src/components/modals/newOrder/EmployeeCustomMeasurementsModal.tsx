import React, { useState } from 'react';
import { X, Ruler, Check } from 'lucide-react';
import { GarmentAllocation } from '../../../utils/institutionalOrderUtils';
import { requiredFields, fieldLabels } from '../../../utils/constants';

interface EmployeeCustomMeasurementsModalProps {
  show: boolean;
  onClose: () => void;
  employeeName: string;
  garment: GarmentAllocation | null;
  onSaveMeasurements: (measurements: Record<string, string | number>) => void;
  readOnly?: boolean;
}

const resolveGarmentFields = (garmentName: string): string[] => {
  const norm = (garmentName || '').toLowerCase();
  if (norm.includes('pantalón') || norm.includes('pantalon')) {
    return requiredFields['Pantalón'] || ['cintura', 'cadera', 'anchoPierna', 'largoPierna'];
  }
  if (norm.includes('filipina') || norm.includes('chaqueta') || norm.includes('camisa')) {
    return requiredFields['Filipina'] || ['hombros', 'cuello', 'largoBrazo', 'anchoBrazo', 'anchoTorso', 'largoTorso', 'cintura', 'cadera'];
  }
  return requiredFields[garmentName] || ['hombros', 'cuello', 'largoBrazo', 'anchoBrazo', 'anchoTorso', 'largoTorso', 'cintura', 'cadera'];
};

export const EmployeeCustomMeasurementsModal: React.FC<EmployeeCustomMeasurementsModalProps> = ({
  show,
  onClose,
  employeeName,
  garment,
  onSaveMeasurements,
  readOnly = false
}) => {
  if (!show || !garment) return null;

  const fields = resolveGarmentFields(garment.garmentName);
  const [localMeasures, setLocalMeasures] = useState<Record<string, string | number>>(garment.measurements || {});

  const handleSave = () => {
    if (readOnly) {
      onClose();
      return;
    }
    onSaveMeasurements(localMeasures);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-sm z-[90] p-4 flex justify-center items-center overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Ruler size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-stone-200 uppercase tracking-tight">
                Medidas a Medida (cm)
              </h4>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                {employeeName} — {garment.garmentName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-red-400 transition">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 max-h-80 overflow-y-auto pr-1">
          {fields.map(f => (
            <div key={f} className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-stone-300 uppercase tracking-wider block">
                {fieldLabels[f] || f.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </label>
              <input
                type="number"
                step="0.5"
                disabled={readOnly}
                readOnly={readOnly}
                value={localMeasures[f] || ''}
                onChange={e => {
                  if (readOnly) return;
                  const val = e.target.value;
                  setLocalMeasures(prev => ({
                    ...prev,
                    [f]: val !== '' ? (parseFloat(val) || val) : ''
                  }));
                }}
                placeholder="0.0 cm"
                className={`w-full border rounded-xl p-2.5 font-mono text-sm font-bold outline-none ${
                  readOnly
                    ? 'bg-stone-950/60 border-stone-850 text-amber-400/90 cursor-default'
                    : 'bg-stone-950 border-stone-800 text-amber-500 placeholder:text-stone-700 focus:border-amber-500'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
          {readOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold uppercase transition hover:bg-stone-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
              >
                <Check size={14} /> Guardar Medidas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

