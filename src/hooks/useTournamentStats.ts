import { useState, useEffect } from 'react';

interface TournamentOverviewStats {
  total_tournaments: number;
  active_tournaments: number;
  completed_tournaments: number;
  upcoming_tournaments: number;
  total_teams: number;
  paid_teams: number;
  payment_rate: number;
  tournament_types: Record<string, number>;
}

interface TournamentPaymentStats {
  tournament_name: string;
  tournament_type: string;
  inscription_cost: number;
  total_categories: number;
  total_teams: number;
  total_potential_revenue: number;
  paid_teams: number;
  pending_teams: number;
  failed_teams: number;
  actual_revenue: number;
  pending_revenue: number;
  payment_rate: number;
  categories_breakdown: Array<{
    category_name: string;
    teams: number;
    paid_teams: number;
    pending_teams: number;
    failed_teams: number;
    revenue: number;
    pending_revenue: number;
  }>;
}

interface TournamentPeriodStats {
  total_tournaments: number;
  total_categories: number;
  total_teams: number;
  total_revenue: number;
  total_paid_teams: number;
  average_payment_rate: number;
  monthly_breakdown: Array<{
    month: string;
    tournaments: number;
    categories: number;
    teams: number;
    revenue: number;
    paid_teams: number;
    payment_rate: number;
  }>;
}

export function useTournamentOverviewStats() {
  const [data, setData] = useState<TournamentOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/stats/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error obteniendo estadísticas generales');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useTournamentPaymentStats(tournamentId: string) {
  const [data, setData] = useState<TournamentPaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/stats/payments/${tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error obteniendo estadísticas de pagos');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId]);

  return { data, loading, error };
}

export function useTournamentPeriodStats(startDate?: string, endDate?: string) {
  const [data, setData] = useState<TournamentPeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/stats/period?start_date=${startDate}&end_date=${endDate}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error obteniendo estadísticas del período');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  return { data, loading, error };
}
