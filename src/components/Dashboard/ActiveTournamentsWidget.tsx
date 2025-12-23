'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Target,
  BarChart3,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTournaments } from '@/hooks/useTournaments';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/contexts/TranslationContext';
import type { Tournament } from '@/types/tournament';

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
  tournament_teams?: Tournament['tournament_teams'];
  tournament_type?: Tournament['tournament_type'];
  category?: Tournament['category'];
  tournament_groups?: unknown[];
  tournament_matches?: Array<{ round?: string; group_number?: number | null }>;
  current_phase: string;
  progress_percentage: number;
  phases: TournamentPhase[];
  has_groups?: boolean;
  has_elimination_bracket?: boolean;
  has_matches?: boolean;
  teams_count: number;
  max_teams: number;
  categoryName?: string;
}

export function ActiveTournamentsWidget() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { tournaments, loading } = useTournaments();
  const [activeTournaments, setActiveTournaments] = useState<ActiveTournament[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // Determinar la fase actual y progreso de un torneo
  const determineTournamentPhase = (tournament: Tournament & { tournament_groups?: unknown[]; tournament_matches?: Array<{ round?: string; group_number?: number | null }> }): ActiveTournament => {
    const teamsCount = tournament.tournament_teams?.length || 0;
    const maxTeams = getMaxTeams(tournament.tournament_type);
    const hasGroups = (tournament.tournament_groups?.length ?? 0) > 0;
    const hasMatches = (tournament.tournament_matches?.length ?? 0) > 0;
    const hasEliminationBracket = tournament.tournament_matches?.some((match) => 
      match.round !== 'group' && !match.group_number
    );

    let currentPhase = 'inscripciones';
    let progressPercentage = 0;
    let phases: TournamentPhase[] = [];

    // Fase 1: Inscripciones (Payments)
    const inscriptionPhase: TournamentPhase = {
      id: 'inscripciones',
      name: t('phaseRegistrations'),
      status: teamsCount >= maxTeams ? 'completed' : teamsCount > 0 ? 'current' : 'pending',
      description: t('teamsRegistered').replace('{count}', teamsCount.toString()).replace('{max}', maxTeams.toString()),
      action: {
        label: t('viewPayments'),
        href: `/tournaments/${tournament.id}/payments`,
        icon: <Users className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    // Fase 2: Grupos (Matches)
    const groupsPhase: TournamentPhase = {
      id: 'grupos',
      name: t('phaseGroups'),
      status: hasGroups ? 'completed' : teamsCount >= maxTeams ? 'current' : 'pending',
      description: hasGroups ? t('groupsGenerated') : t('viewMatchesAndGroups'),
      action: {
        label: t('viewMatches'),
        href: `/tournaments/${tournament.id}/matches`,
        icon: <Target className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    // Fase 3: Clasificaciones (Standings)
    const standingsPhase: TournamentPhase = {
      id: 'clasificaciones',
      name: t('phaseStandings'),
      status: hasGroups ? 'current' : 'pending',
      description: hasGroups ? t('viewStandingsTable') : t('viewStandings'),
      action: {
        label: t('viewStandingsButton'),
        href: `/tournaments/${tournament.id}/standings`,
        icon: <BarChart3 className="h-4 w-4" />,
        variant: 'outline'
      }
    };

    // Fase 4: Bracket Eliminatorio
    const bracketPhase: TournamentPhase = {
      id: 'bracket',
      name: t('phaseBracket'),
      status: hasEliminationBracket ? 'completed' : 'pending',
      description: hasEliminationBracket ? t('bracketGenerated') : t('viewBracket'),
      action: {
        label: t('viewBracketButton'),
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
      categoryName: tournament.category?.name || t('noCategory')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            {t('activeTournaments')}
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
            {t('activeTournaments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('noActiveTournaments')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('noActiveTournamentsDescription')}
            </p>
            <Button 
              onClick={() => router.push('/tournaments')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              {t('viewAllTournaments')}
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
                {t('activeTournamentsTitle').replace('{count}', activeTournaments.length.toString())}
              </CardTitle>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <CardContent className="p-6 space-y-6">
        {activeTournaments.map((tournament) => (
          <div 
            key={tournament.id} 
            className="group relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-3xl"></div>
            </div>

            <div className="relative p-6 space-y-6">
              {/* Header del Torneo */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                        {tournament.name}
                      </h3>
                      {tournament.categoryName && (
                        <Badge className="text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                          {tournament.categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Botón Ir al Torneo */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tournaments/${tournament.id}`);
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-4 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <span>{t('goToTournament')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Estadísticas del Torneo */}
              <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('teams')}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {tournament.teams_count}/{tournament.max_teams}
                        </p>
                      </div>
                    </div>
                    
                    {/* Barra de progreso de inscripciones */}
                    <div className="flex-1 min-w-[200px] max-w-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('progress')}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {Math.round((tournament.teams_count / tournament.max_teams) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((tournament.teams_count / tournament.max_teams) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

              {/* Fases del Torneo - Rediseñadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tournament.phases.map((phase, index) => {
                  const isCompleted = phase.status === 'completed';
                  const isCurrent = phase.status === 'current';
                  
                  // Colores específicos por fase
                  const phaseColors = {
                    inscripciones: {
                      bg: 'from-orange-50 via-amber-50 to-yellow-50',
                      bgDark: 'from-orange-900/20 via-amber-900/20 to-yellow-900/20',
                      border: 'border-orange-300',
                      borderDark: 'dark:border-orange-700',
                      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
                      iconColor: 'text-orange-600 dark:text-orange-400',
                      badge: 'bg-orange-500',
                      button: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                    },
                    grupos: {
                      bg: 'from-blue-50 via-cyan-50 to-sky-50',
                      bgDark: 'from-blue-900/20 via-cyan-900/20 to-sky-900/20',
                      border: 'border-blue-300',
                      borderDark: 'dark:border-blue-700',
                      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
                      iconColor: 'text-blue-600 dark:text-blue-400',
                      badge: 'bg-blue-500',
                      button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    },
                    clasificaciones: {
                      bg: 'from-purple-50 via-pink-50 to-rose-50',
                      bgDark: 'from-purple-900/20 via-pink-900/20 to-rose-900/20',
                      border: 'border-purple-300',
                      borderDark: 'dark:border-purple-700',
                      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
                      iconColor: 'text-purple-600 dark:text-purple-400',
                      badge: 'bg-purple-500',
                      button: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    },
                    bracket: {
                      bg: 'from-emerald-50 via-teal-50 to-green-50',
                      bgDark: 'from-emerald-900/20 via-teal-900/20 to-green-900/20',
                      border: 'border-emerald-300',
                      borderDark: 'dark:border-emerald-700',
                      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
                      iconColor: 'text-emerald-600 dark:text-emerald-400',
                      badge: 'bg-emerald-500',
                      button: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    }
                  };
                  
                  const colors = phaseColors[phase.id as keyof typeof phaseColors] || phaseColors.inscripciones;
                  
                  return (
                    <div 
                      key={phase.id} 
                      className={`group/phase relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:from-green-900/30 dark:to-emerald-900/20 dark:border-green-700 shadow-md' 
                          : isCurrent
                          ? `bg-gradient-to-br ${colors.bg} ${colors.border} dark:${colors.bgDark} dark:${colors.borderDark} shadow-lg ring-2 ring-opacity-50`
                          : `bg-gradient-to-br ${colors.bg} ${colors.border} dark:${colors.bgDark} dark:${colors.borderDark}`
                      }`}
                    >
                      {/* Indicador de número de fase */}
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent
                          ? `${colors.badge} text-white animate-pulse`
                          : `${colors.badge} text-white`
                      }`}>
                        {index + 1}
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Icono y título */}
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${
                            isCompleted 
                              ? 'bg-green-100 dark:bg-green-900/50' 
                              : isCurrent
                              ? colors.iconBg
                              : colors.iconBg
                          }`}>
                            <div className={`${
                              isCompleted 
                                ? 'text-green-600 dark:text-green-400' 
                                : isCurrent
                                ? colors.iconColor
                                : colors.iconColor
                            }`}>
                              {getPhaseIcon(phase.id)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {phase.name}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              {getPhaseStatusIcon(phase.status)}
                              <span className={`text-xs font-medium ${
                                isCompleted 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : isCurrent
                                  ? colors.iconColor
                                  : colors.iconColor
                              }`}>
                                {isCompleted ? t('phaseCompleted') : isCurrent ? t('phaseInProgress') : t('phasePending')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Descripción */}
                        <p className={`text-xs leading-relaxed line-clamp-2 ${
                          isCompleted 
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {phase.description}
                        </p>

                        {/* Botón de acción */}
                        {phase.action && (
                          <Button
                            size="sm"
                            variant={isCurrent ? 'default' : 'default'}
                            className={`w-full text-xs font-semibold transition-all text-white border-0 shadow-md ${
                              isCurrent
                                ? `bg-gradient-to-r ${colors.button}`
                                : isCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                : `bg-gradient-to-r ${colors.button}`
                            }`}
                            onClick={() => router.push(phase.action!.href)}
                          >
                            <span className="mr-1.5">{phase.action.icon}</span>
                            {phase.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
          </CardContent>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  );
}
