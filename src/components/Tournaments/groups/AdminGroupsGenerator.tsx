'use client'

import React, { useState, useEffect } from 'react'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Shuffle,
  Save,
  Eye,
  Shield,
  Target
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { TeamWithPlayers, AvailabilityData } from '@/types/tournament'

interface AdminGroupsGeneratorProps {
  tournamentId: string
  tournamentType: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  maxTeams: number
}

interface TeamWithRestrictions extends TeamWithPlayers {
  unavailable_hour?: number
  restrictions?: string[]
}

interface GroupData {
  id: string
  name: string
  teams: TeamWithRestrictions[]
  conflicts: string[]
}

export function AdminGroupsGenerator({ 
  tournamentId, 
  tournamentType,
  maxTeams 
}: AdminGroupsGeneratorProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [allTeams, setAllTeams] = useState<TeamWithRestrictions[]>([])
  const [generating, setGenerating] = useState(false)
  
  // Configuración de grupos según tipo de torneo
  const groupsConfig = {
    'NINE_PLAYERS': { count: 3, teamsPerGroup: 3 },
    'TWELVE_PLAYERS': { count: 4, teamsPerGroup: 3 }
  }
  
  const config = groupsConfig[tournamentType]
  
  // Inicializar grupos vacíos
  const initialGroups: GroupData[] = Array.from({ length: config.count }, (_, i) => ({
    id: `group-${i + 1}`,
    name: `Grupo ${i + 1}`,
    teams: [],
    conflicts: []
  }))

  // Drag & Drop para equipos disponibles
  const [availableTeamsRef, availableTeams, setAvailableTeams] = useDragAndDrop<HTMLDivElement, TeamWithRestrictions>(
    [],
    {
      group: 'tournament-teams',
      sortable: false
    }
  )

  // Drag & Drop básico para grupos (evitar hooks condicionales)
  const [group1Ref, group1Teams, setGroup1Teams] = useDragAndDrop<HTMLDivElement, TeamWithRestrictions>([], {
    group: 'tournament-teams',
    sortable: true
  })

  const [group2Ref, group2Teams, setGroup2Teams] = useDragAndDrop<HTMLDivElement, TeamWithRestrictions>([], {
    group: 'tournament-teams',
    sortable: true
  })

  const [group3Ref, group3Teams, setGroup3Teams] = useDragAndDrop<HTMLDivElement, TeamWithRestrictions>([], {
    group: 'tournament-teams',
    sortable: true
  })

  // Para torneos de 12 jugadores - siempre inicializar para evitar hooks condicionales
  const [group4Ref, group4Teams, setGroup4Teams] = useDragAndDrop<HTMLDivElement, TeamWithRestrictions>([], {
    group: 'tournament-teams',
    sortable: true
  })

  // Obtener datos del torneo
  useEffect(() => {
    fetchTournamentData()
  }, [tournamentId])

  const fetchTournamentData = async () => {
    try {
      setLoading(true)
      
      // Obtener equipos con restricciones
      const teamsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/teams`)
      if (!teamsResponse.ok) throw new Error('Error obteniendo equipos')
      const teamsData = await teamsResponse.json()
      
      // Obtener disponibilidad por horarios
      const availabilityResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/available-hours`)
      if (!availabilityResponse.ok) throw new Error('Error obteniendo disponibilidad')
      const availabilityData = await availabilityResponse.json()
      
      // Procesar equipos con sus restricciones
      console.log('Teams data received:', teamsData) // Debug
      
      if (!teamsData.teams || !Array.isArray(teamsData.teams)) {
        throw new Error('Invalid teams data structure')
      }

      const processedTeams: TeamWithRestrictions[] = teamsData.teams.map((team: any, index: number) => {
        console.log('Processing team:', team) // Debug
        
        return {
          team_id: team.team_id,
          player1: {
            id: team.teams.player1_id,
            first_name: team.teams.player1?.first_name || `Jugador`,
            last_name: team.teams.player1?.last_name || `${index * 2 + 1}`
          },
          player2: {
            id: team.teams.player2_id,
            first_name: team.teams.player2?.first_name || `Jugador`,
            last_name: team.teams.player2?.last_name || `${index * 2 + 2}`
          },
          unavailable_hour: team.unavailable_times,
          restrictions: team.unavailable_times ? [`No disponible a las ${team.unavailable_times}:00`] : []
        }
      })
      
      setAllTeams(processedTeams)
      setAvailableTeams(processedTeams)
      setAvailability(availabilityData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }



  // Distribución automática inteligente
  const autoDistributeTeams = () => {
    if (availableTeams.length === 0) return

    // Agrupar equipos por restricción horaria
    const teamsByRestriction: Record<string, TeamWithRestrictions[]> = {}
    const teamsWithoutRestrictions: TeamWithRestrictions[] = []

    availableTeams.forEach(team => {
      if (team.unavailable_hour !== undefined && team.unavailable_hour !== null) {
        const key = team.unavailable_hour.toString()
        if (!teamsByRestriction[key]) teamsByRestriction[key] = []
        teamsByRestriction[key].push(team)
      } else {
        teamsWithoutRestrictions.push(team)
      }
    })

    // Limpiar grupos actuales
    setGroup1Teams([])
    setGroup2Teams([])
    setGroup3Teams([])
    if (tournamentType === 'TWELVE_PLAYERS') {
      setGroup4Teams([])
    }

    // Distribuir equipos con restricciones primero (uno por grupo)
    const newGroups: TeamWithRestrictions[][] = Array.from({ length: config.count }, () => [])
    let groupIndex = 0

    Object.values(teamsByRestriction).forEach(restrictedTeams => {
      restrictedTeams.forEach(team => {
        newGroups[groupIndex % config.count].push(team)
        groupIndex++
      })
    })

    // Distribuir equipos sin restricciones
    teamsWithoutRestrictions.forEach((team: TeamWithRestrictions) => {
      // Encontrar el grupo con menos equipos
      const minGroupIndex = newGroups.reduce((minIdx, group, idx) => 
        group.length < newGroups[minIdx].length ? idx : minIdx, 0
      )
      newGroups[minGroupIndex].push(team)
    })

    // Aplicar la distribución
    setGroup1Teams(newGroups[0] || [])
    setGroup2Teams(newGroups[1] || [])
    setGroup3Teams(newGroups[2] || [])
    if (tournamentType === 'TWELVE_PLAYERS') {
      setGroup4Teams(newGroups[3] || [])
    }

    // Limpiar equipos disponibles
    setAvailableTeams([])

    toast({
      title: "Distribución automática completada",
      description: "Los equipos han sido distribuidos considerando sus restricciones horarias"
    })
  }

  // Generar grupos en el backend
  const generateGroups = async () => {
    try {
      setGenerating(true)

      // Verificar que todos los equipos estén asignados
      const totalAssigned = group1Teams.length + group2Teams.length + group3Teams.length + 
                           (tournamentType === 'TWELVE_PLAYERS' ? group4Teams.length : 0)
      
      if (totalAssigned !== maxTeams) {
        toast({
          variant: "destructive",
          title: "Error de asignación",
          description: `Debes asignar todos los ${maxTeams} equipos a los grupos`
        })
        return
      }

      // Validar que cada grupo tenga exactamente 3 equipos
      const groups = [group1Teams, group2Teams, group3Teams]
      if (tournamentType === 'TWELVE_PLAYERS') {
        groups.push(group4Teams)
      }

      const invalidGroups = groups.filter(group => group.length !== 3)
      if (invalidGroups.length > 0) {
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "Cada grupo debe tener exactamente 3 equipos"
        })
        return
      }

      // Preparar la configuración manual de grupos
      const manualGroupsConfig = {
        groups: [
          { group_number: 1, teams: group1Teams.map(t => t.team_id) },
          { group_number: 2, teams: group2Teams.map(t => t.team_id) },
          { group_number: 3, teams: group3Teams.map(t => t.team_id) },
          ...(tournamentType === 'TWELVE_PLAYERS' ? 
            [{ group_number: 4, teams: group4Teams.map(t => t.team_id) }] : [])
        ]
      }

      // Usar endpoint para generación manual
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/generate-groups-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualGroupsConfig)
      })

      if (!response.ok) throw new Error('Error generando grupos')

      toast({
        title: "¡Grupos generados exitosamente!",
        description: "Los grupos han sido creados en el sistema. Nota: Se usó la distribución actual como referencia."
      })

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Error generando grupos'
      })
    } finally {
      setGenerating(false)
    }
  }

  // Resetear todos los grupos
  const resetGroups = () => {
    setAvailableTeams(allTeams)
    setGroup1Teams([])
    setGroup2Teams([])
    setGroup3Teams([])
    if (tournamentType === 'TWELVE_PLAYERS') {
      setGroup4Teams([])
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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

  const groups = [
    { id: 'group-1', name: 'Grupo 1', teams: group1Teams, ref: group1Ref },
    { id: 'group-2', name: 'Grupo 2', teams: group2Teams, ref: group2Ref },
    { id: 'group-3', name: 'Grupo 3', teams: group3Teams, ref: group3Ref },
    ...(tournamentType === 'TWELVE_PLAYERS' ? 
      [{ id: 'group-4', name: 'Grupo 4', teams: group4Teams, ref: group4Ref }] : [])
  ]

  // Validación simple sin hooks problemáticos
  const isDistributionValid = () => {
    const totalAssigned = group1Teams.length + group2Teams.length + group3Teams.length + 
                         (tournamentType === 'TWELVE_PLAYERS' ? group4Teams.length : 0)
    const allGroupsComplete = groups.every(group => group.teams.length === config.teamsPerGroup)
    return totalAssigned === maxTeams && allGroupsComplete
  }

  const getGroupStatus = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return 'empty'
    if (group.teams.length === config.teamsPerGroup) return 'complete'
    if (group.teams.length > config.teamsPerGroup) return 'error'
    if (group.teams.length > 0) return 'warning'
    return 'empty'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Generador de Grupos Avanzado</h2>
          <p className="text-gray-600">
            Arrastra y suelta equipos para crear grupos considerando las restricciones horarias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoDistributeTeams} disabled={availableTeams.length === 0}>
            <Shuffle className="w-4 h-4 mr-2" />
            Auto Distribuir
          </Button>
          <Button variant="outline" onClick={resetGroups}>
            Resetear
          </Button>
          <Button 
            onClick={generateGroups} 
            disabled={generating || !isDistributionValid()}
            className={`${
              isDistributionValid() 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <>Generando...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Grupos Manualmente
                {!isDistributionValid() && <Shield className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Creación de Grupos
            {isDistributionValid() && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="restrictions" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Restricciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex gap-6">
            {/* Panel Lateral Izquierdo: Restricciones y Equipos */}
            <div className="w-80 space-y-4">
              {/* Panel de Restricciones Horarias */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5" />
                    Restricciones de Horarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availability && Object.entries(availability.availability).map(([hour, data]) => (
                    <div key={hour} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{hour}:00</span>
                        <Badge variant={data.available ? "default" : "destructive"}>
                          {data.selected_count}/{data.total_capacity}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${data.percentage_full}%` }}
                        ></div>
                      </div>
                      {data.teams.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600">Equipos con restricción:</p>
                          {data.teams.map((team) => (
                            <div key={team.team_id} className="text-xs p-1 bg-orange-50 rounded">
                              {team.player1.first_name} {team.player1.last_name} / {team.player2.first_name} {team.player2.last_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Equipos Disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Equipos Disponibles ({availableTeams.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={availableTeamsRef}
                    className="space-y-2 min-h-[300px] p-2 border-2 border-dashed border-gray-200 rounded-lg"
                  >
                    {availableTeams.map((team: TeamWithRestrictions) => (
                      <TeamCard key={team.team_id} team={team} isDragging />
                    ))}
                    {availableTeams.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Todos los equipos han sido asignados
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel Principal: Grupos */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  return (
                    <GroupDropZone
                      key={group.id}
                      group={group}
                      maxTeams={config.teamsPerGroup}
                      status={getGroupStatus(group.id)}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="restrictions">
          <RestrictionsView availability={availability} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para mostrar un equipo
function TeamCard({ team, isDragging = false }: { team: TeamWithRestrictions, isDragging?: boolean }) {
  return (
    <div 
      className={`
        p-3 bg-white border rounded-lg shadow-sm transition-all
        ${isDragging ? 'cursor-move hover:shadow-md' : ''}
        ${team.unavailable_hour ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}
      `}
    >
      <div className="font-medium text-sm">
        {team.player1.first_name} {team.player1.last_name}
      </div>
      <div className="font-medium text-sm">
        {team.player2.first_name} {team.player2.last_name}
      </div>
      {team.unavailable_hour && (
        <Badge variant="outline" className="mt-1 text-xs bg-orange-100 text-orange-700">
          <Clock className="w-3 h-3 mr-1" />
          No a las {team.unavailable_hour}:00
        </Badge>
      )}
    </div>
  )
}

// Componente para zona de drop de grupos
function GroupDropZone({ 
  group, 
  maxTeams,
  status
}: { 
  group: { 
    id: string
    name: string
    teams: TeamWithRestrictions[]
    ref: React.RefObject<HTMLDivElement>
  }
  maxTeams: number 
  status: 'complete' | 'warning' | 'error' | 'empty'
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'complete': return 'border-green-300 bg-green-50'
      case 'error': return 'border-red-300 bg-red-50'
      case 'warning': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  return (
    <Card className={`transition-all ${status === 'error' ? 'border-red-300' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {group.name}
            {getStatusIcon()}
          </div>
          <Badge variant={status === 'complete' ? "default" : "secondary"}>
            {group.teams.length}/{maxTeams}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={group.ref}
          className={`
            space-y-2 min-h-[300px] p-2 border-2 border-dashed rounded-lg transition-all
            ${getStatusColor()}
          `}
        >
          {group.teams.map((team) => (
            <TeamCard key={team.team_id} team={team} />
          ))}
          {group.teams.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Arrastra equipos aquí
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}



// Componente para mostrar restricciones
function RestrictionsView({ availability }: { availability: AvailabilityData | null }) {
  if (!availability) return <div>Cargando restricciones...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(availability.availability).map(([hour, data]) => (
        <Card key={hour}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {hour}:00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Cupos utilizados:</span>
                <Badge variant={data.available ? "default" : "destructive"}>
                  {data.selected_count}/{data.total_capacity}
                </Badge>
              </div>
              
              {data.teams.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Equipos con restricción:</p>
                  <div className="space-y-1">
                    {data.teams.map((team) => (
                      <div key={team.team_id} className="text-xs p-2 bg-gray-50 rounded">
                        {team.player1.first_name} {team.player1.last_name} / {team.player2.first_name} {team.player2.last_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
