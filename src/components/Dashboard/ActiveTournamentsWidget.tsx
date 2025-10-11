'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Play, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Target,
  Zap,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTournaments } from '@/hooks/useTournaments';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/contexts/TranslationContext';

interface TournamentPhase {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
  description: string;
  action?: {
    label: string;
    href: string;
    icon: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

interface ActiveTournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  tournament_teams?: any[];
  tournament_type?: string;
  categories?: any[];
  category?: string;
  current_phase: string;
  progress_percentage: number;
  phases: TournamentPhase[];
  has_groups?: boolean;
  has_elimination_bracket?: boolean;
  has_matches?: boolean;
  teams_count: number;
  max_teams: number;
}

export function ActiveTournamentsWidget() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { tournaments, loading } = useTournaments();
  const [activeTournaments, setActiveTournaments] = useState<ActiveTournament[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // Determinar la fase actual y progreso de un torneo
  const determineTournamentPhase = (tournament: any): ActiveTournament => {
    const teamsCount = tournament.tournament_teams?.length || 0;
    const maxTeams = getMaxTeams(tournament.tournament_type);
    const hasGroups = tournament.tournament_groups?.length > 0;
    const hasMatches = tournament.tournament_matches?.length > 0;
    const hasEliminationBracket = tournament.tournament_matches?.some((match: any) => 
      match.round !== 'group' && !match.group_number
    );

    let currentPhase = 'inscripciones';
    let progressPercentage = 0;
    let phases: TournamentPhase[] = [];

    // Fase 1: Inscripciones (Payments)
    const inscriptionPhase: TournamentPhase = {
      id: 'inscripciones',
      name: 'Inscripciones',
      status: teamsCount >= maxTeams ? 'completed' : teamsCount > 0 ? 'current' : 'pending',
      description: `${teamsCount}/${maxTeams} equipos inscritos`,
      action: {
        label: 'Ver Pagos',
        href: `/tournaments/${tournament.id}/payments`,
        icon: <Users className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    // Fase 2: Grupos (Matches)
    const groupsPhase: TournamentPhase = {
      id: 'grupos',
      name: 'Fase de Grupos',
      status: hasGroups ? 'completed' : teamsCount >= maxTeams ? 'current' : 'pending',
      description: hasGroups ? 'Grupos generados' : 'Ver partidos y grupos',
      action: {
        label: 'Ver Partidos',
        href: `/tournaments/${tournament.id}/matches`,
        icon: <Target className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    // Fase 3: Clasificaciones (Standings)
    const standingsPhase: TournamentPhase = {
      id: 'clasificaciones',
      name: 'Clasificaciones',
      status: hasGroups ? 'current' : 'pending',
      description: hasGroups ? 'Ver tabla de posiciones' : 'Ver clasificaciones',
      action: {
        label: 'Ver Clasificaciones',
        href: `/tournaments/${tournament.id}/standings`,
        icon: <BarChart3 className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    // Fase 4: Bracket Eliminatorio
    const bracketPhase: TournamentPhase = {
      id: 'bracket',
      name: 'Bracket Eliminatorio',
      status: hasEliminationBracket ? 'completed' : 'pending',
      description: hasEliminationBracket ? 'Bracket generado' : 'Ver bracket',
      action: {
        label: 'Ver Bracket',
        href: `/tournaments/${tournament.id}/bracket`,
        icon: <Trophy className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    phases = [inscriptionPhase, groupsPhase, standingsPhase, bracketPhase];

    // Determinar fase actual y progreso
    if (teamsCount < maxTeams) {
      currentPhase = 'inscripciones';
      progressPercentage = (teamsCount / maxTeams) * 25;
    } else if (!hasGroups) {
      currentPhase = 'grupos';
      progressPercentage = 25;
    } else if (!hasMatches) {
      currentPhase = 'partidos';
      progressPercentage = 50;
    } else if (!hasEliminationBracket) {
      currentPhase = 'bracket';
      progressPercentage = 75;
    } else {
      currentPhase = 'finalizado';
      progressPercentage = 100;
    }

    return {
      ...tournament,
      current_phase: currentPhase,
      progress_percentage: progressPercentage,
      phases,
      has_groups: hasGroups,
      has_elimination_bracket: hasEliminationBracket,
      has_matches: hasMatches,
      teams_count: teamsCount,
      max_teams: maxTeams,
      category: tournament.category?.name || (tournament as any).categories?.name || 'Sin categoría'
    };
  };

  const getMaxTeams = (tournamentType?: string): number => {
    switch (tournamentType) {
      case 'SIX_PLAYERS': return 6;
      case 'NINE_PLAYERS': return 9;
      case 'TWELVE_PLAYERS': return 12;
      case 'SIXTEEN_PLAYERS': return 16;
      default: return 12;
    }
  };

  const getPhaseIcon = (phaseId: string) => {
    switch (phaseId) {
      case 'inscripciones': return <Users className="h-4 w-4" />;
      case 'grupos': return <Target className="h-4 w-4" />;
      case 'clasificaciones': return <BarChart3 className="h-4 w-4" />;
      case 'bracket': return <Trophy className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    if (tournaments) {
      // Filtrar solo torneos activos (upcoming, in_progress)
      const activeTournaments = tournaments
        .filter(tournament => 
          tournament.status === 'upcoming' || tournament.status === 'in_progress'
        )
        .map(determineTournamentPhase)
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      setActiveTournaments(activeTournaments);
    }
  }, [tournaments]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Torneos Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeTournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Torneos Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay torneos activos
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Los torneos activos aparecerán aquí cuando estén en progreso.
            </p>
            <Button 
              onClick={() => router.push('/tournaments')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Ver Todos los Torneos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <Collapsible.Trigger asChild>
          <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Torneos Activos ({activeTournaments.length})
              </CardTitle>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <CardContent className="p-6 space-y-6">
        {activeTournaments.map((tournament) => (
          <div key={tournament.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            {/* Header del Torneo */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {tournament.name}
                  </h3>
                  {tournament.category && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                      {tournament.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {tournament.teams_count}/{tournament.max_teams} equipos
                  </div>
                </div>
              </div>
              <Badge className={getPhaseStatusIcon(tournament.current_phase) ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}>
                {tournament.current_phase.charAt(0).toUpperCase() + tournament.current_phase.slice(1)}
              </Badge>
            </div>


            {/* Fases del Torneo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tournament.phases.map((phase) => (
                <div 
                  key={phase.id} 
                  className={`p-3 rounded-lg border transition-all ${
                    phase.status === 'completed' 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : phase.status === 'current'
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getPhaseIcon(phase.id)}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {phase.name}
                    </span>
                    {getPhaseStatusIcon(phase.status)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {phase.description}
                  </p>
                  {phase.action && (
                    <Button
                      size="sm"
                      variant={phase.action.variant || 'outline'}
                      className="w-full text-xs"
                      onClick={() => router.push(phase.action!.href)}
                    >
                      {phase.action.icon}
                      <span className="ml-1">{phase.action.label}</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>

          </div>
        ))}
          </CardContent>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  );
}
