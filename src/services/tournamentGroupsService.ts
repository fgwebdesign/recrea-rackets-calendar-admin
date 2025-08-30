/**
 * Servicio para gestión de grupos de torneos
 * Integra todos los endpoints documentados en la guía del backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999'

export interface TimeSlot {
  id: string
  day: string
  start: string
  end: string
  label: string
  tournament_day: number
  date: string
}

export interface SlotAvailability {
  slot_id: string
  label: string
  total_capacity: number
  current_usage: number
  remaining_slots: number
  is_available: boolean
  percentage_full: number
  duration_hours: number
}

export interface TeamWithConstraints {
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

export interface ConflictInfo {
  type: string
  teams: string[]
  slot: string
  message: string
}

export interface GeneratedGroup {
  id: string
  group_number: number
  teams: string[]
  status: 'IN_PROGRESS' | 'COMPLETED'
}

export interface GroupValidationResult {
  group_number: number
  teams: string[]
  conflicts: ConflictInfo[]
  available_slots: Array<{
    slot_id: string
    label: string
    day: number
    start: string
    end: string
  }>
  recommended_slots: string[]
  has_conflicts: boolean
  schedule_flexibility: number
}

export interface TournamentCreationData {
  name: string
  categories: string[]
  start_date: string
  end_date: string
  courts_available: number
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  description?: string
  rules?: string
  tournament_location?: string
  tournament_address?: string
  tournament_club_name?: string
  signup_limit_date?: string
  inscription_cost?: number
  first_place_prize?: string
  second_place_prize?: string
  third_place_prize?: string
}

export interface RegistrationData {
  userId1: string
  userId2: string
  unavailable_time_slot: string
  payment_status: 'mercadopago' | 'cash'
}

class TournamentGroupsService {
  // Mapeo de slots técnicos a horarios legibles
  private formatTimeSlotLabel(slotId: string | null | undefined): string {
    if (!slotId) return 'Sin restricción'
    
    const slotLabels: Record<string, string> = {
      // Día 1 (Viernes)
      'day1_evening': 'Viernes Tarde (18-21hs)',
      'day1_night': 'Viernes Noche (22-24hs)',
      
      // Día 2 (Sábado)  
      'day2_morning': 'Sábado Mañana (8-12hs)',
      'day2_afternoon': 'Sábado Tarde (13-17hs)',
      'day2_evening': 'Sábado Noche (18-21hs)',
      'day2_late_night': 'Sábado Noche Tardía (22-01hs)',
      
      // Día 3 (Domingo)
      'day3_morning': 'Domingo Mañana (8-12hs)',
      'day3_afternoon': 'Domingo Tarde (13-17hs)',
      
      // Horarios numéricos (legacy)
      '8': 'Mañana (8:00hs)',
      '9': 'Mañana (9:00hs)',
      '10': 'Mañana (10:00hs)',
      '11': 'Mañana (11:00hs)',
      '12': 'Mediodía (12:00hs)',
      '13': 'Tarde (13:00hs)',
      '14': 'Tarde (14:00hs)',
      '15': 'Tarde (15:00hs)',
      '16': 'Tarde (16:00hs)',
      '17': 'Tarde (17:00hs)',
      '18': 'Noche (18:00hs)',
      '19': 'Noche (19:00hs)',
      '20': 'Noche (20:00hs)',
      '21': 'Noche (21:00hs)',
      '22': 'Noche Tardía (22:00hs)',
      '23': 'Noche Tardía (23:00hs)'
    }
    
    return slotLabels[slotId] || `Horario ${slotId}`
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Agregar token de admin si está disponible
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) {
      defaultHeaders['Authorization'] = `Bearer ${adminToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 1. CREAR TORNEO CON MÚLTIPLES CATEGORÍAS
   * POST /tournaments
   */
  async createTournament(data: TournamentCreationData) {
    return this.request<{
      message: string
      torneos: Array<{
        id: string
        name: string
        category_id: string
        tournament_type: string
        max_teams: number
        group_time_slots: TimeSlot[]
      }>
    }>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 2. OBTENER TIME SLOTS DISPONIBLES PARA INSCRIPCIÓN
   * GET /tournaments/{tournament_id}/available-time-slots
   */
  async getAvailableTimeSlots(tournamentId: string) {
    return this.request<{
      message: string
      tournament_info: {
        category_id: string
        tournament_type: string
        max_teams: number
        courts_available: number
        total_categories: number
        total_teams_across_categories: number
        start_date: string
        end_date: string
        group_phase_days: string
      }
      available_slots: SlotAvailability[]
      note: string
      debug_info?: any
    }>(`/tournaments/${tournamentId}/available-time-slots`)
  }

  /**
   * 3. INSCRIBIR EQUIPO EN TORNEO
   * POST /tournaments/{tournament_id}/join
   */
  async registerTeam(tournamentId: string, data: RegistrationData) {
    return this.request<{
      message: string
      tournament_info: {
        id: string
        name: string
        category: string
        tournament_type: string
        max_teams: number
        current_teams: number
      }
      time_slot: {
        slot_info: {
          slot_id: string
          slot_label: string
          selected_count: number
          total_capacity: number
          remaining_slots: number
          percentage_full: number
        }
      }
      team_id: string
    }>(`/tournaments/${tournamentId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 4. GENERAR GRUPOS AUTOMÁTICAMENTE
   * POST /tournaments/{tournament_id}/generate-groups
   */
  async generateGroups(tournamentId: string) {
    return this.request<{
      message: string
      tournament_id: string
      groups_created: Array<{
        id: string
        group_number: number
        teams: string[]
      }>
    }>(`/tournaments/${tournamentId}/generate-groups`, {
      method: 'POST',
    })
  }

  /**
   * 5. GENERAR GRUPOS MANUALMENTE
   * POST /tournaments/{tournament_id}/generate-groups-manual
   */
  async generateGroupsManual(tournamentId: string, groups: Array<{ group_number: number; teams: string[] }>) {
    return this.request<{
      message: string
      tournament_id: string
      groups_created: Array<{
        id: string
        group_number: number
        teams: string[]
      }>
    }>(`/tournaments/${tournamentId}/generate-groups-manual`, {
      method: 'POST',
      body: JSON.stringify({ groups }),
    })
  }

  /**
   * 6. VALIDAR CONFLICTOS HORARIOS (Adaptado - simulación local)
   * Simula la validación usando datos existentes
   */
  async validateGroupConflicts(tournamentId: string, groups: Array<{ group_number: number; teams: string[] }>) {
    try {
      // Obtener equipos con restricciones
      const teamsData = await this.getTournamentTeams(tournamentId)
      
      // Simular validación de conflictos
      const validation_results: GroupValidationResult[] = groups.map(group => {
        const groupTeams = group.teams.map(teamId => {
          const teamData = teamsData.teams.find(t => t.team_id === teamId)
          return teamData?.unavailable_times || null
        }).filter(Boolean)

        // Detectar conflictos (equipos con la misma restricción horaria)
        const conflicts: ConflictInfo[] = []
        const uniqueSlots = [...new Set(groupTeams)]
        
        uniqueSlots.forEach(slot => {
          const teamsWithSameSlot = group.teams.filter(teamId => {
            const teamData = teamsData.teams.find(t => t.team_id === teamId)
            return teamData?.unavailable_times === slot
          })
          
          if (teamsWithSameSlot.length > 1) {
            conflicts.push({
              type: 'same_unavailable_slot',
              teams: teamsWithSameSlot,
              slot: slot as string,
              message: `${teamsWithSameSlot.length} equipos no pueden jugar en ${this.formatTimeSlotLabel(slot as string)}`
            })
          }
        })

        return {
          group_number: group.group_number,
          teams: group.teams,
          conflicts,
          available_slots: [
            { slot_id: 'day1_evening', label: 'Viernes Tarde', day: 1, start: '18:00', end: '21:00' },
            { slot_id: 'day2_morning', label: 'Sábado Mañana', day: 2, start: '08:00', end: '12:00' }
          ],
          recommended_slots: ['Viernes Tarde', 'Sábado Mañana'],
          has_conflicts: conflicts.length > 0,
          schedule_flexibility: Math.max(0, 8 - groupTeams.length) // Slots disponibles
        }
      })

      const total_conflicts = validation_results.reduce((sum, result) => sum + result.conflicts.length, 0)
      const groups_with_conflicts = validation_results.filter(result => result.has_conflicts).length

      return {
        message: 'Validación completada',
        tournament_id: tournamentId,
        summary: {
          total_groups: groups.length,
          groups_with_conflicts,
          total_conflicts,
          overall_status: total_conflicts > 0 ? 'CONFLICTOS_DETECTADOS' as const : 'SIN_CONFLICTOS' as const
        },
        validation_results
      }
    } catch (error) {
      console.error('Error in validateGroupConflicts:', error)
      throw error
    }
  }

  /**
   * 7. OBTENER EQUIPOS DEL TORNEO
   * GET /tournaments/{tournament_id}/teams
   */
  async getTournamentTeams(tournamentId: string) {
    return this.request<{
      message: string
      teams: Array<{
        team_id: string
        unavailable_times: string
        teams: {
          id: string
          player1_id: string
          player2_id: string
          player1: {
            first_name: string
            last_name: string
          }
          player2: {
            first_name: string
            last_name: string
          }
        }
      }>
    }>(`/tournaments/${tournamentId}/teams`)
  }

  /**
   * 8. OBTENER EQUIPOS CON RESTRICCIONES (Adaptado a endpoints existentes)
   * Combina /tournaments/{tournament_id}/teams + /tournaments/{tournament_id}
   */
  async getTeamsWithConstraints(tournamentId: string) {
    try {
      // Obtener información del torneo
      const tournament = await this.getTournament(tournamentId)
      
      // Obtener equipos
      const teamsResponse = await this.getTournamentTeams(tournamentId)
      
      // Adaptar la estructura de datos
      const teams: TeamWithConstraints[] = teamsResponse.teams.map(team => ({
        team_id: team.team_id,
        player1: {
          id: team.teams.player1_id,
          first_name: team.teams.player1?.first_name || 'Jugador',
          last_name: team.teams.player1?.last_name || '1'
        },
        player2: {
          id: team.teams.player2_id,
          first_name: team.teams.player2?.first_name || 'Jugador',
          last_name: team.teams.player2?.last_name || '2'
        },
        unavailable_time_slot: team.unavailable_times || '',
        slot_label: this.formatTimeSlotLabel(team.unavailable_times)
      }))

      return {
        teams,
        tournament_info: {
          tournament_type: tournament.tournament_type,
          expected_groups: tournament.tournament_type === 'NINE_PLAYERS' ? 3 : 4,
          teams_per_group: 3,
          group_time_slots: tournament.group_time_slots
        }
      }
    } catch (error) {
      console.error('Error in getTeamsWithConstraints:', error)
      throw error
    }
  }

  /**
   * 9. OBTENER GRUPOS GENERADOS
   * GET /tournaments/{tournament_id}/groups
   */
  async getGroups(tournamentId: string) {
    return this.request<{
      message: string
      groups: GeneratedGroup[]
    }>(`/tournaments/${tournamentId}/groups`)
  }

  /**
   * 10. OBTENER ANÁLISIS DE GRUPOS (Adaptado a endpoints existentes)
   * Combina /tournaments/{tournament_id}/groups + /tournaments/{tournament_id}/teams
   */
  async getGroupsAnalysis(tournamentId: string) {
    try {
      // Obtener grupos existentes
      const groupsResponse = await this.getGroups(tournamentId)
      
      // Si no hay grupos, retornar estructura vacía
      if (!groupsResponse.groups || groupsResponse.groups.length === 0) {
        throw new Error('No se han generado grupos para este torneo')
      }

      // Obtener equipos con restricciones
      const teamsResponse = await this.getTournamentTeams(tournamentId)
      
      // Simular análisis de grupos (en implementación real vendría del backend)
      const mockAnalysis = {
        groups: groupsResponse.groups.map(group => ({
          group_number: group.group_number,
          teams: group.teams.map(teamId => {
            const teamData = teamsResponse.teams.find(t => t.team_id === teamId)
            return {
              team_id: teamId,
              player1: {
                id: teamData?.teams?.player1_id || '',
                first_name: teamData?.teams?.player1?.first_name || 'Jugador',
                last_name: teamData?.teams?.player1?.last_name || '1'
              },
              player2: {
                id: teamData?.teams?.player2_id || '',
                first_name: teamData?.teams?.player2?.first_name || 'Jugador',
                last_name: teamData?.teams?.player2?.last_name || '2'
              },
              unavailable_time_slot: teamData?.unavailable_times || '',
              slot_label: this.formatTimeSlotLabel(teamData?.unavailable_times)
            }
          }),
          conflicts: [], // Simular sin conflictos por ahora
          available_slots: [
            { slot_id: 'day1_evening', label: 'Viernes Tarde', day: 1, start: '18:00', end: '21:00' },
            { slot_id: 'day2_morning', label: 'Sábado Mañana', day: 2, start: '08:00', end: '12:00' }
          ],
          flexibility_percentage: Math.floor(Math.random() * 40) + 60 // 60-100%
        })),
        summary: {
          total_conflicts: 0,
          average_flexibility: 75,
          groups_without_conflicts: groupsResponse.groups.length
        }
      }

      return mockAnalysis
    } catch (error) {
      console.error('Error in getGroupsAnalysis:', error)
      throw error
    }
  }

  /**
   * 11. OBTENER ESTADO DEL EVENTO (Endpoint personalizado)
   * GET /tournaments/event/{event_name}/status
   */
  async getEventStatus(eventName: string) {
    return this.request<{
      event_name: string
      categories: Array<{
        tournament_id: string
        category_name: string
        tournament_type: string
        teams_registered: number
        max_teams: number
        status: string
        groups_generated: boolean
      }>
      global_slots_usage: {
        total_capacity: number
        current_usage: number
        percentage_full: number
      }
    }>(`/tournaments/event/${encodeURIComponent(eventName)}/status`)
  }

  /**
   * 12. OBTENER INFORMACIÓN DE TORNEO
   * GET /tournaments/{id}
   */
  async getTournament(tournamentId: string) {
    return this.request<{
      id: string
      name: string
      category_id: string
      start_date: string
      end_date: string
      courts_available: number
      tournament_type: string
      max_teams: number
      group_time_slots: TimeSlot[]
      status: string
      tournament_teams: Array<{
        team_id: string
        teams: any
      }>
      tournament_info: any
    }>(`/tournaments/${tournamentId}`)
  }

  /**
   * 13. OBTENER TODOS LOS TORNEOS
   * GET /tournaments
   */
  async getAllTournaments() {
    return this.request<Array<{
      id: string
      name: string
      category_id: string
      start_date: string
      end_date: string
      courts_available: number
      tournament_type: string
      max_teams: number
      status: string
    }>>('/tournaments')
  }

  /**
   * Métodos auxiliares para el frontend
   */

  /**
   * Obtener todos los torneos de un evento específico
   */
  async getTournamentsByEventName(eventName: string) {
    const allTournaments = await this.getAllTournaments()
    return allTournaments.filter(tournament => tournament.name === eventName)
  }

  /**
   * Verificar si un torneo está listo para generar grupos
   */
  async isTournamentReadyForGroups(tournamentId: string): Promise<boolean> {
    try {
      const tournament = await this.getTournament(tournamentId)
      const teams = await this.getTournamentTeams(tournamentId)
      
      return teams.teams.length === tournament.max_teams
    } catch (error) {
      console.error('Error checking tournament readiness:', error)
      return false
    }
  }

  /**
   * Obtener resumen completo de un evento
   */
  async getEventSummary(eventName: string) {
    try {
      const tournaments = await this.getTournamentsByEventName(eventName)
      
      const enrichedTournaments = await Promise.all(
        tournaments.map(async (tournament) => {
          const teams = await this.getTournamentTeams(tournament.id).catch(() => ({ teams: [] }))
          const groups = await this.getGroups(tournament.id).catch(() => ({ groups: [] }))
          
          return {
            ...tournament,
            teams_registered: teams.teams.length,
            groups_generated: groups.groups.length > 0,
            is_ready: teams.teams.length === tournament.max_teams
          }
        })
      )

      return {
        event_name: eventName,
        tournaments: enrichedTournaments,
        total_teams: enrichedTournaments.reduce((sum, t) => sum + t.teams_registered, 0),
        total_capacity: enrichedTournaments.reduce((sum, t) => sum + t.max_teams, 0),
        ready_tournaments: enrichedTournaments.filter(t => t.is_ready).length
      }
    } catch (error) {
      console.error('Error getting event summary:', error)
      throw error
    }
  }
}

export const tournamentGroupsService = new TournamentGroupsService()
