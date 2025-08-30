'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2,
  Shuffle,
  Eye,
  BarChart3,
  RefreshCw,
  Clock,
  Target
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { CategoryStatusCard } from './CategoryStatusCard'
import { TeamsListWithConstraints } from './TeamsListWithConstraints'
import { GroupsVisualization } from './GroupsVisualization'
import { ConflictAnalysis } from './ConflictAnalysis'
import { tournamentGroupsService } from '@/services/tournamentGroupsService'

interface Tournament {
  id: string
  name: string
  category_id: string
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  max_teams: number
  teams_registered: number
  status: 'ready_for_groups' | 'pending' | 'completed'
  groups_generated: boolean
  category_name?: string
}

interface TournamentGroupsManagerProps {
  eventName: string
  tournamentsByCategory: Tournament[]
  onGroupsGenerated?: (results: any[]) => void
}

interface GlobalSlotsUsage {
  total_capacity: number
  current_usage: number
  percentage_full: number
}

interface EventStatus {
  event_name: string
  categories: Tournament[]
  global_slots_usage: GlobalSlotsUsage
}

export function TournamentGroupsManager({ 
  eventName, 
  tournamentsByCategory,
  onGroupsGenerated 
}: TournamentGroupsManagerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [generatingGroups, setGeneratingGroups] = useState<string | null>(null)

  // Cargar estado del evento
  useEffect(() => {
    fetchEventStatus()
  }, [eventName])

  const fetchEventStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar datos proporcionados directamente
      const totalCapacity = tournamentsByCategory.reduce((sum, t) => sum + t.max_teams, 0)
      const currentUsage = tournamentsByCategory.reduce((sum, t) => sum + t.teams_registered, 0)
      
      const mockEventStatus: EventStatus = {
        event_name: eventName,
        categories: tournamentsByCategory.map(tournament => ({
          ...tournament,
          status: tournament.teams_registered === tournament.max_teams ? 'ready_for_groups' : 'pending'
        })),
        global_slots_usage: {
          total_capacity: totalCapacity,
          current_usage: currentUsage,
          percentage_full: totalCapacity > 0 ? Math.round((currentUsage / totalCapacity) * 100) : 0
        }
      }

      setEventStatus(mockEventStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando estado del evento')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateGroups = async (tournamentId: string) => {
    try {
      setGeneratingGroups(tournamentId)
      
      // Usar el servicio integrado
      const result = await tournamentGroupsService.generateGroups(tournamentId)
      
      toast({
        title: "¡Grupos generados exitosamente!",
        description: `Se crearon ${result.groups_created?.length || 0} grupos con distribución inteligente`,
        className: "bg-green-500 text-white border-green-600"
      })

      // Actualizar estado
      await fetchEventStatus()
      
      if (onGroupsGenerated) {
        onGroupsGenerated([result])
      }

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error generando grupos",
        description: err instanceof Error ? err.message : 'Error desconocido'
      })
    } finally {
      setGeneratingGroups(null)
    }
  }

  const handleViewTeams = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setActiveTab('teams')
  }

  const handleViewGroups = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setActiveTab('groups')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Cargando estado del evento...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!eventStatus) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No se encontró información del evento</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header del evento */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Grupos - {eventName}</h1>
            <p className="text-blue-100">
              Sistema inteligente de distribución con cupos compartidos
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {eventStatus.global_slots_usage.current_usage}/{eventStatus.global_slots_usage.total_capacity}
            </div>
            <div className="text-sm text-blue-100">Cupos Globales Utilizados</div>
            <div className="text-xs text-blue-200">
              ({eventStatus.global_slots_usage.percentage_full}% ocupado)
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipos
            {selectedTournament && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedTournament.category_name}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Grupos
            {selectedTournament && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedTournament.category_name}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Análisis
          </TabsTrigger>
        </TabsList>

        {/* Dashboard de Estado por Categoría */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estado de Inscripciones por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {eventStatus.categories.map((tournament) => (
                  <CategoryStatusCard
                    key={tournament.id}
                    tournament={tournament}
                    teamsCount={tournament.teams_registered}
                    maxTeams={tournament.max_teams}
                    canGenerateGroups={tournament.status === 'ready_for_groups'}
                    isGenerating={generatingGroups === tournament.id}
                    onGenerateGroups={() => handleGenerateGroups(tournament.id)}
                    onViewTeams={() => handleViewTeams(tournament)}
                    onViewGroups={() => handleViewGroups(tournament)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumen Global */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                    <p className="text-2xl font-bold">{eventStatus.categories.length}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Equipos Totales</p>
                    <p className="text-2xl font-bold">{eventStatus.global_slots_usage.current_usage}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ocupación Global</p>
                    <p className="text-2xl font-bold">{eventStatus.global_slots_usage.percentage_full}%</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista de Equipos */}
        <TabsContent value="teams">
          {selectedTournament ? (
            <TeamsListWithConstraints
              tournamentId={selectedTournament.id}
              tournament={selectedTournament}
              onBack={() => setActiveTab('dashboard')}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Selecciona una categoría desde el Dashboard para ver sus equipos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vista de Grupos */}
        <TabsContent value="groups">
          {selectedTournament ? (
            <GroupsVisualization
              tournamentId={selectedTournament.id}
              tournament={selectedTournament}
              onBack={() => setActiveTab('dashboard')}
              onRegenerateGroups={() => handleGenerateGroups(selectedTournament.id)}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Selecciona una categoría desde el Dashboard para ver sus grupos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Análisis de Conflictos */}
        <TabsContent value="analysis">
          <ConflictAnalysis
            tournaments={eventStatus.categories}
            eventName={eventName}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
