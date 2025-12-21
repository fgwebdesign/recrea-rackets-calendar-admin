import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Venue } from '@/types/venue';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UseVenuesOptions {
  includeCourts?: boolean;
  isActive?: 'true' | 'false' | 'all';
}

export function useVenues(options: UseVenuesOptions = {}) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { includeCourts = true, isActive = 'true' } = options;

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const params = new URLSearchParams();
      if (includeCourts) params.append('include_courts', 'true');
      if (isActive !== 'all') params.append('is_active', isActive);
      
      const response = await fetch(`${API_URL}/venues?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar las sedes');
      }
      
      const data = await response.json();
      setVenues(data.venues || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  }, [includeCourts, isActive]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const createVenue = async (venueData: Partial<Venue>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/venues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(venueData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la sede');
      }

      const data = await response.json();
      await fetchVenues(); // Refetch
      toast({
        title: "Éxito",
        description: "Sede creada exitosamente",
      });
      return data.venue;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la sede';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error creating venue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVenue = async (id: string, venueData: Partial<Venue>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/venues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(venueData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar la sede');
      }

      await fetchVenues(); // Refetch
      toast({
        title: "Éxito",
        description: "Sede actualizada exitosamente",
      });
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la sede';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error updating venue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVenue = async (id: string, force: boolean = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/venues/${id}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar la sede');
      }

      await fetchVenues(); // Refetch
      toast({
        title: "Éxito",
        description: "Sede eliminada exitosamente",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la sede';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error deleting venue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getVenueById = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/venues/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener la sede');
      }

      const data = await response.json();
      return data.venue;
    } catch (err) {
      console.error('Error fetching venue:', err);
      throw err;
    }
  };

  const getCourtsByVenue = async (venueId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const response = await fetch(`${API_URL}/venues/${venueId}/courts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener las canchas');
      }

      const data = await response.json();
      return data.courts || [];
    } catch (err) {
      console.error('Error fetching courts by venue:', err);
      throw err;
    }
  };

  return {
    venues,
    loading,
    error,
    refetch: fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    getVenueById,
    getCourtsByVenue,
    // Helpers
    getDefaultVenue: () => venues.find(v => v.is_default),
    getVenueByIdSync: (id: string) => venues.find(v => v.id === id),
    totalCourts: venues.reduce((sum, v) => sum + (v.courts_count || 0), 0)
  };
}

