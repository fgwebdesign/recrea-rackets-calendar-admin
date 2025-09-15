// ========================================
// 🎾 TIPOS DE TORNEOS - SISTEMA REVOLUCIONARIO
// ========================================

// ========================================
// 📊 TIPOS BASE DE SUPABASE
// ========================================

export interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  profile_photo?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
  onboarding_completed: boolean
}

export interface Team {
  id: string
  player1_id: string
  player2_id: string
  created_at: string
  updated_at: string
  // Relaciones expandidas
  player1?: User
  player2?: User
}

export interface Category {
  id: string
  name: string
  created_at: string
  updated_at: string
  max_teams: number
  min_teams: number
  play_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  play_time: string
  status: 'registration' | 'pending' | 'in_progress' | 'completed'
  registration_deadline?: string
  order: number
}

export interface Court {
  id: string
  name: string
  photo_url?: string
  created_at: string
  updated_at: string
}

export interface Sponsor {
  id: string
  name: string
  logo_url: string
  created_at: string
  updated_at: string
}

// ========================================
// 🏆 TIPOS DE TORNEOS
// ========================================

export type TournamentType = 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS'
export type TournamentStatus = 'upcoming' | 'in_progress' | 'completed'

export interface Tournament {
  id: string
  name: string
  category_id: string
  created_at: string
  updated_at: string
  status: TournamentStatus
  end_date: string
  start_date: string
  courts_available?: number
  time_slots?: TimeSlot[]
  max_teams: number
  tournament_type: TournamentType
  group_time_slots?: GroupTimeSlot[]
  // Relaciones expandidas
  category?: Category
  tournament_info?: TournamentInfo
  tournament_teams?: TournamentTeam[]
  tournament_groups?: TournamentGroup[]
  tournament_matches?: TournamentMatch[]
  tournament_standings?: TournamentStanding[]
  tournament_sponsors?: TournamentSponsor[]
}

export interface TimeSlot {
  id: string
  start: string
  end: string
  label: string
  day?: string
  date?: string
  tournament_day?: number
}

export interface GroupTimeSlot {
  id: string
  tournament_day: number
  start: string
  end: string
  label: string
  date: string
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
  signup_limit_date: string
  inscription_cost: number
  sponsors?: string
  tournament_thumbnail?: string
  created_at: string
  updated_at: string
  tournament_address: string
  tournament_club_name: string
}

export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
  created_at: string
  updated_at: string
  payment_status: 'pending' | 'paid' | 'failed'
  payment_reference?: string
  payment_date?: string
  payment_amount?: number
  unavailable_group_slot_id?: string
  unavailable_times?: string
  // Relaciones expandidas - usando 'teams' para coincidir con el backend
  teams?: {
    id: string
    player1_id: string
    player2_id: string
    player1?: {
      first_name: string
      last_name: string
    }
    player2?: {
      first_name: string
      last_name: string
    }
  }
  // Mantener 'team' para compatibilidad hacia atrás
  team?: Team
}

export interface TournamentGroup {
  id: string
  tournament_id: string
  group_number: number
  teams: string[] // Array de IDs de equipos
  status: 'IN_PROGRESS' | 'COMPLETED'
  created_at: string
  updated_at: string
}

export interface TeamWithConstraints {
  team_id: string
  team_name?: string
  player1_name?: string
  player2_name?: string
  player1?: User
  player2?: User
  unavailable_times?: string
  unavailable_time_slot?: string
  slot_label?: string
  restrictions?: string[]
}

// ========================================
// ⚽ TIPOS DE PARTIDOS
// ========================================

export type MatchRound = 'group' | 'quarter_final' | 'semi_final' | 'final'
export type MatchStage = 'group' | 'quarter_final' | 'semi_final' | 'final'
export type MatchStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface TournamentMatch {
  id: string
  tournament_id: string
  home_team_id: string
  away_team_id: string
  group_number?: number
  round: MatchRound
  match_number?: number
  match_day?: string
  start_time?: string
  court_id?: string
  court_name?: string // Nombre de la cancha
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
  winner_team_id?: string
  status: MatchStatus
  created_at: string
  updated_at: string
  group_id?: string
  stage: MatchStage
  bracket_match_id?: string
  match_order?: number
  elimination_round?: string
  // Relaciones expandidas
  home_team?: Team
  away_team?: Team
  winner_team?: Team
  court?: Court
  group?: TournamentGroup
}

// ========================================
// 📊 TIPOS DE CLASIFICACIONES
// ========================================

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
  created_at: string
  updated_at: string
  // Campos calculados
  games_diff?: number
  sets_diff?: number
  position?: number
  qualification_status?: 'group_winner' | 'group_second' | 'eliminated'
  // Relaciones expandidas
  team?: Team
  group?: TournamentGroup
}

// ========================================
// 🏅 TIPOS DE PATROCINADORES
// ========================================

export interface TournamentSponsor {
  tournament_id: string
  sponsor_id: string
  created_at: string
  // Relaciones expandidas
  sponsor?: Sponsor
}

// ========================================
// 📋 TIPOS DE FORMULARIOS
// ========================================

export interface TournamentFormData {
  // Información básica
  name: string
  categories: string[]
  start_date: string
  end_date: string
  courts_available: number
  time_slots: TimeSlot[]
  group_time_slots: GroupTimeSlot[]
  tournament_type: TournamentType
  
  // Información detallada
  description: string
  rules: string
  tournament_location: string
  tournament_address: string
  tournament_club_name: string
  signup_limit_date: string
  inscription_cost: number
  sponsors: string[]
  tournament_thumbnail?: string
  
  // Premios
  first_place_prize?: string
  second_place_prize?: string
  third_place_prize?: string
}

// ========================================
// 🎯 TIPOS DE ALGORITMOS
// ========================================

export interface TournamentFormat {
  total_teams: number
  groups_count: number
  teams_per_group: number
  teams_to_qualify: number
  elimination_stages: {
    first: string
    matches: string[]
    direct_to_semis?: number
    quarter_finals_teams?: number
    octavos_finals_teams?: number
  }
}

export interface GroupDistribution {
  group_number: number
  teams: TeamWithConstraints[]
  restriction_slots: string[]
  conflicts: ConflictInfo[]
  available_slots: TimeSlot[]
  recommended_slots: string[]
  has_conflicts: boolean
  schedule_flexibility: number
}

export interface ConflictInfo {
  team_id: string
  conflict_type: 'time_restriction' | 'court_conflict' | 'schedule_conflict'
  description: string
  severity: 'low' | 'medium' | 'high'
  resolution?: string
}

// ========================================
// 📅 TIPOS DE PROGRAMACIÓN
// ========================================

export interface ScheduledMatch {
  id: string
  group_name: string
  home_team_name: string
  away_team_name: string
  scheduled_date: string
  scheduled_time: string
  assigned_court: string
  assigned_court_name: string
  slot_info: {
    id: string
    label: string
    start: string
    end: string
  }
}

export interface AvailabilityData {
  slot_id: string
  label: string
  start: string
  end: string
  capacity: {
    total_capacity: number
    selected_count: number
    available: boolean
    remaining_slots: number
    percentage_full: number
  }
  teams: TeamWithConstraints[]
}

// ========================================
// 🏆 TIPOS DE BRACKETS
// ========================================

export interface BracketMatch {
  match_id: string
  round: string
  match_number: number
  team1?: {
    team_id: string
    team_name: string
    qualification_type: string
  }
  team2?: {
    team_id: string
    team_name: string
    qualification_type: string
  }
  winner?: string
  status: 'pending' | 'completed'
  depends_on?: string[]
}

export interface EliminationBracket {
  format: TournamentType
  total_teams: number
  structure: {
    quarter_finals?: BracketMatch[]
    semifinals: BracketMatch[]
    final: BracketMatch[]
  }
  advancement_rules: {
    [key: string]: string
  }
}

// ========================================
// 📊 TIPOS DE ESTADÍSTICAS
// ========================================

export interface TournamentStats {
  total_teams: number
  teams_registered: number
  teams_pending: number
  groups_generated: boolean
  matches_scheduled: number
  matches_completed: number
  matches_pending: number
  total_revenue: number
  payment_status: {
    paid: number
    pending: number
    failed: number
  }
}

// ========================================
// 🔄 TIPOS DE RESPUESTAS DE API
// ========================================

export interface ApiResponse<T> {
  data?: T
  message: string
  success: boolean
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ========================================
// 🎨 TIPOS DE UI/UX
// ========================================

export interface ValidationError {
  field: string
  message: string
  type: 'required' | 'format' | 'custom'
}

export interface LoadingState {
  isLoading: boolean
  error?: string
  progress?: number
}

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ========================================
// 🚀 TIPOS DE CONFIGURACIÓN
// ========================================

export interface TournamentConfig {
  match_duration_minutes: number
  points_for_win: number
  points_for_loss_with_set: number
  points_for_loss: number
  points_for_walkover: number
  max_concurrent_matches: number
  default_courts: number
}

export interface SystemSettings {
  whatsapp_number?: string
  default_tournament_config: TournamentConfig
  notification_settings: {
    email_notifications: boolean
    whatsapp_notifications: boolean
    push_notifications: boolean
  }
}

// ========================================
// 🎯 EXPORTACIONES PRINCIPALES
// ========================================

// Los tipos ya están exportados individualmente arriba