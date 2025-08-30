'use client'

import { useEffect, useState } from 'react'
import { useTournaments } from '@/hooks/useTournaments'
import { SimpleMatchScheduler } from '@/components/Tournaments/TournamentScheduler/SimpleMatchScheduler'
import { AdminGroupsGenerator } from '@/components/Tournaments/groups/AdminGroupsGenerator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  CalendarIcon, 
  UsersIcon, 
  TrophyIcon,
  ChartBarIcon,
  PhotoIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  MapPinIcon,
  BanknotesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface PageProps {
  params: {
    id: string
  }
}

export default function TournamentPage({ params }: PageProps) {
  const router = useRouter()
  const [id, setId] = useState("")
  const [generatingGroups, setGeneratingGroups] = useState(false)
  
  useEffect(() => {
    // Acceder a params.id dentro de useEffect para evitar errores
    if (params) {
      setId(params.id)
    }
  }, [params])

  const {
    tournament,
    teams,
    matches,
    groups,
    standings,
    loading,
    error,
    generateGroups
  } = useTournaments(id || undefined)

  const handleGenerateGroups = async () => {
    try {
      setGeneratingGroups(true)
      await generateGroups()
      toast({
        title: "Grupos generados",
        description: "Los grupos se han generado correctamente"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar los grupos"
      })
    } finally {
      setGeneratingGroups(false)
    }
  }

  // Verificar si ya existen grupos para este torneo
  const groupsAlreadyGenerated = groups && groups.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error || 'No se pudo cargar el torneo'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/tournaments')}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 relative rounded-lg overflow-hidden bg-gray-100">
                {tournament.tournament_info?.tournament_thumbnail ? (
                  <Image
                    src={tournament.tournament_info.tournament_thumbnail}
                    alt={tournament.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <TrophyIcon className="w-6 h-6 text-gray-400 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-3">
                  {tournament.name}
                  <Badge className={
                    tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    tournament.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {tournament.status === 'upcoming' ? 'Inscripciones abiertas' :
                     tournament.status === 'in_progress' ? 'En Curso' : 'Finalizado'}
                  </Badge>
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {tournament.start_date} - {tournament.end_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" />
                    {teams?.length || 0} / {tournament.max_teams} equipos
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Botón para ir a la gestión de grupos */}
            {tournament.status === 'upcoming' && teams?.length === tournament.max_teams && (
              <Button 
                onClick={() => router.push(`/tournaments/${id}/admin-groups`)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                Gestión de Grupos
              </Button>
            )}
            
            {groupsAlreadyGenerated && (
              <Button 
                className="bg-green-500 hover:bg-green-600 cursor-default"
                disabled
              >
                <TrophyIcon className="w-5 h-5 mr-2" />
                Grupos Generados
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4" />
              Información
            </TabsTrigger>
            {tournament.status === 'upcoming' && teams?.length === tournament.max_teams && (
              <TabsTrigger value="admin-groups" className="flex items-center gap-2">
                <Cog6ToothIcon className="w-4 h-4" />
                Gestión de Grupos
              </TabsTrigger>
            )}
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4" />
              Clasificación
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <PhotoIcon className="w-4 h-4" />
              Galería
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            {id && <SimpleMatchScheduler tournamentId={id} />}
          </TabsContent>

          {tournament.status === 'upcoming' && teams?.length === tournament.max_teams && (
            <TabsContent value="admin-groups">
              {id && tournament && (
                <AdminGroupsGenerator 
                  tournamentId={id}
                  tournamentType={tournament.tournament_type}
                  maxTeams={tournament.max_teams}
                />
              )}
            </TabsContent>
          )}

          <TabsContent value="teams">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                {teams && teams.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Equipos Inscritos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teams.map((team, index) => (
                        <div key={team.team_id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">Equipo {index + 1}</div>
                            {team.unavailable_times && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                No disponible: {Array.isArray(team.unavailable_times) ? 
                                  team.unavailable_times.join(', ') : team.unavailable_times}:00
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2 items-center">
                                <UsersIcon className="w-4 h-4 text-gray-500" />
                                <span>
                                  {team.team?.player1?.first_name || 'Jugador'} {team.team?.player1?.last_name || '1'} 
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <UsersIcon className="w-4 h-4 text-gray-500" />
                                <span>
                                  {team.team?.player2?.first_name || 'Jugador'} {team.team?.player2?.last_name || '2'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No hay equipos inscritos en este torneo</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Información del Torneo</h3>
                  
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                        <p className="text-gray-600 text-sm">
                          {tournament.tournament_info?.description || 'Sin descripción disponible'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Ubicación</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4" />
                          <div>
                            <p>{tournament.tournament_info?.tournament_location || 'Sin ubicación'}</p>
                            {tournament.tournament_info?.tournament_address && (
                              <p className="text-xs text-gray-500">{tournament.tournament_info.tournament_address}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Club</h4>
                        <p className="text-gray-600 text-sm">
                          {tournament.tournament_info?.tournament_club_name || 'Recrea Padel Club'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Costo de Inscripción</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BanknotesIcon className="w-4 h-4" />
                          <span>${tournament.tournament_info?.inscription_cost || 0}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Límite de Inscripción</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {tournament.tournament_info?.signup_limit_date || 'Sin límite definido'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Formato</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrophyIcon className="w-4 h-4" />
                          <span>
                            {tournament.tournament_type === 'NINE_PLAYERS' ? '9 Equipos (3 Grupos)' : '12 Equipos (4 Grupos)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premios */}
                  {(tournament.tournament_info?.first_place_prize || 
                    tournament.tournament_info?.second_place_prize || 
                    tournament.tournament_info?.third_place_prize) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Premios</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tournament.tournament_info?.first_place_prize && (
                          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <TrophyIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <p className="font-medium text-yellow-800">1er Lugar</p>
                            <p className="text-sm text-yellow-600">{tournament.tournament_info.first_place_prize}</p>
                          </div>
                        )}
                        {tournament.tournament_info?.second_place_prize && (
                          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <TrophyIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="font-medium text-gray-800">2do Lugar</p>
                            <p className="text-sm text-gray-600">{tournament.tournament_info.second_place_prize}</p>
                          </div>
                        )}
                        {tournament.tournament_info?.third_place_prize && (
                          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <TrophyIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <p className="font-medium text-orange-800">3er Lugar</p>
                            <p className="text-sm text-orange-600">{tournament.tournament_info.third_place_prize}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reglas */}
                  {tournament.tournament_info?.rules && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Reglas del Torneo</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {tournament.tournament_info.rules}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="standings">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                {/* TODO: Implementar vista de clasificación */}
                <div className="text-muted-foreground">Vista de clasificación en desarrollo</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                {/* TODO: Implementar galería de fotos */}
                <div className="text-muted-foreground">Galería en desarrollo</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}