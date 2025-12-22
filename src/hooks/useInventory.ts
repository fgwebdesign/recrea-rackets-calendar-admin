import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { InventoryMovement, InventoryFilters } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useInventory(filters?: InventoryFilters) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMovements = useCallback(async (customFilters?: InventoryFilters) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const activeFilters = customFilters || filters || {};
      const params = new URLSearchParams();
      
      if (activeFilters.product_id) params.append('product_id', activeFilters.product_id);
      if (activeFilters.venue_id) params.append('venue_id', activeFilters.venue_id);
      if (activeFilters.movement_type) params.append('movement_type', activeFilters.movement_type);
      if (activeFilters.start_date) params.append('start_date', activeFilters.start_date);
      if (activeFilters.end_date) params.append('end_date', activeFilters.end_date);
      if (activeFilters.limit) params.append('limit', String(activeFilters.limit));

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/inventory/movements${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching inventory movements');
      const data = await response.json();
      setMovements(data.movements || []);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('sesión ha expirado')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      console.error('Error fetching inventory movements:', error);
      setMovements([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    isLoading,
    fetchMovements
  };
}

