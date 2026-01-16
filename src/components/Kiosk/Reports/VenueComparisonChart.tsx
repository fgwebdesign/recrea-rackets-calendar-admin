'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTranslations } from '@/contexts/TranslationContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VenueData {
  venue_id: string | null;
  venue_name: string;
  sales_count: number;
  total_revenue: number;
  average_ticket: number;
  percentage_of_total: number;
}

interface VenueComparisonChartProps {
  venues: VenueData[];
  formatCurrency: (value: number) => string;
  globalStats: {
    total_venues: number;
    total_sales: number;
    total_revenue: number;
    average_ticket: number;
  };
}

export function VenueComparisonChart({ venues, formatCurrency, globalStats }: VenueComparisonChartProps) {
  const t = useTranslations('kiosk');

  const chartData = useMemo(() => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(249, 115, 22, 0.8)',   // Orange
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(20, 184, 166, 0.8)',   // Teal
    ];
    
    return {
      labels: venues.map(v => v.venue_name),
      datasets: [
        {
          label: 'Ingresos',
          data: venues.map(v => v.total_revenue),
          backgroundColor: venues.map((_, i) => colors[i % colors.length]),
          borderColor: venues.map((_, i) => colors[i % colors.length].replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 8,
        }
      ]
    };
  }, [venues]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: { dataIndex: number; parsed: { y: number } }) {
            const venue = venues[context.dataIndex];
            return [
              `Ingresos: ${formatCurrency(context.parsed.y)}`,
              `Ventas: ${venue?.sales_count || 0}`,
              `Ticket promedio: ${formatCurrency(venue?.average_ticket || 0)}`,
              `${venue?.percentage_of_total || 0}% del total`
            ];
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
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: number | string) {
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            if (numValue >= 1000) {
              return `$${(numValue / 1000).toFixed(0)}k`;
            }
            return `$${numValue}`;
          },
          font: {
            size: 11
          }
        }
      }
    }
  }), [formatCurrency, venues]);

  if (venues.length === 0) return null;

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {t('reports.charts.venueComparison') || 'Comparativa por Sede'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('reports.charts.venueComparisonDesc') || 'Rendimiento de ventas por sede'}
              </CardDescription>
            </div>
          </div>
          
          {/* Stats globales */}
          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(globalStats.total_revenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total General</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {globalStats.total_sales}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ventas Totales</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '350px' }}>
          <Bar data={chartData} options={options} />
        </div>

        {/* Detalle por sede */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue, index) => {
              const colors = [
                'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700',
                'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700',
                'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700',
                'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700',
              ];
              
              return (
                <div 
                  key={venue.venue_id || 'unassigned'} 
                  className={`p-4 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} border-2`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {venue.venue_name}
                    </h4>
                    <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                      {venue.percentage_of_total}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(venue.total_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ventas</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {venue.sales_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ticket Prom.</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(venue.average_ticket)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
