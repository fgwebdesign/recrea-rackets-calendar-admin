import { Team } from './team'
import { Category } from './category'
import { Court } from './court'
import { User } from './user'

export interface Tournament {
  id: string
  name: string
  category_id: string
  start_date: string
  end_date: string
  status: 'upcoming' | 'in_progress' | 'completed'
  courts_available: number
  time_slots: [number, number][]
  group_time_slots: GroupTimeSlot[]
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  max_teams: 9 | 12
  tournament_info?: TournamentInfo
  tournament_teams?: TournamentTeam[]
  category?: Category
}

export interface GroupTimeSlot {
  id: string
  day: 'friday' | 'saturday'
  start: string
  end: string
  label: string
}

export interface TournamentMatch {
  id: string
  tournament_id: string
  home_team_id: string
  away_team_id: string
  group_number?: number
  round: 'group' | 'quarter_final' | 'semi_final' | 'final'
  stage: 'group' | 'quarter_final' | 'semi_final' | 'final'
  match_number: number
  match_day: string
  start_time: string
  court_id: string
  team1_sets1_won?: number
  team2_sets1_won?: number
  team1_sets2_won?: number
  team2_sets2_won?: number
  team1_tie1_won?: number
  team2_tie1_won?: number
  team1_tie2_won?: number
  team2_tie2_won?: number
  team1_tie3_won?: number
  team2_tie3_won?: number
  winner_team_id?: string
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  group_id?: string
  home_team?: Team
  away_team?: Team
  court?: Court
}

export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
  unavailable_times?: number[]
  payment_status: 'pending' | 'paid' | 'failed'
  payment_reference?: string
  payment_date?: string
  payment_amount?: number
  unavailable_group_slot_id?: string
  team?: Team
}

export interface TournamentInfo {
  id: string
  tournament_id: string
  first_place_prize?: string
  second_place_prize?: string
  third_place_prize?: string
  description: string
  rules: string
  tournament_location: string
  tournament_address: string
  tournament_club_name: string
  signup_limit_date: string
  inscription_cost: number
  sponsors?: string
  tournament_thumbnail?: string
}

export interface TournamentGroup {
  id: string
  tournament_id: string
  group_number: number
  teams: string[]
  status: 'IN_PROGRESS' | 'COMPLETED'
}

export interface TournamentStanding {
  id: string
  tournament_id: string
  team_id: string
  group_id: string
  points: number
  matches_played: number
  matches_won: number
  matches_lost: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  team?: Team
}

export interface PlayerInfo {
  id: string
  first_name: string
  last_name: string
}

export interface TeamWithPlayers {
  team_id: string
  player1: PlayerInfo
  player2: PlayerInfo
}

export interface AvailabilityData {
  tournament_info: {
    category: string
    tournament_type: string
    max_teams: number
    courts_available: number
    days: number
    horasPorDia: number
    totalMatches: number
    slotsDisponibles: number
    cupoPorSlot: number
  }
  availability: Record<string, {
    total_capacity: number
    selected_count: number
    remaining_slots: number
    percentage_full: number
    available: boolean
    teams: TeamWithPlayers[]
  }>
}