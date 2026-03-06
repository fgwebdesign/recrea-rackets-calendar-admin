import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import type {
  ProfessorClass,
  CreateProfessorClassData,
  UpdateProfessorClassData,
  ProfessorClassesSummary,
} from '@/types/professor';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useProfessorClasses(filters?: {
  professor_id?: string;
  from_date?: string;
  to_date?: string;
  venue_id?: string;
}) {
  const [classes, setClasses] = useState<ProfessorClass[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClasses = useCallback(
    async (page = 1, limit = 50) => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No estás autenticado');
        const params = new URLSearchParams();
        if (filters?.professor_id) params.set('professor_id', filters.professor_id);
        if (filters?.from_date) params.set('from_date', filters.from_date);
        if (filters?.to_date) params.set('to_date', filters.to_date);
        if (filters?.venue_id) params.set('venue_id', filters.venue_id);
        params.set('page', String(page));
        params.set('limit', String(limit));
        const res = await fetch(`${API_URL}/professors/classes?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Error al cargar las clases');
        }
        const data = await res.json();
        setClasses(data.classes ?? []);
        setTotal(data.total ?? 0);
      } catch (e) {
        toast({
          title: 'Error',
          description: e instanceof Error ? e.message : 'Error al cargar las clases',
          variant: 'destructive',
        });
        setClasses([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [filters?.professor_id, filters?.from_date, filters?.to_date, filters?.venue_id]
  );

  const createClass = useCallback(async (payload: CreateProfessorClassData) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No estás autenticado');
    const res = await fetch(`${API_URL}/professors/classes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al registrar la clase');
    return data.class as ProfessorClass;
  }, []);

  const updateClass = useCallback(
    async (classId: string, payload: UpdateProfessorClassData) => {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');
      const res = await fetch(`${API_URL}/professors/classes/${classId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar la clase');
      return data.class as ProfessorClass;
    },
    []
  );

  const deleteClass = useCallback(async (classId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No estás autenticado');
    const res = await fetch(`${API_URL}/professors/classes/${classId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error al eliminar la clase');
    }
  }, []);

  return {
    classes,
    total,
    isLoading,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
  };
}

export function useProfessorClassesSummary(filters: {
  from_date?: string;
  to_date?: string;
  professor_id?: string;
}) {
  const [summary, setSummary] = useState<ProfessorClassesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');
      const params = new URLSearchParams();
      if (filters.from_date) params.set('from_date', filters.from_date);
      if (filters.to_date) params.set('to_date', filters.to_date);
      if (filters.professor_id) params.set('professor_id', filters.professor_id);
      const res = await fetch(`${API_URL}/professors/classes/summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al cargar el resumen');
      }
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al cargar el resumen',
        variant: 'destructive',
      });
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters.from_date, filters.to_date, filters.professor_id]);

  return { summary, isLoading, fetchSummary };
}
