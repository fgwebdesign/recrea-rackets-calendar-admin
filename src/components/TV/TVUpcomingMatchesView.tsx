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

function getTeamName(match: Match, side: 'home' | 'away', teamsMap?: Map<string, string>): string {
  const team = side === 'home' ? match.home_team : match.away_team;
  if (team) return formatTeamFromObject(team);
  const id = side === 'home' ? match.home_team_id : match.away_team_id;
  if (id && teamsMap?.get(id)) return teamsMap.get(id)!;
  return 'TBD';
}

function formatTime(t?: string, day?: string): string {
  if (t) return t.slice(0, 5);
  if (day) return day;
  return '—';
}

interface TeamEntry {
  id?: string;
  team_id?: string;
  teams?: TeamInfo;
  team?: TeamInfo;
}

interface TVUpcomingMatchesViewProps {
  matches: Match[];
  teams?: TeamEntry[];
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

const CARD_ACCENTS = ['border-l-blue-500', 'border-l-emerald-500', 'border-l-amber-500', 'border-l-violet-500', 'border-l-rose-500', 'border-l-cyan-500'] as const;

export function TVUpcomingMatchesView({ matches, teams }: TVUpcomingMatchesViewProps) {
  const teamsMap = buildTeamsMap(teams);
  const scheduled = matches
    .filter((m) => m.status === 'scheduled' || m.status === 'in_progress')
    .sort((a, b) => {
      const ta = a.start_time || a.match_day || '';
      const tb = b.start_time || b.match_day || '';
      return ta.localeCompare(tb);
    })
    .slice(0, 12);

  if (scheduled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-slate-500">
        <p className="text-xl font-semibold">No hay partidos programados</p>
        <p className="text-sm mt-1">para esta categoría</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto [color-scheme:light]" style={{ color: '#0f172a' }}>
      <h2 className="text-xl font-bold text-center mb-8 font-orbitron tracking-wide" style={{ color: '#0f172a' }}>
        Próximos partidos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {scheduled.map((match, i) => (
          <div
            key={match.id}
            className={`rounded-2xl border-2 border-slate-200 border-l-4 ${CARD_ACCENTS[i % CARD_ACCENTS.length]} bg-white px-5 py-4 shadow-md hover:shadow-lg transition-shadow`}
            style={{ color: '#0f172a' }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-24 text-center rounded-xl bg-slate-200 py-2 px-3">
                <div className="text-2xl font-bold tabular-nums font-orbitron" style={{ color: '#1e3a8a' }}>
                  {formatTime(match.start_time, match.match_day)}
                </div>
                {match.court_name && (
                  <div className="text-xs font-bold mt-1" style={{ color: '#1e293b' }}>
                    {match.court_name}
                  </div>
                )}
              </div>
              <div className="flex-1 flex items-center gap-5 min-w-0">
                <div className="flex-1 text-right min-w-0">
                  <span className="text-lg font-bold truncate block" style={{ color: '#0f172a' }}>
                    {getTeamName(match, 'home', teamsMap)}
                  </span>
                </div>
                <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold font-orbitron shadow">
                  VS
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-lg font-bold truncate block" style={{ color: '#0f172a' }}>
                    {getTeamName(match, 'away', teamsMap)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
