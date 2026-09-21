import React from 'react';
import * as LucideIcons from 'lucide-react';
const { Lock } = LucideIcons;
import { StatusBadge } from '../ui/StatusBadge';

export interface LogisticsViewProps {
  orders: any[];
  isWriteDisabled: (view: string) => boolean;
  updateStatus: (id: string, status: string) => Promise<void>;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  orders,
  isWriteDisabled,
  updateStatus
}) => {
  return (
    <div className="w-full space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {orders.filter(o => ['Producido', 'En Entrega'].includes(o.status)).map(order => (
          <div key={order.id} className="bg-stone-900 border border-stone-800 p-6 rounded-3xl flex flex-col gap-6">
            <div className="flex justify-between">
              <h3 className="font-black text-xl text-stone-200 uppercase tracking-tight">{order.customer}</h3>
              <StatusBadge status={order.status} />
            </div>
            {order.status === 'Producido' && (
              !isWriteDisabled('logistica') ? (
                <button onClick={() => updateStatus(order.id, 'En Entrega')} className="bg-orange-600 text-white w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest mt-auto hover:bg-orange-500 transition">Iniciar Traslado</button>
              ) : (
                <div className="bg-[#431407]/40 border border-stone-800 text-stone-500 p-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 mt-auto select-none">
                  Solo Lectura <Lock size={12}/>
                </div>
              )
            )}
            {order.status === 'En Entrega' && (
              !isWriteDisabled('logistica') ? (
                <button onClick={() => updateStatus(order.id, 'Entregado')} className="bg-green-600 text-white w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest mt-auto hover:bg-green-500 transition">Confirmar Entrega</button>
              ) : (
                <div className="bg-[#064e3b]/40 border border-stone-800 text-stone-500 p-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 mt-auto select-none">
                  Solo Lectura <Lock size={12}/>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
