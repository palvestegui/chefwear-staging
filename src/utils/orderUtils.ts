export const normalizeDateMs = (d: any): number | null => {
  if (d === null || d === undefined) return null;
  if (typeof d === 'number') return isNaN(d) ? null : d;
  if (typeof d?.toMillis === 'function') return d.toMillis();
  if (typeof d?.toDate === 'function') return d.toDate().getTime();
  if (typeof d?.seconds === 'number') return d.seconds * 1000;
  if (typeof d === 'string') {
    const parsed = Date.parse(d);
    return isNaN(parsed) ? null : parsed;
  }
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d.getTime();
  return null;
};

export const getInvoiceDate = (order: any): number => {
  if (!order) return Date.now();
  if (order.status !== 'Estimado' && order.status !== 'Cotización') {
    if (Array.isArray(order.paymentHistory) && order.paymentHistory.length > 0) {
      const firstPaymentDate = normalizeDateMs(order.paymentHistory[0]?.date);
      if (firstPaymentDate) return firstPaymentDate;
    }
    if (order.timestamps?.['Inventario Pendiente']) {
      const ts = normalizeDateMs(order.timestamps['Inventario Pendiente']);
      if (ts) return ts;
    }
    if (order.timestamps?.['Orden Activa']) {
      const ts = normalizeDateMs(order.timestamps['Orden Activa']);
      if (ts) return ts;
    }
  }
  const fallback = normalizeDateMs(order.timestamps?.['Estimado']) || 
                   normalizeDateMs(order.timestamps?.['Cotización']) || 
                   normalizeDateMs(order.createdAt) || 
                   Date.now();
  return fallback;
};

export const determineNewOrderProductionStatus = (orderItems: any[], rawStatus?: string, orderLogos?: string[]) => {
    if (rawStatus === 'Estimado' || rawStatus === 'Cotización') return 'N/A - Cotización';
    if (rawStatus === 'Cancelado') return 'CANCELADO';
    if (rawStatus === 'Material Listo') return 'Material Listo';
    if (rawStatus === 'En Confección' || rawStatus === 'En Producción' || rawStatus === 'In Production') return 'En Confección';
    if (rawStatus === 'Producido' || rawStatus === 'Completed') return 'Producido';
    if (rawStatus === 'En Entrega') return 'En Entrega';
    if (rawStatus === 'Entregado') return 'Entregado';

    let missingSizes = false;
    let missingEmbroideryNames = false;
    let missingLogo = false;
    let sentToEmbroideryWorkshop = false;
    let needsPurchasing = false;

    for (const it of orderItems || []) {
      const hasMeasurements = it.measurements && Object.keys(it.measurements).some((k: string) => it.measurements[k] && String(it.measurements[k]).trim() !== '');
      const hasStandardSize = it.size && ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].includes(it.size);
      if (it.sizingMode === 'Pending Specs' || (!hasMeasurements && !hasStandardSize)) {
        missingSizes = true;
      }

      const hasEmbroideryReq = (it.embroideries && it.embroideries.length > 0) || 
                               (it.services && it.services.some((s: string) => s.toLowerCase().includes('bordado') || s.toLowerCase().includes('nombre') || s.toLowerCase().includes('bolsillo')));
      const hasEmbroideryDetail = it.customEmbroidery || it.pocketName || it.customPocketDetails;
      if (hasEmbroideryReq && !hasEmbroideryDetail) {
        missingEmbroideryNames = true;
      }

      const hasLogoService = it.services && it.services.some((s: string) => s.toLowerCase().includes('logo') || s.toLowerCase().includes('auspiciador'));
      if (hasLogoService && (!orderLogos || orderLogos.length === 0) && (!it.referenceImages || it.referenceImages.length === 0)) {
        missingLogo = true;
      }

      if (it.inEmbroideryWorkshop || it.embroideryStatus === 'En Taller') {
        sentToEmbroideryWorkshop = true;
      }

      if (it.needsFabric) {
        needsPurchasing = true;
      }
    }

    if (missingSizes) {
      return 'Medidas Pendientes';
    }
    if (missingEmbroideryNames) {
      return 'Nombres Pendientes';
    }
    if (missingLogo) {
      return 'Logo Pendiente';
    }
    if (sentToEmbroideryWorkshop) {
      return 'En Taller de Bordado';
    }
    if (needsPurchasing || rawStatus === 'Inventario Pendiente' || rawStatus === 'Orden Activa') {
      return 'Inventario Pendiente';
    }

    return 'Inventario Pendiente';
  };

export const getCurrentProductionStatus = (order: any) => {
    if (order.status === 'Estimado' || order.status === 'Cotización') return 'N/A - Cotización';
    const rawP = order.productionStatus || '';
    const validSpanishStatuses = [
      'Inventario Pendiente',
      'Medidas Pendientes',
      'Nombres Pendientes',
      'Logo Pendiente',
      'En Taller de Bordado',
      'Material Listo',
      'En Confección',
      'Producido',
      'En Entrega',
      'Entregado'
    ];
    if (validSpanishStatuses.includes(rawP)) {
      return rawP;
    }
    return determineNewOrderProductionStatus(order.items || [], order.status, order.logos || []);
  };

