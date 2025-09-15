import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, Calendar } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslations } from '@/contexts/TranslationContext';

interface TournamentStanding {
  id: string;
  tournament_id: string;
  team_name: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  points: number;
  position: number;
  category_name?: string;
}

interface TournamentStandingsProps {
  selectedTournament?: string;
  onTournamentChange?: (tournamentId: string) => void;
}

export function TournamentStandings({ selectedTournament, onTournamentChange }: TournamentStandingsProps) {
  const t = useTranslations('dashboard');
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { categories } = useCategories();

  useEffect(() => {
    const fetchStandings = async () => {
      if (!selectedTournament) {
        setStandings([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Por ahora, vamos a simular que no hay standings hasta que la API esté lista
        // Esto evita errores y muestra un mensaje amigable
        setStandings([]);
        
        // TODO: Implementar cuando la API esté lista
        /*
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const url = `${baseUrl}/tournaments/${selectedTournament}/standings`;

        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            setStandings([]);
            return;
          }
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || 
            `Error al cargar las posiciones: ${response.status} ${response.statusText}`
          );
        }
        
        const data = await response.json();
        
        // El backend puede devolver un array o un objeto con standings
        const standingsData = Array.isArray(data) ? data : data.standings || [];
        setStandings(standingsData);
        */
        
      } catch (err) {
        console.error('Error fetching tournament standings:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setStandings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [selectedTournament]);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">
          {position}
        </span>;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700';
      default:
        return 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
  };

  if (isLoading || tournamentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('errorLoadingPositions')}
        </h3>
        <p className="text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (!selectedTournament) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-purple-500 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('selectTournament')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('selectTournamentDescription')}
        </p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-purple-500 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('positionsComingSoon')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('positionsComingSoonDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de torneo */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tabla de Posiciones
        </h3>
        <select
          value={selectedTournament}
          onChange={(e) => onTournamentChange?.(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Seleccionar torneo</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de posiciones */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pos.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PJ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PG
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sets
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Games
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
              {standings
                .sort((a, b) => a.position - b.position)
                .map((team, index) => (
                <tr 
                  key={team.id}
                  className={`${getPositionStyle(team.position)} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPositionIcon(team.position)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.team_name}
                        </div>
                        {team.category_name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.category_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {team.matches_played}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {team.matches_won}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {team.matches_lost}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {team.sets_won}-{team.sets_lost}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {team.games_won}-{team.games_lost}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <span className="font-medium">PJ:</span>
          <span>Partidos Jugados</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">PG:</span>
          <span>Partidos Ganados</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">PP:</span>
          <span>Partidos Perdidos</span>
        </div>
      </div>
    </div>
  );
}
