export type FootballLeagueStatus = 'Inscribiendo' | 'Activa' | 'Finalizada'
export type FootballMatchStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
export type FootballTournamentPhase = 'Apertura' | 'Clausura' | 'Apertura + Clausura'

export interface FootballLeague {
  id: string
  name: string
  description: string | null
  image_url: string | null
  start_date: string
  end_date: string
  status: FootballLeagueStatus
  team_size: number
  inscription_cost: number
  time_slots: string[]
  frequency: 'weekly' | 'biweekly'
  tournament_phase: FootballTournamentPhase
  created_at: string
  updated_at: string
  registeredTeams?: number
  teams?: FootballLeagueTeam[]
}

export interface FootballLeagueTeam {
  league_team_id: string
  inscription_paid: boolean
  team: {
    id: string
    display_name: string | null
    image_url?: string | null
    player1: { id: string; first_name: string; last_name: string } | null
    player2: { id: string; first_name: string; last_name: string } | null
  }
}

export interface FootballMatch {
  id: string
  league_id: string
  league_team1_id: string
  league_team2_id: string
  home_goals: number
  away_goals: number
  match_date: string | null
  time_slot: string | null
  matchday_number: number
  match_order: number
  court_id: string | null
  status: FootballMatchStatus
  walkover: boolean
  winner_league_team_id: string | null
  team1_label?: string
  team2_label?: string
  court?: { id: string; name: string } | null
  league?: { id: string; name: string; status: string } | null
}

export interface FootballStanding {
  id: string
  league_id: string
  team_id: string
  points: number
  wins: number
  draws: number
  losses: number
  matches_played: number
  goals_for: number
  goals_against: number
  goal_difference: number
  // aliases API
  pj?: number
  pg?: number
  pe?: number
  pp?: number
  dif?: number
  gf?: number
  gc?: number
  pts?: number
  team?: {
    id: string
    display_name: string | null
    image_url?: string | null
    player1: { id: string; first_name: string; last_name: string } | null
    player2: { id: string; first_name: string; last_name: string } | null
  }
}

/** Cupos de equipo en el wizard de creación (admin). */
export interface FootballDraftTeamSlot {
  display_name: string
  imageFile: File | null
  imageUrl: string | null
  preview: string | null
}

export interface FootballLeagueFormData {
  name: string
  description: string
  inscription_cost: number
  start_date: string
  end_date: string
  team_size: number
  frequency: 'weekly'
  tournament_phase: FootballTournamentPhase
  time_slots: string[]
  image_url?: string | null
}
