export interface League {
  id: string;
  name: string;
  category_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
  courts_available: number;
  time_slots: number[][];
  inscription_cost: number;
  description: string | null;
  frequency: string;
  match_duration_minutes: number;
  points_for_win: number;
  points_for_loss_with_set: number;
  points_for_loss: number;
  points_for_walkover: number;
  status: string;
  registration_status: 'open' | 'closed';
  team_size: number;
  registeredTeams: number;
  teams?: {
    id: string;
    league_team_id: string;
    inscription_paid: boolean;
    player1: {
      id: string;
      name: string;
    };
    player2: {
      id: string;
      name: string;
    };
  }[];
  matches?: LeagueMatch[];
  hasGeneratedMatches?: boolean;
}

export interface LeagueTeam {
  id: string;
  name: string;
  players: string[];
  stats: {
    played: number;    // PJ
    won: number;       // PG
    lost: number;      // PP
    setsWon: number;   // SG
    setsLost: number;  // SP
    points: number;    // PTS
  };
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  league_team1_id: string;
  league_team2_id: string;
  team1: string;
  team2: string;
  match_date: string;
  match_number: number;
  round_number?: number | null; // Número de ronda desde league_schedule
  team1_sets1_won: number;
  team2_sets1_won: number;
  team1_sets2_won: number;
  team2_sets2_won: number;
  team1_tie1_won?: number;
  team2_tie1_won?: number;
  team1_tie2_won?: number;
  team2_tie2_won?: number;
  team1_tie3_won?: number;
  team2_tie3_won?: number;
  winner_league_team_id: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'WALKOVER';
  walkover: boolean;
  walkover_team_id: string | null;
  category_id: string;
  court_id: string;
  court?: Court;
  court_name?: string;
  venue_id?: string;
  venue_name?: string;
} 

import type { Court } from './court'; 