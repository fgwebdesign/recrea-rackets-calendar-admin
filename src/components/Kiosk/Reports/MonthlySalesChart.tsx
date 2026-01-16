'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyData {
  date: string;
  day_name: string;
  sales_count: number;
  total: number;
  cash: number;
  transfer: number;
  card: number;
}

interface MonthlySalesChartProps {
  monthName: string;
  dailyBreakdown: DailyData[];
  summary: {
    total_sales: number;
    total_revenue: number;
    average_daily: number;
    average_ticket: number;
    comparison: {
      previous_month_total: number;
      variation_amount: number;
      variation_percent: number;
    };
  };
  bestDay: { date: string; day_name: string; total: number } | null;
  formatCurrency: (value: number) => string;
}

export function MonthlySalesChart({ 
  monthName, 
  dailyBreakdown, 
  summary, 
  bestDay,
  formatCurrency 
}: MonthlySalesChartProps) {
  const chartData = useMemo(() => {
    // Formatear etiquetas con día de la semana abreviado
    const labels = dailyBreakdown.map(d => {
      const dayNum = new Date(d.date).getDate();
      const dayAbbr = d.day_name.substring(0, 3);
      return `${dayNum} ${dayAbbr}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Ventas del día',
          data: dailyBreakdown.map(d => d.total),
          backgroundColor: dailyBreakdown.map(d => {
            if (bestDay && d.date === bestDay.date) {
              return 'rgba(34, 197, 94, 0.9)'; // Verde para mejor día
            }
            return d.total > summary.average_daily 
              ? 'rgba(59, 130, 246, 0.7)' // Azul si está arriba del promedio
              : 'rgba(148, 163, 184, 0.6)'; // Gris si está abajo
          }),
          borderColor: dailyBreakdown.map(d => {
            if (bestDay && d.date === bestDay.date) {
              return 'rgb(34, 197, 94)';
            }
            return d.total > summary.average_daily 
              ? 'rgb(59, 130, 246)'
              : 'rgb(148, 163, 184)';
          }),
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 'flex' as const,
          maxBarThickness: 28,
        }
      ]
    };
  }, [dailyBreakdown, bestDay, summary.average_daily]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          title: function(context: { dataIndex: number }[]) {
            const idx = context[0].dataIndex;
            const day = dailyBreakdown[idx];
            const date = new Date(day.date);
            return `${day.day_name} ${date.getDate()}`;
          },
          label: function(context: { dataIndex: number; parsed: { y: number } }) {
            const day = dailyBreakdown[context.dataIndex];
            const lines = [
              `💰 Total: ${formatCurrency(context.parsed.y)}`,
              `🛒 Ventas: ${day.sales_count}`,
            ];
            if (day.cash > 0) lines.push(`💵 Efectivo: ${formatCurrency(day.cash)}`);
            if (day.transfer > 0) lines.push(`📱 Transferencia: ${formatCurrency(day.transfer)}`);
            if (day.card > 0) lines.push(`💳 Tarjeta: ${formatCurrency(day.card)}`);
            return lines;
          }
        }
      },
      // Línea de promedio
      annotation: {
        annotations: {
          averageLine: {
            type: 'line',
            yMin: summary.average_daily,
            yMax: summary.average_daily,
            borderColor: 'rgba(249, 115, 22, 0.8)',
            borderWidth: 2,
            borderDash: [6, 6],
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
          minRotation: 45,
          font: {
            size: 10
          },
          color: '#64748b'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
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
          },
          color: '#64748b'
        }
      }
    }
  }), [formatCurrency, dailyBreakdown, summary.average_daily]);

  // Determinar icono de variación (manejar null/undefined y convertir a número)
  const variationPercent = Number(summary.comparison?.variation_percent) || 0;
  
  const VariationIcon = variationPercent > 0 
    ? TrendingUp 
    : variationPercent < 0 
      ? TrendingDown 
      : Minus;

  const variationColor = variationPercent > 0 
    ? 'text-green-500' 
    : variationPercent < 0 
      ? 'text-red-500' 
      : 'text-gray-500';

  if (dailyBreakdown.length === 0) return null;

  return (
    <Card className="border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-100 dark:border-violet-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/50 rounded-xl shadow-inner">
              <CalendarDays className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Ventas de {monthName}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Desglose diario de ingresos
              </CardDescription>
            </div>
          </div>
          
          {/* Comparación con mes anterior */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-700/50 shadow-sm border border-gray-200 dark:border-gray-600">
            <VariationIcon className={`w-5 h-5 ${variationColor}`} />
            <div className="text-right">
              <p className={`text-lg font-bold ${variationColor}`}>
                {variationPercent > 0 ? '+' : ''}
                {variationPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mes anterior</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* KPIs del mes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Mes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(summary.total_revenue)}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Promedio/Día</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(summary.average_daily)}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Ticket Promedio</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(summary.average_ticket)}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {summary.total_sales}
            </p>
          </div>
        </div>

        {/* Gráfica */}
        <div className="relative" style={{ height: '320px' }}>
          <Bar data={chartData} options={options} />
          
          {/* Línea de promedio visual (leyenda) */}
          <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md">
            <div className="w-6 h-0.5 bg-orange-400 border-dashed border-t-2 border-orange-400"></div>
            <span>Promedio: {formatCurrency(summary.average_daily)}/día</span>
          </div>
        </div>

        {/* Mejor día */}
        {bestDay && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mejor día del mes</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {bestDay.day_name} {new Date(bestDay.date).getDate()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(bestDay.total)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
