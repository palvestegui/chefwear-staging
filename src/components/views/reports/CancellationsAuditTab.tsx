import React from 'react';
import * as LucideIcons from 'lucide-react';
const { Download } = LucideIcons;

export const formatDate = (d: any) => new Date(d).toLocaleDateString();

export interface CancellationsAuditTabProps {
  filteredCanceledOrders: any[];
  canExport: boolean;
  generateCanceledCsv?: (data: any[], filename?: string) => void;
  generateCsv?: (data: any[], filename: string) => void;
  setViewingCancellationVoucherId: (id: string | null) => void;
}

export const CancellationsAuditTab: React.FC<CancellationsAuditTabProps> = ({
  filteredCanceledOrders,
  canExport,
  generateCanceledCsv,
  generateCsv,
  setViewingCancellationVoucherId
}) => {
  const handleExport = () => {
    if (generateCanceledCsv) {
      generateCanceledCsv(filteredCanceledOrders, "4_Cancelados.csv");
    } else if (generateCsv) {
      generateCsv(filteredCanceledOrders, "4_Cancelados.csv");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 p-8 rounded-[2rem] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter">Reporte de Anulaciones</h3>
            <p className="text-xs text-stone-400 font-bold font-sans">Historial financiero y auditoría de órdenes canceladas</p>
          </div>
          {canExport && (
            <button 
              onClick={handleExport} 
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition flex items-center gap-2"
            >
              <Download size={14}/> Exportar CSV
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-stone-950 border border-stone-800 p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Órdenes Anuladas</p>
            <p className="text-2xl font-black text-stone-200">{filteredCanceledOrders.length}</p>
          </div>
          <div className="bg-red-950/20 border border-red-900/30 p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Monto Devuelto (Egresos)</p>
            <p className="text-2xl font-black text-red-400 font-mono">Bs{filteredCanceledOrders.reduce((a, b) => a + (Number(b.refundAmount || 0)), 0).toFixed(2)}</p>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Monto Retenido (Ingresos)</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">Bs{filteredCanceledOrders.reduce((a, b) => a + (Number(b.retainedAmount || 0)), 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
              <tr>
                <th className="p-4">Fecha Anulación</th>
                <th className="p-4">ID Orden</th>
                <th className="p-4">Comprobante</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Resolución</th>
                <th className="p-4">Devuelto</th>
                <th className="p-4">Retenido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {filteredCanceledOrders.map((x, i) => (
                <tr key={i} className="hover:bg-stone-800/20 transition cursor-pointer" onClick={() => setViewingCancellationVoucherId(x.id)}>
                  <td className="p-4 text-[10px] font-mono font-bold text-stone-400">
                    {formatDate(x.cancellationDate || (x.canceledAt ? new Date(x.canceledAt).toISOString() : new Date().toISOString()))}
                  </td>
                  <td className="p-4 text-[10px] font-mono text-stone-300">#{x.id}</td>
                  <td className="p-4 text-[10px] font-mono text-red-400 font-bold">{x.cancellationId || 'N/A'}</td>
                  <td className="p-4 text-xs font-bold text-stone-300">{x.customer}</td>
                  <td className="p-4 text-[10px] font-bold text-stone-400 uppercase">{x.cancellationType || 'Anulado'}</td>
                  <td className="p-4 text-xs font-mono font-bold text-red-400">Bs{Number(x.refundAmount || 0).toFixed(2)}</td>
                  <td className="p-4 text-xs font-mono font-bold text-emerald-400">Bs{Number(x.retainedAmount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
