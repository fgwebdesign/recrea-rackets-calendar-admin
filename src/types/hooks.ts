// src/types/hooks.ts

// Describes a player object as typically returned by hooks or specific data transformations
export interface HookPlayer {
  id: string;
  name: string;
  // Add other relevant player fields if necessary from hook data
}

// Describes the nested 'teams' object containing detailed team and player info
export interface HookTeamDetails {
  id: string; // The ID of the 'teams' table record itself, or the team's primary ID
  player1_id?: string; // Optional if not always present or needed directly
  player2_id?: string; // Optional if not always present or needed directly
  player1?: HookPlayer;
  player2?: HookPlayer;
  name?: string; // Optional: if the team has a direct name property in the hook data
}

// Describes the structure of a tournament team entry, often found in arrays returned by hooks like useTournaments
export interface HookTournamentTeam {
  team_id: string; // This is the actual ID of the team in a tournament context (e.g., from tournament_teams table)
                   // It should typically match match.home_team_id or match.away_team_id
  teams: HookTeamDetails; // The nested object containing more specific team details and players
  // other fields like payment_status, etc., might be part of this structure from specific hooks
  name?: string; // Optional: Sometimes the top-level entry might also have a direct team name
} 