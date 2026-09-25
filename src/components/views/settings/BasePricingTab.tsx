import React, { useMemo } from 'react';
import { MasterDetailPricingView, MasterDetailPricingItem, PricingVariant } from '../../pricing/MasterDetailPricingView';

export interface BasePricingTabProps {
  settingsForm: {
    garments?: Record<string, Record<string, { priceRaleo?: number; priceB2B?: number } | number>>;
    [key: string]: unknown;
  };
}

const WORKSHOP_GARMENT_METADATA: Record<string, { consumption: number; category: string; defaultFabric: string }> = {
  'Filipina': { consumption: 1.8, category: 'Filipinas', defaultFabric: 'Drill de 8oz' },
  'Mandil': { consumption: 1.2, category: 'Mandiles', defaultFabric: 'Drill de 8oz' },
  'Delantal': { consumption: 1.0, category: 'Mandiles', defaultFabric: 'Gabardina de 1ra' },
  'Pantalón': { consumption: 1.5, category: 'Pantalones', defaultFabric: 'Drill de 8oz' },
  'Gorro': { consumption: 0.25, category: 'Gorros', defaultFabric: 'Drill de 8oz' },
  'Camisa (servicio)': { consumption: 1.35, category: 'Camisas', defaultFabric: 'Cristal' },
  'Camisa de servicio (mesas)': { consumption: 1.35, category: 'Camisas', defaultFabric: 'Cristal' },
  'Camisa (hospitalar)': { consumption: 1.5, category: 'Camisas', defaultFabric: 'Ultra Hospitalar' },
  'Camisa hospitalar': { consumption: 1.5, category: 'Camisas', defaultFabric: 'Ultra Hospitalar' },
  'Guardapolvo': { consumption: 2.0, category: 'Guardapolvos', defaultFabric: 'Drill 8oz' },
  'Chamarra Aventurera': { consumption: 2.2, category: 'Chamarras', defaultFabric: 'Drill de 8oz' },
  'Chamarra Ecuestre personalizada': { consumption: 2.5, category: 'Chamarras', defaultFabric: '10 oz Cotton Canvas' },
  'Regulador para correas cruzadas': { consumption: 0.1, category: 'Accesorios', defaultFabric: 'Cuero' },
  'Conector para Tirantes': { consumption: 0.1, category: 'Accesorios', defaultFabric: 'Cuero' }
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
          consumption: 1.5,
          category: 'Taller Base',
          defaultFabric: Object.keys(fabricsObj || {})[0] || 'Drill de 8oz'
        };

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
            isPrimary: fabricName === meta.defaultFabric
          };
        });

        const primary = variants.find(v => v.isPrimary) || variants[0];

        return {
          id: garmentName,
          name: garmentName,
          category: meta.category,
          consumptionMeters: meta.consumption,
          defaultFabric: meta.defaultFabric,
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
