import { useState, useEffect, useCallback, useRef } from 'react';
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
  // ✅ NUEVO: AbortController para cancelar requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const { includeCourts = true, isActive = 'true' } = options;

  const fetchVenues = useCallback(async () => {
    // Cancelar request anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
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
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar las sedes');
      }
      
      const data = await response.json();
      setVenues(data.venues || []);
    } catch (err) {
      // ✅ Ignorar errores de cancelación
      if (err instanceof Error && err.name === 'AbortError') return;
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
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchVenues]);

  // ✅ OPTIMIZADO: Optimistic update - actualiza UI inmediatamente
  const createVenue = async (venueData: Partial<Venue>) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No estás autenticado');

    try {
      setLoading(true);
      
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
      // ✅ Actualizar estado local inmediatamente en lugar de refetch
      setVenues(prev => [...prev, data.venue]);
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

  // ✅ OPTIMIZADO: Optimistic update
  const updateVenue = async (id: string, venueData: Partial<Venue>) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No estás autenticado');

    // Guardar estado anterior para rollback
    const previousVenues = [...venues];
    
    try {
      // ✅ Optimistic update: actualizar UI inmediatamente
      setVenues(prev => prev.map(v => v.id === id ? { ...v, ...venueData } : v));
      
      const response = await fetch(`${API_URL}/venues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(venueData)
      });

      if (!response.ok) {
        // Rollback en caso de error
        setVenues(previousVenues);
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar la sede');
      }

      const data = await response.json();
      // Actualizar con datos reales del servidor
      setVenues(prev => prev.map(v => v.id === id ? data.venue || { ...v, ...venueData } : v));
      
      toast({
        title: "Éxito",
        description: "Sede actualizada exitosamente",
      });
      return data;
    } catch (err) {
      // Rollback en caso de error
      setVenues(previousVenues);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la sede';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error updating venue:', err);
      throw err;
    }
  };

  // ✅ OPTIMIZADO: Optimistic update
  const deleteVenue = async (id: string, force: boolean = false) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No estás autenticado');

    // Guardar estado anterior para rollback
    const previousVenues = [...venues];
    
    try {
      // ✅ Optimistic update: eliminar de UI inmediatamente
      setVenues(prev => prev.filter(v => v.id !== id));

      const response = await fetch(`${API_URL}/venues/${id}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Rollback en caso de error
        setVenues(previousVenues);
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar la sede');
      }

      toast({
        title: "Éxito",
        description: "Sede eliminada exitosamente",
      });
    } catch (err) {
      // Rollback en caso de error
      setVenues(previousVenues);
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la sede';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error deleting venue:', err);
      throw err;
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

