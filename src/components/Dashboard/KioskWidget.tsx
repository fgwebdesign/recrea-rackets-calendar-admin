'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  AlertTriangle, 
  Receipt,
  BarChart3,
  Box,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useKioskReports } from '@/hooks/useKioskReports';
import { useTranslations } from '@/contexts/TranslationContext';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import * as Collapsible from "@radix-ui/react-collapsible";

export function KioskWidget() {
  const router = useRouter();
  const t = useTranslations('kiosk');
  const { products } = useProducts({ is_active: true, low_stock: true });
  const { getDashboardStats } = useKioskReports();
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  // Calcular productos con stock bajo
  const lowStockProducts = useMemo(() => {
    return products.filter(p => 
      p.track_inventory && 
      p.stock_quantity <= p.min_stock_alert
    ).length;
  }, [products]);

  // Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const dashboardData = await getDashboardStats();

      if (dashboardData) {
        setDashboard(dashboardData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getDashboardStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const quickActions = [
    {
      label: t('pos.title'),
      icon: ShoppingCart,
      href: '/kiosk',
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      label: t('products.title'),
      icon: Box,
      href: '/kiosk/products',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      label: t('sales.title'),
      icon: Receipt,
      href: '/kiosk/sales',
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      label: t('reports.title'),
      icon: BarChart3,
      href: '/kiosk/reports',
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
      borderColor: 'border-orange-200 dark:border-orange-800'
    }
  ];

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <Collapsible.Trigger asChild>
          <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                {t('title')}
              </CardTitle>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <CardContent className="p-6">
            {/* Estadísticas Mejoradas */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Stock Bajo */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('lowStock')}</p>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-400 mb-1">{lowStockProducts}</p>
                {lowStockProducts > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('requiresAttention')}</p>
                )}
              </div>

              {/* Total Ventas */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('totalSales')}</p>
                </div>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1">
                  {isLoading ? '...' : (dashboard?.month?.sales_count || 0)}
                </p>
                {dashboard?.month && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatCurrency(dashboard.month.total_revenue)} {t('thisMonth')}
                  </p>
                )}
              </div>
            </div>

            {/* Información Adicional */}
            {dashboard && (
              <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Ventas Hoy */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('today')}</p>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(dashboard.today?.total_revenue || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {dashboard.today?.sales_count || 0} {t('salesCount')}
              </p>
            </div>

            {/* Esta Semana */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('week')}</p>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(dashboard.week?.total_revenue || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {dashboard.week?.sales_count || 0} {t('salesCount')}
              </p>
            </div>

            {/* Variación Mensual */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-1.5 mb-1">
                {dashboard.month?.variation_percent >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('vsPreviousMonth')}</p>
              </div>
              <p className={`text-lg font-bold ${
                dashboard.month?.variation_percent >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {dashboard.month?.variation_percent >= 0 ? '+' : ''}
                {dashboard.month?.variation_percent?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatCurrency(dashboard.month?.total_revenue || 0)}
              </p>
            </div>
          </div>
        )}

            {/* Atajos Rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    className={`
                      group relative
                      flex flex-col items-center justify-center gap-2
                      px-4 py-4
                      ${action.bgColor}
                      ${action.hoverBg}
                      border ${action.borderColor}
                      rounded-xl
                      transition-all duration-200
                      hover:shadow-md hover:scale-[1.02]
                      active:scale-[0.98]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800
                    `}
                  >
                    <div className={`
                      p-2.5 rounded-lg
                      ${action.bgColor}
                      group-hover:scale-110
                      transition-transform duration-200
                    `}>
                      <Icon className={`w-5 h-5 ${action.iconColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
      </Collapsible.Content>
    </Card>
    </Collapsible.Root>
  );
}
