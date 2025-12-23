'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTranslations } from '@/contexts/TranslationContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesTrendChartProps {
  trendData: {
    period: {
      days: number;
      start_date: string;
      end_date: string;
    };
    summary: {
      total_revenue: number;
      total_sales: number;
      average_per_day: number;
      average_per_active_day: number;
      active_days: number;
    };
    data: Array<{
      date: string;
      day_name: string;
      sales_count: number;
      total: number;
      moving_avg: number | null;
    }>;
  };
  formatCurrency: (value: number) => string;
}

export function SalesTrendChart({ trendData, formatCurrency }: SalesTrendChartProps) {
  const t = useTranslations('kiosk');

  const chartData = useMemo(() => {
    const labels = trendData.data.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    });

    const revenueData = trendData.data.map(day => day.total);
    const movingAvgData = trendData.data.map(day => day.moving_avg || 0);

    return {
      labels,
      datasets: [
        {
          label: t('reports.charts.dailyRevenue'),
          data: revenueData,
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: t('reports.charts.movingAverage'),
          data: movingAvgData,
          borderColor: '#6B7280',
          backgroundColor: 'rgba(107, 114, 128, 0.05)',
          fill: false,
          tension: 0.4,
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
        }
      ]
    };
  }, [trendData.data, t]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return `$${(value / 1000).toFixed(0)}k`;
          },
          font: {
            size: 11
          }
        }
      }
    }
  }), [formatCurrency]);

  return (
    <Card className="border-2 border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
            <LineChart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {t('reports.charts.trendTitle')}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Últimos {trendData.period.days} {t('reports.charts.days')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={options} />
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(trendData.summary.total_revenue)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.charts.totalPeriod')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {trendData.summary.total_sales}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.charts.transactions')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(trendData.summary.average_per_day)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.charts.averagePerDay')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

