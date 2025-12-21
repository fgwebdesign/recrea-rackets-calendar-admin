import { useState, useEffect, useCallback } from 'react';
import { Standing } from './useStandings';
import { getLeagueStandings } from '@/services/leagueService';

export function useLeagueStandings(leagueId: string | undefined) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    if (!leagueId) {
      setStandings([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getLeagueStandings(leagueId);
      
      // Transformar los datos del backend al formato esperado por CategoryStandings
      const formattedStandings: Standing[] = (data.standings || []).map((standing: any) => ({
        id: standing.id,
        team: standing.team ? {
          player1: {
            first_name: standing.team.player1?.first_name || '',
            last_name: standing.team.player1?.last_name || ''
          },
          player2: {
            first_name: standing.team.player2?.first_name || '',
            last_name: standing.team.player2?.last_name || ''
          }
        } : {
          player1: { first_name: '', last_name: '' },
          player2: { first_name: '', last_name: '' }
        },
        games_played: standing.games_played || 0,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        games_won: standing.games_won || 0,
        games_lost: standing.games_lost || 0,
        sets_won: standing.sets_won || 0,
        sets_lost: standing.sets_lost || 0,
        points: standing.points || 0
      }));
      
      setStandings(formattedStandings);
    } catch (error: any) {
      console.error('Error fetching league standings:', error);
      setError(error.message || 'Error al cargar las clasificaciones');
      setStandings([]);
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return {
    standings,
    isLoading,
    error,
    refetch: fetchStandings
  };
}

