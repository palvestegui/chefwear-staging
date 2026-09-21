import React from 'react';
import * as LucideIcons from 'lucide-react';
const { Award, Sparkles, Flame, CheckCircle2, HelpCircle } = LucideIcons;

export interface RankingsTabProps {
  reportStats: any;
  orders: any[];
}

export const RankingsTab: React.FC<RankingsTabProps> = ({
  reportStats,
  orders = []
}) => {
  const sellersArray = reportStats?.sellersArray || [];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Bento Grid de los Mejores Desempeños */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bloque: Mejor Cliente */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl space-y-4 hover:border-amber-600/30 transition shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <Award size={18} />
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest font-sans">Mejor Cliente</span>
            </div>
            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase font-sans">Rango Élite</span>
          </div>
          {reportStats.bestClient ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-black text-stone-200 uppercase tracking-tight truncate font-sans">{reportStats.bestClient.name}</h4>
                {reportStats.bestClient.company && (
                  <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider mt-0.5 font-sans">{reportStats.bestClient.company}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
                <div>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest font-sans">Total Comprado</p>
                  <p className="text-base font-black text-white font-mono">Bs{Number(reportStats?.bestClient?.totalSpent || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest font-sans">Órdenes</p>
                  <p className="text-base font-black text-white font-mono">{reportStats?.bestClient?.totalOrders || 0} pedidos</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-stone-500 text-xs font-bold text-center py-6 uppercase font-sans">Sin datos de clientes en este período</p>
          )}
        </div>

        {/* Bloque: Empresa Estrella */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl space-y-4 hover:border-amber-600/30 transition shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <Sparkles size={18} />
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest font-sans">Empresa Estrella</span>
            </div>
            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase font-sans">Institucional</span>
          </div>
          {reportStats?.bestCompany && Number(reportStats?.bestCompany?.spent || 0) > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-black text-stone-200 uppercase tracking-tight truncate font-sans">{reportStats.bestCompany.name}</h4>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5 font-sans">Mayor consumo corporativo</p>
              </div>
              <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest font-sans">Inversión Recibida</p>
                  <p className="text-lg font-black text-white font-mono">Bs{Number(reportStats.bestCompany.spent || 0).toFixed(2)}</p>
                </div>
                <div className="p-2 bg-stone-900 rounded-xl text-stone-400 border border-stone-800">
                  🏢
                </div>
              </div>
            </div>
          ) : (
            <p className="text-stone-500 text-xs font-bold text-center py-6 uppercase font-sans">Sin empresas registradas en este período</p>
          )}
        </div>

        {/* Bloque: Vendedor del Mes */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl space-y-4 hover:border-amber-600/30 transition shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                <Flame size={18} />
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest font-sans">Vendedor Líder</span>
            </div>
            <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded uppercase font-sans">Ventas</span>
          </div>
          {reportStats?.bestSeller && Number(reportStats?.bestSeller?.totalSales || 0) > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-black text-stone-200 uppercase tracking-tight truncate font-sans">{reportStats.bestSeller.name}</h4>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5 font-sans">Mayor volumen facturado</p>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
                <div>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest font-sans">Total Facturado</p>
                  <p className="text-base font-black text-white font-mono">Bs{Number(reportStats.bestSeller.totalSales || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest font-sans">Órdenes</p>
                  <p className="text-base font-black text-white font-mono">{reportStats.bestSeller.count || 0} cerradas</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-stone-500 text-xs font-bold text-center py-6 uppercase font-sans">Sin ventas registradas en este período</p>
          )}
        </div>
      </div>

      {/* Sección: Rendimiento de Vendedores */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter font-sans">Métricas de Vendedores</h3>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">
              Rendimiento por vendedor en el período seleccionado
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
            <HelpCircle size={12} className="text-amber-500" />
            <span>Conversión = Órdenes Confirmadas / Tratos Registrados</span>
          </div>
        </div>

        {sellersArray.length === 0 ? (
          <div className="text-center py-10 bg-stone-900 rounded-3xl border border-stone-800 text-stone-500 uppercase font-bold text-xs">
            No hay actividades de vendedores en este período
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellersArray.map((seller: any, idx: number) => (
              <div key={idx} className="bg-stone-900 border border-stone-800 p-6 rounded-3xl space-y-4 shadow-sm hover:border-amber-600/50 transition relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600"></div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-black text-base text-stone-100 uppercase tracking-tight truncate max-w-[180px] font-sans" title={seller.name}>
                      {seller.name}
                    </h4>
                    <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                      {seller.confirmedCount} confirmadas · {seller.quoteCount} cotizaciones
                    </p>
                  </div>
                  <span className="bg-stone-950 text-amber-500 font-mono font-bold px-2.5 py-1 rounded-lg text-[10px] border border-stone-800">
                    {seller.totalDeals} {seller.totalDeals === 1 ? 'trato' : 'tratos'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800/80 text-center">
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1 font-sans">Ventas Confirmadas</p>
                    <p className="text-base font-black text-white font-mono">Bs{Number(seller.totalSales || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800/80 text-center">
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1 font-sans">Tasa Conversión</p>
                    <p className={`text-base font-black font-mono ${Number(seller?.conversionRate || 0) >= 70 ? 'text-green-400' : Number(seller?.conversionRate || 0) >= 40 ? 'text-amber-400' : 'text-stone-400'}`}>
                      {Number(seller?.conversionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
