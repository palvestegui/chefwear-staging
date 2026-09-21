import React from 'react';
import { X, CheckCircle, ImageIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { usePricingEngine } from '../../hooks/usePricingEngine';

interface PaymentModalProps {
  orderToCollect: any;
  setOrderToCollect: (val: any) => void;
  manualAmount: string;
  setManualAmount: (val: string) => void;
  manualReceipt: string | null;
  setManualReceipt: (val: string | null) => void;
  isProcessingPayment: boolean;
  handleCreateOrder: (e: any, amount?: string, receipt?: string) => Promise<void>;
  collectBalance: (order: any, amount: number, receipt: string) => Promise<void>;
  convertToOrder: (order: any, amount: number, receipt: string) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderToCollect,
  setOrderToCollect,
  manualAmount,
  setManualAmount,
  manualReceipt,
  setManualReceipt,
  isProcessingPayment,
  handleCreateOrder,
  collectBalance,
  convertToOrder
}) => {
  const { pricing } = useData();
  const { getOrderBreakdown } = usePricingEngine(pricing);

  if (!orderToCollect) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] flex justify-center items-center p-4">
      <div className="bg-stone-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-stone-800 relative">
        <button 
          onClick={() => { setOrderToCollect(null); setManualReceipt(null); }} 
          className="absolute top-6 right-6 text-stone-500 hover:text-red-400 transition"
        >
          <X size={24}/>
        </button>
        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">{orderToCollect.isBalance ? 'Registrar Abono (Saldo)' : orderToCollect.isNew ? 'Pago Inicial Requerido' : 'Cobrar Adelanto'}</h2>
        <p className="text-xs text-stone-400 mb-4 uppercase tracking-widest">Orden para: {orderToCollect.customer}</p>

        {!orderToCollect.isBalance && (orderToCollect.paymentMethod || '50/50 - Adelantado/Entrega') !== '100% Contado' && (() => {
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
          {!orderToCollect.isBalance && (
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 block">Modalidad de Pago</label>
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

          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 block">Monto a cobrar</label>
            <input 
              type="number" 
              step="any"
              value={manualAmount || ''}
              onChange={(e) => setManualAmount(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 p-4 rounded-2xl text-2xl font-mono text-amber-500 outline-none focus:border-amber-500"
              placeholder="0.00"
            />
            {!orderToCollect.isBalance && parseFloat(manualAmount) < (orderToCollect.totalPrice * 0.5) && (
              <p className="text-[10px] text-red-500 font-bold uppercase mt-2 tracking-widest">Advertencia: El mínimo sugerido es el 50% (Bs{(orderToCollect.totalPrice * 0.5).toFixed(2)})</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 block">Comprobante de Pago (Obligatorio)</label>
            <label className={`w-full flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-2xl cursor-pointer transition ${manualReceipt ? 'border-green-600 bg-green-950/10' : 'border-stone-800 hover:border-amber-600/50 bg-stone-950'}`}>
              {manualReceipt ? (
                <div className="flex items-center gap-2 text-green-500 font-black uppercase text-[10px] tracking-widest">
                   <CheckCircle size={18}/> Imagen Cargada
                </div>
              ) : (
                <div className="flex flex-col items-center text-stone-500">
                   <ImageIcon size={24}/>
                   <span className="text-[10px] font-black uppercase tracking-widest mt-2">Seleccionar Recibo</span>
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
          disabled={isProcessingPayment || !manualReceipt || parseFloat(manualAmount) <= 0}
          onClick={async () => {
            const amt = parseFloat(manualAmount) || 0;
            if(orderToCollect.isNew) {
              await handleCreateOrder({ preventDefault: () => {} }, manualAmount, manualReceipt!);
              setOrderToCollect(null);
              setManualReceipt(null);
            } else if(orderToCollect.isBalance) {
              await collectBalance(orderToCollect, amt, manualReceipt!);
              setManualReceipt(null);
            } else {
              await convertToOrder(orderToCollect, amt, manualReceipt!);
              setManualReceipt(null);
            }
          }} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition flex items-center justify-center gap-2 mt-8 ${(isProcessingPayment || !manualReceipt || parseFloat(manualAmount) <= 0) ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xl'}`}>
          {isProcessingPayment ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></div>
              Procesando...
            </span>
          ) : (
            <>
              <CheckCircle size={18}/> {orderToCollect.isNew ? 'Lanzar Orden con Pago' : orderToCollect.isBalance ? 'Registrar Abono' : 'Convertir a Orden'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
