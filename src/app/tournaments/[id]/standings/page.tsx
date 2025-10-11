'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/hooks/useTournaments';
import { useStandings } from '@/hooks/useStandings';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Trophy,
  Users,
  Target,
  RefreshCw,
  AlertCircle,
  Medal,
  Award,
  TrendingUp,
  Play
} from 'lucide-react';
import { getCategoryName } from '@/utils/category';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamStanding {
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

export default function TournamentStandingsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  
  const { tournament, loading: tournamentLoading, error: tournamentError } = useTournament(tournamentId);
  const { standings, loading, error, refetch } = useStandings(tournamentId);
  const { categories } = useCategories();

  // Formatear nombres de jugadores
  const formatPlayerNames = (teamInfo: any): string => {
    if (!teamInfo?.player1 || !teamInfo?.player2) return 'Equipo desconocido';
    
    // El backend devuelve player1 y player2 como strings directamente
    const name1 = teamInfo.player1.toString().trim();
    const name2 = teamInfo.player2.toString().trim();
    
    return `${name1} / ${name2}`;
  };

  // Obtener color de posición
  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 2: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
      case 3: return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  // Obtener ícono de posición
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-4 w-4" />;
      case 2: return <Medal className="h-4 w-4" />;
      case 3: return <Award className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Traducir formato del torneo
  const translateTournamentFormat = (format: string): string => {
    const formatTranslations: Record<string, string> = {
      'SIX_PLAYERS': '6 Jugadores',
      'NINE_PLAYERS': '9 Jugadores', 
      'TWELVE_PLAYERS': '12 Jugadores',
      'SIXTEEN_PLAYERS': '16 Jugadores'
    };
    
    return formatTranslations[format] || format;
  };

  if (loading || tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((j) => (
                        <Skeleton key={j} className="h-16 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || tournamentError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Error al cargar las clasificaciones: {error || tournamentError}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al torneo
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Clasificaciones - {tournament?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {getCategoryName(tournament?.category_id || '', categories)}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Tabla de posiciones y clasificaciones por grupo
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={refetch}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen de Clasificación */}
        {standings?.classification_summary && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Trophy className="h-5 w-5" />
                Resumen de Clasificación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {standings.classification_summary.qualified_teams?.length || 0}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Equipos Clasificados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {standings.classification_summary.format ? translateTournamentFormat(standings.classification_summary.format) : 'N/A'}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Formato del Torneo
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {Object.keys(standings.standings || {}).length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Grupos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tablas de Clasificación por Grupo */}
        {standings?.standings ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(standings.standings).map(([groupNumber, group]) => (
              <Card key={groupNumber} className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    Grupo {group.group_number}
                    <Badge variant="outline" className="ml-auto">
                      {group.teams.length} equipos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Pos
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Equipo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            PJ
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            PG
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            PP
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Sets
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Pts
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {group.teams.map((team) => (
                          <tr key={team.team_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getPositionColor(team.position)}`}>
                                {getPositionIcon(team.position)}
                                {team.position}°
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {formatPlayerNames(team.team_info).charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatPlayerNames(team.team_info)}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {team.team_id.slice(-8)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              {team.matches_played}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                {team.matches_won}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                {team.matches_lost}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              {team.sets_won}-{team.sets_lost}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className="bg-blue-500 hover:bg-blue-500 text-white">
                                {team.points}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Trophy className="h-12 w-12 text-gray-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    No hay clasificaciones disponibles
                  </h3>
                  
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Las clasificaciones aparecerán una vez que se hayan completado algunos partidos de la fase de grupos.
                  </p>
                  
                  <Button
                    onClick={() => router.push(`/tournaments/${tournamentId}/matches`)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Ver Partidos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
