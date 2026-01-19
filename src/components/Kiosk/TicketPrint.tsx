'use client';

import { Sale } from '@/types/kiosk';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/ticket-print.css';

interface TicketPrintProps {
  sale: Sale;
  clubName?: string;
}

export default function TicketPrint({ sale, clubName = 'CORDON PADEL CLUB' }: TicketPrintProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
      mercadopago: 'Mercadopago',
      pending: 'Pendiente'
    };
    return labels[method] || method;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      completed: 'Completado',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  return (
    <div className="ticket-print-container">
      <div className="ticket-content">
        {/* Encabezado */}
        <div className="ticket-header">
          <div className="ticket-separator">═══════════════════════════════════</div>
          <div className="ticket-title">{clubName}</div>
          <div className="ticket-separator">═══════════════════════════════════</div>
        </div>

        {/* Información de la venta */}
        <div className="ticket-info">
          <div className="ticket-line">
            <strong>Venta #{sale.sale_number}</strong>
          </div>
          <div className="ticket-line">Fecha: {formatDate(sale.sale_date)}</div>
          {sale.venue?.name && (
            <div className="ticket-line">Sede: {sale.venue.name}</div>
          )}
          <div className="ticket-line">Método: {getPaymentMethodLabel(sale.payment_method)}</div>
          <div className="ticket-line">Estado: {getPaymentStatusLabel(sale.payment_status)}</div>
          {sale.customer_name && (
            <div className="ticket-line">Cliente: {sale.customer_name}</div>
          )}
        </div>

        <div className="ticket-separator">───────────────────────────────────</div>

        {/* Items */}
        <div className="ticket-items">
          <div className="ticket-section-title">ITEMS:</div>
          <div className="ticket-separator">───────────────────────────────────</div>
          
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item) => (
              <div key={item.id} className="ticket-item">
                <div className="ticket-item-name">{item.product_name}</div>
                <div className="ticket-item-details">
                  <span className="ticket-item-quantity">
                    {item.quantity} x ${item.unit_price.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="ticket-item-total">
                    ${item.total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {item.product_sku && (
                  <div className="ticket-item-sku">SKU: {item.product_sku}</div>
                )}
                {item.size && (
                  <div className="ticket-item-size">Talle: {item.size}</div>
                )}
              </div>
            ))
          ) : (
            <div className="ticket-line">No hay items</div>
          )}
        </div>

        <div className="ticket-separator">───────────────────────────────────</div>

        {/* Totales */}
        <div className="ticket-totals">
          <div className="ticket-total-line">
            <span>TOTAL:</span>
            <span className="ticket-total-amount">
              ${sale.total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="ticket-separator">───────────────────────────────────</div>

        {/* Pie de página */}
        <div className="ticket-footer">
          <div className="ticket-thanks">¡Gracias por su compra!</div>
        </div>

        <div className="ticket-separator">═══════════════════════════════════</div>
      </div>
    </div>
  );
}
