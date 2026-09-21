import React from 'react';
import { X, Eye } from 'lucide-react';

interface LogosModalProps {
  order: any;
  onClose: () => void;
  setExpandedLogoUrl: (url: string) => void;
}

export const LogosModal: React.FC<LogosModalProps> = ({ order, onClose, setExpandedLogoUrl }) => {
  if (!order || !order.logos || order.logos.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-[110] flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-[#1c1917] w-full max-w-3xl rounded-[2.5rem] p-8 border border-stone-800 shadow-2xl relative my-auto">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-stone-500 hover:text-white transition p-2 rounded-full hover:bg-stone-900"
        >
          <X size={24}/>
        </button>
        <div className="mb-6">
          <h3 className="text-2xl font-black text-stone-200 uppercase tracking-tighter">Logos del Pedido</h3>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mt-1">Cliente: {order.customer} | {order.category}</p>
          {order.companyName && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Empresa: {order.companyName}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {order.logos.map((logo: string, idx: number) => (
            <div key={idx} className="bg-stone-950 border border-stone-800 rounded-3xl p-4 flex flex-col justify-between items-center h-52 group relative overflow-hidden transition hover:border-amber-600/30">
              <div className="flex-1 flex items-center justify-center max-h-[80%] w-full">
                <img src={logo} className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
              </div>
              <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mt-2">Diseño #{idx + 1}</p>
              <button 
                onClick={() => setExpandedLogoUrl(logo)}
                className="absolute inset-0 bg-stone-950/90 gap-1.5 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] font-black uppercase text-amber-500 tracking-wider"
              >
                <Eye size={16} />
                <span>Ampliar Imagen</span>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t border-stone-850 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
