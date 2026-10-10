import React, { useMemo } from 'react';
import { MasterDetailPricingView, MasterDetailPricingItem, PricingVariant } from '../../pricing/MasterDetailPricingView';

export interface CatalogGarmentVariant {
  fabricName?: string;
  fabricSku?: string;
  sku?: string;
  priceRaleo?: number;
  priceB2B?: number;
  isPrimary?: boolean;
}

export interface CatalogGarmentRecord {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  defaultFabricId?: string;
  defaultFabricName?: string;
  defaultFabric?: string;
  priceRaleo?: number;
  priceB2B?: number;
  fabricVariants?: Record<string, CatalogGarmentVariant>;
  variants?: CatalogGarmentVariant[];
}

export interface CatalogPricingTabProps {
  pricing?: {
    catalogGarments?: Record<string, CatalogGarmentRecord> | CatalogGarmentRecord[];
    garments?: Record<string, Record<string, { priceRaleo?: number; priceB2B?: number } | number>>;
  } | null;
}

export const CatalogPricingTab: React.FC<CatalogPricingTabProps> = ({ pricing }) => {
  const items: MasterDetailPricingItem[] = useMemo(() => {
    const rawCatalog = pricing?.catalogGarments;
    if (!rawCatalog) return [];

    const rawList: Array<{ key: string; data: CatalogGarmentRecord }> = Array.isArray(rawCatalog)
      ? rawCatalog.map((item, idx) => {
          const itemKey = (item && typeof item === 'object' && item.id) 
            ? String(item.id) 
            : (item && typeof item === 'object' && item.name) 
              ? String(item.name) 
              : `item-${idx}`;
          return {
            key: itemKey,
            data: (item && typeof item === 'object') ? item : {}
          };
        })
      : Object.entries(rawCatalog as Record<string, CatalogGarmentRecord>).map(([k, v]) => ({
          key: k,
          data: v || {}
        }));

    if (rawList.length === 0) return [];

    return rawList.map(({ key, data: g }) => {
      const primaryFabric = g.defaultFabricName || g.defaultFabric || g.defaultFabricId || 'Bull Denim (Tornado)';
      let variants: PricingVariant[] = [];

      if (Array.isArray(g.variants)) {
        variants = g.variants.map(val => ({
          fabricName: val?.fabricName || primaryFabric,
          fabricSku: val?.fabricSku || val?.sku,
          priceRaleo: Number(val?.priceRaleo) || 0,
          priceB2B: Number(val?.priceB2B) || 0,
          isPrimary: Boolean(val?.isPrimary)
        }));
      } else if (g.fabricVariants && typeof g.fabricVariants === 'object') {
        variants = Object.entries(g.fabricVariants).map(([fabricName, val]) => ({
          fabricName,
          fabricSku: val?.fabricSku || val?.sku,
          priceRaleo: Number(val?.priceRaleo) || 0,
          priceB2B: Number(val?.priceB2B) || 0,
          isPrimary: Boolean(val?.isPrimary)
        }));
      }

      if (variants.length === 0 && (g.priceRaleo !== undefined || g.priceB2B !== undefined)) {
        variants.push({
          fabricName: primaryFabric,
          fabricSku: undefined,
          priceRaleo: Number(g.priceRaleo) || 0,
          priceB2B: Number(g.priceB2B) || 0,
          isPrimary: true
        });
      }

      // If no variant has isPrimary === true, fallback to primaryFabric or index 0
      if (variants.length > 0 && !variants.some(v => v.isPrimary)) {
        const foundIndex = variants.findIndex(v => v.fabricName === primaryFabric);
        if (foundIndex !== -1) {
          variants[foundIndex].isPrimary = true;
        } else {
          variants[0].isPrimary = true;
        }
      }

      return {
        id: key,
        name: g.name || key,
        sku: g.sku,
        category: g.category || 'Colección de Autor',
        description: g.description,
        defaultFabric: primaryFabric,
        defaultRaleoPrice: g.priceRaleo,
        defaultB2BPrice: g.priceB2B,
        variants
      };
    });
  }, [pricing?.catalogGarments]);

  return (
    <MasterDetailPricingView
      title="CATÁLOGO"
      subtitle="Catálogo de colección comercial con precios mayoristas y minoristas oficiales."
      items={items}
      categoryPills={['Todas', 'Filipinas', 'Mandiles Botánica', 'Mandiles Especiales', 'Chamarras']}
      emptyMessage="No hay prendas disponibles en el catálogo comercial."
    />
  );
};
