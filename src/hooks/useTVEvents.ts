'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TVEvent {
  common_code: string;
  display_name: string;
  first_tournament_id: string;
}

interface UseTVEventsReturn {
  events: TVEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTVEvents(): UseTVEventsReturn {
  const [events, setEvents] = useState<TVEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/tv/events`, {
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
      });
      if (!response.ok) throw new Error('Error al cargar eventos');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
