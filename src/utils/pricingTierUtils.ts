import { normalizePricingTier } from './constants';

export const getPricingTierFromClientType = (clientType: string, accountId?: string, accountPricingTier?: string): string => {
  if (accountPricingTier) return normalizePricingTier(accountPricingTier);
  return 'Estándar Raleo';
};

export function resolveOrderTier(
  items: any[],
  category?: string,
  accountId?: string,
  clientType?: string,
  orderPricingTier?: string
): string {
  if (orderPricingTier && orderPricingTier.trim() !== '') {
    return normalizePricingTier(orderPricingTier);
  }
  if (
    accountId === 'ACC-001' || 
    clientType === 'Estudiante UDI' || 
    category === 'UDI' || 
    category === 'Alumnos UDI' || 
    category === 'UDI Especial' ||
    (items || []).some((it: any) => it.isPackage || it.isUdiGroup || it.name === 'Uniforme Completo UDI')
  ) {
    return 'UDI Especial';
  }
  const firstItem = (items || [])[0];
  if (firstItem?.pricingTier) {
    return normalizePricingTier(firstItem.pricingTier);
  }
  if (firstItem?.specialPreset) {
    return firstItem.specialPreset;
  }
  if (category) {
    const norm = normalizePricingTier(category);
    if (norm !== 'Estándar Raleo' || category.toLowerCase().includes('raleo')) {
      return norm;
    }
  }
  return 'Estándar Raleo';
}
