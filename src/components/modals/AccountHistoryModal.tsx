import React from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export interface AccountHistoryModalProps {
  viewingAccountHistoryId: string | null;
  setViewingAccountHistoryId: (id: string | null) => void;
  clientAccounts: any[];
  orders: any[];
  formatDate?: (date: any) => string;
}

export const AccountHistoryModal: React.FC<AccountHistoryModalProps> = ({
  viewingAccountHistoryId,
  setViewingAccountHistoryId,
  clientAccounts,
  orders,
  formatDate = (d: any) => new Date(d).toLocaleDateString()
}) => {
  if (!viewingAccountHistoryId) return null;

  const selectedAccount = clientAccounts.find(a => a.accountId === viewingAccountHistoryId);
  if (!selectedAccount) return null;

  const selectedAccountOrders = orders.filter(
    o => o.accountId === viewingAccountHistoryId || o.customer === selectedAccount.accountName
  );

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] flex justify-center items-start p-4 overflow-y-auto py-8">
      <div className="bg-[#1c1917] w-full max-w-4xl rounded-[3rem] p-10 border border-stone-800 shadow-2xl relative my-auto space-y-8 animate-in zoom-in">
        <button 
          onClick={() => setViewingAccountHistoryId(null)} 
          className="absolute top-8 right-8 text-stone-600 hover:text-white transition"
        >
          <X size={28}/>
        </button>
          
        <div>
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Historial de Cuenta
          </span>
          <h2 className="text-4xl font-black text-stone-200 uppercase tracking-tighter mt-3 mb-1">
            {selectedAccount.accountName}
          </h2>
          <p className="text-sm text-stone-500 font-bold uppercase tracking-widest font-mono">
            ID de Cuenta: {selectedAccount.accountId} | Tipo: {selectedAccount.accountType}
          </p>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {selectedAccountOrders.length > 0 ? (
            selectedAccountOrders.map((order: any) => (
              <div 
                key={order.id} 
                className="bg-stone-950 border border-stone-800 p-6 rounded-2xl space-y-4 text-stone-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">
                      {order.id}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-xs font-mono text-stone-500 flex items-center gap-1">
                      <Calendar size={12}/> {order.createdAt ? formatDate(order.createdAt) : '-'}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-sm text-stone-300">
                    Total: <span className="text-amber-400">Bs{Number(order.totalPrice || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {(order.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-200">
                        {item.qty}x {item.name} {item.fabric ? `(${item.fabric})` : ''}
                      </span>
                      <span className="font-mono text-stone-400">
                        Bs{Number(item.price || item.unitPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-900 text-xs font-mono">
                  <span className="text-stone-500">Cobrado: Bs{Number(order.amountCollected || 0).toFixed(2)}</span>
                  <span className={Number(order.totalPrice || 0) - Number(order.amountCollected || 0) > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                    Saldo: Bs{Math.max(0, Number(order.totalPrice || 0) - Number(order.amountCollected || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#0c0a09] rounded-3xl border border-stone-800 border-dashed">
              <p className="text-stone-500 font-black uppercase text-xs tracking-widest">No hay pedidos registrados para esta cuenta</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-800/60">
          <button 
            onClick={() => setViewingAccountHistoryId(null)} 
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};
