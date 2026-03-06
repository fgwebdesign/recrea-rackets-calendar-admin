import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Professor, CreateProfessorData, UpdateProfessorData } from '@/types/professor';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProfessors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfessors = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/professors/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error fetching professors');
      const data = await response.json();
      setProfessors(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los profesores",
        variant: "destructive",
      });
      console.error('Error fetching professors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  const createProfessor = async (professorData: CreateProfessorData) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const formData = new FormData();
      formData.append('name', professorData.name);
      formData.append('description', professorData.description);
      formData.append('specializations', JSON.stringify(professorData.specializations));
      formData.append('experience_years', professorData.experience_years.toString());
      formData.append('availability_days', JSON.stringify(professorData.availability_days));
      formData.append('availability_hours', professorData.availability_hours);
      formData.append('hourly_rate', String(professorData.hourly_rate ?? 0));
      if (professorData.commission_percent !== undefined && professorData.commission_percent !== null && professorData.commission_percent !== '') {
        formData.append('commission_percent', String(professorData.commission_percent));
      } else {
        formData.append('commission_percent', '');
      }
      if (professorData.instagram_handle) {
        formData.append('instagram_handle', professorData.instagram_handle);
      }
      if (professorData.whatsapp_number) {
        formData.append('whatsapp_number', professorData.whatsapp_number);
      }
      if (professorData.photo) {
        const sanitizedFileName = professorData.photo.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .toLowerCase();
        
        const sanitizedFile = new File(
          [professorData.photo],
          `${Date.now()}_${sanitizedFileName}`,
          { type: professorData.photo.type }
        );
        formData.append('file', sanitizedFile);
      }

      const response = await fetch(`${API_URL}/professors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating professor');
      }
      
      const { professor } = await response.json();
      setProfessors(prev => [...prev, professor]);
      toast({
        title: "Éxito",
        description: "Profesor creado exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el profesor",
        variant: "destructive",
      });
      console.error('Error creating professor:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfessor = async (id: string, professorData: UpdateProfessorData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const formData = new FormData();
      
      if (professorData.name !== undefined) formData.append('name', professorData.name);
      if (professorData.description !== undefined) formData.append('description', professorData.description);
      if (professorData.specializations !== undefined) formData.append('specializations', JSON.stringify(professorData.specializations));
      if (professorData.experience_years !== undefined) formData.append('experience_years', professorData.experience_years.toString());
      if (professorData.availability_days !== undefined) formData.append('availability_days', JSON.stringify(professorData.availability_days));
      if (professorData.availability_hours !== undefined) formData.append('availability_hours', professorData.availability_hours);
      if (professorData.hourly_rate !== undefined) formData.append('hourly_rate', String(professorData.hourly_rate));
      if (professorData.commission_percent !== undefined) formData.append('commission_percent', professorData.commission_percent === null || professorData.commission_percent === '' ? '' : String(professorData.commission_percent));
      if (professorData.instagram_handle !== undefined) formData.append('instagram_handle', professorData.instagram_handle || '');
      if (professorData.whatsapp_number !== undefined) formData.append('whatsapp_number', professorData.whatsapp_number || '');
      if (professorData.is_active !== undefined) formData.append('is_active', professorData.is_active.toString());
      
      if (professorData.photo) {
        formData.append('file', professorData.photo);
      }

      const response = await fetch(`${API_URL}/professors/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating professor');
      }
      
      const { professor } = await response.json();
      setProfessors(prev => prev.map(p => p.id === id ? professor : p));
      toast({
        title: "Éxito",
        description: "Profesor actualizado exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el profesor",
        variant: "destructive",
      });
      console.error('Error updating professor:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProfessor = async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/professors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error deleting professor');
      }
      
      setProfessors(prev => prev.filter(professor => professor.id !== id));
      toast({
        title: "Éxito",
        description: "Profesor eliminado exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el profesor",
        variant: "destructive",
      });
      console.error('Error deleting professor:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    professors,
    isLoading,
    fetchProfessors,
    createProfessor,
    updateProfessor,
    deleteProfessor
  };
}
