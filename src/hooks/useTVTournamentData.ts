'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TeamStanding } from './useStandings';

const POLL_INTERVAL_MS = 60000; // 60 segundos

interface GroupStanding {
  group_number: number;
  teams: TeamStanding[];
}

interface ClassificationSummary {
  qualified_teams?: Array<{ team_id: string; team_info?: unknown; group: number; position: number }>;
  format?: string;
}

interface TVTournamentData {
  tournament: { id: string; name: string; category_id?: string } | null;
  teams: Record<string, unknown>[];
  matches: Record<string, unknown>[];
  groups: Record<string, unknown>[];
  standings: Record<string, GroupStanding> | null;
  classification_summary?: ClassificationSummary;
}

interface UseTVTournamentDataReturn {
  data: TVTournamentData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTVTournamentData(tournamentId: string | null): UseTVTournamentDataReturn {
  const [data, setData] = useState<TVTournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!tournamentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

    try {
      const [fullDetailsRes, standingsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/full-details`, {
          signal,
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/standings`, {
          signal,
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
        }),
      ]);

      if (!mountedRef.current) return;

      if (!fullDetailsRes.ok) {
        throw new Error('Error al obtener datos del torneo');
      }

      const fullDetails = await fullDetailsRes.json() as {
        tournament?: { id: string; name: string; category_id?: string };
        teams?: Record<string, unknown>[];
        matches?: Record<string, unknown>[];
        groups?: Record<string, unknown>[];
      };
      let standingsData: { standings?: Record<string, GroupStanding>; classification_summary?: ClassificationSummary } = {};

      if (standingsRes.ok) {
        standingsData = await standingsRes.json();
      }

      setData({
        tournament: fullDetails.tournament || null,
        teams: fullDetails.teams || [],
        matches: fullDetails.matches || [],
        groups: fullDetails.groups || [],
        standings: standingsData.standings || null,
        classification_summary: standingsData.classification_summary,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (!mountedRef.current) return;
      console.error('Error fetching TV tournament data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [tournamentId]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;

    if (!tournamentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const ac = new AbortController();

    const runFetch = () => {
      if (document.hidden) return;
      fetchData(ac.signal);
    };

    runFetch();

    intervalRef.current = setInterval(() => {
      if (document.hidden) return;
      fetchData(ac.signal);
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (!document.hidden && tournamentId) {
        fetchData(ac.signal);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      ac.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tournamentId, fetchData]);

  return { data, loading, error, refetch };
}
