import React from 'react';
import { requiredFields, fieldLabels } from '../../../utils/constants';
import { Ruler, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export interface GarmentSizingSectionProps {
  newOrder: any;
  currentItem: any;
  setCurrentItem: React.Dispatch<React.SetStateAction<any>>;
  setShowQuickSizeModal: (val: boolean) => void;
}

export const GarmentSizingSection: React.FC<GarmentSizingSectionProps> = ({
  newOrder,
  currentItem,
  setCurrentItem,
  setShowQuickSizeModal,
}) => {
  const { userProfile } = useAuth();
  const isUdiMode = newOrder.accountId === 'ACC-001' || newOrder.category === 'UDI' || newOrder.clientType === 'Estudiante UDI';
  const hasRequirements = (requiredFields[currentItem.name] && requiredFields[currentItem.name].length > 0) || currentItem.name === 'Uniforme Completo UDI';
  if (!hasRequirements) return null;

  return (
    <div className="pt-4 border-t border-stone-800 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Modalidad de Talla</label>
            <button
              type="button"
              onClick={() => setShowQuickSizeModal(true)}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
              title="Ver Tabla de Tallas de Referencia"
            >
              <Ruler size={12} />
              <span>Tabla de Tallas</span>
            </button>
          </div>
          <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setCurrentItem((p: any) => ({ ...p, nonUdiSizingType: 'standard', sizingMode: 'Standard Size', measurements: {} }))}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                currentItem.nonUdiSizingType !== 'custom'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Talla Estándar (XS-3XL)
            </button>
            <button
              type="button"
              onClick={() => setCurrentItem((p: any) => ({ ...p, nonUdiSizingType: 'custom', sizingMode: 'Custom Tailored', size: '' }))}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                currentItem.nonUdiSizingType === 'custom'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Medidas Personalizadas (cm)
            </button>
          </div>
        </div>

        {currentItem.nonUdiSizingType === 'custom' ? (
          <div className="space-y-3">
            {userProfile?.role === 'VENTAS' && (currentItem.name || '').toLowerCase().includes('filipina') && (
              <div className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-xl flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-amber-400" />
                  Rol Ventas (Matías)
                </span>
                <span className="font-mono uppercase tracking-wider text-[9px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
                  8 Medidas Obligatorias (Solo Orden)
                </span>
              </div>
            )}
            
            {currentItem.name === 'Uniforme Completo UDI' ? (
              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 text-left">Medidas Filipina</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {requiredFields['Filipina'].map((m: string) => (
                      <div key={`filipina-${m}`} className="flex flex-col gap-1 text-left">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300 ml-1">
                          {fieldLabels[m] || m}
                        </span>
                        <input 
                          type="number" 
                          placeholder="0.0 cm" 
                          value={currentItem.measurements[m] || ''} 
                          onChange={e => setCurrentItem((p: any) => ({...p, measurements: {...p.measurements, [m]: e.target.value}}))} 
                          className="bg-stone-900 border border-stone-800 p-2.5 rounded-xl text-sm font-mono text-amber-500 placeholder:text-stone-700 outline-none focus:border-amber-500 w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-900">
                  <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 text-left">Medidas Pantalón</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {requiredFields['Pantalón'].map((m: string) => (
                      <div key={`pantalon-${m}`} className="flex flex-col gap-1 text-left">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300 ml-1">
                          {fieldLabels[m] || m}
                        </span>
                        <input 
                          type="number" 
                          placeholder="0.0 cm" 
                          value={currentItem.measurements[m] || ''} 
                          onChange={e => setCurrentItem((p: any) => ({...p, measurements: {...p.measurements, [m]: e.target.value}}))} 
                          className="bg-stone-900 border border-stone-800 p-2.5 rounded-xl text-sm font-mono text-amber-500 placeholder:text-stone-700 outline-none focus:border-amber-500 w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {(requiredFields[currentItem.name] || []).map((m: string) => (
                  <div key={m} className="flex flex-col gap-1 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300 ml-1">
                      {fieldLabels[m] || m}
                    </span>
                    <input 
                      type="number" 
                      placeholder="0.0 cm" 
                      value={currentItem.measurements[m] || ''} 
                      onChange={e => setCurrentItem((p: any) => ({...p, measurements: {...p.measurements, [m]: e.target.value}}))} 
                      className="bg-stone-900 border border-stone-800 p-2.5 rounded-xl text-sm font-mono text-amber-500 placeholder:text-stone-700 outline-none focus:border-amber-500 w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCurrentItem((p: any) => ({ ...p, size: s, sizingMode: 'Standard Size' }))}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition border ${
                  currentItem.size === s
                    ? 'bg-amber-600 text-white border-amber-500 shadow'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
