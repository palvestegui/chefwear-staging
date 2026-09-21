import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
// from 'react';
import * as LucideIcons from 'lucide-react';
const { 
  CheckCircle, Edit, ArrowRight, X, Download, FileText, Ban, Trash2 
} = LucideIcons;
import { StatusBadge } from '../../ui/StatusBadge';
import { OrderReceiptDocument } from '../../ui/OrderReceiptDocument';
import { getOrderSellerName } from '../../../utils/sellerUtils';
import { consolidateCommercialItems } from '../../../utils/orderItemConsolidation';

export interface QuotesListProps {
  orders: any[];
  pricing: any;
  db: any;
  getDocType: (order: any) => string;
  collapseUdiItems?: (items: any[]) => any[];
  getItemUnitPrice: (item: any, category?: string, accountId?: string) => number;
  getOrderBreakdown: (items: any[], category?: string, paymentMethod?: string, manualDiscount?: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => any,
  setOrderToCollect: (order: any) => void;
  setManualAmount: (amount: string) => void;
  setManualReceipt: (receipt: any) => void;
  handleEditQuote: (order: any) => void;
  showWhatsappFormatId: string | null;
  setShowWhatsappFormatId: (id: string | null) => void;
  downloadOrderImage: (id: string, name: string, format: string, whatsappText: string) => void;
  getWhatsAppText: (order: any, isOrder?: boolean) => string;
  setCancelQuoteModal: (modal: any) => void;
  setCancelResolutionType: (type: string) => void;
  setCancelPartialRefund: (refund: any) => void;
  setCancelJustification: (just: string) => void;
  setCancelQuoteReason: (reason: string) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  handleDeleteOrder: (id: string) => Promise<void>;
  normRole: (role?: string) => string;
}

export const QuotesList: React.FC<QuotesListProps> = ({
  orders,
  pricing,
  db,
  getDocType,
  collapseUdiItems,
  getItemUnitPrice,
  getOrderBreakdown,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  handleEditQuote,
  showWhatsappFormatId,
  setShowWhatsappFormatId,
  downloadOrderImage,
  getWhatsAppText,
  setCancelQuoteModal,
  setCancelResolutionType,
  setCancelPartialRefund,
  setCancelJustification,
  setCancelQuoteReason,
  confirmDeleteId,
  setConfirmDeleteId,
  handleDeleteOrder,
  normRole
}) => {
  const { isSuperAdmin, isActualSuperAdmin } = useAuth();
  const [quoteToDelete, setQuoteToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const quoteOrders = orders.filter(o => getDocType(o) === 'COTIZACION' && o.status !== 'Expirado' && o.status !== 'Cancelado');

  if (quoteOrders.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-stone-500 font-bold uppercase text-xs tracking-wider">
        No hay cotizaciones activas pendientes
      </div>
    );
  }

  return (
    <>
      {quoteOrders.map(order => {
        const breakdown = getOrderBreakdown(order.items || [], order.pricingTier || order.category || order.clientType, order.paymentMethod || '50/50 - Adelantado/Entrega', order.manualDiscount || 0, order.clientType, order.accountId, order.migrationFlatDiscount || 0);

        return (
          <div key={order.id} id={`order-card-${order.id}`} className="bg-[#1c1917] border border-stone-800 p-6 flex flex-col rounded-3xl shadow-sm relative hover:border-stone-700 transition">
            <div className="flex justify-between items-start mb-6 border-b border-stone-800 pb-4">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-stone-200">Azafrán</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mt-1">Chefwear</p>
                <p className="text-xs font-mono font-bold text-amber-400 tracking-wider">#{order.id}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <StatusBadge status={order.status || 'Cotización'} />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-stone-950 px-2.5 py-1 rounded-lg">
                  {order.companyName ? order.companyName : order.pricingTier || order.category}
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
                      <p className="text-sm font-black text-stone-300">{it.qty}x {it.name} <span className="font-mono text-stone-500 font-bold">Bs{getItemUnitPrice(it, order.pricingTier || order.category, order.accountId).toFixed(2)}</span></p>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{it.fabric}{it.fabricColor ? ` - COLOR - ${it.fabricColor}` : ''}</p>
                    </div>
                    <p className="text-sm font-black text-stone-400 font-mono">Bs{(getItemUnitPrice(it, order.pricingTier || order.category, order.accountId) * (it.qty || 1)).toFixed(2)}</p>
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
                           
                           // Using a generic calculation to avoid importing calculateVolumeScaledServiceUnitPrice directly here if not available,
                           // but wait, calculateVolumeScaledServiceUnitPrice is imported in utils? Let's just import it or do the math inline.
                           // Actually it's better to just require the calculation.
                           // Let's implement the fallback math inline if not found:
                           let customPrice = 0;
                           if (srv?.type === 'Escala de Volumen (Logos)' || isLogoFallback) {
                              const qty = it.qty || 1;
                              if (qty === 1) customPrice = 70;
                              else if (qty === 2) customPrice = 40;
                              else if (qty === 3) customPrice = 30;
                              else if (qty === 4) customPrice = 25;
                              else if (qty === 5) customPrice = 22;
                              else customPrice = 20;
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

              {breakdown.lines.length > 0 && (
                <div className="pt-2 mt-2 border-t border-stone-800 border-dashed space-y-1">
                  {breakdown.lines.map((line: any, lIdx: number) => (
                    <div key={lIdx} className="flex justify-between items-center">
                      <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{line.label}</span>
                      <span className="text-[9px] font-mono text-red-400">-Bs{line.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            
            {/* Discount Notice for 100% Contado */}
            {order.paymentMethod !== '100% Contado' && (
              <div className="mb-4 bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex flex-col items-center text-center">
                {(() => {
                  const bkCash = getOrderBreakdown(order.items || [], order.pricingTier || order.category || order.clientType, '100% Contado', order.manualDiscount || 0, order.clientType, order.accountId, order.migrationFlatDiscount || 0);
                  const currentTotal = breakdown.total;
                  const savings = Math.max(0, currentTotal - bkCash.total);
                  if (savings > 0) {
                    return (
                      <React.Fragment>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">¡Ahorra pagando al contado!</p>
                        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Si abonas el 100% hoy, pagas solo <span className="text-amber-400 font-mono normal-case">Bs{bkCash.total.toFixed(2)}</span> (Ahorras <span className="normal-case">Bs{savings.toFixed(2)}</span>)</p>
                      </React.Fragment>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            
            {/* Plazo */}
            <div className="mt-2 border-t border-stone-800 pt-2">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Plazo: {order.deliveryTime || '15 días hábiles'}</p>
            </div>

            {/* Totales y Anticipo */}
            <div className="mt-auto border-t border-stone-800 pt-4 flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest leading-tight flex-1 pr-4">
                    {order.paymentMethod === '100% Contado' ? 'Abonar 100% del total' : 'Abonar 50% de anticipo'}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-400 font-mono">Total: Bs{breakdown.total.toFixed(2)}</p>
                    <p className="text-sm font-black text-amber-500 uppercase mt-1">
                      Mínimo: Bs{order.paymentMethod === '100% Contado' ? breakdown.total.toFixed(2) : (breakdown.total * 0.5).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="order-actions-container flex flex-col gap-2 mt-4">
                <button onClick={() => {
                  const currentMethod = order.paymentMethod || '50/50 - Adelantado/Entrega';
                  const bk = getOrderBreakdown(order.items || [], order.pricingTier || order.category || order.clientType, currentMethod, order.manualDiscount || 0, order.clientType, order.accountId, order.migrationFlatDiscount || 0);
                  const total = bk.total;
                  setOrderToCollect({ ...order, paymentMethod: currentMethod, totalPrice: total });
                  const dueAmount = currentMethod === '100% Contado' ? total : (total * 0.5);
                  setManualAmount(dueAmount.toFixed(2));
                  setManualReceipt(null);
                }} className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                  <CheckCircle size={16}/> Cobrar y Convertir a Orden
                </button>

                <button onClick={() => handleEditQuote(order)} className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-stone-700">
                  <Edit size={16}/> Editar Cotización
                </button>
                
                {showWhatsappFormatId === order.id ? (
                  <div className="flex flex-col gap-2 p-3 bg-stone-900 border border-green-900/50 rounded-xl relative">
                    <button onClick={() => setShowWhatsappFormatId(null)} className="absolute top-2 right-2 text-stone-500 hover:text-white">
                      <X size={14} />
                    </button>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest text-center mb-1">Elige el formato a generar</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { downloadOrderImage(`invoice-${order.id}`, order.customer, 'pdf', getWhatsAppText(order, false)); setShowWhatsappFormatId(null); }} className="bg-green-900/40 text-green-400 hover:bg-green-800/60 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition">
                        <FileText size={14}/> PDF
                      </button>
                      <button onClick={() => { downloadOrderImage(`invoice-${order.id}`, order.customer, 'png', getWhatsAppText(order, false)); setShowWhatsappFormatId(null); }} className="bg-green-900/40 text-green-400 hover:bg-green-800/60 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition">
                        <Download size={14}/> PNG
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowWhatsappFormatId(order.id)} className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/50 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                     Enviar por WhatsApp <ArrowRight size={14}/>
                  </button>
                )}

                {isActualSuperAdmin && (
<>
<button onClick={() => {
                  setCancelQuoteModal({ open: true, order });
                  setCancelResolutionType('Devolución Total');
                  setCancelPartialRefund('');
                  setCancelJustification('');
                  setCancelQuoteReason('');
                }} className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                  <Ban size={16}/> Anular Cotización
                </button>
                    <button
                      onClick={() => setQuoteToDelete(order)}
                      className="w-full bg-red-900/20 hover:bg-red-800/40 text-red-500 border border-red-900/30 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 mt-2"
                    >
                      <Trash2 size={16} /> ELIMINAR (ADMIN)
                    </button>

</>
)}
              </div>
            </div>
          </div>
        );
      })}
      {quoteToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isDeleting && setQuoteToDelete(null)}></div>
          <div className="relative bg-stone-900 border border-red-900/50 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-red-500 text-2xl">⚠</span> ¿Eliminar Cotización Permanentemente?
            </h3>
            <p className="text-sm text-stone-400 mb-8 leading-relaxed font-medium">
              La cotización <strong className="text-stone-200">{quoteToDelete.orderId || quoteToDelete.id}</strong> de <strong className="text-stone-200">{quoteToDelete.clientName}</strong> será eliminada definitivamente de la base de datos sin registrar reportes de anulación. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                disabled={isDeleting}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const targetId = (quoteToDelete as any).id || (quoteToDelete as any).orderId;
                    await deleteDoc(doc(db, 'orders', targetId));
                    showSuccessToast('✓ ¡Cotización eliminada con éxito!');
                    setQuoteToDelete(null);
                  } catch (err: any) {
                    console.error(err);
                    showErrorToast('Error al eliminar: ' + err.message);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
