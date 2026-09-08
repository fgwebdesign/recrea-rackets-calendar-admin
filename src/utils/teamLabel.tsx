/**
 * El backend manda el nombre de un equipo ya combinado en un solo string:
 *   "Nombre del equipo (Jugador 1 - Jugador 2)"   → si eligieron nombre al inscribirse
 *   "Jugador 1 - Jugador 2"                        → si no pusieron nombre
 *
 * Para poder mostrarlo lindo (nombre del equipo destacado + jugadores en chico debajo, sin
 * cortar con "..."), `splitTeamLabel` separa ese string en sus dos partes SIN tocar los datos,
 * y <TeamLabel> lo pinta de forma consistente en todas las cards (dashboard, calendario,
 * resultados). Es puramente de presentación.
 */

export function splitTeamLabel(label?: string | null): {
  teamName: string | null;
  players: string | null;
} {
  const raw = (label || '').trim();
  if (!raw) return { teamName: null, players: null };

  // "Nombre (Jugador 1 - Jugador 2)": el paréntesis final envuelve a los dos jugadores.
  const m = raw.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (m && m[2].includes(' - ')) {
    return { teamName: m[1].trim(), players: m[2].trim() };
  }

  // Sin nombre de equipo: queda solo "Jugador 1 - Jugador 2" (o un string suelto).
  return { teamName: null, players: raw };
}

interface TeamLabelProps {
  label?: string | null;
  /** Si se omite, la alineación del texto se hereda del contenedor padre. */
  align?: 'left' | 'center' | 'right';
  /** Tamaño de la línea principal. 'sm' por defecto (cards compactas). */
  size?: 'sm' | 'md';
  className?: string;
}

export function TeamLabel({ label, align, size = 'sm', className = '' }: TeamLabelProps) {
  const { teamName, players } = splitTeamLabel(label);
  const alignCls =
    align === 'center' ? 'text-center' : align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : '';
  const mainSize = size === 'md' ? 'text-base' : 'text-sm';

  // Sin nombre de equipo → los jugadores pasan a ser la línea principal.
  if (!teamName) {
    return (
      <span
        className={`block font-semibold text-gray-900 dark:text-gray-100 break-words leading-snug ${mainSize} ${alignCls} ${className}`}
      >
        {players || 'Equipo no disponible'}
      </span>
    );
  }

  return (
    <span className={`block ${alignCls} ${className}`}>
      <span className={`block font-semibold text-gray-900 dark:text-gray-100 break-words leading-snug ${mainSize}`}>
        {teamName}
      </span>
      {players && (
        <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400 break-words leading-snug">
          {players}
        </span>
      )}
    </span>
  );
}
