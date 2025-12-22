import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SalesSummary, TopProduct } from '@/types/kiosk';

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

  return {
    isLoading,
    getSalesSummary,
    getTopProducts
  };
}

