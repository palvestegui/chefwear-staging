import { getInvoiceDate } from './orderUtils';
import { getDocType } from './constants';
import { getOrderSellerName } from './sellerUtils';
import { Order, OrderItem, PricingData, ServicePricing } from '../types';
import { OrderBreakdown } from '../hooks/useOrderSubmission';

export interface CsvOrderHeaderRow {
  orderId?: string;
  payerAccountId: string;
  salespersonName: string;
  orderDate: string;
  orderStatus: string;
  productionStatus: string;
  subtotal: number;
  volumeDiscount: number;
  cashDiscount: number;
  manualDiscount: number;
  totalGeneral: number;
  amountPaid: number;
  cashBalance: number;
  rawOrder: Order;
}

export interface CsvOrderLineItemRow {
  lineItemId: string;
  orderId?: string;
  wearerContactId: string;
  garmentCategory: string;
  garmentType: string;
  fabricSelected: string;
  sizingMode: string;
  sizeValue: string;
  quantity: number;
  unitBasePrice: number;
  lineSubtotal: number;
  itemData: OrderItem;
  rawOrder: Order;
}

export interface CsvLineItemModifierRow {
  modifierId: string;
  lineItemId: string;
  serviceName: string;
  serviceType: string;
  customTextPlacement: string;
  unitCost: number;
  quantity: number;
  modifierSubtotal: number;
  rawOrder: Order;
}

export const buildTable3OrderHeaders = (
  filteredOrders: Order[],
  getOrderBreakdown: (items: OrderItem[], category: string, paymentMethod: string, manualDiscount: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => OrderBreakdown
): CsvOrderHeaderRow[] => {
  return filteredOrders.filter(o => getDocType(o) === 'ORDEN').map(x => {
    const breakdown = getOrderBreakdown(x.items || [], x.pricingTier || x.category || x.clientType, x.paymentMethod, x.manualDiscount, x.clientType, x.accountId, x.migrationFlatDiscount || 0);
    const rawStatus = x.status || 'Estimado';
    
    let orderStatus: 'Cotización' | 'Orden Activa' | 'Entregado' | 'Cancelado' = 'Orden Activa';
    if (rawStatus === 'Estimado' || rawStatus === 'Cotización') {
      orderStatus = 'Cotización';
    } else if (rawStatus === 'Entregado') {
      orderStatus = 'Entregado';
    } else if (rawStatus === 'Cancelado') {
      orderStatus = 'Cancelado';
    }

    let productionStatus:
      | 'N/A - Cotización'
      | 'Inventario Pendiente'
      | 'Medidas Pendientes'
      | 'Nombres Pendientes'
      | 'Logo Pendiente'
      | 'En Taller de Bordado'
      | 'Material Listo'
      | 'En Confección'
      | 'Producido'
      | 'En Entrega'
      | 'Entregado'
      | 'CANCELADO' = 'Inventario Pendiente';

    if (orderStatus === 'Cotización') {
      productionStatus = 'N/A - Cotización';
    } else {
      const rawP = x.productionStatus || '';
      if (rawP === 'Completed' || rawStatus === 'Completed') {
        productionStatus = 'Producido';
      } else if (rawP === 'In Production' || rawStatus === 'In Production' || rawStatus === 'En Producción') {
        productionStatus = 'En Confección';
      } else if (rawP === 'Material Listo' || rawStatus === 'Material Listo') {
        productionStatus = 'Material Listo';
      } else if (rawP === 'En Taller de Bordado' || rawStatus === 'En Taller de Bordado') {
        productionStatus = 'En Taller de Bordado';
      } else if (rawP === 'Logo Pendiente' || rawStatus === 'Logo Pendiente') {
        productionStatus = 'Logo Pendiente';
      } else if (rawP === 'Nombres Pendientes' || rawStatus === 'Nombres Pendientes') {
        productionStatus = 'Nombres Pendientes';
      } else if (rawP === 'Medidas Pendientes' || rawStatus === 'Medidas Pendientes') {
        productionStatus = 'Medidas Pendientes';
      } else if (rawP === 'Inventario Pendiente' || rawStatus === 'Inventario Pendiente') {
        productionStatus = 'Inventario Pendiente';
      } else if (rawStatus === 'En Entrega') {
        productionStatus = 'En Entrega';
      } else if (rawStatus === 'Producido') {
        productionStatus = 'Producido';
      } else if (rawStatus === 'Entregado') {
        productionStatus = 'Entregado';
      } else if (rawStatus === 'Cancelado') {
        productionStatus = 'CANCELADO';
      }
    }

    const rawAmountPaid = Number(x.amountCollected || 0);
    const manualDiscount = Number(x.manualDiscount || 0);
    const volumeDiscount = breakdown.lines.filter((l: { label: string; amount: number }) => l.label.includes('Volumen') || l.label.includes('Colegio')).reduce((sum: number, l: { label: string; amount: number }) => sum + l.amount, 0);
    const cashDiscount = breakdown.lines.filter((l: { label: string; amount: number }) => l.label.includes('Contado')).reduce((sum: number, l: { label: string; amount: number }) => sum + l.amount, 0);
    
    const totalGeneral = breakdown.total;
    const amountPaid = rawAmountPaid;
    const cashBalance = Math.max(0, totalGeneral - amountPaid);

    return {
      orderId: x.id,
      payerAccountId: x.parentAccountName || x.companyName || x.customer || 'N/A',
      salespersonName: getOrderSellerName(x),
      orderDate: new Date(getInvoiceDate(x)).toISOString(),
      orderStatus,
      productionStatus,
      subtotal: breakdown.subtotal,
      volumeDiscount,
      cashDiscount,
      manualDiscount,
      totalGeneral,
      amountPaid,
      cashBalance,
      rawOrder: x
    };
  });
};

export const buildTable4OrderLineItems = (
  filteredOrders: Order[],
  getItemUnitPrice: (item: OrderItem, category: string, accountId?: string) => number
): CsvOrderLineItemRow[] => {
  const lineItems: CsvOrderLineItemRow[] = [];
  filteredOrders.filter(o => getDocType(o) === 'ORDEN').forEach(x => {
    const orderId = x.id;
    const cleanId = (x.id || '').replace(/^ORD-/, '');
    (x.items || []).forEach((it: OrderItem, idx: number) => {
      const lineItemId = `LIT-${cleanId}-${idx + 1}`;
      const wearerContactId = it.wearerContactId || it.contactId || x.customer || 'N/A';
      const garmentCategory = it.category || x.pricingTier || x.category || 'Filipinas';
      const garmentType = it.name || 'Prenda';
      const fabricSelected = it.fabric || 'N/A';
      
      let sizingMode = 'Pending Specs';
      if (it.sizingMode === 'Custom Tailored' || (it.measurements && Object.keys(it.measurements).length > 0)) {
        sizingMode = 'Custom Tailored';
      } else if (it.sizingMode === 'Standard Size' || it.size) {
        sizingMode = 'Standard Size';
      } else if (it.sizingMode === 'Pending Specs') {
        sizingMode = 'Pending Specs';
      }

      let sizeValue = 'Custom';
      if (sizingMode === 'Custom Tailored') {
        sizeValue = 'Custom';
      } else if (it.size && ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].includes(it.size)) {
        sizeValue = it.size;
      } else if (it.size) {
        sizeValue = it.size;
      } else if (sizingMode === 'Standard Size') {
        sizeValue = 'M';
      } else {
        sizeValue = 'Custom';
      }

      const quantity = Number(it.qty || 1);
      const unitBasePrice = getItemUnitPrice(it, x.pricingTier || x.category || x.clientType, x.accountId);
      const lineSubtotal = unitBasePrice * quantity;

      lineItems.push({
        lineItemId,
        orderId,
        wearerContactId,
        garmentCategory,
        garmentType,
        fabricSelected,
        sizingMode,
        sizeValue,
        quantity,
        unitBasePrice,
        lineSubtotal,
        itemData: it,
        rawOrder: x
      });
    });
  });
  return lineItems;
};

export const buildTable5LineItemModifiers = (
  filteredOrders: Order[],
  pricing: PricingData
): CsvLineItemModifierRow[] => {
  const modifiers: CsvLineItemModifierRow[] = [];
  filteredOrders.filter(o => getDocType(o) === 'ORDEN').forEach(x => {
    const cleanId = (x.id || '').replace(/^ORD-/, '');
    (x.items || []).forEach((it: OrderItem, idx: number) => {
      const lineItemId = `LIT-${cleanId}-${idx + 1}`;
      if (!it.services || !Array.isArray(it.services)) return;
      it.services.forEach((srvName: string, sIdx: number) => {
        const modifierId = `MOD-${cleanId}-${idx + 1}-${sIdx + 1}`;
        const srvDef = (pricing.services || []).find((s: ServicePricing) => s.name === srvName);
        let serviceType = srvDef?.type || 'Costo Adicional';
        if (!['Costo Adicional', 'Opción de Confección', 'Costo Adicional Editable'].includes(serviceType)) {
          serviceType = 'Costo Adicional';
        }

        let customTextPlacement = 'N/A';
        if (srvName.toLowerCase().includes('bolsillo') && it.pocketName) {
          customTextPlacement = it.pocketName;
        } else if (srvName === 'Bolsillos personalizados' && it.customPocketDetails) {
          customTextPlacement = it.customPocketDetails;
        } else if (it.embroideries && it.embroideries.length > 0) {
          customTextPlacement = it.embroideries.join(' | ');
        }

        const unitCost = (it.customServicePrices && it.customServicePrices[srvName] !== undefined)
          ? Number(it.customServicePrices[srvName])
          : Number(srvDef?.price || 0);
        const quantity = Number(it.qty || 1);
        const modifierSubtotal = unitCost * quantity;

        modifiers.push({
          modifierId,
          lineItemId,
          serviceName: srvName,
          serviceType,
          customTextPlacement,
          unitCost,
          quantity,
          modifierSubtotal,
          rawOrder: x
        });
      });
    });
  });
  return modifiers;
};

export const triggerCsvDownload = (rows: (string | number)[][], filename: string) => {
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
