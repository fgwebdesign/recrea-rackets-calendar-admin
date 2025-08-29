import { useState, useCallback, useEffect } from 'react'
import { 
  Tournament, 
  TournamentMatch, 
  AvailabilityData,
  TournamentTeam,
  TournamentGroup,
  TournamentStanding 
} from '@/types/tournament'
import { tournamentService } from '@/services/tournamentService'
import useSWR from 'swr'

interface TournamentData {
  tournament: Tournament | null
  matches: TournamentMatch[]
  teams: TournamentTeam[]
  groups: TournamentGroup[]
  standings: TournamentStanding[]
  availability: AvailabilityData | null
}

export const useTournaments = (tournamentId?: string) => {
  const [data, setData] = useState<TournamentData>({
    tournament: null,
    matches: [],
    teams: [],
    groups: [],
    standings: [],
    availability: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usar SWR para datos que necesitan actualizarse en tiempo real
  const { data: swrData, error: swrError, mutate } = useSWR(
    tournamentId ? `/api/tournaments/${tournamentId}` : null,
    () => tournamentService.getTournament(tournamentId!)
  )

  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [
        tournament,
        matches,
        teams,
        groups,
        standings,
        availability
      ] = await Promise.all([
        tournamentService.getTournament(tournamentId),
        tournamentService.getTournamentMatches(tournamentId),
        tournamentService.getTournamentTeams(tournamentId),
        tournamentService.getTournamentGroups(tournamentId),
        tournamentService.getTournamentStandings(tournamentId),
        tournamentService.getAvailableHours(tournamentId)
      ])

      setData({
        tournament,
        matches,
        teams,
        groups,
        standings,
        availability
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching tournament data:', err)
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  // Función para actualizar un partido
  const updateMatch = async (
    matchId: string,
    matchData: Parameters<typeof tournamentService.updateMatch>[1]
  ) => {
    try {
      const updatedMatch = await tournamentService.updateMatch(matchId, matchData)
      
      // Actualizar el partido en el estado local
      setData(prev => ({
        ...prev,
        matches: prev.matches.map(m => 
          m.id === matchId ? updatedMatch : m
        )
      }))

      // Si el partido está completado, actualizar clasificación
      if (matchData.status === 'completed') {
        const standings = await tournamentService.getTournamentStandings(tournamentId!)
        setData(prev => ({ ...prev, standings }))
      }

      return updatedMatch
    } catch (err) {
      console.error('Error updating match:', err)
      throw err
    }
  }

  // Generar grupos del torneo
  const generateGroups = async () => {
    if (!tournamentId) return
    try {
      const groups = await tournamentService.generateGroups(tournamentId)
      setData(prev => ({ ...prev, groups }))
      return groups
    } catch (err) {
      console.error('Error generating groups:', err)
      throw err
    }
  }

  // Validar horario del torneo
  const validateSchedule = async () => {
    if (!tournamentId) return null
    return tournamentService.validateSchedule(tournamentId)
  }

  useEffect(() => {
    fetchTournamentData()
  }, [fetchTournamentData])

  return {
    ...data,
    loading,
    error,
    refetch: fetchTournamentData,
    updateMatch,
    generateGroups,
    validateSchedule,
    mutate
  }
}