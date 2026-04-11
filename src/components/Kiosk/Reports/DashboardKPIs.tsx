'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardStats } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';
import { WeeklySalesChart } from './WeeklySalesChart';

interface DashboardKPIsProps {
  dashboard: DashboardStats;
  formatCurrency: (value: number) => string;
}

export const DashboardKPIs = memo(function DashboardKPIs({ dashboard, formatCurrency }: DashboardKPIsProps) {
  const t = useTranslations('kiosk');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
      {/* Ventas Hoy */}
      <Card className="border border-border bg-gradient-to-br from-emerald-50 to-green-50 dark:[background-image:none] dark:border-l-[3px] dark:border-l-emerald-500/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-foreground flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/15 rounded-lg">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t('reports.dashboard.salesToday')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
            {formatCurrency(dashboard.today.total_revenue)}
          </p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground/80">
              {dashboard.today.sales_count} {t('reports.dashboard.transactions')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('reports.dashboard.averageTicketLabel')}: {formatCurrency(dashboard.today.average_ticket)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Esta Semana */}
      <Card className="border border-border bg-gradient-to-br from-blue-50 to-cyan-50 dark:[background-image:none] dark:border-l-[3px] dark:border-l-blue-500/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-blue-700 dark:text-foreground flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            {t('reports.dashboard.thisWeek')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            {formatCurrency(dashboard.week.total_revenue)}
          </p>
          <div className="space-y-1 mb-3">
            <p className="text-sm font-medium text-foreground/80">
              {dashboard.week.sales_count} {t('reports.dashboard.transactions')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('reports.dashboard.averageTicketLabel')}: {formatCurrency(dashboard.week.average_ticket)}
            </p>
          </div>
          {dashboard.week.daily_breakdown && dashboard.week.daily_breakdown.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <WeeklySalesChart
                dailyBreakdown={dashboard.week.daily_breakdown}
                totalRevenue={dashboard.week.total_revenue}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Este Mes */}
      <Card className="border border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:[background-image:none] dark:border-l-[3px] dark:border-l-violet-500/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-purple-700 dark:text-foreground flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-violet-500/15 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-violet-400" />
            </div>
            {t('reports.dashboard.thisMonth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-700 dark:text-violet-400 mb-2">
            {formatCurrency(dashboard.month.total_revenue)}
          </p>
          <div className="flex items-center gap-2 mb-2">
            {dashboard.month.variation_percent >= 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/15 rounded-md">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  +{dashboard.month.variation_percent.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/15 rounded-md">
                <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-red-700 dark:text-red-400">
                  {dashboard.month.variation_percent.toFixed(1)}%
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t('reports.dashboard.vsPreviousMonth')}
            </p>
          </div>
          <p className="text-sm font-medium text-foreground/80">
            {dashboard.month.sales_count} {t('reports.dashboard.transactions')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

