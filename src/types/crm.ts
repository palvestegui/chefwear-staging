import { Socials } from './index';

export interface ClientAccount {
  id?: string;
  accountId: string;
  accountType?: string;
  accountName?: string;
  parentAccountId?: string | null;
  contactNombre?: string;
  contactApellido?: string;
  phone?: string;
  email?: string;
  socials?: Socials;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  logoEmbroidery?: boolean;
  logoPlacements?: string[];
  logoFileLocation?: string;
  logoUrl?: string;
  logoUrls?: string[];
  threadColors?: string;
  pricingTier?: string;
  isProtected?: boolean;
  createdAt?: number | string;
  createdBy?: string;
}

export interface MasterContact {
  id?: string;
  contactId?: string;
  originalDocId?: string;
  fullName?: string;
  contactNombre?: string;
  contactApellido?: string;
  accountId?: string;
  companyName?: string;
  parentAccountName?: string;
  role?: string;
  phone?: string;
  email?: string;
  socials?: Socials;
  measurements?: Record<string, string | number>;
  sizingMatrix?: Record<string, string | number>;
  createdAt?: number | string;
  updatedAt?: number | string;
  activeOrdersCount?: number;
}
