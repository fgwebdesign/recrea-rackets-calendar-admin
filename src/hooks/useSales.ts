import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Sale, CreateSaleData, SaleFilters } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useSales(filters?: SaleFilters) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{ total: number; limit: number; offset: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const filtersRef = useRef(filters);

  // Actualizar ref cuando cambian los filters
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchSales = useCallback(async (customFilters?: SaleFilters) => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const activeFilters = customFilters || filtersRef.current || {};
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
        },
        signal: abortController.signal
      });
      
      if (!response.ok) {
        // No mostrar error si fue cancelado
        if (abortController.signal.aborted) return;
        throw new Error('Error fetching sales');
      }
      
      const data = await response.json();
      
      // Verificar que no fue cancelado antes de actualizar estado
      if (!abortController.signal.aborted) {
        setSales(data.sales || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      // Ignorar errores de cancelación
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      // Solo mostrar toast si no es un error de autenticación o cancelación
      if (error instanceof Error && 
          !error.message.includes('sesión ha expirado') && 
          !error.message.includes('aborted')) {
        // No mostrar toast para errores de red cuando la app está en standby
        if (!error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      console.error('Error fetching sales:', error);
      
      // Solo actualizar estado si no fue cancelado
      if (!abortController.signal.aborted) {
        setSales([]);
      }
    } finally {
      // Solo actualizar loading si no fue cancelado
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []); // Sin dependencias para evitar re-creaciones innecesarias

  // Efecto para fetch inicial y cuando cambian los filters
  useEffect(() => {
    fetchSales();
    
    // Cleanup: cancelar request al desmontar o cuando cambian los filters
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]); // Usar stringify para comparar filters

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
        variant: "success",
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
        variant: "success",
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

