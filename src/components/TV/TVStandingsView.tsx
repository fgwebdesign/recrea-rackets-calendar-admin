'use client';

interface TeamStanding {
  team_id: string;
  team_info?: { player1?: string; player2?: string };
  position: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  points: number;
}

interface GroupData {
  group_number: number;
  teams: TeamStanding[];
  category_name?: string;
}

function formatPlayerNames(info: { player1?: string; player2?: string } | null | undefined): string {
  if (!info) return '—';
  const n1 = String(info.player1 || '').trim();
  const n2 = String(info.player2 || '').trim();
  if (n1 && n2) return `${n1} / ${n2}`;
  return n1 || n2 || '—';
}

const GROUP_VARS = ['--tv-g1', '--tv-g2', '--tv-g3', '--tv-g4'] as const;

const MEDAL: Record<number, { bg: string; color: string }> = {
  1: { bg: '#f59e0b', color: '#78350f' },
  2: { bg: '#94a3b8', color: '#1e293b' },
  3: { bg: '#92400e', color: '#fef3c7' },
};

interface TVStandingsViewProps {
  standings: Record<string, GroupData> | null;
}

export function TVStandingsView({ standings }: TVStandingsViewProps) {
  if (!standings || Object.keys(standings).length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed"
        style={{ borderColor: 'var(--tv-border)', color: 'var(--tv-text-muted)' }}
      >
        <p className="text-2xl font-bold font-orbitron">Sin clasificaciones</p>
        <p className="text-base mt-1" style={{ color: 'var(--tv-text-muted)' }}>Los grupos aún no tienen partidos registrados</p>
      </div>
    );
  }

  const entries = Object.entries(standings).slice(0, 4);
  const cols = entries.length <= 2 ? entries.length : 2;

  return (
    <div
      className="h-full overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: entries.length > 2 ? '1fr 1fr' : '1fr',
        gap: '0.75rem',
      }}
    >
      {entries.map(([, group], idx) => {
        const gVar = GROUP_VARS[idx % GROUP_VARS.length];
        // Show at most 4 teams per group
        const teams = group.teams.slice(0, 4);

        return (
          <div
            key={group.group_number}
            className="flex flex-col overflow-hidden rounded-2xl"
            style={{
              background: 'var(--tv-surface)',
              border: `2px solid color-mix(in srgb, var(${gVar}) 40%, transparent)`,
            }}
          >
            {/* Group header */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 font-orbitron font-bold"
              style={{ background: `var(${gVar})`, color: 'var(--tv-text-inv)' }}
            >
              <span className="text-base tracking-widest">GRUPO {group.group_number}</span>
              <span className="text-sm opacity-80">{group.teams.length} equipos</span>
            </div>

            {/* Column headers */}
            <div
              className="flex-shrink-0 grid font-orbitron text-xs font-bold uppercase tracking-wider px-4 py-2"
              style={{
                gridTemplateColumns: '3rem 1fr 2.5rem 2.5rem 2.5rem 3.5rem 3rem',
                background: `color-mix(in srgb, var(${gVar}) 8%, var(--tv-surface))`,
                color: 'var(--tv-text-muted)',
                borderBottom: '1px solid var(--tv-border)',
              }}
            >
              <span className="text-center">#</span>
              <span>Equipo</span>
              <span className="text-center">PJ</span>
              <span className="text-center">PG</span>
              <span className="text-center">PP</span>
              <span className="text-center">Sets</span>
              <span className="text-center">Pts</span>
            </div>

            {/* Team rows — distribute remaining height */}
            <div className="flex-1 flex flex-col min-h-0">
              {teams.map((team, ti) => {
                const medal = MEDAL[team.position];
                const isLast = ti === teams.length - 1;
                return (
                  <div
                    key={team.team_id}
                    className="flex-1 grid items-center px-4"
                    style={{
                      gridTemplateColumns: '3rem 1fr 2.5rem 2.5rem 2.5rem 3.5rem 3rem',
                      borderBottom: isLast ? 'none' : '1px solid var(--tv-border)',
                      minHeight: 0,
                    }}
                  >
                    {/* Position */}
                    <div className="flex justify-center">
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-extrabold font-orbitron"
                        style={medal
                          ? { background: medal.bg, color: medal.color }
                          : { background: 'var(--tv-border)', color: 'var(--tv-text-muted)' }
                        }
                      >
                        {team.position}°
                      </span>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold font-orbitron"
                        style={{
                          background: `color-mix(in srgb, var(${gVar}) 20%, var(--tv-border))`,
                          color: `var(${gVar})`,
                        }}
                      >
                        {formatPlayerNames(team.team_info).charAt(0) || '?'}
                      </div>
                      <span
                        className="text-base font-semibold truncate"
                        style={{ color: 'var(--tv-text)' }}
                      >
                        {formatPlayerNames(team.team_info)}
                      </span>
                    </div>

                    {/* Stats */}
                    <span className="text-center text-base tabular-nums font-medium" style={{ color: 'var(--tv-text)' }}>{team.matches_played}</span>
                    <span className="text-center text-base font-bold tabular-nums" style={{ color: '#059669' }}>{team.matches_won}</span>
                    <span className="text-center text-base font-bold tabular-nums" style={{ color: '#dc2626' }}>{team.matches_lost}</span>
                    <span className="text-center text-sm tabular-nums font-medium" style={{ color: 'var(--tv-text-muted)' }}>
                      {team.sets_won}-{team.sets_lost}
                    </span>

                    {/* Points badge */}
                    <div className="flex justify-center">
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-extrabold tabular-nums font-orbitron"
                        style={{ background: `var(${gVar})`, color: 'var(--tv-text-inv)' }}
                      >
                        {team.points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
