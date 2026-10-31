import React from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export interface GarmentServicesSectionProps {
  showServicesConfig: boolean;
  setShowServicesConfig: (show: boolean) => void;
  compatibleServices: any[];
  allServicesCount: number;
  isIncluded: (srvName: string) => boolean;
  isOptional: (srvName: string) => boolean;
  onToggleIncluded: (srvName: string) => void;
  onToggleOptional: (srvName: string) => void;
  onToggleAllIncluded: (enableAll: boolean) => void;
  onToggleAllOptional: (enableAll: boolean) => void;
}

export const GarmentServicesSection: React.FC<GarmentServicesSectionProps> = ({
  showServicesConfig,
  setShowServicesConfig,
  compatibleServices,
  allServicesCount,
  isIncluded,
  isOptional,
  onToggleIncluded,
  onToggleOptional,
  onToggleAllIncluded,
  onToggleAllOptional
}) => {
  const activeCount = compatibleServices.filter(s => isIncluded(s.name) || isOptional(s.name)).length;

  return (
    <div className="pt-3 border-t border-stone-900">
      <button
        type="button"
        onClick={() => setShowServicesConfig(!showServicesConfig)}
        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-amber-400 transition py-1"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles size={12} className={activeCount > 0 ? 'text-amber-500' : 'text-stone-600'} />
          Especificaciones & Servicios (Tab C)
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${activeCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-stone-900 text-stone-500'}`}>
            {activeCount} de {allServicesCount} vinculados
          </span>
          {showServicesConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {showServicesConfig && (
        <div className="mt-2.5 p-3.5 bg-stone-900/90 rounded-xl border border-stone-800 space-y-4 animate-in fade-in">
          {compatibleServices.length === 0 ? (
            <p className="text-[10px] text-stone-500 italic py-1">
              No hay servicios en Tab C compatibles con esta Prenda Base.
            </p>
          ) : (
            <>
              {/* Sección A: Servicios / Especificaciones Incluidas en Precio Base */}
              <div className="space-y-2 border-b border-stone-800 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">🔒</span>
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                      Servicios / Especificaciones Incluidas en Precio Base
                    </span>
                  </div>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <button type="button" onClick={() => onToggleAllIncluded(true)} className="text-amber-400 hover:underline uppercase">
                      Todos
                    </button>
                    <span className="text-stone-700">|</span>
                    <button type="button" onClick={() => onToggleAllIncluded(false)} className="text-stone-500 hover:text-stone-300 uppercase">
                      Ninguno
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-stone-500 font-mono leading-tight">
                  Especificaciones fijas para taller. No se cobran extra en venta.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {compatibleServices.map((srv: any, idx: number) => {
                    const included = isIncluded(srv.name);
                    return (
                      <button
                        key={`inc-${srv.name}-${idx}`}
                        type="button"
                        onClick={() => onToggleIncluded(srv.name)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition border flex items-center gap-1.5 ${
                          included
                            ? 'bg-amber-500 text-stone-950 font-black border-amber-400 shadow-sm'
                            : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700 hover:text-stone-400'
                        }`}
                      >
                        <span>{included ? '✓' : '+'}</span>
                        <span>{srv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección B: Servicios Opcionales Habilitados en Venta */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">⚙️</span>
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                      Servicios Opcionales Habilitados en Venta
                    </span>
                  </div>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <button type="button" onClick={() => onToggleAllOptional(true)} className="text-amber-400 hover:underline uppercase">
                      Todos
                    </button>
                    <span className="text-stone-700">|</span>
                    <button type="button" onClick={() => onToggleAllOptional(false)} className="text-stone-500 hover:text-stone-300 uppercase">
                      Ninguno
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-stone-500 font-mono leading-tight">
                  Opciones de confección (Bs0) o adicionales (+Bs) seleccionables en cotizador.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {compatibleServices.map((srv: any, idx: number) => {
                    const optional = isOptional(srv.name);
                    const isZero = !srv.price || srv.price === 0;
                    return (
                      <button
                        key={`opt-${srv.name}-${idx}`}
                        type="button"
                        onClick={() => onToggleOptional(srv.name)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition border flex items-center gap-1.5 ${
                          optional
                            ? 'bg-amber-600 text-white font-black border-amber-500 shadow-sm'
                            : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700 hover:text-stone-400'
                        }`}
                      >
                        <span>{optional ? '✓' : '+'}</span>
                        <span>{srv.name}</span>
                        <span className="opacity-75 font-mono text-[8px]">
                          {isZero ? '(Bs0)' : `(+Bs${srv.price})`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
