'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { DateTime } from '@/components/Dashboard/DateTime';
import { LeagueStatsCard } from '@/components/Dashboard/LeagueStatsCard';
import { LeagueScheduleCard } from '@/components/Dashboard/LeagueScheduleCard';
import { CategoryStandings } from '@/components/Dashboard/CategoryStandings';
import { LeagueRegistrationProgress } from '@/components/Dashboard/LeagueRegistrationProgress';
import { FootballDashboardPanel } from '@/components/Dashboard/Football/FootballDashboardPanel';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsers } from '@/hooks/useUsers';
import { useLeagues } from '@/hooks/useLeagues';
import { useCategories } from '@/hooks/useCategories';
import { useStandings } from '@/hooks/useStandings';

export default function Dashboard() {
  const [sportTab, setSportTab] = useState<'padel' | 'football'>('padel');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isStandingsOpen, setIsStandingsOpen] = useState(true);
  const { users, isLoading: isLoadingUsers } = useUsers();
  const { leagues, isLoading: isLoadingLeagues } = useLeagues();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { standings, hasGroups, isLoading: isLoadingStandings } = useStandings(selectedCategory);

  const totalUsers = useMemo(() => {
    if (!users) return 0;
    return users.length;
  }, [users]);

  useEffect(() => {
    if (!isLoadingCategories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, isLoadingCategories, selectedCategory]);

  const sportTabTriggerClassName =
    `relative shrink-0 rounded-none border-0 px-5 py-3 -mb-px text-sm font-medium uppercase tracking-[0.12em] text-gray-500 shadow-none outline-none ring-0 ring-offset-0 transition-colors hover:bg-transparent hover:text-gray-800 focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-gray-400/40 focus-visible:ring-offset-0 dark:hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none dark:bg-transparent dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-gray-100 after:pointer-events-none after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:rounded-full after:bg-gray-900 after:opacity-0 after:transition-opacity after:content-[''] data-[state=active]:after:opacity-100 dark:after:bg-gray-100`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-[1600px] mx-auto p-8">
        <div className="flex flex-col space-y-6">
          {/* Header y Fecha */}
          <div className="flex flex-col space-y-6">
            <Header 
              title="Panel de Control"
              description={
                sportTab === 'padel'
                  ? 'Gestión y visualización de ligas de pádel.'
                  : 'Gestión y visualización de ligas de fútbol.'
              }
              icon={<HomeIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
            />
            <DateTime />
          </div>

          <Tabs value={sportTab} onValueChange={(v) => setSportTab(v as 'padel' | 'football')} className="w-full">
            <TabsList className="flex h-auto w-full max-w-full flex-none justify-start gap-6 rounded-none border-b border-gray-200/90 bg-transparent p-0 pb-px dark:border-gray-700 dark:bg-transparent">
              <TabsTrigger value="padel" className={sportTabTriggerClassName}>
                Ligas pádel
              </TabsTrigger>
              <TabsTrigger value="football" className={sportTabTriggerClassName}>
                Fútbol
              </TabsTrigger>
            </TabsList>

            <TabsContent value="padel" className="mt-6 space-y-6 outline-none">
          {/* Stats Cards */}
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
                      Estadísticas Generales
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStatsOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    <LeagueStatsCard 
                      title="Categorías activas"
                      value={isLoadingLeagues ? 0 : leagues.length}
                      type="active"
                    />
                    <LeagueStatsCard 
                      title="Total Jugadores"
                      value={isLoadingUsers ? 0 : totalUsers}
                      type="teams"
                    />
                    <LeagueStatsCard 
                      title="Partidos Totales"
                      value={0}
                      type="matches"
                    />
                    <LeagueStatsCard 
                      title="Partidos Completados"
                      value={0}
                      type="completed"
                    />
                  </div>
                </CardContent>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>

          {/* Próximos Partidos */}
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
                      Próximos Partidos
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

          {/* Progreso de Inscripciones */}
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
                      Progreso de Inscripciones
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

          {/* Tabla de Posiciones */}
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
                      Tabla de Posiciones
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
                    standings={standings}
                    hasGroups={hasGroups}
                    isLoading={isLoadingStandings}
                  />
                </CardContent>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>
            </TabsContent>

            <TabsContent value="football" className="mt-6 space-y-6 outline-none">
              <FootballDashboardPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
