import { getInvoiceDate, getCurrentProductionStatus } from '../utils/orderUtils';
import { usePricingEngine } from './usePricingEngine';
import { getOrderSellerName } from '../utils/sellerUtils';
import { 
  buildTable3OrderHeaders, 
  buildTable4OrderLineItems, 
  buildTable5LineItemModifiers,
  triggerCsvDownload 
} from '../utils/csvFormatters';

export const useExportEngine = (pricing: any) => {
  const { getItemUnitPrice, consolidateCommercialItems, getOrderBreakdown } = usePricingEngine(pricing);

  const getTable3OrderHeaders = (filteredOrders: any[]) => {
    return buildTable3OrderHeaders(filteredOrders, getOrderBreakdown);
  };

  const getTable4OrderLineItems = (filteredOrders: any[]) => {
    return buildTable4OrderLineItems(filteredOrders, getItemUnitPrice);
  };

  const getTable5LineItemModifiers = (filteredOrders: any[]) => {
    return buildTable5LineItemModifiers(filteredOrders, pricing);
  };

  const generateGarmentsCsv = (filteredOrders: any[], filename: string) => {
    const csv: (string | number)[][] = [[
      'ID Orden', 
      'Cliente', 
      'Fecha', 
      'Estado Orden', 
      'Categoría', 
      'Prenda', 
      'Tela', 
      'Modo Talla', 
      'Talla / Medida', 
      'Servicios / Bordados', 
      'Cantidad', 
      'Precio Unitario (Bs)', 
      'Subtotal (Bs)'
    ]];

    filteredOrders.filter(x => x.status !== 'Estimado' && x.status !== 'Cotización').forEach(x => {
      const isInst = Boolean(x.isInstitutional || (x.institutionalRoster && x.institutionalRoster.length > 0) || (x.items || []).some((it: any) => Boolean(it.recipientName)));
      const orderItems = consolidateCommercialItems(x.items || [], isInst);
      orderItems.forEach((it: any) => {
        const unitPrice = getItemUnitPrice(it, x.pricingTier || x.category || x.clientType, x.accountId);
        const qty = Number(it.qty || 1);
        const subtotal = unitPrice * qty;

        let sizingMode = 'Estándar';
        let sizeValue = it.size || 'M';
        if (it.sizingMode === 'Custom Tailored' || (it.measurements && Object.keys(it.measurements).length > 0)) {
          sizingMode = 'A Medida';
          sizeValue = 'Personalizado';
        }

        const mods: string[] = [];
        if (it.services && Array.isArray(it.services)) mods.push(...it.services);
        if (it.embroideries && Array.isArray(it.embroideries) && it.embroideries.length > 0) {
          mods.push(`Bordado: ${it.embroideries.join('; ')}`);
        }
        if (it.pocketName) mods.push(`Bolsillo: ${it.pocketName}`);

        csv.push([
          `"${x.id}"`,
          `"${x.customer}"`,
          `"${new Date(getInvoiceDate(x)).toLocaleDateString()}"`,
          `"${x.status}"`,
          `"${x.pricingTier || x.category || ''}"`,
          `"${it.name}"`,
          `"${it.fabric || ''}${it.fabricColor ? ' (' + it.fabricColor + ')' : ''}"`,
          `"${sizingMode}"`,
          `"${sizeValue}"`,
          `"${mods.join(' | ') || 'Ninguno'}"`,
          qty,
          unitPrice.toFixed(2),
          subtotal.toFixed(2)
        ]);
      });
    });
    triggerCsvDownload(csv, filename);
  };

  const generateCsv = (filteredOrders: any[], filename: string) => {
    const csv: (string | number)[][] = [[
      'ID Orden', 
      'Cliente', 
      'Vendedor', 
      'Fecha', 
      'Estado Comercial', 
      'Estado Producción', 
      'Artículos Vendidos', 
      'Subtotal (Bs)', 
      'Descuentos Aplicados', 
      'Monto Descontado (Bs)', 
      'Monto Total (Bs)', 
      'Monto Cobrado (Bs)', 
      'Monto por Cobrar (Bs)'
    ]];

    filteredOrders.filter(x => x.status !== 'Estimado' && x.status !== 'Cotización').forEach(x => {
      const breakdown = getOrderBreakdown(x.items || [], x.pricingTier || x.category || x.clientType, x.paymentMethod, x.manualDiscount, x.clientType, x.accountId, x.migrationFlatDiscount || 0);
      const discountLabels = breakdown.lines.map((l: any) => l.label).join(' | ');
      const discountAmount = breakdown.lines.reduce((sum: number, l: any) => sum + l.amount, 0);
      
      const itemsMap: Record<string, number> = {};
      (x.items || []).forEach((it: any) => {
        const name = it.name || 'Prenda';
        itemsMap[name] = (itemsMap[name] || 0) + Number(it.qty || 1);
      });
      const itemsSold = Object.entries(itemsMap).map(([name, qty]) => `${qty}x ${name}`).join(' | ');
      
      const total = Number(x.totalPrice || 0);
      const rawCollected = Number(x.amountCollected || 0);
      const histSum = Array.isArray(x.paymentHistory) && x.paymentHistory.length > 0
        ? x.paymentHistory.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
        : rawCollected;
      const effectiveCollected = Math.max(rawCollected, histSum);
      const cobrado = Math.min(total, effectiveCollected);
      const montoPorCobrar = Math.max(0, total - effectiveCollected);
      const prodStatus = getCurrentProductionStatus(x);
        
      csv.push([
        `"${x.id}"`, 
        `"${x.customer}"`, 
        `"${getOrderSellerName(x)}"`, 
        `"${new Date(getInvoiceDate(x)).toLocaleDateString()}"`, 
        `"${x.status}"`, 
        `"${prodStatus}"`, 
        `"${itemsSold}"`,
        breakdown.subtotal.toFixed(2),
        `"${discountLabels || 'Ninguno'}"`,
        discountAmount.toFixed(2),
        total.toFixed(2), 
        cobrado.toFixed(2),
        montoPorCobrar.toFixed(2)
      ]);
    });
    triggerCsvDownload(csv, filename);
  };

  const generateOrdersCsv = (filteredOrders: any[], filename = "1_Ordenes.csv") => {
    const headers = ["Order_ID", "Payer_Account_ID", "Salesperson_Name", "Order_Date", "Order_Status", "Production_Status", "Subtotal", "Volume_Discount", "Cash_Discount", "Manual_Discount", "Total_General", "Amount_Paid", "Cash_Balance"];
    const rows = getTable3OrderHeaders(filteredOrders).map(h => [
      `"${h.orderId}"`,
      `"${h.payerAccountId}"`,
      `"${h.salespersonName}"`,
      `"${h.orderDate}"`,
      `"${h.orderStatus}"`,
      `"${h.productionStatus}"`,
      h.subtotal.toFixed(2),
      h.volumeDiscount.toFixed(2),
      h.cashDiscount.toFixed(2),
      h.manualDiscount.toFixed(2),
      h.totalGeneral.toFixed(2),
      h.amountPaid.toFixed(2),
      h.cashBalance.toFixed(2)
    ]);
    triggerCsvDownload([headers, ...rows], filename);
  };

  const generateItemsCsv = (filteredOrders: any[], filename = "2_Items.csv") => {
    const headers = ["Line_Item_ID", "Order_ID", "Wearer_Contact_ID", "Garment_Category", "Garment_Type", "Fabric_Selected", "Sizing_Mode", "Size_Value", "Quantity", "Unit_Base_Price", "Line_Subtotal"];
    const rows = getTable4OrderLineItems(filteredOrders).map(li => [
      `"${li.lineItemId}"`,
      `"${li.orderId}"`,
      `"${li.wearerContactId}"`,
      `"${li.garmentCategory}"`,
      `"${li.garmentType}"`,
      `"${li.fabricSelected}"`,
      `"${li.sizingMode}"`,
      `"${li.sizeValue}"`,
      li.quantity,
      li.unitBasePrice.toFixed(2),
      li.lineSubtotal.toFixed(2)
    ]);
    triggerCsvDownload([headers, ...rows], filename);
  };

  const generateModifiersCsv = (filteredOrders: any[], filename = "3_Modificadores.csv") => {
    const headers = ["Modifier_ID", "Line_Item_ID", "Service_Name", "Service_Type", "Custom_Text_Placement", "Unit_Cost", "Quantity", "Modifier_Subtotal"];
    const rows = getTable5LineItemModifiers(filteredOrders).map(m => [
      `"${m.modifierId}"`,
      `"${m.lineItemId}"`,
      `"${m.serviceName}"`,
      `"${m.serviceType}"`,
      `"${m.customTextPlacement}"`,
      m.unitCost.toFixed(2),
      m.quantity,
      m.modifierSubtotal.toFixed(2)
    ]);
    triggerCsvDownload([headers, ...rows], filename);
  };

  const generateCanceledCsv = (filteredCanceled: any[], filename = "4_Cancelados.csv") => {
    const headers = [
      "Fecha_Anulacion",
      "Order_ID",
      "Comprobante_ID",
      "Cliente",
      "Tipo_Anulacion",
      "Monto_Devuelto_Bs",
      "Monto_Retenido_Bs",
      "Total_Original_Bs",
      "Cobrado_Original_Bs",
      "Motivo"
    ];
    const rows = (filteredCanceled || []).map(x => [
      `"${x.cancellationDate || (x.canceledAt ? new Date(x.canceledAt).toISOString() : new Date().toISOString())}"`,
      `"${x.id}"`,
      `"${x.cancellationId || 'N/A'}"`,
      `"${x.customer || ''}"`,
      `"${x.cancellationType || 'Anulado'}"`,
      Number(x.refundAmount || 0).toFixed(2),
      Number(x.retainedAmount || 0).toFixed(2),
      Number(x.totalPrice || 0).toFixed(2),
      Number(x.amountCollected || 0).toFixed(2),
      `"${(x.cancellationReason || x.cancelReason || '').replace(/"/g, '""')}"`
    ]);
    triggerCsvDownload([headers, ...rows], filename);
  };

  const generateFullSnapshot = (filteredOrders: any[], filteredCanceled: any[]) => {
    const now = new Date();
    const snapshotPrefix = `SNAPSHOT_${now.toISOString().replace(/[:.]/g, '-')}`;
    generateOrdersCsv(filteredOrders, `${snapshotPrefix}_1_Ordenes.csv`);
    generateItemsCsv(filteredOrders, `${snapshotPrefix}_2_Items.csv`);
    generateModifiersCsv(filteredOrders, `${snapshotPrefix}_3_Modificadores.csv`);
    generateCanceledCsv(filteredCanceled, `${snapshotPrefix}_4_Cancelados.csv`);
  };

  return {
    getTable3OrderHeaders,
    getTable4OrderLineItems,
    getTable5LineItemModifiers,
    generateGarmentsCsv,
    generateCsv,
    generateOrdersCsv,
    generateItemsCsv,
    generateModifiersCsv,
    generateCanceledCsv,
    generateFullSnapshot,
    // Aliases for backwards compatibility
    generateT3Csv: generateOrdersCsv,
    generateT4Csv: generateItemsCsv,
    generateT5Csv: generateModifiersCsv
  };
};
