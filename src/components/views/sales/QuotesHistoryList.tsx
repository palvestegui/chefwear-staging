import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
// from 'react';
import * as LucideIcons from 'lucide-react';
const { 
  RefreshCw, Trash2, FileText, AlertTriangle, DollarSign, Receipt, Eye
} = LucideIcons;
import { StatusBadge } from '../../ui/StatusBadge';
import { getOrderSellerName } from '../../../utils/sellerUtils';
import { consolidateCommercialItems } from '../../../utils/orderItemConsolidation';

export interface QuotesHistoryListProps {
  orders: any[];
  ventasTab: string;
  ventasHistorialTimeframe: string;
  collapseUdiItems?: (items: any[]) => any[];
  getItemUnitPrice: (item: any, category?: string, accountId?: string) => number;
  handleReactivateQuote: (order: any) => Promise<void>;
  setViewingCancellationVoucherId: (id: string | null) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  handleDeleteOrder: (id: string) => Promise<void>;
  normRole: (role?: string) => string;
  setOrderToCollect?: (order: any) => void;
  setManualAmount?: (amount: string) => void;
  setManualReceipt?: (receipt: any) => void;
  setViewingReceiptId?: (id: string | null) => void;
  setViewingHistoryOrderId?: (id: string | null) => void;
  setViewingInvoiceId?: (id: string | null) => void;
}

export const QuotesHistoryList: React.FC<QuotesHistoryListProps> = ({
  orders,
  ventasTab,
  ventasHistorialTimeframe,
  collapseUdiItems,
  getItemUnitPrice,
  handleReactivateQuote,
  setViewingCancellationVoucherId,
  confirmDeleteId,
  setConfirmDeleteId,
  handleDeleteOrder,
  normRole,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  setViewingReceiptId,
  setViewingHistoryOrderId,
  setViewingInvoiceId
}) => {
  const { isSuperAdmin } = useAuth();

  const filteredOrders = orders.filter(o => {
    if (ventasTab === 'historial') {
      if (o.status !== 'Entregado') return false;
      const balance = Math.max(0, Number(o.totalPrice || 0) - Number(o.amountCollected || 0));
      if (balance <= 0.01) return false;
      const now = new Date();
      if (ventasHistorialTimeframe === 'semana') {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)).getTime();
        return o.createdAt >= weekStart;
      }
      if (ventasHistorialTimeframe === 'mes') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return o.createdAt >= monthStart;
      }
      return true;
    }
    if (ventasTab === 'sin_pendientes') {
      if (o.status !== 'Entregado') return false;
      const balance = Math.max(0, Number(o.totalPrice || 0) - Number(o.amountCollected || 0));
      if (balance > 0.01) return false;
      const now = new Date();
      if (ventasHistorialTimeframe === 'semana') {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)).getTime();
        return o.createdAt >= weekStart;
      }
      if (ventasHistorialTimeframe === 'mes') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return o.createdAt >= monthStart;
      }
      return true;
    }
    if (ventasTab === 'canceladas') return o.status === 'Cancelado' || o.status === 'Anulado';
    if (ventasTab === 'expiradas') return o.status === 'Expirado';
    return false;
  });

  if (filteredOrders.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-stone-500 font-bold uppercase text-xs tracking-wider">
        No hay registros en esta sección
      </div>
    );
  }

  const handleOpenCollect = (order: any, balance: number) => {
    if (!setOrderToCollect) return;
    setOrderToCollect({
      ...order,
      isBalance: true
    });
    if (setManualAmount) setManualAmount(balance.toFixed(2));
    if (setManualReceipt) setManualReceipt(null);
  };

  return (
    <>
      {filteredOrders.map(order => {
        const totalPrice = Number(order.totalPrice || 0);
        const collected = Number(order.amountCollected || 0);
        const pendingBalance = Math.max(0, totalPrice - collected);
        const hasPendingBalance = order.status === 'Entregado' && pendingBalance > 0.01;

        return (
          <div 
            key={order.id} 
            id={`order-card-${order.id}`} 
            className="bg-[#1c1917] border border-stone-800 p-6 flex flex-col rounded-3xl shadow-sm relative hover:border-stone-700 transition"
          >
            <div className="flex justify-between items-start mb-6 border-b border-stone-800 pb-4">
              <button 
                type="button"
                onClick={() => setViewingInvoiceId ? setViewingInvoiceId(order.id) : (setViewingHistoryOrderId && setViewingHistoryOrderId(order.id))}
                className="flex flex-col items-center text-center group cursor-pointer"
                title="Ver detalle completo de la orden"
              >
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-stone-200 group-hover:text-amber-400 transition">Azafrán</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mt-1">Chefwear</p>
                <p className="text-xs font-mono font-bold text-amber-400 tracking-wider group-hover:underline">#{order.id}</p>
              </button>
              <div className="text-right flex flex-col items-end gap-2">
                <StatusBadge status={order.status} />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-stone-950 px-2.5 py-1 rounded-lg">
                  {order.companyName ? order.companyName : order.category}
                </span>
                {hasPendingBalance && (
                  <button
                    type="button"
                    onClick={() => handleOpenCollect(order, pendingBalance)}
                    className="text-[10px] font-black text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-900/60 hover:border-red-600 px-2.5 py-1 rounded-lg uppercase tracking-widest mt-1 cursor-pointer transition flex items-center gap-1 shadow-sm"
                    title="Haga clic para cobrar el saldo pendiente"
                  >
                    <DollarSign size={11} /> SALDO: Bs{pendingBalance.toFixed(2)}
                  </button>
                )}
              </div>
            </div>

            <h3 
              onClick={() => setViewingInvoiceId ? setViewingInvoiceId(order.id) : (setViewingHistoryOrderId && setViewingHistoryOrderId(order.id))}
              className="font-black text-xl mb-1 uppercase tracking-tighter text-stone-200 cursor-pointer hover:text-amber-400 transition"
            >
              {order.customer}
            </h3>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-4">
              Vendedor: <span className="text-amber-400 font-black">{getOrderSellerName(order)}</span>
            </p>
            
            {order.status === 'Expirado' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl mb-4 text-center">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Cotización Expirada (Plazo de 20 días vencido)
                </p>
              </div>
            )}

            {/* Items */}
            <div className="bg-[#0c0a09] rounded-2xl p-4 border border-stone-800 space-y-2 mb-4 max-h-72 overflow-y-auto custom-scrollbar">
              {consolidateCommercialItems(order.items || [], Boolean(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0) || (order.items || []).some((it: any) => Boolean(it.recipientName)))).map((it: any, idx: number) => (
                <div key={idx} className="flex flex-col border-b border-stone-900 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 gap-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-stone-300">{it.qty}x {it.name}</p>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{it.fabric}{it.fabricColor ? ` - COLOR - ${it.fabricColor}` : ''}</p>
                    </div>
                    <p className="text-sm font-black text-stone-400 font-mono">Bs{(getItemUnitPrice(it, order.category, order.accountId) * (it.qty || 1)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones para Órdenes Entregadas */}
            {order.status === 'Entregado' && (
              <div className="order-actions-container flex flex-col gap-2 mt-2 pt-3 border-t border-stone-800/80">
                {hasPendingBalance ? (
                  <div className="flex gap-2 w-full">
                    <button 
                      type="button"
                      onClick={() => handleOpenCollect(order, pendingBalance)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <DollarSign size={15}/> Cobrar Saldo
                    </button>
                    {setViewingReceiptId && order.paymentHistory && order.paymentHistory.some((p: any) => p.receipt) && (
                      <button 
                        type="button"
                        onClick={() => setViewingReceiptId(order.id)}
                        className="bg-stone-900 hover:bg-stone-800 text-amber-500 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1 border border-stone-800"
                        title="Ver Recibos"
                      >
                        <Eye size={15}/> ({order.paymentHistory.filter((p: any) => p.receipt).length})
                      </button>
                    )}
                    {(setViewingInvoiceId || setViewingHistoryOrderId) && (
                      <button 
                        type="button"
                        onClick={() => setViewingInvoiceId ? setViewingInvoiceId(order.id) : setViewingHistoryOrderId!(order.id)}
                        className="bg-stone-900 hover:bg-stone-800 text-stone-300 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-1 border border-stone-800"
                        title="Ver Detalle de la Orden"
                      >
                        <Eye size={15}/>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    {(setViewingInvoiceId || setViewingHistoryOrderId) && (
                      <button 
                        type="button"
                        onClick={() => setViewingInvoiceId ? setViewingInvoiceId(order.id) : setViewingHistoryOrderId!(order.id)}
                        className="flex-1 bg-stone-900 hover:bg-stone-800 text-stone-200 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 border border-stone-800 cursor-pointer"
                      >
                        <FileText size={14}/> Ver Detalle
                      </button>
                    )}
                    {setViewingReceiptId && order.paymentHistory && order.paymentHistory.some((p: any) => p.receipt) && (
                      <button 
                        type="button"
                        onClick={() => setViewingReceiptId(order.id)}
                        className="flex-1 bg-stone-900 hover:bg-stone-800 text-amber-500 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 border border-stone-800"
                      >
                        <Eye size={14}/> Ver Recibos ({order.paymentHistory.filter((p: any) => p.receipt).length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Acciones para Expirados */}
            {order.status === 'Expirado' && (
              <div className="order-actions-container flex flex-col gap-2 mt-4">
                <button onClick={() => handleReactivateQuote(order)} className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                  <RefreshCw size={16}/> Reactivar Cotización
                </button>
              </div>
            )}

            {/* Acciones para Anulados/Cancelados */}
            {(order.status === 'Cancelado' || order.status === 'Anulado') && (
              <div className="order-actions-container flex flex-col gap-2 mt-4">
                <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl text-[10px] space-y-1">
                  <p className="font-bold text-red-400 uppercase">Motivo: <span className="text-stone-300 font-normal">{order.cancellationReason || order.cancelJustification || 'Sin motivo registrado'}</span></p>
                  {order.cancellationResolution && <p className="font-bold text-amber-500 uppercase">Resolución: <span className="text-stone-300 font-normal">{order.cancellationResolution}</span></p>}
                </div>
                <button
                  onClick={() => setViewingCancellationVoucherId(order.id)}
                  className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-stone-700"
                >
                  <FileText size={16} /> Ver Comprobante de Anulación
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

