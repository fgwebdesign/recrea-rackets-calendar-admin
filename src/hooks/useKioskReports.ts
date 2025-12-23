import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SalesSummary, TopProduct, DashboardStats, LowStockAlert } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useKioskReports() {
  const [isLoading, setIsLoading] = useState(false);

  const getSalesSummary = useCallback(async (filters?: {
    venue_id?: string;
    start_date?: string;
    end_date?: string;
    group_by?: string;
  }): Promise<SalesSummary | null> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const params = new URLSearchParams();
      if (filters?.venue_id) params.append('venue_id', filters.venue_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.group_by) params.append('group_by', filters.group_by);

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/reports/summary${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching sales summary');
      const data = await response.json();
      return data.summary || null;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener el resumen de ventas",
        variant: "destructive",
      });
      console.error('Error fetching sales summary:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTopProducts = useCallback(async (filters?: {
    venue_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<TopProduct[]> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const params = new URLSearchParams();
      if (filters?.venue_id) params.append('venue_id', filters.venue_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/reports/top-products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching top products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener los productos más vendidos",
        variant: "destructive",
      });
      console.error('Error fetching top products:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDashboardStats = useCallback(async (venueId?: string): Promise<DashboardStats | null> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const params = new URLSearchParams();
      if (venueId) params.append('venue_id', venueId);

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/reports/dashboard${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching dashboard stats');
      const data = await response.json();
      return data.dashboard || null;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener estadísticas del dashboard",
        variant: "destructive",
      });
      console.error('Error fetching dashboard stats:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLowStockAlerts = useCallback(async (venueId?: string): Promise<{
    summary: {
      total_alerts: number;
      out_of_stock_count: number;
      low_stock_count: number;
      value_at_risk: number;
    };
    out_of_stock: LowStockAlert[];
    low_stock: LowStockAlert[];
  } | null> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const params = new URLSearchParams();
      if (venueId) params.append('venue_id', venueId);

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/inventory/alerts${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching low stock alerts');
      const data = await response.json();
      return data.alerts || null;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener alertas de stock",
        variant: "destructive",
      });
      console.error('Error fetching low stock alerts:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSalesTrend = useCallback(async (days: number = 30, venueId?: string): Promise<{
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
  } | null> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const params = new URLSearchParams();
      params.append('days', String(days));
      if (venueId) params.append('venue_id', venueId);

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/reports/trend?${queryString}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching sales trend');
      const data = await response.json();
      return data.trend || null;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener tendencia de ventas",
        variant: "destructive",
      });
      console.error('Error fetching sales trend:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    getSalesSummary,
    getTopProducts,
    getDashboardStats,
    getLowStockAlerts,
    getSalesTrend
  };
}

