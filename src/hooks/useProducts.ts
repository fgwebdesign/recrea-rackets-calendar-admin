import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Product, CreateProductData, UpdateProductData, UpdateStockData, ProductFilters } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const filtersRef = useRef<string>('');

  const fetchProducts = useCallback(async (customFilters: ProductFilters) => {
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

      const response = await fetch(url, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (!response.ok) throw new Error('Error fetching products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
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

  // Solo ejecutar cuando realmente cambian los filtros (comparando serialización)
  useEffect(() => {
    const currentFilters = JSON.stringify(filters || {});
    if (filtersRef.current !== currentFilters) {
      filtersRef.current = currentFilters;
      fetchProducts(filters || {});
    }
  }, [filters, fetchProducts]);

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
  }, [getProductById]);

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

