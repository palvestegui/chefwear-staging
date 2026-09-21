import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import { db } from '../../../firebase';
// from 'react';
import { 
  FileText, DollarSign, Ban, Lock, ImageIcon, ArrowRight, X, Download, Users, Trash2, Eye, Pencil 
} from 'lucide-react';
import { StatusBadge } from '../../ui/StatusBadge';
import { OrderReceiptDocument } from '../../ui/OrderReceiptDocument';
import { getOrderSellerName } from '../../../utils/sellerUtils';
import { 
  calculateVolumeScaledServiceUnitPrice, 
  calculateOrderWideLogoQuantity 
} from '../../../utils/embroideryPricingUtils';
import { consolidateCommercialItems } from '../../../utils/orderItemConsolidation';
import { OrderFinancialAdjustmentModal } from '../../modals/OrderFinancialAdjustmentModal';
import { Order } from '../../../types';

export interface ActiveOrdersListProps {
  orders: any[];
  pricing: any;
  getDocType: (order: any) => string;
  getCurrentProductionStatus: (order: any) => string;
  collapseUdiItems?: (items: any[]) => any[];
  getItemUnitPrice: (item: any, category?: string, accountId?: string) => number;
  getOrderBreakdown: (items: any[], category?: string, paymentMethod?: string, manualDiscount?: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => any,
  setOrderToCollect: (order: any) => void;
  setManualAmount: (amount: string) => void;
  setManualReceipt: (receipt: any) => void;
  setViewingInvoiceId: (id: string | null) => void;
  setViewingRefImagesOrderId: (id: string | null) => void;
  showWhatsappFormatId: string | null;
  setShowWhatsappFormatId: (id: string | null) => void;
  downloadOrderImage: (id: string, name: string, format: string, whatsappText: string) => void;
  getWhatsAppText: (order: any, isOrder?: boolean) => string;
  normRole: (role?: string) => string;
  setCancelActiveOrderModal: (modal: any) => void;
  setViewingReceiptId?: (id: string | null) => void;
  setCancelResolutionType: (type: string) => void;
  setCancelPartialRefund: (refund: any) => void;
  setCancelJustification: (just: string) => void;
  onOpenEditRoster?: (order: any) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  handleDeleteOrder: (id: string) => Promise<void>;
}

export const ActiveOrdersList: React.FC<ActiveOrdersListProps> = ({
  orders,
  pricing,
  getDocType,
  getCurrentProductionStatus,
  collapseUdiItems,
  getItemUnitPrice,
  getOrderBreakdown,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  setViewingInvoiceId,
  setViewingRefImagesOrderId,
  showWhatsappFormatId,
  setShowWhatsappFormatId,
  downloadOrderImage,
  getWhatsAppText,
  normRole,
  setCancelActiveOrderModal,
  setViewingReceiptId,
  setCancelResolutionType,
  setCancelPartialRefund,
  setCancelJustification,
  onOpenEditRoster,
  confirmDeleteId,
  setConfirmDeleteId,
  handleDeleteOrder
}) => {
  const { isSuperAdmin, isActualSuperAdmin } = useAuth();
  const [orderToRevert, setOrderToRevert] = useState<any>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [adjustingFinancialOrder, setAdjustingFinancialOrder] = useState<Order | null>(null);

  const activeOrders = orders.filter(o => 
    getDocType(o) === 'ORDEN' && 
    !['Entregado', 'Cancelado', 'Anulado', 'Expirado', 'Estimado', 'Cotización', 'Convertido'].includes(o.status)
  );

  if (activeOrders.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-stone-500 font-bold uppercase text-xs tracking-wider">
        No hay órdenes activas en curso
      </div>
    );
  }

  return (
    <>
      {activeOrders.map(order => {
        const total = (order.totalPrice !== undefined && order.totalPrice !== null)
          ? Number(order.totalPrice)
          : getOrderBreakdown(order.items || [], order.pricingTier || order.category || order.clientType, order.paymentMethod, order.manualDiscount || 0, order.clientType, order.accountId, order.migrationFlatDiscount || 0).total;
        const collected = Number(order.amountCollected || 0);
        const pending = Math.max(0, total - collected);

        return (
          <div key={order.id} id={`order-card-${order.id}`} className="bg-[#1c1917] border border-stone-800 p-6 flex flex-col rounded-3xl shadow-sm relative hover:border-stone-700 transition">
            <div className="flex justify-between items-start mb-6 border-b border-stone-800 pb-4">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-stone-200">Azafrán</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mt-1">Chefwear</p>
                <p className="text-xs font-mono font-bold text-amber-400 tracking-wider">#{order.id}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <StatusBadge status={order.status} />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-stone-950 px-2.5 py-1 rounded-lg">
                  {order.companyName ? order.companyName : order.category}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 border bg-amber-500/10 border-amber-500/30 text-amber-400">
                  PROD: {getCurrentProductionStatus(order)}
                </span>
              </div>
            </div>

            <h3 className="font-black text-xl mb-1 uppercase tracking-tighter text-stone-200">{order.customer}</h3>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-1">
              Vendedor: <span className="text-amber-400 font-black">{getOrderSellerName(order)}</span>
            </p>

            <div className="hidden-print" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <OrderReceiptDocument 
                order={order} 
                getDocType={getDocType}
                formatDate={(ts) => new Date(ts).toLocaleDateString('es-BO')}
                collapseUdiItems={collapseUdiItems}
                pricing={pricing}
                getItemUnitPrice={getItemUnitPrice}
                getOrderBreakdown={getOrderBreakdown}
              />
            </div>
            {/* Items */}
            <div className="bg-[#0c0a09] rounded-2xl p-4 border border-stone-800 space-y-2 mb-4 max-h-72 overflow-y-auto custom-scrollbar">
              {consolidateCommercialItems(order.items || [], Boolean(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0) || (order.items || []).some((it: any) => Boolean(it.recipientName)))).map((it: any, idx: number) => (
                <div key={idx} className="flex flex-col border-b border-stone-900 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 gap-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-stone-300">{it.qty}x {it.name} <span className="font-mono text-stone-500 font-bold">Bs{getItemUnitPrice(it, order.pricingTier || order.category || order.clientType, order.accountId).toFixed(2)}</span></p>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{it.fabric}{it.fabricColor ? ` - COLOR - ${it.fabricColor}` : ''}</p>
                    </div>
                    <p className="text-sm font-black text-stone-400 font-mono">Bs{(getItemUnitPrice(it, order.pricingTier || order.category || order.clientType, order.accountId) * (it.qty || 1)).toFixed(2)}</p>
                  </div>
                  {it.services && it.services.length > 0 && (
                     <div className="flex flex-col gap-1 pl-4 mt-1">
                        {it.services.filter(s => {
                           const srv = pricing?.services?.find(x => x.name === s && x.garment === it.name) || pricing?.services?.find(x => x.name === s && x.garment === 'Global') || pricing?.services?.find(x => x.name === s);
                           const hasCustomPrice = Boolean(it.customServicePrices && Number(it.customServicePrices[s]) > 0);
                           if (hasCustomPrice) return true;
                           return (!srv && s.toUpperCase().includes('LOGO')) || (srv && (srv.type === 'Costo Adicional' || srv.type === 'Costo Adicional Editable' || srv.type === 'Escala de Volumen (Logos)'));
                        }).map(s => {
                           let lbl = s;
                           if (s.toLowerCase().includes('bolsillo') && it.pocketName) lbl = `${s}: ${it.pocketName}`;
                           if (s === 'Bolsillos personalizados' && it.customPocketDetails) lbl = `${s}: ${it.customPocketDetails}`;
                           const srv = pricing?.services?.find(x => x.name === s && x.garment === it.name) || pricing?.services?.find(x => x.name === s && x.garment === 'Global') || pricing?.services?.find(x => x.name === s);
                                                      const isLogoFallback = !srv && s.toUpperCase().includes('LOGO');
                           
                           let customPrice = 0;
                           if (srv?.type === 'Escala de Volumen (Logos)' || isLogoFallback) {
                              if (it.customServicePrices && it.customServicePrices[s] !== undefined) {
                                 customPrice = Number(it.customServicePrices[s]) || 0;
                              } else {
                                 const pooledQty = calculateOrderWideLogoQuantity(order.items || [], s);
                                 customPrice = calculateVolumeScaledServiceUnitPrice(pooledQty || (it.qty || 1));
                              }
                           } else {
                              customPrice = (it.customServicePrices && it.customServicePrices[s] !== undefined) ? Number(it.customServicePrices[s]) : (srv?.price || 0);
                           }

                           return (
                              <div key={s} className="flex justify-between items-center">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">· {lbl} <span className="font-mono text-stone-600 font-bold ml-1">Bs{customPrice.toFixed(2)}</span></span>
                                 <span className="font-mono text-[10px] font-bold text-stone-400">Bs{(customPrice * (it.qty||1)).toFixed(2)}</span>
                              </div>
                           );
                        })}
                     </div>
                  )}
                </div>
              ))}
            </div>

            {/* Plazo */}
            <div className="mt-2 border-t border-stone-800 pt-2">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Plazo: {order.deliveryTime || '15 días hábiles'}</p>
            </div>

            {/* Resumen Financiero */}
            <div className="mt-auto border-t border-stone-800 pt-4 flex flex-col gap-2">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">Saldo Info</span>
                  <span className="text-[9px] font-bold text-stone-600 uppercase tracking-widest">{order.paymentMethod || '50/50 - Adelantado/Entrega'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-400 font-mono">Total: Bs{total.toFixed(2)}</p>
                  {collected > 0 && <p className="text-sm font-bold text-green-500 font-mono">Cobrado: Bs{collected.toFixed(2)}</p>}
                  <p className="text-xs font-black text-red-500 uppercase">Saldo: Bs{pending.toFixed(2)}</p>
                </div>
              </div>

              {/* Herramienta de Ajuste Financiero - STRICT ACCESS GUARD isSuperAdmin */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setAdjustingFinancialOrder(order)}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Pencil size={13} /> Ajustar Valores
                </button>
              )}

              {/* Botones de Acción */}
              <div className="order-actions-container flex flex-col gap-2 mt-4">
                {pending > 0 && (
                  <button onClick={() => {
                    setOrderToCollect({ ...order, isBalance: true });
                    setManualAmount(pending.toFixed(2));
                    setManualReceipt(null);
                  }} className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                    <DollarSign size={16}/> Cobrar Saldo (Bs{pending.toFixed(2)})
                  </button>
                )}
                
                                <button onClick={() => setViewingInvoiceId(order.id)} className="w-full bg-stone-100 hover:bg-white text-stone-900 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                  <FileText size={16}/> Ver Invoice / Resumen
                </button>
                
                {setViewingReceiptId && order.paymentHistory && order.paymentHistory.some((p: any) => p.receipt) && (
                  <button onClick={() => setViewingReceiptId(order.id)} className="w-full bg-stone-850 hover:bg-stone-800 text-amber-500 border border-stone-800 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 mt-2">
                    <Eye size={16}/> Ver Recibos ({order.paymentHistory.filter((p: any) => p.receipt).length})
                  </button>
                )}

                {(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0)) && (
                  <button 
                    onClick={() => onOpenEditRoster?.(order)} 
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users size={15}/> {order.institutionalRoster?.length ? `Nómina (${order.institutionalRoster.length} Empleados)` : '⚠️ Cargar Nómina Institucional'}
                  </button>
                )}

                {order.items && order.items.some((it: any) => it.referenceImages && it.referenceImages.length > 0) && (
                  <button onClick={() => setViewingRefImagesOrderId(order.id)} className="w-full bg-stone-850 hover:bg-stone-800 text-amber-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-stone-800">
                    <ImageIcon size={16}/> Ver Imágenes de Referencia ({order.items.reduce((acc: number, it: any) => acc + (it.referenceImages?.length || 0), 0)})
                  </button>
                )}

                {showWhatsappFormatId === order.id ? (
                  <div className="flex flex-col gap-2 p-3 bg-stone-900 border border-green-900/50 rounded-xl relative">
                    <button onClick={() => setShowWhatsappFormatId(null)} className="absolute top-2 right-2 text-stone-500 hover:text-white">
                      <X size={14} />
                    </button>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest text-center mb-1">Elige el formato a generar</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { downloadOrderImage(`invoice-${order.id}`, order.customer, 'pdf', getWhatsAppText(order, true)); setShowWhatsappFormatId(null); }} className="bg-green-900/40 text-green-400 hover:bg-green-800/60 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition">
                        <FileText size={14}/> PDF
                      </button>
                      <button onClick={() => { downloadOrderImage(`invoice-${order.id}`, order.customer, 'png', getWhatsAppText(order, true)); setShowWhatsappFormatId(null); }} className="bg-green-900/40 text-green-400 hover:bg-green-800/60 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition">
                        <Download size={14}/> PNG
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowWhatsappFormatId(order.id)} className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/50 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                    Enviar por WhatsApp <ArrowRight size={14}/>
                  </button>
                )}

                
                {isSuperAdmin && (
                  <button
                    onClick={() => setOrderToRevert(order)}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 mt-2"
                  >
                    ↩️ REVERTIR A COTIZACIÓN
                  </button>
                )}

                {isActualSuperAdmin && (
<button
                    onClick={() => {
                      setCancelActiveOrderModal({ open: true, order });
                      setCancelResolutionType('Devolución Total');
                      setCancelPartialRefund('');
                      setCancelJustification('');
                    }}
                    className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    <Ban size={16} /> Anular Orden (Admin)
                  </button>
)}
              </div>
            </div>
          </div>
        );
      })}

      {adjustingFinancialOrder && (
        <OrderFinancialAdjustmentModal
          order={adjustingFinancialOrder}
          onClose={() => setAdjustingFinancialOrder(null)}
        />
      )}
      {orderToRevert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isReverting && setOrderToRevert(null)}></div>
          <div className="relative bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-amber-500 text-2xl">⚠</span> ¿Revertir Orden a Cotización?
            </h3>
            <p className="text-sm text-stone-400 mb-8 leading-relaxed font-medium">
              La orden <strong className="text-stone-200">{orderToRevert.orderId || orderToRevert.id}</strong> volverá al estado de Cotización y se desvinculará del flujo de taller. Esta acción es reversible volviendo a cobrar y lanzar la orden.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrderToRevert(null)}
                disabled={isReverting}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isReverting}
                onClick={async () => {
                  setIsReverting(true);
                  try {
                    await updateDoc(doc(db, 'orders', orderToRevert.id), {
                      status: 'Cotización',
                      productionStatus: deleteField(),
                      timestamps: deleteField(),
                      docType: 'COTIZACION'
                    });
                    showSuccessToast(`✓ ¡Orden ${orderToRevert.orderId || orderToRevert.id} revertida a Cotización con éxito!`);
                    setOrderToRevert(null);
                  } catch (err: any) {
                    console.error(err);
                    showErrorToast('Error al revertir: ' + err.message);
                  } finally {
                    setIsReverting(false);
                  }
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center"
              >
                {isReverting ? 'Revirtiendo...' : 'Revertir a Cotización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
