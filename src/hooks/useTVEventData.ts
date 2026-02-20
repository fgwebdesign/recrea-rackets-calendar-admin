'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TeamStanding } from './useStandings';

const POLL_INTERVAL_MS = 60000;

interface GroupStanding {
  group_number: number;
  teams: TeamStanding[];
  category_name?: string;
}

interface PlayerInfo {
  first_name?: string;
  last_name?: string;
}

interface TeamInfo {
  player1?: PlayerInfo;
  player2?: PlayerInfo;
}

export interface TVMatch {
  id: string;
  start_time?: string;
  match_day?: string;
  tournament_day?: number;
  court_name?: string;
  venue_name?: string;
  round?: string;
  elimination_round?: string;
  home_team?: TeamInfo;
  away_team?: TeamInfo;
  home_team_id?: string;
  away_team_id?: string;
  status?: string;
}

export interface TVTeam {
  id: string;
  team_id?: string;
  teams?: TeamInfo;
  team?: TeamInfo;
}

interface TVEventData {
  tournament: { id: string; name: string } | null;
  teams: TVTeam[];
  matches: TVMatch[];
  groups: Record<string, unknown>[];
  standings: Record<string, GroupStanding> | null;
  classification_summary?: { qualified_teams?: unknown[]; format?: string };
}

interface UseTVEventDataReturn {
  data: TVEventData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTVEventData(commonCode: string | null): UseTVEventDataReturn {
  const [data, setData] = useState<TVEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!commonCode) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/tv/event/${encodeURIComponent(commonCode)}`,
        {
          signal,
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
        }
      );

      if (!mountedRef.current) return;

      if (!response.ok) {
        throw new Error('Error al obtener datos del evento');
      }

      const raw = await response.json();

      setData({
        tournament: raw.tournament || null,
        teams: raw.teams || [],
        matches: raw.matches || [],
        groups: raw.groups || [],
        standings: raw.standings || null,
        classification_summary: raw.classification_summary,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (!mountedRef.current) return;
      console.error('Error fetching TV event data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [commonCode]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;

    if (!commonCode) {
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

    intervalRef.current = setInterval(runFetch, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (!document.hidden && commonCode) fetchData(ac.signal);
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
  }, [commonCode, fetchData]);

  return { data, loading, error, refetch };
}
