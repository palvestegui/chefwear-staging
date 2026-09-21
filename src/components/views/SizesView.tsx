import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
const { Ruler, Scissors, Save, CheckCircle, X } = LucideIcons;
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { INITIAL_SIZE_TABLE, INITIAL_SIZE_TABLE_PANTALON } from '../../utils/constants';

export interface SizesViewProps {
  garmentSizeTables: any;
  setGarmentSizeTables: React.Dispatch<React.SetStateAction<any>>;
  db: any;
}

export const SizesView: React.FC<SizesViewProps> = ({
  garmentSizeTables,
  setGarmentSizeTables,
  db
}) => {
  const { userProfile, isAdmin } = useAuth();
  const [sizeTableSuccessMsg, setSizeTableSuccessMsg] = useState<string | null>(null);

  const isRoleAdmin = isAdmin || userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPERADMIN' || userProfile?.role === 'GERENCIA_PRODUCCION';

  return (
    <div className="w-full space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-800 pb-6">
        <div>
          <h2 className="text-xl font-black text-stone-200 uppercase tracking-tight flex items-center gap-2">
            <Ruler className="text-amber-500" size={24} />
            Guía y Tablas de Tallas de Referencia
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Visualización y edición de rangos de medidas estándar (cm) utilizadas en cotizaciones e impresiones.
          </p>
        </div>
        {isRoleAdmin && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                localStorage.setItem('raleo_garment_size_tables', JSON.stringify(garmentSizeTables));
                try {
                  await setDoc(doc(db, 'settings', 'sizeTables'), garmentSizeTables);
                } catch(e){}
                setSizeTableSuccessMsg('¡Tablas de tallas guardadas con éxito!');
                setTimeout(() => setSizeTableSuccessMsg(null), 4000);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <Save size={16} /> Guardar Tablas
            </button>
          </div>
        )}
      </div>

      {sizeTableSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
            <span className="text-stone-200 font-semibold">{sizeTableSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setSizeTableSuccessMsg(null)} className="text-emerald-400/70 hover:text-emerald-200 transition">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Section 1: Filipina / Chaqueta Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="text-sm font-black text-stone-200 uppercase tracking-wider flex items-center gap-2">
            <Scissors size={16} className="text-amber-500" />
            Tabla de Medidas Estándar: Filipina / Chaqueta / Camisa
          </h3>
          <span className="text-[10px] font-bold text-stone-500 uppercase">{isRoleAdmin ? 'Edición de Rangos (cm)' : 'Rangos de Referencia (cm)'}</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                <th className="p-3.5 w-20">Talla</th>
                <th className="p-3.5">Hombro (cm)</th>
                <th className="p-3.5">Pecho (cm)</th>
                <th className="p-3.5">Cintura (cm)</th>
                <th className="p-3.5">Cadera (cm)</th>
                <th className="p-3.5">Largo (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300 font-bold font-mono">
              {(garmentSizeTables?.filipina || []).map((row: any, idx: number) => (
                <tr key={row.size} className="hover:bg-stone-900/40 transition">
                  <td className="p-3.5 font-black text-amber-500 font-sans text-sm">{row.size}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.hombro || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const nextF = [...prev.filipina];
                          nextF[idx] = { ...nextF[idx], hombro: val };
                          return { ...prev, filipina: nextF };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.pecho || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const nextF = [...prev.filipina];
                          nextF[idx] = { ...nextF[idx], pecho: val };
                          return { ...prev, filipina: nextF };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.cintura || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const nextF = [...prev.filipina];
                          nextF[idx] = { ...nextF[idx], cintura: val };
                          return { ...prev, filipina: nextF };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.cadera || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const nextF = [...prev.filipina];
                          nextF[idx] = { ...nextF[idx], cadera: val };
                          return { ...prev, filipina: nextF };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.largo || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const nextF = [...prev.filipina];
                          nextF[idx] = { ...nextF[idx], largo: val };
                          return { ...prev, filipina: nextF };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Pantalón Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="text-sm font-black text-stone-200 uppercase tracking-wider flex items-center gap-2">
            <Scissors size={16} className="text-amber-500" />
            Tabla de Medidas Estándar: Pantalón
          </h3>
          <span className="text-[10px] font-bold text-stone-500 uppercase">{isRoleAdmin ? 'Edición de Rangos (cm)' : 'Rangos de Referencia (cm)'}</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                <th className="p-3.5 w-20">Talla</th>
                <th className="p-3.5">Cintura (cm)</th>
                <th className="p-3.5">Cadera (cm)</th>
                <th className="p-3.5">Largo (cm)</th>
                <th className="p-3.5">Tiro (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300 font-bold font-mono">
              {(garmentSizeTables?.pantalon || INITIAL_SIZE_TABLE_PANTALON).map((row: any, idx: number) => (
                <tr key={row.size} className="hover:bg-stone-900/40 transition">
                  <td className="p-3.5 font-black text-amber-500 font-sans text-sm">{row.size}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.cintura !== undefined ? row.cintura : (row.cinturaMin ? `${row.cinturaMin} - ${row.cinturaMax} cm` : '')}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const baseList = prev?.pantalon || INITIAL_SIZE_TABLE_PANTALON;
                          const nextP = [...baseList];
                          nextP[idx] = { ...nextP[idx], cintura: val };
                          return { ...prev, pantalon: nextP };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.cadera || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const baseList = prev?.pantalon || INITIAL_SIZE_TABLE_PANTALON;
                          const nextP = [...baseList];
                          nextP[idx] = { ...nextP[idx], cadera: val };
                          return { ...prev, pantalon: nextP };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.largo !== undefined ? row.largo : (row.largoTotal || '')}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const baseList = prev?.pantalon || INITIAL_SIZE_TABLE_PANTALON;
                          const nextP = [...baseList];
                          nextP[idx] = { ...nextP[idx], largo: val };
                          return { ...prev, pantalon: nextP };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.tiro || ''}
                      readOnly={!isRoleAdmin}
                      onChange={(e) => {
                        if (!isRoleAdmin) return;
                        const val = e.target.value;
                        setGarmentSizeTables((prev: any) => {
                          const baseList = prev?.pantalon || INITIAL_SIZE_TABLE_PANTALON;
                          const nextP = [...baseList];
                          nextP[idx] = { ...nextP[idx], tiro: val };
                          return { ...prev, pantalon: nextP };
                        });
                      }}
                      className={`w-full bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono font-bold text-stone-200 outline-none ${isRoleAdmin ? 'focus:border-amber-500' : 'cursor-default opacity-90'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
