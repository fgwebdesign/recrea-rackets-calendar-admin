'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon, TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Plus, Settings, Loader2, Play, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCategoryName } from '@/utils/category';
import { toast } from '@/components/ui/use-toast';
import { useState, useMemo } from 'react';
import { GroupFranjaRescheduler } from '@/components/Tournaments/admin/GroupFranjaRescheduler';
import type { Franja } from '@/services/tournamentSchedulingService';

export default function TournamentGroupsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [isGeneratingAmericanoMatches, setIsGeneratingAmericanoMatches] = useState(false);
  const [reschedulingGroup, setReschedulingGroup] = useState<{ id: string; group_number: number; assigned_franja: string | null } | null>(null);

  const { 
    tournament, 
    groups,
    teams,
    loading, 
    error,
    refetch
  } = useTournament(tournamentId);

  // Extraer franjas de fase de grupos del torneo
  const tournamentFranjas: Franja[] = useMemo(() => {
    const slots: Franja[] = (tournament as unknown as { group_time_slots?: Franja[] })?.group_time_slots || [];
    return slots;
  }, [tournament]);
  
  const { categories } = useCategories();

  // Función para obtener equipos de un grupo específico
  const getTeamsInGroup = (groupTeams: string[]) => {
    if (!Array.isArray(teams) || !Array.isArray(groupTeams)) return [];
    
    return groupTeams.map(teamId => {
      const team = teams.find(t => t.team_id === teamId);
      return team;
    }).filter(Boolean);
  };

  // Tipo para equipo con jugadores (uso en grupos)
  type TeamWithPlayers = {
    team_id?: string;
    teams?: {
      player1?: { first_name?: string; last_name?: string };
      player2?: { first_name?: string; last_name?: string };
    };
  };

  // Función para formatear nombres de jugadores
  const formatPlayerNames = (team: TeamWithPlayers | null | undefined) => {
    if (!team?.teams) return 'Equipo desconocido';
    
    const player1 = team.teams.player1;
    const player2 = team.teams.player2;
    
    if (player1?.first_name && player2?.first_name) {
      return `${player1.first_name} ${player1.last_name || ''} / ${player2.first_name} ${player2.last_name || ''}`;
    } else if (player1?.first_name) {
      return `${player1.first_name} ${player1.last_name || ''}`;
    } else if (player2?.first_name) {
      return `${player2.first_name} ${player2.last_name || ''}`;
    }
    
    return `Equipo #${team.team_id?.slice(-4) || 'N/A'}`;
  };

  // Función para obtener inicial del equipo
  const getTeamInitial = (team: TeamWithPlayers | null | undefined) => {
    if (team?.teams?.player1?.first_name) {
      return team.teams.player1.first_name[0].toUpperCase();
    } else if (team?.teams?.player2?.first_name) {
      return team.teams.player2.first_name[0].toUpperCase();
    }
    return '?';
  };

  // Función para generar grupos automáticamente usando auto-grouping
  const handleGenerateGroups = async () => {
    if (!canGenerateGroups) return;

    setIsGeneratingGroups(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      // ✅ Usar el endpoint de auto-grouping del backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/generate-groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al generar grupos automáticamente');
      }

      // Mostrar mensaje de éxito; si es parcial (equipos sin asignar), aviso no bloqueante
      const isRegenerating = totalGroups > 0;
      const isPartial = data.partial === true && (data.conflicts?.length ?? 0) > 0;
      toast({
        title: `¡${isRegenerating ? 'Grupos regenerados' : 'Grupos generados'}!`,
        description: isPartial
          ? data.message ?? `Se crearon ${data.groups_created?.length ?? 0} grupos. ${data.conflicts?.length ?? 0} equipo(s) no pudieron ser asignados; revisá conflictos o asigná manualmente.`
          : `Se ${isRegenerating ? 'reorganizaron' : 'crearon'} ${data.groups_created?.length || 0} grupos usando distribución inteligente por preferencias de día`,
        variant: "default",
      });

      await refetch();

    } catch (error) {
      console.error('Error en auto-grouping:', error);
      toast({
        title: "Error en auto-grouping",
        description: error instanceof Error ? error.message : 'Error inesperado al generar grupos',
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGroups(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-12 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar los grupos: {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isAmericano = tournament?.tournament_type === 'AMERICANO';
  const totalTeams = Array.isArray(teams) ? teams.length : 0;
  const totalGroups = Array.isArray(groups) ? groups.length : 0;
  const teamsPerGroup = totalGroups > 0 ? Math.ceil(totalTeams / totalGroups) : 0;

  // Calcular cupo según tipo de torneo
  const getTournamentCapacity = (tournamentType: string) => {
    switch (tournamentType) {
      case 'NINE_PLAYERS': return 9;
      case 'TWELVE_PLAYERS': return 12;
      case 'SIXTEEN_PLAYERS': return 16;
      case 'AMERICANO': return tournament?.max_teams ?? 8;
      default: return 9;
    }
  };

  const tournamentCapacity = tournament?.tournament_type ? getTournamentCapacity(tournament.tournament_type) : 9;
  const isTournamentFull = totalTeams >= tournamentCapacity;
  const canGenerateGroups = !isAmericano && isTournamentFull && totalGroups === 0; // ✅ Solo permitir generar si NO hay grupos existentes (y no es americano)

  const handleGenerateAmericanoMatches = async () => {
    setIsGeneratingAmericanoMatches(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/generate-americano-matches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al generar partidos');
      toast({
        title: 'Partidos generados',
        description: data.message ?? `Se generaron ${data.matches_count ?? 0} partidos en ${data.rounds_count ?? 0} rondas.`,
        variant: 'default',
      });
      await refetch();
      router.push(`/tournaments/${tournamentId}/matches`);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al generar partidos del americano',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAmericanoMatches(false);
    }
  };

  const canGenerateAmericanoMatches = isAmericano && totalGroups === 0 && [4, 8, 12, 16].includes(totalTeams);

  // Vista específica para torneo americano: no hay grupos fijos, las parejas rotan por ronda
  if (isAmericano) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="mb-4 p-0 h-auto font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver al torneo
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Rondas - {tournament?.name || 'Torneo Americano'}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                Americano
              </Badge>
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                {getCategoryName(tournament?.category_id || '', categories)}
              </Badge>
            </div>
          </div>

          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <UsersIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    En el torneo americano no hay grupos fijos
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Cada jugador compite de forma individual. En cada ronda se forman parejas distintas (rotación): todos juegan con todos a lo largo del torneo. Los partidos y las parejas por ronda se gestionan en la sección <strong>Partidos</strong>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {canGenerateAmericanoMatches && (
                      <Button
                        onClick={handleGenerateAmericanoMatches}
                        disabled={isGeneratingAmericanoMatches}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {isGeneratingAmericanoMatches ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4 mr-2" />
                        )}
                        {isGeneratingAmericanoMatches ? 'Generando cruces...' : 'Generar partidos (cruces por ronda)'}
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push(`/tournaments/${tournamentId}/matches`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Ir a Partidos
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mb-4 p-0 h-auto font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver al torneo
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Grupos - {tournament?.name || 'Torneo'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {getCategoryName(tournament?.category_id || '', categories)}
                </Badge>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gestión de grupos y distribución de equipos
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={refetch}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button 
                onClick={handleGenerateGroups}
                className={`flex items-center gap-2 ${
                  !canGenerateGroups || isGeneratingGroups
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
                disabled={!canGenerateGroups || isGeneratingGroups}
                title={
                  !isTournamentFull 
                    ? `Faltan ${tournamentCapacity - totalTeams} equipos para completar el cupo`
                    : totalGroups > 0
                    ? 'Los grupos ya han sido generados. No se pueden regenerar para evitar inconsistencias.'
                    : 'Generar grupos automáticamente usando auto-grouping inteligente'
                }
              >
                {isGeneratingGroups ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isGeneratingGroups
                  ? 'Procesando...'
                  : !isTournamentFull 
                  ? `Esperando ${tournamentCapacity - totalTeams} equipos`
                  : totalGroups > 0 
                  ? 'Grupos Generados'
                  : 'Generar Grupos'
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Equipos Inscritos</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalTeams} / {tournamentCapacity}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {isTournamentFull ? 'Cupo completo' : `Faltan ${tournamentCapacity - totalTeams} equipos`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Grupos Creados</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalGroups}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Equipos por Grupo</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{teamsPerGroup}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${
            totalGroups > 0 
              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
              : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  totalGroups > 0 ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    totalGroups > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>Estado</p>
                  <p className={`text-lg font-bold ${
                    totalGroups > 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-orange-900 dark:text-orange-100'
                  }`}>
                    {totalGroups > 0 ? 'Grupos Activos' : 'Sin grupos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        {Array.isArray(groups) && groups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {groups.map((group, index) => {
              const groupTeams = getTeamsInGroup(group.teams || []);
              
              return (
                <Card key={group.id || index} className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <TrophyIcon className="h-5 w-5 text-white" />
                      </div>
                      Grupo {group.group_number || index + 1}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {groupTeams.length} equipos
                      </span>
                      {group.assigned_franja && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {group.assigned_franja}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20"
                        onClick={() => setReschedulingGroup({ id: group.id, group_number: group.group_number || index + 1, assigned_franja: group.assigned_franja || null })}
                        disabled={tournamentFranjas.length === 0}
                        title={tournamentFranjas.length === 0 ? 'No hay franjas configuradas' : 'Cambiar franja del grupo'}
                      >
                        <CalendarClock className="h-3.5 w-3.5 mr-1" />
                        Cambiar franja
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {groupTeams.length > 0 ? (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {groupTeams.map((team, teamIndex) => (
                          <div key={team?.team_id || teamIndex} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {getTeamInitial(team)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {formatPlayerNames(team)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {team?.team_id?.slice(-8) || 'N/A'}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  group.status === 'IN_PROGRESS' 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {group.status === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UsersIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Sin equipos asignados
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Este grupo aún no tiene equipos asignados.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrophyIcon className="h-12 w-12 text-gray-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No hay grupos creados
              </h3>
              
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {!isTournamentFull 
                  ? `Este torneo necesita ${tournamentCapacity} equipos para generar grupos. Actualmente hay ${totalTeams} equipos inscritos.`
                  : 'Este torneo aún no tiene grupos generados. Genera los grupos para organizar los equipos y comenzar la fase de grupos.'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/tournaments/${tournamentId}`)}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  Volver al torneo
                </Button>
                <Button 
                  onClick={handleGenerateGroups}
                  className={`${
                    !canGenerateGroups || isGeneratingGroups
                      ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  } text-white`}
                  disabled={!canGenerateGroups || isGeneratingGroups}
                  title={
                    !isTournamentFull 
                      ? `Faltan ${tournamentCapacity - totalTeams} equipos para completar el cupo`
                      : totalGroups > 0
                      ? 'Los grupos ya han sido generados. No se pueden regenerar para evitar inconsistencias.'
                      : 'Generar grupos automáticamente usando auto-grouping inteligente'
                  }
                >
                  {isGeneratingGroups ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingGroups
                    ? 'Procesando...'
                    : !isTournamentFull 
                    ? `Esperando ${tournamentCapacity - totalTeams} equipos`
                    : totalGroups > 0
                    ? 'Grupos Generados'
                    : 'Generar Grupos'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para cambiar franja de grupo */}
      {reschedulingGroup && (
        <GroupFranjaRescheduler
          open={!!reschedulingGroup}
          onClose={() => setReschedulingGroup(null)}
          onSuccess={refetch}
          tournamentId={tournamentId}
          group={reschedulingGroup}
          franjas={tournamentFranjas}
        />
      )}
    </div>
  );
}