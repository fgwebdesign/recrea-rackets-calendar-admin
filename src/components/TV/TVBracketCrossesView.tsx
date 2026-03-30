'use client';

interface TeamInfo {
  player1?: { first_name?: string; last_name?: string };
  player2?: { first_name?: string; last_name?: string };
}

interface Match {
  id: string;
  round?: string;
  elimination_round?: string;
  start_time?: string;
  court_name?: string;
  home_team?: TeamInfo;
  away_team?: TeamInfo;
  home_team_id?: string;
  away_team_id?: string;
  status?: string;
}

interface TeamEntry {
  id?: string;
  team_id?: string;
  teams?: TeamInfo;
  team?: TeamInfo;
}

function formatTeamFromObject(team: TeamInfo | null | undefined): string {
  if (!team) return 'TBD';
  const p1 = team.player1 ? `${team.player1.first_name || ''} ${team.player1.last_name || ''}`.trim() : '';
  const p2 = team.player2 ? `${team.player2.first_name || ''} ${team.player2.last_name || ''}`.trim() : '';
  if (p1 && p2) return `${p1} / ${p2}`;
  return p1 || p2 || 'TBD';
}

function buildTeamsMap(teams?: TeamEntry[]): Map<string, string> {
  const m = new Map<string, string>();
  if (!teams) return m;
  teams.forEach((t) => {
    const info = t.teams || t.team;
    const name = formatTeamFromObject(info);
    const key = t.team_id || t.id;
    if (name && name !== 'TBD' && key) m.set(key, name);
  });
  return m;
}

function getTeamName(match: Match, side: 'home' | 'away', teamsMap: Map<string, string>): string {
  const team = side === 'home' ? match.home_team : match.away_team;
  if (team) return formatTeamFromObject(team);
  const id = side === 'home' ? match.home_team_id : match.away_team_id;
  if (id && teamsMap.get(id)) return teamsMap.get(id)!;
  return 'TBD';
}

const ROUND_META: Record<string, { label: string; gVar: string }> = {
  quarter_final: { label: 'Cuartos', gVar: '--tv-g3' },
  semi_final:    { label: 'Semis',   gVar: '--tv-g2' },
  final:         { label: 'Final',   gVar: '--tv-g1' },
};

interface TVBracketCrossesViewProps {
  matches: Match[];
  teams?: TeamEntry[];
}

export function TVBracketCrossesView({ matches, teams }: TVBracketCrossesViewProps) {
  const teamsMap = buildTeamsMap(teams);

  const elimination = matches
    .filter((m) => m.round && m.round !== 'group')
    .filter((m) => m.status === 'scheduled' || m.status === 'pending' || m.status === 'in_progress')
    .sort((a, b) => {
      const order = ['quarter_final', 'semi_final', 'final'];
      return order.indexOf(a.round || '') - order.indexOf(b.round || '');
    })
    .slice(0, 8);

  if (elimination.length === 0) return null; // handled by computeAvailableViews — never shown

  const cols = elimination.length > 4 ? 2 : 1;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h2
        className="flex-shrink-0 text-center font-orbitron font-extrabold tracking-widest mb-3 text-sm uppercase"
        style={{ color: 'var(--tv-text-muted)' }}
      >
        Fase eliminatoria
      </h2>

      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '0.6rem',
        }}
      >
        {elimination.map((match) => {
          const meta = ROUND_META[match.round || ''] ?? { label: match.round ?? 'Eliminatoria', gVar: '--tv-accent' };
          const isLive = match.status === 'in_progress';

          return (
            <div
              key={match.id}
              className="flex items-center gap-3 rounded-2xl overflow-hidden"
              style={{
                background: 'var(--tv-surface)',
                border: `2px solid var(--tv-border)`,
                borderLeft: `5px solid var(${meta.gVar})`,
              }}
            >
              {/* Round label block */}
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center self-stretch px-4"
                style={{
                  background: `color-mix(in srgb, var(${meta.gVar}) 15%, var(--tv-surface))`,
                  minWidth: '5.5rem',
                }}
              >
                {isLive && (
                  <span className="text-[0.5rem] font-extrabold font-orbitron tracking-widest mb-0.5 px-1.5 py-0.5 rounded-full" style={{ background: '#dc2626', color: '#fff' }}>
                    LIVE
                  </span>
                )}
                <span
                  className="text-sm font-extrabold font-orbitron text-center leading-tight"
                  style={{ color: `var(${meta.gVar})` }}
                >
                  {meta.label}
                </span>
                {match.start_time && (
                  <span className="text-xs font-semibold mt-1 font-orbitron" style={{ color: 'var(--tv-text-muted)' }}>
                    {match.start_time.slice(0, 5)}
                  </span>
                )}
                {match.court_name && (
                  <span className="text-xs mt-0.5 text-center leading-tight" style={{ color: 'var(--tv-text-muted)' }}>
                    {match.court_name}
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
                <span className="flex-1 text-right text-base font-bold truncate font-orbitron" style={{ color: 'var(--tv-text)' }}>
                  {getTeamName(match, 'home', teamsMap)}
                </span>
                <span
                  className="flex-shrink-0 text-xs font-extrabold font-orbitron px-2.5 py-1.5 rounded-xl shadow"
                  style={{ background: `linear-gradient(135deg, var(--tv-from), var(--tv-to))`, color: 'var(--tv-text-inv)' }}
                >
                  VS
                </span>
                <span className="flex-1 text-left text-base font-bold truncate font-orbitron" style={{ color: 'var(--tv-text)' }}>
                  {getTeamName(match, 'away', teamsMap)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
