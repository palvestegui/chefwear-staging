import React, { useMemo } from 'react';
import { BookOpen, Layers, Search, Info } from 'lucide-react';
import { CatalogGarmentPricing } from '../../types';

interface CatalogReferenceCardsProps {
  catalogGarments?: Record<string, CatalogGarmentPricing>;
  searchQuery: string;
}

export const CatalogReferenceCards: React.FC<CatalogReferenceCardsProps> = ({
  catalogGarments = {},
  searchQuery
}) => {
  const filteredItems = useMemo(() => {
    const entries: Array<[string, CatalogGarmentPricing]> = Object.entries(catalogGarments);
    if (!searchQuery.trim()) {
      return entries;
    }
    const query = searchQuery.toLowerCase().trim();
    return entries.filter(([name, data]) => {
      const matchName = name.toLowerCase().includes(query);
      const matchFabric = data.fabric?.toLowerCase().includes(query);
      const matchCategory = data.category?.toLowerCase().includes(query);
      const matchDesc = data.description?.toLowerCase().includes(query);
      return matchName || matchFabric || matchCategory || matchDesc;
    });
  }, [catalogGarments, searchQuery]);

  const totalCount = Object.keys(catalogGarments).length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-16 bg-stone-900/50 rounded-3xl border border-stone-800 border-dashed space-y-3 p-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <Info size={24} />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <p className="text-xs font-bold text-stone-300">
            No hay productos de catálogo sincronizados aún.
          </p>
          <p className="text-[11px] text-stone-500">
            Se actualizarán mediante el sincronizador de Azafrán Precios.
          </p>
        </div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-900/50 rounded-3xl border border-stone-800 border-dashed space-y-2">
        <Search size={28} className="mx-auto text-stone-600 mb-1" />
        <p className="text-stone-400 font-black uppercase text-xs tracking-widest">
          No se encontraron productos en el catálogo para "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <BookOpen className="text-amber-500" size={18} />
          <h3 className="text-sm font-black uppercase tracking-wider text-stone-300">
            Prendas de Catálogo
          </h3>
        </div>
        <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-widest">
          {filteredItems.length} {filteredItems.length === 1 ? 'Producto' : 'Productos'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map(([name, data]) => (
          <div
            key={name}
            className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-stone-700/80 transition"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-stone-100 truncate">
                    {name}
                  </h4>
                  {data.category && (
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded mt-1">
                      {data.category}
                    </span>
                  )}
                </div>
                {data.imageUrl && (
                  <img
                    src={data.imageUrl}
                    alt={name}
                    className="w-14 h-14 object-cover rounded-2xl border border-stone-800 shrink-0 bg-stone-950"
                  />
                )}
              </div>

              {data.fabric && (
                <div className="flex items-center gap-1.5 text-xs text-stone-300 font-semibold">
                  <Layers size={13} className="text-stone-500 shrink-0" />
                  <span>Tela: {data.fabric}</span>
                </div>
              )}

              {data.description && (
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  {data.description}
                </p>
              )}

              {typeof data.consumptionMeters === 'number' && data.consumptionMeters > 0 && (
                <p className="text-[10px] text-stone-500 font-mono">
                  Consumo estimado: {data.consumptionMeters} m
                </p>
              )}
            </div>

            {/* Read-Only Price Tiers */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500/80">
                  Minorista (Raleo)
                </span>
                <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit mt-1">
                  <span className="text-[10px] text-amber-500/70 mr-1">Bs</span>
                  {data.priceRaleo ?? 0}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Mayorista (B2B)
                </span>
                <span className="font-mono text-xs font-bold text-stone-300 bg-stone-950 border border-stone-800 px-2.5 py-1 rounded-lg w-fit mt-1">
                  <span className="text-[10px] text-stone-500 mr-1">Bs</span>
                  {data.priceB2B ?? 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
