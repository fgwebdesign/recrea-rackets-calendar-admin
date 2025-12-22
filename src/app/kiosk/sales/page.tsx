'use client';

import { useState, useEffect } from "react";
import { Receipt, Calendar, Filter, Search } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSales } from "@/hooks/useSales";
import { useVenues } from "@/hooks/useVenues";
import { Sale, SaleFilters } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesPage() {
  const t = useTranslations('kiosk');
  const [filters, setFilters] = useState<SaleFilters>({
    limit: 50,
    offset: 0
  });
  
  const { sales, isLoading, pagination, fetchSales, getSaleById } = useSales(filters);
  const { venues } = useVenues({ includeCourts: false });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);

  useEffect(() => {
    fetchSales(filters);
  }, [filters]);

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
      mixed: t('sales.paymentMethods.mixed'),
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
              <SelectItem value="mixed">{t('sales.paymentMethods.mixed')}</SelectItem>
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
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      #{sale.sale_number}
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
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {t('sales.view')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${showSaleModal ? '' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('sales.saleDetails')} #{selectedSale.sale_number}
                </h2>
                <button
                  onClick={() => {
                    setShowSaleModal(false);
                    setSelectedSale(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

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
                    <div className="space-y-2">
                      {selectedSale.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.product_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.quantity} x ${item.unit_price.toLocaleString('es-UY')}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ${item.total.toLocaleString('es-UY')}
                          </p>
                        </div>
                      ))}
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
          </div>
        </div>
      )}
    </div>
  );
}

