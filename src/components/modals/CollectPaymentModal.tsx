import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ImageIcon, DollarSign, Calculator, ArrowDownRight, HandCoins } from 'lucide-react';

export const CollectPaymentModal = (props: any) => {
  const {
    orderToCollect,
    setOrderToCollect,
    manualAmount,
    setManualAmount,
    manualReceipt,
    setManualReceipt,
    isProcessingPayment,
    handleCreateOrder,
    collectBalance,
    convertToOrder,
    getOrderBreakdown
  } = props;

  if (!orderToCollect) return null;

  const isRefundMode = orderToCollect.isRefundMode || false;
  const totalOrderPrice = Number(orderToCollect.totalPrice || 0);
  const alreadyCollected = Number(orderToCollect.amountCollected || 0);
  const pendingBalance = Math.max(0, totalOrderPrice - alreadyCollected);
  const creditInFavor = alreadyCollected > totalOrderPrice ? (alreadyCollected - totalOrderPrice) : 0;

  // Expected amount to pay for this transaction
  const expectedAmount = orderToCollect.isBalance 
    ? (isRefundMode ? creditInFavor : pendingBalance)
    : (orderToCollect.paymentMethod === '100% Contado' ? totalOrderPrice : totalOrderPrice * 0.5);

  // Cash / Tendered calculator state
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [paymentMethodUsed, setPaymentMethodUsed] = useState<string>(isRefundMode ? 'Efectivo' : 'Transferencia');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Sync initial payment note and tendered amount
  useEffect(() => {
    if (isRefundMode) {
      setTenderedAmount('');
      setPaymentNote('Devolución de vuelto en metálico');
      setPaymentMethodUsed('Efectivo');
    } else {
      setTenderedAmount('');
      setPaymentNote('');
      setPaymentMethodUsed(orderToCollect.paymentMethod?.includes('Contado') ? 'Efectivo' : 'Transferencia');
    }
  }, [orderToCollect.id, isRefundMode]);

  const numericTendered = parseFloat(tenderedAmount) || 0;
  const numericManualAmt = parseFloat(manualAmount) || 0;
  const changeToGive = numericTendered > numericManualAmt ? (numericTendered - numericManualAmt) : 0;

  const isFormValid = isRefundMode
    ? (numericManualAmt > 0)
    : (!isProcessingPayment && manualReceipt && numericManualAmt > 0);

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-stone-900 rounded-[2rem] border border-stone-800 shadow-2xl p-8 relative max-w-md w-full animate-in zoom-in max-h-[92vh] overflow-y-auto">
        <button 
          onClick={() => { setOrderToCollect(null); setManualReceipt(null); }} 
          className="absolute top-6 right-6 text-stone-500 hover:text-white"
        >
          <X size={24}/>
        </button>

        <div className="flex items-center gap-2 mb-1">
          {isRefundMode ? (
            <HandCoins className="text-emerald-400" size={24} />
          ) : (
            <DollarSign className="text-amber-500" size={24} />
          )}
          <h2 className="text-2xl font-black text-stone-200 uppercase tracking-tighter">
            {isRefundMode 
              ? 'Entregar Vuelto / Cambio' 
              : orderToCollect.isBalance 
                ? 'Cobrar Saldo' 
                : 'Cobrar Adelanto'}
          </h2>
        </div>

        <p className="text-xs text-stone-400 mb-4 uppercase tracking-widest">
          Orden: <span className="text-stone-300 font-bold">{orderToCollect.id || 'Nueva'}</span> · {orderToCollect.customer}
        </p>

        {/* Cash Discount Prompt */}
        {!orderToCollect.isBalance && !isRefundMode && (orderToCollect.paymentMethod || '50/50 - Adelantado/Entrega') !== '100% Contado' && (() => {
          const breakdownCash = getOrderBreakdown(
            orderToCollect.items || [], 
            orderToCollect.category || orderToCollect.clientType, 
            '100% Contado', 
            orderToCollect.manualDiscount || 0, 
            orderToCollect.clientType,
            orderToCollect.accountId,
            orderToCollect.migrationFlatDiscount || 0
          );
          const cashPct = breakdownCash.cashDiscountPct || 10;
          const cashTotal = breakdownCash.total;
          const currentTotal = Number(orderToCollect.totalPrice || breakdownCash.subtotal);
          const savings = Math.max(0, currentTotal - cashTotal);

          if ((cashPct > 0 || breakdownCash.cashDiscountAmt > 0) && savings > 0.01) {
            return (
              <div className="mb-4 bg-amber-950/40 border border-amber-800/60 p-3 rounded-2xl text-center">
                <p className="text-[11px] font-bold text-amber-400 leading-snug">
                  💡 ¡Ahorre {cashPct}% pagando todo al contado!
                  <br />
                  El total queda en <span className="font-mono text-white font-bold">Bs{cashTotal.toFixed(2)}</span> (Ahorro: <span className="font-mono text-white font-bold">Bs{savings.toFixed(2)}</span>).
                </p>
              </div>
            );
          }
          return null;
        })()}

        <div className="space-y-4">
          {/* Payment Method Selector if converting */}
          {!orderToCollect.isBalance && !isRefundMode && (
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 block">Modalidad de Venta</label>
              <select 
                value={orderToCollect.paymentMethod || '50/50 - Adelantado/Entrega'}
                onChange={(e) => {
                  const newMethod = e.target.value;
                  const newBreakdown = getOrderBreakdown(
                    orderToCollect.items || [], 
                    orderToCollect.category || orderToCollect.clientType, 
                    newMethod, 
                    orderToCollect.manualDiscount || 0, 
                    orderToCollect.clientType,
                    orderToCollect.accountId,
                    orderToCollect.migrationFlatDiscount || 0
                  );
                  const newTotal = newBreakdown.total;
                  if (newMethod === '100% Contado') {
                    setManualAmount(newTotal.toFixed(2));
                  } else {
                    setManualAmount((newTotal * 0.5).toFixed(2));
                  }
                  setOrderToCollect({ ...orderToCollect, paymentMethod: newMethod, totalPrice: newTotal });
                }}
                className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl text-xs font-bold text-stone-300 outline-none focus:border-amber-500"
              >
                <option value="50/50 - Adelantado/Entrega">50/50 - Adelantado/Entrega</option>
                <option value="100% Contado">100% Contado</option>
              </select>
            </div>
          )}

          {/* Amount to Record */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                {isRefundMode ? 'Monto de vuelto a entregar (Bs)' : 'Monto a Registrar en la Orden (Bs)'}
              </label>
              <span className="text-[10px] font-mono font-bold text-stone-400">
                Sugerido: Bs{expectedAmount.toFixed(2)}
              </span>
            </div>
            
            <input 
              type="number" 
              step="any"
              value={manualAmount || ''}
              onChange={(e) => setManualAmount(e.target.value)}
              className={`w-full bg-stone-950 border p-4 rounded-2xl text-2xl font-mono outline-none ${
                isRefundMode 
                  ? 'border-emerald-700/60 text-emerald-400 focus:border-emerald-500' 
                  : 'border-stone-800 text-amber-500 focus:border-amber-500'
              }`}
              placeholder="0.00"
            />
            {!orderToCollect.isBalance && !isRefundMode && parseFloat(manualAmount) < (orderToCollect.totalPrice * 0.5) && (
              <p className="text-[10px] text-red-500 font-bold uppercase mt-2 tracking-widest">
                Advertencia: El mínimo sugerido es el 50% (Bs{(orderToCollect.totalPrice * 0.5).toFixed(2)})
              </p>
            )}
          </div>

          {/* Change Calculator (Opción 1) */}
          {!isRefundMode && (
            <div className="bg-stone-950/70 border border-stone-800/80 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                  <Calculator size={13} className="text-amber-500" /> Calculadora de Vuelto (Opcional)
                </span>
                <span className="text-[9px] text-stone-500 uppercase font-bold">Pago en efectivo / billete</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-500 uppercase font-bold block mb-1">Cliente Entregó / Pagó:</label>
                  <input
                    type="number"
                    step="any"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    placeholder="Ej. 250.00"
                    className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-sm font-mono text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-stone-900 border border-stone-800/80 p-2 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] text-stone-500 uppercase font-bold flex items-center gap-1">
                    <ArrowDownRight size={11} className={changeToGive > 0 ? "text-emerald-400" : "text-stone-600"} /> Vuelto a Dar:
                  </span>
                  <span className={`text-base font-mono font-black ${changeToGive > 0 ? 'text-emerald-400' : 'text-stone-500'}`}>
                    Bs{changeToGive.toFixed(2)}
                  </span>
                </div>
              </div>

              {changeToGive > 0 && (
                <p className="text-[9px] text-emerald-400/90 font-medium">
                  ✓ Se anotará en el recibo: Entregado Bs{numericTendered.toFixed(2)} con Vuelto de Bs{changeToGive.toFixed(2)}.
                </p>
              )}
            </div>
          )}

          {/* Payment Method / Note */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1 block">Medio de Pago</label>
              <select
                value={paymentMethodUsed}
                onChange={(e) => setPaymentMethodUsed(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl text-xs font-bold text-stone-300 outline-none focus:border-amber-500"
              >
                <option value="Transferencia">Transferencia / QR</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1 block">Nota / Detalle</label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder={isRefundMode ? "Vuelto en monedas" : "Ej. Adelanto 50%"}
                className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 outline-none focus:border-amber-500 font-sans"
              />
            </div>
          </div>

          {/* Receipt Upload (Obligatorio para cobros, opcional para vueltos) */}
          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 block">
              {isRefundMode ? 'Comprobante / Firma (Opcional)' : 'Comprobante de Pago (Obligatorio)'}
            </label>
            <label className={`w-full flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-2xl cursor-pointer transition ${manualReceipt ? 'border-green-600 bg-green-950/10' : 'border-stone-800 hover:border-amber-600/50 bg-stone-950'}`}>
              {manualReceipt ? (
                <div className="flex items-center gap-2 text-green-500 font-black uppercase text-[10px] tracking-widest">
                   <CheckCircle size={18}/> Imagen Cargada
                </div>
              ) : (
                <div className="flex flex-col items-center text-stone-500">
                   <ImageIcon size={20}/>
                   <span className="text-[9px] font-black uppercase tracking-widest mt-1">
                     {isRefundMode ? 'Adjuntar constancia (opcional)' : 'Seleccionar Recibo'}
                   </span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setManualReceipt(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          </div>
        </div>
          
        <button 
          disabled={!isFormValid || isProcessingPayment}
          onClick={async () => {
            const amt = parseFloat(manualAmount) || 0;
            const hasChange = numericTendered > amt;
            const finalNote = paymentNote.trim() 
              ? paymentNote.trim() 
              : hasChange 
                ? `Recibido Bs${numericTendered.toFixed(2)} (Vuelto entregado: Bs${changeToGive.toFixed(2)})`
                : isRefundMode ? 'Devolución de Vuelto al Cliente' : 'Abono Registrado';

            const paymentOptions = {
              method: paymentMethodUsed,
              note: finalNote,
              tendered: numericTendered > 0 ? numericTendered : undefined,
              change: hasChange ? changeToGive : undefined,
              isRefund: isRefundMode
            };

            if (isRefundMode) {
              // Negative amount for refund
              await collectBalance(orderToCollect, -Math.abs(amt), manualReceipt || '', paymentOptions);
              setOrderToCollect(null);
              setManualReceipt(null);
            } else if (orderToCollect.isNew) {
              await handleCreateOrder({ preventDefault: () => {} }, manualAmount, manualReceipt!, paymentOptions);
              setOrderToCollect(null);
              setManualReceipt(null);
            } else if (orderToCollect.isBalance) {
              await collectBalance(orderToCollect, amt, manualReceipt!, paymentOptions);
              setManualReceipt(null);
            } else {
              await convertToOrder(orderToCollect, amt, manualReceipt!, paymentOptions);
              setManualReceipt(null);
            }
          }} 
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition flex items-center justify-center gap-2 mt-6 ${
            !isFormValid || isProcessingPayment
              ? 'bg-stone-800 text-stone-600 cursor-not-allowed' 
              : isRefundMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xl'
          }`}
        >
          {isProcessingPayment ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></div>
              Procesando...
            </span>
          ) : (
            <>
              <CheckCircle size={18}/> 
              {isRefundMode 
                ? 'Registrar Entrega de Vuelto' 
                : orderToCollect.isNew 
                  ? 'Lanzar Orden con Pago' 
                  : orderToCollect.isBalance 
                    ? 'Registrar Abono' 
                    : 'Convertir a Orden'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
