'use client';

import { useState, useEffect } from "react";
import { Receipt, Search, Package } from "lucide-react";
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
import { useVenues } from "@/hooks/useVenues";
import { Sale, SaleFilters } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function SalesPage() {
  const t = useTranslations('kiosk');
  const SALES_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SaleFilters>({
    limit: SALES_PER_PAGE,
    offset: 0
  });
  
  const { sales, isLoading, fetchSales, getSaleById, pagination } = useSales(filters);
  const { venues } = useVenues({ includeCourts: false });
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
            value={filters.venue_id || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, venue_id: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger className="w-[200px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder={t('sales.allVenues')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sales.allVenues')}</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        <DialogContent className="bg-white dark:bg-gray-800 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t('sales.saleDetails')} #{selectedSale?.sale_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sales.date')}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {format(new Date(selectedSale.sale_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sales.venue')}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedSale.venue?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sales.paymentMethod')}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {getPaymentMethodLabel(selectedSale.payment_method)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sales.status')}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {getPaymentStatusLabel(selectedSale.payment_status)}
                    </p>
                  </div>
                </div>

                {selectedSale.items && selectedSale.items.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('sales.items')}</h3>
                    <div className="space-y-3">
                      {selectedSale.items.map((item) => {
                        const productImage = item.product?.image_url;
                        return (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          {/* Imagen del producto */}
                          <div className="flex-shrink-0">
                            {productImage ? (
                              <div className="relative w-16 h-16 rounded-md overflow-hidden">
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
                              <div className="w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                          
                          {/* Información del producto */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.product_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.quantity} x ${item.unit_price.toLocaleString('es-UY')}
                              </p>
                              {item.size && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                                  {t('sales.size')}: {item.size}
                                </span>
                              )}
                            </div>
                            {item.product_sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {t('sales.sku')}: {item.product_sku}
                              </p>
                            )}
                          </div>
                          
                          {/* Total del item */}
                          <div className="flex-shrink-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-right">
                              ${item.total.toLocaleString('es-UY')}
                            </p>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">{t('sales.total')}:</span>
                    <span className="text-green-600 dark:text-green-400">
                      ${selectedSale.total.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

