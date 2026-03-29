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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CalendarDays,
  Settings,
  ArrowLeftRight
} from 'lucide-react';
import { TournamentMatch, MatchResultData } from '@/types/tournament';
import { TournamentMatchModal } from '@/components/Tournaments/TournamentMatchModal';
import { getCategoryName } from '@/utils/category';
import EliminationBracketGenerator from '@/components/Tournaments/EliminationBracketGenerator';
import { useTranslations } from '@/contexts/TranslationContext';
import { IncompleteCategoriesModal } from '@/components/Tournaments/admin/IncompleteCategoriesModal';
import { useToast } from '@/hooks/use-toast';
import { UnscheduledMatchesView } from '@/components/Tournaments/admin/UnscheduledMatchesView';
import { MatchRescheduler } from '@/components/Tournaments/admin/MatchRescheduler';
import { GroupFranjaScheduler } from '@/components/Tournaments/admin/GroupFranjaScheduler';
import { MatchSwapper } from '@/components/Tournaments/admin/MatchSwapper';

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
  const t = useTranslations('tournaments');
  const tCommon = useTranslations('common');
  
  const { tournament, matches, teams, loading, error, refetch } = useTournament(tournamentId);
  const { categories } = useCategories();
  const isAmericano = tournament?.tournament_type === 'AMERICANO';
  const { toast } = useToast();
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
  const [showIncompleteCategoriesModal, setShowIncompleteCategoriesModal] = useState(false);
  const [incompleteCategoriesData, setIncompleteCategoriesData] = useState<{
    incompleteCategories: Array<{category: string; registered: number; max: number; missing: number}>;
    totalCategories: number;
    incompleteCount: number;
  } | null>(null);
  
  // Estado para la fase eliminatoria
  const [, setBracketData] = useState<unknown>(null);
  
  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState('groups');
  
  // Estado para gestión manual
  interface GroupForDayAssign {
    id: string;
    group_number: number;
    preferred_day: 'DAY_1' | 'DAY_2' | null;
    is_homogeneous: boolean;
  }

  interface MatchForReschedule {
    id: string;
    group_number: number;
    match_number: number;
    tournament_day: number | null;
    start_time: string | null;
    court_id: string | null;
    home_team: {
      id?: string;
      team_id?: string;
      team_name?: string;
      players?: string[] | {
        player1?: { first_name?: string; last_name?: string };
        player2?: { first_name?: string; last_name?: string };
      };
    } | null;
    away_team: {
      id?: string;
      team_id?: string;
      team_name?: string;
      players?: string[] | {
        player1?: { first_name?: string; last_name?: string };
        player2?: { first_name?: string; last_name?: string };
      };
    } | null;
  }

  const [selectedMatchForReschedule, setSelectedMatchForReschedule] = useState<MatchForReschedule | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapPreSelected, setSwapPreSelected] = useState<MatchForReschedule | null>(null);
  const [groups, setGroups] = useState<GroupForDayAssign[]>([]);

  // Calcular estadísticas
  const totalMatches = Array.isArray(matches) ? matches.length : 0;
  const completedMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'completed').length : 0;
  const pendingMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'pending').length : 0;
  const inProgressMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'in_progress').length : 0;
  
  // Verificar si hay partidos sin programar (sin fecha, hora o cancha)
  const unprogrammedMatches = Array.isArray(matches) ? 
    matches.filter(m => !m.tournament_day || !m.start_time || !m.court_id).length : 0;
  
  // Verificar si hay partidos con día asignado pero sin programar (para auto-scheduling)
  // IMPORTANTE: Solo días 1 y 2 (fase de grupos). El día 3 es para eliminatorias.
  const unscheduledMatches = Array.isArray(matches) ? 
    matches.filter(m => 
      m.stage === 'group' && 
      (m.tournament_day === 1 || m.tournament_day === 2) && 
      !m.start_time
    ).length : 0;
  
  // Detectar si ya existen partidos eliminatorios
  const hasEliminationMatches = Array.isArray(matches) ? 
    matches.some(match => match.round !== 'group') : false;

  // Función para manejar cuando se genera el bracket
  const handleBracketGenerated = (data: unknown) => {
    setBracketData(data);
  };

  // Cargar grupos
  const loadGroups = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/groups`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  // Cargar grupos cuando se cambia el tab a manual
  useEffect(() => {
    if (activeTab === 'manual') {
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tournamentId]);

  // Obtener equipos por ID
  const getTeamById = (teamId: string): { team_id: string; teams?: { player1?: { first_name?: string; last_name?: string }; player2?: { first_name?: string; last_name?: string } } } | null => {
    if (!Array.isArray(teams)) return null;
    const team = teams.find(team => team.team_id === teamId) || null;
    
    // Debug: verificar un equipo específico
    return team;
  };

  // Formatear nombres cuando el partido trae home_team/away_team embebidos (ej. americano)
  const formatEmbeddedTeamNames = (team: { player1?: { first_name?: string; last_name?: string }; player2?: { first_name?: string; last_name?: string } } | null | undefined): string => {
    if (!team) return 'Equipo no encontrado';
    const p1 = team.player1;
    const p2 = team.player2;
    const name1 = p1 ? `${p1.first_name || ''} ${p1.last_name || ''}`.trim() : '';
    const name2 = p2 ? `${p2.first_name || ''} ${p2.last_name || ''}`.trim() : '';
    if (!name1 && !name2) return 'Jugadores no disponibles';
    if (!name2) return name1;
    return `${name1} / ${name2}`;
  };

  // Formatear nombres de jugadores (equipo desde listado tournament_teams)
  const formatPlayerNames = (team: { teams?: { player1?: { first_name?: string; last_name?: string }; player2?: { first_name?: string; last_name?: string } } } | null): string => {
    if (!team) return 'Equipo no encontrado';
    if (team.teams && (team.teams.player1 || team.teams.player2)) {
      const player1 = team.teams.player1;
      const player2 = team.teams.player2;
      const name1 = player1 ? `${player1.first_name || ''} ${player1.last_name || ''}`.trim() : '';
      const name2 = player2 ? `${player2.first_name || ''} ${player2.last_name || ''}`.trim() : '';
      if (!name1 && !name2) return 'Jugadores no disponibles';
      if (!name2) return name1;
      return `${name1} / ${name2}`;
    }
    return 'Jugadores no disponibles';
  };

  const getMatchTeamLabel = (match: TournamentMatch, side: 'home' | 'away'): string => {
    const embedded = side === 'home' ? match.home_team : match.away_team;
    if (embedded && (embedded.player1 || embedded.player2)) return formatEmbeddedTeamNames(embedded);
    const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
    return formatPlayerNames(getTeamById(teamId));
  };

  // Función para obtener la fecha del calendario según el día del torneo
  const getCalendarDateForTournamentDay = (tournamentDay: number | null | undefined): string | null => {
    if (!tournamentDay || !tournament?.start_date) return null;
    
    try {
      // Parsear la fecha sin problemas de zona horaria
      // Si viene como "2025-02-06", crear la fecha directamente sin conversión UTC
      const dateParts = tournament.start_date.split('T')[0].split('-');
      if (dateParts.length !== 3) return null;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JS son 0-indexed
      const day = parseInt(dateParts[2], 10);
      
      // Crear fecha en zona horaria local
      const startDate = new Date(year, month, day);
      
      // Día 1 = start_date, Día 2 = start_date + 1 día, Día 3 = start_date + 2 días
      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + (tournamentDay - 1));
      
      // Formatear como "6 feb" (día y mes abreviado)
      return matchDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch (error) {
      console.error('Error calculando fecha:', error);
      return null;
    }
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

  // Guardar resultado desde el modal (usando el mismo endpoint que bracket)
  const handleSaveResult = async (matchId: string, result: {
    team1_sets1_won: number;
    team2_sets1_won: number;
    team1_sets2_won: number;
    team2_sets2_won: number;
    team1_tie1_won?: number;
    team2_tie1_won?: number;
    team1_tie2_won?: number;
    team2_tie2_won?: number;
    team1_tie3_won?: number;
    team2_tie3_won?: number;
  }) => {
    setSavingResult(true);
    setModalError(null);
    setModalSuccess(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setModalError('No hay token de autenticación disponible');
        return;
      }
      
      // ✅ Usar el mismo endpoint que la página de bracket
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${matchId}/result`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el resultado');
      }

      setModalSuccess('¡Resultado guardado exitosamente!');
      
      // Recargar datos y cerrar modal inmediatamente
      await refetch();
      handleCloseModal();
      
    } catch (error: unknown) {
      console.error('Error saving match result:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el resultado';
      setModalError(errorMessage);
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

  // Programar partidos automáticamente (usando auto-scheduling del backend)
  const handleScheduleMatches = async () => {
    if (!tournament) return;
    
    setIsSchedulingMatches(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }

      // ✅ Usar el endpoint de auto-scheduling del backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/schedule-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // ✨ Manejar error de categorías incompletas con modal visual
        if (response.status === 400 && errorData.incomplete_categories) {
          setIncompleteCategoriesData({
            incompleteCategories: errorData.details || [],
            totalCategories: errorData.total_categories || 0,
            incompleteCount: errorData.incomplete_count || 0,
          });
          setShowIncompleteCategoriesModal(true);
          return;
        }
        
        throw new Error(errorData.message || 'Error al programar partidos automáticamente');
      }

      const result = await response.json();
      console.log('✅ Auto-scheduling completado:', result);

      const scheduledCount = result.scheduled_count ?? 0;
      const failedCount = result.failed_count ?? result.failed?.length ?? 0;

      // Si hay partidos que requieren asignación manual, ir a la tab Gestión Manual
      if (failedCount > 0) {
        setActiveTab('manual');
        toast({
          title: 'Programación completada con asignaciones pendientes',
          description: `Se programaron ${scheduledCount} de ${result.total_matches ?? (scheduledCount + failedCount)} partidos. ${failedCount} requieren asignación manual. Usá la pestaña "Gestión Manual" para asignar día, hora y cancha.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Auto-scheduling completado',
          description: `Todos los partidos fueron programados (${scheduledCount} partidos).`,
          variant: 'default',
        });
      }

      await refetch();
      
    } catch (error: unknown) {
      console.error('Error en auto-scheduling:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en auto-scheduling';
      alert(`❌ Error en auto-scheduling: ${errorMessage}`);
    } finally {
      setIsSchedulingMatches(false);
    }
  };

  // Convertir MatchResult (formulario) a MatchResultData (API) y calcular ganador
  const toMatchResultData = (result: MatchResult, match: TournamentMatch | null): MatchResultData => {
    const homeSetsWon = (result.team1Sets1 > result.team2Sets1 ? 1 : 0) + (result.team1Sets2 > result.team2Sets2 ? 1 : 0);
    const awaySetsWon = (result.team2Sets1 > result.team1Sets1 ? 1 : 0) + (result.team2Sets2 > result.team1Sets2 ? 1 : 0);
    const winner_team_id = match
      ? (homeSetsWon > awaySetsWon ? match.home_team_id : match.away_team_id)
      : '';

    return {
      team1_sets1_won: result.team1Sets1,
      team2_sets1_won: result.team2Sets1,
      team1_sets2_won: result.team1Sets2,
      team2_sets2_won: result.team2Sets2,
      team1_tie1_won: result.team1Tie1,
      team2_tie1_won: result.team2Tie1,
      team1_tie2_won: result.team1Tie2,
      team2_tie2_won: result.team2Tie2,
      team1_tie3_won: result.team1Tie3,
      team2_tie3_won: result.team2Tie3,
      winner_team_id,
    };
  };

  // Actualizar resultado de partido
  const handleUpdateResult = async (matchId: string) => {
    const result = matchResults[matchId];
    if (!result) return;

    const match = Array.isArray(matches) ? matches.find((m) => m.id === matchId) ?? null : null;
    const payload = toMatchResultData(result, match);

    setIsUpdatingResult(matchId);
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token para updateResult:', token ? 'Token presente' : 'Token ausente');
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }
      
      await matchService.updateMatchResult(matchId, payload, tournamentId, token);
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
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header Compacto */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {tournament?.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    {getCategoryName(tournament?.category_id || '', categories)}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Gestión de partidos
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {totalMatches === 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateMatches}
                  disabled={isGeneratingMatches}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isGeneratingMatches ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  {isGeneratingMatches ? 'Generando...' : 'Generar Partidos'}
                </Button>
              )}

              {totalMatches > 0 && unscheduledMatches > 0 && (
                <Button
                  size="sm"
                  onClick={handleScheduleMatches}
                  disabled={isSchedulingMatches}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isSchedulingMatches ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <CalendarDays className="h-3 w-3" />
                  )}
                  {isSchedulingMatches ? 'Programando...' : `Programar (${unscheduledMatches})`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sistema de Tabs Mejorado */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <TabsList className={`grid w-auto bg-gray-100 dark:bg-gray-700 ${isAmericano ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <TabsTrigger 
                  value="groups" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400"
                >
                  <Users className="h-4 w-4" />
                  {isAmericano ? 'Partidos por ronda' : 'Partidos de Grupos'}
                </TabsTrigger>
                {!isAmericano && (
                  <TabsTrigger 
                    value="bracket" 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400"
                  >
                    <Trophy className="h-4 w-4" />
                    Bracket Eliminatorio
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="manual" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400"
                >
                  <Settings className="h-4 w-4" />
                  Gestión Manual
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Actualizar
                </Button>
                
                {unscheduledMatches > 0 && (
                  <Button
                    size="sm"
                    onClick={handleScheduleMatches}
                    disabled={isSchedulingMatches}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isSchedulingMatches ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <CalendarDays className="h-3 w-3" />
                    )}
                    {isSchedulingMatches ? 'Programando...' : `Programar (${unscheduledMatches})`}
                  </Button>
                )}

                {activeTab === 'groups' && (
                  <>
                    {totalMatches === 0 && (
                      <Button
                        size="sm"
                        onClick={handleGenerateMatches}
                        disabled={isGeneratingMatches}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {isGeneratingMatches ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        {isGeneratingMatches ? 'Generando...' : 'Generar Partidos'}
                      </Button>
                    )}
                  </>
                )}

                {activeTab === 'bracket' && hasEliminationMatches && (
                  <Button
                    size="sm"
                    onClick={() => router.push(`/tournaments/${tournamentId}/bracket`)}
                    className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                  >
                    <Trophy className="h-3 w-3" />
                    Ver Bracket Completo
                  </Button>
                )}
              </div>
            </div>

            {/* Tab Content: Partidos de Grupos */}
            <TabsContent value="groups" className="p-4">
              {/* Estadísticas Compactas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{totalMatches}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">Completados</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">{completedMatches}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Pendientes</p>
                        <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{pendingMatches}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400">En curso</p>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{inProgressMatches}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Sin Programar</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{unprogrammedMatches}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          {unscheduledMatches > 0 ? `${unscheduledMatches} requieren horario` : 'Todos programados'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

              {/* Contenido principal de grupos */}
              {totalMatches === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <Trophy className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No hay partidos generados
                        </h3>
                        
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                          Este torneo aún no tiene partidos generados. Genera los partidos para comenzar la competencia.
                        </p>
                        
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
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar partidos por grupo - Solo partidos de grupos */}
                  {Array.isArray(matches) && matches.length > 0 && (
                    <div className="space-y-4">
                      {Object.entries(
                        matches
                          .filter(match => match.round === 'group' || match.group_number) // Solo partidos de grupos
                          .reduce((groups, match) => {
                            const groupKey = match.group_number || 'sin_grupo';
                            if (!groups[groupKey]) groups[groupKey] = [];
                            groups[groupKey].push(match);
                            return groups;
                          }, {} as Record<string, TournamentMatch[]>)
                      ).map(([groupKey, groupMatches]) => (
                        <div key={groupKey}>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {groupKey === 'sin_grupo'
                              ? (isAmericano ? 'Partidos sin ronda' : 'Partidos Sin Grupo')
                              : (isAmericano ? `Ronda ${groupKey}` : `Grupo ${groupKey}`)}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupMatches.map((match) => {
                        const homeLabel = getMatchTeamLabel(match, 'home');
                        const awayLabel = getMatchTeamLabel(match, 'away');
                        const isShowingForm = showResultForm === match.id;
                        const result = matchResults[match.id];
                        
                            return (
                              <Card 
                                key={match.id} 
                                className={`${getGroupColor(match.group_number || 0)} transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer border hover:border-blue-300`}
                                onClick={() => handleOpenResultModal(match)}
                                title="Haz clic para ingresar/ver resultado del partido"
                              >
                                <CardHeader className="pb-2 relative">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                      Partido #{match.match_number || 'N/A'}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                      {getMatchStatusBadge(match.status)}
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="Clickeable"></div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {match.tournament_day && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span className="font-medium">
                                          Día {match.tournament_day}
                                          {getCalendarDateForTournamentDay(match.tournament_day) && (
                                            <span className="text-gray-500 dark:text-gray-400 ml-1">
                                              ({getCalendarDateForTournamentDay(match.tournament_day)})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {match.start_time && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {match.start_time.substring(0, 5)}
                                      </div>
                                    )}
                                    
                                    {match.court_name && (
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span className="font-medium">{match.court_name}</span>
                                        </div>
                                        {match.venue_name && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                                            {match.venue_name}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CardHeader>
                            
                                <CardContent className="space-y-2 pt-2">
                                  {/* Equipos y Resultados */}
                                  <div className="space-y-2">
                                    {/* Team 1 */}
                                    <div className={`rounded p-2 ${getMatchWinner(match) === 'home' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800'}`}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                          {homeLabel.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {homeLabel}
                                          </p>
                                        </div>
                                        {getMatchWinner(match) === 'home' && (
                                          <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-1 py-0.5">
                                            <Trophy className="w-2 h-2 mr-1" />
                                            Ganador
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Resultados del Team 1 */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Set 1 */}
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 dark:text-white">
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
                                          <div className="text-lg font-bold text-gray-900 dark:text-white">
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
                                        <div className="mt-2 text-center">
                                          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                            {match.team1_tie3_won}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Super Tiebreak
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                
                                    {/* Team 2 */}
                                    <div className={`rounded p-2 ${getMatchWinner(match) === 'away' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800'}`}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                          {awayLabel.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {awayLabel}
                                          </p>
                                        </div>
                                        {getMatchWinner(match) === 'away' && (
                                          <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-1 py-0.5">
                                            <Trophy className="w-2 h-2 mr-1" />
                                            Ganador
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Resultados del Team 2 */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Set 1 */}
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 dark:text-white">
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
                                          <div className="text-lg font-bold text-gray-900 dark:text-white">
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
                                        <div className="mt-2 text-center">
                                          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
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
                                  <div className="flex gap-1">
                                    {match.status === 'pending' && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenResultModal(match);
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                      >
                                        <Target className="h-3 w-3 mr-1" />
                                        Resultado
                                      </Button>
                                    )}
                                    
                                    {match.status === 'completed' && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenResultModal(match);
                                        }}
                                        variant="outline"
                                        className="flex-1 text-xs"
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Ver
                                      </Button>
                                    )}

                                    {match.status === 'scheduled' && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenResultModal(match);
                                        }}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                                      >
                                        <Target className="h-3 w-3 mr-1" />
                                        Resultado
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
                                      {isUpdatingResult === match.id ? tCommon('saving') : t('detail.navigation.saveResult')}
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
                                      {tCommon('cancel')}
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
            </TabsContent>

            {/* Tab Content: Bracket Eliminatorio */}
            <TabsContent value="bracket" className="p-4 space-y-4">
            <EliminationBracketGenerator 
              tournamentId={tournamentId}
              onBracketGenerated={handleBracketGenerated}
              hasEliminationMatches={hasEliminationMatches}
              matches={matches}
            />
            
            {/* Mostrar partidos de eliminación organizados por rondas */}
            {Array.isArray(matches) && matches.filter(match => match.round !== 'group' && !match.group_number).length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Partidos de Eliminación (Orden del Bracket)
                </h3>
                
                {/* Organizar partidos por rondas */}
                {(() => {
                  const eliminationMatches = matches.filter(match => match.round !== 'group' && !match.group_number);
                  
                  // Agrupar por rondas
                  const matchesByRound = eliminationMatches.reduce((acc, match) => {
                    const round = match.round || match.elimination_round || 'unknown';
                    if (!acc[round]) acc[round] = [];
                    acc[round].push(match);
                    return acc;
                  }, {} as Record<string, TournamentMatch[]>);
                  
                  // Mapeo de las claves de ronda a nombres canónicos para ordenar y mostrar
                  const roundKeyToCanonicalName: Record<string, string> = {
                    'quarter_finals': 'Cuartos de Final',
                    'quarterfinals': 'Cuartos de Final',
                    'semi_finals': 'Semi-Final',
                    'semi_final': 'Semi-Final',  // Agregar esta variación
                    'semifinals': 'Semi-Final',
                    'finals': 'Final',
                    'final': 'Final',
                    'unknown': 'Ronda Desconocida'
                  };

                  // Orden canónico de las rondas
                  const canonicalRoundOrder = ['Cuartos de Final', 'Semi-Final', 'Final'];

                  const sortedRounds = Object.entries(matchesByRound).sort(([aKey], [bKey]) => {
                    const aCanonical = roundKeyToCanonicalName[aKey] || 'Ronda Desconocida';
                    const bCanonical = roundKeyToCanonicalName[bKey] || 'Ronda Desconocida';

                    const aIndex = canonicalRoundOrder.indexOf(aCanonical);
                    const bIndex = canonicalRoundOrder.indexOf(bCanonical);

                    // Si una ronda no está en el orden canónico, la ponemos al final
                    const finalAIndex = aIndex !== -1 ? aIndex : 999;
                    const finalBIndex = bIndex !== -1 ? bIndex : 999;

                    return finalAIndex - finalBIndex;
                  });
                  
                  return sortedRounds.map(([round, roundMatches]) => {
                    // Obtener el nombre correcto de la ronda para mostrar
                    const getRoundDisplayName = (roundKey: string): string => {
                      // Buscar coincidencias más específicas primero
                      if (roundKeyToCanonicalName[roundKey]) {
                        return roundKeyToCanonicalName[roundKey];
                      }
                      
                      // Buscar coincidencias parciales para manejar diferentes formatos
                      if (roundKey.toLowerCase().includes('quarter')) return 'Cuartos de Final';
                      if (roundKey.toLowerCase().includes('semi')) return 'Semi-Final';
                      if (roundKey.toLowerCase().includes('final') && !roundKey.toLowerCase().includes('semi')) return 'Final';
                      
                      return `Ronda ${roundKey}`;
                    };

                    const roundDisplayName = getRoundDisplayName(round);
                    const isFinalRound = roundDisplayName === 'Final';

                    return (
                      <div key={round} className="mb-8">
                        <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isFinalRound ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                          <Trophy className={`h-5 w-5 ${isFinalRound ? 'text-yellow-600' : 'text-gray-400'}`} />
                          {roundDisplayName} ({roundMatches.length} partidos)
                        </h4>
                        
                        <div className={`bg-white dark:bg-gray-800 rounded-lg border overflow-hidden ${isFinalRound ? 'border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-100 dark:shadow-yellow-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className={`${isFinalRound ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Partido
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Equipos
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Resultado
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Fecha/Hora
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cancha / Sede
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Estado
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acción
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {roundMatches.map((match) => {
                                  const homeLabel = getMatchTeamLabel(match, 'home');
                                  const awayLabel = getMatchTeamLabel(match, 'away');
                                  const winner = getMatchWinner(match);
                                  
                                  return (
                                    <tr 
                                      key={match.id} 
                                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                      onClick={() => handleOpenResultModal(match)}
                                      title="Haz clic para ingresar/ver resultado del partido"
                                    >
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                                              {match.match_number || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                        </div>
                                      </td>
                                      
                                      <td className="px-4 py-4">
                                        <div className="space-y-2">
                                          <div className={`flex items-center gap-2 ${winner === 'home' ? 'font-semibold text-green-700 dark:text-green-400' : ''}`}>
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                              {homeLabel.charAt(0)}
                                            </div>
                                            <span className="text-sm truncate">
                                              {homeLabel}
                                            </span>
                                            {winner === 'home' && <Trophy className="h-4 w-4 text-green-600" />}
                                          </div>
                                          
                                          <div className="text-gray-400 text-center">vs</div>
                                          
                                          <div className={`flex items-center gap-2 ${winner === 'away' ? 'font-semibold text-green-700 dark:text-green-400' : ''}`}>
                                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                              {awayLabel.charAt(0)}
                                            </div>
                                            <span className="text-sm truncate">
                                              {awayLabel}
                                            </span>
                                            {winner === 'away' && <Trophy className="h-4 w-4 text-green-600" />}
                                          </div>
                                        </div>
                                      </td>
                                      
                                      <td className="px-4 py-4 whitespace-nowrap text-center">
                                        {match.status === 'completed' ? (
                                          <div className="space-y-1">
                                            <div className="text-sm font-semibold">
                                              {match.team1_sets1_won || 0}-{match.team2_sets1_won || 0}
                                            </div>
                                            <div className="text-sm font-semibold">
                                              {match.team1_sets2_won || 0}-{match.team2_sets2_won || 0}
                                            </div>
                                            {(match.team1_tie3_won ?? 0) > 0 && (
                                              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                                ST: {match.team1_tie3_won}-{match.team2_tie3_won}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-sm">-</span>
                                        )}
                                      </td>
                                      
                                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-400">
                                        {match.tournament_day && match.start_time ? (
                                          <div className="flex flex-col gap-1">
                                            <div className="font-medium">
                                              Día {match.tournament_day}
                                              {getCalendarDateForTournamentDay(match.tournament_day) && (
                                                <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                                  ({getCalendarDateForTournamentDay(match.tournament_day)})
                                                </span>
                                              )}
                                            </div>
                                            <div>{match.start_time.substring(0, 5)}</div>
                                          </div>
                                        ) : match.start_time ? (
                                          <div>{match.start_time.substring(0, 5)}</div>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                      
                                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-1">
                                          {match.court_name && (
                                            <span className="font-medium">{match.court_name}</span>
                                          )}
                                          {match.venue_name && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {match.venue_name}
                                            </span>
                                          )}
                                          {!match.court_name && !match.venue_name && (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </div>
                                      </td>
                                      
                                      <td className="px-4 py-4 whitespace-nowrap text-center">
                                        {getMatchStatusBadge(match.status)}
                                      </td>
                                      
                                      <td className="px-4 py-4 whitespace-nowrap text-center">
                                        {match.status === 'pending' && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenResultModal(match);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <Target className="h-3 w-3 mr-1" />
                                            Resultado
                                          </Button>
                                        )}
                                        
                                        {match.status === 'completed' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenResultModal(match);
                                            }}
                                          >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Ver
                                          </Button>
                                        )}

                                        {match.status === 'scheduled' && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenResultModal(match);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                          >
                                            <Target className="h-3 w-3 mr-1" />
                                            Resultado
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            
            </TabsContent>

            {/* Tab Content: Gestión Manual */}
            <TabsContent value="manual" className="p-4 space-y-6">
              <div className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>Recomendado:</strong> Usá <strong>Asignar franja por grupo</strong> primero. Las franjas en verde son horarios donde todos los equipos pueden jugar; las rojas están bloqueadas por restricciones de jugadores. Un clic asigna la franja y programa los partidos automáticamente. Si preferís, asigná partido por partido en <strong>Partidos Sin Programar</strong>.
                  </AlertDescription>
                </Alert>

                {/* Sección: Asignar franja por grupo (recomendado) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-500" />
                      Asignar franja por grupo (recomendado)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      Solo se muestran franjas en las que pueden jugar todos los equipos del grupo. Un clic asigna la franja y programa los partidos automáticamente.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <GroupFranjaScheduler
                      tournamentId={tournamentId}
                      groups={groups}
                      matches={matches ?? []}
                      onSuccess={() => {
                        refetch();
                        loadGroups();
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Sección: Partidos Sin Programar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Partidos Sin Programar
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      Solo se muestran horarios donde los jugadores pueden jugar (según sus restricciones). Clic en &quot;Asignar horario&quot; para elegir día, franja, hora y cancha.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <UnscheduledMatchesView
                      tournamentId={tournamentId}
                      onMatchSelect={(match) => {
                        setSelectedMatchForReschedule(match as MatchForReschedule)
                      }}
                      onRefresh={refetch}
                    />
                  </CardContent>
                </Card>
              </div>
              {/* Sección: Swap entre dos partidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                    Intercambiar slots entre dos partidos
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    Operación atómica: los horarios y canchas de ambos partidos se intercambian. El sistema verifica que no haya conflictos con otros partidos.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => { setSwapPreSelected(null); setSwapOpen(true) }}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Abrir herramienta de swap
                  </Button>
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>

        {/* Modal para reasignar partido */}
        {selectedMatchForReschedule && (
          <MatchRescheduler
            tournamentId={tournamentId}
            match={selectedMatchForReschedule}
            isOpen={!!selectedMatchForReschedule}
            onClose={() => setSelectedMatchForReschedule(null)}
            onSuccess={() => {
              refetch();
              setSelectedMatchForReschedule(null);
            }}
          />
        )}

        {/* Modal de swap entre dos partidos */}
        <MatchSwapper
          open={swapOpen}
          onClose={() => { setSwapOpen(false); setSwapPreSelected(null) }}
          onSuccess={refetch}
          tournamentId={tournamentId}
          preSelectedMatch={swapPreSelected || undefined}
          scheduledMatches={(matches ?? [])
            .filter(m => m.tournament_day && m.start_time && m.court_id)
            .map(m => ({
              id: m.id,
              group_number: (m as { group_number?: number }).group_number ?? 0,
              match_number: (m as { match_number?: number }).match_number ?? 0,
              tournament_day: m.tournament_day ?? null,
              start_time: m.start_time ?? null,
              court_id: m.court_id ?? null,
              home_label: (m as { home_team?: { team_name?: string } }).home_team?.team_name,
              away_label: (m as { away_team?: { team_name?: string } }).away_team?.team_name
            }))}
        />

        {/* Modal para setear resultados */}
        {selectedMatch && (
          <TournamentMatchModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            match={selectedMatch!}
            teams={teams}
            onSubmit={handleSaveResult}
            isLoading={savingResult}
            error={modalError}
            success={modalSuccess}
          />
        )}

        {/* Modal para categorías incompletas */}
        {incompleteCategoriesData && (
          <IncompleteCategoriesModal
            open={showIncompleteCategoriesModal}
            onClose={() => {
              setShowIncompleteCategoriesModal(false);
              setIncompleteCategoriesData(null);
            }}
            incompleteCategories={incompleteCategoriesData.incompleteCategories}
            totalCategories={incompleteCategoriesData.totalCategories}
            incompleteCount={incompleteCategoriesData.incompleteCount}
          />
        )}
      </div>
    </div>
  );
}
