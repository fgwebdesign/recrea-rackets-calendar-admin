'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { TopProduct } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';

interface TopProductsCardProps {
  topProducts: TopProduct[];
}

export const TopProductsCard = memo(function TopProductsCard({ topProducts }: TopProductsCardProps) {
  const t = useTranslations('kiosk');

  if (topProducts.length === 0) return null;

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('reports.topProducts')}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('reports.topProductsDescription')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div
              key={product.product_id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                  'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {product.product_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {product.total_quantity} {t('reports.unitsSold')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
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
  );
});

