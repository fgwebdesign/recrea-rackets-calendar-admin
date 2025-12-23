'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LowStockAlert } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';

interface StockAlertsCardProps {
  stockAlerts: {
    summary: {
      total_alerts: number;
      out_of_stock_count: number;
      low_stock_count: number;
      value_at_risk: number;
    };
    out_of_stock: LowStockAlert[];
    low_stock: LowStockAlert[];
  };
}

export const StockAlertsCard = memo(function StockAlertsCard({ stockAlerts }: StockAlertsCardProps) {
  const t = useTranslations('kiosk');

  if (stockAlerts.summary.total_alerts === 0) return null;

  return (
    <Card className="border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 dark:from-orange-900/30 dark:via-red-900/20 dark:to-amber-900/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {t('reports.stockAlerts.title')} ({stockAlerts.summary.total_alerts})
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 font-medium">
              {stockAlerts.summary.out_of_stock_count} {t('reports.stockAlerts.outOfStock')} • {stockAlerts.summary.low_stock_count} {t('reports.stockAlerts.lowStock')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sin Stock */}
          {stockAlerts.out_of_stock.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                {t('reports.stockAlerts.outOfStockTitle')} ({stockAlerts.out_of_stock.length})
              </h4>
              <div className="space-y-2">
                {stockAlerts.out_of_stock.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-red-100 dark:bg-red-900/30 rounded-xl border-2 border-red-300 dark:border-red-700 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {product.category}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive" className="font-bold">Sin stock</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Bajo */}
          {stockAlerts.low_stock.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                {t('reports.stockAlerts.lowStockTitle')} ({stockAlerts.low_stock.length})
              </h4>
              <div className="space-y-2">
                {stockAlerts.low_stock.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl border-2 border-orange-300 dark:border-orange-700 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {product.category}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {product.stock_quantity} {t('reports.stockAlerts.units')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t('reports.stockAlerts.minimum')}: {product.min_stock_alert}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

