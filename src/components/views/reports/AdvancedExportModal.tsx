import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { PeriodFilterPicker } from './PeriodFilterPicker';
import { ReportTimeframe } from '../../../hooks/useReportsEngine';

const { X, Download, Database, Layers, Tag, FileSpreadsheet, Package, AlertCircle } = LucideIcons;

export interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredReportOrders: any[];
  filteredCanceledOrders?: any[];
  canExport: boolean;
  generateOrdersCsv: (orders: any[], filename?: string) => void;
  generateItemsCsv: (orders: any[], filename?: string) => void;
  generateModifiersCsv: (orders: any[], filename?: string) => void;
  generateCanceledCsv?: (orders: any[], filename?: string) => void;
  generateFullSnapshot?: (orders: any[], canceled: any[]) => void;
  getTable3OrderHeaders: (orders: any[]) => any[];
  getTable4OrderLineItems: (orders: any[]) => any[];
  getTable5LineItemModifiers: (orders: any[]) => any[];
  reportTimeframe?: ReportTimeframe;
  setReportTimeframe?: (tf: ReportTimeframe) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
}

export const AdvancedExportModal: React.FC<AdvancedExportModalProps> = ({
  isOpen,
  onClose,
  filteredReportOrders,
  filteredCanceledOrders = [],
  generateOrdersCsv,
  generateItemsCsv,
  generateModifiersCsv,
  generateCanceledCsv,
  generateFullSnapshot,
  getTable3OrderHeaders,
  getTable4OrderLineItems,
  getTable5LineItemModifiers,
  reportTimeframe,
  setReportTimeframe,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate
}) => {
  const [activeTab, setActiveTab] = useState<'ordenes' | 'items' | 'modificadores' | 'cancelados'>('ordenes');

  if (!isOpen) return null;

  const handleDownloadAll = () => {
    if (generateFullSnapshot) {
      generateFullSnapshot(filteredReportOrders, filteredCanceledOrders);
    } else {
      const now = new Date();
      const snapshotPrefix = `SNAPSHOT_${now.toISOString().replace(/[:.]/g, '-')}`;
      generateOrdersCsv(filteredReportOrders, `${snapshotPrefix}_1_Ordenes.csv`);
      generateItemsCsv(filteredReportOrders, `${snapshotPrefix}_2_Items.csv`);
      generateModifiersCsv(filteredReportOrders, `${snapshotPrefix}_3_Modificadores.csv`);
      if (generateCanceledCsv) {
        generateCanceledCsv(filteredCanceledOrders, `${snapshotPrefix}_4_Cancelados.csv`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-[95vw] max-w-[1700px] mx-auto max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600/10 border border-amber-600/20 text-amber-500 shrink-0">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Exportación Relacional y BI (4 Tablas)
              </h3>
              <p className="text-xs text-stone-400 font-medium">
                Tablas normalizadas para Power BI, Excel avanzado o SQL: Órdenes, Ítems, Modificadores y Cancelados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {setReportTimeframe && reportTimeframe && (
              <PeriodFilterPicker
                reportTimeframe={reportTimeframe}
                setReportTimeframe={setReportTimeframe}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
              />
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-stone-950/40 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('ordenes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
                activeTab === 'ordenes'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <FileSpreadsheet size={14} /> Órdenes
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
                activeTab === 'items'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Layers size={14} /> Ítems
            </button>
            <button
              onClick={() => setActiveTab('modificadores')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
                activeTab === 'modificadores'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Tag size={14} /> Modificadores
            </button>
            <button
              onClick={() => setActiveTab('cancelados')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
                activeTab === 'cancelados'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-stone-900 text-red-400/80 border-stone-800 hover:text-red-300'
              }`}
            >
              <AlertCircle size={14} /> Cancelados
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'ordenes' && (
              <button
                onClick={() => generateOrdersCsv(filteredReportOrders, "1_Ordenes.csv")}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
              >
                <Download size={14} /> Descargar Órdenes CSV
              </button>
            )}
            {activeTab === 'items' && (
              <button
                onClick={() => generateItemsCsv(filteredReportOrders, "2_Items.csv")}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
              >
                <Download size={14} /> Descargar Ítems CSV
              </button>
            )}
            {activeTab === 'modificadores' && (
              <button
                onClick={() => generateModifiersCsv(filteredReportOrders, "3_Modificadores.csv")}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
              >
                <Download size={14} /> Descargar Modificadores CSV
              </button>
            )}
            {activeTab === 'cancelados' && generateCanceledCsv && (
              <button
                onClick={() => generateCanceledCsv(filteredCanceledOrders, "4_Cancelados.csv")}
                className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
              >
                <Download size={14} /> Descargar Cancelados CSV
              </button>
            )}
            <button
              onClick={handleDownloadAll}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
              title="Descarga simultánea de los 4 archivos CSV estructurados"
            >
              <Package size={14} /> Descargar Snapshot Completo (4 CSVs)
            </button>
          </div>
        </div>

        {/* Table Content Preview */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'ordenes' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 font-mono">
                Tabla normalizada de cabeceras de orden (1 fila por orden). Clave Primaria: <span className="text-amber-400 font-bold">Order_ID</span>.
              </div>
              <div className="overflow-x-auto border border-stone-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
                    <tr>
                      <th className="p-3">Order_ID</th>
                      <th className="p-3">Payer_Account_ID</th>
                      <th className="p-3">Salesperson</th>
                      <th className="p-3">Date (ISO)</th>
                      <th className="p-3">Order_Status</th>
                      <th className="p-3">Production_Status</th>
                      <th className="p-3">Total_General</th>
                      <th className="p-3">Amount_Paid</th>
                      <th className="p-3">Cash_Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {getTable3OrderHeaders(filteredReportOrders).slice(0, 10).map((h, i) => (
                      <tr key={i} className="hover:bg-stone-800/20">
                        <td className="p-3 font-mono font-bold text-amber-500">{h.orderId}</td>
                        <td className="p-3 font-medium text-stone-300">{h.payerAccountId}</td>
                        <td className="p-3 text-stone-400">{h.salespersonName}</td>
                        <td className="p-3 font-mono text-stone-500">{h.orderDate.split('T')[0]}</td>
                        <td className="p-3">{h.orderStatus}</td>
                        <td className="p-3">{h.productionStatus}</td>
                        <td className="p-3 font-mono font-bold text-white">Bs{Number(h.totalGeneral || 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-green-500">Bs{Number(h.amountPaid || 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-red-400">Bs{Number(h.cashBalance || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 font-mono">
                Tabla normalizada de prendas (1 fila por prenda). Clave Primaria: <span className="text-amber-400 font-bold">Line_Item_ID</span>. Foránea: <span className="text-amber-400 font-bold">Order_ID</span>.
              </div>
              <div className="overflow-x-auto border border-stone-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
                    <tr>
                      <th className="p-3">Line_Item_ID</th>
                      <th className="p-3">Order_ID</th>
                      <th className="p-3">Garment_Type</th>
                      <th className="p-3">Fabric_Selected</th>
                      <th className="p-3">Sizing_Mode</th>
                      <th className="p-3">Size_Value</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Unit_Base_Price</th>
                      <th className="p-3">Line_Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {getTable4OrderLineItems(filteredReportOrders).slice(0, 10).map((li, i) => (
                      <tr key={i} className="hover:bg-stone-800/20">
                        <td className="p-3 font-mono font-bold text-amber-500">{li.lineItemId}</td>
                        <td className="p-3 font-mono text-stone-400">{li.orderId}</td>
                        <td className="p-3 font-medium text-stone-200">{li.garmentType}</td>
                        <td className="p-3 text-stone-400">{li.fabricSelected}</td>
                        <td className="p-3">{li.sizingMode}</td>
                        <td className="p-3 font-mono">{li.sizeValue}</td>
                        <td className="p-3 font-mono">{li.quantity}</td>
                        <td className="p-3 font-mono">Bs{Number(li.unitBasePrice || 0).toFixed(2)}</td>
                        <td className="p-3 font-mono font-bold text-white">Bs{Number(li.lineSubtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'modificadores' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 font-mono">
                Tabla normalizada de servicios y aditamentos (1 fila por bordado/bolsillo). Clave Primaria: <span className="text-amber-400 font-bold">Modifier_ID</span>. Foránea: <span className="text-amber-400 font-bold">Line_Item_ID</span>.
              </div>
              <div className="overflow-x-auto border border-stone-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
                    <tr>
                      <th className="p-3">Modifier_ID</th>
                      <th className="p-3">Line_Item_ID</th>
                      <th className="p-3">Service_Name</th>
                      <th className="p-3">Service_Type</th>
                      <th className="p-3">Custom_Text_Placement</th>
                      <th className="p-3">Unit_Cost</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Modifier_Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {getTable5LineItemModifiers(filteredReportOrders).slice(0, 10).map((m, i) => (
                      <tr key={i} className="hover:bg-stone-800/20">
                        <td className="p-3 font-mono font-bold text-amber-500">{m.modifierId}</td>
                        <td className="p-3 font-mono text-stone-400">{m.lineItemId}</td>
                        <td className="p-3 font-medium text-stone-200">{m.serviceName}</td>
                        <td className="p-3 text-stone-400">{m.serviceType}</td>
                        <td className="p-3 text-stone-400">{m.customTextPlacement}</td>
                        <td className="p-3 font-mono">Bs{Number(m.unitCost || 0).toFixed(2)}</td>
                        <td className="p-3 font-mono">{m.quantity}</td>
                        <td className="p-3 font-mono font-bold text-white">Bs{Number(m.modifierSubtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cancelados' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 font-mono">
                Tabla normalizada de auditoría de anulaciones y cancelaciones. Clave Primaria: <span className="text-red-400 font-bold">Order_ID</span>.
              </div>
              <div className="overflow-x-auto border border-stone-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
                    <tr>
                      <th className="p-3">Order_ID</th>
                      <th className="p-3">Comprobante</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Fecha Anulación</th>
                      <th className="p-3">Devuelto (Bs)</th>
                      <th className="p-3">Retenido (Bs)</th>
                      <th className="p-3">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {filteredCanceledOrders.slice(0, 10).map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-stone-800/20">
                        <td className="p-3 font-mono font-bold text-red-400">#{c.id}</td>
                        <td className="p-3 font-mono text-stone-400">{c.cancellationId || 'N/A'}</td>
                        <td className="p-3 font-medium text-stone-200">{c.customer}</td>
                        <td className="p-3 font-mono text-stone-400">
                          {c.cancellationDate || (c.canceledAt ? new Date(c.canceledAt).toLocaleDateString() : 'N/A')}
                        </td>
                        <td className="p-3 font-mono text-red-400">Bs{Number(c.refundAmount || 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-emerald-400">Bs{Number(c.retainedAmount || 0).toFixed(2)}</td>
                        <td className="p-3 text-stone-400 truncate max-w-[200px]" title={c.cancellationReason || c.cancelReason || 'N/A'}>
                          {c.cancellationReason || c.cancelReason || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
