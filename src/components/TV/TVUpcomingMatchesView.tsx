'use client';

interface TeamInfo {
  player1?: { first_name?: string; last_name?: string };
  player2?: { first_name?: string; last_name?: string };
}

interface Match {
  id: string;
  start_time?: string;
  match_day?: string;
  tournament_day?: number;
  court_name?: string;
  venue_name?: string;
  round?: string;
  home_team?: TeamInfo;
  away_team?: TeamInfo;
  home_team_id?: string;
  away_team_id?: string;
  status?: string;
}

function formatTeamFromObject(team: TeamInfo | null | undefined): string {
  if (!team) return 'TBD';
  const p1 = team.player1 ? `${team.player1.first_name || ''} ${team.player1.last_name || ''}`.trim() : '';
  const p2 = team.player2 ? `${team.player2.first_name || ''} ${team.player2.last_name || ''}`.trim() : '';
  if (p1 && p2) return `${p1} / ${p2}`;
  return p1 || p2 || 'TBD';
}

interface TeamEntry {
  id?: string;
  team_id?: string;
  teams?: TeamInfo;
  team?: TeamInfo;
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

function formatTime(t?: string): string {
  if (t) return t.slice(0, 5);
  return '—';
}

const GROUP_VARS = ['--tv-g1', '--tv-g2', '--tv-g3', '--tv-g4', '--tv-accent', '--tv-g2'] as const;

interface TVUpcomingMatchesViewProps {
  matches: Match[];
  teams?: TeamEntry[];
}

export function TVUpcomingMatchesView({ matches, teams }: TVUpcomingMatchesViewProps) {
  const teamsMap = buildTeamsMap(teams);

  const scheduled = matches
    .filter((m) => m.status === 'scheduled' || m.status === 'in_progress')
    .filter((m) => !m.round || m.round === 'group')
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 10);

  if (scheduled.length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed"
        style={{ borderColor: 'var(--tv-border)', color: 'var(--tv-text-muted)' }}
      >
        <p className="text-2xl font-bold font-orbitron">Sin partidos programados</p>
        <p className="text-base mt-1">Todos los partidos han finalizado o no hay fixtures generados</p>
      </div>
    );
  }

  // Distribute matches in 2 columns, rows fill height equally
  const cols = scheduled.length > 5 ? 2 : 1;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h2
        className="flex-shrink-0 text-center font-orbitron font-extrabold tracking-widest mb-3 text-sm uppercase"
        style={{ color: 'var(--tv-text-muted)' }}
      >
        Próximos partidos
      </h2>

      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '0.6rem',
        }}
      >
        {scheduled.map((match, i) => {
          const gVar = GROUP_VARS[i % GROUP_VARS.length];
          const isLive = match.status === 'in_progress';

          return (
            <div
              key={match.id}
              className="flex items-center gap-3 rounded-2xl overflow-hidden"
              style={{
                background: 'var(--tv-surface)',
                border: `2px solid var(--tv-border)`,
                borderLeft: `5px solid var(${gVar})`,
                paddingLeft: '0',
              }}
            >
              {/* Time + court block */}
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center self-stretch px-4"
                style={{
                  background: `color-mix(in srgb, var(${gVar}) 15%, var(--tv-surface))`,
                  minWidth: '5.5rem',
                }}
              >
                {isLive && (
                  <span
                    className="text-[0.5rem] font-extrabold font-orbitron tracking-widest mb-0.5 px-1.5 py-0.5 rounded-full"
                    style={{ background: '#dc2626', color: '#fff' }}
                  >
                    LIVE
                  </span>
                )}
                <span
                  className="text-xl font-extrabold tabular-nums font-orbitron leading-none"
                  style={{ color: `var(${gVar})` }}
                >
                  {formatTime(match.start_time)}
                </span>
                {match.court_name && (
                  <span
                    className="text-xs font-bold mt-1 text-center leading-tight"
                    style={{ color: 'var(--tv-text-muted)' }}
                  >
                    {match.court_name}
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
                <span
                  className="flex-1 text-right text-base font-bold truncate font-orbitron"
                  style={{ color: 'var(--tv-text)' }}
                >
                  {getTeamName(match, 'home', teamsMap)}
                </span>
                <span
                  className="flex-shrink-0 text-xs font-extrabold font-orbitron px-2.5 py-1.5 rounded-xl shadow"
                  style={{
                    background: `linear-gradient(135deg, var(--tv-from), var(--tv-to))`,
                    color: 'var(--tv-text-inv)',
                  }}
                >
                  VS
                </span>
                <span
                  className="flex-1 text-left text-base font-bold truncate font-orbitron"
                  style={{ color: 'var(--tv-text)' }}
                >
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
