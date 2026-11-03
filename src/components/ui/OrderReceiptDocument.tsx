import React from 'react';
import { calculateVolumeScaledServiceUnitPrice } from '../../utils/pricingCalculator';
import { usePricingEngine } from '../../hooks/usePricingEngine';
import { getOrderSellerName } from '../../utils/sellerUtils';
import { InstitutionalPackingSlip } from '../modals/invoice/InstitutionalPackingSlip';
import { consolidateCommercialItems } from '../../utils/orderItemConsolidation';

export const OrderReceiptDocument = ({
  order,
  getDocType,
  formatDate,
  collapseUdiItems,
  pricing,
  getItemUnitPrice,
  getOrderBreakdown,
  activeTab = 'invoice'
}: any) => {
  if (!order) return null;

  const { getServiceUnitPrice } = usePricingEngine(pricing);
  const breakdown = getOrderBreakdown(order.items || [], order.pricingTier || order.category || order.clientType, order.paymentMethod, order.manualDiscount, order.clientType, order.accountId, order.migrationFlatDiscount || 0);
  // Database Anchoring: If order.totalPrice is saved in Firestore, anchor to it; otherwise fallback to breakdown.total
  const displayTotal = Number(order.totalPrice || breakdown.total);


  const isInstitutional = Boolean(
    order.isInstitutional || 
    (order.institutionalRoster && order.institutionalRoster.length > 0) ||
    (order.items || []).some((it: any) => Boolean(it.recipientName))
  );

  const isQuote = getDocType(order) === 'COTIZACION';
  // If it's a quote, ensure the ID uses COT instead of ORD if we want.
  // Actually, the app uses whatever ID is generated (like ord-xxx or quote-xxx or 1234). 
  // Let's just prepend COT- if it's a quote, otherwise leave it. Or wait, the ID is already formatted in most places.
  // We'll just display it as is, or with COT if requested.
  const displayId = isQuote && !order.id.toLowerCase().startsWith('cot') ? order.id.replace(/^ord-/i, 'cot-') : order.id;

  return (
    <div id={`invoice-${order.id}`} className="p-10 bg-white relative" style={{ color: '#1c1917', backgroundColor: '#ffffff', width: '800px' }}>
      {activeTab === 'packing_slip' ? (
        <InstitutionalPackingSlip order={order} formatDate={formatDate} />
      ) : (
        <>
          <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8 mb-8" style={{ borderColor: '#f5f5f4' }}>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-4xl font-black tracking-tighter uppercase leading-none" style={{ color: '#1c1917' }}>Azafrán</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1" style={{ color: '#57534e' }}>Chefwear</p>
              <p className="text-xs font-mono font-bold text-amber-400 tracking-wider">#{displayId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-stone-500" style={{ color: '#44403c' }}>{isQuote ? 'Cotización / Resumen' : 'Invoice / Resumen'}</p>
              <p className="text-sm font-mono font-bold mt-1">#{displayId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2" style={{ color: '#57534e' }}>Cliente</h4>
              <p className="text-2xl font-black uppercase tracking-tight" style={{ color: '#000000' }}>{order.customer}</p>
              <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1.5" style={{ color: '#57534e' }}>
                 {order.clientType || order.pricingTier || order.category}
                  {order.parentAccountName ? ` - ${order.parentAccountName}` : (order.companyName ? ` - ${order.companyName}` : '')}
              </p>
              {order.phone && <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1" style={{ color: '#57534e' }}>Tel: {order.phone}</p>}
              {order.email && <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1" style={{ color: '#57534e' }}>Email: {order.email}</p>}
              {order.address && <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mt-1" style={{ color: '#57534e' }}>Dir: {order.address}</p>}
            </div>

            <div className="sm:text-right text-left sm:mt-0 mt-4">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2" style={{ color: '#57534e' }}>Fecha y Hora</h4>
              <p className="text-sm font-mono font-bold" style={{ color: '#1c1917' }}>{formatDate(order.createdAt || Date.now())}</p>
              
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-6 mb-2" style={{ color: '#57534e' }}>Estado</h4>
              <p className={`text-sm font-black uppercase tracking-widest ${order.status === 'Estimado' ? 'text-stone-400' : 'text-amber-500'}`} style={{ color: order.status === 'Estimado' ? '#78716c' : '#f59e0b' }}>
                {order.status}
              </p>
              
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-6 mb-2" style={{ color: '#57534e' }}>Vendedor</h4>
              <p className="text-xs font-bold uppercase" style={{ color: '#57534e' }}>{getOrderSellerName(order)}</p>
            </div>
          </div>

          <div className="mb-10">
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 border-b-2 border-stone-100 pb-3" style={{ borderColor: '#f5f5f4', color: '#1c1917' }}>Detalle de Prendas</h4>
            <div className="space-y-0">
              {consolidateCommercialItems(order.items || [], isInstitutional).map((it:any, idx:number) => (
                 <div key={idx} className="flex flex-col gap-1 text-sm border-b border-stone-100 pb-3 mb-3 last:border-0" style={{ borderColor: '#f5f5f4' }}>
                   <div className="flex justify-between items-start">
                     <div className="flex gap-4 items-start">
                       <span className="font-black w-6 pt-[2px]" style={{ color: '#1c1917' }}>{it.qty}</span>
                       <div className="flex flex-col">
                         <span className="font-black uppercase tracking-tight" style={{ color: '#1c1917' }}>{it.name} <span className="font-mono text-stone-400 font-bold" style={{ color: '#57534e' }}><span className="normal-case">Bs</span>{getItemUnitPrice(it, order.pricingTier || order.category || order.clientType, order.accountId).toFixed(2)}</span></span>
                         <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#57534e' }}>{it.fabric}{it.fabricColor ? ` - COLOR - ${it.fabricColor}` : ''}</span>
                       </div>
                     </div>
                     <span className="font-mono font-bold" style={{ color: '#1c1917' }}><span className="normal-case">Bs</span>{(getItemUnitPrice(it, order.pricingTier || order.category || order.clientType, order.accountId) * (it.qty || 1)).toFixed(2)}</span>
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
                              : getServiceUnitPrice(s, it, order.items);
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
              
              {(() => {
                 
                 if (breakdown.lines.length > 0) {
                   return (
                     <React.Fragment>
                       <div className="border-t border-stone-200 my-4" style={{ borderColor: '#e5e5e5' }}></div>
                       <div className="flex flex-col gap-2">
                         {breakdown.lines.map((line: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center" style={{ color: '#d97706' }}>
                             <span className="text-[10px] font-black uppercase tracking-widest">{line.label}</span>
                             <span className="font-mono text-xs font-bold">-<span className="normal-case">Bs</span>{line.amount.toFixed(2)}</span>
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

          <div className="mb-10">
             <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 border-b-2 border-stone-100 pb-3" style={{ borderColor: '#f5f5f4', color: '#1c1917' }}>Historial de Pagos y Movimientos</h4>
             {(!order.receipts || order.receipts.length === 0) ? (
               <p className="text-sm font-bold text-stone-400 uppercase tracking-widest" style={{ color: '#57534e' }}>Sin pagos registrados</p>
             ) : (
               <div className="space-y-4">
                 {order.receipts.map((rcpt: any, idx: number) => (
                   <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-stone-100 pb-3 last:border-0" style={{ borderColor: '#f5f5f4' }}>
                     <div className="flex items-center gap-3">
                       <span className="uppercase tracking-widest" style={{ color: '#1c1917' }}>Abono {idx + 1} &middot; {formatDate(rcpt.date)}</span>
                       <span className="text-[9px] bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-widest" style={{ backgroundColor: '#f5f5f4', color: '#57534e' }}>{rcpt.method}</span>
                     </div>
                     <span className="font-mono text-green-600" style={{ color: '#16a34a' }}><span className="normal-case">Bs</span>{Number(rcpt.amount).toFixed(2)}</span>
                   </div>
                 ))}
               </div>
             )}
          </div>

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

             <div className="flex justify-between items-center text-stone-900 mt-2 pt-4 border-t border-stone-200" style={{ color: '#1c1917', borderColor: '#e5e5e5' }}>
               <span className="text-sm font-black uppercase tracking-widest">Total General</span>
               <span className="font-mono text-2xl font-black"><span className="normal-case">Bs</span>{displayTotal.toFixed(2)}</span>
             </div>
             
             {(!isQuote || (order.amountCollected || 0) > 0) && (
               <>
                 <div className="flex justify-between items-center text-green-600 mt-2" style={{ color: '#16a34a' }}>
                   <span className="text-xs font-black uppercase tracking-widest">Monto Pagado</span>
                   <span className="font-bold"><span className="normal-case">Bs</span>{Number(order.amountCollected || 0).toFixed(2)}</span>
                 </div>
                 
                 <div className="flex justify-between items-center text-red-500 mt-2 border-t border-stone-200 pt-3" style={{ color: '#ef4444', borderColor: '#e5e5e5' }}>
                   <span className="text-xs font-black uppercase tracking-widest">Saldo Pendiente</span>
                   <span className="font-bold"><span className="normal-case">Bs</span>{Math.max(0, displayTotal - Number(order.amountCollected || 0)).toFixed(2)}</span>
                 </div>
               </>
             )}

             {isQuote && (
               <div className="mt-4 border-t border-stone-200 pt-4" style={{ borderColor: '#e5e5e5' }}>
                 <div className="flex justify-between items-center text-stone-500 mb-2" style={{ color: '#57534e' }}>
                   <span className="text-[10px] font-black uppercase tracking-widest">Condición de Pago</span>
                   <span className="font-bold text-xs uppercase tracking-widest">{order.paymentMethod || '50/50 - Adelantado/Entrega'}</span>
                 </div>
                 <div className="flex justify-between items-center text-stone-900" style={{ color: '#1c1917' }}>
                   <span className="text-[10px] font-black uppercase tracking-widest">Mínimo para confirmar orden</span>
                   <span className="font-bold text-base">Bs{(order.paymentMethod === '100% Contado' ? displayTotal : displayTotal * 0.5).toFixed(2)}</span>
                 </div>
                 
                 {(() => {
                   const breakdownCash = getOrderBreakdown(
                     order.items || [], 
                     order.pricingTier || order.category || order.clientType, 
                     '100% Contado', 
                     order.manualDiscount || 0, 
                     order.clientType,
                     order.accountId,
                     order.migrationFlatDiscount || 0
                   );
                   const cashPct = breakdownCash.cashDiscountPct || 10;
                   const cashTotal = breakdownCash.total;
                   const currentTotal = displayTotal;
                   const savings = Math.max(0, currentTotal - cashTotal);
                   if (cashPct > 0 && savings > 0.01 && (order.paymentMethod || '50/50 - Adelantado/Entrega') !== '100% Contado') {
                     return (
                       <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-center mt-6 shadow-sm" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                         <p className="text-lg font-black text-amber-900 tracking-widest leading-normal uppercase">
      ¡PAGA AL CONTADO Y AHORRA <span className="normal-case font-mono font-bold">Bs</span><span className="font-mono">{savings.toFixed(2)}</span>!
    </p>
    <p className="text-sm font-bold text-amber-800 mt-2 tracking-widest uppercase">
      TOTAL CON DCTO: <span className="normal-case font-mono font-bold">Bs</span><span className="font-mono">{cashTotal.toFixed(2)}</span>
    </p>
                       </div>
                     );
                   }
                   return null;
                 })()}
               </div>
             )}
          </div>
        </>
      )}
    </div>
  );
};
