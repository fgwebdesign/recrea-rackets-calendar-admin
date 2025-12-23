import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ProductCategory, CreateProductCategoryData, UpdateProductCategoryData } from '@/types/kiosk';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${API_URL}/kiosk/categories`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (!response.ok) throw new Error('Error fetching product categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('sesión ha expirado')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      console.error('Error fetching product categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (categoryData: CreateProductCategoryData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating category');
      }
      
      const { category } = await response.json();
      setCategories(prev => [...prev, category]);
      toast({
        title: "Éxito",
        description: "Categoría creada exitosamente",
        variant: "success",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la categoría",
        variant: "destructive",
      });
      console.error('Error creating product category:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, categoryData: UpdateProductCategoryData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating category');
      }

      const { category } = await response.json();
      setCategories(prev => prev.map(c => c.id === id ? category : c));
      
      toast({
        title: "Éxito",
        description: "Categoría actualizada exitosamente",
        variant: "success",
      });

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la categoría",
        variant: "destructive",
      });
      console.error('Error updating product category:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/kiosk/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting category');
      }
      
      setCategories(prev => prev.filter(category => category.id !== id));
      toast({
        title: "Éxito",
        description: "Categoría eliminada exitosamente",
        variant: "success",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la categoría",
        variant: "destructive",
      });
      console.error('Error deleting product category:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    categories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}

