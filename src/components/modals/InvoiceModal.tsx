import { calculateVolumeScaledServiceUnitPrice } from '../../utils/pricingCalculator';
import { usePricingEngine } from '../../hooks/usePricingEngine';
import React, { useState } from 'react';
import { X, FileText, Download, Users, Receipt, UserPlus } from 'lucide-react';
import { getOrderSellerName } from '../../utils/sellerUtils';
import { InstitutionalPackingSlip } from './invoice/InstitutionalPackingSlip';
import { consolidateCommercialItems } from '../../utils/orderItemConsolidation';

interface InvoiceModalProps {
  viewingInvoice: any;
  setViewingInvoiceId: (val: string | null) => void;
  showWhatsappFormatId: string | null;
  setShowWhatsappFormatId: (val: string | null) => void;
  getDocType: (order: any) => string;
  formatDate: (ts: string | number) => string;
  collapseUdiItems?: (items: any[]) => any[];
  pricing: any;
  getItemUnitPrice: (it: any, category: string, accountId?: string) => number;
  getOrderBreakdown: (items: any[], category: string, paymentMethod: string, manualDiscount: number, clientType: string, accountId?: string, migrationFlatDiscount?: number) => any;
  downloadOrderImage: (elementId: string, customerName: string, format: 'png' | 'pdf', wpText?: string) => void;
  getWhatsAppText: (order: any, isOrder: boolean) => string;
  onOpenEditRoster?: (order: any) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  viewingInvoice,
  setViewingInvoiceId,
  showWhatsappFormatId,
  setShowWhatsappFormatId,
  getDocType,
  formatDate,
  pricing,
  getItemUnitPrice,
  getOrderBreakdown,
  downloadOrderImage,
  getWhatsAppText,
  onOpenEditRoster
}) => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'packing_slip'>('invoice');

  if (!viewingInvoice) return null;
  const { getServiceUnitPrice } = usePricingEngine(pricing);

  const breakdown = getOrderBreakdown(viewingInvoice.items || [], viewingInvoice.pricingTier || viewingInvoice.category || viewingInvoice.clientType, viewingInvoice.paymentMethod, viewingInvoice.manualDiscount, viewingInvoice.clientType, viewingInvoice.accountId, viewingInvoice.migrationFlatDiscount || 0);


  const isQuote = getDocType(viewingInvoice) === 'COTIZACION';
  const displayId = isQuote && !viewingInvoice.id.toLowerCase().startsWith('cot') ? viewingInvoice.id.replace(/^ord-/i, 'cot-') : viewingInvoice.id;
  const isInstitutional = Boolean(
    viewingInvoice.isInstitutional || 
    (viewingInvoice.institutionalRoster && viewingInvoice.institutionalRoster.length > 0) ||
    (viewingInvoice.items || []).some((it: any) => Boolean(it.recipientName))
  );

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[100] flex justify-center items-start p-4 overflow-y-auto py-12">
      <div className={`bg-white text-stone-950 w-full ${isInstitutional && activeTab === 'packing_slip' ? 'max-w-3xl' : 'max-w-xl'} rounded-[3rem] overflow-hidden shadow-2xl relative my-auto transition-all`}>
         {/* Institutional Tab & Action Switcher */}
         <div className="bg-stone-100 p-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 no-print px-4">
           <div className="flex items-center gap-2">
             <button
               type="button"
               onClick={() => setActiveTab('invoice')}
               className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                 activeTab === 'invoice'
                   ? 'bg-white text-stone-900 shadow-sm'
                   : 'text-stone-500 hover:text-stone-800'
               }`}
             >
               <Receipt size={14} /> Factura / Resumen
             </button>
             {isInstitutional && (
               <button
                 type="button"
                 onClick={() => setActiveTab('packing_slip')}
                 className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                   activeTab === 'packing_slip'
                     ? 'bg-white text-amber-700 shadow-sm'
                     : 'text-stone-500 hover:text-stone-800'
                 }`}
               >
                 <Users size={14} /> Planilla de Entrega ({viewingInvoice.institutionalRoster?.length || 0})
               </button>
             )}
           </div>

           {onOpenEditRoster && (
             <button
               type="button"
               onClick={() => onOpenEditRoster(viewingInvoice)}
               className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 bg-amber-500/10 text-amber-800 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer ml-auto"
               title="Cargar o editar la lista de empleados y tallas"
             >
               <UserPlus size={14} /> {isInstitutional ? 'Editar Nómina' : 'Cargar Nómina Institucional'}
             </button>
           )}
         </div>

         <div id={`invoice-${viewingInvoice.id}`} className="p-10 bg-white" style={{ color: '#1c1917', backgroundColor: '#ffffff' }}>
            {activeTab === 'packing_slip' ? (
              <InstitutionalPackingSlip order={viewingInvoice} formatDate={formatDate} />
            ) : (
              <>
             <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8 mb-8" style={{ borderColor: '#f5f5f4' }}>
              <div className="flex flex-col items-center text-center">
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none" style={{ color: '#1c1917' }}>Azafrán</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1" style={{ color: '#57534e' }}>Chefwear</p>
                <p className="text-xs font-mono font-bold text-amber-400 tracking-wider">#{displayId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-widest text-stone-500" style={{ color: '#44403c' }}>{getDocType(viewingInvoice) === 'COTIZACION' ? 'Cotización / Resumen' : 'Invoice / Resumen'}</p>
                <p className="text-sm font-mono font-bold mt-1">#{displayId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div>
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2" style={{ color: '#57534e' }}>Cliente</h4>
                <p className="text-2xl font-black uppercase tracking-tight" style={{ color: '#000000' }}>{viewingInvoice.customer}</p>
                <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1.5" style={{ color: '#57534e' }}>
                   {viewingInvoice.clientType || viewingInvoice.pricingTier || viewingInvoice.category} 
                   {viewingInvoice.parentAccountName ? ` - ${viewingInvoice.parentAccountName}` : (viewingInvoice.companyName ? ` - ${viewingInvoice.companyName}` : '')}
                </p>
                {viewingInvoice.phone && <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1" style={{ color: '#57534e' }}>Tel: {viewingInvoice.phone}</p>}
                {viewingInvoice.email && <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1" style={{ color: '#57534e' }}>Email: {viewingInvoice.email}</p>}
                {viewingInvoice.address && <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1" style={{ color: '#57534e' }}>Dir: {viewingInvoice.address}</p>}
              </div>
              <div className="sm:text-right text-left sm:mt-0 mt-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2" style={{ color: '#57534e' }}>Fecha y Hora</h4>
                <p className="text-sm font-mono font-bold" style={{ color: '#1c1917' }}>{formatDate(viewingInvoice.createdAt || Date.now())}</p>
                
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-6 mb-2" style={{ color: '#57534e' }}>Estado</h4>
                <p className={`text-sm font-black uppercase tracking-widest ${viewingInvoice.status === 'Estimado' ? 'text-stone-400' : 'text-amber-500'}`} style={{ color: viewingInvoice.status === 'Estimado' ? '#78716c' : '#f59e0b' }}>
                  {viewingInvoice.status}
                </p>
                
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-6 mb-2" style={{ color: '#57534e' }}>Vendedor</h4>
                <p className="text-xs font-bold uppercase" style={{ color: '#57534e' }}>{getOrderSellerName(viewingInvoice)}</p>
              </div>
            </div>

            <div className="mb-10">
              <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 border-b-2 border-stone-100 pb-3" style={{ borderColor: '#f5f5f4', color: '#1c1917' }}>Detalle de Prendas</h4>
              <div className="space-y-0">
                {consolidateCommercialItems(viewingInvoice.items || [], isInstitutional).map((it:any, idx:number) => (
                   <div key={idx} className="flex flex-col gap-1 text-sm border-b border-stone-100 pb-3 mb-3 last:border-0" style={{ borderColor: '#f5f5f4' }}>
                     <div className="flex justify-between items-start">
                       <div className="flex gap-4 items-start">
                         <span className="font-black w-6 pt-[2px]" style={{ color: '#1c1917' }}>{it.qty}</span>
                         <div className="flex flex-col">
                           <span className="font-black uppercase tracking-tight" style={{ color: '#1c1917' }}>{it.name} <span className="font-mono text-stone-400 font-bold" style={{ color: '#57534e' }}><span className="normal-case">Bs</span>{getItemUnitPrice(it, viewingInvoice.pricingTier || viewingInvoice.category || viewingInvoice.clientType, viewingInvoice.accountId).toFixed(2)}</span></span>
                           <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#57534e' }}>{it.fabric}{it.fabricColor ? ` - COLOR - ${it.fabricColor}` : ''}</span>
                         </div>
                       </div>
                       <span className="font-mono font-bold" style={{ color: '#1c1917' }}><span className="normal-case">Bs</span>{(getItemUnitPrice(it, viewingInvoice.pricingTier || viewingInvoice.category || viewingInvoice.clientType, viewingInvoice.accountId) * (it.qty || 1)).toFixed(2)}</span>
                     </div>
                     {it.services?.length > 0 && (
                       <div className="flex flex-col gap-1 pl-10">
                          {it.services.filter((s: string) => {
                             const srv = pricing.services?.find((x: any) => x.name === s && x.garment === it.name) || pricing.services?.find((x: any) => x.name === s && x.garment === 'Global') || pricing.services?.find((x: any) => x.name === s);
                             const hasCustomPrice = Boolean(it.customServicePrices && Number(it.customServicePrices[s]) > 0);
                             if (hasCustomPrice) return false;
                             return !srv || srv.type === 'Opción de Confección' || srv.type === 'Variante Base';
                          }).map((s:string) => {
                             let lbl = s;
                             if (s.toLowerCase().includes('bolsillo') && it.pocketName) lbl = `${s}: ${it.pocketName}`;
                             if (s === 'Bolsillos personalizados' && it.customPocketDetails) lbl = `${s}: ${it.customPocketDetails}`;
                             return (
                                <div key={s} className="flex justify-between items-center">
                                   <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#44403c' }}>· {lbl}</span>
                                </div>
                             );
                          })}
                       </div>
                     )}
                     {it.services?.length > 0 && (
                       <div className="flex flex-col gap-1 pl-10 mt-1">
                          {it.services.filter((s: string) => {
                             const srv = pricing.services?.find((x: any) => x.name === s && x.garment === it.name) || pricing.services?.find((x: any) => x.name === s && x.garment === 'Global') || pricing.services?.find((x: any) => x.name === s);
                             const hasCustomPrice = Boolean(it.customServicePrices && Number(it.customServicePrices[s]) > 0);
                             if (hasCustomPrice) return true;
                             return (!srv && s.toUpperCase().includes('LOGO')) || (srv && (srv.type === 'Costo Adicional' || srv.type === 'Costo Adicional Editable' || srv.type === 'Escala de Volumen (Logos)'));
                          }).map((s:string) => {
                             let lbl = s;
                             if (s.toLowerCase().includes('bolsillo') && it.pocketName) lbl = `${s}: ${it.pocketName}`;
                             if (s === 'Bolsillos personalizados' && it.customPocketDetails) lbl = `${s}: ${it.customPocketDetails}`;
                             const customPrice = (it.customServicePrices && it.customServicePrices[s] !== undefined && Number(it.customServicePrices[s]) > 0)
                                ? Number(it.customServicePrices[s])
                                : getServiceUnitPrice(s, it, viewingInvoice.items);
                             return (
                                <div key={s} className="flex justify-between items-center">
                                   <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#44403c' }}>· {lbl} <span className="font-mono text-stone-400 font-bold ml-1" style={{ color: '#57534e' }}><span className="normal-case">Bs</span>{customPrice.toFixed(2)}</span></span>
                                   <span className="font-mono text-[10px] font-bold" style={{ color: '#1c1917' }}><span className="normal-case">Bs</span>{(customPrice * (it.qty||1)).toFixed(2)}</span>
                                </div>
                             );
                          })}
                       </div>
                     )}
                     {it.embroideries && it.embroideries.length > 0 && (
                       <div className="flex flex-col gap-1 pl-10 mt-1">
                         {it.embroideries.map((emb: string, eIdx: number) => {
                           let embName = emb;
                           let embPrice = 0;
                           if (emb.startsWith('Otro:')) {
                             const parts = emb.split('|');
                             embName = parts[0].replace('Otro:', '').trim();
                             if (parts.length === 2) embPrice = parseFloat(parts[1]) || 0;
                           }
                           return (
                             <div key={`emb-${eIdx}`} className="flex justify-between items-center">
                               <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#44403c' }}>
                                 · {embName} {embPrice > 0 && <span className="font-mono text-stone-400 font-bold ml-1" style={{ color: '#57534e' }}><span className="normal-case">Bs</span>{embPrice.toFixed(2)}</span>}
                               </span>
                               {embPrice > 0 && (
                                 <span className="font-mono text-[10px] font-bold" style={{ color: '#1c1917' }}>
                                   <span className="normal-case">Bs</span>{(embPrice * (it.qty || 1)).toFixed(2)}
                                 </span>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     )}
                   </div>
                ))}
                {/* Render Discounts */}
                {(() => {
                   
                   if (breakdown.lines.length > 0) {
                     return (
                       <React.Fragment>
                         <div className="border-t border-stone-200 my-4" style={{ borderColor: '#e5e5e5' }}></div>
                         <div className="flex flex-col gap-2">
                           {breakdown.lines.map((line: any, lIdx: number) => (
                             <div key={lIdx} className="flex justify-between items-center">
                               <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#dc2626' }}>{line.label}</span>
                               <span className="font-mono text-[10px] font-bold" style={{ color: '#dc2626' }}>-<span className="normal-case">Bs</span>{line.amount.toFixed(2)}</span>
                             </div>
                           ))}
                         </div>
                       </React.Fragment>
                     );
                   }
                   return null;
                })()}
              </div>
            </div>

            {viewingInvoice.paymentHistory && viewingInvoice.paymentHistory.length > 0 && (
              <div className="mb-10">
                <h4 className="text-xs font-black uppercase tracking-widest mb-4 border-b-2 pb-3" style={{ borderColor: '#f5f5f4', color: '#1c1917' }}>
                  Historial de Pagos y Movimientos
                </h4>
                <div className="flex flex-col gap-3 text-xs font-bold">
                  {viewingInvoice.paymentHistory.map((p: any, idx: number) => {
                    const isNegative = Number(p.amount || 0) < 0;
                    let tendered = p.tendered !== undefined && p.tendered !== null ? Number(p.tendered) : null;
                    let change = p.change !== undefined && p.change !== null ? Number(p.change) : null;
                    const note = (p.note || '').trim();

                    if (tendered === null && note) {
                      const matchRecibido = note.match(/(?:Recibido|Entregado|Pag[oó] con)\s*(?:Bs\.?|BOB)?\s*([0-9]+(?:[.,][0-9]+)?)/i);
                      if (matchRecibido) tendered = parseFloat(matchRecibido[1].replace(',', '.'));
                    }
                    if (change === null && note) {
                      const matchVuelto = note.match(/(?:Vuelto|Cambio)(?: entregado)?:\s*(?:Bs\.?|BOB)?\s*([0-9]+(?:[.,][0-9]+)?)/i);
                      if (matchVuelto) change = parseFloat(matchVuelto[1].replace(',', '.'));
                    }

                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col border-b pb-3 last:border-0 last:pb-0" 
                        style={{ borderColor: '#f5f5f4' }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="uppercase font-black" style={{ color: isNegative ? '#059669' : '#1c1917' }}>
                              {isNegative ? 'Devolución / Vuelto' : `Abono ${idx + 1}`} · {formatDate(p.date)}
                            </span>
                            {p.method && (
                              <span 
                                className="text-[9px] font-bold px-2 py-0.5 rounded uppercase font-sans" 
                                style={{ backgroundColor: '#f5f5f4', color: '#44403c' }}
                              >
                                {p.method}
                              </span>
                            )}
                          </div>
                          <span 
                            className="font-mono text-sm font-black" 
                            style={{ color: isNegative ? '#059669' : '#16a34a' }}
                          >
                            {isNegative ? '-' : ''}Bs{Math.abs(Number(p.amount || 0)).toFixed(2)}
                          </span>
                        </div>

                        {/* Breakdown of Cash / Tendered & Change */}
                        {(tendered !== null || change !== null) && (
                          <div 
                            className="mt-1.5 px-3 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-mono"
                            style={{ backgroundColor: '#f5f5f4', color: '#44403c' }}
                          >
                            <div className="flex items-center gap-3">
                              {tendered !== null && (
                                <span>
                                  <strong style={{ color: '#1c1917' }}>Cliente pagó:</strong> Bs{tendered.toFixed(2)}
                                </span>
                              )}
                              {change !== null && change > 0.001 && (
                                <span style={{ color: '#059669' }}>
                                  • <strong style={{ color: '#047857' }}>Vuelto entregado:</strong> Bs{change.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-sans font-bold uppercase tracking-wider" style={{ color: '#44403c' }}>
                              {p.method || 'Efectivo'}
                            </span>
                          </div>
                        )}

                        {/* Note if informative and not duplicate */}
                        {note && 
                          !note.startsWith('Abono/Saldo - Pago') && 
                          !note.startsWith('Cobro Inicial') && 
                          !note.startsWith('Confirmación (Abono 50%)') && 
                          !note.startsWith('Abono Registrado') && (
                          <p className="text-[10px] font-normal mt-1 italic" style={{ color: '#44403c' }}>
                            Nota: {note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-stone-50 p-6 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: '#fafaf9' }}>
               <div className="flex justify-between items-center text-stone-500" style={{ color: '#57534e' }}>
                 <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                 <span className="font-mono text-sm font-bold"><span className="normal-case">Bs</span>{breakdown.subtotal.toFixed(2)}</span>
               </div>
               
               {breakdown.lines.map((line: any, idx: number) => (
                 <div key={idx} className="flex justify-between items-center" style={{ color: '#d97706' }}>
                   <span className="text-xs font-black uppercase tracking-widest">{line.label}</span>
                   <span className="font-bold">-<span className="normal-case">Bs</span>{line.amount.toFixed(2)}</span>
                 </div>
               ))}
               <div className="flex justify-between items-center text-stone-500" style={{ color: '#1c1917' }}>
                 <span className="text-sm font-black uppercase tracking-widest">Total General</span>
                 <span className="font-mono text-2xl font-black"><span className="normal-case">Bs</span>{breakdown.total.toFixed(2)}</span>
               </div>
               {viewingInvoice.status === 'Estimado' ? (
                 <React.Fragment>
                   <div className="flex justify-between items-center text-amber-600" style={{ color: '#d97706' }}>
                     <span className="text-xs font-black uppercase tracking-widest">Abono Mínimo (50%)</span>
                     <span className="font-bold text-base">Bs{viewingInvoice.paymentMethod === '100% Contado' ? breakdown.total.toFixed(2) : (breakdown.total * 0.5).toFixed(2)}</span>
                   </div>
                   
                   {(() => {
                     const breakdownCash = getOrderBreakdown(
                       viewingInvoice.items || [], 
                       viewingInvoice.pricingTier || viewingInvoice.category || viewingInvoice.clientType, 
                       '100% Contado', 
                       viewingInvoice.manualDiscount || 0, 
                       viewingInvoice.clientType,
                       viewingInvoice.accountId,
                       viewingInvoice.migrationFlatDiscount || 0
                     );
                     const cashPct = breakdownCash.cashDiscountPct || 10;
                     const cashTotal = breakdownCash.total;
                     const currentTotal = Number(viewingInvoice.totalPrice || breakdownCash.subtotal);
                     const savings = Math.max(0, currentTotal - cashTotal);

                     if (cashPct > 0 && savings > 0.01 && (viewingInvoice.paymentMethod || '50/50 - Adelantado/Entrega') !== '100% Contado') {
                       return (
                         <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mt-3" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                           <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-normal">
                             💡 ¡Ahorre {cashPct}% pagando todo al contado!
                             <br />
                             El total queda en <span className="font-mono font-black" style={{ color: '#1c1917' }}><span className="normal-case">Bs</span>{cashTotal.toFixed(2)}</span> (Ahorro: <span className="font-mono font-black text-amber-700" style={{ color: '#b45309' }}><span className="normal-case">Bs</span>{savings.toFixed(2)}</span>).
                           </p>
                         </div>
                       );
                     }
                     return null;
                   })()}
                 </React.Fragment>
               ) : (
                 <React.Fragment>
                   <div className="flex justify-between items-center text-green-600" style={{ color: '#16a34a' }}>
                     <span className="text-xs font-black uppercase tracking-widest">Monto Pagado</span>
                     <span className="font-bold text-base"><span className="normal-case">Bs</span>{Number(viewingInvoice.amountCollected || 0).toFixed(2)}</span>
                   </div>
                   {(() => {
                     const total = breakdown.total;
                     const collected = Number(viewingInvoice.amountCollected || 0);
                     const diff = total - collected;

                     if (diff < -0.01) {
                       const favor = Math.abs(diff);
                       return (
                         <div className="flex justify-between items-center text-emerald-600 border-t border-stone-200 pt-3" style={{ color: '#059669', borderColor: '#e5e5e5' }}>
                           <span className="text-xs font-black uppercase tracking-widest">Saldo a Favor</span>
                           <span className="font-bold text-base font-mono"><span className="normal-case">Bs</span>{favor.toFixed(2)}</span>
                         </div>
                       );
                     }

                     return (
                       <div className="flex justify-between items-center text-red-600 border-t border-stone-200 pt-3" style={{ color: '#dc2626', borderColor: '#e5e5e5' }}>
                         <span className="text-xs font-black uppercase tracking-widest">Saldo Pendiente</span>
                         <span className="font-bold text-base"><span className="normal-case">Bs</span>{Math.max(0, diff).toFixed(2)}</span>
                       </div>
                     );
                   })()}
                 </React.Fragment>
               )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-stone-100 flex gap-4 no-print" style={{ borderColor: '#f5f5f4' }}>
              {showWhatsappFormatId !== viewingInvoice.id && (
                <button onClick={() => downloadOrderImage(`invoice-${viewingInvoice.id}`, viewingInvoice.customer, 'pdf')} className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition">
                  <FileText size={16}/> Imprimir / Guardar PDF
                </button>
              )}
              <div className="flex gap-2">
                {showWhatsappFormatId === viewingInvoice.id ? (
                  <div className="flex-1 flex gap-2 animate-in slide-in-from-bottom-2">
                    <button onClick={() => { downloadOrderImage(`invoice-${viewingInvoice.id}`, viewingInvoice.customer, 'pdf', getWhatsAppText(viewingInvoice, viewingInvoice.status !== 'Estimado')); setShowWhatsappFormatId(null); }} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20b858] transition">
                      <FileText size={16}/> PDF
                    </button>
                    <button onClick={() => { downloadOrderImage(`invoice-${viewingInvoice.id}`, viewingInvoice.customer, 'png', getWhatsAppText(viewingInvoice, viewingInvoice.status !== 'Estimado')); setShowWhatsappFormatId(null); }} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20b858] transition">
                      <Download size={16}/> PNG
                    </button>
                    <button onClick={() => setShowWhatsappFormatId(null)} className="px-6 bg-stone-200 text-stone-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-300 transition">
                      <X size={16}/>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowWhatsappFormatId(viewingInvoice.id)} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20b858] transition">
                    Enviar por WhatsApp
                  </button>
                )}
                  
                {showWhatsappFormatId !== viewingInvoice.id && (
                  <button onClick={() => { setViewingInvoiceId(null); setShowWhatsappFormatId(null); }} className="px-6 bg-stone-200 text-stone-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-300 transition">Cerrar</button>
                )}
              </div>
           </div>
           </>
          )}
        </div>
      </div>
    </div>
  );
};
