import { UUID } from 'crypto';

export interface Player {
  id: UUID;
  name: string;
}

export interface Team {
  id: UUID;
  player1: Player;
  player2: Player;
}

export interface TimeConstraint {
  team_id: UUID;
  start_time: Date;
  end_time: Date;
  
}

export type TournamentFormat =
  | 'single_elimination'
  | 'round_robin'
  | 'group_stage';

export interface CreateTournamentRequest {
  name: string;
  players: Player[];
  teams: Team[];
  teams_limit: number;
  category: string;
  start_date: Date;
  end_date: Date;
  price: number;
  sign_up_limit_date: Date;
  format: TournamentFormat;
  time_constraints?: TimeConstraint[];
}

export interface TournamentTimeConstraint {
  id: UUID;
  tournament_id: UUID;
  team_id: UUID;
  start_time: Date;
  end_time: Date;
}

export interface TournamentTeam extends Team {
  team_id: string;
  group?: 'A' | 'B';
  teams?: {
    id: string;
    player1_id: string;
    player2_id: string;
  };
}

export interface TimeSlot {
  start: string;
  end: string;
  day: string;
  date: string;
  error?: string;
}

export interface TournamentBase {
  name: string;
  category_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'upcoming' | 'in_progress' | 'finished';
  courts_available: number;
  time_slots: TimeSlot[];
}

export interface TournamentInfo {
  description: string;
  rules: string;
  tournament_location: string;
  tournament_address: string;
  tournament_club_name: string;
  signup_limit_date: string;
  inscription_cost: number;
  first_place_prize: string;
  second_place_prize: string;
  third_place_prize: string;
  tournament_thumbnail: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface TournamentFormData {
  name: string;
  category_ids: string[];
  categories: Array<{
    id: string;
    name: string;
  }>;
  start_date: string;
  end_date: string;
  status: string;
  courts_available: number;
  time_slots: Array<{
    start: string;
    end: string;
    day: string;
    date: string;
  }>;
  tournament_info: {
    description: string;
    rules: string;
    tournament_location: string;
    tournament_address: string;
    tournament_club_name: string;
    signup_limit_date: string;
    inscription_cost: number;
    first_place_prize: string;
    second_place_prize?: string;
    third_place_prize?: string;
    tournament_thumbnail?: string;
    sponsors?: string[];
  };
}

export interface Tournament {
  id: string;
  name: string;
  category_id: string;
  status: 'upcoming' | 'in_progress' | 'finished';
  start_date: string;
  end_date: string;
  teams_limit: number;
  price?: number;
  prize_pool?: number;
  format: TournamentFormat;
  tournament_teams: TournamentTeam[];
  tournament_info: Array<{
    tournament_club_name?: string;
    inscription_cost?: number;
    rules?: string;
    tournament_location?: string;
    tournament_address?: string;
    signup_limit_date?: string;
    tournament_thumbnail?: string;
    sponsors?: string[];
    description?: string;
    first_place_prize?: string;
    second_place_prize?: string;
    third_place_prize?: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

interface Set {
  games: number;
  tiebreak: number | null;
}

interface Score {
  sets: Set[];
}

export interface Match {
  id: string;
  tournament_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  court_id: string | null;
  score: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  start_hour: string | null;
  match_day: string | null;
  round_number: number | null;
  winner_team_id: string | null;
  round: string | null;
  start_time: string | null;
  group_id: string | null;
  home_team?: {
    id: string;
    name?: string;
    player1_id: string;
    player2_id: string;
    player1?: {
      first_name?: string;
      last_name?: string;
      name?: string;
    };
    player2?: {
      first_name?: string;
      last_name?: string;
      name?: string;
    };
  };
  away_team?: {
    id: string;
    name?: string;
    player1_id: string;
    player2_id: string;
    player1?: {
      first_name?: string;
      last_name?: string;
      name?: string;
    };
    player2?: {
      first_name?: string;
      last_name?: string;
      name?: string;
    };
  };
  nextMatchId?: string | null;
}

interface TournamentDraw {
  matches: Match[];
}
