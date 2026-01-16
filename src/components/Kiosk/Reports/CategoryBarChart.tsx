'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tags, 
  GlassWater, 
  Utensils, 
  Coffee, 
  Candy, 
  ShoppingBag, 
  Package, 
  Shirt,
  Dumbbell,
  CircleDot
} from 'lucide-react';
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

interface CategoryData {
  category_id: string | null;
  category_name: string;
  icon: string;
  color: string;
  items_sold: number;
  total_revenue: number;
  percentage: number;
  top_products: Array<{ name: string; quantity: number; total: number }>;
}

interface CategoryBarChartProps {
  categories: CategoryData[];
  formatCurrency: (value: number) => string;
}

// Mapeo de nombres de iconos a componentes de Lucide
const iconMap: Record<string, typeof Tags> = {
  'glass-water': GlassWater,
  'utensils': Utensils,
  'coffee': Coffee,
  'candy': Candy,
  'shopping-bag': ShoppingBag,
  'package': Package,
  'shirt': Shirt,
  'dumbbell': Dumbbell,
  'tags': Tags,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || CircleDot;
};

export function CategoryBarChart({ categories, formatCurrency }: CategoryBarChartProps) {
  const t = useTranslations('kiosk');

  const chartData = useMemo(() => {
    // Tomar top 8 categorías
    const topCategories = categories.slice(0, 8);
    
    return {
      labels: topCategories.map(c => c.category_name),
      datasets: [
        {
          label: 'Ingresos',
          data: topCategories.map(c => c.total_revenue),
          backgroundColor: topCategories.map(c => c.color || '#6B7280'),
          borderColor: topCategories.map(c => c.color || '#6B7280'),
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 40,
        }
      ]
    };
  }, [categories]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // Barras horizontales
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
          label: function(context: { dataIndex: number; parsed: { x: number } }) {
            const category = categories[context.dataIndex];
            return [
              `Ingresos: ${formatCurrency(context.parsed.x)}`,
              `Unidades: ${category?.items_sold || 0}`,
              `${category?.percentage || 0}% del total`
            ];
          }
        }
      }
    },
    scales: {
      x: {
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
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    }
  }), [formatCurrency, categories]);

  if (categories.length === 0) return null;

  return (
    <Card className="border-2 border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
            <Tags className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {t('reports.charts.byCategory') || 'Ventas por Categoría'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('reports.charts.byCategoryDesc') || 'Distribución de ingresos por categoría de producto'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${Math.max(300, categories.slice(0, 8).length * 50)}px` }}>
          <Bar data={chartData} options={options} />
        </div>

        {/* Top productos por categoría */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {t('reports.charts.topByCategory') || 'Productos destacados por categoría'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.slice(0, 6).map((category) => {
              const IconComponent = getIconComponent(category.icon);
              
              return (
                <div 
                  key={category.category_id || 'uncategorized'} 
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="p-2 rounded-lg" 
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: category.color || '#6B7280' }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {category.category_name}
                    </span>
                  </div>
                  {category.top_products.slice(0, 2).map((product, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400 py-1.5 border-t border-gray-100 dark:border-gray-600 first:border-t-0">
                      <span className="truncate max-w-[160px]">{product.name}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{product.quantity} uds</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
