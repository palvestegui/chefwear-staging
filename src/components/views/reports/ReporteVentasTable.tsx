import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getInvoiceDate, getCurrentProductionStatus } from '../../../utils/orderUtils';
import { StatusBadge } from '../../ui/StatusBadge';
import { getOrderSellerName } from '../../../utils/sellerUtils';

const { Download } = LucideIcons;

export interface ReporteVentasTableProps {
  filteredReportOrders: any[];
  canExport: boolean;
  generateCsv: (orders: any[], filename: string) => void;
  pricing?: any;
}

export const ReporteVentasTable: React.FC<ReporteVentasTableProps> = ({
  filteredReportOrders,
  canExport,
  generateCsv
}) => {
  const eligibleOrders = filteredReportOrders.filter(
    x => x.status !== 'Estimado' && x.status !== 'Cotización'
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 p-6 md:p-8 rounded-[2rem] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter">Reporte de Ventas</h3>
            <p className="text-xs text-stone-400 font-bold font-sans mt-0.5">
              Control financiero integral: órdenes, estados de producción, descuentos y cobranza
            </p>
          </div>
          {canExport && (
            <button 
              onClick={() => generateCsv(filteredReportOrders, "reporte_ventas.csv")} 
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition flex items-center gap-2"
            >
              <Download size={14}/> Exportar CSV
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
            <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
              <tr>
                <th className="p-4">Orden</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Vendedor</th>
                <th className="p-4">Artículos</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Producción</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">Descuento</th>
                <th className="p-4">Total</th>
                <th className="p-4">Cobrado</th>
                <th className="p-4">Por Cobrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {eligibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-xs font-bold text-stone-500 uppercase tracking-widest">
                    No hay órdenes de venta en este período
                  </td>
                </tr>
              ) : (
                eligibleOrders.map((x, i) => {
                  const montoTotal = Number(x.totalPrice || 0);
                  const rawCollected = Number(x.amountCollected || 0);
                  const historySum = Array.isArray(x.paymentHistory) && x.paymentHistory.length > 0
                    ? x.paymentHistory.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
                    : rawCollected;
                  const effectiveCollected = Math.max(rawCollected, historySum);
                  const cobrado = Math.min(montoTotal, effectiveCollected);
                  const montoPorCobrar = Math.max(0, montoTotal - effectiveCollected);

                  const itemsMap: Record<string, number> = {};
                  let totalItemsCount = 0;
                  (x.items || []).forEach((it: any) => {
                    const name = it.name || 'Prenda';
                    const qty = Number(it.qty || 1);
                    itemsMap[name] = (itemsMap[name] || 0) + qty;
                    totalItemsCount += qty;
                  });
                  const itemsSold = Object.entries(itemsMap).map(([name, qty]) => `${qty}x ${name}`).join(', ');

                  const subtotal = Number(x.subtotal || montoTotal);
                  const explicitDiscount = Number(x.totalDiscount || x.migrationFlatDiscount || x.manualDiscount || 0);
                  const calculatedDiscount = Math.max(0, subtotal - montoTotal);
                  const discount = Math.max(explicitDiscount, calculatedDiscount);
                  const prodStatus = getCurrentProductionStatus(x);

                  return (
                    <tr key={i} className="hover:bg-stone-800/20 transition">
                      <td className="p-4 text-[10px] font-mono font-bold text-amber-500">{x.id}</td>
                      <td className="p-4 text-[10px] font-mono text-stone-500 whitespace-nowrap">
                        {new Date(getInvoiceDate(x)).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs font-bold text-stone-200 uppercase max-w-[160px] truncate" title={x.customer}>
                        {x.customer}
                      </td>
                      <td className="p-4 text-xs font-bold text-stone-300 uppercase whitespace-nowrap">
                        {getOrderSellerName(x)}
                      </td>
                      <td className="p-4 text-[10px] text-stone-400 max-w-[180px] truncate" title={itemsSold}>
                        <span className="font-mono font-bold text-stone-300">({totalItemsCount})</span> {itemsSold || 'Sin ítems'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StatusBadge status={x.status} />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-[9px] font-bold px-2 py-1 rounded bg-stone-950 text-amber-400 border border-stone-800 uppercase tracking-wider font-sans">
                          {prodStatus}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-stone-400">
                        Bs{subtotal.toFixed(2)}
                      </td>
                      <td className="p-4 text-xs font-mono text-stone-500">
                        {discount > 0 ? `-Bs${discount.toFixed(2)}` : 'Bs0.00'}
                      </td>
                      <td className="p-4 text-xs font-mono font-black text-white whitespace-nowrap">
                        Bs{montoTotal.toFixed(2)}
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-green-500 whitespace-nowrap">
                        Bs{cobrado.toFixed(2)}
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-red-400 whitespace-nowrap">
                        Bs{montoPorCobrar.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
