import React, { useState } from 'react';
import { Ruler, X } from 'lucide-react';

export const QuickSizeModal = ({ onClose, garmentSizeTables }: { onClose: () => void, garmentSizeTables: any }) => {
  const [quickSizeFilter, setQuickSizeFilter] = useState<'filipina' | 'pantalon'>('filipina');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Ruler size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-200 uppercase tracking-tight">Tabla de Tallas de Referencia</h3>
              <p className="text-[11px] text-stone-500 font-medium">Rangos de medidas estándar en centímetros (cm)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-white p-2 rounded-xl transition hover:bg-stone-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Filter Toggle */}
        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 w-fit">
          <button
            type="button"
            onClick={() => setQuickSizeFilter('filipina')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              quickSizeFilter === 'filipina' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Filipina / Chaqueta
          </button>
          <button
            type="button"
            onClick={() => setQuickSizeFilter('pantalon')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              quickSizeFilter === 'pantalon' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Pantalón
          </button>
        </div>

        {/* Table Display */}
        <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950">
          {quickSizeFilter === 'filipina' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3">Talla</th>
                  <th className="p-3">Hombro</th>
                  <th className="p-3">Pecho</th>
                  <th className="p-3">Cintura</th>
                  <th className="p-3">Cadera</th>
                  <th className="p-3">Largo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 text-stone-300 font-bold font-mono">
                {garmentSizeTables.filipina.map((row: any) => (
                  <tr key={row.size} className="hover:bg-stone-900/50 transition">
                    <td className="p-3 font-black text-amber-500 font-sans">{row.size}</td>
                    <td className="p-3">{row.hombro}</td>
                    <td className="p-3">{row.pecho}</td>
                    <td className="p-3">{row.cintura}</td>
                    <td className="p-3">{row.cadera}</td>
                    <td className="p-3">{row.largo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3">Talla</th>
                  <th className="p-3">Cintura</th>
                  <th className="p-3">Cadera</th>
                  <th className="p-3">Largo</th>
                  <th className="p-3">Tiro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 text-stone-300 font-bold font-mono">
                {garmentSizeTables.pantalon.map((row: any) => (
                  <tr key={row.size} className="hover:bg-stone-900/50 transition">
                    <td className="p-3 font-black text-amber-500 font-sans">{row.size}</td>
                    <td className="p-3">{row.cintura}</td>
                    <td className="p-3">{row.cadera}</td>
                    <td className="p-3">{row.largo}</td>
                    <td className="p-3">{row.tiro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
