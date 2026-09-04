import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface Standing {
  id: string;
  league_id: string;
  team_id: string;
  points: number;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  sets_difference: number;
  group_name?: 'A' | 'B' | null;
  team?: {
    display_name?: string | null;
    player1: {
      first_name: string;
      last_name: string;
    };
    player2: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface GroupedStandings {
  groupA: Standing[];
  groupB: Standing[];
}

export interface StandingsData {
  standings: Standing[] | GroupedStandings;
  hasGroups: boolean;
}

export function useStandings(categoryId?: string) {
  const [standingsData, setStandingsData] = useState<StandingsData>({
    standings: [],
    hasGroups: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      console.log('🚀 useStandings hook triggered with categoryId:', categoryId);
      
      if (!categoryId) {
        console.log('⚠️ No categoryId provided, clearing standings');
        setStandingsData({ standings: [], hasGroups: false });
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Primero obtenemos las ligas de la categoría
        console.log('🔍 Fetching leagues for category:', categoryId);
        const { data: leagues, error: leaguesError } = await supabase
          .from('leagues')
          .select('id, name, status, category_id')
          .eq('category_id', categoryId);

        if (leaguesError) {
          console.error('❌ Error fetching leagues:', leaguesError);
          throw leaguesError;
        }
        
        console.log('📋 Found leagues:', leagues);
        
        // También buscar todas las ligas para debug
        const { data: allLeagues, error: allLeaguesError } = await supabase
          .from('leagues')
          .select('id, name, status, category_id')
          .limit(10);
        
        if (!allLeaguesError) {
          console.log('🌍 All leagues in database (first 10):', allLeagues);
        }
        
        if (!leagues?.length) {
          console.log('⚠️ No active leagues found for category:', categoryId);
          setStandingsData({ standings: [], hasGroups: false });
          return;
        }

        // Usar el endpoint correcto del backend para cada liga
        const allStandings: Standing[] = [];
        let hasGroupsInCategory = false;
        const groupedStandings: GroupedStandings = { groupA: [], groupB: [] };
        
        for (const league of leagues) {
          try {
            console.log(`🏆 Fetching standings for league: ${league.id}`);
            const token = localStorage.getItem('adminToken');
            if (!token) {
              throw new Error('No hay token de autenticación');
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL}/leagues/standings/${league.id}`;
            console.log(`📡 Making request to: ${url}`);

            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            console.log(`📊 Response status for league ${league.id}:`, response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Error fetching standings for league ${league.id}:`, response.status, errorText);
              continue; // Continuar con la siguiente liga si hay error
            }

            const data = await response.json();
            console.log(`✅ Standings data for league ${league.id}:`, data);
            
            // Verificar si la respuesta tiene grupos
            if (data.standings && typeof data.standings === 'object' && 'groupA' in data.standings && 'groupB' in data.standings) {
              console.log(`📊 Liga con grupos detectada: ${league.id}`);
              hasGroupsInCategory = true;
              groupedStandings.groupA.push(...data.standings.groupA);
              groupedStandings.groupB.push(...data.standings.groupB);
            } else if (data.standings && Array.isArray(data.standings)) {
              console.log(`📈 Adding ${data.standings.length} standings from league ${league.id}`);
              allStandings.push(...data.standings);
            } else {
              console.log(`⚠️ No standings data found for league ${league.id}`);
            }
          } catch (leagueError) {
            console.error(`❌ Error fetching standings for league ${league.id}:`, leagueError);
            // Continuar con la siguiente liga si hay error
          }
        }

        // Retornar los datos según si hay grupos o no
        if (hasGroupsInCategory) {
          console.log(`🎯 Standings con grupos - Grupo A: ${groupedStandings.groupA.length}, Grupo B: ${groupedStandings.groupB.length}`);
          setStandingsData({
            standings: groupedStandings,
            hasGroups: true
          });
        } else {
          console.log(`🎯 Total standings collected: ${allStandings.length}`);
          setStandingsData({
            standings: allStandings,
            hasGroups: false
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar la tabla de posiciones';
        console.error('Error fetching standings:', error);
        toast.error('Error al cargar la tabla de posiciones');
        setError(new Error(errorMessage));
        setStandingsData({ standings: [], hasGroups: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [categoryId]);

  return {
    ...standingsData,
    isLoading,
    error
  };
} 