'use client';

import { useState } from "react";
import { BarChart3, TrendingUp, Package, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKioskReports } from "@/hooks/useKioskReports";
import { useVenues } from "@/hooks/useVenues";
import { SalesSummary, TopProduct } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { format } from 'date-fns';

export default function KioskReportsPage() {
  const t = useTranslations('kiosk');
  const { getSalesSummary, getTopProducts, isLoading } = useKioskReports();
  const { venues } = useVenues({ includeCourts: false });
  
  const [filters, setFilters] = useState({
    venue_id: '',
    start_date: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'), // Primer día del mes
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const loadReports = async () => {
    const summaryData = await getSalesSummary(filters);
    const topProductsData = await getTopProducts(filters);
    setSummary(summaryData);
    setTopProducts(topProductsData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('reports.title')}
        description={t('reports.description')}
        icon={<BarChart3 className="w-6 h-6" />}
      />

      {/* Filtros */}
      <div className="mt-6 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t('reports.venue')}</Label>
            <Select value={filters.venue_id || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, venue_id: value === 'all' ? '' : value }))}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectValue placeholder={t('reports.allVenues')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('reports.allVenues')}</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t('reports.startDate')}</Label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            />
          </div>

          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t('reports.endDate')}</Label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={loadReports}
              disabled={isLoading}
              className="w-full bg-green-600 text-white hover:bg-green-700 font-bold"
            >
              {isLoading ? t('common.loading') : t('reports.generate')}
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen de Ventas */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                {t('reports.totalRevenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${summary.total_revenue.toLocaleString('es-UY')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {summary.total_sales} {t('reports.sales')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {t('reports.averageTicket')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${summary.average_ticket.toLocaleString('es-UY', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('reports.perSale')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {t('reports.totalSales')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {summary.total_sales}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('reports.completedSales')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Productos Más Vendidos */}
      {topProducts.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              {t('reports.topProducts')}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('reports.topProductsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.total_quantity} {t('reports.unitsSold')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${product.total_revenue.toLocaleString('es-UY')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('reports.revenue')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!summary && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('reports.noData')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('reports.noDataDescription')}
          </p>
          <Button
            onClick={loadReports}
            className="bg-green-600 text-white hover:bg-green-700 font-bold"
          >
            {t('reports.generate')}
          </Button>
        </div>
      )}
    </div>
  );
}

