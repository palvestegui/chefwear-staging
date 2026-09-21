import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Tag, 
  Shirt, 
  Award, 
  CheckCircle2,
  Layers,
  Sparkles,
  Package
} from 'lucide-react';
import { getUdiBundleBreakdown } from '../utils/udiPackageUtils';

export interface ServiceItem {
  garment: string;
  name: string;
  type: string;
  price: number | null;
}

export interface PriceReferenceProps {
  pricing?: {
    garments?: Record<string, Record<string, { priceRaleo?: number; priceB2B?: number } | number>>;
    udiPricing?: Record<string, Record<string, number> | number>;
    specialPresets?: Record<string, Record<string, Record<string, number> | number>>;
    services?: ServiceItem[];
    updatedAt?: number;
  } | null;
  cataloguePrices?: Record<string, Record<string, { priceRaleo?: number; priceB2B?: number } | number>>;
  udiPricing?: Record<string, Record<string, number> | number>;
  specialPresets?: Record<string, Record<string, Record<string, number> | number>>;
  services?: ServiceItem[];
}

// Predetermined custom card display order
const GARMENT_DISPLAY_ORDER = [
  'Filipina',
  'Pantalón',
  'Mandil',
  'Gorro',
  'Regulador para correas cruzadas',
  'Chamarra aventurera',
  'Chamarra ecuestre personalizada'
];

const getGarmentOrderIndex = (name: string): number => {
  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  const normalizedTarget = normalize(name);
  const index = GARMENT_DISPLAY_ORDER.findIndex(
    item => normalize(item) === normalizedTarget
  );
  return index !== -1 ? index : 999;
};

export const PriceReference: React.FC<PriceReferenceProps> = ({
  pricing,
  cataloguePrices,
  udiPricing: explicitUdiPricing,
  specialPresets: explicitSpecialPresets,
}) => {
  // Consolidated reactive props from state
  const garmentsData = useMemo(() => {
    return cataloguePrices || pricing?.garments || {};
  }, [cataloguePrices, pricing?.garments]);

  const udiData = useMemo(() => {
    return explicitUdiPricing || pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {};
  }, [explicitUdiPricing, pricing?.udiPricing, pricing?.specialPresets]);

  // Real-time search query
  const [searchQuery, setSearchQuery] = useState('');

  // Structured Garment Cards with Fabric Rows & Price Tier Columns
  const filteredGarmentCards = useMemo(() => {
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const garmentKeys = Object.keys(garmentsData).sort((a, b) => {
      const orderA = getGarmentOrderIndex(a);
      const orderB = getGarmentOrderIndex(b);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.localeCompare(b);
    });

    const cards: Array<{
      garment: string;
      fabrics: Array<{
        fabric: string;
        priceRaleo: number;
        priceB2B: number;
        isMatch: boolean;
      }>;
      totalFabrics: number;
    }> = [];

    garmentKeys.forEach(garmentName => {
      const fabricsObj = garmentsData[garmentName] || {};
      const fabricEntries = Object.entries(fabricsObj);

      const parsedFabrics = fabricEntries
        .filter(([fabricName]) => {
          // Standard business exclusion rule
          if (garmentName === 'Gorro' && (fabricName.includes('Tornado') || fabricName.includes('Gabardina de 1ra'))) {
            return false;
          }
          return true;
        })
        .map(([fabricName, priceVal]) => {
          let raleo = 0;
          let b2b = 0;

          if (typeof priceVal === 'object' && priceVal !== null) {
            raleo = Number((priceVal as any).priceRaleo ?? (priceVal as any).price ?? 0);
            b2b = Number((priceVal as any).priceB2B ?? (priceVal as any).price ?? 0);
          } else if (typeof priceVal === 'number') {
            raleo = priceVal;
            b2b = priceVal;
          }

          const combinedText = `${garmentName.toLowerCase()} ${fabricName.toLowerCase()}`;
          const isMatch = tokens.length === 0 || tokens.every(token => 
            garmentName.toLowerCase().includes(token) || 
            fabricName.toLowerCase().includes(token) || 
            combinedText.includes(token)
          );

          return {
            fabric: fabricName,
            priceRaleo: raleo,
            priceB2B: b2b,
            isMatch
          };
        });

      // Include card if garment name matches OR if any fabric matches
      const garmentMatches = tokens.length === 0 || tokens.every(token => garmentName.toLowerCase().includes(token));
      const hasMatchingFabric = parsedFabrics.some(f => f.isMatch);

      if (garmentMatches || hasMatchingFabric) {
        // If searching and garment doesn't match by itself, filter down to matching fabrics only
        const displayedFabrics = (tokens.length > 0 && !garmentMatches)
          ? parsedFabrics.filter(f => f.isMatch)
          : parsedFabrics;

        cards.push({
          garment: garmentName,
          fabrics: displayedFabrics,
          totalFabrics: parsedFabrics.length
        });
      }
    });

    return cards;
  }, [garmentsData, searchQuery]);

  // Compute UDI bundle prices and total
  const udiSummary = useMemo(() => {
    return getUdiBundleBreakdown(udiData);
  }, [udiData]);

  // Filter UDI garments if searching
  const filteredUdiGarments = useMemo(() => {
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const garmentKeys = Object.keys(udiData);

    if (tokens.length === 0) return garmentKeys;

    return garmentKeys.filter(gName => {
      const gData = (udiData as any)[gName] || {};
      const fabricKeys = typeof gData === 'object' && gData !== null ? Object.keys(gData) : [];
      const combinedText = `udi ${gName.toLowerCase()} ${fabricKeys.join(' ').toLowerCase()}`;

      return tokens.every(token => 
        'udi'.includes(token) ||
        gName.toLowerCase().includes(token) || 
        fabricKeys.some(f => f.toLowerCase().includes(token)) ||
        combinedText.includes(token)
      );
    });
  }, [udiData, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto pb-16">
      {/* Compact Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/80 p-2 sm:p-2.5 rounded-2xl border border-stone-800 shadow-sm">
        <div className="flex items-center gap-2 px-2 shrink-0">
          <Shirt className="text-amber-500 shrink-0" size={18} />
          <h2 className="text-sm font-black uppercase tracking-wider text-stone-100">
            Tarifario
          </h2>
          <span className="text-[10px] font-mono text-stone-500 font-bold ml-1">
            ({filteredGarmentCards.length} {filteredGarmentCards.length === 1 ? 'prenda' : 'prendas'})
          </span>
        </div>

        {/* Real-Time Dual-Filter Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" size={15} />
          <input
            type="text"
            placeholder="Buscar prenda o tela (ej: Filipina, Pantalón, Drill...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-16 py-2 text-xs font-bold text-stone-200 placeholder:text-stone-600 outline-none focus:border-amber-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-400 hover:text-stone-200 uppercase tracking-wider px-2 py-0.5 rounded bg-stone-900 border border-stone-800"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. GARMENT CARDS SECTION (TOP)                                            */}
      {/* One card per unique garment type with clean read-only table of fabrics    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Shirt className="text-amber-500" size={18} />
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-300">
              Tarifario General por Prenda
            </h3>
          </div>
          <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-widest">
            {filteredGarmentCards.length} {filteredGarmentCards.length === 1 ? 'Prenda' : 'Prendas'}
          </span>
        </div>

        {filteredGarmentCards.length === 0 ? (
          <div className="text-center py-12 bg-stone-900/50 rounded-3xl border border-stone-800 border-dashed space-y-2">
            <Search size={28} className="mx-auto text-stone-600 mb-1" />
            <p className="text-stone-400 font-black uppercase text-xs tracking-widest">
              No se encontraron prendas ni telas para "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGarmentCards.map((card) => (
              <div
                key={card.garment}
                className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5"
              >
                {/* Garment Header */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Shirt size={16} />
                    </span>
                    <h4 className="text-base font-black uppercase tracking-wider text-stone-100">
                      {card.garment}
                    </h4>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-stone-950 text-stone-400 border border-stone-800">
                    {card.fabrics.length} {card.fabrics.length === 1 ? 'Tela' : 'Telas'}
                  </span>
                </div>

                {/* Read-Only Fabrics & Price Tiers Table */}
                <div className="overflow-x-auto rounded-2xl border border-stone-800/80 bg-stone-950">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 text-[10px] font-black uppercase tracking-wider bg-stone-900/60">
                        <th className="py-3 px-4 text-stone-400">Tela / Material</th>
                        <th className="py-3 px-3 text-right">
                          <span className="text-amber-400">Minorista (Raleo)</span>
                        </th>
                        <th className="py-3 px-4 text-right">
                          <span className="text-stone-400">Mayorista (B2B)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {card.fabrics.map((row) => (
                        <tr
                          key={row.fabric}
                          className={`hover:bg-stone-900/40 transition-colors ${
                            searchQuery && row.isMatch ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Fabric Name */}
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold text-stone-200">
                              {row.fabric}
                            </span>
                          </td>

                          {/* Price Minorista (Raleo) - Badge destacado color ámbar */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                              <span className="text-[10px] text-amber-500/70 mr-1">Bs</span>
                              {row.priceRaleo}
                            </span>
                          </td>

                          {/* Price Mayorista (B2B) - Tipografía mono clara */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-stone-300">
                              <span className="text-[10px] text-stone-500 mr-1">Bs</span>
                              {row.priceB2B}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. UDI SECTION (BELOW)                                                    */}
      {/* Mirrors the exact disposition, structure, columns, & layout in Ajustes    */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-4 border-t border-stone-800">
        {/* Header and Controls for Active Preset (Mirrors Ajustes Tab B Header) */}
        <div className="bg-stone-950 p-5 md:p-6 rounded-2xl border border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-amber-500 text-sm md:text-base uppercase tracking-wider">
                UDI Especial
              </h4>
              <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                Contrato Institucional Oficial
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-bold mt-1">
              Precios fijos acordados para este cliente o convenio especial.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
            <Award size={14} className="text-amber-400" />
            <span>Convenio Activo</span>
          </div>
        </div>

        {/* Summary Banner for UDI Bundle (Mirrors Ajustes Tab B Summary Banner) */}
        <div className="bg-amber-950/30 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-amber-200/90 shadow-sm">
          <span className="uppercase tracking-wide flex items-center gap-2">
            <span>📦 Paquete Completo UDI: Mandil ({udiSummary.mandil.price} Bs) + Filipina ({udiSummary.filipina.price} Bs) + Pantalón ({udiSummary.pantalon.price} Bs) + Gorro ({udiSummary.gorro.price} Bs)</span>
          </span>
          <span className="font-mono font-black text-amber-400 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-lg shrink-0">
            Total: {udiSummary.total} Bs
          </span>
        </div>

        {/* Garment Cards Grid for Active Preset (Mirrors Ajustes Tab B Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUdiGarments.map((garment) => {
            const garmentFabrics = (udiData as any)[garment] || {};
            const fabricKeys = typeof garmentFabrics === 'object' && garmentFabrics !== null 
              ? Object.keys(garmentFabrics) 
              : [];

            return (
              <div key={garment} className="col-span-1 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex justify-between items-center border-b border-stone-900 pb-2">
                  <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs">
                    {garment}
                  </h4>
                </div>

                <div className="flex flex-col gap-2">
                  {fabricKeys.map((fabric) => {
                    const priceValue = typeof garmentFabrics[fabric] === 'number' 
                      ? garmentFabrics[fabric] 
                      : (typeof garmentFabrics === 'number' ? garmentFabrics : 0);

                    return (
                      <div key={fabric} className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-lg border border-stone-800">
                        <span className="font-bold text-stone-300 text-xs truncate flex-1">
                          {fabric}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="bg-stone-950 px-3 py-1 rounded border border-stone-700 text-amber-500 text-xs font-mono font-bold text-right">
                            <span className="text-[10px] text-stone-500 mr-1">Bs</span>
                            {priceValue}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {fabricKeys.length === 0 && typeof garmentFabrics === 'number' && (
                    <div className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-lg border border-stone-800">
                      <span className="font-bold text-stone-300 text-xs truncate flex-1">
                        Estándar
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-stone-950 px-3 py-1 rounded border border-stone-700 text-amber-500 text-xs font-mono font-bold text-right">
                          <span className="text-[10px] text-stone-500 mr-1">Bs</span>
                          {garmentFabrics}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
