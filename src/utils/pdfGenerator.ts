import { Order, OrderItem } from '../types';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export const downloadOrderImage = async (orderId: string, customer: string, format: 'png' | 'pdf' = 'png', whatsappText?: string) => {
    try {
      const isThermalReceipt = orderId.startsWith('invoice') || orderId.startsWith('cancellation');
      const element = document.getElementById(isThermalReceipt ? orderId : `order-card-${orderId}`);
      if (!element) {
        alert('Error: Componente visual no encontrado. Intente recargar.');
        return;
      }

      // Explicitly scroll to top for better capture in some browsers
      window.scrollTo(0, 0);

      const canvas = await htmlToImage.toCanvas(element, {
        pixelRatio: 3,
        backgroundColor: isThermalReceipt ? '#ffffff' : '#1c1917',
        filter: (node: HTMLElement) => {
          if (node.nodeType !== 1) return true; // Only filter elements
          if (node.tagName === 'BUTTON') return false;
          if (node.classList && node.classList.contains('order-actions-container')) return false;
          return true;
        }
      });

      const prefix = orderId.startsWith('cancellation') ? 'Azafran_Comprobante_Anulacion' : (orderId.startsWith('invoice') ? 'Azafran_Invoice' : 'Azafran_Cotizacion');
      const fileName = `${prefix}_${customer}`;
      const safeFileName = fileName.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-');

      if (format === 'png') {
        const url = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${safeFileName}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'pt', // Use points for better precision with high scales
          format: [canvas.width / 3, canvas.height / 3] // Adjust format to original visible size (scale 3 -> /3)
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 3, canvas.height / 3);
        pdf.save(`${safeFileName}.pdf`);
      }
      
      if (whatsappText) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
        if (isMobile) {
          setTimeout(() => {
            window.location.href = `whatsapp://send?text=${encodeURIComponent(whatsappText)}`;
          }, 500);
        }
      }
    } catch (err) {
      console.error('Error generating document:', err);
      alert('Error técnico al generar el documento. Por favor verifique su conexión o intente una captura de pantalla.');
    }
  };

export const getWhatsAppText = (order: Order, isOrder: boolean = false) => {
  const title = isOrder ? '*AZAFRÁN - ORDEN DE CONFECCIÓN*' : '*AZAFRÁN - COTIZACIÓN FORMAL*';
  const total = Number(order.totalPrice || 0);
  const collected = Number(order.amountCollected || 0);
  const diff = total - collected;
  const balanceText = diff < -0.01 
    ? `*Saldo a Favor:* Bs${Math.abs(diff).toFixed(2)}`
    : `*Saldo Pendiente:* Bs${Math.max(0, diff).toFixed(2)}`;
  
  let text = `${title}\n*N° Pedido:* #${order.id}\n*Cliente:* ${order.customer}\n*Fecha:* ${new Date(order.createdAt || Date.now()).toLocaleDateString()}\n\n*RESUMEN:*\n`;
  (order.items || []).forEach((it: OrderItem) => {
    text += `• ${it.qty}x ${it.name} (${it.fabric || 'Sin tela'})\n`;
  });
  text += `\n*Total:* Bs${total.toFixed(2)}\n*Cobrado:* Bs${collected.toFixed(2)}\n${balanceText}\n\nSanta Cruz · Bolivia`;
  return text;
};

export const getCancellationWhatsAppText = (cancelledOrder: Order) => {
    return `*AZAFRÁN CHEFWEAR - COMPROBANTE DE ANULACIÓN*
*N° Comprobante:* ${cancelledOrder.cancellationId || 'ANU-00001'}
*Ref. Orden:* #${cancelledOrder.id?.slice(-6) || cancelledOrder.id}
*Cliente:* ${cancelledOrder.companyName || cancelledOrder.customer}
*Fecha de Anulación:* ${cancelledOrder.canceledAt ? new Date(cancelledOrder.canceledAt).toLocaleString('es-BO') : new Date().toLocaleString('es-BO')}
*Anulado Por:* ${cancelledOrder.canceledBy || 'Vendedor'}

*DESGLOSE FINANCIERO:*
- Depósito Recaudado: Bs${Number(cancelledOrder.amountCollected || 0).toFixed(2)}
- Resolución: ${cancelledOrder.cancellationType || 'Anulado'}
- Monto Devuelto: Bs${Number(cancelledOrder.refundAmount || 0).toFixed(2)}
- Monto Retenido: Bs${Number(cancelledOrder.retainedAmount || 0).toFixed(2)}

*MOTIVO / JUSTIFICACIÓN DE ANULACIÓN:*
"${cancelledOrder.cancellationReason || 'Sin motivo registrado'}"

Santa Cruz · Bolivia`;
  };
