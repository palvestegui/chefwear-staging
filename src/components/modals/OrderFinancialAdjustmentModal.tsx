import React, { useState, useMemo, useEffect } from 'react';
import { X, DollarSign, Percent, AlertCircle, Check, ShieldAlert } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Order } from '../../types';

export interface OrderFinancialAdjustmentModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess?: (updatedOrder: Order) => void;
}

export interface FinancialAdjustmentPayload {
  totalPrice: number;
  manualDiscount: number;
  amountCollected: number;
  auditNote: string;
}

export const OrderFinancialAdjustmentModal: React.FC<OrderFinancialAdjustmentModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  const [totalPriceStr, setTotalPriceStr] = useState<string>('');
  const [manualDiscountStr, setManualDiscountStr] = useState<string>('');
  const [amountCollectedStr, setAmountCollectedStr] = useState<string>('');
  const [auditNote, setAuditNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setTotalPriceStr(order.totalPrice !== undefined ? String(order.totalPrice) : '0');
      setManualDiscountStr(order.manualDiscount !== undefined ? String(order.manualDiscount) : '0');
      setAmountCollectedStr(order.amountCollected !== undefined ? String(order.amountCollected) : '0');
      setAuditNote('');
      setError(null);
    }
  }, [order]);

  const currentSubtotal = useMemo(() => {
    if (!order) return 0;
    if (typeof order.subtotal === 'number' && order.subtotal > 0) return order.subtotal;
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + (Number(item.price || 0) * (Number(item.qty) || 1)), 0);
    }
    return Number(order.totalPrice || 0);
  }, [order]);

  const numTotalPrice = parseFloat(totalPriceStr) || 0;
  const numAmountCollected = parseFloat(amountCollectedStr) || 0;
  const numManualDiscount = parseFloat(manualDiscountStr) || 0;
  const currentSaldo = numTotalPrice - numAmountCollected;
  const isBalanced = Math.abs(currentSaldo) < 0.005;

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order.id) return;
    if (!auditNote.trim()) {
      setError('Debe especificar un motivo/justificación para el registro de auditoría.');
      return;
    }
    if (isNaN(numTotalPrice) || numTotalPrice < 0 || isNaN(numAmountCollected) || numAmountCollected < 0) {
      setError('Los valores numéricos de precio y cobro deben ser mayores o iguales a 0.');
      return;
    }
    if (isNaN(numManualDiscount) || numManualDiscount < 0 || numManualDiscount > 100) {
      setError('El descuento debe estar entre 0% y 100%.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderRef = doc(db, 'orders', order.id);
      const auditEntryKey = `Ajuste financiero aplicado por SuperAdmin: ${auditNote.trim()}`;
      const updatedTimestamps: Record<string, string> = {
        ...(order.timestamps || {}),
        [auditEntryKey]: new Date().toISOString()
      };

      // SUPERADMIN OVERRIDE: Modificación directa de variables financieras bajo auditoría estricta
      const updateData = {
        totalPrice: Number(numTotalPrice.toFixed(2)),
        manualDiscount: Number(numManualDiscount.toFixed(2)),
        amountCollected: Number(numAmountCollected.toFixed(2)),
        timestamps: updatedTimestamps,
        updatedAt: Date.now()
      };

      await updateDoc(orderRef, updateData);
      if (onSuccess) onSuccess({ ...order, ...updateData });
      onClose();
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      setError(err instanceof Error ? err.message : 'Error al guardar el ajuste financiero');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-100 uppercase tracking-tight">Ajustar Valores Financieros</h3>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Exclusivo SuperAdmin</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-white p-2 rounded-xl transition hover:bg-stone-800">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-stone-950/70 border border-stone-800/80 rounded-2xl p-3 text-xs">
          <div>
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-wider block">Cliente</span>
            <p className="font-bold text-stone-200 truncate uppercase">{order.companyName || order.customer}</p>
          </div>
          <div>
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-wider block">ID Orden</span>
            <p className="font-mono text-stone-400 truncate">{order.id}</p>
          </div>
          <div className="col-span-2 pt-1.5 border-t border-stone-900 flex justify-between items-center">
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-wider">Subtotal Referencial</span>
            <span className="font-mono font-bold text-stone-300">Bs{currentSubtotal.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-black text-stone-300 uppercase tracking-wider flex justify-between mb-1">
              <span>Total Facturable (totalPrice)</span>
              <span className="text-stone-500 lowercase font-normal">acepta decimales</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono font-bold text-xs">Bs</span>
              <input type="number" step="0.01" min="0" required value={totalPriceStr} onChange={(e) => setTotalPriceStr(e.target.value)} placeholder="0.00" className="w-full bg-stone-950 border border-stone-800 pl-9 pr-3 py-2 rounded-xl text-xs text-stone-100 font-mono font-bold outline-none focus:border-amber-500 transition" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-stone-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Percent size={11} className="text-stone-400" /> Descuento (%)
              </label>
              <input type="number" step="0.1" min="0" max="100" value={manualDiscountStr} onChange={(e) => setManualDiscountStr(e.target.value)} placeholder="0" className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-100 font-mono font-bold outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                <DollarSign size={11} className="text-stone-400" /> Monto Cobrado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono font-bold text-xs">Bs</span>
                <input type="number" step="0.01" min="0" value={amountCollectedStr} onChange={(e) => setAmountCollectedStr(e.target.value)} placeholder="0.00" className="w-full bg-stone-950 border border-stone-800 pl-8 pr-3 py-2 rounded-xl text-xs text-stone-100 font-mono font-bold outline-none focus:border-amber-500 transition" />
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border transition-all ${isBalanced ? 'bg-emerald-950/40 border-emerald-500/60' : currentSaldo < 0 ? 'bg-amber-950/30 border-amber-800/60' : 'bg-stone-950 border-stone-800'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Saldo Resultante (Total - Cobrado)</span>
              <span className={`text-sm font-black font-mono ${isBalanced ? 'text-emerald-400' : currentSaldo < 0 ? 'text-amber-400' : 'text-red-400'}`}>
                Bs{currentSaldo.toFixed(2)}
              </span>
            </div>
            {isBalanced && (
              <p className="text-[10px] font-black text-emerald-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                <Check size={12} /> Saldo Balanceado (Bs0.00)
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-300 uppercase tracking-wider block mb-1">
              Motivo / Justificación (Auditoría obligatoria)
            </label>
            <input type="text" required value={auditNote} onChange={(e) => setAuditNote(e.target.value)} placeholder="Ej: Ajuste de descuento de contado, Reconciliación 27/08" className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-100 outline-none focus:border-amber-500 transition font-medium" />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
            <button type="button" disabled={isSubmitting} onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-stone-400 hover:text-white hover:bg-stone-800 transition">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition shadow-lg shadow-amber-600/20 cursor-pointer">
              {isSubmitting ? 'Guardando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
