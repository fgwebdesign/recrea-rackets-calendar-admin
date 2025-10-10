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
  // 🗓️ Nuevos métodos para filtros de fecha
  fetchTournamentsWithFilters: (filters: TournamentFilters) => Promise<void>
  clearFilters: () => void
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
  availableHours: any[]
  availableTimeSlots: any[]
  scheduleValidation: any
  sponsors: any[]
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
  updateMatchResult: (matchId: string, result: any) => Promise<void>
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

  // 🎯 Función principal para obtener torneos con filtros
  const fetchTournamentsWithFilters = useCallback(async (filters: TournamentFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      setCurrentFilters(filters)

      // Por ahora usar el servicio existente que funciona
      // TODO: Implementar filtros en el backend más adelante
      const data = await tournamentService.getTournaments()
      
      // 🔍 DEBUG: Verificar datos del backend
      console.log('🔍 Raw data from backend:', data)
      console.log('🔍 First tournament sample:', data?.[0])
      
      // Procesar datos para asegurar consistencia
      const processedTournaments = Array.isArray(data) ? data.map(tournament => ({
        ...tournament,
        tournament_teams: Array.isArray(tournament.tournament_teams) ? tournament.tournament_teams : [],
        // ✅ Corregir: tournament_info es un array, tomar el primer elemento
        tournament_info: Array.isArray(tournament.tournament_info) ? tournament.tournament_info[0] : tournament.tournament_info,
        // ✅ Corregir: categories es un objeto, mapear a category
        category: (tournament as any).categories || tournament.category || undefined,
        // ✅ Corregir: tournament_sponsors es un array, extraer sponsors
        tournament_sponsors: Array.isArray((tournament as any).tournament_sponsors) 
          ? (tournament as any).tournament_sponsors.map((ts: any) => ts.sponsors).filter(Boolean)
          : []
      })) : []

      // 🔍 DEBUG: Verificar datos procesados
      console.log('🔍 Processed tournaments:', processedTournaments)
      console.log('🔍 First processed tournament:', processedTournaments?.[0])
      console.log('🔍 Category data:', processedTournaments?.[0]?.category)
      console.log('🔍 Tournament info data:', processedTournaments?.[0]?.tournament_info)
      console.log('🔍 Tournament sponsors data:', processedTournaments?.[0]?.tournament_sponsors)

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

  return {
    tournaments,
    loading,
    error,
    refetch,
    createTournament,
    updateTournament,
    deleteTournament,
    fetchTournamentsWithFilters,
    clearFilters
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
  const [sponsors, setSponsors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🎯 Función para obtener sponsors del torneo
  const fetchTournamentSponsors = useCallback(async (tournamentId: string) => {
    try {
      // Usar token de usuario normal, no admin token
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sponsors/tournaments/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.warn(`Error fetching sponsors: ${response.status} ${response.statusText}`)
        return { sponsors: [] }
      }
      
      const data = await response.json()
      console.log('🎯 Sponsors response from backend:', data)
      return data
    } catch (error) {
      console.warn('Error fetching tournament sponsors:', error)
      return { sponsors: [] }
    }
  }, [])

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
        sponsorsData
      ] = await Promise.all([
        tournamentService.getTournamentById(tournamentId),
        tournamentService.getTournamentTeams(tournamentId),
        matchService.getTournamentMatches(tournamentId),
        groupService.getGroups(tournamentId),
        statsService.getTournamentStats(tournamentId),
        tournamentService.getTournamentStandings(tournamentId),
        tournamentDetailsService.getAvailableHours(tournamentId),          
        fetchTournamentSponsors(tournamentId)
      ])

      setTournament(tournamentData)
      setTournamentInfo(Array.isArray(tournamentData.tournament_info) ? tournamentData.tournament_info[0] : tournamentData.tournament_info || undefined)
      
      // ✅ Corregir: extraer el array teams del objeto de respuesta
      const teamsArray = (teamsData as any)?.teams || teamsData || []
      
      // Debug: verificar datos de equipos
      console.log('🔍 Teams data from backend:', teamsData)
      console.log('🔍 Teams is array?', Array.isArray(teamsArray))
      console.log('🔍 Teams count:', teamsArray.length)
      
      setTeams(Array.isArray(teamsArray) ? teamsArray : [])
      
      // ✅ Corregir: extraer el array matches del objeto de respuesta
      const matchesArray = (matchesData as any)?.matches || matchesData || []
      
      // Debug: verificar datos de partidos
      console.log('🔍 Matches data from backend:', matchesData)
      console.log('🔍 Matches is array?', Array.isArray(matchesArray))
      console.log('🔍 Matches count:', matchesArray.length)
      
      setMatches(Array.isArray(matchesArray) ? matchesArray : [])
      console.log('🔍 Groups data from backend:', groupsData)
      console.log('🔍 Groups is array?', Array.isArray(groupsData))
      
      setGroups(Array.isArray(groupsData) ? groupsData : [])
      setStats(statsData)
      setStandings(Array.isArray(standingsData) ? standingsData : [])
      // ✅ Procesar horarios disponibles
      setAvailableHours(Array.isArray(availableHoursData) ? availableHoursData : [])
      setAvailableTimeSlots([])
      setScheduleValidation({})
      
      // ✅ Procesar sponsors del torneo
      const sponsorsArray = sponsorsData?.sponsors || []
      console.log('🔍 Sponsors data from backend:', sponsorsData)
      console.log('🔍 Sponsors array:', sponsorsArray)
      console.log('🔍 Sponsors count:', sponsorsArray.length)
      console.log('🔍 First sponsor:', sponsorsArray[0])
      setSponsors(Array.isArray(sponsorsArray) ? sponsorsArray : [])
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

  const updateMatchResult = useCallback(async (matchId: string, result: any) => {
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