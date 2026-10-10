import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Ruler } from 'lucide-react';
const { 
  ImageIcon, FileText, CheckCircle, Lock, Building2, User, Users, ChevronDown, ChevronUp
} = LucideIcons;
import { StatusBadge } from '../ui/StatusBadge';
import { consolidateCommercialItems, resolveItemEmbroideries } from '../../utils/orderItemConsolidation';
import { useData } from '../../contexts/DataContext';
import { detectServiceExclusionConflicts } from '../../utils/serviceUtils';
import { isUpperTailored, isLowerTailored, isTailored, isBundleGarment, getMeasurementButtonLabel, getMeasurementPoints } from '../../utils/garmentMeasurementUtils';

export interface ProductionViewProps {
  orders: any[];
  setViewingLogosOrderId: (id: string | null) => void;
  setViewingInvoiceId: (id: string | null) => void;
  isWriteDisabled: (view: string) => boolean;
  updateStatus: (id: string, status: string) => Promise<void>;
  setExpandedLogoUrl: (url: string | null) => void;
  onOpenEditRoster?: (order: any, readOnly?: boolean) => void;
}

const hasValues = (obj: any) => obj && Object.values(obj).some((v: any) => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '0');

const getGarmentSpecs = (order: any, item: any) => {
  const isBundle = isBundleGarment(item.name);
  const isFilipina = isUpperTailored(item.name);
  const isPantalon = isLowerTailored(item.name);
  const isTailoredGarment = isTailored(item.name);

  if (!isTailoredGarment) {
    return { filMeasurements: null, panMeasurements: null, showFil: false, showPan: false, isCustom: false, hasDirectSpecs: false };
  }

  const filSibling = (order.items || []).find((it: any) => isUpperTailored(it.name));
  const filMeasurements = (filSibling?.measurements && Object.keys(filSibling.measurements).length > 0)
    ? filSibling.measurements
    : (isFilipina && item.measurements ? item.measurements : (order.measurements?.filipina || order.measurements || order.contact?.measurements?.filipina || order.contact?.measurements || null));

  const panSibling = (order.items || []).find((it: any) => isLowerTailored(it.name));
  const panMeasurements = (panSibling?.measurements && Object.keys(panSibling.measurements).length > 0)
    ? panSibling.measurements
    : (isPantalon && item.measurements ? item.measurements : (order.measurements?.pantalon || order.measurements || order.contact?.measurements?.pantalon || order.contact?.measurements || null));

  const hasFilSpecs = hasValues(filMeasurements);
  const hasPanSpecs = hasValues(panMeasurements);
  const hasDirectSpecs = hasValues(item.measurements);
  
  const showFil = hasFilSpecs && (isBundle || isFilipina);
  const showPan = hasPanSpecs && (isBundle || isPantalon);
  const isCustom = showFil || showPan || (hasDirectSpecs && (isBundle || isFilipina || isPantalon));
  
  return { filMeasurements, panMeasurements, showFil, showPan, isCustom, hasDirectSpecs };
};


const MobileMeasurementGrid = ({ label, specs, isPan, colsOverride }: { label: string, specs: any, isPan?: boolean, colsOverride?: string }) => {
  const points = getMeasurementPoints(specs, isPan);

  return (
    <div>
      <span className="text-[10px] font-black text-amber-500 mb-1.5 block">{label}</span>
      <div className={`grid ${colsOverride || 'grid-cols-2 sm:grid-cols-4 landscape:grid-cols-4'} gap-1.5 w-full`}>
        {points.map((p, i) => (
          <div key={i} className="bg-stone-900/90 border border-stone-800/80 rounded-md p-1.5 flex flex-col items-center justify-center text-center w-full">
            <span className="text-[9px] font-bold text-stone-400 uppercase whitespace-normal leading-tight block">{p.k}</span>
            <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap mt-0.5">{p.v || '—'} cm</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DesktopMeasurementInline = ({ label, specs, isPan }: { label: string, specs: any, isPan?: boolean }) => {
  const points = getMeasurementPoints(specs, isPan);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-stone-300">
      <span className="font-black text-amber-500 uppercase">{label}:</span>
      {points.map((p, i) => (
        <span key={i} className="whitespace-nowrap">
          <span className="text-stone-500">{p.k}:</span> <span className="text-amber-400 font-bold">{p.v || '—'} cm</span>
        </span>
      ))}
    </div>
  );
};

export const ProductionView: React.FC<ProductionViewProps> = (props) => {
  const { orders, isWriteDisabled, updateStatus, setViewingInvoiceId, setViewingLogosOrderId, setExpandedLogoUrl, onOpenEditRoster } = props;
  const { pricing } = useData();
  const [expandedMeasurements, setExpandedMeasurements] = useState<Record<string, boolean>>({});
  const [expandedRosterOrderId, setExpandedRosterOrderId] = useState<string | null>(null);

  const toggleMeasurements = (idx: string) => {
    setExpandedMeasurements(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const ActionButtons = ({ order, isInstitutional }: { order: any, isInstitutional: boolean }) => {
    const isRosterExpanded = expandedRosterOrderId === order.id;
    return (
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {isInstitutional && (
          <button 
            onClick={() => setExpandedRosterOrderId(isRosterExpanded ? null : order.id)}
            className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 h-7 px-2 rounded-lg font-black uppercase text-[10px] tracking-wider flex items-center justify-center shrink-0 transition cursor-pointer"
          >
            <Users size={12} /> <span className="hidden sm:inline landscape:inline ml-1">{isRosterExpanded ? 'Ocultar' : `Nómina (${order.items?.length || 0})`}</span>
          </button>
        )}
        {order.logos && order.logos.length > 0 && (
          <button onClick={() => setViewingLogosOrderId(order.id)} className="bg-stone-800 hover:bg-stone-700 text-amber-500 border border-stone-700 h-7 px-2 rounded-lg font-black uppercase text-[10px] tracking-wider flex items-center justify-center shrink-0 transition">
            <ImageIcon size={12}/> <span className="hidden sm:inline landscape:inline ml-1">Logos ({order.logos.length})</span>
          </button>
        )}
        <button onClick={() => setViewingInvoiceId(order.id)} className="bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 h-7 px-2 rounded-lg font-black uppercase text-[10px] tracking-wider transition shrink-0 flex items-center justify-center">
          📄 <span className="hidden sm:inline landscape:inline ml-1">Orden</span>
        </button>
        {order.status === 'Material Listo' ? (
          !isWriteDisabled('produccion') ? (
            <button onClick={() => updateStatus(order.id, 'En Producción')} className="bg-purple-600 text-white h-7 px-2.5 rounded-lg font-black uppercase text-[10px] tracking-wider hover:bg-purple-500 transition shadow-lg flex items-center justify-center gap-1 shrink-0">▶ INICIAR</button>
          ) : (
            <span className="bg-stone-850 border border-stone-800 text-stone-500 h-7 px-2 rounded-lg font-black uppercase text-[10px] flex items-center justify-center shrink-0"><Lock size={10}/></span>
          )
        ) : (
          !isWriteDisabled('produccion') ? (
            <button onClick={() => updateStatus(order.id, 'Producido')} className="bg-indigo-600 text-white h-7 px-2.5 rounded-lg font-black uppercase text-[10px] tracking-wider hover:bg-indigo-500 transition shadow-lg flex items-center justify-center gap-1 shrink-0"><CheckCircle size={12}/> TERMINAR</button>
          ) : (
            <span className="bg-stone-850 border border-stone-800 text-stone-500 h-7 px-2 rounded-lg font-black uppercase text-[10px] flex items-center justify-center shrink-0"><Lock size={10}/></span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      {/* DESKTOP LEDGER (lg+) */}
      <div className="hidden lg:block w-full bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[180px_100px_minmax(150px,1fr)_120px_150px_minmax(160px,auto)] gap-2 p-3 border-b border-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-400 bg-stone-950/50 items-center">
          <div>CLIENTE</div>
          <div>ESTADO</div>
          <div>PRENDAS & TELA</div>
          <div>TALLA / MEDIDAS</div>
          <div>NOTAS & BORDADOS</div>
          <div>ACCIONES</div>
        </div>
        <div className="divide-y divide-stone-800/60">
          {orders.filter(o => ['Material Listo', 'En Producción', 'En Confección'].includes(o.status)).flatMap(order => {
            const isInst = Boolean(order.isInstitutional || order.institutionalRoster?.length > 0 || order.items?.some((it:any) => Boolean(it.recipientName)));
            const items = consolidateCommercialItems(order.items || [], isInst);
            return items.map((item, idx) => {
              const { isCustom, filMeasurements, panMeasurements, showFil, showPan, hasDirectSpecs } = getGarmentSpecs(order, item);
              const k = `${order.id}-${idx}`;
              const isFirst = idx === 0;
              return (
                <React.Fragment key={k}>
                  <div className="grid grid-cols-[180px_100px_minmax(150px,1fr)_120px_150px_minmax(160px,auto)] gap-2 py-3 px-3 items-center hover:bg-stone-800/30 transition">
                    <div className="font-black text-sm text-stone-200 uppercase tracking-tight truncate max-w-[180px]">
                      {isFirst ? order.customer : ''}
                    </div>
                    <div className="scale-90 origin-left">
                      {isFirst && <StatusBadge status={order.status} />}
                    </div>
                    <div className="text-xs text-stone-300 font-bold min-w-0">
                      <div className="truncate">
                        <span className="text-amber-500/80 mr-1">x{item.qty || 1}</span> {item.name} <span className="text-[10px] text-stone-500 font-mono block truncate">{item.fabric || 'Drill 8oz'}</span>
                      </div>
                      {item.services && item.services.length > 0 && (() => {
                        const conflicts = detectServiceExclusionConflicts(item.services, pricing?.services);
                        const conflictingSet = new Set(conflicts.flatMap(c => c.services));
                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conflicts.map(c => (
                              <span
                                key={`conflict-${c.group}`}
                                className="text-[9px] font-black text-amber-300 bg-amber-950/90 border border-amber-500/70 px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 animate-pulse"
                                title={`Conflicto en grupo ${c.group}: Se seleccionaron múltiples opciones incompatibles`}
                              >
                                ⚠️ Conflicto: {c.services.join(' / ')}
                              </span>
                            ))}
                            {item.services
                              .filter((srv: string) => !conflictingSet.has(srv))
                              .map((srv: string, sIdx: number) => (
                                <span key={sIdx} className="text-[9px] font-bold text-amber-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                                  {srv}
                                </span>
                              ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      {isTailored(item.name) && isCustom ? (
                        <button onClick={() => toggleMeasurements(k)} className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition">
                          <Ruler size={10}/> {getMeasurementButtonLabel(item.name)} {expandedMeasurements[k] ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        </button>
                      ) : isTailored(item.name) ? (
                        <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded inline-block">
                          Talla: {item.size || 'STD'}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-stone-500">—</span>
                      )}
                    </div>
                    <div className="text-xs text-amber-500/90 italic truncate max-w-[150px]">
                      {(() => {
                        const embs = resolveItemEmbroideries(item);
                        const text = embs.length > 0 ? embs.join(', ') : ((isFirst ? order.notes : '') || '—');
                        const hasWarning = embs.some(e => e.startsWith('⚠️'));
                        const hasPocket = embs.some(e => e.toLowerCase().includes('bolsillo') || e.toLowerCase().includes('nombre'));
                        return (
                          <span
                            className={
                              hasWarning
                                ? 'bg-red-950/60 border border-red-500/40 text-red-400 font-black px-1.5 py-0.5 rounded inline-block text-[10px]'
                                : hasPocket
                                ? 'font-bold text-amber-400'
                                : ''
                            }
                            title={text}
                          >
                            {text}
                          </span>
                        );
                      })()}
                    </div>
                    <div>
                      {isFirst && <ActionButtons order={order} isInstitutional={isInst} />}
                    </div>
                  </div>
                  {expandedMeasurements[k] && isCustom && isTailored(item.name) && (
                    <div className="bg-stone-950 p-3 border-t border-stone-800/80 flex flex-col gap-2">
                      {showFil && <DesktopMeasurementInline label="👘 FILIPINA" specs={filMeasurements} />}
                      {showPan && <DesktopMeasurementInline label="👖 PANTALÓN" specs={panMeasurements} isPan />}
                    </div>
                  )}
                  {isInst && expandedRosterOrderId === order.id && isFirst && (
                    <div className="bg-stone-950 border-t border-stone-800 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                          <Users size={14} /> Detalle de Nómina Individual ({order.items?.length || 0} prendas)
                        </span>
                        {onOpenEditRoster && (
                          <button onClick={() => onOpenEditRoster(order, true)} className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer">
                            VER NÓMINA COMPLETA
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar p-1">
                        {order.items.map((it: any, itIdx: number) => (
                          <div key={itIdx} className="bg-stone-900/80 border border-stone-800/80 p-2.5 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-stone-200 truncate">{it.recipientName || `Prenda #${itIdx + 1}`}</span>
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-stone-950 px-1.5 py-0.5 rounded">{it.size || 'STD'}</span>
                            </div>
                            <p className="text-[10px] text-stone-400 truncate">{it.name} • {it.fabric || 'Drill'}</p>
                            {it.recipientNotes && <p className="text-[9px] text-amber-300/80 italic truncate">Obs: {it.recipientNotes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            });
          })}
        </div>
      </div>

                  {/* MOBILE CARD ( < lg ) */}
      <div className="lg:hidden flex flex-col gap-4">
        {orders.filter(o => ['Material Listo', 'En Producción', 'En Confección'].includes(o.status)).map(order => {
          const isInst = Boolean(order.isInstitutional || order.institutionalRoster?.length > 0 || order.items?.some((it:any) => Boolean(it.recipientName)));
          const items = consolidateCommercialItems(order.items || [], isInst);
          const isRosterExpanded = expandedRosterOrderId === order.id;
          
          return (
            <React.Fragment key={order.id}>
              {items.map((item, idx) => {
                const { isCustom, filMeasurements, panMeasurements, showFil, showPan, hasDirectSpecs } = getGarmentSpecs(order, item);
                const k = `${order.id}-${idx}`;
                return (
                  <div key={k} className="h-auto flex flex-col gap-2 p-3.5 sm:p-4 rounded-2xl bg-stone-900 border border-stone-800 w-full">
                    
                    {/* Row A (Customer Name & Status) */}
                    <div className="flex items-center justify-between gap-2 w-full border-b border-stone-800/60 pb-1.5">
                      <h3 className="font-black text-base sm:text-lg text-stone-100 uppercase tracking-tight leading-tight">
                        {order.customer}
                      </h3>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Row B (Garment Summary & Buttons) */}
                    <div className="flex flex-col sm:flex-row landscape:flex-row items-start sm:items-center landscape:items-center justify-between gap-2 w-full py-0.5">
                      {/* Garment Title - Takes full row in portrait, inline in landscape */}
                      <div className="flex flex-col gap-1 w-full sm:w-auto landscape:w-auto">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-stone-200 uppercase whitespace-normal leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-amber-500 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 shrink-0">
                            x{item.qty || 1} {item.fabric ? `• ${item.fabric}` : ''}
                          </span>
                        </div>
                        {item.services && item.services.length > 0 && (() => {
                          const conflicts = detectServiceExclusionConflicts(item.services, pricing?.services);
                          const conflictingSet = new Set(conflicts.flatMap(c => c.services));
                          return (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {conflicts.map(c => (
                                <span
                                  key={`m-conflict-${c.group}`}
                                  className="text-[9px] font-black text-amber-300 bg-amber-950/90 border border-amber-500/70 px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 animate-pulse"
                                  title={`Conflicto en grupo ${c.group}: Se seleccionaron múltiples opciones incompatibles`}
                                >
                                  ⚠️ Conflicto: {c.services.join(' / ')}
                                </span>
                              ))}
                              {item.services
                                .filter((srv: string) => !conflictingSet.has(srv))
                                .map((srv: string, sIdx: number) => (
                                  <span key={sIdx} className="text-[9px] font-bold text-amber-400 bg-stone-950 border border-stone-800 px-1.5 py-0.5 rounded">
                                    {srv}
                                  </span>
                                ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Action Controls - Full-width right-aligned in portrait, inline in landscape */}
                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto landscape:w-auto justify-end">
                        <button
                          onClick={() => setViewingInvoiceId(order.id)}
                          className="h-7 px-2 text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg font-black uppercase tracking-wider flex items-center gap-1 transition"
                        >
                          <FileText size={12} /> Orden
                        </button>
                        {order.status === 'Material Listo' ? (
                          !isWriteDisabled('produccion') && (
                            <button
                              onClick={() => updateStatus(order.id, 'En Producción')}
                              className="h-7 px-2.5 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-black uppercase tracking-wider flex items-center gap-1 transition shadow-sm"
                            >
                              ▶ Iniciar
                            </button>
                          )
                        ) : (
                          !isWriteDisabled('produccion') && (
                            <button
                              onClick={() => updateStatus(order.id, 'Producido')}
                              className="h-7 px-2.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black uppercase tracking-wider flex items-center gap-1 transition shadow-sm"
                            >
                              <CheckCircle size={12} /> Terminar
                            </button>
                          )
                        )}
                        {isTailored(item.name) && isCustom && (
                          <button
                            onClick={() => toggleMeasurements(k)}
                            className="h-7 px-2.5 text-[10px] text-amber-400 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg font-black uppercase tracking-wider flex items-center gap-1 transition"
                          >
                            📏 {getMeasurementButtonLabel(item.name)} {expandedMeasurements[k] ? '▴' : '▾'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* REMAINDER: Drawer, Size, Ref Images */}
                    <div className="flex flex-col w-full">
                      {item.referenceImages && item.referenceImages.length > 0 && (
                        <div className="mt-2 mb-1 bg-stone-900/40 p-2 rounded-xl border border-stone-850">
                          <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest block mb-1.5">Ref</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.referenceImages.map((img: any, imgIdx: number) => (
                              <div key={imgIdx} className="relative group bg-stone-950 border border-stone-850 p-1 rounded-lg flex items-center gap-1">
                                <img src={img.url} alt="Ref" className="w-8 h-8 object-cover rounded border border-stone-800 cursor-zoom-in" onClick={() => setExpandedLogoUrl(img.url)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedMeasurements[k] && isCustom && isTailored(item.name) && (
                        <div className="bg-stone-950/90 border border-amber-500/30 p-2.5 sm:p-3 rounded-xl w-full mt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {showFil && (
                              <div className="w-full">
                                <MobileMeasurementGrid label="👘 FILIPINA" specs={filMeasurements} isPan={false} colsOverride="grid-cols-2 sm:grid-cols-4 landscape:grid-cols-4" />
                              </div>
                            )}
                            {showPan && (
                              <div className="w-full">
                                <MobileMeasurementGrid label="👖 PANTALÓN" specs={panMeasurements} isPan={true} colsOverride="grid-cols-2 sm:grid-cols-4 landscape:grid-cols-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {(!isCustom || !isTailored(item.name)) && (
                        <div className="mt-2 w-full">
                          {isTailored(item.name) ? (
                            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-md inline-block">
                              Talla: {item.size || 'STD'}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-stone-500">—</span>
                          )}
                        </div>
                      )}

                      {(() => {
                        const embs = resolveItemEmbroideries(item);
                        if (embs.length === 0) return null;
                        return (
                          <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800 mt-2 w-full">
                            <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Bordados Requeridos</div>
                            <div className="text-[10px] space-y-0.5">
                              {embs.map((emb: string, eIdx: number) => {
                                const isWarning = emb.startsWith('⚠️');
                                const isBolsillo = emb.toLowerCase().includes('bolsillo') || emb.toLowerCase().includes('nombre');
                                return (
                                  <div
                                    key={eIdx}
                                    className={`flex items-center gap-1.5 font-bold ${
                                      isWarning
                                        ? 'bg-red-950/60 border border-red-500/40 text-red-400 font-black px-1.5 py-0.5 rounded'
                                        : isBolsillo
                                        ? 'text-amber-400 font-extrabold'
                                        : 'text-stone-300'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isWarning
                                          ? 'bg-red-500 animate-ping'
                                          : isBolsillo
                                          ? 'bg-amber-400 animate-pulse'
                                          : 'bg-stone-600'
                                      }`}
                                    ></span>
                                    <span>{emb}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
              
              {/* ROSTER */}
              {isInst && isRosterExpanded && (
                <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-3 shrink-0">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Users size={12} /> Nómina ({order.items?.length || 0})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {order.items.map((it: any, itIdx: number) => (
                      <div key={itIdx} className="bg-stone-900/80 border border-stone-800/80 p-2 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-stone-200 truncate">{it.recipientName || `#${itIdx + 1}`}</span>
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-stone-950 px-1 py-0.5 rounded">{it.size || 'STD'}</span>
                        </div>
                        <p className="text-[9px] text-stone-400 truncate">{it.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
