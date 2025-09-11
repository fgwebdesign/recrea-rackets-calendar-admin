// ========================================
// 🎾 HOOKS PERSONALIZADOS - SISTEMA REVOLUCIONARIO
// ========================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Tournament, 
  TournamentInfo,
  TournamentTeam, 
  TournamentMatch, 
  TournamentGroup, 
  TournamentStanding,
  GroupDistribution,
  ScheduledMatch,
  AvailabilityData,
  EliminationBracket,
  TournamentStats,
  TeamWithConstraints,
  ConflictInfo,
  TournamentFormData
} from '@/types/tournament'
import { 
  tournamentService, 
  groupService, 
  matchService, 
  bracketService, 
  statsService 
} from '@/services/tournamentService'
import { tournamentDetailsService } from '@/services/tournamentDetailsService'

// ========================================
// 🔧 TIPOS DE HOOKS
// ========================================

interface UseTournamentsReturn {
  tournaments: Tournament[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTournament: (data: TournamentFormData, token: string) => Promise<Tournament>
  updateTournament: (id: string, data: Partial<TournamentFormData>, token: string) => Promise<Tournament>
  deleteTournament: (id: string, token: string) => Promise<void>
}

interface UseTournamentReturn {
  tournament: Tournament | null
  tournamentInfo: TournamentInfo | null
  teams: TournamentTeam[]
  matches: TournamentMatch[]
  groups: TournamentGroup[]
  standings: TournamentStanding[]
  stats: TournamentStats | null
  availableHours: any[]
  availableTimeSlots: any[]
  scheduleValidation: any
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  joinTournament: (teamId: string, unavailableTimes?: string) => Promise<void>
  generateGroups: (token: string) => Promise<void>
  scheduleMatches: (token: string) => Promise<void>
  generateBracket: (token: string) => Promise<void>
}

interface UseGroupsReturn {
  groups: GroupDistribution[]
  loading: boolean
  error: string | null
  conflicts: ConflictInfo[]
  generateGroups: (token: string) => Promise<void>
  validateConflicts: (token: string) => Promise<void>
  refetch: () => Promise<void>
}

interface UseMatchesReturn {
  matches: TournamentMatch[]
  scheduledMatches: ScheduledMatch[]
  loading: boolean
  error: string | null
  scheduleMatches: (token: string) => Promise<void>
  updateMatchResult: (matchId: string, result: any, token: string) => Promise<void>
  refetch: () => Promise<void>
}

// ========================================
// 🏆 HOOK PRINCIPAL DE TORNEOS
// ========================================

export function useTournaments(): UseTournamentsReturn {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tournamentService.getTournaments()
      setTournaments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar torneos')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTournament = useCallback(async (data: TournamentFormData, token: string) => {
    try {
      const newTournament = await tournamentService.createTournament(data, token)
      setTournaments(prev => [...prev, newTournament])
      return newTournament
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear torneo')
    }
  }, [])

  const updateTournament = useCallback(async (id: string, data: Partial<TournamentFormData>, token: string) => {
    try {
      const updatedTournament = await tournamentService.updateTournament(id, data, token)
      setTournaments(prev => prev.map(t => t.id === id ? updatedTournament : t))
      return updatedTournament
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar torneo')
    }
  }, [])

  const deleteTournament = useCallback(async (id: string, token: string) => {
    try {
      await tournamentService.deleteTournament(id, token)
      setTournaments(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar torneo')
    }
  }, [])

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  return {
    tournaments,
    loading,
    error,
    refetch: fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament
  }
}

// ========================================
// 🎯 HOOK DE TORNEO ESPECÍFICO
// ========================================

export function useTournament(tournamentId: string): UseTournamentReturn {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null)
  const [teams, setTeams] = useState<TournamentTeam[]>([])
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [standings, setStandings] = useState<TournamentStanding[]>([])
  const [stats, setStats] = useState<TournamentStats | null>(null)
  const [availableHours, setAvailableHours] = useState<any[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([])
  const [scheduleValidation, setScheduleValidation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) return

    try {
      setLoading(true)
      setError(null)

      const [
        tournamentData,
        teamsData,
        matchesData,
        groupsData,
        statsData,
        standingsData,
        availableHoursData,
        availableTimeSlotsData,
        scheduleValidationData
      ] = await Promise.all([
        tournamentService.getTournamentById(tournamentId),
        tournamentService.getTournamentTeams(tournamentId),
        matchService.getTournamentMatches(tournamentId),
        groupService.getGroups(tournamentId),
        statsService.getTournamentStats(tournamentId),
        tournamentService.getTournamentStandings(tournamentId),
        tournamentDetailsService.getAvailableHours(tournamentId),
        tournamentDetailsService.getAvailableTimeSlots(tournamentId),
        tournamentDetailsService.validateSchedule(tournamentId)
      ])

      setTournament(tournamentData)
      setTournamentInfo(Array.isArray(tournamentData.tournament_info) ? tournamentData.tournament_info[0] : tournamentData.tournament_info || null)
      
      // ✅ Corregir: extraer el array teams del objeto de respuesta
      const teamsArray = (teamsData as any)?.teams || teamsData || []
      
      setTeams(Array.isArray(teamsArray) ? teamsArray : [])
      setMatches(Array.isArray(matchesData) ? matchesData : [])
      
      // Debug: verificar datos de grupos
      console.log('🔍 Groups data from backend:', groupsData)
      console.log('🔍 Groups is array?', Array.isArray(groupsData))
      
      setGroups(Array.isArray(groupsData) ? groupsData : [])
      setStats(statsData)
      setStandings(Array.isArray(standingsData) ? standingsData : [])
      setAvailableHours(Array.isArray(availableHoursData) ? availableHoursData : [])
      setAvailableTimeSlots(Array.isArray(availableTimeSlotsData) ? availableTimeSlotsData : [])
      setScheduleValidation(scheduleValidationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del torneo')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  const joinTournament = useCallback(async (teamId: string, unavailableTimes?: string) => {
    try {
      await tournamentService.joinTournament(tournamentId, teamId, unavailableTimes)
      await fetchTournamentData() // Refrescar datos
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al registrar equipo')
    }
  }, [tournamentId, fetchTournamentData])

  const generateGroups = useCallback(async (token: string) => {
    try {
      await groupService.generateGroupsAutomatic(tournamentId, token)
      await fetchTournamentData() // Refrescar datos
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al generar grupos')
    }
  }, [tournamentId, fetchTournamentData])

  const scheduleMatches = useCallback(async (token: string) => {
    try {
      await matchService.scheduleMatchesByGroup(tournamentId, token)
      await fetchTournamentData() // Refrescar datos
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al programar partidos')
    }
  }, [tournamentId, fetchTournamentData])

  const generateBracket = useCallback(async (token: string) => {
    try {
      await bracketService.generateEliminationBracket(tournamentId, token)
      await fetchTournamentData() // Refrescar datos
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al generar bracket')
    }
  }, [tournamentId, fetchTournamentData])

  useEffect(() => {
    fetchTournamentData()
  }, [fetchTournamentData])

  return {
    tournament,
    tournamentInfo,
    teams,
    matches,
    groups,
    standings,
    stats,
    availableHours,
    availableTimeSlots,
    scheduleValidation,
    loading,
    error,
    refetch: fetchTournamentData,
    joinTournament,
    generateGroups,
    scheduleMatches,
    generateBracket
  }
}

// ========================================
// 👥 HOOK DE GRUPOS
// ========================================

export function useGroups(tournamentId: string): UseGroupsReturn {
  const [groups, setGroups] = useState<GroupDistribution[]>([])
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateGroups = useCallback(async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await groupService.generateGroupsAutomatic(tournamentId, token)
      setGroups(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar grupos')
      throw err
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  const validateConflicts = useCallback(async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await groupService.validateScheduleConflicts(tournamentId, token)
      setConflicts(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar conflictos')
      throw err
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  const refetch = useCallback(async () => {
    // Refetch groups data
    try {
      const groupsData = await groupService.getGroups(tournamentId)
      // Convert to GroupDistribution format if needed
      setGroups(groupsData as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recargar grupos')
    }
  }, [tournamentId])

  return {
    groups,
    loading,
    error,
    conflicts,
    generateGroups,
    validateConflicts,
    refetch
  }
}

// ========================================
// ⚽ HOOK DE PARTIDOS
// ========================================

export function useMatches(tournamentId: string): UseMatchesReturn {
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scheduleMatches = useCallback(async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await matchService.scheduleMatchesByGroup(tournamentId, token)
      setScheduledMatches(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al programar partidos')
      throw err
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  const updateMatchResult = useCallback(async (matchId: string, result: any, token: string) => {
    try {
      const updatedMatch = await matchService.updateMatchResult(matchId, result, token)
      setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar resultado')
    }
  }, [])

  const refetch = useCallback(async () => {
    try {
      const matchesData = await matchService.getTournamentMatches(tournamentId)
      setMatches(matchesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recargar partidos')
    }
  }, [tournamentId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    matches,
    scheduledMatches,
    loading,
    error,
    scheduleMatches,
    updateMatchResult,
    refetch
  }
}

// ========================================
// 📊 HOOK DE ESTADÍSTICAS
// ========================================

export function useTournamentStats(tournamentId: string) {
  const [stats, setStats] = useState<TournamentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const statsData = await statsService.getTournamentStats(tournamentId)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// ========================================
// 🎯 HOOK DE DISPONIBILIDAD
// ========================================

export function useAvailability(tournamentId: string) {
  const [availability, setAvailability] = useState<AvailabilityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await tournamentService.getAvailableTimeSlots(tournamentId)
      setAvailability(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar disponibilidad')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  return {
    availability,
    loading,
    error,
    refetch: fetchAvailability
  }
}

// ========================================
// 🏆 HOOK DE BRACKET
// ========================================

export function useBracket(tournamentId: string) {
  const [bracket, setBracket] = useState<EliminationBracket | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateBracket = useCallback(async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await bracketService.generateEliminationBracket(tournamentId, token)
      setBracket(response.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar bracket')
      throw err
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  const fetchBracket = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const bracketData = await bracketService.getEliminationBracket(tournamentId)
      setBracket(bracketData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bracket')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  return {
    bracket,
    loading,
    error,
    generateBracket,
    refetch: fetchBracket
  }
}

// ========================================
// 🔄 HOOK DE FORMULARIO DE TORNEO
// ========================================

export function useTournamentForm() {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    categories: [],
    start_date: '',
    end_date: '',
    courts_available: 4,
    time_slots: [],
    group_time_slots: [],
    tournament_type: 'NINE_PLAYERS',
    description: '',
    rules: '',
    tournament_location: '',
    tournament_address: '',
    tournament_club_name: 'Recrea Padel Club',
    signup_limit_date: '',
    inscription_cost: 0,
    sponsors: [],
    first_place_prize: '',
    second_place_prize: '',
    third_place_prize: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del torneo es obligatorio'
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Debe seleccionar al menos una categoría'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'La fecha de fin es obligatoria'
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }

    if (formData.courts_available < 1) {
      newErrors.courts_available = 'Debe tener al menos 1 cancha disponible'
    }

    if (formData.time_slots.length === 0) {
      newErrors.time_slots = 'Debe configurar al menos un horario'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria'
    }

    if (!formData.rules.trim()) {
      newErrors.rules = 'Las reglas son obligatorias'
    }

    if (!formData.tournament_location.trim()) {
      newErrors.tournament_location = 'La ubicación es obligatoria'
    }

    if (!formData.tournament_address.trim()) {
      newErrors.tournament_address = 'La dirección es obligatoria'
    }

    if (!formData.signup_limit_date) {
      newErrors.signup_limit_date = 'La fecha límite de inscripción es obligatoria'
    }

    if (formData.inscription_cost < 0) {
      newErrors.inscription_cost = 'El costo de inscripción no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const updateFormData = useCallback((updates: Partial<TournamentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Limpiar errores del campo actualizado
    Object.keys(updates).forEach(key => {
      if (errors[key]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[key]
          return newErrors
        })
      }
    })
  }, [errors])

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      categories: [],
      start_date: '',
      end_date: '',
      courts_available: 4,
      time_slots: [],
      group_time_slots: [],
      tournament_type: 'NINE_PLAYERS',
      description: '',
      rules: '',
      tournament_location: '',
      tournament_address: '',
      tournament_club_name: 'Recrea Padel Club',
      signup_limit_date: '',
      inscription_cost: 0,
      sponsors: [],
      first_place_prize: '',
      second_place_prize: '',
      third_place_prize: ''
    })
    setErrors({})
    setIsSubmitting(false)
  }, [])

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateFormData: updateFormData,
    validateForm,
    resetForm
  }
}

// ========================================
// 🚀 EXPORTACIONES PRINCIPALES
// ========================================
// Las exportaciones individuales están definidas arriba