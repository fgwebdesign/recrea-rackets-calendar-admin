"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LeagueScheduleCard } from "@/components/Dashboard/LeagueScheduleCard"
import { useCategories } from "@/hooks/useCategories"
import { useLeague } from "@/hooks/useLeague"
import { useLeagueStandings } from "@/hooks/useLeagueStandings"
import { useGallery } from "@/hooks/useGallery"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import * as Collapsible from "@radix-ui/react-collapsible"
import { GalleryUploadForm } from "@/components/Leagues/Gallery/GalleryUploadForm"
import { GalleryGrid } from "@/components/Leagues/Gallery/GalleryGrid"
import { 
  CalendarDays, 
  Clock, 
  DollarSign, 
  FileText, 
  Trophy,
  ChevronDown,
  Image as ImageIcon,
  PlusIcon
} from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { LeagueTeams } from '@/components/Leagues/LeagueTeams'
import { LeagueHeader } from "@/components/Leagues/LeagueHeader"
import { useTranslations } from '@/contexts/TranslationContext'
import { Button } from '@/components/ui/button'

// Definir la interfaz Team con la estructura exacta del backend
interface RegisteredTeam {
  id: string;
  league_team_id: string;
  inscription_paid: boolean;
  alternate_player: string;
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
}

export default function LeagueDetailsPage() {
  const t = useTranslations('leagues');
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const leagueId = params.id as string
  const [hasGeneratedMatches, setHasGeneratedMatches] = useState(false);
  const [isGeneratingLeague, setIsGeneratingLeague] = useState(false);
  const [key, setKey] = useState(0);

  const { league, isLoading: isLoadingLeague, error: leagueError } = useLeague(leagueId)
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { standings, isLoading: isLoadingStandings, error: standingsError } = useLeagueStandings(leagueId)

  const [isTeamsOpen, setIsTeamsOpen] = useState(true)
  const [isInfoOpen, setIsInfoOpen] = useState(true)
  const [isStandingsOpen, setIsStandingsOpen] = useState(true)
  const [isMatchesOpen, setIsMatchesOpen] = useState(true)
  const [isGalleryOpen, setIsGalleryOpen] = useState(true)
  
  const { 
    images, 
    isLoading: isLoadingGallery, 
    deleteImage, 
    refetch: refetchGallery,
    hasMore,
    loadMore,
    total
  } = useGallery(leagueId)

  if (isLoadingLeague || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center">
        <Card className="w-[300px] bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('loadingLeagueInfo')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (leagueError || !league) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xl text-center">
                {t('errorLoadingLeague')}
              </p>
              <button
                onClick={() => router.push("/leagues")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300 font-bold"
              >
                {t('backToLeagues')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120]">
      {/* Header */}
      <LeagueHeader 
        league={league}
        categories={categories}
        onBack={() => router.push("/leagues")}
      />
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Equipos Registrados */}
          <Collapsible.Root
            open={isTeamsOpen}
            onOpenChange={setIsTeamsOpen}
            className="w-full"
          >
            <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
              <Collapsible.Trigger asChild>
                <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isTeamsOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('registeredTeamsTitle')}
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isTeamsOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-6">
                  <div className="mb-4 flex justify-end">
                    <Button
                      onClick={() => router.push(`/leagues/${leagueId}/admin-register-team`)}
                      disabled={(league.teams?.length || 0) >= league.team_size}
                      className={`${
                        (league.teams?.length || 0) >= league.team_size
                          ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      } text-white transition-all duration-200`}
                      title={(league.teams?.length || 0) >= league.team_size ? `Cupo completo (${league.teams?.length || 0}/${league.team_size})` : 'Registrar nuevo equipo'}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {(league.teams?.length || 0) >= league.team_size ? 'Cupo Completo' : t('registerTeam')}
                    </Button>
                  </div>
                  <LeagueTeams
                    teams={(league.teams || []).map(team => ({
                      ...team,
                      alternate_player: (team as RegisteredTeam).alternate_player || ''
                    }))}
                    maxTeams={league.team_size}
                    status={league.status}
                    leagueId={leagueId}
                    hasGeneratedMatches={hasGeneratedMatches}
                  />
                  {league.status === 'Activa' && 
                   league.teams?.length === league.team_size && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={async () => {
                          try {
                            const adminToken = localStorage.getItem('adminToken');
                            
                            if (!adminToken) {
                              toast({
                                variant: "destructive",
                                title: t('authError'),
                                description: t('authErrorDescription')
                              });
                              return;
                            }

                            setIsGeneratingLeague(true);
                            // Mostrar toast de estado "generando"
                            toast({
                              title: t('generatingLeagueToast'),
                              description: t('generatingLeagueDescription'),
                              variant: "default",
                              className: "bg-green-500 text-white border-green-600 dark:bg-green-500 dark:text-white dark:border-green-600"
                            });

                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/generateStandings/${leagueId}`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminToken}`
                              },
                              body: JSON.stringify({ rounds: league?.rounds ?? 1 })
                            });

                            if (!response.ok) {
                              const error = await response.json();
                              console.error('Error response:', error);
                              toast({
                                variant: "destructive",
                                title: t('generateError'),
                                description: error.message || t('generateErrorDescription'),
                                className: "bg-red-500 text-white border-red-600 dark:bg-red-500 dark:text-white dark:border-red-600"
                              });
                              setIsGeneratingLeague(false);
                              return;
                            }

                            const data = await response.json();
                            console.log('Success:', data);
                            
                            // Forzar actualización del componente LeagueScheduleCard
                            try {
                              const scheduleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches`, {
                                headers: {
                                  'Authorization': `Bearer ${adminToken}`
                                }
                              });
                              
                              if (scheduleResponse.ok) {
                                setKey(prevKey => prevKey + 1); // Incrementar key para forzar re-render
                                setHasGeneratedMatches(true);
                              }
                            } catch (error) {
                              console.error('Error actualizando partidos:', error);
                            }

                            setIsGeneratingLeague(false);
                            toast({
                              title: t('leagueGeneratedSuccess'),
                              description: t('leagueGeneratedDescription'),
                              variant: "default",
                              className: "bg-green-500 text-white border-green-600 dark:bg-green-500 dark:text-white dark:border-green-600"
                            });
                          } catch (error) {
                            console.error('Error generando la liga:', error);
                            toast({
                              variant: "destructive",
                              title: t('unexpectedError'),
                              description: t('unexpectedErrorDescription')
                            });
                            setIsGeneratingLeague(false);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={hasGeneratedMatches || isGeneratingLeague}
                        title={hasGeneratedMatches ? t('leagueGenerated') : isGeneratingLeague ? t('generatingLeague') : ""}
                      >
                        {isGeneratingLeague ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {t('generatingLeague')}
                          </>
                        ) : (
                          <>
                            <Trophy className="w-5 h-5" />
                            {t('generateLeague')}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>

          {/* Próximos Partidos */}
          <Collapsible.Root
            open={isMatchesOpen}
            onOpenChange={setIsMatchesOpen}
            className="w-full"
          >
            <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
              <Collapsible.Trigger asChild>
                <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isMatchesOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('upcomingMatches')}
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMatchesOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-0">
                  <LeagueScheduleCard 
                    key={key}
                    leagueId={leagueId} 
                    onMatchesLoaded={setHasGeneratedMatches}
                  />
                </CardContent>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>

          {/* Información Detallada de la Liga */}
          <Collapsible.Root
            open={isInfoOpen}
            onOpenChange={setIsInfoOpen}
            className="w-full"
          >
            <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
              <Collapsible.Trigger asChild>
                <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isInfoOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('leagueInfo')}
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isInfoOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Descripción */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <h3 className="font-medium text-slate-900 dark:text-slate-200">{t('leagueDescription')}</h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {league.description || t('noDescription')}
                      </p>
                    </div>

                    {/* Costo de Inscripción */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-200">{t('leagueInscriptionCost')}</h3>
                      </div>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${league.inscription_cost || 0}
                      </p>
                    </div>

                    {/* Fechas */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-medium text-blue-900 dark:text-blue-200">{t('dates')}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm text-blue-600 dark:text-blue-400">{t('start')}</span>
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            {new Date(league.start_date.replace('Z', '')).toLocaleDateString('es-UY', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm text-blue-600 dark:text-blue-400">{t('end')}</span>
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            {new Date(league.end_date.replace('Z', '')).toLocaleDateString('es-UY', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sistema de Puntuación */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 space-y-4 md:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-medium text-purple-900 dark:text-purple-200">{t('scoringSystem')}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 dark:text-purple-400">{t('victory')}</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_win}</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">{t('points')}</p>
                        </div>
                        <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 dark:text-purple-400">{t('lossWithSet')}</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_loss_with_set}</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">{t('points')}</p>
                        </div>
                        <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 dark:text-purple-400">{t('loss')}</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_loss}</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">{t('points')}</p>
                        </div>
                        {league.points_for_walkover !== undefined && (
                          <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                            <p className="text-sm text-purple-600 dark:text-purple-400">{t('walkover')}</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_walkover}</p>
                            <p className="text-xs text-purple-500 dark:text-purple-400">{t('points')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
                      {t('standings')}
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStandingsOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-6">
                  {isLoadingStandings ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        Cargando tabla de posiciones...
                      </p>
                    </div>
                  ) : standingsError ? (
                    <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <p className="text-red-500 dark:text-red-400">
                        Error al cargar las posiciones: {standingsError}
                      </p>
                    </div>
                  ) : !standings || standings.length === 0 ? (
                    <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-red-500 dark:text-red-400 mb-2">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Sin posiciones disponibles
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        No hay datos disponibles para esta liga. Genera los partidos para ver las posiciones.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto rounded-lg bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pos</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PJ</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PG</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PP</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">JG</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">JP</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">DJ</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {standings.map((standing, index) => (
                            <tr 
                              key={standing.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-2xl font-bold font-orbitron text-green-600 dark:text-green-400">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                                {standing.team ? 
                                  `${standing.team.player1.first_name} ${standing.team.player1.last_name} - 
                                   ${standing.team.player2.first_name} ${standing.team.player2.last_name}` : 
                                  'Equipo no disponible'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                                {standing.games_played}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                                {standing.wins}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-red-600 dark:text-red-500">
                                {standing.losses}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                                {standing.games_won}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-red-600 dark:text-red-500">
                                {standing.games_lost}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                                {(() => {
                                  const gamesDifference = standing.games_won - standing.games_lost;
                                  return gamesDifference > 0 ? `+${gamesDifference}` : gamesDifference;
                                })()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-3xl text-center font-orbitron font-bold text-green-600 dark:text-green-400">
                                {standing.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>

          {/* Galería de Imágenes */}
          <Collapsible.Root
            open={isGalleryOpen}
            onOpenChange={setIsGalleryOpen}
            className="w-full"
          >
            <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
              <Collapsible.Trigger asChild>
                <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isGalleryOpen ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        {t('gallery')}
                      </div>
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isGalleryOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-6 space-y-6">
                  <GalleryUploadForm
                    leagueId={leagueId}
                    onUploadSuccess={refetchGallery}
                  />
                  
                  {isLoadingGallery ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <GalleryGrid
                      images={images || []}
                      isAdmin={true}
                      onImageDelete={deleteImage}
                      hasMore={hasMore}
                      isLoading={isLoadingGallery}
                      onLoadMore={loadMore}
                      total={total}
                    />
                  )}
                </CardContent>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>
        </div>
      </main>
    </div>
  )
}

