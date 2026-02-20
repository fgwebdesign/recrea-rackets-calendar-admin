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

const ROUND_LABELS: Record<string, string> = {
  quarter_final: 'Cuartos de final',
  semi_final: 'Semifinales',
  final: 'Final',
};

function getRoundLabel(round?: string): string {
  return round ? (ROUND_LABELS[round] || round) : 'Eliminatoria';
}

interface TeamEntry {
  id?: string;
  team_id?: string;
  teams?: TeamInfo;
  team?: TeamInfo;
}

interface TVBracketCrossesViewProps {
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

const ROUND_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  quarter_final: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-500 text-amber-900' },
  semi_final: { bg: 'bg-violet-50', border: 'border-violet-300', badge: 'bg-violet-500 text-white' },
  final: { bg: 'bg-rose-50', border: 'border-rose-300', badge: 'bg-rose-500 text-white' },
};

function getRoundStyle(round?: string) {
  return round ? ROUND_STYLES[round] ?? { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-500 text-white' } : { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-500 text-white' };
}

export function TVBracketCrossesView({ matches, teams }: TVBracketCrossesViewProps) {
  const teamsMap = buildTeamsMap(teams);
  const elimination = matches
    .filter((m) => m.round && m.round !== 'group')
    .filter((m) => m.status === 'scheduled' || m.status === 'pending' || m.status === 'in_progress')
    .sort((a, b) => {
      const order = ['quarter_final', 'semi_final', 'final'];
      const ia = order.indexOf(a.round || '');
      const ib = order.indexOf(b.round || '');
      return ia - ib;
    })
    .slice(0, 8);

  if (elimination.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-slate-500">
        <p className="text-xl font-semibold">No hay cruces eliminatorios</p>
        <p className="text-sm mt-1">pendientes en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 text-center mb-8 font-orbitron tracking-wide">Próximos cruces</h2>
      <div className="grid gap-4">
        {elimination.map((match) => {
          const style = getRoundStyle(match.round);
          return (
            <div
              key={match.id}
              className={`rounded-2xl border-2 ${style.border} ${style.bg} px-6 py-5 shadow-md text-slate-900`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold font-orbitron ${style.badge}`}>
                  {getRoundLabel(match.round)}
                </span>
                {match.start_time && (
                  <span className="text-slate-700 font-mono text-sm font-semibold">{match.start_time.slice(0, 5)}</span>
                )}
                {match.court_name && (
                  <span className="text-slate-600 text-sm font-medium">· {match.court_name}</span>
                )}
              </div>
              <div className="flex items-center gap-5">
                <div className="flex-1 text-right text-lg font-bold text-slate-900 truncate">
                  {getTeamName(match, 'home', teamsMap)}
                </div>
                <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold font-orbitron shadow">
                  VS
                </div>
                <div className="flex-1 text-left text-lg font-bold text-slate-900 truncate">
                  {getTeamName(match, 'away', teamsMap)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
