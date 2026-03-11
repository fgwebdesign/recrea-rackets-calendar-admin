"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { LeagueScheduleCard } from "@/components/Dashboard/LeagueScheduleCard"
import { useCategories } from "@/hooks/useCategories"
import { useLeague } from "@/hooks/useLeague"
import { useStandings } from "@/hooks/useStandings"
import { useGallery } from "@/hooks/useGallery"
import { useGenerateFixture } from "@/hooks/useGenerateFixture"
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
  Image as ImageIcon
} from 'lucide-react'
import { CategoryStandings } from "@/components/Dashboard/CategoryStandings"
import { LeagueTeams } from '@/components/Leagues/LeagueTeams'
import { LeagueHeader } from "@/components/Leagues/LeagueHeader"

export default function LeagueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const leagueId = params.id as string
  const [hasGeneratedMatches, setHasGeneratedMatches] = useState(false);
  const [key, setKey] = useState(0);

  const { league, isLoading: isLoadingLeague, error: leagueError } = useLeague(leagueId)
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { standings, isLoading: isLoadingStandings } = useStandings(
    league?.category_id // Usar el category_id de la liga
  )
  
  const { generateFixture, isGenerating } = useGenerateFixture({
    leagueId,
    onSuccess: () => {
      setHasGeneratedMatches(true);
      setKey(prevKey => prevKey + 1);
    }
  })

  // Verificar si ya hay partidos generados
  useEffect(() => {
    const checkMatches = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) return;
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/leagues/matches/league/${leagueId}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          const totalMatches = (data.pending?.length || 0) + (data.completed?.length || 0);
          setHasGeneratedMatches(totalMatches > 0);
        }
      } catch (error) {
        console.error('Error checking matches:', error);
      }
    };

    if (leagueId) {
      checkMatches();
    }
  }, [leagueId]);

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

  if (isLoadingLeague || isLoadingCategories || isLoadingStandings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center">
        <Card className="w-[300px] bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando información de la liga...</p>
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
                No se pudo cargar la información de la liga.
              </p>
              <button
                onClick={() => router.push("/leagues")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Volver a Ligas
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const category = categories?.find(cat => cat.id === league.category_id)

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
                      Equipos Registrados
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isTeamsOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <CardContent className="p-6">
                  <LeagueTeams
                    teams={(league.teams || []).map(team => ({
                      ...team,
                      alternate_player: team.alternate_player ?? '',
                      alternate_player_2: team.alternate_player_2 ?? undefined
                    }))}
                    maxTeams={league.team_size}
                    status={league.status}
                    leagueId={leagueId}
                    hasGeneratedMatches={hasGeneratedMatches}
                  />
                  {league.teams && league.teams.length >= 2 && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={generateFixture}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isGenerating || hasGeneratedMatches}
                        title={hasGeneratedMatches ? "Los partidos ya han sido generados" : isGenerating ? "Generando fixture..." : "Generar fixture de la liga"}
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generando fixture...
                          </>
                        ) : (
                          <>
                            <Trophy className="w-5 h-5" />
                            {hasGeneratedMatches ? 'Partidos ya generados' : 'Generar partidos de la liga'}
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
                      Próximos Partidos
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
                      Información de la Liga
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
                        <h3 className="font-medium text-slate-900 dark:text-slate-200">Descripción</h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {league.description || 'Sin descripción'}
                      </p>
                    </div>

                    {/* Costo de Inscripción */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-medium text-emerald-900 dark:text-emerald-200">Costo de Inscripción</h3>
                      </div>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${league.inscription_cost || 0}
                      </p>
                    </div>

                    {/* Fechas */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-medium text-blue-900 dark:text-blue-200">Fechas</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm text-blue-600 dark:text-blue-400">Inicio:</span>
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
                          <span className="text-sm text-blue-600 dark:text-blue-400">Fin:</span>
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
                        <h3 className="font-medium text-purple-900 dark:text-purple-200">Sistema de Puntuación</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 dark:text-purple-400">Victoria</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_win}</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">puntos</p>
                        </div>
                        <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 dark:text-purple-400">Derrota con Set</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_loss_with_set}</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">puntos</p>
                        </div>
                        <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 dark:text-purple-400">Derrota</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_loss}</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400">puntos</p>
                        </div>
                        {league.points_for_walkover !== undefined && (
                          <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center">
                            <p className="text-sm text-purple-600 dark:text-purple-400">W.O.</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{league.points_for_walkover}</p>
                            <p className="text-xs text-purple-500 dark:text-purple-400">puntos</p>
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
                    selectedCategory={category?.id || ''}
                    onCategoryChange={() => {}}
                    standings={standings}
                    isLoading={isLoadingStandings}
                  />
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
                        Galería de Imágenes
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

