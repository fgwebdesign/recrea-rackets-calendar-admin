import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Product, CreateProductData, UpdateProductData, UpdateStockData, ProductFilters } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFiltersRef = useRef<string | null>(null);
  const isMountedRef = useRef(false);

  const fetchProducts = useCallback(async (customFilters: ProductFilters) => {
    // Cancelar cualquier llamada anterior en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crear nuevo AbortController para esta llamada
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');

      // Construir query params
      const params = new URLSearchParams();
      if (customFilters.category_id) params.append('category_id', customFilters.category_id);
      if (customFilters.venue_id) params.append('venue_id', customFilters.venue_id);
      if (customFilters.is_active !== undefined) params.append('is_active', String(customFilters.is_active));
      if (customFilters.search) params.append('search', customFilters.search);
      if (customFilters.low_stock) params.append('low_stock', 'true');

      const queryString = params.toString();
      const url = `${API_URL}/kiosk/products${queryString ? `?${queryString}` : ''}`;

      console.log('🔍 Fetching products:', { url, filters: customFilters });

      const response = await fetch(url, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        signal: abortController.signal
      });
      
      if (!response.ok) {
        console.error('❌ Response not ok:', response.status, response.statusText);
        throw new Error('Error fetching products');
      }
      const data = await response.json();
      console.log('✅ Products received:', data.products?.length || 0, 'products');
      setProducts(data.products || []);
    } catch (error) {
      // Ignorar errores de abort (cancelación intencional)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Fetch aborted (new request started)');
        return;
      }
      if (error instanceof Error && !error.message.includes('sesión ha expirado')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Serializar filtros para comparación estable
  const filtersKey = filters ? JSON.stringify(filters) : null;
  
  // Ejecutar cuando cambian los filtros o cuando el componente se monta
  useEffect(() => {
    // Marcar como montado
    isMountedRef.current = true;
    
    // Si filters es undefined o null, NO hacer ninguna llamada
    if (!filters || !filtersKey) {
      console.log('⏳ useProducts: No filters provided');
      return;
    }
    
    // Si filters.venue_id es vacío o undefined, NO hacer llamada
    if (!filters.venue_id) {
      console.log('⏳ useProducts: No venue_id in filters');
      return;
    }
    
    // Solo hacer fetch si los filtros cambiaron O si es la primera vez
    if (lastFiltersRef.current !== filtersKey) {
      console.log('📦 useProducts: Fetching with filters', filters);
      lastFiltersRef.current = filtersKey;
      fetchProducts(filters);
    }
    
    // Cleanup: cancelar llamada en curso y resetear refs
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Resetear la referencia cuando se desmonta para que vuelva a cargar al remontar
      isMountedRef.current = false;
      lastFiltersRef.current = null;
    };
  }, [filters, filtersKey, fetchProducts]);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/kiosk/products/${id}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (!response.ok) throw new Error('Error fetching product');
      const data = await response.json();
      return data.product || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }, []);

  const createProduct = useCallback(async (productData: CreateProductData): Promise<{ success: boolean; product?: Product }> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating product');
      }
      
      const { product } = await response.json();
      setProducts(prev => [...prev, product]);
      
      toast({
        title: "Éxito",
        description: "Producto creado exitosamente",
        variant: "success",
      });
      return { success: true, product };
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el producto",
        variant: "destructive",
      });
      console.error('Error creating product:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, productData: UpdateProductData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating product');
      }

      const { product } = await response.json();
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      
      toast({
        title: "Éxito",
        description: "Producto actualizado exitosamente",
        variant: "success",
      });

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el producto",
        variant: "destructive",
      });
      console.error('Error updating product:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting product');
      }
      
      setProducts(prev => prev.filter(product => product.id !== id));
      toast({
        title: "Éxito",
        description: "Producto eliminado exitosamente",
        variant: "success",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el producto",
        variant: "destructive",
      });
      console.error('Error deleting product:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStock = useCallback(async (id: string, stockData: UpdateStockData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating stock');
      }

      const { product } = await response.json();
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      
      toast({
        title: "Éxito",
        description: "Stock actualizado exitosamente",
        variant: "success",
      });

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el stock",
        variant: "destructive",
      });
      console.error('Error updating stock:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    isLoading,
    fetchProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
  };
}

