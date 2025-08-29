import { useEffect, useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import { EventDropArg, EventClickArg } from '@fullcalendar/core'
import { useTournaments } from '@/hooks/useTournaments'
import { TournamentMatch } from '@/types/tournament'
import { getTeamName } from '@/types/team'
import { AvailabilitySlot } from './AvailabilitySlot'
import { MatchResultModal } from './MatchResultModal'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import esLocale from '@fullcalendar/core/locales/es'

interface TournamentSchedulerProps {
  tournamentId: string
}

export function TournamentScheduler({ tournamentId }: TournamentSchedulerProps) {
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

  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  // Prepare calendar resources (courts)
  const resources = useMemo(() => {
    if (!tournament?.courts_available) return []
    return Array.from({ length: tournament.courts_available }, (_, i) => ({
      id: `court-${i + 1}`,
      title: `Cancha ${i + 1}`
    }))
  }, [tournament?.courts_available])

  // Prepare calendar events from matches
  const events = useMemo(() => {
    if (!matches) return []
    return matches.map(match => ({
      id: match.id,
      title: `${match.home_team ? getTeamName(match.home_team) : 'Equipo A'} vs ${match.away_team ? getTeamName(match.away_team) : 'Equipo B'}`,
      start: `${match.match_day}T${match.start_time}`,
      end: `${match.match_day}T${addHour(match.start_time)}`,
      resourceId: `court-${match.court_id || 1}`,
      className: getMatchClassName(match),
      extendedProps: {
        matchData: match
      }
    }))
  }, [matches])

  // Handle event drag & drop
  const handleEventDrop = async (info: EventDropArg) => {
    const { event } = info
    const matchId = event.id
    const newDate = event.start!.toISOString().split('T')[0]
    const newTime = event.start!.toTimeString().split(':').slice(0, 2).join(':')
    const newCourtId = event.getResources()[0].id.replace('court-', '')

    try {
      // Validar el nuevo horario
      const validation = await validateSchedule()
      if (validation && !validation.isValid) {
        toast({
          variant: "destructive",
          title: "Error al actualizar horario",
          description: validation.errors.join('. ')
        })
        info.revert()
        return
      }

      await updateMatch(matchId, {
        match_day: newDate,
        start_time: newTime,
        court_id: newCourtId
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
      info.revert()
    }
  }

  // Handle event click
  const handleEventClick = (info: EventClickArg) => {
    setSelectedMatch(info.event.extendedProps.matchData)
    setShowResultModal(true)
  }

  if (loading) return <Skeleton className="w-full h-[600px]" />
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>

  return (
    <div className="flex gap-4">
      {/* Calendar (80%) */}
      <div className="w-4/5">
        <Card>
          <CardContent className="p-4">
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin, resourceTimeGridPlugin]}
              initialView="resourceTimeGridDay"
              resources={resources}
              events={events}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              slotMinTime="09:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={false}
              locale={esLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimeGridDay,resourceTimeGridWeek'
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar (20%) */}
      <div className="w-1/5">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Restricciones de Horarios</h3>
            {availability && Object.entries(availability.availability || {}).map(([hour, data]) => (
              <AvailabilitySlot
                key={hour}
                hour={parseInt(hour)}
                data={data}
              />
            ))}
          </CardContent>
        </Card>
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

// Helper function to add one hour to a time string
function addHour(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  date.setHours(date.getHours() + 1)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`
}

// Helper function to get match class name based on status
function getMatchClassName(match: TournamentMatch): string {
  const classes = ['tournament-match']
  
  switch (match.status) {
    case 'completed':
      classes.push('match-completed')
      break
    case 'in_progress':
      classes.push('match-in-progress')
      break
    default:
      classes.push('match-pending')
  }

  return classes.join(' ')
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