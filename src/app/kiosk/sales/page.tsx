'use client';

import { useState, useEffect } from "react";
import { Receipt, Search, Package, Calendar, MapPin, CreditCard, CheckCircle2, Clock, XCircle, User, FileText } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSales } from "@/hooks/useSales";
import { useKioskVenue } from "@/contexts/KioskVenueContext";
import { Sale, SaleFilters } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Printer } from "lucide-react";

export default function SalesPage() {
  const t = useTranslations('kiosk');
  const { selectedVenueId, selectedVenue, setSelectedVenueId, venues, loading: loadingVenues } = useKioskVenue();
  const SALES_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SaleFilters>({
    limit: SALES_PER_PAGE,
    offset: 0,
    venue_id: selectedVenueId
  });
  
  // Actualizar filtros cuando cambia el venue seleccionado
  useEffect(() => {
    setFilters(prev => ({ ...prev, venue_id: selectedVenueId }));
  }, [selectedVenueId]);
  
  const { sales, isLoading, fetchSales, getSaleById, pagination } = useSales(filters);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Actualizar offset cuando cambia la página
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      offset: (currentPage - 1) * SALES_PER_PAGE
    }));
  }, [currentPage]);

  // Resetear a página 1 cuando cambian otros filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.venue_id, filters.payment_method, filters.payment_status]);

  useEffect(() => {
    // Solo hacer fetch si los filters realmente cambiaron
    fetchSales(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  // Calcular total de páginas
  const totalPages = pagination ? Math.ceil(pagination.total / SALES_PER_PAGE) : 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewSale = async (saleId: string) => {
    const sale = await getSaleById(saleId);
    if (sale) {
      setSelectedSale(sale);
      setShowSaleModal(true);
    }
  };

  const handlePrintTicket = () => {
    if (!selectedSale) return;
    
    // Crear un contenedor temporal para el ticket
    const printContainer = document.createElement('div');
    printContainer.className = 'ticket-print-container';
    document.body.appendChild(printContainer);

    // Renderizar el ticket usando React (necesitamos usar un portal o renderizado directo)
    // Por ahora, usaremos una solución más simple con window.print()
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('No se pudo abrir la ventana de impresión');
      return;
    }

    // Obtener el HTML del ticket optimizado para A5
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Venta #${selectedSale.sale_number}</title>
          <style>
            @page {
              size: A5;
              margin: 8mm 10mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              line-height: 1.3;
              color: #000;
              width: 100%;
            }
            .ticket-separator {
              text-align: center;
              margin: 2mm 0;
              font-size: 8pt;
            }
            .ticket-title {
              font-weight: bold;
              font-size: 12pt;
              margin: 2mm 0;
              text-align: center;
              text-transform: uppercase;
            }
            .ticket-line {
              margin: 1.5mm 0;
              font-size: 9pt;
            }
            .ticket-section-title {
              font-weight: bold;
              margin-bottom: 1.5mm;
              margin-top: 2mm;
              font-size: 9pt;
            }
            .ticket-item {
              margin: 2.5mm 0;
              page-break-inside: avoid;
            }
            .ticket-item-name {
              font-weight: bold;
              margin-bottom: 0.5mm;
              font-size: 9pt;
            }
            .ticket-item-details {
              display: flex;
              justify-content: space-between;
              margin: 0.5mm 0;
              font-size: 8.5pt;
            }
            .ticket-item-sku, .ticket-item-size {
              font-size: 7.5pt;
              color: #666;
              margin-top: 0.5mm;
            }
            .ticket-total-line {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 10pt;
              margin: 2mm 0;
            }
            .ticket-total-amount {
              font-size: 12pt;
            }
            .ticket-thanks {
              text-align: center;
              font-size: 9pt;
              font-weight: bold;
              margin-top: 3mm;
              margin-bottom: 2mm;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-separator">═══════════════════════════════════</div>
          <div class="ticket-title">CORDON PADEL CLUB</div>
          <div class="ticket-separator">═══════════════════════════════════</div>
          
          <div class="ticket-line"><strong>Venta #${selectedSale.sale_number}</strong></div>
          <div class="ticket-line">Fecha: ${format(new Date(selectedSale.sale_date), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
          ${selectedSale.venue?.name ? `<div class="ticket-line">Sede: ${selectedSale.venue.name}</div>` : ''}
          <div class="ticket-line">Método: ${getPaymentMethodLabel(selectedSale.payment_method)}</div>
          <div class="ticket-line">Estado: ${getPaymentStatusLabel(selectedSale.payment_status)}</div>
          ${selectedSale.customer_name ? `<div class="ticket-line">Cliente: ${selectedSale.customer_name}</div>` : ''}
          
          <div class="ticket-separator">───────────────────────────────────</div>
          
          <div class="ticket-section-title">ITEMS:</div>
          <div class="ticket-separator">───────────────────────────────────</div>
          
          ${selectedSale.items && selectedSale.items.length > 0 ? selectedSale.items.map(item => `
            <div class="ticket-item">
              <div class="ticket-item-name">${item.product_name}</div>
              <div class="ticket-item-details">
                <span>${item.quantity} x $${item.unit_price.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style="font-weight: bold;">$${item.total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              ${item.product_sku ? `<div class="ticket-item-sku">SKU: ${item.product_sku}</div>` : ''}
              ${item.size ? `<div class="ticket-item-size">Talle: ${item.size}</div>` : ''}
            </div>
          `).join('') : '<div class="ticket-line">No hay items</div>'}
          
          <div class="ticket-separator">───────────────────────────────────</div>
          
          <div class="ticket-total-line">
            <span>TOTAL:</span>
            <span class="ticket-total-amount">$${selectedSale.total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="ticket-separator">───────────────────────────────────</div>
          
          <div class="ticket-thanks">¡Gracias por su compra!</div>
          
          <div class="ticket-separator">═══════════════════════════════════</div>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    
    // Esperar a que se cargue el contenido y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Cerrar la ventana después de imprimir (opcional)
        // printWindow.close();
      }, 250);
    };

    // Limpiar el contenedor temporal
    document.body.removeChild(printContainer);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t('sales.paymentMethods.cash'),
      transfer: t('sales.paymentMethods.transfer'),
      card: t('sales.paymentMethods.card'),
      mercadopago: t('sales.paymentMethods.mercadopago'),
      pending: t('sales.paymentMethods.pending')
    };
    return labels[method] || method;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('sales.paymentStatus.pending'),
      completed: t('sales.paymentStatus.completed'),
      refunded: t('sales.paymentStatus.refunded'),
      cancelled: t('sales.paymentStatus.cancelled')
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('sales.title')}
        description={t('sales.description')}
        icon={<Receipt className="w-6 h-6" />}
      />

      {/* Selector de Venue */}
      {!loadingVenues && venues.length > 1 && (
        <div className="mt-6 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                {t('sales.venue')}
              </Label>
              <Select 
                value={selectedVenueId || 'all'} 
                onValueChange={(value) => {
                  const venueId = value === 'all' ? undefined : value;
                  setSelectedVenueId(venueId);
                  setFilters(prev => ({ ...prev, venue_id: venueId }));
                }}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 w-64">
                  <SelectValue placeholder={t('sales.allVenues')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('sales.allVenues')}</SelectItem>
                  {venues.filter(v => v.is_active).map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVenue && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('sales.selectedVenue')}: <span className="font-semibold">{selectedVenue.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mt-6 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('sales.searchPlaceholder')}
                className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>
          </div>

          <Select
            value={filters.payment_method || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, payment_method: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger className="w-[200px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder={t('sales.allPaymentMethods')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sales.allPaymentMethods')}</SelectItem>
              <SelectItem value="cash">{t('sales.paymentMethods.cash')}</SelectItem>
              <SelectItem value="transfer">{t('sales.paymentMethods.transfer')}</SelectItem>
              <SelectItem value="card">{t('sales.paymentMethods.card')}</SelectItem>
              <SelectItem value="mercadopago">{t('sales.paymentMethods.mercadopago')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.payment_status || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, payment_status: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger className="w-[200px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder={t('sales.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sales.allStatus')}</SelectItem>
              <SelectItem value="completed">{t('sales.paymentStatus.completed')}</SelectItem>
              <SelectItem value="pending">{t('sales.paymentStatus.pending')}</SelectItem>
              <SelectItem value="cancelled">{t('sales.paymentStatus.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Ventas */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('sales.noSales')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('sales.noSalesDescription')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.saleNumber')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.product')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.date')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.venue')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.paymentMethod')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.total')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('sales.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sales.map((sale, index) => {
                  const items = sale.items || [];
                  const hasMultipleItems = items.length > 1;
                  // Prioridad para las primeras 10 imágenes visibles (primeras filas de la tabla)
                  const hasPriority = index < 10;
                  
                  return (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      #{sale.sale_number}
                    </td>
                    <td className="px-4 py-4">
                      {items.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {/* Contenedor de imágenes con scroll horizontal si hay múltiples */}
                          <div className={`flex items-center gap-1 ${hasMultipleItems ? 'max-w-[140px] overflow-x-auto scrollbar-hide' : ''}`}>
                            {items.slice(0, hasMultipleItems ? 3 : 1).map((item, itemIndex) => {
                              const productImage = item.product?.image_url;
                              return productImage ? (
                                <div 
                                  key={item.id || itemIndex}
                                  className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:border-green-400 dark:hover:border-green-600 transition-colors"
                                  title={item.product_name}
                                >
                                  <Image
                                    src={productImage}
                                    alt={item.product_name || t('sales.product')}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                    priority={hasPriority && itemIndex === 0}
                                    loading={hasPriority && itemIndex === 0 ? undefined : "lazy"}
                                    quality={75}
                                  />
                                </div>
                              ) : (
                                <div 
                                  key={item.id || itemIndex}
                                  className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700"
                                  title={item.product_name}
                                >
                                  <Package className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                </div>
                              );
                            })}
                          </div>
                          {/* Indicador de más productos si hay más de 3 */}
                          {items.length > 3 && (
                            <div 
                              className="flex-shrink-0 w-12 h-12 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                              title={`${items.length - 3} productos más`}
                            >
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                +{items.length - 3}
                              </span>
                            </div>
                          )}
                          {/* Badge indicador de múltiples productos (solo si hay 2-3 productos) */}
                          {hasMultipleItems && items.length <= 3 && (
                            <span 
                              className="flex-shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600"
                              title={`${items.length} productos`}
                            >
                              {items.length}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {sale.customer_name || sale.customer 
                        ? `${sale.customer?.first_name || ''} ${sale.customer?.last_name || ''}`.trim() || sale.customer_name
                        : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {sale.venue?.name || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {getPaymentMethodLabel(sale.payment_method)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.payment_status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : sale.payment_status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : sale.payment_status === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {getPaymentStatusLabel(sale.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                      ${sale.total.toLocaleString('es-UY')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSale(sale.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                      >
                        {t('sales.view')}
                      </Button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('sales.showing')} {((currentPage - 1) * SALES_PER_PAGE) + 1} {t('sales.to')} {Math.min(currentPage * SALES_PER_PAGE, pagination?.total || 0)} {t('sales.of')} {pagination?.total || 0} {t('sales.sales')}
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === totalPages && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle de Venta */}
      <Dialog open={showSaleModal} onOpenChange={(open) => {
        if (!open) {
          setShowSaleModal(false);
          setSelectedSale(null);
        }
      }}>
        <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl max-h-[85vh] overflow-y-auto p-0 [&>button]:right-3 [&>button]:top-3">
          {/* Header mejorado con gradiente */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 px-5 py-3 rounded-t-lg relative pr-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold m-0">
                    {t('sales.saleDetails')} #{selectedSale?.sale_number}
                  </DialogTitle>
                  <p className="text-green-100 text-xs mt-0.5">
                    {selectedSale && format(new Date(selectedSale.sale_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
              {selectedSale && (
                <Button
                  onClick={handlePrintTicket}
                  size="sm"
                  className="bg-white text-green-700 hover:bg-green-50 dark:bg-white dark:text-green-700 dark:hover:bg-green-50 font-semibold shadow-md text-xs px-3"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  {t('sales.printTicket')}
                </Button>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {selectedSale && (
              <>
                {/* Información de la venta en cards mejoradas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('sales.date')}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {format(new Date(selectedSale.sale_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('sales.venue')}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {selectedSale.venue?.name || '-'}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('sales.paymentMethod')}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {getPaymentMethodLabel(selectedSale.payment_method)}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-1.5">
                      {selectedSale.payment_status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      ) : selectedSale.payment_status === 'pending' ? (
                        <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      )}
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('sales.status')}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedSale.payment_status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : selectedSale.payment_status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : selectedSale.payment_status === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {getPaymentStatusLabel(selectedSale.payment_status)}
                    </span>
                  </div>
                </div>

                {/* Cliente si existe */}
                {(selectedSale.customer_name || selectedSale.customer) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('sales.customer')}</p>
                    </div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      {selectedSale.customer 
                        ? `${selectedSale.customer.first_name || ''} ${selectedSale.customer.last_name || ''}`.trim()
                        : selectedSale.customer_name}
                    </p>
                  </div>
                )}

                {/* Items mejorados */}
                {selectedSale.items && selectedSale.items.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('sales.items')}</h3>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {selectedSale.items.length} {selectedSale.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {selectedSale.items.map((item) => {
                        const productImage = item.product?.image_url;
                        return (
                          <div 
                            key={item.id} 
                            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors shadow-sm"
                          >
                            {/* Imagen del producto mejorada */}
                            <div className="flex-shrink-0">
                              {productImage ? (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                  <Image
                                    src={productImage}
                                    alt={item.product_name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                    loading="lazy"
                                    quality={75}
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
                                  <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                              )}
                            </div>
                            
                            {/* Información del producto mejorada */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.product_name}</p>
                                <span className="flex-shrink-0 text-base font-bold text-gray-900 dark:text-gray-100">
                                  ${item.total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                  {item.quantity} x ${item.unit_price.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {item.size && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-semibold">
                                    {t('sales.size')}: {item.size}
                                  </span>
                                )}
                                {item.product_sku && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-mono">
                                    {t('sales.sku')}: {item.product_sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notas si existen */}
                {selectedSale.notes && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Notas</p>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-100">{selectedSale.notes}</p>
                  </div>
                )}

                {/* Total mejorado */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">{t('sales.total')}:</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${selectedSale.total.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedSale.subtotal !== selectedSale.total && (
                    <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Subtotal:</span>
                        <span>${selectedSale.subtotal.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {selectedSale.discount_amount > 0 && (
                        <div className="flex justify-between text-xs text-red-600 dark:text-red-400">
                          <span>Descuento:</span>
                          <span>-${selectedSale.discount_amount.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

