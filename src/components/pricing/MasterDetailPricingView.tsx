import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Layers, Info, X } from 'lucide-react';

export interface PricingVariant {
  fabricName: string;
  priceRaleo: number;
  priceB2B: number;
  isPrimary?: boolean;
  fabricSku?: string;
}

export interface MasterDetailPricingItem {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  defaultFabric?: string;
  defaultRaleoPrice?: number;
  defaultB2BPrice?: number;
  imageUrl?: string;
  frontImage?: string;
  image?: string;
  backImageUrl?: string;
  backImage?: string;
  variants: PricingVariant[];
}

export interface MasterDetailPricingViewProps {
  title: string;
  subtitle: string;
  items: MasterDetailPricingItem[];
  categoryPills?: string[];
  emptyMessage?: string;
}

export const MasterDetailPricingView: React.FC<MasterDetailPricingViewProps> = ({
  title,
  subtitle: _subtitle,
  items,
  categoryPills = ['Todas', 'Filipinas', 'Mandiles Botánica', 'Mandiles Especiales', 'Chamarras'],
  emptyMessage = 'No se encontraron prendas con los filtros seleccionados.'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);

  const filteredItems = useMemo(() => {
    const list = items.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.variants.some(v => v.fabricName.toLowerCase().includes(q) || (v.fabricSku && v.fabricSku.toLowerCase().includes(q)));
      
      if (!matchesSearch) return false;
      if (selectedCategory === 'Todas') return true;

      const catNorm = (item.category || '').toLowerCase();
      const selNorm = selectedCategory.toLowerCase();
      if (selNorm.includes('botánica') || selNorm.includes('botanica')) return catNorm.includes('botánica') || catNorm.includes('botanica') || item.name.toLowerCase().includes('artesanal');
      if (selNorm.includes('especiales')) return catNorm.includes('especial') || catNorm.includes('noir') || catNorm.includes('zeus') || catNorm.includes('jardín');
      return catNorm.includes(selNorm) || item.name.toLowerCase().includes(selNorm);
    });

    // Sort sidebar products strictly in alphabetical order (A-Z)
    return list.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [items, searchQuery, selectedCategory]);

  const activeItem = useMemo(() => {
    return filteredItems.find(i => i.id === selectedItemId) || filteredItems[0] || null;
  }, [filteredItems, selectedItemId]);

  const primaryVariant = useMemo(() => {
    if (!activeItem) return null;
    return activeItem.variants.find(v => v.isPrimary) || activeItem.variants.find(v => v.fabricName === activeItem.defaultFabric) || activeItem.variants[0] || null;
  }, [activeItem]);

  // Pinned Primary fabric on top (Row 1), followed by alphabetical sorting (A-Z)
  const sortedVariants = useMemo(() => {
    if (!activeItem) return [];
    return [...activeItem.variants].sort((a, b) => {
      const aIsPrimary = primaryVariant ? a.fabricName === primaryVariant.fabricName : Boolean(a.isPrimary);
      const bIsPrimary = primaryVariant ? b.fabricName === primaryVariant.fabricName : Boolean(b.isPrimary);
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      return a.fabricName.localeCompare(b.fabricName, 'es', { sensitivity: 'base' });
    });
  }, [activeItem, primaryVariant]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start w-full min-h-[600px] animate-in fade-in">
      {/* 1. Left Rail: Master List */}
      <aside className="w-full lg:w-80 shrink-0 bg-stone-950 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-stone-200">{title}</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
            {filteredItems.length} prendas
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, tela o SKU..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-7 py-2 text-xs text-stone-200 placeholder-stone-500 font-mono outline-none focus:border-amber-500/50 transition-colors"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        {categoryPills && categoryPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-stone-800/60 pb-2.5">
            {categoryPills.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                  selectedCategory === cat ? 'bg-amber-500 text-stone-950 font-black shadow' : 'bg-stone-900/80 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Selectable Items List */}
        <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500 font-mono italic">{emptyMessage}</div>
          ) : (
            filteredItems.map(item => {
              const isSelected = activeItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSelected ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md' : 'bg-stone-900/40 border-stone-800/70 text-stone-300 hover:bg-stone-900 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      {/* Line 1 (Title): Full product name without truncation, wrapping cleanly */}
                      <h4 className="text-sm font-bold text-amber-50 leading-snug whitespace-normal break-words">
                        {item.name}
                      </h4>

                      {/* Line 2 (Badges): SKU badge & category pill in a flex-wrap row */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {item.sku && (
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            [ SKU: {item.sku} ]
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const photo = item.imageUrl || item.frontImage || item.image || null;
                      if (!photo) return null;
                      return (
                        <img
                          src={photo}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-xl border border-stone-800 shrink-0 bg-stone-950"
                        />
                      );
                    })()}
                  </div>

                  {/* Line 3 (Details): Available fabrics count */}
                  <div className="text-xs text-zinc-500 font-mono">
                    <span>{item.variants.length} telas disponibles</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Right Canvas: Detail Presentation */}
      <section className="flex-1 w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
        {!activeItem ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-stone-500 gap-2">
            <Info className="w-8 h-8 text-stone-600" />
            <p className="text-xs font-mono">Seleccione una prenda del listado para consultar su tarifario.</p>
          </div>
        ) : (
          <>
            {/* Header: Name, SKU badge, category badge, photos, and description */}
            <div className="border-b border-stone-800/80 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{activeItem.name}</h3>
                  {activeItem.sku && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                      [ SKU: {activeItem.sku} ]
                    </span>
                  )}
                  {activeItem.category && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 font-bold">
                      {activeItem.category}
                    </span>
                  )}
                </div>
                {activeItem.description && (
                  <p className="text-xs text-stone-400 font-mono leading-relaxed">{activeItem.description}</p>
                )}
              </div>

              {/* Garment Photographs (Front & Back) */}
              {(() => {
                const frontPhoto = activeItem.imageUrl || activeItem.frontImage || activeItem.image || null;
                const backPhoto = activeItem.backImageUrl || activeItem.backImage || null;
                if (!frontPhoto && !backPhoto) return null;
                return (
                  <div className="flex items-center gap-2 shrink-0">
                    {frontPhoto && (
                      <div className="relative group">
                        <img
                          src={frontPhoto}
                          alt={`${activeItem.name} frontal`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-800 shadow-sm bg-stone-950"
                        />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold bg-stone-900/90 text-stone-300 px-1 rounded border border-stone-700/60">
                          Frente
                        </span>
                      </div>
                    )}
                    {backPhoto && (
                      <div className="relative group">
                        <img
                          src={backPhoto}
                          alt={`${activeItem.name} espalda`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-800 shadow-sm bg-stone-950"
                        />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold bg-stone-900/90 text-stone-300 px-1 rounded border border-stone-700/60">
                          Espalda
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Featured Primary Fabric Banner */}
            {primaryVariant && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono">
                      [★ Tela Principal]
                    </div>
                    <div className="text-sm font-black text-stone-100 flex items-center gap-2">
                      <span>{primaryVariant.fabricName}</span>
                      {primaryVariant.fabricSku && (
                        <span className="text-[9px] font-mono text-stone-400 bg-stone-950 border border-stone-800 px-1.5 py-0.5 rounded">
                          {primaryVariant.fabricSku}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-stone-800 pt-2 sm:pt-0 sm:pl-4">
                  <div>
                    <div className="text-[9px] font-mono uppercase text-stone-400">PVP Minorista</div>
                    <div className="text-base font-black font-mono text-emerald-400">Bs{primaryVariant.priceRaleo}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase text-amber-500/80">Tarifa B2B</div>
                    <div className="text-base font-black font-mono text-amber-400">Bs{primaryVariant.priceB2B}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Commercial Pricing Table (3 Columns) with Pinned Primary Fabric at Index 0 */}
            <div className="space-y-2">
              <div className="text-[11px] font-black uppercase tracking-widest text-stone-400 font-mono flex items-center justify-between">
                <span>Variantes de Tela & Tarifario</span>
                <span className="text-[10px] font-normal text-stone-500 lowercase">solo lectura · sincronizado con precios</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-stone-900/80 text-[10px] uppercase text-stone-400 border-b border-stone-800">
                    <tr>
                      <th className="py-2.5 px-3 font-black">Tela / Variante</th>
                      <th className="py-2.5 px-3 font-black text-right text-emerald-400">PVP Minorista (Raleo)</th>
                      <th className="py-2.5 px-3 font-black text-right text-amber-400">Tarifa B2B (Mayorista)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 bg-stone-950">
                    {sortedVariants.map((v, idx) => {
                      const isMain = primaryVariant ? v.fabricName === primaryVariant.fabricName : false;
                      return (
                        <tr key={v.fabricName || idx} className={`transition-colors ${isMain ? 'bg-amber-500/5 font-bold' : 'hover:bg-stone-900/50'}`}>
                          <td className="py-2.5 px-3 text-stone-200">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isMain && (
                                <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/20 px-1 rounded">
                                  ★ Principal
                                </span>
                              )}
                              <span>{v.fabricName}</span>
                              {v.fabricSku && (
                                <span className="text-[9px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                                  {v.fabricSku}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">Bs{v.priceRaleo}</td>
                          <td className="py-2.5 px-3 text-right text-amber-400 font-bold">Bs{v.priceB2B}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
