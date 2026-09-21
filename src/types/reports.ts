export interface GarmentStat {
  name: string;
  qty: number;
}

export interface CityStat {
  name: string;
  count: number;
  revenue: number;
}

export interface ClientStat {
  name: string;
  totalSpent: number;
  totalOrders: number;
  company?: string;
}

export interface CompanyStat {
  name: string;
  spent: number;
}

export interface SellerStat {
  name: string;
  totalSales: number;
  count: number;
}

export interface SellerArrayStat {
  name: string;
  totalSales: number;
  confirmedCount: number;
  quoteCount: number;
  totalDeals: number;
  conversionRate: number;
}

export interface SalesReportData {
  ordersCount: number;
  confirmedCount: number;
  totalConfirmedRevenue: number;
  totalCollected: number;
  totalGarments: number;
  totalServicesRevenue: number;
  averageTicket: number;
  topGarment: string;
  bestGarment: GarmentStat;
  secondBestGarment: GarmentStat;
  worstGarment: GarmentStat;
  sortedGarments: GarmentStat[];
  sortedEmbroideries: GarmentStat[];
  sortedCities: CityStat[];
  categoryRevenue: Record<string, number>;
  bestClient: ClientStat | null;
  bestCompany: CompanyStat;
  bestSeller: SellerStat;
  sellersArray: SellerArrayStat[];
}
