'use client';

import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyData {
  date: string;
  day_name: string;
  sales_count: number;
  total: number;
}

interface WeeklySalesChartProps {
  dailyBreakdown: DailyData[];
  totalRevenue: number;
  formatCurrency: (value: number) => string;
}

export function WeeklySalesChart({ 
  dailyBreakdown, 
  totalRevenue,
  formatCurrency 
}: WeeklySalesChartProps) {
  const chartData = useMemo(() => {
    const averageDaily = totalRevenue / 7;
    
    // Formatear etiquetas con día de la semana
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
            return d.total > averageDaily 
              ? 'rgba(59, 130, 246, 0.7)' // Azul si está arriba del promedio
              : 'rgba(148, 163, 184, 0.6)'; // Gris si está abajo
          }),
          borderColor: dailyBreakdown.map(d => {
            return d.total > averageDaily 
              ? 'rgb(59, 130, 246)'
              : 'rgb(148, 163, 184)';
          }),
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 'flex' as const,
          maxBarThickness: 40,
        }
      ]
    };
  }, [dailyBreakdown, totalRevenue]);

  const averageDaily = totalRevenue / 7;

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
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 11
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
            return [
              `💰 Total: ${formatCurrency(context.parsed.y)}`,
              `🛒 Ventas: ${day.sales_count}`,
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
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 9
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
            size: 10
          },
          color: '#64748b'
        }
      }
    }
  }), [formatCurrency, dailyBreakdown]);

  if (!dailyBreakdown || dailyBreakdown.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Ventas por día
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-3 h-0.5 bg-orange-400 border-dashed border-t-2 border-orange-400"></div>
          <span>Prom: {formatCurrency(averageDaily)}/día</span>
        </div>
      </div>

      {/* Gráfica */}
      <div className="relative" style={{ height: '160px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
