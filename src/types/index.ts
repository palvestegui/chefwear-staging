import { TierDiscountRules } from './pricing';

export interface Socials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
}

export interface Contact {
  id?: string;
  contactId?: string;
  fullName?: string;
  contactNombre?: string;
  contactApellido?: string;
  accountId?: string;
  companyName?: string;
  clientType?: string;
  phone?: string;
  email?: string;
  contactRole?: string;
  role?: string;
  notes?: string;
  socials?: Socials;
  createdAt?: string | number;
  updatedAt?: string | number;
  sizingMatrix?: Record<string, any>;
  corporateAffiliation?: Record<string, any>;
  parentAccountId?: string;
  parentAccountName?: string;
}

export interface UserPermissions {
  role: string;
  name: string;
  email?: string;
  status: 'APPROVED' | 'PENDING' | string;
  canExport: boolean;
  canEditPrices: boolean;
  canManageRoles: boolean;
  canAccessDangerZone: boolean;
}

export interface GarmentAllocation {
  garmentName: string;
  fabric?: string;
  fabricColor?: string;
  size: string;
  measurements?: Record<string, string | number>;
  pocketName?: string;
  embroideries?: string[];
  services?: string[];
  customPocketDetails?: string;
  customServicePrices?: Record<string, number>;
  referenceImages?: Array<{ url: string; note?: string }>;
  productionStatus?: 'Pendiente' | 'Material Listo' | 'En Producción' | 'Producido' | 'Entregado';
}

export interface InstitutionalEmployee {
  id: string;
  contactId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
  garments: GarmentAllocation[];
}

export interface OrderLogo {
  id?: string;
  url?: string;
  file?: File;
  name?: string;
  placement?: string;
}

export interface OrderItem {
  name: string;
  fabric?: string;
  fabricColor?: string;
  qty: number;
  size?: string;
  measurements?: Record<string, string | number>;
  services?: string[];
  pocketName?: string;
  customPocketDetails?: string;
  customServicePrices?: Record<string, number>;
  isPackage?: boolean;
  isUdiGroup?: boolean;
  category?: string;
  sizingMode?: string;
  wearerContactId?: string;
  contactId?: string;
  udiGroupId?: string;
  referenceImages?: Array<{ url: string; note?: string }>;
  logoFile?: File;
  refImageFile?: File;
  price?: number;
  logoUrl?: string;
  embroideryType?: string;
  logoPlacement?: string;
  servicesPrice?: number;
  embroideries?: string[];
  customEmbroidery?: string;
  pricingTier?: string;
  specialPreset?: string;
  customUnitPrice?: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientRole?: string;
  recipientNotes?: string;
  recipientContactId?: string;
  productionStatus?: string;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: number;
  receipt: string | null;
  note: string;
  method: string;
  recordedBy: string;
  sellerName: string;
  sellerUid: string;
  tendered?: number | null;
  change?: number | null;
}

export interface Order {
  id?: string;
  docType?: string;
  cancellationId?: string;
  canceledAt?: number;
  canceledBy?: string;
  cancellationType?: string;
  refundAmount?: number;
  retainedAmount?: number;
  cancellationReason?: string;
  customer: string;
  customerFirstName?: string;
  customerLastName?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  items: OrderItem[];
  category?: string;
  pricingTier?: string;
  clientType?: string;
  contactRole?: string;
  accountId?: string;
  companyName?: string;
  parentAccountName?: string;
  paymentMethod?: string;
  deliveryCity?: string;
  logo?: string;
  logos?: string[];
  refImages?: string[];
  manualDiscount?: number;
  migrationFlatDiscount?: number;
  notes?: string;
  deliveryTime?: string;
  status?: string;
  productionStatus?: string;
  linkMode?: string;
  linkId?: string;
  contactId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerUid?: string;
  sellerRole?: string;
  isInstitutional?: boolean;
  institutionalRoster?: InstitutionalEmployee[];
  totalPrice?: number;
  subtotal?: number;
  totalDiscount?: number;
  amountCollected?: number;
  reconciliationNote?: string;
  paymentHistory?: PaymentEntry[];
  timestamps?: Record<string, string>;
  createdAt?: number | string;
  updatedAt?: number | string;
  createdBy?: string;
  createdById?: string;
  convertedFromQuoteId?: string;
  convertedAt?: number | string;
  orderLogos?: OrderLogo[];
  migrationDate?: string | null;
  customPaymentDate?: string | null;
}

export interface ProductPricing {
  id?: string;
  name: string;
  price: number;
  category?: string;
  fabric?: string;
}

export interface ServicePricing {
  id?: string;
  name: string;
  price: number;
  type?: string;
  garment?: string;
}

export interface VolumeDiscountTier {
  minQty: number;
  discountPct: number;
}

export interface PricingData {
  basePrices?: ProductPricing[];
  services?: ServicePricing[];
  volumeDiscounts?: VolumeDiscountTier[];
  config?: Record<string, string | number | boolean>;
  discountRulesByTier?: Record<string, TierDiscountRules>;
  specialPresetDiscounts?: Record<string, any>;
  specialPresets?: Record<string, any>;
  garments?: Record<string, any>;
  udiPricing?: Record<string, any>;
}

export * from './pricing';
export * from './reports';

export interface AuthUserProfile {
  name?: string;
  email?: string;
  uid?: string;
  id?: string;
  role?: string;
  status?: string;
  canExport?: boolean;
  canEditPrices?: boolean;
  canManageRoles?: boolean;
  canAccessDangerZone?: boolean;
}

export type AssignedUserRole = 'ventas' | 'operaciones' | 'produccion' | 'logistica' | 'admin';

export type ViewRoleOption = 'admin' | 'ventas' | 'operaciones' | 'produccion';

export interface PreProvisionUserPayload {
  email: string;
  displayName: string;
  role: AssignedUserRole;
}

export interface FirebaseUserSubset {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  uid: string;
  id?: string;
  role?: string;
  status?: string;
  preProvisioned?: boolean;
  canExport?: boolean;
  canEditPrices?: boolean;
  canManageRoles?: boolean;
  canAccessDangerZone?: boolean;
  lastLoginAt?: unknown;
}

export interface OrderLogoData {
  url: string;
  clientName: string;
  companyName?: string;
}
