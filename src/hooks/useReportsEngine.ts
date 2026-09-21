import { useState, useMemo } from 'react';
import { getInvoiceDate, normalizeDateMs } from '../utils/orderUtils';
import { getDocType } from '../utils/constants';
import { useExportEngine } from './useExportEngine';
import { usePricingEngine } from './usePricingEngine';
import { getOrderSellerName } from '../utils/sellerUtils';
import { 
  Order, OrderItem, PaymentEntry, PricingData, 
  SalesReportData, OrderLogoData, ClientStat 
} from '../types';

export type ReportTimeframe = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'todo' | 'personalizado';

export const useReportsEngine = (orders: Order[] = [], pricing: PricingData) => {
  const [reportesTab, setReportesTab] = useState<string>('dashboard');
  const [reportTimeframe, setReportTimeframe] = useState<ReportTimeframe>('todo');

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = today.toISOString().split('T')[0];

  const [customStartDate, setCustomStartDate] = useState<string>(defaultStart);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultEnd);

  const exportEngine = useExportEngine(pricing);
  const { getItemUnitPrice } = usePricingEngine(pricing);

  // Time boundaries
  const { filteredReportOrders, filteredCanceledOrders } = useMemo(() => {
    const now = new Date();
    let startMs = 0;
    let endMs = Infinity;

    if (reportTimeframe === 'hoy') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startMs = d.getTime();
      endMs = startMs + 86400000 - 1;
    } else if (reportTimeframe === 'semana') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      startMs = monday.getTime();
      endMs = startMs + 7 * 86400000 - 1;
    } else if (reportTimeframe === 'mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      startMs = firstDay.getTime();
      endMs = nextMonth.getTime() - 1;
    } else if (reportTimeframe === 'trimestre') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const nextQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 1);
      startMs = firstDay.getTime();
      endMs = nextQuarter.getTime() - 1;
    } else if (reportTimeframe === 'personalizado') {
      if (customStartDate) {
        const s = new Date(customStartDate + 'T00:00:00');
        startMs = isNaN(s.getTime()) ? 0 : s.getTime();
      }
      if (customEndDate) {
        const e = new Date(customEndDate + 'T23:59:59');
        endMs = isNaN(e.getTime()) ? Infinity : e.getTime();
      }
    }

    const inRange = (orders || []).filter(o => {
      const ts = getInvoiceDate(o);
      return ts >= startMs && ts <= endMs;
    });

    return {
      filteredReportOrders: inRange.filter(o => o.status !== 'Anulado' && o.status !== 'Cancelado'),
      filteredCanceledOrders: inRange.filter(o => o.status === 'Anulado' || o.status === 'Cancelado')
    };
  }, [orders, reportTimeframe, customStartDate, customEndDate]);

  // Extract logos
  const allOrdersLogos = useMemo(() => {
    const list: OrderLogoData[] = [];
    const seen = new Set<string>();

    (orders || []).forEach(o => {
      const addLogo = (url: string | undefined) => {
        if (url && typeof url === 'string' && !seen.has(url) && (url.startsWith('http') || url.startsWith('data:image'))) {
          seen.add(url);
          list.push({ url, clientName: o.customer || 'Cliente', companyName: o.companyName });
        }
      };

      addLogo(o.logo);
      if (Array.isArray(o.logos)) o.logos.forEach(addLogo);
      if (Array.isArray(o.refImages)) o.refImages.forEach(addLogo);
      (o.items || []).forEach((it: OrderItem) => {
        addLogo(it.logoUrl);
        if (Array.isArray(it.referenceImages)) {
          it.referenceImages.forEach(img => addLogo(img.url));
        }
      });
    });
    return list;
  }, [orders]);

  // Calculate Report Statistics
  const reportStats: SalesReportData = useMemo(() => {
    const isOrderConfirmed = (o: Order) => {
      const docType = getDocType(o);
      return docType === 'ORDEN' && o.status !== 'Estimado' && o.status !== 'Cotización';
    };

    const confirmedOrders = filteredReportOrders.filter(isOrderConfirmed);
    const totalConfirmedRevenue = confirmedOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const totalCollected = confirmedOrders.reduce((sum, o) => {
      const total = Number(o.totalPrice || 0);
      const rawCollected = Number(o.amountCollected || 0);
      const histSum = Array.isArray(o.paymentHistory) && o.paymentHistory.length > 0
        ? o.paymentHistory.reduce((s: number, p: PaymentEntry) => s + Number(p.amount || 0), 0)
        : rawCollected;
      const effective = Math.max(rawCollected, histSum);
      return sum + Math.min(total, effective);
    }, 0);

    const garmentMap: Record<string, number> = {};
    const embroideryMap: Record<string, number> = {};
    const cityMap: Record<string, { count: number; revenue: number }> = {};
    const categoryRev: Record<string, number> = {};
    const clientMap: Record<string, { totalSpent: number; totalOrders: number; company?: string }> = {};
    const companyMap: Record<string, number> = {};
    const sellerStatsMap: Record<string, { totalSales: number; confirmedCount: number; quoteCount: number; totalDeals: number }> = {};

    // Calculate seller metrics across all deals in this period
    filteredReportOrders.forEach(o => {
      const sName = getOrderSellerName(o);
      if (!sellerStatsMap[sName]) {
        sellerStatsMap[sName] = { totalSales: 0, confirmedCount: 0, quoteCount: 0, totalDeals: 0 };
      }
      sellerStatsMap[sName].totalDeals += 1;

      if (isOrderConfirmed(o)) {
        sellerStatsMap[sName].confirmedCount += 1;
        sellerStatsMap[sName].totalSales += Number(o.totalPrice || 0);
      } else {
        sellerStatsMap[sName].quoteCount += 1;
      }
    });

    let totalGarments = 0;
    let totalServicesRevenue = 0;

    confirmedOrders.forEach(o => {
      const cat = o.category || 'Particular';
      categoryRev[cat] = (categoryRev[cat] || 0) + Number(o.totalPrice || 0);

      const city = o.deliveryCity || o.city || 'Santa Cruz';
      if (!cityMap[city]) cityMap[city] = { count: 0, revenue: 0 };
      cityMap[city].count += 1;
      cityMap[city].revenue += Number(o.totalPrice || 0);

      const cName = o.customer || 'Cliente Particular';
      if (!clientMap[cName]) clientMap[cName] = { totalSpent: 0, totalOrders: 0, company: o.companyName };
      clientMap[cName].totalSpent += Number(o.totalPrice || 0);
      clientMap[cName].totalOrders += 1;

      if (o.companyName && o.companyName !== 'Cliente Particular') {
        companyMap[o.companyName] = (companyMap[o.companyName] || 0) + Number(o.totalPrice || 0);
      }

      (o.items || []).forEach((it: OrderItem) => {
        const gName = it.name || 'Prenda';
        const qty = Number(it.qty || 1);
        garmentMap[gName] = (garmentMap[gName] || 0) + qty;
        totalGarments += qty;

        const embKey = it.embroideryType || it.logoPlacement || (it.customEmbroidery ? 'Bordado Personalizado' : null) || (it.pocketName ? 'Bordado Bolsillo' : null);
        if (embKey) {
          embroideryMap[embKey] = (embroideryMap[embKey] || 0) + qty;
        }
        if (Array.isArray(it.services)) {
          it.services.forEach((s: string) => {
            if (s.toLowerCase().includes('bordado') || s.toLowerCase().includes('logo') || s.toLowerCase().includes('pecho') || s.toLowerCase().includes('espalda')) {
              embroideryMap[s] = (embroideryMap[s] || 0) + qty;
            }
          });
        }
        if (it.servicesPrice) {
          totalServicesRevenue += Number(it.servicesPrice || 0) * qty;
        }
      });
    });

    const sortedGarments = Object.entries(garmentMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const sortedEmbroideries = Object.entries(embroideryMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const sortedCities = Object.entries(cityMap)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    let bestClient: ClientStat | null = null;
    let maxClientSpent = 0;
    Object.entries(clientMap).forEach(([name, data]) => {
      if (data.totalSpent > maxClientSpent) {
        maxClientSpent = data.totalSpent;
        bestClient = { name, ...data };
      }
    });

    let bestCompany = { name: 'Sin Empresa', spent: 0 };
    Object.entries(companyMap).forEach(([name, spent]) => {
      if (spent > bestCompany.spent) {
        bestCompany = { name, spent };
      }
    });

    let bestSeller = { name: 'Sin Vendedor', totalSales: 0, count: 0 };
    const sellersArray = Object.entries(sellerStatsMap).map(([name, data]) => {
      const conversionRate = data.totalDeals > 0 ? (data.confirmedCount / data.totalDeals) * 100 : 0;
      if (data.totalSales > bestSeller.totalSales) {
        bestSeller = { name, totalSales: data.totalSales, count: data.confirmedCount };
      }
      return {
        name,
        totalSales: data.totalSales,
        confirmedCount: data.confirmedCount,
        quoteCount: data.quoteCount,
        totalDeals: data.totalDeals,
        conversionRate
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    const averageTicket = confirmedOrders.length > 0 ? (totalConfirmedRevenue / confirmedOrders.length) : 0;
    const topGarment = sortedGarments[0]?.name || 'N/A';

    return {
      ordersCount: filteredReportOrders.length,
      confirmedCount: confirmedOrders.length,
      totalConfirmedRevenue,
      totalCollected,
      totalGarments,
      totalServicesRevenue,
      averageTicket,
      topGarment,
      bestGarment: sortedGarments[0] || { name: 'N/A', qty: 0 },
      secondBestGarment: sortedGarments[1] || { name: 'N/A', qty: 0 },
      worstGarment: sortedGarments[sortedGarments.length - 1] || { name: 'N/A', qty: 0 },
      sortedGarments,
      sortedEmbroideries,
      sortedCities,
      categoryRevenue: categoryRev,
      bestClient,
      bestCompany,
      bestSeller,
      sellersArray
    };
  }, [filteredReportOrders]);

  return {
    reportesTab,
    setReportesTab,
    reportTimeframe,
    setReportTimeframe,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    filteredReportOrders,
    filteredCanceledOrders,
    allOrdersLogos,
    reportStats,
    getItemUnitPrice,
    canExport: true,
    ...exportEngine
  };
};
