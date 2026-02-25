// ========================================
// 🎾 HOOKS PERSONALIZADOS - SISTEMA REVOLUCIONARIO
// ========================================

import { useState, useEffect, useCallback } from 'react'
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
  ConflictInfo,
  TournamentFormData,
  MatchResultData,
  ScheduleValidation,
  Sponsor,
  TimeSlot,
  Category
} from '@/types/tournament'
import { 
  tournamentService, 
  groupService, 
  matchService, 
  bracketService, 
  statsService 
} from '@/services/tournamentService'

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
  fetchTournamentsWithFilters: (filters: TournamentFilters) => Promise<void>
  clearFilters: () => Promise<void>
  currentFilters: TournamentFilters
  hasDateFilter: boolean
}

interface TournamentFilters {
  start_date?: string
  end_date?: string
  date_range?: string
  status?: string
  category_id?: string
}

interface UseTournamentReturn {
  tournament: Tournament | null
  tournamentInfo: TournamentInfo | null
  teams: TournamentTeam[]
  matches: TournamentMatch[]
  groups: TournamentGroup[]
  standings: TournamentStanding[]
  stats: TournamentStats | null
  availableHours: AvailabilityData[]
  availableTimeSlots: TimeSlot[]
  scheduleValidation: ScheduleValidation | null
  sponsors: Sponsor[]
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
  updateMatchResult: (matchId: string, result: MatchResultData) => Promise<void>
  refetch: () => Promise<void>
}

// ========================================
// 🏆 HOOK PRINCIPAL DE TORNEOS
// ========================================

export function useTournaments(): UseTournamentsReturn {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<TournamentFilters>({})

  // 🎯 Función principal para obtener torneos con filtros (start_date, end_date, date_range → backend filtra por tabla tournaments)
  const fetchTournamentsWithFilters = useCallback(async (filters: TournamentFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      setCurrentFilters(filters)

      const data = await tournamentService.getTournaments({
        start_date: filters.start_date,
        end_date: filters.end_date,
        date_range: filters.date_range,
      })
      
      // Procesar datos para asegurar consistencia
      const processedTournaments: Tournament[] = Array.isArray(data) ? data.map(tournament => {
        // Tipos auxiliares para el procesamiento
        type TournamentWithExtras = Tournament & { 
          categories?: Category
          tournament_sponsors?: Array<{ sponsor?: Sponsor; sponsor_id?: string; tournament_id?: string }>
        }
        const t = tournament as TournamentWithExtras
        
        return {
          ...tournament,
          tournament_teams: Array.isArray(tournament.tournament_teams) ? tournament.tournament_teams : [],
          // ✅ Corregir: tournament_info es un array, tomar el primer elemento
          tournament_info: Array.isArray(tournament.tournament_info) ? tournament.tournament_info[0] : tournament.tournament_info,
          // ✅ Corregir: categories es un objeto, mapear a category
          category: t.categories || tournament.category || undefined,
          // ✅ Corregir: tournament_sponsors mantener estructura TournamentSponsor
          tournament_sponsors: Array.isArray(t.tournament_sponsors) 
            ? t.tournament_sponsors.filter((ts): ts is NonNullable<typeof ts> => Boolean(ts))
            : []
        } as Tournament
      }) : []

      setTournaments(processedTournaments)
    } catch (err) {
      console.error('Error fetching tournaments:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setTournaments([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔄 Función de refetch (mantener compatibilidad)
  const refetch = useCallback(async () => {
    await fetchTournamentsWithFilters(currentFilters)
  }, [fetchTournamentsWithFilters, currentFilters])

  // 🧹 Limpiar filtros
  const clearFilters = useCallback(async () => {
    await fetchTournamentsWithFilters({})
  }, [fetchTournamentsWithFilters])

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
    fetchTournamentsWithFilters({})
  }, [fetchTournamentsWithFilters])

  const hasDateFilter = Boolean(
    currentFilters.start_date || currentFilters.end_date || currentFilters.date_range
  )

  return {
    tournaments,
    loading,
    error,
    refetch,
    createTournament,
    updateTournament,
    deleteTournament,
    fetchTournamentsWithFilters,
    clearFilters,
    currentFilters,
    hasDateFilter,
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
  const [availableHours, setAvailableHours] = useState<AvailabilityData[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [scheduleValidation, setScheduleValidation] = useState<ScheduleValidation | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ OPTIMIZADO: Usar endpoint consolidado que retorna todo en una sola llamada
  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) return

    try {
      setLoading(true)
      setError(null)

      // ✅ UNA SOLA LLAMADA en lugar de 8 llamadas paralelas
      const fullDetails = await tournamentService.getTournamentFullDetails(tournamentId)

      setTournament(fullDetails.tournament)
      setTournamentInfo(fullDetails.tournament_info || null)
      setTeams(fullDetails.teams || [])
      setMatches(fullDetails.matches || [])
      setGroups(fullDetails.groups || [])
      setStats(fullDetails.stats || null)
      setSponsors(fullDetails.sponsors || [])
      
      // Standings se calculan del stats o se mantienen vacíos
      setStandings([])
      setAvailableHours([])
      setAvailableTimeSlots([])
      setScheduleValidation(null)
      
    } catch (err) {
      console.error('Error fetching tournament full details:', err)
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
    sponsors,
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
      // Convert TournamentGroup[] to GroupDistribution[]
      const groupDistributions: GroupDistribution[] = groupsData.map(group => ({
        group_number: group.group_number,
        teams: [],  // Se llenarán desde otro endpoint si es necesario
        restriction_slots: [],
        conflicts: [],
        available_slots: [],
        recommended_slots: [],
        has_conflicts: false,
        schedule_flexibility: 100
      }))
      setGroups(groupDistributions)
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

  const updateMatchResult = useCallback(async (matchId: string, result: MatchResultData) => {
    try {
      const updatedMatch = await matchService.updateMatchResult(matchId, result)
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
    tournament_club_name: 'BayPadel San Francisco',
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
      tournament_club_name: 'BayPadel San Francisco',
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