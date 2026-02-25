// ========================================
// 🎾 SERVICIOS DE API - SISTEMA REVOLUCIONARIO
// ========================================

import { 
  Tournament, 
  TournamentFormData, 
  TournamentTeam, 
  TournamentMatch, 
  TournamentGroup,
  TournamentStanding,
  GroupDistribution,
  ScheduledMatch,
  AvailabilityData,
  EliminationBracket,
  TournamentStats,
  ApiResponse,
  TeamWithConstraints,
  ConflictInfo,
  MatchResultData,
  TournamentInfo,
  Sponsor,
  PeriodStats
} from '@/types/tournament'

// ========================================
// 🔧 CONFIGURACIÓN BASE
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999'

// Exportar API_BASE_URL para uso en otros servicios
export { API_BASE_URL }

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ========================================
// 🛠️ UTILIDADES DE API
// ========================================

const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response
    )
  }
  
  return response.json()
}

const getAuthHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// ========================================
// 🏆 SERVICIO DE TORNEOS
// ========================================

export class TournamentService {
  private baseUrl = `${API_BASE_URL}/tournaments`

  /** Obtener torneos, opcionalmente filtrados por start_date, end_date (YYYY-MM-DD) o date_range (this_month | next_month | this_year | upcoming). */
  async getTournaments(filters?: { start_date?: string; end_date?: string; date_range?: string }): Promise<Tournament[]> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.set('start_date', filters.start_date)
    if (filters?.end_date) params.set('end_date', filters.end_date)
    if (filters?.date_range) params.set('date_range', filters.date_range)
    const qs = params.toString()
    const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl
    const response = await fetch(url)
    return handleApiResponse<Tournament[]>(response)
  }

  // ✅ NUEVO: Obtener partidos para dashboard (endpoint consolidado)
  async getDashboardMatches(): Promise<{
    matches: TournamentMatch[];
    tournaments_count: number;
    total_matches: number;
  }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
    const response = await fetch(`${this.baseUrl}/dashboard/matches`, {
      headers: getAuthHeaders(token || undefined)
    })
    return handleApiResponse(response)
  }

  // ✅ NUEVO: Obtener información completa del torneo en una sola llamada
  async getTournamentFullDetails(tournamentId: string): Promise<{
    tournament: Tournament;
    teams: TournamentTeam[];
    matches: TournamentMatch[];
    groups: TournamentGroup[];
    sponsors: Sponsor[];
    stats: TournamentStats;
    tournament_info: TournamentInfo | null;
  }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
    const response = await fetch(`${this.baseUrl}/${tournamentId}/full-details`, {
      headers: getAuthHeaders(token || undefined)
    })
    return handleApiResponse(response)
  }

  // 🔍 Obtener torneo por ID
  async getTournamentById(id: string): Promise<Tournament> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    return handleApiResponse<Tournament>(response)
  }

  // ➕ Crear nuevo torneo
  async createTournament(data: TournamentFormData, token: string): Promise<Tournament> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data)
    })
    return handleApiResponse<Tournament>(response)
  }

  // ✏️ Actualizar torneo
  async updateTournament(id: string, data: Partial<TournamentFormData>, token: string): Promise<Tournament> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data)
    })
    return handleApiResponse<Tournament>(response)
  }

  // 🗑️ Eliminar torneo
  async deleteTournament(id: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<void>(response)
  }

  // 📄 Subir PDF del reglamento del torneo
  async uploadRulesPdf(tournamentId: string, file: File, token: string): Promise<{ info: TournamentInfo; rules_pdf_url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/${tournamentId}/rules-pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // No incluir Content-Type - FormData lo establece automáticamente con boundary
      },
      body: formData
    })
    return handleApiResponse<{ info: TournamentInfo; rules_pdf_url: string }>(response)
  }

  // 🔄 Cambiar tipo de torneo
  async changeTournamentType(id: string, newType: string, token: string): Promise<ApiResponse<Tournament>> {
    const response = await fetch(`${this.baseUrl}/${id}/change-type`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ new_tournament_type: newType })
    })
    return handleApiResponse<ApiResponse<Tournament>>(response)
  }

  // 👥 Registrar equipo en torneo
  async joinTournament(tournamentId: string, teamId: string, unavailableTimes?: string): Promise<ApiResponse<TournamentTeam>> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        team_id: teamId,
        unavailable_times: unavailableTimes
      })
    })
    return handleApiResponse<ApiResponse<TournamentTeam>>(response)
  }

  // 📊 Obtener equipos del torneo
  async getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/teams`)
    return handleApiResponse<TournamentTeam[]>(response)
  }

  // 📅 Obtener time slots disponibles
  async getAvailableTimeSlots(tournamentId: string): Promise<ApiResponse<AvailabilityData[]>> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/available-time-slots`)
    return handleApiResponse<ApiResponse<AvailabilityData[]>>(response)
  }

  // ✅ OPTIMIZADO: Ahora usa el endpoint full-details que ya incluye stats
  // Ya no hace 4 llamadas separadas
  async getTournamentStats(tournamentId: string): Promise<TournamentStats> {
    try {
      const fullDetails = await this.getTournamentFullDetails(tournamentId)
      return fullDetails.stats
    } catch (error) {
      console.error('Error getting tournament stats:', error)
      return {
        total_teams: 0,
        teams_registered: 0,
        teams_pending: 0,
        groups_generated: false,
        matches_scheduled: 0,
        matches_completed: 0,
        matches_pending: 0,
        total_revenue: 0,
        payment_status: {
          paid: 0,
          pending: 0,
          failed: 0
        }
      }
    }
  }

  // 📊 Obtener clasificación del torneo
  async getTournamentStandings(tournamentId: string): Promise<TournamentStanding[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/standings`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<TournamentStanding[]>(response)
  }

  // 📋 Obtener partidos del torneo
  async getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/matches`)
    return handleApiResponse<TournamentMatch[]>(response)
  }
}

// ========================================
// 👥 SERVICIO DE GRUPOS
// ========================================

export class GroupService {
  private baseUrl = `${API_BASE_URL}/tournaments`

  // 🎯 Generar grupos automáticamente
  async generateGroupsAutomatic(tournamentId: string, token: string): Promise<ApiResponse<GroupDistribution[]>> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/generate-groups-automatic`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<ApiResponse<GroupDistribution[]>>(response)
  }

  // 📋 Obtener grupos del torneo
  async getGroups(tournamentId: string): Promise<TournamentGroup[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/groups`)
    const data = await handleApiResponse<{ message: string; groups: TournamentGroup[] }>(response)
    return data.groups || []
  }

  // 🔍 Obtener equipos con restricciones
  async getTeamsWithConstraints(tournamentId: string): Promise<TeamWithConstraints[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/teams-with-constraints`)
    return handleApiResponse<TeamWithConstraints[]>(response)
  }

  // ⚠️ Validar conflictos de horarios
  async validateScheduleConflicts(tournamentId: string, token: string): Promise<ApiResponse<ConflictInfo[]>> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/validate-schedule-conflicts`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<ApiResponse<ConflictInfo[]>>(response)
  }

  // 📊 Obtener standings de grupo específico
  async getGroupStandings(tournamentId: string, groupNumber: number): Promise<ApiResponse<TournamentStanding[]>> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/group-standings/${groupNumber}`)
    return handleApiResponse<ApiResponse<TournamentStanding[]>>(response)
  }

  // 📊 Obtener clasificación del torneo
  async getTournamentStandings(tournamentId: string): Promise<TournamentStanding[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/standings`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<TournamentStanding[]>(response)
  }

  // 📋 Obtener partidos del torneo
  async getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/matches`)
    return handleApiResponse<TournamentMatch[]>(response)
  }
}

// ========================================
// ⚽ SERVICIO DE PARTIDOS
// ========================================

export class MatchService {
  private baseUrl = `${API_BASE_URL}`

  // 📅 Programar partidos por grupo y día
  async scheduleMatchesByGroup(tournamentId: string, token: string): Promise<ApiResponse<ScheduledMatch[]>> {
    const response = await fetch(`${this.baseUrl}/tournaments/${tournamentId}/schedule-matches-by-group`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<ApiResponse<ScheduledMatch[]>>(response)
  }

  // 🤖 Programar partidos automáticamente
  async scheduleMatchesAutomatically(tournamentId: string, token: string): Promise<ApiResponse<ScheduledMatch[]>> {
    const response = await fetch(`${this.baseUrl}/tournaments/${tournamentId}/schedule-matches-automatically`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<ApiResponse<ScheduledMatch[]>>(response)
  }

  // 📋 Obtener partidos del torneo
  async getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const response = await fetch(`${this.baseUrl}/tournaments/${tournamentId}/matches`)
    return handleApiResponse<TournamentMatch[]>(response)
  }

  // ⚡ Generar partidos del torneo
  async generateMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const response = await fetch(`${this.baseUrl}/tournaments/${tournamentId}/generate-matches`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleApiResponse<TournamentMatch[]>(response)
  }

  // 🏆 Actualizar resultado de partido
  async updateMatchResult(matchId: string, result: MatchResultData, tournamentId?: string, token?: string): Promise<TournamentMatch> {
    // URL correcta según tournament.routes.js: /tournaments/{tournamentId}/matches/{matchId}/result
    const url = tournamentId 
      ? `${this.baseUrl}/tournaments/${tournamentId}/matches/${matchId}/result`
      : `${this.baseUrl}/matches/${matchId}/result`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(result)
    })
    return handleApiResponse<TournamentMatch>(response)
  }

  // 📊 Calcular standings dinámicamente
  async calculateStandings(tournamentId: string, token: string): Promise<ApiResponse<TournamentStanding[]>> {
    const response = await fetch(`${this.baseUrl}/tournaments/${tournamentId}/calculate-standings`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<ApiResponse<TournamentStanding[]>>(response)
  }
}

// ========================================
// 🏆 SERVICIO DE BRACKETS
// ========================================

export class BracketService {
  private baseUrl = `${API_BASE_URL}/tournaments`

  // 🎯 Generar bracket de eliminación
  async generateEliminationBracket(tournamentId: string, token: string): Promise<ApiResponse<EliminationBracket>> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/generate-elimination-bracket`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<ApiResponse<EliminationBracket>>(response)
  }

  // 📋 Obtener bracket existente
  async getEliminationBracket(tournamentId: string): Promise<EliminationBracket> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/elimination-bracket`)
    return handleApiResponse<EliminationBracket>(response)
  }

  // 🏆 Actualizar resultado de bracket
  async updateBracketResult(matchId: string, winnerId: string, token: string): Promise<TournamentMatch> {
    const response = await fetch(`${this.baseUrl}/bracket-matches/${matchId}/result`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ winner_team_id: winnerId })
    })
    return handleApiResponse<TournamentMatch>(response)
  }
}

// ========================================
// 📊 SERVICIO DE ESTADÍSTICAS
// ========================================

export class StatsService {
  private baseUrl = `${API_BASE_URL}/tournaments`

  // 📈 Obtener estadísticas generales
  async getGeneralStats(): Promise<{
    total_tournaments: number
    active_tournaments: number
    total_teams: number
    total_matches: number
    total_revenue: number
  }> {
    const response = await fetch(`${this.baseUrl}/stats/general`)
    return handleApiResponse(response)
  }

  // ✅ OPTIMIZADO: Reutilizar el servicio de torneos que ya está optimizado
  async getTournamentStats(tournamentId: string): Promise<TournamentStats> {
    return tournamentService.getTournamentStats(tournamentId)
  }

  // 📅 Obtener estadísticas por período
  async getStatsByPeriod(startDate: string, endDate: string): Promise<PeriodStats> {
    const response = await fetch(`${this.baseUrl}/stats/period`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    })
    return handleApiResponse<PeriodStats>(response)
  }
}

// ========================================
// 🔔 SERVICIO DE NOTIFICACIONES
// ========================================

export class NotificationService {
  private baseUrl = `${API_BASE_URL}/notifications`

  // 📧 Enviar notificación de torneo
  async sendTournamentNotification(tournamentId: string, type: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tournament/${tournamentId}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ type })
    })
    return handleApiResponse<void>(response)
  }

  // 📱 Enviar notificación por WhatsApp
  async sendWhatsAppNotification(phone: string, message: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ phone, message })
    })
    return handleApiResponse<void>(response)
  }
}

// ========================================
// 🎯 INSTANCIAS DE SERVICIOS
// ========================================

export const tournamentService = new TournamentService()
export const groupService = new GroupService()
export const matchService = new MatchService()
export const bracketService = new BracketService()
export const statsService = new StatsService()
export const notificationService = new NotificationService()

// ========================================
// 🚀 EXPORTACIONES PRINCIPALES
// ========================================

export {
  ApiError
}

export default {
  tournament: tournamentService,
  group: groupService,
  match: matchService,
  bracket: bracketService,
  stats: statsService,
  notification: notificationService
}