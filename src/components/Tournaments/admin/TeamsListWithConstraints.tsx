'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Clock, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  User,
  Calendar
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { tournamentGroupsService } from '@/services/tournamentGroupsService'
import { TimeSlotBadge } from './TimeSlotBadge'

interface Tournament {
  id: string
  name: string
  category_id: string
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  max_teams: number
  teams_registered: number
  status: string
  category_name?: string
}

interface TimeSlot {
  id: string
  day: string
  start: string
  end: string
  label: string
  tournament_day: number
  date: string
}

interface TeamWithConstraints {
  team_id: string
  player1: {
    id: string
    first_name: string
    last_name: string
  }
  player2: {
    id: string
    first_name: string
    last_name: string
  }
  unavailable_time_slot: string
  slot_label: string
}

interface TeamsListWithConstraintsProps {
  tournamentId: string
  tournament: Tournament
  onBack: () => void
}

export function TeamsListWithConstraints({
  tournamentId,
  tournament,
  onBack
}: TeamsListWithConstraintsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<TeamWithConstraints[]>([])
  const [groupTimeSlots, setGroupTimeSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchTeamsWithConstraints()
  }, [tournamentId])

  const fetchTeamsWithConstraints = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar el servicio integrado
      const data = await tournamentGroupsService.getTeamsWithConstraints(tournamentId)
      
      setTeams(data.teams)

      // Si hay información del torneo, extraer los time slots
      if (data.tournament_info?.group_time_slots) {
        setGroupTimeSlots(data.tournament_info.group_time_slots)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando equipos')
    } finally {
      setLoading(false)
    }
  }

  const getSlotInfo = (slotId: string) => {
    const slot = groupTimeSlots.find(s => s.id === slotId)
    return slot ? slot.label : slotId
  }

  const getSlotsByDay = () => {
    const slotsByDay: Record<number, TimeSlot[]> = {}
    groupTimeSlots.forEach(slot => {
      if (!slotsByDay[slot.tournament_day]) {
        slotsByDay[slot.tournament_day] = []
      }
      slotsByDay[slot.tournament_day].push(slot)
    })
    return slotsByDay
  }

  const getTeamsBySlot = () => {
    const teamsBySlot: Record<string, TeamWithConstraints[]> = {}
    teams.forEach(team => {
      const slotId = team.unavailable_time_slot || 'sin_restriccion'
      if (!teamsBySlot[slotId]) {
        teamsBySlot[slotId] = []
      }
      teamsBySlot[slotId].push(team)
    })
    return teamsBySlot
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Cargando equipos con restricciones...</span>
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

  const expectedGroups = tournament.tournament_type === 'NINE_PLAYERS' ? 3 : 4
  const teamsPerGroup = 3
  const teamsBySlot = getTeamsBySlot()
  const slotsByDay = getSlotsByDay()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              Equipos Inscritos - {tournament.category_name}
            </h2>
            <p className="text-gray-600">
              {teams.length}/{tournament.max_teams} equipos • Formato: {tournament.tournament_type} ({expectedGroups} grupos de {teamsPerGroup})
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de Restricciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                <p className="text-2xl font-bold">{teams.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con Restricciones</p>
                <p className="text-2xl font-bold">
                  {teams.filter(t => t.unavailable_time_slot).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Restricciones</p>
                <p className="text-2xl font-bold">
                  {teams.filter(t => !t.unavailable_time_slot).length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Equipos por Time Slot */}
      <div className="space-y-6">
        {/* Equipos con restricciones agrupados por time slot */}
        {Object.keys(slotsByDay).length > 0 && (
          <>
            {Object.entries(slotsByDay).map(([day, slots]) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Día {day} - Restricciones Horarias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {slots.map(slot => {
                      const teamsInSlot = teamsBySlot[slot.id] || []
                      return (
                        <div key={slot.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="font-medium">{slot.label}</span>
                            </div>
                            <Badge variant={teamsInSlot.length > 0 ? "destructive" : "secondary"}>
                              🚫 {teamsInSlot.length} equipos NO disponibles
                            </Badge>
                          </div>
                          
                          {teamsInSlot.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {teamsInSlot.map(team => (
                                <TeamCard key={team.team_id} team={team} showRestriction={false} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                              <p className="text-sm">No hay equipos con restricción en este horario</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* Equipos sin restricciones */}
        {teamsBySlot['sin_restriccion'] && teamsBySlot['sin_restriccion'].length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Equipos Sin Restricciones Horarias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {teamsBySlot['sin_restriccion'].map(team => (
                  <TeamCard key={team.team_id} team={team} showRestriction={false} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todos los equipos en una lista */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista Completa de Equipos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {teams.map(team => (
                <TeamCard key={team.team_id} team={team} showRestriction={true} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Algoritmo Inteligente:</strong> El sistema distribuirá automáticamente los equipos 
          en {expectedGroups} grupos considerando sus restricciones horarias para maximizar la flexibilidad 
          de programación de partidos.
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Componente para mostrar un equipo
function TeamCard({ 
  team, 
  showRestriction = true 
}: { 
  team: TeamWithConstraints
  showRestriction?: boolean 
}) {
  return (
    <div className={`
      p-3 bg-white border rounded-lg shadow-sm transition-all hover:shadow-md
      ${team.unavailable_time_slot ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}
    `}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">
            {team.player1.first_name} {team.player1.last_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">
            {team.player2.first_name} {team.player2.last_name}
          </span>
        </div>
        
        {showRestriction && team.unavailable_time_slot && (
          <TimeSlotBadge
            slotId={team.unavailable_time_slot}
            label={team.slot_label}
            variant="restriction"
            size="sm"
          />
        )}
        
        {showRestriction && !team.unavailable_time_slot && (
          <TimeSlotBadge
            slotId="available"
            label="Disponible siempre"
            variant="available"
            size="sm"
          />
        )}
      </div>
    </div>
  )
}
