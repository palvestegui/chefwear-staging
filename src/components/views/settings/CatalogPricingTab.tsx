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

    if (entries.length === 0) {
      return [];
    }

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
