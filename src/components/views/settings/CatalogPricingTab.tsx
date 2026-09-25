import React, { useMemo } from 'react';
import { MasterDetailPricingView, MasterDetailPricingItem, PricingVariant } from '../../pricing/MasterDetailPricingView';

export interface CatalogGarmentRecord {
  name?: string;
  category?: string;
  description?: string;
  consumptionMeters?: number;
  defaultFabricId?: string;
  defaultFabricName?: string;
  priceRaleo?: number;
  priceB2B?: number;
  fabricVariants?: Record<string, { priceRaleo: number; priceB2B: number }>;
}

export interface CatalogPricingTabProps {
  pricing?: {
    catalogGarments?: Record<string, CatalogGarmentRecord>;
    garments?: Record<string, Record<string, { priceRaleo?: number; priceB2B?: number } | number>>;
  } | null;
}

export const CatalogPricingTab: React.FC<CatalogPricingTabProps> = ({ pricing }) => {
  const items: MasterDetailPricingItem[] = useMemo(() => {
    const catalog: Record<string, CatalogGarmentRecord> = pricing?.catalogGarments || {};
    const entries = Object.entries(catalog);

    if (entries.length > 0) {
      return entries.map(([garmentKey, g]) => {
        const variantsDict = g.fabricVariants || {};
        const primaryFabric = g.defaultFabricName || g.defaultFabricId || 'Bull Denim (Tornado)';
        
        const variants: PricingVariant[] = Object.entries(variantsDict).map(([fabricName, p]) => ({
          fabricName,
          priceRaleo: Number(p.priceRaleo) || 0,
          priceB2B: Number(p.priceB2B) || 0,
          isPrimary: fabricName === primaryFabric
        }));

        if (variants.length === 0 && (g.priceRaleo !== undefined || g.priceB2B !== undefined)) {
          variants.push({
            fabricName: primaryFabric,
            priceRaleo: Number(g.priceRaleo) || 0,
            priceB2B: Number(g.priceB2B) || 0,
            isPrimary: true
          });
        }

        return {
          id: garmentKey,
          name: g.name || garmentKey,
          category: g.category || 'Colección de Autor',
          description: g.description,
          consumptionMeters: g.consumptionMeters || 1.2,
          defaultFabric: primaryFabric,
          defaultRaleoPrice: g.priceRaleo,
          defaultB2BPrice: g.priceB2B,
          variants
        };
      });
    }

    // Fallback to standard garments if catalogGarments sync is pending
    const standardGarments = (pricing?.garments || {}) as Record<string, Record<string, { priceRaleo?: number; priceB2B?: number } | number>>;
    return Object.entries(standardGarments).map(([garmentName, fabricsObj]) => {
      const primaryFabric = Object.keys(fabricsObj || {})[0] || 'Drill de 8oz';
      const variants: PricingVariant[] = Object.entries(fabricsObj || {}).map(([fabricName, val]) => {
        let raleo = 0;
        let b2b = 0;
        if (typeof val === 'number') {
          raleo = val;
          b2b = val;
        } else if (val && typeof val === 'object') {
          raleo = Number(val.priceRaleo) || 0;
          b2b = Number(val.priceB2B) || 0;
        }
        return {
          fabricName,
          priceRaleo: raleo,
          priceB2B: b2b,
          isPrimary: fabricName === primaryFabric
        };
      });

      const primary = variants.find(v => v.isPrimary) || variants[0];

      return {
        id: garmentName,
        name: garmentName,
        category: 'Colección de Autor',
        consumptionMeters: 1.5,
        defaultFabric: primaryFabric,
        defaultRaleoPrice: primary?.priceRaleo || 0,
        defaultB2BPrice: primary?.priceB2B || 0,
        variants
      };
    });
  }, [pricing?.catalogGarments, pricing?.garments]);

  return (
    <MasterDetailPricingView
      title="Catálogo Maestro 2026"
      subtitle="Catálogo de colección de autor con precios mayoristas y minoristas oficiales."
      items={items}
      categoryPills={['Todas', 'Filipinas', 'Mandiles Botánica', 'Mandiles Especiales', 'Chamarras']}
      emptyMessage="No hay prendas disponibles en el catálogo maestro."
    />
  );
};
