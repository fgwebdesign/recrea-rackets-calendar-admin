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

function formatPlayerNames(teamInfo: { player1?: string; player2?: string } | null | undefined): string {
  if (!teamInfo) return '—';
  const n1 = String(teamInfo.player1 || '').trim();
  const n2 = String(teamInfo.player2 || '').trim();
  if (n1 && n2) return `${n1} / ${n2}`;
  return n1 || n2 || '—';
}

const GROUP_COLORS = [
  { card: 'bg-blue-50 border-blue-200', header: 'bg-blue-500 text-white', pos1: 'bg-amber-400 text-amber-900', pos2: 'bg-slate-300 text-slate-800', pos3: 'bg-amber-700 text-amber-100', posRest: 'bg-slate-100 text-slate-700', pts: 'bg-blue-500 text-white' },
  { card: 'bg-emerald-50 border-emerald-200', header: 'bg-emerald-500 text-white', pos1: 'bg-amber-400 text-amber-900', pos2: 'bg-slate-300 text-slate-800', pos3: 'bg-amber-700 text-amber-100', posRest: 'bg-slate-100 text-slate-700', pts: 'bg-emerald-500 text-white' },
  { card: 'bg-amber-50 border-amber-200', header: 'bg-amber-500 text-amber-900', pos1: 'bg-amber-400 text-amber-900', pos2: 'bg-slate-300 text-slate-800', pos3: 'bg-amber-700 text-amber-100', posRest: 'bg-slate-100 text-slate-700', pts: 'bg-amber-500 text-amber-900' },
  { card: 'bg-violet-50 border-violet-200', header: 'bg-violet-500 text-white', pos1: 'bg-amber-400 text-amber-900', pos2: 'bg-slate-300 text-slate-800', pos3: 'bg-amber-700 text-amber-100', posRest: 'bg-slate-100 text-slate-700', pts: 'bg-violet-500 text-white' },
] as const;

function getPositionStyle(position: number, colors: (typeof GROUP_COLORS)[number]): string {
  switch (position) {
    case 1: return colors.pos1;
    case 2: return colors.pos2;
    case 3: return colors.pos3;
    default: return colors.posRest;
  }
}

interface TVStandingsViewProps {
  standings: Record<string, GroupData> | null;
}

export function TVStandingsView({ standings }: TVStandingsViewProps) {
  if (!standings || Object.keys(standings).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-slate-500">
        <p className="text-xl font-semibold">No hay clasificaciones</p>
        <p className="text-sm mt-1">para esta categoría</p>
      </div>
    );
  }

  const entries = Object.entries(standings).slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      {entries.map(([, group], idx) => {
        const colors = GROUP_COLORS[idx % GROUP_COLORS.length];
        return (
          <div
            key={group.group_number}
            className={`rounded-2xl border-2 ${colors.card} overflow-hidden shadow-md`}
          >
            <div className={`px-6 py-4 flex items-center justify-between ${colors.header} font-orbitron font-bold`}>
              <span className="text-lg tracking-wide">Grupo {group.group_number}</span>
              <span className="text-sm opacity-90">{group.teams.length} equipos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">Pos</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">Equipo</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">PJ</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">PG</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">PP</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">Sets</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 font-orbitron">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.teams.map((team) => (
                    <tr key={team.team_id} className="border-b border-slate-100 last:border-0 hover:bg-white/60">
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums ${getPositionStyle(team.position, colors)} font-orbitron`}>
                          {team.position}°
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0 font-orbitron">
                            {formatPlayerNames(team.team_info).charAt(0) || '?'}
                          </div>
                          <span className="text-base font-semibold text-slate-900 truncate max-w-[200px]">
                            {formatPlayerNames(team.team_info)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-base text-slate-800 tabular-nums font-medium">{team.matches_played}</td>
                      <td className="px-3 py-4 text-center text-base text-emerald-600 font-bold tabular-nums">{team.matches_won}</td>
                      <td className="px-3 py-4 text-center text-base text-rose-600 font-bold tabular-nums">{team.matches_lost}</td>
                      <td className="px-3 py-4 text-center text-base text-slate-800 tabular-nums font-medium">{team.sets_won}-{team.sets_lost}</td>
                      <td className="px-3 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm tabular-nums ${colors.pts} font-orbitron`}>
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
