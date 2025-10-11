import { useState, useEffect, useCallback } from 'react';

export interface TeamStanding {
  team_id: string;
  team_info: {
    player1: string; 
    player2: string; 
  };
  position: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  points: number;
}

// Tipo para compatibilidad con CategoryStandings
export interface Standing {
  id: string;
  team: {
    player1: {
      first_name: string;
      last_name: string;
    };
    player2: {
      first_name: string;
      last_name: string;
    };
  };
  games_played: number;
  wins: number;
  losses: number;
  games_won: number;
  games_lost: number;
  sets_won: number;
  sets_lost: number;
  points: number;
}

interface GroupStanding {
  group_id: string;
  group_number: number;
  teams: TeamStanding[];
}

interface StandingsResponse {
  tournament: {
    id: string;
    name: string;
    category: string;
    type: string;
  };
  standings: Record<string, GroupStanding>;
  classification_summary: {
    qualified_teams: Array<{
      team_id: string;
      team_info: any;
      group: number;
      position: number;
    }>;
    format: string;
    classification_rules: any;
  };
  data_source: 'persistent' | 'dynamic';
}

export function useStandings(tournamentId: string) {
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/standings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener las clasificaciones');
      }

      const data = await response.json();
      setStandings(data);
      
    } catch (error: any) {
      console.error('Error fetching standings:', error);
      setError(error.message || 'Error al cargar las clasificaciones');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return {
    standings,
    loading,
    error,
    refetch: fetchStandings
  };
}