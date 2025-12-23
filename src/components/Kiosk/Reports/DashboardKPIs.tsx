'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, ShoppingCart, TrendingDown } from 'lucide-react';
import { DashboardStats } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';

interface DashboardKPIsProps {
  dashboard: DashboardStats;
  formatCurrency: (value: number) => string;
}

export const DashboardKPIs = memo(function DashboardKPIs({ dashboard, formatCurrency }: DashboardKPIsProps) {
  const t = useTranslations('kiosk');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Ventas Hoy */}
      <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              {t('reports.dashboard.salesToday')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
            {formatCurrency(dashboard.today.total_revenue)}
          </p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dashboard.today.sales_count} {t('reports.dashboard.transactions')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('reports.dashboard.averageTicketLabel')}: {formatCurrency(dashboard.today.average_ticket)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Esta Semana */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              {t('reports.dashboard.thisWeek')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
            {formatCurrency(dashboard.week.total_revenue)}
          </p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dashboard.week.sales_count} {t('reports.dashboard.transactions')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('reports.dashboard.averageTicketLabel')}: {formatCurrency(dashboard.week.average_ticket)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Este Mes */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              {t('reports.dashboard.thisMonth')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            {formatCurrency(dashboard.month.total_revenue)}
          </p>
          <div className="flex items-center gap-2 mb-2">
            {dashboard.month.variation_percent >= 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 rounded-md">
                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-300">
                  +{dashboard.month.variation_percent.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/50 rounded-md">
                <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-red-700 dark:text-red-300">
                  {dashboard.month.variation_percent.toFixed(1)}%
                </span>
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('reports.dashboard.vsPreviousMonth')}
            </p>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {dashboard.month.sales_count} {t('reports.dashboard.transactions')}
          </p>
        </CardContent>
      </Card>

      {/* Ticket Promedio */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              {t('reports.dashboard.averageTicket')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-2">
            {formatCurrency(dashboard.month.average_ticket)}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('reports.dashboard.monthlyAverage')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

