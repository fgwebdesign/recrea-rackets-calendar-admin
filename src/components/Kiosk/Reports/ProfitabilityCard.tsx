'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { ProfitabilityReport } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';
import { CategoryIcon } from '@/lib/categoryIcons';

interface ProfitabilityCardProps {
  profitability: ProfitabilityReport;
  formatCurrency: (value: number) => string;
}

export const ProfitabilityCard = memo(function ProfitabilityCard({ profitability, formatCurrency }: ProfitabilityCardProps) {
  const t = useTranslations('kiosk');

  return (
    <div className="space-y-6">
      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Totales */}
        <Card className="border border-border bg-blue-50 dark:bg-blue-500/10 dark:border-l-[3px] dark:border-l-blue-500/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 dark:text-foreground flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              {t('reports.profitability.totalRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(profitability.summary.total_revenue)}
            </p>
          </CardContent>
        </Card>

        {/* Costos Totales */}
        <Card className="border border-border bg-red-50 dark:bg-red-500/10 dark:border-l-[3px] dark:border-l-red-500/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 dark:text-foreground flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-500/15 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              {t('reports.profitability.totalCost')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(profitability.summary.total_cost)}
            </p>
          </CardContent>
        </Card>

        {/* Ganancia Total */}
        <Card className={`border border-border shadow-sm ${
          profitability.summary.total_profit >= 0
            ? 'bg-emerald-50 dark:bg-emerald-500/10 dark:border-l-[3px] dark:border-l-emerald-500/70'
            : 'bg-red-50 dark:bg-red-500/10 dark:border-l-[3px] dark:border-l-red-500/70'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${
              profitability.summary.total_profit >= 0
                ? 'text-emerald-700 dark:text-foreground'
                : 'text-red-700 dark:text-foreground'
            }`}>
              <div className={`p-2 rounded-lg ${
                profitability.summary.total_profit >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-500/15'
                  : 'bg-red-100 dark:bg-red-500/15'
              }`}>
                {profitability.summary.total_profit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              {t('reports.profitability.totalProfit')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              profitability.summary.total_profit >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              {formatCurrency(profitability.summary.total_profit)}
            </p>
          </CardContent>
        </Card>

        {/* Margen de Ganancia */}
        <Card className={`border border-border shadow-sm ${
          profitability.summary.profit_margin_percent >= 30
            ? 'bg-emerald-50 dark:bg-emerald-500/10 dark:border-l-[3px] dark:border-l-emerald-500/70'
            : profitability.summary.profit_margin_percent >= 15
            ? 'bg-amber-50 dark:bg-amber-500/10 dark:border-l-[3px] dark:border-l-amber-500/70'
            : 'bg-orange-50 dark:bg-orange-500/10 dark:border-l-[3px] dark:border-l-orange-500/70'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${
              profitability.summary.profit_margin_percent >= 30
                ? 'text-emerald-700 dark:text-foreground'
                : profitability.summary.profit_margin_percent >= 15
                ? 'text-amber-700 dark:text-foreground'
                : 'text-orange-700 dark:text-foreground'
            }`}>
              <div className={`p-2 rounded-lg ${
                profitability.summary.profit_margin_percent >= 30
                  ? 'bg-emerald-100 dark:bg-emerald-500/15'
                  : profitability.summary.profit_margin_percent >= 15
                  ? 'bg-amber-100 dark:bg-amber-500/15'
                  : 'bg-orange-100 dark:bg-orange-500/15'
              }`}>
                <Percent className={`w-5 h-5 ${
                  profitability.summary.profit_margin_percent >= 30
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : profitability.summary.profit_margin_percent >= 15
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              {t('reports.profitability.profitMargin')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              profitability.summary.profit_margin_percent >= 30
                ? 'text-emerald-700 dark:text-emerald-300'
                : profitability.summary.profit_margin_percent >= 15
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {profitability.summary.profit_margin_percent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos por Ganancia */}
      {profitability.by_product.length > 0 && (
        <Card className="border-2 border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('reports.profitability.topProductsByProfit')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('reports.profitability.topProductsByProfitDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profitability.by_product.slice(0, 10).map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                      'bg-gradient-to-br from-green-500 to-emerald-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.quantity_sold} {t('reports.profitability.unitsSold')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.profitability.income')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(product.cost)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.profitability.costs')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(product.profit)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {product.profit_margin_percent.toFixed(1)}% {t('reports.profitability.margin')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rentabilidad por Categoría */}
      {profitability.by_category.length > 0 && (
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('reports.profitability.profitabilityByCategory')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('reports.profitability.profitabilityByCategoryDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profitability.by_category.map((category) => (
                <div
                  key={category.category_id || 'uncategorized'}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <CategoryIcon
                      iconName={category.icon}
                      categoryName={category.category_name}
                      className="w-6 h-6"
                      color={category.color}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {category.category_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.quantity_sold} {t('reports.profitability.unitsSold')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {formatCurrency(category.revenue)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.profitability.income')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(category.cost)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.profitability.costs')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(category.profit)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {category.profit_margin_percent.toFixed(1)}% {t('reports.profitability.margin')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
