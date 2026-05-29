import type { FootballHomeAwayFormat, FootballTournamentPhase } from '@/types/footballLeague'

/**
 * Fechas de ida en round-robin (mismo criterio que generateRoundRobinSchedule en el backend).
 * Con n impar hay n fechas (una con bye); con n par hay n-1.
 */
export function roundRobinIdaMatchdays(teamSize: number): number {
  if (teamSize < 2) return 1
  return teamSize % 2 === 1 ? teamSize : teamSize - 1
}

/** Fechas de una fase (Apertura o Clausura): ida, o ida + vuelta. */
export function matchdaysPerTournamentPhase(teamSize: number, homeAway: boolean): number {
  const ida = roundRobinIdaMatchdays(teamSize)
  return ida * (homeAway ? 2 : 1)
}

export function totalLeagueMatchdays(
  teamSize: number,
  homeAwayFormat: FootballHomeAwayFormat,
  tournamentPhase: FootballTournamentPhase
): number {
  const perPhase = matchdaysPerTournamentPhase(teamSize, homeAwayFormat === 'home_away')
  return tournamentPhase === 'Apertura + Clausura' ? perPhase * 2 : perPhase
}
