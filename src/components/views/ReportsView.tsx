import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { GeneralReportsTab } from './reports/GeneralReportsTab';
import { CancellationsAuditTab } from './reports/CancellationsAuditTab';
import { AdvancedExportModal } from './reports/AdvancedExportModal';
import { useReportsEngine } from '../../hooks/useReportsEngine';

const { Download, Database } = LucideIcons;

export const formatDate = (d: any) => new Date(d).toLocaleDateString();

export interface ReportsViewProps {
  orders: any[];
  pricing: any;
  setExpandedLogoUrl: (url: string | null) => void;
  setViewingCancellationVoucherId: (id: string | null) => void;
  reportesTab?: string;
  setReportesTab?: (tab: string) => void;
  reportTimeframe?: string;
  setReportTimeframe?: (timeframe: any) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
  reportStats?: any;
  allOrdersLogos?: any[];
  canExport?: boolean;
  filteredReportOrders?: any[];
  filteredCanceledOrders?: any[];
  generateGarmentsCsv?: (orders?: any[], filename?: string) => void;
  generateCsv?: (orders?: any[], filename?: string) => void;
  generateOrdersCsv?: (orders?: any[], filename?: string) => void;
  generateItemsCsv?: (orders?: any[], filename?: string) => void;
  generateModifiersCsv?: (orders?: any[], filename?: string) => void;
  generateCanceledCsv?: (orders?: any[], filename?: string) => void;
  generateFullSnapshot?: (orders?: any[], canceled?: any[]) => void;
  getTable3OrderHeaders?: (orders?: any[]) => any[];
  getTable4OrderLineItems?: (orders?: any[]) => any[];
  getTable5LineItemModifiers?: (orders?: any[]) => any[];
  getItemUnitPrice?: (item: any, category?: string, accountId?: string) => number;
}

export const ReportsView: React.FC<ReportsViewProps> = (props) => {
  const engine = useReportsEngine(props.orders, props.pricing);
  const [showAdvancedExportModal, setShowAdvancedExportModal] = useState(false);

  const reportesTab = props.reportesTab || engine.reportesTab;
  const setReportesTab = props.setReportesTab || engine.setReportesTab;
  const reportTimeframe = props.reportTimeframe || engine.reportTimeframe;
  const setReportTimeframe = props.setReportTimeframe || engine.setReportTimeframe;
  const customStartDate = props.customStartDate || engine.customStartDate;
  const setCustomStartDate = props.setCustomStartDate || engine.setCustomStartDate;
  const customEndDate = props.customEndDate || engine.customEndDate;
  const setCustomEndDate = props.setCustomEndDate || engine.setCustomEndDate;

  const orders = props.orders || [];
  const reportStats = props.reportStats || engine.reportStats;
  const allOrdersLogos = props.allOrdersLogos || engine.allOrdersLogos;
  const setExpandedLogoUrl = props.setExpandedLogoUrl;
  const canExport = props.canExport !== undefined ? props.canExport : engine.canExport;
  const filteredReportOrders = props.filteredReportOrders || engine.filteredReportOrders;
  const filteredCanceledOrders = props.filteredCanceledOrders || engine.filteredCanceledOrders;

  const generateGarmentsCsv = props.generateGarmentsCsv || engine.generateGarmentsCsv;
  const generateCsv = props.generateCsv || engine.generateCsv;
  const generateOrdersCsv = props.generateOrdersCsv || engine.generateOrdersCsv;
  const generateItemsCsv = props.generateItemsCsv || engine.generateItemsCsv;
  const generateModifiersCsv = props.generateModifiersCsv || engine.generateModifiersCsv;
  const generateCanceledCsv = props.generateCanceledCsv || engine.generateCanceledCsv;
  const generateFullSnapshot = props.generateFullSnapshot || engine.generateFullSnapshot;
  const getTable3OrderHeaders = props.getTable3OrderHeaders || engine.getTable3OrderHeaders;
  const getTable4OrderLineItems = props.getTable4OrderLineItems || engine.getTable4OrderLineItems;
  const getTable5LineItemModifiers = props.getTable5LineItemModifiers || engine.getTable5LineItemModifiers;
  const getItemUnitPrice = props.getItemUnitPrice || engine.getItemUnitPrice;
  const setViewingCancellationVoucherId = props.setViewingCancellationVoucherId;

  // Active tab normalized
  const currentTab = ['dashboard', 'ventas', 'prendas', 'cancelados'].includes(reportesTab)
    ? reportesTab
    : 'dashboard';

  return (
    <div className="w-full space-y-4 animate-in fade-in">
      {/* Sleek Compact Tabs Row */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-900/80 rounded-xl border border-stone-800 w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'ventas', label: 'Reporte Ventas' },
          { id: 'prendas', label: 'Reporte Prendas' },
          { id: 'cancelados', label: 'Cancelados', isDanger: true },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setReportesTab(tab.id)} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentTab === tab.id 
                ? tab.isDanger
                  ? 'bg-red-600 text-white font-black shadow-sm'
                  : 'bg-stone-100 text-stone-900 font-black shadow-sm' 
                : tab.isDanger
                  ? 'text-red-400/80 hover:text-red-300 hover:bg-stone-800/50'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single 40px Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-1.5 rounded-xl border border-stone-800">
        {/* Left: Timeframe pills */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'semana', label: 'Esta Semana' },
            { id: 'mes', label: 'Este Mes' },
            { id: 'trimestre', label: 'Este Trimestre' },
            { id: 'todo', label: 'Todo' },
            { id: 'personalizado', label: 'Personalizado' },
          ].map(tf => (
            <button 
              key={tf.id}
              onClick={() => setReportTimeframe(tf.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                reportTimeframe === tf.id 
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              {tf.label}
            </button>
          ))}

          {reportTimeframe === 'personalizado' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-stone-800">
              <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
                <span className="text-[10px] font-bold text-stone-500">Desde:</span>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={e => setCustomStartDate(e.target.value)} 
                  className="bg-transparent text-xs font-mono text-stone-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
                <span className="text-[10px] font-bold text-stone-500">Hasta:</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={e => setCustomEndDate(e.target.value)} 
                  className="bg-transparent text-xs font-mono text-stone-200 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Export buttons */}
        {canExport && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button 
              onClick={() => {
                if (generateFullSnapshot) {
                  generateFullSnapshot(filteredReportOrders, filteredCanceledOrders);
                } else {
                  const now = new Date();
                  const snapshotPrefix = `SNAPSHOT_${now.toISOString().replace(/[:.]/g, '-')}`;
                  generateOrdersCsv(filteredReportOrders, `${snapshotPrefix}_1_Ordenes.csv`);
                  generateItemsCsv(filteredReportOrders, `${snapshotPrefix}_2_Items.csv`);
                  generateModifiersCsv(filteredReportOrders, `${snapshotPrefix}_3_Modificadores.csv`);
                  generateCanceledCsv(filteredCanceledOrders, `${snapshotPrefix}_4_Cancelados.csv`);
                }
              }} 
              className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
            >
              <Download size={13}/>
              <span>Snapshot Completo (4 CSVs)</span>
            </button>
            <button
              onClick={() => setShowAdvancedExportModal(true)}
              className="bg-stone-800/80 hover:bg-stone-700 text-amber-400 border border-stone-700/60 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
              title="Exportación Relacional / BI (4 Tablas)"
            >
              <Database size={13} />
              <span>Exportación Relacional / BI</span>
            </button>
            <button
              onClick={() => {
                if (currentTab === 'prendas' && generateGarmentsCsv) {
                  generateGarmentsCsv(filteredReportOrders, "reporte_prendas.csv");
                } else if (currentTab === 'cancelados' && generateCanceledCsv) {
                  generateCanceledCsv(filteredCanceledOrders, "reporte_cancelados.csv");
                } else if (generateCsv) {
                  generateCsv(filteredReportOrders, "reporte_ventas.csv");
                }
              }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/60 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
            >
              <Download size={13} />
              <span>Exportar CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs Render */}
      {(currentTab === 'dashboard' || currentTab === 'prendas' || currentTab === 'ventas') && (
        <GeneralReportsTab
          reportesTab={currentTab}
          reportStats={reportStats}
          orders={orders}
          filteredReportOrders={filteredReportOrders}
          allOrdersLogos={allOrdersLogos}
          setExpandedLogoUrl={setExpandedLogoUrl}
          canExport={canExport}
          generateCsv={generateCsv}
          generateGarmentsCsv={generateGarmentsCsv}
          getItemUnitPrice={getItemUnitPrice}
        />
      )}

      {currentTab === 'cancelados' && (
        <CancellationsAuditTab
          filteredCanceledOrders={filteredCanceledOrders}
          canExport={canExport}
          generateCanceledCsv={generateCanceledCsv}
          generateCsv={generateCsv}
          setViewingCancellationVoucherId={setViewingCancellationVoucherId}
        />
      )}

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={showAdvancedExportModal}
        onClose={() => setShowAdvancedExportModal(false)}
        filteredReportOrders={filteredReportOrders}
        filteredCanceledOrders={filteredCanceledOrders}
        canExport={canExport}
        generateOrdersCsv={generateOrdersCsv}
        generateItemsCsv={generateItemsCsv}
        generateModifiersCsv={generateModifiersCsv}
        generateCanceledCsv={generateCanceledCsv}
        generateFullSnapshot={generateFullSnapshot}
        getTable3OrderHeaders={getTable3OrderHeaders}
        getTable4OrderLineItems={getTable4OrderLineItems}
        getTable5LineItemModifiers={getTable5LineItemModifiers}
        reportTimeframe={reportTimeframe}
        setReportTimeframe={setReportTimeframe}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
      />
    </div>
  );
};
