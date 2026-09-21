import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getInvoiceDate } from '../../../utils/orderUtils';

const { Download } = LucideIcons;

export interface ReportePrendasTableProps {
  filteredReportOrders: any[];
  canExport: boolean;
  generateGarmentsCsv: (orders: any[], filename: string) => void;
  getItemUnitPrice: (item: any, category?: string, accountId?: string) => number;
}

export const ReportePrendasTable: React.FC<ReportePrendasTableProps> = ({
  filteredReportOrders,
  canExport,
  generateGarmentsCsv,
  getItemUnitPrice
}) => {
  const eligibleOrders = filteredReportOrders.filter(
    x => x.status !== 'Estimado' && x.status !== 'Cotización'
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 p-6 md:p-8 rounded-[2rem] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter">Reporte de Prendas y Manufactura</h3>
            <p className="text-xs text-stone-400 font-bold font-sans mt-0.5">
              Desglose a nivel ítem: especificaciones de confección, telas, tallaje y servicios
            </p>
          </div>
          {canExport && (
            <button 
              onClick={() => generateGarmentsCsv(filteredReportOrders, "reporte_prendas.csv")} 
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
                <th className="p-4">Prenda</th>
                <th className="p-4">Tela / Color</th>
                <th className="p-4">Talla / Modo</th>
                <th className="p-4">Servicios / Bordados</th>
                <th className="p-4 text-center">Cant</th>
                <th className="p-4 text-right">Precio U.</th>
                <th className="p-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {eligibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs font-bold text-stone-500 uppercase tracking-widest">
                    No hay prendas registradas en este período
                  </td>
                </tr>
              ) : (
                eligibleOrders.flatMap((x) => (x.items || []).map((it: any, idx: number) => {
                  const unitPrice = getItemUnitPrice(it, x.category, x.accountId);
                  const qty = Number(it.qty || 1);
                  const subtotal = unitPrice * qty;

                  let sizeInfo = 'Estándar';
                  if (it.sizingMode === 'Custom Tailored' || (it.measurements && Object.keys(it.measurements).length > 0)) {
                    sizeInfo = 'A Medida';
                  } else if (it.size) {
                    sizeInfo = `Talla ${it.size}`;
                  }

                  const modifiersList: string[] = [];
                  if (it.services && Array.isArray(it.services)) {
                    modifiersList.push(...it.services);
                  }
                  if (it.embroideries && Array.isArray(it.embroideries) && it.embroideries.length > 0) {
                    modifiersList.push(`Bordado: ${it.embroideries.join(', ')}`);
                  }
                  if (it.pocketName) {
                    modifiersList.push(`Bolsillo: ${it.pocketName}`);
                  }
                  const modText = modifiersList.join(' • ');

                  return (
                    <tr key={`${x.id}-${idx}`} className="hover:bg-stone-800/20 transition">
                      <td className="p-4 text-[10px] font-mono font-bold text-amber-500">{x.id}</td>
                      <td className="p-4 text-[10px] font-mono text-stone-500 whitespace-nowrap">
                        {new Date(getInvoiceDate(x)).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs font-bold text-stone-300 uppercase max-w-[150px] truncate" title={x.customer}>
                        {x.customer}
                      </td>
                      <td className="p-4 text-xs font-bold text-stone-100 uppercase">
                        {it.name}
                      </td>
                      <td className="p-4 text-xs text-stone-400">
                        {it.fabric || '-'} {it.fabricColor ? `(${it.fabricColor})` : ''}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-950 text-stone-300 border border-stone-800 font-sans">
                          {sizeInfo}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] text-stone-400 max-w-[200px] truncate" title={modText || 'Ninguno'}>
                        {modText || <span className="text-stone-600 italic">Ninguno</span>}
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-stone-200 text-center">
                        {qty}
                      </td>
                      <td className="p-4 text-xs font-mono text-stone-400 text-right">
                        Bs{unitPrice.toFixed(2)}
                      </td>
                      <td className="p-4 text-xs font-mono font-black text-white text-right whitespace-nowrap">
                        Bs{subtotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                }))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
