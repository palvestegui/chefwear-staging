import React from 'react';
import { X, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export const HistoryOrderModal = (props: any) => {
  const {
    viewingHistoryOrder: directOrder,
    viewingHistoryOrderId,
    orders = [],
    setViewingHistoryOrderId,
    setViewingInvoiceId,
    setOrderToCollect,
    setManualAmount,
    setManualReceipt
  } = props;

  const viewingHistoryOrder = directOrder || orders.find((o: any) => o.id === viewingHistoryOrderId);

  if (!viewingHistoryOrder) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] flex justify-center items-start p-4 overflow-y-auto py-8">
      <div className="bg-[#1c1917] w-full max-w-2xl rounded-[3rem] p-10 border border-stone-800 shadow-2xl relative my-auto">
        <button onClick={() => setViewingHistoryOrderId(null)} className="absolute top-8 right-8 text-stone-600 hover:text-white transition">
          <X size={28}/>
        </button>
        <div className="mb-10">
          <h2 className="text-3xl font-black text-stone-200 uppercase tracking-tighter leading-none mb-2">{viewingHistoryOrder.customer} - Historial</h2>
          <div className="flex items-center gap-4">
            <StatusBadge status={viewingHistoryOrder.status} />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">ID: {viewingHistoryOrder.id}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl">
             <div className="flex flex-col gap-1">
               <span className="text-[10px] uppercase text-stone-500 font-black tracking-widest">Finanzas</span>
               <div className="mt-2 space-y-2 font-mono text-sm">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] uppercase text-stone-500">Total Venta</span>
                   <span className="text-stone-300">Bs{viewingHistoryOrder.totalPrice.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] uppercase text-stone-500">Cobrado</span>
                   <span className={(Number(viewingHistoryOrder.amountCollected || 0)) >= (Number(viewingHistoryOrder.totalPrice || 0) - 0.1) ? 'text-green-500' : 'text-amber-500'}>
                     Bs{Number(viewingHistoryOrder.amountCollected || 0).toFixed(2)}
                   </span>
                 </div>
                 {(Number(viewingHistoryOrder.totalPrice || 0) - Number(viewingHistoryOrder.amountCollected || 0)) > 0.1 && (
                    <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                      <span className="text-[10px] uppercase text-red-500 font-bold">Saldo</span>
                      <span className="text-red-400 font-bold">
                        Bs{(Number(viewingHistoryOrder.totalPrice || 0) - Number(viewingHistoryOrder.amountCollected || 0)).toFixed(2)}
                      </span>
                    </div>
                 )}
               </div>
             </div>
           </div>
           
           <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl flex flex-col justify-center">
             <span className="text-[10px] uppercase text-stone-500 font-black tracking-widest mb-3">Fechas Clave</span>
             <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[9px] text-stone-600 font-bold uppercase">Creación</span>
                  <span className="text-xs font-mono text-stone-300">
                    {viewingHistoryOrder.createdAt ? new Date(viewingHistoryOrder.createdAt).toLocaleDateString() : 'Legado'}
                  </span>
                </div>
                {(viewingHistoryOrder.cancellationDate || viewingHistoryOrder.canceledAt) && (
                   <div className="flex flex-col">
                     <span className="text-[9px] text-red-800 font-bold uppercase">Cancelación</span>
                     <span className="text-xs font-mono text-red-500">
                       {viewingHistoryOrder.cancellationDate ? new Date(viewingHistoryOrder.cancellationDate).toLocaleDateString() : (viewingHistoryOrder.canceledAt ? new Date(viewingHistoryOrder.canceledAt).toLocaleDateString() : 'Desconocida')}
                     </span>
                   </div>
                )}
             </div>
           </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Línea de Tiempo (Estados)</h3>
          <div className="relative pl-4 border-l-2 border-stone-800 space-y-6">
            {viewingHistoryOrder.timestamps && Object.keys(viewingHistoryOrder.timestamps).length > 0 ? (
              Object.entries(viewingHistoryOrder.timestamps || {}).sort((a: any, b: any) => new Date(b[1]).getTime() - new Date(a[1]).getTime()).map(([status, time]: any) => (
                <div key={status} className="relative">
                  <div className="absolute -left-[23px] top-1 bg-[#1c1917] p-0.5 rounded-full">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs font-black text-stone-300 uppercase tracking-widest">{status}</p>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">{new Date(time).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-600 font-bold uppercase tracking-widest">No hay historial de estados registrado.</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
            <button onClick={() => setViewingInvoiceId(viewingHistoryOrder.id)} className="flex-1 bg-stone-100 hover:bg-white text-stone-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition shadow-lg flex items-center justify-center gap-2">
              <FileText size={16}/> Ver Resumen Completo
            </button>
            {(Number(viewingHistoryOrder.totalPrice || 0) - Number(viewingHistoryOrder.amountCollected || 0)) > 0.1 && (
              <button onClick={() => {
                setOrderToCollect({ ...viewingHistoryOrder, isBalance: true });
                setManualAmount((viewingHistoryOrder.totalPrice - (viewingHistoryOrder.amountCollected || 0)).toFixed(2));
                setManualReceipt(null);
              }} className="flex-1 bg-green-700 hover:bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2">
                <DollarSign size={16}/> Liquidar Saldo
              </button>
            )}
        </div>
      </div>
    </div>
  );
};
