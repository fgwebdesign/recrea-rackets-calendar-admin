'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, TrendingDown } from 'lucide-react';
import { ExpensesReport } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';
import { CategoryIcon } from '@/lib/categoryIcons';

interface ExpensesCardProps {
  expenses: ExpensesReport;
  formatCurrency: (value: number) => string;
}

export const ExpensesCard = memo(function ExpensesCard({ expenses, formatCurrency }: ExpensesCardProps) {
  const t = useTranslations('kiosk');

  return (
    <div className="space-y-6">
      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gastos Totales */}
        <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              {t('reports.expenses.totalExpenses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(expenses.summary.total_expenses)}
            </p>
          </CardContent>
        </Card>

        {/* Unidades Vendidas */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              {t('reports.expenses.totalUnitsSold')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {expenses.summary.total_units_sold}
            </p>
          </CardContent>
        </Card>

        {/* Costo Promedio por Unidad */}
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              {t('reports.expenses.averageCostPerUnit')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(expenses.summary.average_cost_per_unit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos por Gasto */}
      {expenses.by_product.length > 0 && (
        <Card className="border-2 border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('reports.expenses.topProductsByCost')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('reports.expenses.topProductsByCostDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.by_product.slice(0, 10).map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-br from-red-600 to-red-700' :
                      'bg-gradient-to-br from-orange-500 to-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.quantity_sold} {t('reports.expenses.unitsSold')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {formatCurrency(product.total_cost)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.expenses.totalCost')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(product.average_cost_per_unit)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.expenses.costPerUnit')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gastos por Categoría */}
      {expenses.by_category.length > 0 && (
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('reports.expenses.byCategory')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('reports.expenses.byCategoryDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.by_category.map((category) => (
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
                        {category.quantity_sold} {t('reports.expenses.unitsSold')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {formatCurrency(category.total_cost)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.expenses.totalCost')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(category.average_cost_per_unit)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.expenses.costPerUnit')}</p>
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
