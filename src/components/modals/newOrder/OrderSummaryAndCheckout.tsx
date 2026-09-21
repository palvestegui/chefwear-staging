import React from 'react';
import { Trash2, ClipboardList, CheckCircle } from 'lucide-react';
import { 
  getEffectiveTierDiscountRules, 
  getVolumeDiscountPct 
} from '../../../utils/discountRulesUtils';
import { resolveOrderTier } from '../../../utils/pricingTierUtils';
import { OrderItem, Order } from '../../../types';

export interface GroupedCartItem extends OrderItem {
  groupedQty: number;
  originalIndices: number[];
}

export interface OrderSummaryAndCheckoutProps {
  newOrder: any;
  setNewOrder: React.Dispatch<React.SetStateAction<any>>;
  pricing: any;
  orderHeaderMode: string;
  editingQuoteId: string | null;
  setOrderToCollect: (val: any) => void;
  setManualAmount: (val: string) => void;
  setManualReceipt: (val: any) => void;
  getItemUnitPrice: (item: any, tierOrCat?: string, accountId?: string) => number;
  getServiceUnitPrice: (serviceName: string, item: OrderItem, orderItems?: OrderItem[]) => number;
  getOrderBreakdown: (items: any[], category?: string, paymentMethod?: string, manualDiscount?: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => any;
  calculateTotalPrice: (items: any[], category?: string, paymentMethod?: string, manualDiscount?: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => number;
  isMigrationMode?: boolean;
  isSubmitting?: boolean;
}

export const OrderSummaryAndCheckout: React.FC<OrderSummaryAndCheckoutProps> = ({
  newOrder,
  setNewOrder,
  pricing,
  orderHeaderMode,
  editingQuoteId,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  getItemUnitPrice,
  getServiceUnitPrice,
  getOrderBreakdown,
  calculateTotalPrice,
  isMigrationMode,
  isSubmitting
}) => {
  const breakdown = getOrderBreakdown(
    newOrder.items,
    newOrder.pricingTier || newOrder.category || newOrder.clientType,
    newOrder.paymentMethod,
    newOrder.manualDiscount,
    newOrder.clientType,
    newOrder.accountId,
    newOrder.migrationFlatDiscount || 0
  );

  const activeTier = resolveOrderTier(
    newOrder.items,
    newOrder.category,
    newOrder.accountId,
    newOrder.clientType,
    newOrder.pricingTier
  );

  const discountRules = getEffectiveTierDiscountRules(
    activeTier,
    pricing?.discountRulesByTier,
    pricing?.specialPresetDiscounts
  );

  const pm = String(newOrder.paymentMethod || '').toUpperCase();
  const isCash = Boolean(pm && (pm.includes('100%') || pm.includes('CONTADO')) && !pm.includes('50'));

  // Pre-calculate unit counts by garment for accurate per-card discount calculation
  const garmentCounts = new Map<string, number>();
  (newOrder.items || []).forEach((it: any) => {
    const gName = String(it.name || '').trim().toLowerCase();
    const qty = Number(it.qty) || 1;
    garmentCounts.set(gName, (garmentCounts.get(gName) || 0) + qty);
  });

  // Group items visually to avoid "cart explosion" with large rosters
  const displayItems = React.useMemo(() => {
    if (!newOrder.isInstitutional || !(newOrder.institutionalRoster?.length > 0)) {
      return newOrder.items.map((it: any, i: number) => ({ ...it, originalIndices: [i] }));
    }
    
    const grouped = new Map<string, any>();
    newOrder.items.forEach((it: any, index: number) => {
      // Group by name, fabric, and color. We ignore services/sizes for the top-level visual grouping.
      const key = `${it.name}|${it.fabric}|${it.fabricColor}`;
      if (!grouped.has(key)) {
        grouped.set(key, { ...it, groupedQty: Number(it.qty) || 1, originalIndices: [index] });
      } else {
        const existing = grouped.get(key);
        existing.groupedQty += Number(it.qty) || 1;
        existing.originalIndices.push(index);
      }
    });
    return Array.from(grouped.values());
  }, [newOrder.items, newOrder.isInstitutional, newOrder.institutionalRoster]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-stone-950 border border-stone-800 p-6 rounded-3xl flex-1 flex flex-col">
        <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Carrito / Resumen</h4>
        <div className="flex-1 custom-scrollbar overflow-y-auto space-y-2 max-h-[350px]">
          {displayItems.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-700 text-sm font-bold italic py-8">No hay prendas agregadas.</div>
          ) : (
            displayItems.map((it: GroupedCartItem, i: number) => {
              const unitPrice = getItemUnitPrice(it, it.pricingTier || newOrder.pricingTier || newOrder.category || newOrder.clientType, newOrder.accountId);
              const totalDisplayQty = it.groupedQty || it.qty || 1;
              const itemTotal = unitPrice * totalDisplayQty;

              let itemVolPct = 0;
              let isUdiPackageDiscount = false;

              const isFullPackage = it.name === 'Uniforme Completo UDI' || it.isUdiGroup || it.isPackage;
              if (isFullPackage && discountRules.fullPackageDiscountEnabled && isCash) {
                isUdiPackageDiscount = true;
              } else if (discountRules.volumeDiscountEnabled && !isFullPackage) {
                const gName = String(it.name || '').trim().toLowerCase();
                const totalUnitsOfGarment = garmentCounts.get(gName) || totalDisplayQty;
                itemVolPct = getVolumeDiscountPct(totalUnitsOfGarment, discountRules.volumeTiers);
              }

              const packagePct = discountRules.fullPackageDiscountPercent || 10;
              const totalItemDiscountPct = isUdiPackageDiscount ? packagePct : itemVolPct;
              const itemDiscountAmount = itemTotal * (totalItemDiscountPct / 100);
              const finalItemPrice = itemTotal - itemDiscountAmount;

              return (
                <div key={i} className="flex justify-between items-center bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-200">{totalDisplayQty}x {it.name === 'Uniforme Completo UDI' ? 'Uniforme Completo UDI' : it.name}</span>
                          {totalItemDiscountPct > 0 && (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded">
                              -{totalItemDiscountPct}% {isUdiPackageDiscount ? '(UDI 100% Contado)' : `(Volumen ${itemVolPct}%)`}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">{it.name === 'Uniforme Completo UDI' ? 'Mandil + Filipina + Pantalón + Gorro' : `${it.fabric}${it.fabricColor ? ' - COLOR - ' + it.fabricColor : ''}`}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          {totalItemDiscountPct > 0 ? (
                            <>
                              <span className="font-mono text-sm font-black text-emerald-400">Bs{finalItemPrice.toFixed(2)}</span>
                              <span className="font-mono text-[10px] text-stone-500 line-through">Bs{itemTotal.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="font-mono text-sm font-bold text-amber-500">Bs{itemTotal.toFixed(2)}</span>
                          )}
                        </div>
                        <button type="button" onClick={() => setNewOrder((p: Order) => ({...p, items: p.items.filter((_: OrderItem, idx: number) => !(it.originalIndices || []).includes(idx))}))} className="text-stone-600 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    {(it.groupedQty && it.groupedQty > 1) ? (
                      <div className="flex flex-col gap-1 pl-4 border-l-2 border-stone-800 text-[9px] font-bold uppercase tracking-widest text-stone-500">
                        · {it.groupedQty} Prendas Agrupadas (Ver Detalles en Nómina)
                      </div>
                    ) : (
                      it.services?.length > 0 && (
                        <div className="flex flex-col gap-1 pl-4 border-l-2 border-stone-800">
                          {it.services.filter((s: string) => {
                            const srv = pricing?.services?.find((x: any) => x.name === s && x.garment === it.name) || pricing?.services?.find((x: any) => x.name === s && x.garment === 'Global') || pricing?.services?.find((x: any) => x.name === s);
                            return !srv || srv.type === 'Opción de Confección' || srv.type === 'Variante Base';
                          }).map((s: string) => {
                            let lbl = s;
                            if (s.toLowerCase().includes('bolsillo') && it.pocketName) lbl = `${s}: ${it.pocketName}`;
                            if (s === 'Bolsillos personalizados' && it.customPocketDetails) lbl = `${s}: ${it.customPocketDetails}`;
                            return (
                              <div key={s} className="flex justify-between items-center">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">· {lbl}</span>
                              </div>
                            );
                          })}
                          {it.services.filter((s: string) => {
                            const srv = pricing?.services?.find((x: any) => x.name === s && x.garment === it.name) || pricing?.services?.find((x: any) => x.name === s && x.garment === 'Global') || pricing?.services?.find((x: any) => x.name === s);
                            return (!srv && s.toUpperCase().includes('LOGO')) || (srv && (srv.type === 'Costo Adicional' || srv.type === 'Costo Adicional Editable' || srv.type === 'Escala de Volumen (Logos)'));
                          }).map((s: string) => {
                            let lbl = s;
                            if (s.toLowerCase().includes('bolsillo') && it.pocketName) lbl = `${s}: ${it.pocketName}`;
                            if (s === 'Bolsillos personalizados' && it.customPocketDetails) lbl = `${s}: ${it.customPocketDetails}`;
                            const customPrice = getServiceUnitPrice(s, it, newOrder.items);
                            return (
                              <div key={s} className="flex justify-between items-center">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                                  · {lbl} <span className="font-mono text-stone-500 ml-1">Bs{customPrice.toFixed(2)}</span>
                                </span>
                                <span className="font-mono text-[9px] font-bold text-amber-500/70">+Bs{(customPrice * (it.qty||1)).toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-stone-800 pt-4 mt-4 flex flex-col gap-1 w-full text-right">
          {isMigrationMode && (
            <div className="flex flex-col gap-3 mb-4 bg-amber-950/20 border border-amber-900/50 p-4 rounded-2xl text-left">
              <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                🗓️ Registro Histórico (Fechas Personalizadas)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">Fecha de Orden / Cotización</label>
                  <input
                    type="date"
                    value={newOrder.migrationDate || ''}
                    onChange={(e) => setNewOrder((p: any) => ({ ...p, migrationDate: e.target.value }))}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">Fecha de Pago / Recibo</label>
                  <input
                    type="date"
                    value={newOrder.customPaymentDate || newOrder.migrationDate || ''}
                    onChange={(e) => setNewOrder((p: any) => ({ ...p, customPaymentDate: e.target.value }))}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-stone-400 mb-1">Descuento Directo Histórico (Bs)</label>
                  <input
                    type="number"
                    value={newOrder.migrationFlatDiscount || ''}
                    onChange={(e) => setNewOrder((p: any) => ({ ...p, migrationFlatDiscount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm focus:border-amber-500 outline-none"
                    placeholder="Ej. 150"
                  />
                </div>
              </div>
            </div>
          )}
          {breakdown.lines.length > 0 && (
            <div className="flex justify-between items-center w-full text-stone-400 text-xs font-bold mb-2">
              <span>Subtotal</span>
              <span className="font-mono">Bs{breakdown.subtotal.toFixed(2)}</span>
            </div>
          )}
          {breakdown.lines.map((line: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center w-full text-amber-500 text-[10px] uppercase tracking-widest font-black mb-1">
              <span>{line.label}</span>
              <span className="font-mono">-Bs{line.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between items-end w-full mt-2 pt-2 border-t border-stone-800/50">
            <span className="text-xs font-black text-stone-500 uppercase tracking-widest">Total Estimado</span>
            <span className="text-3xl font-black text-white font-mono">Bs{breakdown.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        {orderHeaderMode === 'Cotización' ? (
          <button 
            type="submit" 
            disabled={newOrder.items.length === 0 || isSubmitting} 
            onClick={() => setNewOrder((p: any) => ({...p, status: 'Estimado'}))} 
            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <ClipboardList size={16}/> GUARDAR COTIZACIÓN
          </button>
        ) : (
          <button 
            type="button" 
            disabled={newOrder.items.length === 0} 
            onClick={() => {
              const total = calculateTotalPrice(newOrder.items, newOrder.category, newOrder.paymentMethod, newOrder.manualDiscount, newOrder.clientType, newOrder.accountId, newOrder.migrationFlatDiscount || 0);
              setOrderToCollect({ ...newOrder, isNew: true, totalPrice: total, id: editingQuoteId || undefined });
              const dueAmount = newOrder.paymentMethod === '100% Contado' ? total : total * 0.5;
              setManualAmount(dueAmount.toFixed(2));
              setManualReceipt(null);
            }} 
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-xl"
          >
            <CheckCircle size={16}/> Cobrar y Lanzar Orden
          </button>
        )}
      </div>
    </div>
  );
};
