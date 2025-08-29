import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Court } from '@/types/court';

interface CreateCourtData {
  name: string;
  photo: File | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCourts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/courts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error fetching courts');
      const data = await response.json();
      setCourts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar las canchas",
        variant: "destructive",
      });
      console.error('Error fetching courts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const createCourt = async (courtData: CreateCourtData) => {
    try {
      setIsLoading(true);
      
      if (!courtData.photo) {
        throw new Error('La foto es requerida');
      }

      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const sanitizedFileName = courtData.photo.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .toLowerCase();

      const formData = new FormData();
      formData.append('name', courtData.name);
      
      const sanitizedFile = new File(
        [courtData.photo],
        `${Date.now()}_${sanitizedFileName}`,
        { type: courtData.photo.type }
      );
      formData.append('file', sanitizedFile);

      const response = await fetch(`${API_URL}/courts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating court');
      }
      
      const { court } = await response.json();
      setCourts(prev => [...prev, court]);
      toast({
        title: "Éxito",
        description: "Cancha creada exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la cancha",
        variant: "destructive",
      });
      console.error('Error creating court:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourt = async (id: string, courtData: CreateCourtData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const formData = new FormData();
      formData.append('name', courtData.name);
      if (courtData.photo) {
        formData.append('file', courtData.photo);
      }

      const response = await fetch(`${API_URL}/courts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating court');
      }
      
      const { court } = await response.json();
      setCourts(prev => prev.map(c => c.id === id ? court : c));
      toast({
        title: "Éxito",
        description: "Cancha actualizada exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la cancha",
        variant: "destructive",
      });
      console.error('Error updating court:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourt = async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/courts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error deleting court');
      }
      
      setCourts(prev => prev.filter(court => court.id !== id));
      toast({
        title: "Éxito",
        description: "Cancha eliminada exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la cancha",
        variant: "destructive",
      });
      console.error('Error deleting court:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    courts,
    isLoading,
    fetchCourts,
    createCourt,
    updateCourt,
    deleteCourt
  };
} 