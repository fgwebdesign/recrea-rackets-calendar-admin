import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Sale, CreateSaleData, SaleFilters } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useSales(filters?: SaleFilters) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{ total: number; limit: number; offset: number } | null>(null);

  const fetchSales = useCallback(async (customFilters?: SaleFilters) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const activeFilters = customFilters || filters || {};
      const params = new URLSearchParams();
      
      if (activeFilters.venue_id) params.append('venue_id', activeFilters.venue_id);
      if (activeFilters.payment_method) params.append('payment_method', activeFilters.payment_method);
      if (activeFilters.payment_status) params.append('payment_status', activeFilters.payment_status);
      if (activeFilters.sale_context) params.append('sale_context', activeFilters.sale_context);
      if (activeFilters.start_date) params.append('start_date', activeFilters.start_date);
      if (activeFilters.end_date) params.append('end_date', activeFilters.end_date);
      if (activeFilters.limit) params.append('limit', String(activeFilters.limit));
      if (activeFilters.offset) params.append('offset', String(activeFilters.offset));

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/sales${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching sales');
      const data = await response.json();
      setSales(data.sales || []);
      setPagination(data.pagination || null);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('sesión ha expirado')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const getSaleById = useCallback(async (id: string): Promise<Sale | null> => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/sales/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching sale');
      const data = await response.json();
      return data.sale || null;
    } catch (error) {
      console.error('Error fetching sale:', error);
      return null;
    }
  }, []);

  const createSale = useCallback(async (saleData: CreateSaleData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating sale');
      }
      
      const { sale } = await response.json();
      setSales(prev => [sale, ...prev]);
      toast({
        title: "Éxito",
        description: "Venta registrada exitosamente",
      });
      return sale;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar la venta",
        variant: "destructive",
      });
      console.error('Error creating sale:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSale = useCallback(async (id: string, reason?: string, restoreStock: boolean = true) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/sales/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, restore_stock: restoreStock }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error cancelling sale');
      }

      const { sale } = await response.json();
      setSales(prev => prev.map(s => s.id === id ? sale : s));
      
      toast({
        title: "Éxito",
        description: "Venta cancelada exitosamente",
      });

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cancelar la venta",
        variant: "destructive",
      });
      console.error('Error cancelling sale:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sales,
    isLoading,
    pagination,
    fetchSales,
    getSaleById,
    createSale,
    cancelSale
  };
}

