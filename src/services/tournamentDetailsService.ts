import { API_BASE_URL } from './tournamentService'

// ========================================
// 🎯 SERVICIO DE DETALLES DE TORNEO
// ========================================

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

function getAuthHeaders(token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  return data
}

export class TournamentDetailsService {
  private baseUrl = `${API_BASE_URL}/tournaments`

  // 🏆 Obtener grupos del torneo
  async getTournamentGroups(tournamentId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/groups`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<any[]>(response)
  }

  // ⏰ Obtener horarios disponibles para registro
  async getAvailableHours(tournamentId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/available-hours`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<any[]>(response)
  }

  // 📅 Obtener slots de tiempo disponibles
  async getAvailableTimeSlots(tournamentId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/available-time-slots`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<any[]>(response)
  }

  // ✅ Validar horarios
  async validateSchedule(tournamentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/validate-schedule`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<any>(response)
  }

  // 📊 Obtener estadísticas detalladas del torneo
  async getDetailedStats(tournamentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/stats`, {
      headers: getAuthHeaders()
    })
    return handleApiResponse<any>(response)
  }

  // 🎯 Generar grupos automáticamente
  async generateGroups(tournamentId: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/generate-groups`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<any>(response)
  }

  // 📅 Programar partidos automáticamente
  async scheduleMatches(tournamentId: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/schedule-matches`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<any>(response)
  }

  // 🏆 Generar bracket de eliminación
  async generateEliminationBracket(tournamentId: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${tournamentId}/generate-elimination-bracket`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    })
    return handleApiResponse<any>(response)
  }
}

// Instancia del servicio
export const tournamentDetailsService = new TournamentDetailsService()
