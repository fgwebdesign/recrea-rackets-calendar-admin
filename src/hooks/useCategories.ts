import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface Category {
  id: string;
  name: string;
}

interface CreateCategoryData {
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        // No mostrar error si no hay token, simplemente retornar
        setCategories([]);
        return;
      }

      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error fetching categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      // Solo mostrar toast si es un error real de API, no por falta de token
      if (error instanceof Error && !error.message.includes('sesión ha expirado')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (categoryData: CreateCategoryData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/categories`, {
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
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la categoría",
        variant: "destructive",
      });
      console.error('Error creating category:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, categoryData: CreateCategoryData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData),
      });

      setCategories(prev => prev.map(c => 
        c.id === id ? { ...c, name: categoryData.name } : c
      ));
      
      toast({
        title: "Éxito",
        description: "Categoría actualizada exitosamente",
      });

      return true;
    } catch (error) {
      toast({
        title: "Aviso",
        description: "Actualización local realizada. Error de API no impidió la actualización local.",
        variant: "default",
      });
      console.log('Error en la respuesta del servidor, pero la actualización local fue exitosa:', error);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.status === 404) {
        setCategories(prev => prev.filter(category => category.id !== id));
        toast({
          title: "Éxito",
          description: "Categoría eliminada exitosamente",
        });
        return true;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting category');
      }
      
      setCategories(prev => prev.filter(category => category.id !== id));
      toast({
        title: "Éxito",
        description: "Categoría eliminada exitosamente",
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message !== 'Category not found') {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al eliminar la categoría",
          variant: "destructive",
        });
        console.error('Error deleting category:', error);
        return false;
      }
      return true;
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