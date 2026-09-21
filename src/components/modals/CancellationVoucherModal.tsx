import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { getOrderSellerName } from '../../utils/sellerUtils';
import { consolidateCommercialItems } from '../../utils/orderItemConsolidation';

interface CancellationVoucherModalProps {
  viewingCancellationVoucherId: string | null;
  setViewingCancellationVoucherId: (val: string | null) => void;
  orders: any[];
  showWhatsappFormatId: string | null;
  setShowWhatsappFormatId: (val: string | null) => void;
  getDocType: (order: any) => string;
  formatDate: (ts: string | number) => string;
  collapseUdiItems?: (items: any[]) => any[];
  getItemUnitPrice: (it: any, category: string, accountId?: string) => number;
  downloadOrderImage: (elementId: string, customerName: string, format: 'png' | 'pdf', wpText?: string) => void;
  getCancellationWhatsAppText: (order: any) => string;
}

export const CancellationVoucherModal: React.FC<CancellationVoucherModalProps> = ({
  viewingCancellationVoucherId,
  setViewingCancellationVoucherId,
  orders,
  showWhatsappFormatId,
  setShowWhatsappFormatId,
  getDocType,
  formatDate,
  collapseUdiItems,
  getItemUnitPrice,
  downloadOrderImage,
  getCancellationWhatsAppText
}) => {
  if (!viewingCancellationVoucherId) return null;
  const cancelledOrder = orders.find(o => o.id === viewingCancellationVoucherId);
  if (!cancelledOrder) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[100] flex justify-center items-start p-4 overflow-y-auto py-12">
      <div className="bg-white text-stone-950 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95">
        <div id={`cancellation-voucher-${cancelledOrder.id}`} className="p-10 bg-white" style={{ color: '#1c1917', backgroundColor: '#ffffff' }}>
          <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8 mb-8" style={{ borderColor: '#f5f5f4' }}>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-4xl font-black tracking-tighter uppercase leading-none" style={{ color: '#1c1917' }}>Azafrán</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1" style={{ color: '#a8a29e' }}>Chefwear</p>
              <p className="text-xs font-mono font-bold text-amber-400 tracking-wider">#{cancelledOrder.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-red-600" style={{ color: '#dc2626' }}>Comprobante de Anulación</p>
              <p className="text-sm font-mono font-bold mt-1" style={{ color: '#1c1917' }}>#{cancelledOrder.cancellationId || 'ANU-00001'}</p>
              <p className="text-[10px] font-mono text-stone-400 mt-0.5" style={{ color: '#a8a29e' }}>{getDocType(cancelledOrder) === 'COTIZACION' ? 'Ref. Cotización:' : 'Ref. Orden:'} #{cancelledOrder.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2" style={{ color: '#a8a29e' }}>Cliente</h4>
              <p className="text-2xl font-black uppercase tracking-tight" style={{ color: '#000000' }}>{cancelledOrder.customer}</p>
              <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1.5" style={{ color: '#57534e' }}>
                 {cancelledOrder.clientType || cancelledOrder.category} 
                 {cancelledOrder.parentAccountName ? ` - ${cancelledOrder.parentAccountName}` : (cancelledOrder.companyName ? ` - ${cancelledOrder.companyName}` : '')}
              </p>
            </div>
            <div className="sm:text-right text-left sm:mt-0 mt-4">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2" style={{ color: '#a8a29e' }}>Fecha de Anulación</h4>
              <p className="text-sm font-mono font-bold" style={{ color: '#1c1917' }}>{formatDate(cancelledOrder.cancellationDate || (cancelledOrder.canceledAt ? new Date(cancelledOrder.canceledAt).toISOString() : new Date().toISOString()))}</p>
              
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-6 mb-2" style={{ color: '#a8a29e' }}>Operador Responsable</h4>
              <p className="text-xs font-bold uppercase" style={{ color: '#57534e' }}>{cancelledOrder.cancelledBy || getOrderSellerName(cancelledOrder)}</p>
            </div>
          </div>

          <div className="mb-10 bg-red-50 p-6 rounded-2xl border border-red-100" style={{ backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
            <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3" style={{ color: '#dc2626' }}>Motivo de Anulación</h4>
            <p className="text-sm text-red-800 font-bold" style={{ color: '#991b1b' }}>{cancelledOrder.cancellationReason || 'No especificado'}</p>
            
            {cancelledOrder.cancellationResolution && cancelledOrder.cancellationResolution !== 'No aplica (Cotización)' && (
               <div className="mt-4 pt-4 border-t border-red-200" style={{ borderColor: '#fecaca' }}>
                 <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>Resolución de Pagos</h4>
                 <p className="text-sm text-red-800 font-bold" style={{ color: '#991b1b' }}>{cancelledOrder.cancellationResolution}</p>
               </div>
            )}
          </div>

          <div className="mb-10">
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 border-b-2 border-stone-100 pb-3" style={{ borderColor: '#f5f5f4', color: '#1c1917' }}>Detalle Original de Prendas</h4>
            <div className="space-y-0 opacity-60 grayscale">
              {consolidateCommercialItems(cancelledOrder.items || [], Boolean(cancelledOrder.isInstitutional || (cancelledOrder.institutionalRoster && cancelledOrder.institutionalRoster.length > 0) || (cancelledOrder.items || []).some((it: any) => Boolean(it.recipientName)))).map((it: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1 text-sm border-b border-stone-100 pb-3 mb-3 last:border-0" style={{ borderColor: '#f5f5f4' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-start">
                      <span className="font-black w-6 pt-[2px]" style={{ color: '#1c1917' }}>{it.qty}</span>
                      <div className="flex flex-col">
                        <span className="font-black uppercase tracking-tight line-through" style={{ color: '#1c1917' }}>{it.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#a8a29e' }}>{it.fabric}{it.fabricColor ? ` - COLOR - ${it.fabricColor}` : ''}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold line-through" style={{ color: '#1c1917' }}>Bs{(getItemUnitPrice(it, cancelledOrder.category, cancelledOrder.accountId) * (it.qty || 1)).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: '#fafaf9' }}>
             <div className="flex justify-between items-center text-stone-500" style={{ color: '#1c1917' }}>
               <span className="text-sm font-black uppercase tracking-widest">Total Original</span>
               <span className="font-mono text-2xl font-black line-through">Bs{Number(cancelledOrder.totalPrice || 0).toFixed(2)}</span>
             </div>
             {cancelledOrder.amountCollected > 0 && (
               <React.Fragment>
                 <div className="flex justify-between items-center text-red-600 border-t border-stone-200 pt-3 mt-1" style={{ color: '#dc2626', borderColor: '#e5e5e5' }}>
                   <span className="text-xs font-black uppercase tracking-widest">Monto Retenido / A Devolver</span>
                   <span className="font-bold text-base">Bs{Number(cancelledOrder.amountCollected || 0).toFixed(2)}</span>
                 </div>
               </React.Fragment>
             )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-100 flex gap-4 no-print" style={{ borderColor: '#f5f5f4' }}>
            {showWhatsappFormatId !== cancelledOrder.id && (
              <button onClick={() => downloadOrderImage(`cancellation-voucher-${cancelledOrder.id}`, cancelledOrder.customer, 'pdf')} className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition">
                <FileText size={16}/> Guardar PDF
              </button>
            )}
            <div className="flex gap-2">
              {showWhatsappFormatId === cancelledOrder.id ? (
                <div className="flex-1 flex gap-2 animate-in slide-in-from-bottom-2">
                  <button onClick={() => { downloadOrderImage(`cancellation-voucher-${cancelledOrder.id}`, cancelledOrder.customer, 'pdf', getCancellationWhatsAppText(cancelledOrder)); setShowWhatsappFormatId(null); }} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20b858] transition">
                    <FileText size={16}/> PDF
                  </button>
                  <button onClick={() => { downloadOrderImage(`cancellation-voucher-${cancelledOrder.id}`, cancelledOrder.customer, 'png', getCancellationWhatsAppText(cancelledOrder)); setShowWhatsappFormatId(null); }} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20b858] transition">
                    <Download size={16}/> PNG
                  </button>
                  <button onClick={() => setShowWhatsappFormatId(null)} className="px-6 bg-stone-200 text-stone-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-300 transition">
                    <X size={16}/>
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowWhatsappFormatId(cancelledOrder.id)} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20b858] transition">
                  Enviar por WhatsApp
                </button>
              )}
                
              {showWhatsappFormatId !== cancelledOrder.id && (
                <button onClick={() => setViewingCancellationVoucherId(null)} className="px-6 bg-stone-200 text-stone-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-300 transition">
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
