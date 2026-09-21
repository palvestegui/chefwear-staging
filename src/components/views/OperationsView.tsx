import React from 'react';
import * as LucideIcons from 'lucide-react';
const { 
  ImageIcon, FileText, CheckCircle, Lock, Eye, Users 
} = LucideIcons;
import { getOrderSellerName } from '../../utils/sellerUtils';
import { consolidateCommercialItems } from '../../utils/orderItemConsolidation';

export interface OperationsViewProps {
  orders: any[];
  getDocType: (order: any) => string;
  setViewingLogosOrderId: (id: string | null) => void;
  setViewingReceiptId: (id: string | null) => void;
  setViewingInvoiceId: (id: string | null) => void;
  isWriteDisabled: (view: string) => boolean;
  updateStatus: (id: string, status: string) => Promise<void>;
  setExpandedLogoUrl: (url: string | null) => void;
  onOpenEditRoster?: (order: any, readOnly?: boolean) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  orders,
  getDocType,
  setViewingLogosOrderId,
  setViewingReceiptId,
  setViewingInvoiceId,
  isWriteDisabled,
  updateStatus,
  setExpandedLogoUrl,
  onOpenEditRoster
}) => {
  const activeOrders = orders.filter(
    o => ['Inventario Pendiente', 'Orden Activa', 'Activo', 'Medidas Pendientes', 'Nombres Pendientes', 'Logo Pendiente', 'En Taller de Bordado'].includes(o.status) && getDocType(o) === 'ORDEN'
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-stone-900 rounded-3xl border border-stone-800 overflow-hidden shadow-xl overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-stone-950 text-xs uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
            <tr>
              <th className="px-6 py-5 whitespace-nowrap">Cliente / Vendedor</th>
              <th className="px-6 py-5 whitespace-nowrap">Prendas / Materiales</th>
              <th className="px-6 py-5 whitespace-nowrap">Finanzas</th>
              <th className="px-6 py-5 text-right whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {activeOrders.map(order => (
              <tr key={order.id} className="hover:bg-stone-950/50 transition">
                <td className="px-6 py-5">
                  <div className="font-black text-stone-200 text-lg uppercase tracking-tight">{order.customer}</div>
                  <div className="text-[10px] font-bold text-amber-500 uppercase mt-1 tracking-widest">Vendedor: {getOrderSellerName(order)} | {order.category}</div>
                  {order.logos && order.logos.length > 0 && (
                    <button onClick={() => setViewingLogosOrderId(order.id)} className="bg-[#1c1917] border border-stone-800 hover:bg-stone-900 text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 mt-2">
                      <ImageIcon size={12}/> Ver Logos ({order.logos.length})
                    </button>
                  )}
                </td>
                <td className="px-6 py-5 max-w-md">
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {consolidateCommercialItems(order.items || [], Boolean(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0) || (order.items || []).some((it: any) => Boolean(it.recipientName)))).map((i: any, idx: number) => (
                      <div key={idx} className="space-y-1 bg-stone-950/60 p-2.5 rounded-xl border border-stone-850">
                        {i.referenceImages && i.referenceImages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1">
                            {i.referenceImages.map((img: any, imgIdx: number) => (
                              <div key={imgIdx} className="relative group bg-stone-950 border border-stone-855 p-0.5 rounded flex items-center gap-1">
                                <img 
                                  src={img.url} 
                                  alt="Ref" 
                                  className="w-8 h-8 object-cover rounded border border-stone-800 cursor-zoom-in" 
                                  onClick={() => setExpandedLogoUrl(img.url)} 
                                />
                                {img.note && <span className="text-[8px] font-bold text-stone-400 max-w-[60px] truncate pr-1" title={img.note}>{img.note}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-stone-200 text-sm whitespace-nowrap">{i.qty}x {i.name}</span>
                          <span className="bg-stone-900 border border-stone-800 px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-black text-amber-500 tracking-wider font-sans">{i.fabric || 'Sin tela'}</span>
                          {i.fabricColor && (
                            <span className="bg-stone-900 border border-stone-800 px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-black text-stone-400 tracking-wider font-sans whitespace-nowrap">COLOR: {i.fabricColor}</span>
                          )}
                        </div>
                        {i.embroideries && i.embroideries.length > 0 && (
                          <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800 text-[10px] space-y-0.5 max-w-[280px]">
                            {i.embroideries.map((emb: string, eIdx: number) => {
                              const isBolsillo = emb.toLowerCase().includes('bolsillo');
                              return (
                                <div key={eIdx} className={`flex items-center gap-1.5 font-bold ${isBolsillo ? 'text-amber-400 font-extrabold' : 'text-stone-400'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBolsillo ? 'bg-amber-400 animate-pulse' : 'bg-stone-600'}`}></span>
                                  <span>{emb.startsWith('Otro:') ? emb.split('|')[0].replace('Otro:', '').trim() : emb}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1 text-sm font-mono font-bold">
                    <span className="text-stone-400">Total: Bs{Number(order.totalPrice || 0).toFixed(2)}</span>
                    <span className="text-green-500">Cobrado: Bs{Number(order.amountCollected || 0).toFixed(2)}</span>
                    {(() => {
                      const total = Number(order.totalPrice || 0);
                      const collected = Number(order.amountCollected || 0);
                      const diff = total - collected;
                      if (diff < -0.01) {
                        return <span className="text-emerald-400">A Favor: +Bs{Math.abs(diff).toFixed(2)}</span>;
                      }
                      if (diff > 0.01) {
                        return <span className="text-red-500">Saldo: Bs{diff.toFixed(2)}</span>;
                      }
                      return <span className="text-stone-500">Saldo: Bs0.00</span>;
                    })()}
                    {order.paymentHistory && order.paymentHistory.length > 0 && (
                      <button onClick={() => setViewingReceiptId(order.id)} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase tracking-widest font-black mt-2">
                        <Eye size={14}/> Ver Recibos ({order.paymentHistory.length})
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    {(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0)) && (
                      <button 
                        onClick={() => onOpenEditRoster?.(order, true)} 
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                        title="Ver lista de empleados y tallas"
                      >
                        <Users size={14}/> VER NÓMINA COMPLETA ({order.institutionalRoster?.length || 0})
                      </button>
                    )}
                    <button onClick={() => setViewingInvoiceId(order.id)} className="bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-800 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <FileText size={14}/> Ver Orden Completa
                    </button>
                    {!isWriteDisabled('operaciones') ? (
                      <button onClick={() => updateStatus(order.id, 'Material Listo')} className="bg-amber-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition shadow-lg flex items-center justify-center gap-2 ml-2 whitespace-nowrap">
                        Material comprado <CheckCircle size={14} />
                      </button>
                    ) : (
                      <span className="bg-stone-850 border border-stone-800 text-stone-500 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest select-none flex items-center justify-center gap-1.5 ml-2 cursor-not-allowed">
                        Solo Lectura <Lock size={12}/>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack View */}
      <div className="md:hidden space-y-4">
        {activeOrders.map(order => {
          const consolidated = consolidateCommercialItems(
            order.items || [],
            Boolean(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0) || (order.items || []).some((it: any) => Boolean(it.recipientName)))
          );
          const total = Number(order.totalPrice || 0);
          const collected = Number(order.amountCollected || 0);
          const diff = total - collected;

          return (
            <div key={order.id} className="bg-stone-900 border border-stone-800 p-4 rounded-2xl shadow-md space-y-3.5">
              {/* Header: Order ID + Client name + Seller badge */}
              <div className="space-y-1.5 border-b border-stone-800/80 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800 shrink-0">
                    {getOrderSellerName(order)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-stone-100 text-lg uppercase tracking-tight">{order.customer}</h3>
                  {order.category && (
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-950 px-2 py-0.5 rounded border border-stone-800 shrink-0">
                      {order.category}
                    </span>
                  )}
                </div>
                {order.logos && order.logos.length > 0 && (
                  <button
                    onClick={() => setViewingLogosOrderId(order.id)}
                    className="bg-stone-950 border border-stone-800 hover:bg-stone-800 text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5 mt-1"
                  >
                    <ImageIcon size={12} /> Ver Logos ({order.logos.length})
                  </button>
                )}
              </div>

              {/* Garments: Compact summary chips of items/materials */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {consolidated.map((i: any, idx: number) => (
                  <div key={idx} className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-850 space-y-1.5">
                    {i.referenceImages && i.referenceImages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {i.referenceImages.map((img: any, imgIdx: number) => (
                          <div key={imgIdx} className="relative group bg-stone-950 border border-stone-800 p-0.5 rounded flex items-center gap-1">
                            <img
                              src={img.url}
                              alt="Ref"
                              className="w-7 h-7 object-cover rounded cursor-zoom-in"
                              onClick={() => setExpandedLogoUrl(img.url)}
                            />
                            {img.note && <span className="text-[8px] font-bold text-stone-400 max-w-[60px] truncate pr-1" title={img.note}>{img.note}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-black text-stone-200 text-xs">{i.qty}x {i.name}</span>
                      <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-[10px] uppercase font-black text-amber-500">
                        {i.fabric || 'Sin tela'}
                      </span>
                    </div>
                    {i.fabricColor && (
                      <div className="text-[10px] font-bold text-stone-400">
                        Color: <span className="text-stone-300 uppercase">{i.fabricColor}</span>
                      </div>
                    )}
                    {i.embroideries && i.embroideries.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {i.embroideries.map((emb: string, eIdx: number) => {
                          const isBolsillo = emb.toLowerCase().includes('bolsillo');
                          return (
                            <span
                              key={eIdx}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                isBolsillo
                                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-black'
                                  : 'text-stone-400 bg-stone-900 border-stone-800'
                              }`}
                            >
                              {emb.startsWith('Otro:') ? emb.split('|')[0].replace('Otro:', '').trim() : emb}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Finance Strip: 3-column compact summary (Total | Cobrado | Saldo) */}
              <div className="grid grid-cols-3 gap-2 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800 text-center font-mono">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-stone-500 font-sans font-bold">Total</span>
                  <span className="text-xs font-bold text-stone-300">Bs{total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-stone-500 font-sans font-bold">Cobrado</span>
                  <span className="text-xs font-bold text-green-500">Bs{collected.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-stone-500 font-sans font-bold">Saldo</span>
                  <span className={`text-xs font-bold ${diff > 0.01 ? 'text-red-500' : diff < -0.01 ? 'text-emerald-400' : 'text-stone-400'}`}>
                    {diff < -0.01 ? `+Bs${Math.abs(diff).toFixed(2)}` : `Bs${Math.max(0, diff).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Action Footer: Stacked full-width touch buttons (Material Comprado, Ver Recibos, Ver Orden) */}
              <div className="flex flex-col gap-2 pt-1">
                {!isWriteDisabled('operaciones') ? (
                  <button
                    onClick={() => updateStatus(order.id, 'Material Listo')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
                  >
                    Material Comprado <CheckCircle size={14} />
                  </button>
                ) : (
                  <span className="w-full bg-stone-850 border border-stone-800 text-stone-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest select-none flex items-center justify-center gap-1.5 cursor-not-allowed">
                    Solo Lectura <Lock size={12} />
                  </span>
                )}
                {order.paymentHistory && order.paymentHistory.length > 0 && (
                  <button
                    onClick={() => setViewingReceiptId(order.id)}
                    className="w-full bg-stone-850 hover:bg-stone-800 text-amber-500 border border-stone-800 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                  >
                    <Eye size={13} /> Ver Recibos ({order.paymentHistory.length})
                  </button>
                )}
                <button
                  onClick={() => setViewingInvoiceId(order.id)}
                  className="w-full bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-800 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                >
                  <FileText size={13} /> Ver Orden Completa
                </button>
                {(order.isInstitutional || (order.institutionalRoster && order.institutionalRoster.length > 0)) && (
                  <button
                    onClick={() => onOpenEditRoster?.(order, true)}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                  >
                    <Users size={13} /> Ver Nómina Completa ({order.institutionalRoster?.length || 0})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
