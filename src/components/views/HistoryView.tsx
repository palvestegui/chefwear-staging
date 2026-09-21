import React, { useState } from 'react';
import { FileText, DollarSign, Eye, Trash2, Pencil } from 'lucide-react';
import { getOrderSellerName } from '../../utils/sellerUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Order } from '../../types';
import { OrderFinancialAdjustmentModal } from '../modals/OrderFinancialAdjustmentModal';

export interface HistoryViewProps {
  orders: any[];
  setViewingInvoiceId: (id: string | null) => void;
  setOrderToCollect: (order: any) => void;
  setManualAmount: (amount: string) => void;
  setManualReceipt: (receipt: any) => void;
  setViewingHistoryOrderId: (id: string | null) => void;
  setViewingReceiptId?: (id: string | null) => void;
  handleDeleteOrder: (id: string) => Promise<void>;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  normRole: (role?: string) => string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  orders,
  setViewingInvoiceId,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  setViewingHistoryOrderId,
  setViewingReceiptId,
  handleDeleteOrder,
  confirmDeleteId,
  setConfirmDeleteId,
  normRole
}) => {
  const { isSuperAdmin } = useAuth();
  const [adjustingFinancialOrder, setAdjustingFinancialOrder] = useState<Order | null>(null);

  const deliveredOrders = orders.filter(o => o.status === 'Entregado');
  const totalFinishedRevenue = deliveredOrders.reduce((a, b) => a + (Number(b.totalPrice) || 0), 0);
  const totalReceivables = deliveredOrders.reduce((a, b) => a + (Number(b.totalPrice || 0) - Number(b.amountCollected || 0)), 0);

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl">
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Total Ingresos Finalizados (Bs)</p>
          <p className="text-3xl font-black text-green-500 font-mono">Bs{totalFinishedRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl">
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Cuentas por Cobrar (Entregados) (Bs)</p>
          <p className="text-3xl font-black text-red-500 font-mono">Bs{totalReceivables.toFixed(2)}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl">
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Órdenes Entregadas</p>
          <p className="text-3xl font-black text-amber-500 font-mono">{deliveredOrders.length}</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-stone-800 bg-stone-900">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-stone-950 text-xs uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
            <tr>
              <th className="px-6 py-5 whitespace-nowrap">Info Pedido</th>
              <th className="px-6 py-5 whitespace-nowrap">Reporte Finanzas</th>
              <th className="px-6 py-5 text-right whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {deliveredOrders.map(order => (
              <tr key={order.id} className="hover:bg-stone-950/50 transition text-stone-300">
                <td className="px-6 py-5">
                  <p className="font-black text-stone-200 text-lg uppercase tracking-tight">{order.customer}</p>
                  <p className="text-xs font-bold text-amber-500 mt-1 uppercase tracking-widest">
                    {order.items?.length || 0} prendas · Vendedor: {getOrderSellerName(order)}
                  </p>
                </td>
                <td className="px-6 py-5 font-mono text-sm font-bold">
                  <p className="text-stone-400">Total: Bs{Number(order.totalPrice || 0).toFixed(2)}</p>
                  <p className="text-green-500">Cobrado: Bs{Number(order.amountCollected || 0).toFixed(2)}</p>
                  <p className="text-red-500">Saldo: Bs{Math.max(0, Number(order.totalPrice || 0) - Number(order.amountCollected || 0)).toFixed(2)}</p>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdjustingFinancialOrder(order)}
                      className="mt-2 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-lg font-black uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Pencil size={11} /> Ajustar Valores
                    </button>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => setViewingInvoiceId(order.id)} className="text-[10px] bg-stone-100 text-stone-900 px-3 py-1 rounded font-black uppercase tracking-widest hover:bg-white transition flex items-center gap-1">
                      <FileText size={12}/> Invoice
                    </button>
                    {setViewingReceiptId && order.paymentHistory && order.paymentHistory.some((p: any) => p.receipt) && (
                      <button onClick={() => setViewingReceiptId(order.id)} className="text-[10px] bg-stone-800 border border-stone-700 text-amber-500 px-3 py-1 rounded font-black uppercase tracking-widest hover:bg-stone-700 transition flex items-center gap-1">
                        <Eye size={12}/> Ver Recibos ({order.paymentHistory.filter((p: any) => p.receipt).length})
                      </button>
                    )}
                    {Number(order.totalPrice || 0) > Number(order.amountCollected || 0) && (
                      <button onClick={() => {
                        setOrderToCollect({ ...order, isBalance: true });
                        setManualAmount((Number(order.totalPrice || 0) - Number(order.amountCollected || 0)).toFixed(2));
                        setManualReceipt(null);
                      }} className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded font-black uppercase tracking-widest hover:bg-amber-500 transition flex items-center gap-1">
                        <DollarSign size={12}/> Cobrar
                      </button>
                    )}
                    <button onClick={() => setViewingHistoryOrderId(order.id)} className="text-[10px] text-stone-500 hover:text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1 ml-auto">
                      <Eye size={12}/> Historial
                    </button>
                    {normRole() === 'ADMIN' && (
                      confirmDeleteId === order.id ? (
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] bg-stone-800 text-stone-300 px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-stone-700 transition">
                            Cancelar
                          </button>
                          <button onClick={() => handleDeleteOrder(order.id)} className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-red-500 transition flex items-center gap-1">
                            <Trash2 size={12}/> Borrar Definitivo
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(order.id)} className="text-[10px] text-stone-600 hover:text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 ml-auto transition">
                          <Trash2 size={12}/> Eliminar Base de Datos
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adjustingFinancialOrder && (
        <OrderFinancialAdjustmentModal
          order={adjustingFinancialOrder}
          onClose={() => setAdjustingFinancialOrder(null)}
        />
      )}
    </div>
  );
};
