'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { DateTime } from '@/components/Dashboard/DateTime';
import { LeagueStatsCard } from '@/components/Dashboard/LeagueStatsCard';
import { LeagueScheduleCard } from '@/components/Dashboard/LeagueScheduleCard';
import { CategoryStandings } from '@/components/Dashboard/CategoryStandings';
import { LeagueRegistrationProgress } from '@/components/Dashboard/LeagueRegistrationProgress';
import { TournamentStatsCard } from '@/components/Dashboard/TournamentStatsCard';
import { TournamentScheduleCard } from '@/components/Dashboard/TournamentScheduleCard';
import { TournamentRegistrationProgress } from '@/components/Dashboard/TournamentRegistrationProgress';
import { TournamentStandings } from '@/components/Dashboard/TournamentStandings';
import { ActiveTournamentsWidget } from '@/components/Dashboard/ActiveTournamentsWidget';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, Trophy, Users, Calendar, BarChart3, Target, Zap, Activity } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useLeagues } from '@/hooks/useLeagues';
import { useCategories } from '@/hooks/useCategories';
import { useStandings } from '@/hooks/useStandings';
import { useTournaments } from '@/hooks/useTournaments';
import { useTranslations } from '@/contexts/TranslationContext';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isStandingsOpen, setIsStandingsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'leagues' | 'tournaments'>('tournaments');
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  
  const { users, isLoading: isLoadingUsers } = useUsers();
  const { leagues, isLoading: isLoadingLeagues } = useLeagues();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  // Removemos useStandings por ahora ya que no tenemos un tournamentId específico
  // const { standings, loading: isLoadingStandings } = useStandings(selectedCategory);
  const standings = null;
  const isLoadingStandings = false;
  const { tournaments, loading: isLoadingTournaments } = useTournaments();

  const totalUsers = useMemo(() => {
    if (!users) return 0;
    return users.length;
  }, [users]);

  const totalTournaments = useMemo(() => {
    if (!tournaments) return 0;
    return tournaments.length;
  }, [tournaments]);

  const activeTournaments = useMemo(() => {
    if (!tournaments) return 0;
    return tournaments.filter(tournament => 
      tournament.status === 'upcoming' || tournament.status === 'in_progress'
    ).length;
  }, [tournaments]);

  const totalTournamentTeams = useMemo(() => {
    if (!tournaments) return 0;
    return tournaments.reduce((total, tournament) => {
      return total + (tournament.tournament_teams?.length || 0);
    }, 0);
  }, [tournaments]);

  const tournamentRevenue = useMemo(() => {
    if (!tournaments) return 0;
    return tournaments.reduce((total, tournament) => {
      const tournamentInfo = tournament.tournament_info || tournament;
      const inscriptionCost = (tournamentInfo as any).inscription_cost || (tournament as any).inscription_cost || 0;
      const registeredTeams = tournament.tournament_teams?.length || 0;
      return total + (inscriptionCost * registeredTeams);
    }, 0);
  }, [tournaments]);

  useEffect(() => {
    if (!isLoadingCategories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, isLoadingCategories, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-[1600px] mx-auto p-8">
        <div className="flex flex-col space-y-6">
          {/* Header y Fecha */}
          <div className="flex flex-col space-y-6">
            <Header 
              title={t('title')}
              description={t('description')}
              icon={<HomeIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
            />
            <DateTime />
          </div>

          {/* Tabs para Leagues y Tournaments */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'leagues' | 'tournaments')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger 
                value="leagues" 
                className="flex items-center gap-3 px-6 py-4 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-medium">{t('leagues')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tournaments" 
                className="flex items-center gap-3 px-6 py-4 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-purple-400"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="font-medium">{t('tournaments')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab de Ligas */}
            <TabsContent value="leagues" className="space-y-6">
              {/* Stats Cards - Ligas */}
              <Collapsible.Root
                open={isStatsOpen}
                onOpenChange={setIsStatsOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isStatsOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('leagueStats')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStatsOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-4 gap-6">
                        <LeagueStatsCard 
                          title={t('activeCategories')}
                          value={isLoadingLeagues ? 0 : leagues.length}
                          type="active"
                        />
                        <LeagueStatsCard 
                          title={t('totalPlayers')}
                          value={isLoadingUsers ? 0 : totalUsers}
                          type="teams"
                        />
                        <LeagueStatsCard 
                          title={t('totalMatches')}
                          value={0}
                          type="matches"
                        />
                        <LeagueStatsCard 
                          title={t('completedMatches')}
                          value={0}
                          type="completed"
                        />
                      </div>
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>

              {/* Próximos Partidos - Ligas */}
              <Collapsible.Root
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isScheduleOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('upcomingMatchesLeagues')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isScheduleOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-0">
                      <LeagueScheduleCard />
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>

              {/* Progreso de Inscripciones - Ligas */}
              <Collapsible.Root
                open={isRegistrationOpen}
                onOpenChange={setIsRegistrationOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isRegistrationOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('registrationProgressLeagues')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isRegistrationOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-6">
                      <LeagueRegistrationProgress
                        leagues={leagues}
                        categories={categories}
                      />
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>

              {/* Tabla de Posiciones - Ligas */}
              <Collapsible.Root
                open={isStandingsOpen}
                onOpenChange={setIsStandingsOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isStandingsOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('standingsLeagues')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStandingsOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-6">
                      <CategoryStandings
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        standings={[]} 
                        isLoading={isLoadingStandings}
                      />
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>
            </TabsContent>

            {/* Tab de Torneos */}
            <TabsContent value="tournaments" className="space-y-6">
              {/* Stats Cards - Torneos */}
              <Collapsible.Root
                open={isStatsOpen}
                onOpenChange={setIsStatsOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isStatsOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          {t('tournamentStats')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStatsOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-4 gap-6">
                        <TournamentStatsCard 
                          title={t('totalTournaments')}
                          value={isLoadingTournaments ? 0 : totalTournaments}
                          type="total"
                        />
                        <TournamentStatsCard 
                          title={t('inProgress')}
                          value={isLoadingTournaments ? 0 : activeTournaments}
                          type="active"
                        />
                        <TournamentStatsCard 
                          title={t('totalTeams')}
                          value={isLoadingTournaments ? 0 : totalTournamentTeams}
                          type="teams"
                        />
                        <TournamentStatsCard 
                          title={t('revenue')}
                          value={isLoadingTournaments ? 0 : tournamentRevenue}
                          type="revenue"
                        />
                      </div>
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>

              {/* Widget de Torneos Activos */}
              <ActiveTournamentsWidget />

              {/* Próximos Partidos - Torneos */}
              <Collapsible.Root
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isScheduleOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          {t('upcomingMatchesTournaments')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isScheduleOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-0">
                      <TournamentScheduleCard />
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>

              {/* Progreso de Inscripciones - Torneos */}
              <Collapsible.Root
                open={isRegistrationOpen}
                onOpenChange={setIsRegistrationOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isRegistrationOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          {t('registrationProgressTournaments')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isRegistrationOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-6">
                      <TournamentRegistrationProgress
                        tournaments={tournaments}
                        categories={categories}
                      />
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>

              {/* Tabla de Posiciones - Torneos */}
              <Collapsible.Root
                open={isStandingsOpen}
                onOpenChange={setIsStandingsOpen}
                className="w-full"
              >
                <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
                  <Collapsible.Trigger asChild>
                    <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isStandingsOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          {t('standingsTournaments')}
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStandingsOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <CardContent className="p-6">
                      <TournamentStandings
                        selectedTournament={selectedTournament}
                        onTournamentChange={setSelectedTournament}
                      />
                    </CardContent>
                  </Collapsible.Content>
                </Card>
              </Collapsible.Root>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
