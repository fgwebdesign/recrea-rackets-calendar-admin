/**
 * Nombre a mostrar de un equipo: si eligieron un nombre de equipo al inscribirse
 * (`teams.display_name`), se muestra JUNTO con los jugadores — "Nombre (Jugador 1 - Jugador 2)" —
 * no uno en lugar del otro. Si no pusieron nombre, solo "Jugador 1 - Jugador 2".
 */
export function formatTeamName(team?: {
  display_name?: string | null;
  player1?: { first_name?: string | null; last_name?: string | null } | null;
  player2?: { first_name?: string | null; last_name?: string | null } | null;
} | null): string {
  if (!team) return 'Equipo no disponible';

  const displayName = team.display_name?.trim();

  if (!team.player1 || !team.player2) {
    return displayName || 'Equipo no disponible';
  }

  const p1 = `${team.player1.first_name || ''} ${team.player1.last_name || ''}`.trim();
  const p2 = `${team.player2.first_name || ''} ${team.player2.last_name || ''}`.trim();
  const players = `${p1} - ${p2}`;

  return displayName ? `${displayName} (${players})` : players;
}
