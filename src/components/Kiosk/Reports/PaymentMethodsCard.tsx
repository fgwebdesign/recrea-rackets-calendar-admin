'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { DashboardStats } from '@/types/kiosk';
import { useTranslations } from '@/contexts/TranslationContext';

interface PaymentMethodsCardProps {
  paymentMethods: Record<string, { count: number; total: number }>;
  formatCurrency: (value: number) => string;
  getPaymentMethodLabel: (method: string) => string;
}

export const PaymentMethodsCard = memo(function PaymentMethodsCard({ 
  paymentMethods, 
  formatCurrency, 
  getPaymentMethodLabel 
}: PaymentMethodsCardProps) {
  const t = useTranslations('kiosk');

  if (Object.keys(paymentMethods).length === 0) return null;

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {t('reports.dashboard.paymentMethods')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(paymentMethods).map(([method, stats]) => {
            const colors: Record<string, { bg: string; text: string; border: string }> = {
              cash: { bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
              transfer: { bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
              card: { bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
              mercadopago: { bg: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' }
            };
            const color = colors[method] || colors.cash;
            
            return (
              <div key={method} className={`p-4 rounded-xl border-2 ${color.border} bg-gradient-to-br ${color.bg} shadow-md`}>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {getPaymentMethodLabel(method)}
                </p>
                <p className={`text-2xl font-bold ${color.text} mb-1`}>
                  {formatCurrency(stats.total)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stats.count} {t('reports.dashboard.transactions')}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

