'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  AlertTriangle, 
  Receipt,
  BarChart3,
  Box
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useTranslations } from '@/contexts/TranslationContext';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function KioskWidget() {
  const router = useRouter();
  const t = useTranslations('kiosk');
  const { products } = useProducts({ is_active: true, low_stock: true });
  const [totalSales, setTotalSales] = useState<number>(0);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  // Calcular productos con stock bajo
  const lowStockProducts = useMemo(() => {
    return products.filter(p => 
      p.track_inventory && 
      p.stock_quantity <= p.min_stock_alert
    ).length;
  }, [products]);

  // Obtener solo el total de ventas (más eficiente que cargar todas)
  useEffect(() => {
    let abortController: AbortController | null = null;
    
    const fetchTotalSales = async () => {
      try {
        // Cancelar request anterior si existe
        if (abortController) {
          abortController.abort();
        }
        
        abortController = new AbortController();
        setIsLoadingSales(true);
        
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        // Usar el endpoint de resumen que es más eficiente
        const response = await fetch(`${API_URL}/kiosk/reports/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: abortController.signal
        });

        if (!response.ok || abortController.signal.aborted) return;
        
        const data = await response.json();
        if (data.success && !abortController.signal.aborted) {
          setTotalSales(data.summary?.total_sales || 0);
        }
      } catch (error) {
        // Ignorar errores de cancelación y red cuando la app está en standby
        if (error instanceof Error && 
            error.name !== 'AbortError' && 
            !error.message.includes('Failed to fetch') &&
            !error.message.includes('NetworkError')) {
          console.error('Error fetching sales summary:', error);
        }
      } finally {
        if (!abortController?.signal.aborted) {
          setIsLoadingSales(false);
        }
      }
    };

    fetchTotalSales();

    // Cleanup: cancelar request al desmontar
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
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
        <div className="grid grid-cols-2 gap-4 mb-6">
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoadingSales ? '...' : totalSales}
            </p>
          </div>
        </div>

        {/* Atajos Rápidos Mejorados */}
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
      </div>
    </div>
  );
}

