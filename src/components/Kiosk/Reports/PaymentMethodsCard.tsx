'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
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
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg">
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('reports.dashboard.paymentMethods')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(paymentMethods).map(([method, stats]) => {
            const colors: Record<string, { bg: string; border: string; text: string }> = {
              cash:        { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30 dark:border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
              transfer:    { bg: 'bg-blue-50 dark:bg-blue-500/10',       border: 'border-blue-200 dark:border-blue-500/30 dark:border-l-blue-500',           text: 'text-blue-700 dark:text-blue-400' },
              card:        { bg: 'bg-violet-50 dark:bg-violet-500/10',   border: 'border-violet-200 dark:border-violet-500/30 dark:border-l-violet-500',     text: 'text-violet-700 dark:text-violet-400' },
              mercadopago: { bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/30 dark:border-l-amber-500',        text: 'text-amber-700 dark:text-amber-400' },
            };
            const color = colors[method] || colors.cash;

            return (
              <div key={method} className={`p-4 rounded-xl border dark:border-l-[3px] ${color.bg} ${color.border}`}>
                <p className="text-sm font-semibold text-foreground/80 mb-2 capitalize">
                  {getPaymentMethodLabel(method)}
                </p>
                <p className={`text-2xl font-bold ${color.text} mb-1`}>
                  {formatCurrency(stats.total)}
                </p>
                <p className="text-xs text-muted-foreground">
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

