'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award, Target, RefreshCw, AlertCircle, Play, ExternalLink } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useStandings } from '@/hooks/useStandings';
import { useCategories } from '@/hooks/useCategories';
import { useTranslations } from '@/contexts/TranslationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCategoryName } from '@/utils/category';

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

interface TournamentStandingsProps {
  selectedTournament?: string;
  onTournamentChange?: (tournamentId: string) => void;
}

function translateTournamentFormat(format: string): string {
  const map: Record<string, string> = {
    SIX_PLAYERS: '6 Equipos',
    NINE_PLAYERS: '9 Equipos',
    TWELVE_PLAYERS: '12 Equipos',
    SIXTEEN_PLAYERS: '16 Equipos',
  };
  return map[format] || format;
}

export function TournamentStandings({ selectedTournament, onTournamentChange }: TournamentStandingsProps) {
  const t = useTranslations('dashboard');
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { standings, loading: standingsLoading, error, refetch } = useStandings(selectedTournament || '');
  const { categories } = useCategories();

  // Auto-select first tournament when none selected
  useEffect(() => {
    if (!selectedTournament && tournaments && tournaments.length > 0) {
      onTournamentChange?.(tournaments[0].id);
    }
  }, [tournaments, selectedTournament, onTournamentChange]);

  const formatPlayerNames = (teamInfo: { player1?: string; player2?: string } | null | undefined): string => {
    if (!teamInfo) return 'Equipo desconocido';
    const name1 = String(teamInfo.player1 || '').trim();
    const name2 = String(teamInfo.player2 || '').trim();
    if (name1 && name2) return `${name1} / ${name2}`;
    if (name1) return name1;
    if (name2) return name2;
    return 'Equipo desconocido';
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 2:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
      case 3:
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4" />;
      case 2:
        return <Medal className="h-4 w-4" />;
      case 3:
        return <Award className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const selectedTournamentData = tournaments?.find((t) => t.id === selectedTournament);

  if (tournamentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!selectedTournament) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-purple-500 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('selectTournament')}</h3>
        <p className="text-gray-600 dark:text-gray-400">{t('selectTournamentDescription')}</p>
        {tournaments && tournaments.length > 0 && (
          <div className="mt-4 w-full max-w-xs">
            <select
              value=""
              onChange={(e) => onTournamentChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar categoría</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {getCategoryName(tournament.category_id || '', categories)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('errorLoadingPositions')}
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (standingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!standings?.standings || Object.keys(standings.standings).length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <select
            value={selectedTournament}
            onChange={(e) => onTournamentChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[200px]"
          >
            {tournaments?.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {getCategoryName(tournament.category_id || '', categories)}
              </option>
            ))}
          </select>
          <Link href={`/tournaments/${selectedTournament}/standings`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver clasificaciones completas
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay clasificaciones disponibles
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Las clasificaciones aparecerán una vez que se hayan completado algunos partidos de la fase de grupos.
          </p>
          <Link href={`/tournaments/${selectedTournament}/matches`}>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Play className="h-4 w-4" />
              Ver Partidos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: selector + acciones */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedTournament}
            onChange={(e) => onTournamentChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[200px]"
          >
            {tournaments?.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {getCategoryName(tournament.category_id || '', categories)}
              </option>
            ))}
          </select>
          {selectedTournamentData && (
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
              {getCategoryName(selectedTournamentData.category_id || '', categories)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Link href={`/tournaments/${selectedTournament}/standings`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver completo
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen de Clasificación */}
      {standings.classification_summary && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {standings.classification_summary.qualified_teams?.length || 0}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Equipos Clasificados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {standings.classification_summary.format
                    ? translateTournamentFormat(standings.classification_summary.format)
                    : 'N/A'}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Formato del Torneo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {Object.keys(standings.standings).length}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Grupos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tablas por grupo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(standings.standings).map(([groupNumber, group]) => (
          <Card key={groupNumber} className="shadow-md">
            <CardContent className="p-0">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Grupo {group.group_number}</span>
                </div>
                <Badge variant="outline">{group.teams.length} equipos</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Pos
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Equipo
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        PJ
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        PG
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        PP
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Sets
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.teams.map((team: TeamStanding) => (
                      <tr key={team.team_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${getPositionColor(team.position)}`}
                          >
                            {getPositionIcon(team.position)}
                            {team.position}°
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-semibold">
                                {formatPlayerNames(team.team_info).charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {formatPlayerNames(team.team_info)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {team.team_id.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                          {team.matches_played}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-green-600 dark:text-green-400 font-medium">
                          {team.matches_won}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-red-600 dark:text-red-400 font-medium">
                          {team.matches_lost}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                          {team.sets_won}-{team.sets_lost}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-center">
                          <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs">
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
    </div>
  );
}
