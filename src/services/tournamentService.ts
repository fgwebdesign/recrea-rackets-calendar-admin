import { 
  Tournament, 
  TournamentMatch, 
  AvailabilityData, 
  TournamentGroup,
  TournamentStanding,
  TournamentTeam
} from '@/types/tournament'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const tournamentService = {
  // Obtener todos los torneos
  async getTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${API_URL}/tournaments`)
    if (!response.ok) throw new Error('Error al obtener torneos')
    return response.json()
  },

  // Obtener un torneo específico
  async getTournament(id: string): Promise<Tournament> {
    const response = await fetch(`${API_URL}/tournaments/${id}`)
    if (!response.ok) throw new Error('Error al obtener el torneo')
    return response.json()
  },

  // Obtener partidos de un torneo
  async getTournamentMatches(id: string): Promise<TournamentMatch[]> {
    const response = await fetch(`${API_URL}/tournaments/${id}/matches`)
    if (!response.ok) throw new Error('Error al obtener los partidos')
    const data = await response.json()
    return data.matches
  },

  // Obtener equipos de un torneo
  async getTournamentTeams(id: string): Promise<TournamentTeam[]> {
    const response = await fetch(`${API_URL}/tournaments/${id}/teams`)
    if (!response.ok) throw new Error('Error al obtener los equipos')
    const data = await response.json()
    
    // Procesar para incluir nombres de jugadores
    return data.teams.map((team: any) => ({
      team_id: team.team_id,
      unavailable_times: team.unavailable_times,
      team: {
        id: team.teams.id,
        player1_id: team.teams.player1_id,
        player2_id: team.teams.player2_id,
        player1: team.teams.player1,
        player2: team.teams.player2
      }
    }))
  },

  // Obtener grupos de un torneo
  async getTournamentGroups(id: string): Promise<TournamentGroup[]> {
    const response = await fetch(`${API_URL}/tournaments/${id}/groups`)
    if (!response.ok) throw new Error('Error al obtener los grupos')
    const data = await response.json()
    return data.groups
  },

  // Obtener clasificación de un torneo
  async getTournamentStandings(id: string): Promise<TournamentStanding[]> {
    const response = await fetch(`${API_URL}/tournaments/${id}/standings`)
    if (!response.ok) throw new Error('Error al obtener la clasificación')
    return response.json()
  },

  // Obtener disponibilidad de horarios
  async getAvailableHours(id: string): Promise<AvailabilityData> {
    const response = await fetch(`${API_URL}/tournaments/${id}/available-hours`)
    if (!response.ok) throw new Error('Error al obtener la disponibilidad')
    return response.json()
  },

  // Actualizar un partido
  async updateMatch(
    matchId: string,
    data: Partial<{
      match_day: string
      start_time: string
      court_id: string
      status: TournamentMatch['status']
      team1_sets1_won: number
      team2_sets1_won: number
      team1_sets2_won: number
      team2_sets2_won: number
      team1_tie1_won: number
      team2_tie1_won: number
      team1_tie2_won: number
      team2_tie2_won: number
      team1_tie3_won: number
      team2_tie3_won: number
      winner_team_id: string
    }>
  ): Promise<TournamentMatch> {
    const response = await fetch(`${API_URL}/matches/${matchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al actualizar el partido')
    }
    
    return response.json()
  },

  // Generar grupos
  async generateGroups(id: string): Promise<TournamentGroup[]> {
    const response = await fetch(`${API_URL}/tournaments/${id}/generate-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al generar grupos')
    }

    const data = await response.json()
    return data.groups_created
  },

  // Validar horario del torneo
  async validateSchedule(id: string): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const response = await fetch(`${API_URL}/tournaments/${id}/validate-schedule`)
    if (!response.ok) throw new Error('Error al validar el horario')
    return response.json()
  }
}