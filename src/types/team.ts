import { User } from './user'

export interface Team {
  id: string
  player1_id: string
  player2_id: string
  player1?: User
  player2?: User
  created_at: string
  updated_at: string
  name?: string // Computed property based on players' names
}

// Helper function to get team name
export const getTeamName = (team: Team): string => {
  if (team.name) return team.name
  
  const player1Name = team.player1 ? 
    `${team.player1.first_name} ${team.player1.last_name}` : 
    'Jugador 1'
  
  const player2Name = team.player2 ? 
    `${team.player2.first_name} ${team.player2.last_name}` : 
    'Jugador 2'

  return `${player1Name} / ${player2Name}`
}