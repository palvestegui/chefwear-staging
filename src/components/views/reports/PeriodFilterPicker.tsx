import React from 'react';
import { ReportTimeframe } from '../../../hooks/useReportsEngine';

interface PeriodFilterPickerProps {
  reportTimeframe: ReportTimeframe;
  setReportTimeframe: (tf: ReportTimeframe) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
}

const TIMEFRAME_OPTIONS: { id: ReportTimeframe; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta Semana' },
  { id: 'mes', label: 'Este Mes' },
  { id: 'trimestre', label: 'Este Trimestre' },
  { id: 'todo', label: 'Todo' },
  { id: 'personalizado', label: 'Personalizado' },
];

export const PeriodFilterPicker: React.FC<PeriodFilterPickerProps> = ({
  reportTimeframe,
  setReportTimeframe,
  customStartDate = '',
  setCustomStartDate,
  customEndDate = '',
  setCustomEndDate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-end sm:items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5 bg-stone-950/80 p-1 rounded-2xl border border-stone-800 shadow-inner">
        {TIMEFRAME_OPTIONS.map(tf => {
          const isActive = reportTimeframe === tf.id;
          return (
            <button
              key={tf.id}
              onClick={() => setReportTimeframe(tf.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm font-black'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {tf.label}
            </button>
          );
        })}
      </div>

      {reportTimeframe === 'personalizado' && setCustomStartDate && setCustomEndDate && (
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 px-2 rounded-xl border border-stone-800 animate-in fade-in">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black text-stone-500 uppercase">De:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold text-stone-200 focus:outline-none w-[110px]"
            />
          </div>
          <span className="text-stone-600 text-xs">-</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black text-stone-500 uppercase">A:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold text-stone-200 focus:outline-none w-[110px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
