'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Receipt,
  BarChart3,
  Box
} from 'lucide-react';
import { useKioskReports } from '@/hooks/useKioskReports';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useTranslations } from '@/contexts/TranslationContext';
import { format } from 'date-fns';

export function KioskWidget() {
  const router = useRouter();
  const t = useTranslations('kiosk');
  const { getSalesSummary } = useKioskReports();
  const { products } = useProducts({ is_active: true, low_stock: true });
  const { sales } = useSales({ limit: 100 });
  
  const [salesSummary, setSalesSummary] = useState<{
    total_sales: number;
    total_revenue: number;
    today_sales: number;
    today_revenue: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener resumen de ventas del día
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const summary = await getSalesSummary({
          start_date: today,
          end_date: today
        });
        
        if (summary) {
          setSalesSummary({
            total_sales: summary.total_sales || 0,
            total_revenue: summary.total_revenue || 0,
            today_sales: summary.total_sales || 0,
            today_revenue: summary.total_revenue || 0
          });
        }
      } catch (error) {
        console.error('Error fetching sales summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [getSalesSummary]);

  // Calcular productos con stock bajo
  const lowStockProducts = useMemo(() => {
    return products.filter(p => 
      p.track_inventory && 
      p.stock_quantity <= p.min_stock_alert
    ).length;
  }, [products]);

  // Calcular total de productos activos
  const totalActiveProducts = useMemo(() => {
    return products.length;
  }, [products]);

  const quickActions = [
    {
      label: t('pos.title'),
      icon: ShoppingCart,
      href: '/kiosk',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: t('products.title'),
      icon: Box,
      href: '/kiosk/products',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      label: t('sales.title'),
      icon: Receipt,
      href: '/kiosk/sales',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      label: t('reports.title'),
      icon: BarChart3,
      href: '/kiosk/reports',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  return (
    <div className="bg-white dark:bg-[#0E1629] border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Header Minimalista */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kiosco</h3>
          </div>
        </div>

        {/* Estadísticas Minimalistas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Ventas Hoy</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : salesSummary?.today_sales || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              ${isLoading ? '...' : (salesSummary?.today_revenue || 0).toLocaleString('es-UY')}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Productos</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActiveProducts}</p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Stock Bajo</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockProducts}</p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Ventas</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sales.length}</p>
          </div>
        </div>

        {/* Atajos Rápidos Minimalistas */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

