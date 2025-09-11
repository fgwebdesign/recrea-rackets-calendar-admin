import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Sponsor } from '@/types/sponsor';

interface CreateSponsorData {
  name: string;
  logo: File | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSponsors = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/sponsors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error fetching sponsors');
      const data = await response.json();
      setSponsors(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los patrocinadores",
        variant: "destructive",
      });
      console.error('Error fetching sponsors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const createSponsor = async (sponsorData: CreateSponsorData) => {
    try {
      setIsLoading(true);
      
      if (!sponsorData.logo) {
        throw new Error('El logo es requerido');
      }

      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const sanitizedFileName = sponsorData.logo.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .toLowerCase();

      const formData = new FormData();
      formData.append('name', sponsorData.name);
      
      const sanitizedFile = new File(
        [sponsorData.logo],
        `${Date.now()}_${sanitizedFileName}`,
        { type: sponsorData.logo.type }
      );
      formData.append('file', sanitizedFile);

      const response = await fetch(`${API_URL}/sponsors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating sponsor');
      }
      
      const { sponsor } = await response.json();
      setSponsors(prev => [...prev, sponsor]);
      toast({
        title: "Éxito",
        description: "Patrocinador creado exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el patrocinador",
        variant: "destructive",
      });
      console.error('Error creating sponsor:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSponsor = async (id: string, sponsorData: CreateSponsorData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const formData = new FormData();
      formData.append('name', sponsorData.name);
      if (sponsorData.logo) {
        formData.append('file', sponsorData.logo);
      }

      const response = await fetch(`${API_URL}/sponsors/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating sponsor');
      }
      
      const { sponsor } = await response.json();
      setSponsors(prev => prev.map(s => s.id === id ? sponsor : s));
      toast({
        title: "Éxito",
        description: "Patrocinador actualizado exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el patrocinador",
        variant: "destructive",
      });
      console.error('Error updating sponsor:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSponsor = async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/sponsors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error deleting sponsor');
      }
      
      setSponsors(prev => prev.filter(sponsor => sponsor.id !== id));
      toast({
        title: "Éxito",
        description: "Patrocinador eliminado exitosamente",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el patrocinador",
        variant: "destructive",
      });
      console.error('Error deleting sponsor:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sponsors,
    isLoading,
    fetchSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor
  };
}