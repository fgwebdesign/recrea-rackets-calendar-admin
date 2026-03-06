import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { ClubSettings } from '@/types/professor';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useClubSettings() {
  const [clubSettings, setClubSettings] = useState<ClubSettings>({ club_commission_percent: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchClubSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');
      const res = await fetch(`${API_URL}/settings/club`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar la configuración del club');
      const data = await res.json();
      setClubSettings({ club_commission_percent: data.club_commission_percent ?? 0 });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al cargar la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateClubSettings = useCallback(async (payload: ClubSettings) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No estás autenticado');
    const res = await fetch(`${API_URL}/settings/club`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al actualizar la configuración');
    setClubSettings({ club_commission_percent: payload.club_commission_percent });
    return data;
  }, []);

  return { clubSettings, isLoading, fetchClubSettings, updateClubSettings };
}
