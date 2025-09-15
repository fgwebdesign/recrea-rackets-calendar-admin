'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { matchService } from '@/services/tournamentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  CheckCircle, 
  XCircle, 
  Plus,
  RefreshCw,
  MapPin,
  Target,
  AlertCircle,
  ArrowLeft,
  CalendarDays
} from 'lucide-react';
import { TournamentMatch, Team } from '@/types/tournament';
import { TournamentMatchModal } from '@/components/Tournaments/TournamentMatchModal';
import { getCategoryName } from '@/utils/category';
import EliminationBracketGenerator from '@/components/Tournaments/EliminationBracketGenerator';
import EliminationBracketViewer from '@/components/Tournaments/EliminationBracketViewer';

interface MatchResult {
  matchId: string;
  team1Sets1: number;
  team2Sets1: number;
  team1Sets2: number;
  team2Sets2: number;
  team1Tie1: number;
  team2Tie1: number;
  team1Tie2: number;
  team2Tie2: number;
  team1Tie3: number;
  team2Tie3: number;
}

export default function TournamentMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  
  const { tournament, matches, teams, loading, error, refetch } = useTournament(tournamentId);
  const { categories } = useCategories();
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [isSchedulingMatches, setIsSchedulingMatches] = useState(false);
  const [isUpdatingResult, setIsUpdatingResult] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({});
  const [showResultForm, setShowResultForm] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  
  // Estado para la fase eliminatoria
  const [bracketData, setBracketData] = useState<any>(null);
  const [showBracket, setShowBracket] = useState(false);

  // Calcular estadísticas
  const totalMatches = Array.isArray(matches) ? matches.length : 0;
  const completedMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'completed').length : 0;
  const pendingMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'pending').length : 0;
  const inProgressMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'in_progress').length : 0;
  
  // Verificar si hay partidos sin programar (sin fecha, hora o cancha)
  const unprogrammedMatches = Array.isArray(matches) ? 
    matches.filter(m => !m.match_day || !m.start_time || !m.court_id).length : 0;
  
  // Detectar si ya existen partidos eliminatorios
  const hasEliminationMatches = Array.isArray(matches) ? 
    matches.some(match => match.round !== 'group') : false;

  // Función para manejar cuando se genera el bracket
  const handleBracketGenerated = (data: any) => {
    setBracketData(data);
    setShowBracket(true);
  };

  // Debug: verificar datos de partidos en la página
  console.log('🔍 Matches in page:', matches);
  console.log('🔍 Total matches:', totalMatches);
  console.log('🔍 Matches is array?', Array.isArray(matches));
  console.log('🔍 Teams in page:', teams);
  console.log('🔍 Teams is array?', Array.isArray(teams));
  console.log('🔍 Teams count:', Array.isArray(teams) ? teams.length : 0);

  // Obtener equipos por ID
  const getTeamById = (teamId: string): any => {
    if (!Array.isArray(teams)) return null;
    const team = teams.find(team => team.team_id === teamId) || null;
    
    // Debug: verificar un equipo específico
    if (teamId === '9211ac3e-5db5-47d5-9178-c798d79cfbf4') {
      console.log('🔍 Found team for ID:', teamId, team);
    }
    
    return team;
  };

  // Formatear nombres de jugadores
  const formatPlayerNames = (team: any): string => {
    if (!team) return 'Equipo no encontrado';
    
    const player1 = team.teams?.player1;
    const player2 = team.teams?.player2;
    
    if (!player1 || !player2) return 'Jugadores no disponibles';
    
    const name1 = `${player1.first_name || ''} ${player1.last_name || ''}`.trim();
    const name2 = `${player2.first_name || ''} ${player2.last_name || ''}`.trim();
    
    return `${name1} / ${name2}`;
  };

  // Determinar quién ganó el partido
  const getMatchWinner = (match: TournamentMatch): 'home' | 'away' | null => {
    if (match.status !== 'completed') return null;
    
    const homeSetsWon = (match.team1_sets1_won > match.team2_sets1_won ? 1 : 0) + 
                       (match.team1_sets2_won > match.team2_sets2_won ? 1 : 0);
    const awaySetsWon = (match.team2_sets1_won > match.team1_sets1_won ? 1 : 0) + 
                       (match.team2_sets2_won > match.team1_sets2_won ? 1 : 0);
    
    // Si hay super tiebreak, determinar ganador por super tiebreak
    if (match.team1_tie3_won && match.team2_tie3_won) {
      return match.team1_tie3_won > match.team2_tie3_won ? 'home' : 'away';
    }
    
    // Si no hay super tiebreak, determinar por sets ganados
    if (homeSetsWon > awaySetsWon) return 'home';
    if (awaySetsWon > homeSetsWon) return 'away';
    
    return null;
  };

  // Abrir modal para setear resultado
  const handleOpenResultModal = (match: TournamentMatch) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setModalError(null);
    setModalSuccess(null);
  };

  // Guardar resultado desde el modal
  const handleSaveResult = async (matchId: string, result: any) => {
    setSavingResult(true);
    setModalError(null);
    setModalSuccess(null);
    
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setModalError('No hay token de autenticación disponible');
        return;
      }
      
      await matchService.updateMatchResult(matchId, result, tournamentId, token);
      setModalSuccess('¡Resultado guardado exitosamente!');
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(async () => {
        await refetch(); // Recargar datos
        handleCloseModal();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving match result:', error);
      setModalError(error.message || 'Error al guardar el resultado');
    } finally {
      setSavingResult(false);
    }
  };

  // Generar partidos
  const handleGenerateMatches = async () => {
    if (!tournament) return;
    
    setIsGeneratingMatches(true);
    try {
      await matchService.generateMatches(tournamentId);
      await refetch();
    } catch (error) {
      console.error('Error generando partidos:', error);
    } finally {
      setIsGeneratingMatches(false);
    }
  };

  // Programar partidos (asignar horarios y canchas)
  const handleScheduleMatches = async () => {
    if (!tournament) return;
    
    setIsSchedulingMatches(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/schedule-matches-by-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al programar partidos');
      }

      const result = await response.json();
      console.log('✅ Partidos programados exitosamente:', result);
      
      // Recargar datos para mostrar los horarios y canchas asignados
      await refetch();
      
    } catch (error: any) {
      console.error('Error programando partidos:', error);
      alert(`Error al programar partidos: ${error.message}`);
    } finally {
      setIsSchedulingMatches(false);
    }
  };

  // Actualizar resultado de partido
  const handleUpdateResult = async (matchId: string) => {
    const result = matchResults[matchId];
    if (!result) return;

    setIsUpdatingResult(matchId);
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token para updateResult:', token ? 'Token presente' : 'Token ausente');
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }
      
      await matchService.updateMatchResult(matchId, result, tournamentId, token);
      setShowResultForm(null);
      setMatchResults(prev => {
        const newResults = { ...prev };
        delete newResults[matchId];
        return newResults;
      });
      await refetch();
    } catch (error) {
      console.error('Error actualizando resultado:', error);
    } finally {
      setIsUpdatingResult(null);
    }
  };

  // Inicializar formulario de resultado
  const initializeResultForm = (match: TournamentMatch) => {
    setMatchResults(prev => ({
      ...prev,
      [match.id]: {
        matchId: match.id,
        team1Sets1: match.team1_sets1_won || 0,
        team2Sets1: match.team2_sets1_won || 0,
        team1Sets2: match.team1_sets2_won || 0,
        team2Sets2: match.team2_sets2_won || 0,
        team1Tie1: match.team1_tie1_won || 0,
        team2Tie1: match.team2_tie1_won || 0,
        team1Tie2: match.team1_tie2_won || 0,
        team2Tie2: match.team2_tie2_won || 0,
        team1Tie3: match.team1_tie3_won || 0,
        team2Tie3: match.team2_tie3_won || 0,
      }
    }));
    setShowResultForm(match.id);
  };

  // Obtener estado del partido
  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Play className="h-3 w-3 mr-1" />En curso</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Programado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><AlertCircle className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  // Obtener color del grupo
  const getGroupColor = (groupNumber: number) => {
    const colors = [
      'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
      'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800',
      'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
    ];
    return colors[groupNumber % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Error al cargar los partidos: {error}
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
                Partidos - {tournament?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {getCategoryName(tournament?.category_id || '', categories)}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestión de partidos y resultados del torneo
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
              
              {totalMatches === 0 && (
                <Button
                  onClick={handleGenerateMatches}
                  disabled={isGeneratingMatches}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isGeneratingMatches ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isGeneratingMatches ? 'Generando...' : 'Generar Partidos'}
                </Button>
              )}

              {totalMatches > 0 && unprogrammedMatches > 0 && (
                <Button
                  onClick={handleScheduleMatches}
                  disabled={isSchedulingMatches}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isSchedulingMatches ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarDays className="h-4 w-4" />
                  )}
                  {isSchedulingMatches ? 'Programando...' : 'Programar Partidos'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Partidos</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completados</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{completedMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">En curso</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{inProgressMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Sin Programar</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{unprogrammedMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        {totalMatches === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Trophy className="h-12 w-12 text-gray-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    No hay partidos generados
                  </h3>
                  
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Este torneo aún no tiene partidos generados. Genera los partidos para comenzar la competencia.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleGenerateMatches}
                      disabled={isGeneratingMatches}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {isGeneratingMatches ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Generar Partidos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Agrupar partidos por grupo */}
            {Array.isArray(matches) && matches.length > 0 && (
              <div className="space-y-6">
                {Object.entries(
                  matches.reduce((groups, match) => {
                    const groupKey = match.group_number || 'elimination';
                    if (!groups[groupKey]) groups[groupKey] = [];
                    groups[groupKey].push(match);
                    return groups;
                  }, {} as Record<string, TournamentMatch[]>)
                ).map(([groupKey, groupMatches]) => (
                  <div key={groupKey}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {groupKey === 'elimination' ? 'Fase de Eliminación' : `Grupo ${groupKey}`}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupMatches.map((match) => {
                        const homeTeam = getTeamById(match.home_team_id);
                        const awayTeam = getTeamById(match.away_team_id);
                        const isShowingForm = showResultForm === match.id;
                        const result = matchResults[match.id];
                        
                        return (
                          <Card key={match.id} className={`${getGroupColor(match.group_number || 0)} transition-all duration-200 hover:shadow-lg`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                  Partido #{match.match_number || 'N/A'}
                                </CardTitle>
                                {getMatchStatusBadge(match.status)}
                              </div>
                              
                              {match.match_day && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-4 w-4" />
                                  {match.match_day}
                                </div>
                              )}
                              
                              {match.start_time && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="h-4 w-4" />
                                  {match.start_time.substring(0, 5)}
                                </div>
                              )}
                              
                              {match.court_name && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="h-4 w-4" />
                                  {match.court_name}
                                </div>
                              )}
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              {/* Equipos y Resultados */}
                              <div className="space-y-4">
                                {/* Team 1 */}
                                <div className={`rounded-lg p-4 ${getMatchWinner(match) === 'home' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800'}`}>
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {formatPlayerNames(homeTeam).charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {formatPlayerNames(homeTeam)}
                                      </p>
                                    </div>
                                    {getMatchWinner(match) === 'home' && (
                                      <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-2 py-1">
                                        <Trophy className="w-3 h-3 mr-1" />
                                        Ganador
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Resultados del Team 1 */}
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Set 1 */}
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {match.team1_sets1_won || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Set 1
                                      </div>
                                      {(match.team1_tie1_won ?? 0) > 0 && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                          ({match.team1_tie1_won})
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Set 2 */}
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {match.team1_sets2_won || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Set 2
                                      </div>
                                      {(match.team1_tie2_won ?? 0) > 0 && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                          ({match.team1_tie2_won})
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Super Tiebreak */}
                                  {(match.team1_tie3_won ?? 0) > 0 && (
                                    <div className="mt-3 text-center">
                                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {match.team1_tie3_won}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Super Tiebreak
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Team 2 */}
                                <div className={`rounded-lg p-4 ${getMatchWinner(match) === 'away' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800'}`}>
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {formatPlayerNames(awayTeam).charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {formatPlayerNames(awayTeam)}
                                      </p>
                                    </div>
                                    {getMatchWinner(match) === 'away' && (
                                      <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-2 py-1">
                                        <Trophy className="w-3 h-3 mr-1" />
                                        Ganador
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Resultados del Team 2 */}
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Set 1 */}
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {match.team2_sets1_won || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Set 1
                                      </div>
                                      {(match.team2_tie1_won ?? 0) > 0 && (
                                        <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                          ({match.team2_tie1_won})
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Set 2 */}
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {match.team2_sets2_won || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Set 2
                                      </div>
                                      {(match.team2_tie2_won ?? 0) > 0 && (
                                        <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                          ({match.team2_tie2_won})
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Super Tiebreak */}
                                  {(match.team2_tie3_won ?? 0) > 0 && (
                                    <div className="mt-3 text-center">
                                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {match.team2_tie3_won}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Super Tiebreak
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Acciones */}
                              <div className="flex gap-2">
                                {match.status === 'pending' && (
                                  <Button
                                    onClick={() => handleOpenResultModal(match)}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <Target className="h-4 w-4 mr-2" />
                                    Ingresar Resultado
                                  </Button>
                                )}
                                
                                {match.status === 'completed' && (
                                  <Button
                                    onClick={() => initializeResultForm(match)}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Editar Resultado
                                  </Button>
                                )}
                              </div>
                              
                              {/* Formulario de resultado */}
                              {isShowingForm && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white">Resultado del Partido</h4>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Set 1 - Equipo Local</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="6"
                                        value={result?.team1Sets1 || 0}
                                        onChange={(e) => setMatchResults(prev => ({
                                          ...prev,
                                          [match.id]: {
                                            ...prev[match.id],
                                            team1Sets1: parseInt(e.target.value) || 0
                                          }
                                        }))}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Set 1 - Equipo Visitante</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="6"
                                        value={result?.team2Sets1 || 0}
                                        onChange={(e) => setMatchResults(prev => ({
                                          ...prev,
                                          [match.id]: {
                                            ...prev[match.id],
                                            team2Sets1: parseInt(e.target.value) || 0
                                          }
                                        }))}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Set 2 - Equipo Local</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="6"
                                        value={result?.team1Sets2 || 0}
                                        onChange={(e) => setMatchResults(prev => ({
                                          ...prev,
                                          [match.id]: {
                                            ...prev[match.id],
                                            team1Sets2: parseInt(e.target.value) || 0
                                          }
                                        }))}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Set 2 - Equipo Visitante</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="6"
                                        value={result?.team2Sets2 || 0}
                                        onChange={(e) => setMatchResults(prev => ({
                                          ...prev,
                                          [match.id]: {
                                            ...prev[match.id],
                                            team2Sets2: parseInt(e.target.value) || 0
                                          }
                                        }))}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleUpdateResult(match.id)}
                                      disabled={isUpdatingResult === match.id}
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                      {isUpdatingResult === match.id ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                      )}
                                      {isUpdatingResult === match.id ? 'Guardando...' : 'Guardar Resultado'}
                                    </Button>
                                    
                                    <Button
                                      onClick={() => {
                                        setShowResultForm(null);
                                        setMatchResults(prev => {
                                          const newResults = { ...prev };
                                          delete newResults[match.id];
                                          return newResults;
                                        });
                                      }}
                                      variant="outline"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separador Visual */}
        <div className="my-12">
          <div className="flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="px-6 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full border border-yellow-300">
              <Trophy className="h-6 w-6 text-yellow-600 mx-auto" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        </div>

        {/* Sección de Fase Eliminatoria */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-yellow-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">🏆 Fase Eliminatoria</h2>
          </div>
          
          <EliminationBracketGenerator 
            tournamentId={tournamentId}
            onBracketGenerated={handleBracketGenerated}
            hasEliminationMatches={hasEliminationMatches}
            matches={matches}
          />
          
          {hasEliminationMatches && (
            <div className="mt-6">
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-500 rounded-lg">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          🏆 Bracket Eliminatorio Disponible
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Visualiza el cuadro completo con todas las rondas
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => router.push(`/tournaments/${tournamentId}/bracket`)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-6 py-3"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Ver Bracket Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal para setear resultados */}
      {selectedMatch && (
        <TournamentMatchModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          match={selectedMatch}
          teams={teams}
          onSubmit={handleSaveResult}
          isLoading={savingResult}
          error={modalError}
          success={modalSuccess}
        />
      )}
    </div>
  );
}
