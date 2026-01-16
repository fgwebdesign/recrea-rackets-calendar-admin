'use client';

import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTranslations } from '@/contexts/TranslationContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentMethodsPieChartProps {
  paymentMethods: Record<string, { count: number; total: number }>;
  formatCurrency: (value: number) => string;
}

export function PaymentMethodsPieChart({ paymentMethods, formatCurrency }: PaymentMethodsPieChartProps) {
  const t = useTranslations('kiosk');

  const getPaymentMethodLabel = useCallback((method: string) => {
    const labels: Record<string, string> = {
      cash: t('reports.dashboard.cash') || 'Efectivo',
      transfer: t('reports.dashboard.transfer') || 'Transferencia',
      card: t('reports.dashboard.card') || 'Tarjeta',
      mercadopago: t('reports.dashboard.mercadopago') || 'MercadoPago'
    };
    return labels[method] || method;
  }, [t]);

  const chartData = useMemo(() => {
    const methods = Object.entries(paymentMethods);
    
    const colors: Record<string, { bg: string; border: string }> = {
      cash: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
      transfer: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
      card: { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgb(168, 85, 247)' },
      mercadopago: { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgb(249, 115, 22)' }
    };

    return {
      labels: methods.map(([method]) => getPaymentMethodLabel(method)),
      datasets: [
        {
          data: methods.map(([, stats]) => stats.total),
          backgroundColor: methods.map(([method]) => colors[method]?.bg || 'rgba(107, 114, 128, 0.8)'),
          borderColor: methods.map(([method]) => colors[method]?.border || 'rgb(107, 114, 128)'),
          borderWidth: 2,
          hoverOffset: 10,
        }
      ]
    };
  }, [paymentMethods, getPaymentMethodLabel]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: { parsed: number; dataset: { data: number[] } }) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  }), [formatCurrency]);

  const totalRevenue = useMemo(() => 
    Object.values(paymentMethods).reduce((sum, stats) => sum + stats.total, 0),
    [paymentMethods]
  );

  if (Object.keys(paymentMethods).length === 0) return null;

  const methodConfig: Record<string, { 
    bg: string; 
    text: string;
    gradient: string; 
    iconBg: string;
    Icon: typeof CreditCard;
  }> = {
    cash: { 
      bg: 'bg-emerald-500', 
      text: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20', 
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      Icon: Banknote 
    },
    transfer: { 
      bg: 'bg-blue-500', 
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20', 
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      Icon: Smartphone 
    },
    card: { 
      bg: 'bg-violet-500', 
      text: 'text-violet-600 dark:text-violet-400',
      gradient: 'from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/20', 
      iconBg: 'bg-violet-100 dark:bg-violet-900/50',
      Icon: CreditCard 
    },
    mercadopago: { 
      bg: 'bg-amber-500', 
      text: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20', 
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      Icon: Building2 
    }
  };

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl shadow-inner">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {t('reports.dashboard.paymentMethods')}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Este Mes</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Gráfica Donut */}
          <div className="relative flex-shrink-0" style={{ width: '220px', height: '220px' }}>
            <Doughnut data={chartData} options={options} />
            {/* Centro del donut con total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
          
          {/* Desglose detallado como cards */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(paymentMethods).map(([method, stats]) => {
                const percentage = totalRevenue > 0 ? ((stats.total / totalRevenue) * 100).toFixed(1) : '0';
                const config = methodConfig[method] || { 
                  bg: 'bg-gray-500', 
                  text: 'text-gray-600',
                  gradient: 'from-gray-50 to-gray-100', 
                  iconBg: 'bg-gray-100',
                  Icon: CreditCard 
                };
                const IconComponent = config.Icon;
                
                return (
                  <div 
                    key={method} 
                    className={`p-5 rounded-2xl bg-gradient-to-br ${config.gradient} border-2 border-white/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${config.iconBg}`}>
                          <IconComponent className={`w-5 h-5 ${config.text}`} />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {getPaymentMethodLabel(method)}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${config.text} px-3 py-1 rounded-full ${config.iconBg}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {formatCurrency(stats.total)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stats.count} {stats.count === 1 ? 'transacción' : 'transacciones'}
                      </p>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-white/60 dark:bg-gray-700/50 rounded-full h-2 mt-4">
                      <div 
                        className={`h-2 rounded-full ${config.bg} transition-all duration-700 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
