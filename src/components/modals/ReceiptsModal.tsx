import React, { useState } from 'react';
import { X, ImageIcon, ZoomIn, Download, CheckCircle2, CreditCard, DollarSign, ArrowUpRight, AlertCircle, HandCoins, ArrowDownRight } from 'lucide-react';
import { getOrderSellerName } from '../../utils/sellerUtils';

export const ReceiptsModal = ({
  viewingReceiptId,
  viewingReceipt: rawViewingReceipt,
  setViewingReceiptId,
  orders = [],
  formatDate = (d: any) => d ? new Date(d).toLocaleDateString() : '',
  setOrderToCollect,
  setManualAmount,
  setManualReceipt
}: any) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const order = rawViewingReceipt || (orders || []).find((o: any) => o.id === viewingReceiptId);

  if (!order) return null;

  const total = Number(order.totalPrice || 0);

  // Normalize payment history
  let history = Array.isArray(order.paymentHistory) ? [...order.paymentHistory] : [];
  if (history.length === 0 && (order.amountCollected || 0) > 0) {
    history = [{
      amount: order.amountCollected,
      date: order.timestamps?.['Estimado'] || order.timestamps?.['Orden Activa'] || order.createdAt || Date.now(),
      note: 'Cobro Inicial Registrado',
      method: order.paymentMethod || 'Transferencia',
      receipt: order.receipt || null,
      sellerName: getOrderSellerName(order)
    }];
  }

  const sumHistory = history.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
  const collected = history.length > 0 ? sumHistory : Number(order.amountCollected || 0);
  const diff = total - collected;
  const hasCreditInFavor = diff < -0.01;

  const handleDownload = (imgUrl: string, name: string) => {
    try {
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = `${name}_recibo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(imgUrl, '_blank');
    }
  };

  const handleOpenRefundModal = () => {
    if (!setOrderToCollect) return;
    const refundDue = Math.abs(diff);
    setOrderToCollect({
      ...order,
      isBalance: true,
      isRefundMode: true
    });
    if (setManualAmount) setManualAmount(refundDue.toFixed(2));
    if (setManualReceipt) setManualReceipt(null);
    setViewingReceiptId(null);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4"
        onClick={() => setViewingReceiptId(null)}
      >
        <div 
          className="bg-[#1c1917] w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 border border-stone-800 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-stone-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-black text-stone-100 uppercase tracking-tight leading-none">
                  Comprobantes y Movimientos
                </h2>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  {order.id}
                </span>
              </div>
              <p className="text-sm font-bold text-stone-400 uppercase tracking-wider mt-2">
                {order.customer || order.companyName || 'Cliente'} 
                <span className="text-stone-500 font-normal"> · Vendedor: <span className="text-amber-400 font-black">{getOrderSellerName(order)}</span></span>
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setViewingReceiptId(null)} 
              className="text-stone-500 hover:text-white bg-stone-900 hover:bg-stone-800 p-2 rounded-2xl border border-stone-800 transition"
            >
              <X size={24}/>
            </button>
          </div>
            
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between">
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                <DollarSign size={10} /> Total Pedido
              </span>
              <span className="text-lg md:text-xl font-black text-stone-200 font-mono mt-1">
                Bs{total.toFixed(2)}
              </span>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-green-900/30 flex flex-col justify-between shadow-[0_0_15px_rgba(34,197,94,0.05)]">
              <span className="text-[9px] font-black text-green-500/90 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={10} /> Total Cobrado Neto
              </span>
              <span className="text-lg md:text-xl font-black text-green-400 font-mono mt-1">
                Bs{collected.toFixed(2)}
              </span>
            </div>

            {diff < -0.01 ? (
              <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-800/60 flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <ArrowUpRight size={10} /> Saldo a Favor / Cambio
                </span>
                <span className="text-lg md:text-xl font-black text-emerald-300 font-mono mt-1">
                  +Bs{Math.abs(diff).toFixed(2)}
                </span>
              </div>
            ) : diff > 0.01 ? (
              <div className="bg-red-950/20 p-4 rounded-2xl border border-red-900/40 flex flex-col justify-between shadow-[0_0_15px_rgba(239,68,68,0.08)]">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                  <AlertCircle size={10} /> Saldo Pendiente
                </span>
                <span className="text-lg md:text-xl font-black text-red-400 font-mono mt-1">
                  Bs{diff.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/80 flex flex-col justify-between">
                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                  Saldo Pendiente
                </span>
                <span className="text-lg md:text-xl font-black text-stone-400 font-mono mt-1">
                  Bs0.00
                </span>
              </div>
            )}
          </div>

          {/* Action to deliver change / refund if credit exists */}
          {hasCreditInFavor && setOrderToCollect && (
            <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HandCoins className="text-emerald-400 shrink-0" size={18} />
                <p className="text-xs text-emerald-300 font-bold">
                  Hay <span className="font-mono text-white font-black">Bs{Math.abs(diff).toFixed(2)}</span> a favor del cliente. ¿Ya le entregaron su vuelto?
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenRefundModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
              >
                <ArrowDownRight size={14} /> Registrar Entrega de Vuelto
              </button>
            </div>
          )}

          {/* Payment Receipts List */}
          <div className="overflow-y-auto pr-1 flex-1 space-y-4">
            {history.length > 0 ? (
              history.map((p: any, idx: number) => {
                const receiptImg = p.receipt || p.receiptUrl || p.image;
                const isNegative = Number(p.amount || 0) < 0;
                return (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-2xl space-y-3 border ${
                      isNegative 
                        ? 'bg-emerald-950/20 border-emerald-900/50' 
                        : 'bg-stone-900/90 border-stone-800/90'
                    }`}
                  >
                    <div className="flex justify-between items-start border-b border-stone-800/70 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${isNegative ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {p.note || (isNegative ? 'Devolución / Vuelto' : `Abono #${idx + 1}`)}
                          </span>
                          {p.method && (
                            <span className="text-[9px] font-bold bg-stone-950 text-stone-400 border border-stone-800 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                              <CreditCard size={9} /> {p.method}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-stone-400">
                          {formatDate(p.date)}
                        </div>
                        {p.sellerName && (
                          <div className="text-[10px] text-stone-500 font-bold uppercase">
                            Registrado por: {p.sellerName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black font-mono ${isNegative ? 'text-emerald-300' : 'text-green-400'}`}>
                          {isNegative ? '-' : ''}Bs{Math.abs(Number(p.amount || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Tendered and change breakdown if available */}
                    {(() => {
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

                      if (tendered !== null || change !== null) {
                        return (
                          <div className="p-2.5 bg-stone-950/80 border border-stone-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-3">
                              {tendered !== null && (
                                <span className="text-stone-300">
                                  <strong className="text-stone-400">Entregó:</strong> Bs{tendered.toFixed(2)}
                                </span>
                              )}
                              {change !== null && change > 0.001 && (
                                <span className="text-emerald-400">
                                  • <strong className="text-emerald-500">Vuelto:</strong> Bs{change.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 font-sans uppercase font-bold">
                              {p.method || 'Efectivo'}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Receipt Image or Empty State */}
                    {receiptImg ? (
                      <div className="space-y-2">
                        <div 
                          className="group relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 cursor-pointer hover:border-amber-500/50 transition"
                          onClick={() => setZoomedImage(receiptImg)}
                        >
                          <img 
                            src={receiptImg} 
                            alt={`Comprobante ${idx + 1}`} 
                            className="w-full h-auto max-h-[320px] object-contain rounded-xl"
                          />
                          <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-[2px]">
                            <span className="bg-stone-900/90 text-stone-200 border border-stone-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl">
                              <ZoomIn size={14} /> Ampliar Comprobante
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDownload(receiptImg, `${order.id}_pago_${idx + 1}`)}
                            className="text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-amber-400 flex items-center gap-1 transition"
                          >
                            <Download size={12} /> Descargar Imagen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 flex items-center justify-center border border-dashed border-stone-800 rounded-xl text-stone-600 font-bold uppercase text-[10px] tracking-widest bg-stone-950/40">
                        {isNegative ? 'Movimiento registrado en efectivo en caja' : 'Sin imagen de comprobante adjunta'}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-stone-900/50 rounded-2xl border border-stone-800 border-dashed">
                <ImageIcon size={40} className="mx-auto text-stone-700 mb-3 opacity-30"/>
                <p className="text-stone-500 font-bold uppercase text-xs tracking-widest">
                  No hay comprobantes de pago registrados
                </p>
              </div>
            )}
          </div>

          {/* Footer Close Button */}
          <div className="pt-6 border-t border-stone-800 mt-4">
            <button 
              type="button"
              onClick={() => setViewingReceiptId(null)} 
              className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest transition shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoomed Receipt Image View */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[95vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-3 text-white px-2">
              <span className="text-xs font-black uppercase tracking-widest text-stone-400">
                Comprobante en Alta Resolución
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(zoomedImage, `${order.id}_comprobante_hd`)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download size={14} /> Descargar
                </button>
                <button 
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="bg-stone-800 hover:bg-stone-700 text-white p-2 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-2 shadow-2xl">
              <img 
                src={zoomedImage} 
                alt="Comprobante Ampliado" 
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
