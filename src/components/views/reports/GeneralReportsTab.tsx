import React from 'react';
import * as LucideIcons from 'lucide-react';
import { RankingsTab } from './RankingsTab';
import { ReporteVentasTable } from './ReporteVentasTable';
import { ReportePrendasTable } from './ReportePrendasTable';

const { 
  TrendingUp, Percent, DollarSign, Scissors, Sparkles, MapPin, ImageIcon, Eye 
} = LucideIcons;

export const formatDate = (d: any) => new Date(d).toLocaleDateString();

export interface GeneralReportsTabProps {
  reportesTab: string;
  reportStats: any;
  orders: any[];
  filteredReportOrders: any[];
  allOrdersLogos: any[];
  setExpandedLogoUrl: (url: string | null) => void;
  canExport: boolean;
  generateCsv: (orders: any[], filename: string) => void;
  generateGarmentsCsv: (orders: any[], filename: string) => void;
  getItemUnitPrice: (item: any, category?: string, accountId?: string) => number;
}

export const GeneralReportsTab: React.FC<GeneralReportsTabProps> = ({
  reportesTab,
  reportStats,
  orders,
  filteredReportOrders,
  allOrdersLogos,
  setExpandedLogoUrl,
  canExport,
  generateCsv,
  generateGarmentsCsv,
  getItemUnitPrice
}) => {
  if (reportesTab === 'prendas') {
    return (
      <ReportePrendasTable
        filteredReportOrders={filteredReportOrders}
        canExport={canExport}
        generateGarmentsCsv={generateGarmentsCsv}
        getItemUnitPrice={getItemUnitPrice}
      />
    );
  }

  if (reportesTab === 'ventas') {
    return (
      <ReporteVentasTable
        filteredReportOrders={filteredReportOrders}
        canExport={canExport}
        generateCsv={generateCsv}
      />
    );
  }

  // Dashboard Tab
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest bg-stone-900/30 px-4 py-1.5 rounded-xl border border-stone-800/40 inline-block font-sans">
        📊 Métricas basadas en <span className="text-amber-500 font-mono font-black">{reportStats.confirmedCount}</span> órdenes confirmadas y <span className="text-stone-400 font-mono font-black">{reportStats.ordersCount}</span> órdenes en total en este período.
      </div>

      {/* Cuadro General de Ingresos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-full blur-2xl"></div>
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1 font-sans">Volumen Total Vendido</p>
          <p className="text-3xl font-black text-white font-mono">Bs{Number(reportStats?.totalConfirmedRevenue || 0).toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider font-sans">
            <TrendingUp size={12} className="text-amber-500" /> Basado en órdenes confirmadas
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl"></div>
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1 font-sans">Monto Cobrado (Depósitos)</p>
          <p className="text-3xl font-black text-green-500 font-mono">Bs{Number(reportStats?.totalCollected || 0).toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-green-500 font-bold uppercase tracking-wider font-sans">
            <Percent size={12} /> {Number(reportStats?.totalConfirmedRevenue || 0) > 0 ? ((Number(reportStats?.totalCollected || 0) / Number(reportStats?.totalConfirmedRevenue || 1)) * 100).toFixed(1) : '0.0'}% recaudado
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1 font-sans">Saldo Pendiente de Cobro</p>
          <p className="text-3xl font-black text-amber-500 font-mono">Bs{Math.max(0, Number(reportStats?.totalConfirmedRevenue || 0) - Number(reportStats?.totalCollected || 0)).toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider font-sans">
            <DollarSign size={12} className="text-amber-500" /> Cuentas activas por cobrar
          </div>
        </div>
      </div>

      {/* Métricas de Manufactura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900/60 border border-stone-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Scissors size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-wider block font-sans">Prendas Producidas</span>
            <span className="text-xl font-black text-white font-mono">{reportStats?.totalGarments || 0} <span className="text-xs text-stone-500 font-normal">unidades</span></span>
          </div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-wider block font-sans">Ingresos por Servicios</span>
            <span className="text-xl font-black text-white font-mono">Bs{Number(reportStats?.totalServicesRevenue || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-wider block font-sans">Ticket Promedio</span>
            <span className="text-xl font-black text-white font-mono">Bs{Number(reportStats?.averageTicket || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MapPin size={20} />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-wider block font-sans">Prenda Más Vendida</span>
            <span className="text-sm font-black text-stone-200 uppercase truncate block max-w-[140px]" title={reportStats?.topGarment || 'N/A'}>{reportStats?.topGarment || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Rankings Component */}
      <RankingsTab reportStats={reportStats} />

      {/* Galería de Logos del Período */}
      <div className="bg-stone-900 border border-stone-800 p-8 rounded-[2rem] shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter flex items-center gap-2">
              <ImageIcon size={20} className="text-amber-500" /> Galería de Logos Activos
            </h3>
            <p className="text-xs text-stone-400 font-bold font-sans">Logos e insignias solicitadas en las órdenes confirmadas de este período ({allOrdersLogos.length} logos)</p>
          </div>
        </div>

        {allOrdersLogos.length === 0 ? (
          <div className="p-8 text-center bg-stone-950/50 rounded-2xl border border-stone-800/60">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">No se adjuntaron logos en las órdenes de este período.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allOrdersLogos.map((item, idx) => (
              <div key={idx} className="bg-stone-950 border border-stone-800/80 rounded-2xl p-3 flex flex-col items-center gap-2 group hover:border-amber-600/50 transition">
                <div 
                  className="w-full h-24 bg-stone-900 rounded-xl flex items-center justify-center p-2 cursor-pointer relative overflow-hidden"
                  onClick={() => setExpandedLogoUrl(item.url)}
                >
                  <img src={item.url} alt="Logo de orden" className="max-h-full max-w-full object-contain filter drop-shadow" />
                  <div className="absolute inset-0 bg-amber-600/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Eye size={18} className="text-white" />
                  </div>
                </div>
                <div className="w-full text-center">
                  <span className="text-[10px] font-mono text-amber-500 font-bold block">{item.orderId}</span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase truncate block" title={item.customer}>{item.customer}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
