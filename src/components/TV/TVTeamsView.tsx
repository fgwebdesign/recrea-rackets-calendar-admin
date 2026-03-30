'use client';

interface Team {
  id: string;
  teams?: {
    player1?: { first_name?: string; last_name?: string };
    player2?: { first_name?: string; last_name?: string };
  };
  team?: {
    player1?: { first_name?: string; last_name?: string };
    player2?: { first_name?: string; last_name?: string };
  };
}

function formatTeamName(t: Team): string {
  const team = t.teams || t.team;
  if (!team) return 'Equipo';
  const p1 = team.player1 ? `${team.player1.first_name || ''} ${team.player1.last_name || ''}`.trim() : '';
  const p2 = team.player2 ? `${team.player2.first_name || ''} ${team.player2.last_name || ''}`.trim() : '';
  if (p1 && p2) return `${p1} / ${p2}`;
  return p1 || p2 || 'Equipo';
}

interface TVTeamsViewProps {
  teams: Team[];
  classificationSummary?: { qualified_teams?: unknown[]; format?: string };
}

export function TVTeamsView({ teams, classificationSummary }: TVTeamsViewProps) {
  if (teams.length === 0) return null; // handled by computeAvailableViews

  const qualifiedCount = classificationSummary?.qualified_teams?.length ?? 0;
  const formatLabel = classificationSummary?.format || '';

  // Show max 24 teams, auto-columns based on count
  const visible = teams.slice(0, 24);
  const cols = visible.length <= 6 ? 2 : visible.length <= 12 ? 3 : 4;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Stats strip */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 mb-3">
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-2"
          style={{ background: 'color-mix(in srgb, var(--tv-g1) 12%, var(--tv-surface))', border: '1.5px solid color-mix(in srgb, var(--tv-g1) 30%, transparent)' }}
        >
          <span className="text-xs font-bold uppercase tracking-widest font-orbitron" style={{ color: 'var(--tv-g1)' }}>Equipos</span>
          <span className="text-3xl font-extrabold tabular-nums font-orbitron" style={{ color: 'var(--tv-g1)' }}>{teams.length}</span>
        </div>

        {qualifiedCount > 0 && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-2"
            style={{ background: 'color-mix(in srgb, var(--tv-g2) 12%, var(--tv-surface))', border: '1.5px solid color-mix(in srgb, var(--tv-g2) 30%, transparent)' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest font-orbitron" style={{ color: 'var(--tv-g2)' }}>Clasificados</span>
            <span className="text-3xl font-extrabold tabular-nums font-orbitron" style={{ color: 'var(--tv-g2)' }}>{qualifiedCount}</span>
          </div>
        )}

        {formatLabel && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-2"
            style={{ background: 'color-mix(in srgb, var(--tv-g3) 12%, var(--tv-surface))', border: '1.5px solid color-mix(in srgb, var(--tv-g3) 30%, transparent)' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest font-orbitron" style={{ color: 'var(--tv-g3)' }}>Formato</span>
            <span className="text-base font-bold font-orbitron" style={{ color: 'var(--tv-g3)' }}>{formatLabel}</span>
          </div>
        )}
      </div>

      {/* Team grid */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '0.5rem',
        }}
      >
        {visible.map((team, i) => (
          <div
            key={team.id}
            className="flex items-center gap-3 rounded-xl px-4 overflow-hidden"
            style={{
              background: 'var(--tv-surface)',
              border: `1.5px solid var(--tv-border)`,
            }}
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold font-orbitron"
              style={{
                background: `linear-gradient(135deg, var(--tv-from), var(--tv-to))`,
                color: 'var(--tv-text-inv)',
              }}
            >
              {(i + 1).toString().padStart(2, '0')}
            </div>
            <span
              className="text-base font-semibold truncate font-orbitron"
              style={{ color: 'var(--tv-text)' }}
            >
              {formatTeamName(team)}
            </span>
          </div>
        ))}
      </div>

      {teams.length > 24 && (
        <p className="flex-shrink-0 text-center text-sm font-medium mt-2" style={{ color: 'var(--tv-text-muted)' }}>
          y {teams.length - 24} equipos más
        </p>
      )}
    </div>
  );
}
