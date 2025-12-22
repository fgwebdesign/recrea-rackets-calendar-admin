'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
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
    <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          Kiosco
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs opacity-90 mb-1">Ventas Hoy</p>
            <p className="text-2xl font-bold">
              {isLoading ? '...' : salesSummary?.today_sales || 0}
            </p>
            <p className="text-xs opacity-75 mt-1">
              ${isLoading ? '...' : (salesSummary?.today_revenue || 0).toLocaleString('es-UY')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs opacity-90 mb-1">Productos Activos</p>
            <p className="text-2xl font-bold">{totalActiveProducts}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs opacity-90 mb-1">Stock Bajo</p>
            <p className="text-2xl font-bold">{lowStockProducts}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Receipt className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs opacity-90 mb-1">Total Ventas</p>
            <p className="text-2xl font-bold">{sales.length}</p>
          </div>
        </div>

        {/* Atajos Rápidos */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Accesos Rápidos
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className={`${action.color} text-white flex items-center justify-between gap-2`}
                  variant="default"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

