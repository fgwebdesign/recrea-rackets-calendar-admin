'use client'

import { useState, useEffect } from 'react'
import { TournamentMatch, AvailabilityData } from '@/types/tournament'
import { getTeamName } from '@/types/team'
import { useTournaments } from '@/hooks/useTournaments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CalendarIcon, 
  ClockIcon, 
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { toast } from '@/components/ui/use-toast'
import { AvailabilitySlot } from './AvailabilitySlot'
import { MatchResultModal } from './MatchResultModal'
import { formatDateWithWeekday, getDateRangeArray } from '@/utils/date'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'

interface SimpleMatchSchedulerProps {
  tournamentId: string
}

export function SimpleMatchScheduler({ tournamentId }: SimpleMatchSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [draggingMatch, setDraggingMatch] = useState<string | null>(null)
  const [date, setDate] = useState<Date>(new Date())

  const {
    tournament,
    matches,
    teams,
    availability,
    loading,
    error,
    updateMatch,
    validateSchedule
  } = useTournaments(tournamentId)

  // Establecer el día de hoy como fecha inicial al cargar
  useEffect(() => {
    if (tournament) {
      const today = new Date().toISOString().split('T')[0]
      const startDate = new Date(tournament.start_date)
      const endDate = new Date(tournament.end_date)
      const now = new Date()
      
      // Si hoy está dentro del rango del torneo, usamos hoy
      if (now >= startDate && now <= endDate) {
        setSelectedDate(today)
        setDate(now)
      } else {
        // Si no, usamos la fecha de inicio del torneo
        setSelectedDate(tournament.start_date)
        setDate(new Date(tournament.start_date))
      }
    }
  }, [tournament])

  // Actualizar selectedDate cuando cambia date
  useEffect(() => {
    setSelectedDate(date.toISOString().split('T')[0])
  }, [date])

  // Obtener fechas disponibles para el torneo
  const availableDates = tournament ? 
    getDateRangeArray(tournament.start_date, tournament.end_date) : []

  // Obtener las horas disponibles del torneo
  const availableHours = tournament?.time_slots?.reduce((hours: number[], [start, end]) => {
    for (let hour = start; hour < end; hour++) {
      hours.push(hour)
    }
    return hours
  }, []) || []

  // Filtrar partidos por fecha
  const matchesForSelectedDate = matches?.filter(
    match => match.match_day === selectedDate
  ) || []

  // Agrupar partidos por hora
  const matchesByHour = availableHours.reduce((acc: Record<number, TournamentMatch[]>, hour) => {
    acc[hour] = matchesForSelectedDate.filter(
      match => parseInt(match.start_time.split(':')[0]) === hour
    )
    return acc
  }, {})

  // Partidos sin asignar (sin fecha o hora)
  const unscheduledMatches = matches?.filter(
    match => !match.match_day || !match.start_time || !match.court_id
  ) || []

  const handleDragStart = (matchId: string) => {
    setDraggingMatch(matchId)
  }

  const handleDrop = async (hour: number, courtId: number) => {
    if (!draggingMatch) return

    const match = matches?.find(m => m.id === draggingMatch)
    if (!match) return

    try {
      const newDate = selectedDate
      const newTime = `${hour}:00:00`

      // Validar el nuevo horario
      const validation = await validateSchedule()
      if (validation && !validation.isValid) {
        toast({
          variant: "destructive",
          title: "Error al actualizar horario",
          description: validation.errors.join('. ')
        })
        return
      }

      await updateMatch(draggingMatch, {
        match_day: newDate,
        start_time: newTime,
        court_id: courtId.toString()
      })

      toast({
        title: "Horario actualizado",
        description: "El partido se ha reubicado correctamente"
      })
    } catch (err) {
      console.error('Error updating match:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el horario del partido"
      })
    } finally {
      setDraggingMatch(null)
    }
  }

  const handleMatchClick = (match: TournamentMatch) => {
    setSelectedMatch(match)
    setShowResultModal(true)
  }

  if (loading) {
    return <div className="animate-pulse h-[400px] bg-gray-100 rounded-lg"></div>
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-3/4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Calendario de Partidos</CardTitle>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-auto justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateWithWeekday(selectedDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      disabled={(date) => {
                        if (!tournament) return true
                        const dateStr = date.toISOString().split('T')[0]
                        return !availableDates.includes(dateStr)
                      }}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    if (availableDates.includes(today.toISOString().split('T')[0])) {
                      setDate(today)
                    }
                  }}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Hoy
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <div className="flex border-b">
                <div className="w-[100px] border-r p-2 font-medium">Hora</div>
                {tournament && Array.from({ length: tournament.courts_available || 1 }, (_, i) => (
                  <div key={i} className="flex-1 p-2 text-center font-medium border-r last:border-r-0">
                    Cancha {i + 1}
                  </div>
                ))}
              </div>
              
              {/* Horas y partidos */}
              {availableHours.map(hour => (
                <div key={hour} className="flex border-b last:border-b-0">
                  <div className="w-[100px] border-r p-2 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" /> {hour}:00
                  </div>
                  
                  {tournament && Array.from({ length: tournament.courts_available || 1 }, (_, courtIndex) => {
                    const courtId = courtIndex + 1
                    const matchesInCell = matchesByHour[hour]?.filter(
                      m => parseInt(m.court_id) === courtId
                    ) || []
                    
                    return (
                      <div 
                        key={courtId} 
                        className="flex-1 p-2 border-r last:border-r-0 min-h-[80px]"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(hour, courtId)}
                      >
                        {matchesInCell.length > 0 ? (
                          <div className="space-y-2">
                            {matchesInCell.map(match => (
                              <div 
                                key={match.id}
                                draggable
                                onDragStart={() => handleDragStart(match.id)}
                                onClick={() => handleMatchClick(match)}
                                className={`
                                  p-2 rounded-md text-xs cursor-pointer transition-all
                                  ${match.status === 'completed' ? 'bg-green-100 border border-green-300' : 
                                    match.status === 'in_progress' ? 'bg-blue-100 border border-blue-300' : 
                                    'bg-gray-100 border border-gray-300 hover:bg-gray-200'}
                                `}
                              >
                                <div className="font-medium truncate">
                                  {match.home_team ? getTeamName(match.home_team) : 'Equipo A'} vs {match.away_team ? getTeamName(match.away_team) : 'Equipo B'}
                                </div>
                                {match.status === 'completed' && match.winner_team_id && (
                                  <div className="mt-1 flex items-center">
                                    <Badge className="bg-green-100 text-green-800 text-[10px]">
                                      Ganador: {
                                        match.winner_team_id === match.home_team_id 
                                          ? (match.home_team ? getTeamName(match.home_team) : 'Equipo A')
                                          : (match.away_team ? getTeamName(match.away_team) : 'Equipo B')
                                      }
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full md:w-1/4">
        <Tabs defaultValue="unscheduled">
          <TabsList className="w-full">
            <TabsTrigger value="unscheduled" className="flex-1">Sin programar</TabsTrigger>
            <TabsTrigger value="availability" className="flex-1">Restricciones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unscheduled">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Partidos sin programar</h3>
                {unscheduledMatches.length > 0 ? (
                  <div className="space-y-2">
                    {unscheduledMatches.map(match => (
                      <div
                        key={match.id}
                        draggable
                        onDragStart={() => handleDragStart(match.id)}
                        onClick={() => handleMatchClick(match)}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm cursor-move hover:bg-orange-100"
                      >
                        <div className="font-medium">
                          {match.home_team ? getTeamName(match.home_team) : 'Equipo A'} vs {match.away_team ? getTeamName(match.away_team) : 'Equipo B'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {match.group_number ? `Grupo ${match.group_number}` : 'Sin grupo'} • 
                          {match.round ? ` Ronda ${match.round}` : ' Sin ronda'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    <p>Todos los partidos han sido programados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="availability">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Restricciones de Horarios</h3>
                {availability && Object.entries(availability.availability || {}).map(([hour, data]) => (
                  <AvailabilitySlot
                    key={hour}
                    hour={parseInt(hour)}
                    data={data}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Match Result Modal */}
      {showResultModal && selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          onClose={() => {
            setShowResultModal(false)
            setSelectedMatch(null)
          }}
          onSave={async (
            team1Sets1: number,
            team2Sets1: number,
            team1Sets2: number,
            team2Sets2: number,
            team1Tie1: number,
            team2Tie1: number,
            team1Tie2: number,
            team2Tie2: number,
            team1Tie3: number,
            team2Tie3: number
          ) => {
            try {
              await updateMatch(selectedMatch.id, {
                team1_sets1_won: team1Sets1,
                team2_sets1_won: team2Sets1,
                team1_sets2_won: team1Sets2,
                team2_sets2_won: team2Sets2,
                team1_tie1_won: team1Tie1,
                team2_tie1_won: team2Tie1,
                team1_tie2_won: team1Tie2,
                team2_tie2_won: team2Tie2,
                team1_tie3_won: team1Tie3,
                team2_tie3_won: team2Tie3,
                status: 'completed',
                winner_team_id: determineWinner(
                  team1Sets1, team2Sets1,
                  team1Sets2, team2Sets2,
                  team1Tie3, team2Tie3,
                  selectedMatch.home_team_id,
                  selectedMatch.away_team_id
                )
              })
              toast({
                title: "Resultado guardado",
                description: "El resultado se ha registrado correctamente"
              })
              setShowResultModal(false)
              setSelectedMatch(null)
            } catch (err) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar el resultado"
              })
            }
          }}
        />
      )}
    </div>
  )
}

// Helper function to determine winner based on sets
function determineWinner(
  team1Sets1: number,
  team2Sets1: number,
  team1Sets2: number,
  team2Sets2: number,
  team1Tie3?: number,
  team2Tie3?: number,
  homeTeamId?: string,
  awayTeamId?: string
): string | undefined {
  let team1Sets = 0
  let team2Sets = 0

  // Set 1
  if (team1Sets1 > team2Sets1) team1Sets++
  else if (team2Sets1 > team1Sets1) team2Sets++

  // Set 2
  if (team1Sets2 > team2Sets2) team1Sets++
  else if (team2Sets2 > team1Sets2) team2Sets++

  // Super Tie Break
  if (team1Sets === team2Sets && team1Tie3 !== undefined && team2Tie3 !== undefined) {
    if (team1Tie3 > team2Tie3) team1Sets++
    else if (team2Tie3 > team1Tie3) team2Sets++
  }

  if (team1Sets > team2Sets) return homeTeamId
  if (team2Sets > team1Sets) return awayTeamId
  return undefined
}