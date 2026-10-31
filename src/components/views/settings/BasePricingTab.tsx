import React, { useMemo } from 'react';
import { MasterDetailPricingView, MasterDetailPricingItem, PricingVariant } from '../../pricing/MasterDetailPricingView';

export interface BasePricingTabProps {
  settingsForm: {
    garments?: Record<string, Record<string, { priceRaleo?: number; priceB2B?: number; isPrimary?: boolean; fabricSku?: string; sku?: string } | number>>;
    [key: string]: unknown;
  };
}

const WORKSHOP_GARMENT_METADATA: Record<string, { category: string }> = {
  'Filipina': { category: 'Filipinas' },
  'Mandil': { category: 'Mandiles' },
  'Delantal': { category: 'Mandiles' },
  'Pantalón': { category: 'Pantalones' },
  'Gorro': { category: 'Gorros' },
  'Camisa (servicio)': { category: 'Camisas' },
  'Camisa de servicio (mesas)': { category: 'Camisas' },
  'Camisa (hospitalar)': { category: 'Camisas' },
  'Camisa hospitalar': { category: 'Camisas' },
  'Guardapolvo': { category: 'Guardapolvos' },
  'Chamarra Aventurera': { category: 'Chamarras' },
  'Chamarra Ecuestre personalizada': { category: 'Chamarras' },
  'Regulador para correas cruzadas': { category: 'Accesorios' },
  'Conector para Tirantes': { category: 'Accesorios' }
};

export const BasePricingTab: React.FC<BasePricingTabProps> = ({ settingsForm }) => {
  const items: MasterDetailPricingItem[] = useMemo(() => {
    const garments = settingsForm?.garments || {};
    return Object.entries(garments)
      .filter(([garmentName]) => {
        const norm = garmentName.toLowerCase();
        const isCommercialCatalog =
          norm.includes('noir') ||
          norm.includes('botánica') ||
          norm.includes('botanica') ||
          norm.includes('zeus') ||
          norm.includes('laurel') ||
          norm.includes('urucú') ||
          norm.includes('curcuma') ||
          norm.includes('jardín');
        return !isCommercialCatalog;
      })
      .map(([garmentName, fabricsObj]) => {
        const meta = WORKSHOP_GARMENT_METADATA[garmentName] || {
          category: 'Taller Base'
        };

        let garmentSku: string | undefined = undefined;
        if (typeof fabricsObj === 'object' && fabricsObj !== null) {
          const rawSku = (fabricsObj as { sku?: unknown; _sku?: unknown }).sku || (fabricsObj as { _sku?: unknown })._sku;
          if (typeof rawSku === 'string') garmentSku = rawSku;
        }

        const variants: PricingVariant[] = Object.entries(fabricsObj || {})
          .filter(([fabricName]) => !fabricName.startsWith('_') && fabricName !== 'sku' && fabricName !== 'baseGarment')
          .map(([fabricName, val]) => {
            let raleo = 0;
            let b2b = 0;
            let isPrimary = false;
            let fabricSku: string | undefined = undefined;

            if (typeof val === 'number') {
              raleo = val;
              b2b = val;
            } else if (val && typeof val === 'object') {
              raleo = Number(val.priceRaleo) || 0;
              b2b = Number(val.priceB2B) || 0;
              isPrimary = Boolean(val.isPrimary);
              const fSku = (val as { fabricSku?: unknown; sku?: unknown }).fabricSku || (val as { sku?: unknown }).sku;
              if (typeof fSku === 'string') fabricSku = fSku;
            }

            return {
              fabricName,
              fabricSku,
              priceRaleo: raleo,
              priceB2B: b2b,
              isPrimary
            };
          });

        // Resolve primary fabric strictly from synchronized isPrimary flag
        const primary = variants.find(v => v.isPrimary) || variants[0];

        return {
          id: garmentName,
          name: garmentName,
          sku: garmentSku,
          category: meta.category,
          defaultFabric: primary?.fabricName || '',
          defaultRaleoPrice: primary?.priceRaleo || 0,
          defaultB2BPrice: primary?.priceB2B || 0,
          variants
        };
      });
  }, [settingsForm?.garments]);

  return (
    <MasterDetailPricingView
      title="TARIFARIO BASE DE TALLER"
      subtitle="Matriz de costeo por prenda y tela sincronizada desde Azafrán Precios."
      items={items}
      categoryPills={['Todas', 'Filipinas', 'Mandiles', 'Pantalones', 'Gorros', 'Chamarras', 'Accesorios']}
      emptyMessage="No hay prendas base configuradas en el tarifario."
    />
  );
};
