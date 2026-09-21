import React from 'react';
import { X, Ruler, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ContactMeasurementsModalProps {
  contact: any | null;
  onClose: () => void;
  onEditContact: (contact: any) => void;
}

const MEASUREMENT_LABELS: Record<string, { label: string; group: 'filipina' | 'pantalon' | 'general' }> = {
  // Filipina / Upper body
  F_Hombros: { label: 'Hombros', group: 'filipina' },
  hombros: { label: 'Hombros', group: 'filipina' },
  F_Cuello: { label: 'Cuello', group: 'filipina' },
  cuello: { label: 'Cuello', group: 'filipina' },
  F_Largo_Brazo: { label: 'Largo de Brazo', group: 'filipina' },
  largoBrazo: { label: 'Largo de Brazo', group: 'filipina' },
  F_Ancho_Brazo: { label: 'Ancho de Brazo', group: 'filipina' },
  anchoBrazo: { label: 'Ancho de Brazo', group: 'filipina' },
  F_Ancho_Torso: { label: 'Ancho de Torso', group: 'filipina' },
  anchoTorso: { label: 'Ancho de Torso', group: 'filipina' },
  F_Largo_Torso: { label: 'Largo de Torso', group: 'filipina' },
  largoTorso: { label: 'Largo de Torso', group: 'filipina' },
  pecho: { label: 'Pecho / Busto', group: 'filipina' },
  espalda: { label: 'Espalda', group: 'filipina' },
  F_Cintura: { label: 'Cintura (Filipina)', group: 'filipina' },
  F_Cadera: { label: 'Cadera (Filipina)', group: 'filipina' },

  // Pantalón / Lower body
  P_Cintura: { label: 'Cintura (Pantalón)', group: 'pantalon' },
  cintura: { label: 'Cintura', group: 'pantalon' },
  P_Cadera: { label: 'Cadera (Pantalón)', group: 'pantalon' },
  cadera: { label: 'Cadera', group: 'pantalon' },
  P_Ancho_Pierna: { label: 'Ancho de Pierna', group: 'pantalon' },
  anchoPierna: { label: 'Ancho de Pierna', group: 'pantalon' },
  P_Largo_Pierna: { label: 'Largo de Pierna', group: 'pantalon' },
  largoPierna: { label: 'Largo de Pierna', group: 'pantalon' },
  tiro: { label: 'Tiro', group: 'pantalon' },

  // General
  estatura: { label: 'Estatura', group: 'general' },
  peso: { label: 'Peso', group: 'general' },
};

export const extractValidMeasurements = (contact: any): { key: string; label: string; value: string; group: string }[] => {
  if (!contact) return [];
  const raw = {
    ...(contact.measurements || {}),
    ...(contact.sizingMatrix12PtCM || {}),
    ...(contact.sizingMatrix || {})
  };

  const results: { key: string; label: string; value: string; group: string }[] = [];
  const seenLabels = new Set<string>();

  Object.entries(raw).forEach(([key, rawVal]) => {
    if (rawVal === undefined || rawVal === null) return;
    const strVal = String(rawVal).trim();
    if (!strVal || strVal === '0' || strVal === '0.0' || strVal === '--') return;

    const meta = MEASUREMENT_LABELS[key] || { 
      label: key.replace(/^[FP]_/, '').replace(/_/g, ' '), 
      group: key.startsWith('P_') ? 'pantalon' : (key.startsWith('F_') ? 'filipina' : 'general') 
    };

    if (!seenLabels.has(meta.label)) {
      seenLabels.add(meta.label);
      results.push({
        key,
        label: meta.label,
        value: strVal,
        group: meta.group
      });
    }
  });

  return results;
};

export const ContactMeasurementsModal: React.FC<ContactMeasurementsModalProps> = ({
  contact,
  onClose,
  onEditContact
}) => {
  if (!contact) return null;

  const validMeasurements = extractValidMeasurements(contact);
  const filipinaList = validMeasurements.filter(m => m.group === 'filipina');
  const pantalonList = validMeasurements.filter(m => m.group === 'pantalon');
  const generalList = validMeasurements.filter(m => m.group === 'general');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600/10 border border-amber-600/20 text-amber-500">
              <Ruler size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-100 uppercase tracking-tight">
                  Matriz de Medidas (12 Puntos)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-stone-800 text-stone-300 border border-stone-700">
                  {contact.contactId}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                {contact.fullName || contact.contactNombre || 'Contacto'} · <span className="text-amber-400 font-black">{contact.role || 'Particular'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {validMeasurements.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center bg-stone-950/60 rounded-2xl border border-stone-800/80 p-6">
              <AlertCircle size={36} className="text-stone-600 mb-3" />
              <p className="text-sm font-bold text-stone-300 uppercase tracking-wider">
                Sin medidas registradas
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Este contacto aún no tiene puntos de medida corporal ingresados en el sistema.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onEditContact(contact);
                }}
                className="mt-5 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2"
              >
                <Edit size={14} /> Registrar Medidas Ahora
              </button>
            </div>
          ) : (
            <>
              {/* Filipina Section */}
              {filipinaList.length > 0 && (
                <div className="bg-stone-950/80 rounded-2xl border border-stone-800 p-4">
                  <h4 className="text-[11px] font-black uppercase text-amber-500 tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-amber-500" />
                    Medidas Filipina / Chaqueta / Camisa
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filipinaList.map(item => (
                      <div key={item.key} className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-xl flex flex-col">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{item.label}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-mono font-black text-stone-100">{item.value}</span>
                          <span className="text-[10px] font-mono text-stone-500">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pantalón Section */}
              {pantalonList.length > 0 && (
                <div className="bg-stone-950/80 rounded-2xl border border-stone-800 p-4">
                  <h4 className="text-[11px] font-black uppercase text-amber-500 tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-amber-500" />
                    Medidas Pantalón
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {pantalonList.map(item => (
                      <div key={item.key} className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-xl flex flex-col">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{item.label}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-mono font-black text-stone-100">{item.value}</span>
                          <span className="text-[10px] font-mono text-stone-500">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Section */}
              {generalList.length > 0 && (
                <div className="bg-stone-950/80 rounded-2xl border border-stone-800 p-4">
                  <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-wider mb-3">
                    Medidas Generales / Corporales
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {generalList.map(item => (
                      <div key={item.key} className="bg-stone-900/90 border border-stone-800/80 p-2.5 rounded-xl flex flex-col">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{item.label}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-mono font-black text-stone-100">{item.value}</span>
                          <span className="text-[10px] font-mono text-stone-500">{item.key === 'peso' ? 'kg' : 'cm'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-stone-950 border-t border-stone-800 flex justify-between items-center">
          <span className="text-[10px] font-mono font-bold text-stone-500">
            Total medidas cargadas: <strong className="text-stone-300">{validMeasurements.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditContact(contact);
              }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
            >
              <Edit size={13} /> Editar Medidas
            </button>
            <button
              onClick={onClose}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
