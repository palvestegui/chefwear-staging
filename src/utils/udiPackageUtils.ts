/**
 * Compatibility layer for UDI Special Preset bundle calculations.
 * Core domain logic is ring-fenced in src/domains/udi/udiBundleEngine.ts.
 */

import { OrderItem } from '../types';
import {
  UdiGarmentPriceInfo,
  UdiBundleBreakdown,
  extractNumericPriceFromGarmentData,
  getUdiBundleBreakdown,
  collapseUdiStudentPackage,
  calculateUdiPackageDiscount
} from '../domains/udi/udiBundleEngine';
import { consolidateCommercialItems } from './orderItemConsolidation';

export type { UdiGarmentPriceInfo, UdiBundleBreakdown };
export {
  extractNumericPriceFromGarmentData,
  getUdiBundleBreakdown,
  collapseUdiStudentPackage,
  calculateUdiPackageDiscount
};

/**
 * Legacy wrapper: bundles UDI student items and consolidates identical items.
 * Views should import consolidateCommercialItems directly from src/utils/orderItemConsolidation.
 */
export const collapseUdiItems = (items: OrderItem[]): OrderItem[] => {
  return consolidateCommercialItems(items);
};

