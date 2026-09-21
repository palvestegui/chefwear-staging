import React, { useState } from 'react';
import { X, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseTsvRoster, InstitutionalEmployee } from '../../../utils/institutionalOrderUtils';

interface ExcelImportModalProps {
  show: boolean;
  onClose: () => void;
  onImport: (roster: InstitutionalEmployee[]) => void;
  garmentTemplates: Array<{ name: string; fabric?: string; fabricColor?: string }>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  show,
  onClose,
  onImport,
  garmentTemplates
}) => {
  const [pastedText, setPastedText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<InstitutionalEmployee[]>([]);

  if (!show) return null;

  const handleParse = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }
    const result = parseTsvRoster(text, garmentTemplates);
    setParsedPreview(result);
  };

  const handleConfirm = () => {
    if (parsedPreview.length === 0) {
      alert('No se detectaron filas válidas para importar.');
      return;
    }
    onImport(parsedPreview);
    setPastedText('');
    setParsedPreview([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-[80] p-4 flex justify-center items-center overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h4 className="text-base font-black text-stone-200 uppercase tracking-tight">
                Importación Rápida desde Excel / Google Sheets
              </h4>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Pega directamente columnas copiadas desde tu hoja de cálculo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-red-400 transition">
            <X size={22} />
          </button>
        </div>

        {/* Format Instruction */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl text-xs space-y-1.5 font-mono text-stone-400">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider font-sans">
            <AlertCircle size={14} /> Estructura de Columnas Sugerida:
          </div>
          <p className="text-[10px] text-stone-300">
            <span className="text-amber-300 font-bold">Columna 1:</span> Nombre Completo |{' '}
            <span className="text-amber-300 font-bold">Columna 2:</span> Teléfono / Celular |{' '}
            <span className="text-amber-300 font-bold">Columna 3:</span> Cargo / Puesto |{' '}
            <span className="text-emerald-400 font-bold">
              {garmentTemplates.length > 0 
                ? garmentTemplates.map((g, i) => `Col ${4+i}: Talla ${g.name}`).join(' | ') 
                : 'Col 4: Talla Filipina | Col 5: Talla Pantalón | Col 6: Talla Mandil'}
            </span>
          </p>
          <p className="text-[9px] text-stone-500 italic">
            * Se ignorará automáticamente la primera fila si contiene títulos como "Nombre", "Empleado", etc.
          </p>
        </div>

        {/* Text Area */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 block">
            Pegar Tabla (Ctrl + V / Cmd + V):
          </label>
          <textarea
            value={pastedText}
            onChange={e => handleParse(e.target.value)}
            rows={7}
            placeholder={`Juan Perez\t70012345\tChef Ejecutivo\tM\t32\tM\tChef Juan\nMaria Gomez\t70098765\tSub-Chef\tS\t28\tS\tMaria G.\nCarlos Rojas\t71234567\tMesero\tL\t34\tL\tCarlos`}
            className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 font-mono text-xs text-stone-200 focus:border-amber-500 outline-none placeholder:text-stone-700"
          />
        </div>

        {/* Live Preview */}
        {parsedPreview.length > 0 && (
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-emerald-400 px-1">
              <span>Vista Previa ({parsedPreview.length} Empleados Detectados)</span>
              <span>{parsedPreview.reduce((acc, curr) => acc + (curr.garments?.length || 0), 0)} Prendas</span>
            </div>
            <div className="divide-y divide-stone-900 text-xs font-mono">
              {parsedPreview.slice(0, 10).map((emp, i) => (
                <div key={i} className="py-1.5 px-2 flex justify-between items-center text-stone-300">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 font-bold text-[10px]">#{i + 1}</span>
                    <span className="font-bold text-stone-200">{emp.fullName}</span>
                    <span className="text-[10px] text-stone-500">({emp.role})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-amber-400">
                    {emp.garments.map((g, gi) => (
                      <span key={gi} className="bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                        {g.garmentName}: {g.size}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {parsedPreview.length > 10 && (
                <div className="py-1 text-center text-[10px] text-stone-500">
                  + {parsedPreview.length - 10} empleados más...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedPreview.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
          >
            <CheckCircle2 size={16} /> Importar {parsedPreview.length} Empleados
          </button>
        </div>
      </div>
    </div>
  );
};
