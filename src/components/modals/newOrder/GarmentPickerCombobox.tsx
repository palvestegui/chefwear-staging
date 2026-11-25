import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  filterComboboxItems,
  GarmentComboboxItem,
  GarmentPickerCatalog,
  GarmentPillKey,
} from '../../../utils/garmentConfiguratorUtils';

export interface GarmentPickerComboboxProps {
  catalog: GarmentPickerCatalog;
  selectedGarment: string;
  selectedFabric: string;
  sortedFabrics: string[];
  hasConvenio: boolean;
  convenioLabel?: string | null;
  onSelectGarment: (garmentName: string) => void;
  onSelectFabric: (fabricName: string) => void;
}

const SOURCE_BADGES: Record<GarmentComboboxItem['source'], { label: string; cls: string }> = {
  convenio: { label: 'Convenio', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  base: { label: 'Base', cls: 'bg-stone-800 text-stone-300 border-stone-700' },
  catalogo: { label: 'Catálogo', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
};

export const GarmentPickerCombobox: React.FC<GarmentPickerComboboxProps> = ({
  catalog,
  selectedGarment,
  selectedFabric,
  sortedFabrics,
  hasConvenio,
  convenioLabel,
  onSelectGarment,
  onSelectFabric,
}) => {
  const baseId = useId();
  const inputId = `${baseId}-garment-input`;
  const listboxId = `${baseId}-garment-listbox`;
  const fabricId = `${baseId}-fabric-select`;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [activePill, setActivePill] = useState<GarmentPillKey>(() =>
    hasConvenio && catalog.pills.convenio.length > 0 ? 'convenio' : 'base'
  );
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);

  const prevHasConvenioRef = useRef(hasConvenio);
  useEffect(() => {
    if (hasConvenio && !prevHasConvenioRef.current && catalog.pills.convenio.length > 0) {
      setActivePill('convenio');
    } else if (!hasConvenio && activePill === 'convenio') {
      setActivePill('base');
    }
    prevHasConvenioRef.current = hasConvenio;
  }, [hasConvenio, catalog.pills.convenio.length, activePill]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const visibleItems = useMemo(
    () => filterComboboxItems(catalog, activePill, query),
    [catalog, activePill, query]
  );

  useEffect(() => {
    setHighlightedIdx(0);
  }, [activePill, query, isOpen]);

  const pillDefs: Array<{ key: GarmentPillKey; label: string; count: number }> = [
    ...(catalog.pills.convenio.length > 0
      ? [{ key: 'convenio' as const, label: convenioLabel === 'UDI Especial' ? 'Convenio UDI' : 'Convenio', count: catalog.pills.convenio.length }]
      : []),
    { key: 'base', label: 'Base', count: catalog.pills.base.length },
    { key: 'filipinas', label: 'Filipinas', count: catalog.pills.filipinas.length },
    { key: 'mandiles', label: 'Mandiles', count: catalog.pills.mandiles.length },
    { key: 'chamarras', label: 'Chamarras', count: catalog.pills.chamarras.length },
    { key: 'camisas', label: 'Camisas', count: catalog.pills.camisas.length },
    { key: 'pantalones', label: 'Pantalones', count: catalog.pills.pantalones.length },
    { key: 'gorros_otros', label: 'Gorros & Otros', count: catalog.pills.gorros_otros.length },
  ];

  const commitSelection = (item: GarmentComboboxItem) => {
    onSelectGarment(item.name);
    setQuery('');
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      else if (visibleItems.length > 0) {
        setHighlightedIdx((prev) => (prev + 1) % visibleItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      else if (visibleItems.length > 0) {
        setHighlightedIdx((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
      }
    } else if (e.key === 'Home' && isOpen && visibleItems.length > 0) {
      e.preventDefault();
      setHighlightedIdx(0);
    } else if (e.key === 'End' && isOpen && visibleItems.length > 0) {
      e.preventDefault();
      setHighlightedIdx(visibleItems.length - 1);
    } else if (e.key === 'Enter' && isOpen && visibleItems[highlightedIdx]) {
      e.preventDefault();
      commitSelection(visibleItems[highlightedIdx]);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  };

  const activeOptionId =
    isOpen && visibleItems[highlightedIdx] ? `${listboxId}-opt-${highlightedIdx}` : undefined;
  const isUdiBundleSelected = selectedGarment === 'Uniforme Completo UDI';

  return (
    <div className="space-y-2.5">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Categorías de prendas">
        {pillDefs.map((pill) => {
          const isActive = activePill === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setActivePill(pill.key);
                setQuery('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className={`min-h-[28px] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 ${
                isActive
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <span>{pill.label}</span>
              <span className={`font-mono text-[9px] ${isActive ? 'text-stone-900/80' : 'text-stone-500'}`}>
                ({pill.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Garment Searchable Combobox + Fabric Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div ref={containerRef} className="relative">
          <label htmlFor={inputId} className="sr-only">
            Buscar o seleccionar prenda
          </label>
          <div className="relative flex items-center">
            <Search
              size={14}
              aria-hidden="true"
              className="absolute left-3 text-stone-500 pointer-events-none"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeOptionId}
              placeholder={selectedGarment || 'Buscar prenda o SKU...'}
              value={isOpen ? query : selectedGarment}
              onFocus={() => {
                setQuery('');
                setIsOpen(true);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              className="w-full bg-stone-900 border border-stone-800 hover:border-stone-700 focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-1 rounded-xl pl-8 pr-14 py-2.5 text-xs font-bold text-stone-200 placeholder:text-stone-500 outline-none transition-colors"
            />
            <div className="absolute right-1.5 flex items-center gap-0.5">
              {isOpen && query && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="min-w-[24px] min-h-[24px] flex items-center justify-center text-stone-400 hover:text-stone-200 rounded-md cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                aria-label={isOpen ? 'Cerrar lista de prendas' : 'Abrir lista de prendas'}
                tabIndex={-1}
                onClick={() => {
                  if (isOpen) {
                    setIsOpen(false);
                    setQuery('');
                  } else {
                    setQuery('');
                    setIsOpen(true);
                    inputRef.current?.focus();
                  }
                }}
                className="min-w-[24px] min-h-[24px] flex items-center justify-center text-stone-400 hover:text-stone-200 rounded-md cursor-pointer"
              >
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`transition-transform ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
                />
              </button>
            </div>
          </div>

          {isOpen && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Opciones de prendas"
              className="absolute z-40 mt-1.5 w-full max-h-60 overflow-y-auto bg-stone-950 border border-stone-700 rounded-xl shadow-2xl p-1 space-y-0.5"
            >
              {visibleItems.length === 0 ? (
                <li className="px-3 py-2.5 text-xs font-mono text-stone-500 text-center">
                  Sin resultados para "{query}"
                </li>
              ) : (
                visibleItems.map((item, idx) => {
                  const isSelected = item.name === selectedGarment;
                  const isHighlighted = idx === highlightedIdx;
                  const badge = SOURCE_BADGES[item.source];
                  const thumb = item.imageUrl || item.backImageUrl;
                  return (
                    <li
                      key={`${item.source}-${item.name}`}
                      id={`${listboxId}-opt-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commitSelection(item);
                      }}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      className={`px-2.5 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-500/15 text-stone-100'
                          : isSelected
                            ? 'bg-stone-900 text-amber-400'
                            : 'text-stone-300 hover:bg-stone-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {thumb && (
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="w-8 h-8 rounded-lg object-cover border border-stone-800 bg-stone-900 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate">{item.name}</div>
                          {(item.category || item.sku) && (
                            <div className="text-[10px] font-mono text-stone-500 truncate">
                              {[item.category, item.sku].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {isSelected && <Check size={13} aria-hidden="true" className="text-amber-400" />}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {/* Fabric Selector or UDI Bundle Badge */}
        {isUdiBundleSelected ? (
          <div className="bg-stone-900/50 px-3 py-2.5 rounded-xl border border-stone-800 flex items-center justify-center">
            <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider font-mono">
              CONJUNTO COMPLETO
            </span>
          </div>
        ) : (
          <div>
            <label htmlFor={fabricId} className="sr-only">
              Seleccionar tela
            </label>
            <select
              id={fabricId}
              value={selectedFabric}
              onChange={(e) => onSelectFabric(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 hover:border-stone-700 p-2.5 rounded-xl font-bold text-xs text-stone-200 outline-none focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-1"
            >
              {sortedFabrics.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
