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

const STAT_CARDS = [
  { label: 'Equipos inscritos', valueClass: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-200' },
  { label: 'Clasificados', valueClass: 'text-emerald-900', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { label: 'Formato', valueClass: 'text-violet-900', bg: 'bg-violet-50', border: 'border-violet-200' },
] as const;

export function TVTeamsView({ teams, classificationSummary }: TVTeamsViewProps) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-slate-500">
        <p className="text-xl font-semibold">No hay equipos inscritos</p>
        <p className="text-sm mt-1">en esta categoría</p>
      </div>
    );
  }

  const formatLabel = classificationSummary?.format || '';
  const qualifiedCount = classificationSummary?.qualified_teams?.length ?? 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <div className={`rounded-2xl border-2 ${STAT_CARDS[0].border} ${STAT_CARDS[0].bg} px-8 py-5 shadow-md min-w-[140px]`}>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800 font-orbitron">Equipos inscritos</p>
          <p className={`text-4xl font-bold tabular-nums ${STAT_CARDS[0].valueClass} font-orbitron mt-1`}>{teams.length}</p>
        </div>
        {qualifiedCount > 0 && (
          <div className={`rounded-2xl border-2 ${STAT_CARDS[1].border} ${STAT_CARDS[1].bg} px-8 py-5 shadow-md min-w-[140px]`}>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-orbitron">Clasificados</p>
            <p className={`text-4xl font-bold tabular-nums ${STAT_CARDS[1].valueClass} font-orbitron mt-1`}>{qualifiedCount}</p>
          </div>
        )}
        {formatLabel && (
          <div className={`rounded-2xl border-2 ${STAT_CARDS[2].border} ${STAT_CARDS[2].bg} px-8 py-5 shadow-md`}>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-800 font-orbitron">Formato</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatLabel}</p>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-slate-800 text-center mb-6 font-orbitron tracking-wide">Lista de equipos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.slice(0, 24).map((team, i) => (
          <div
            key={team.id}
            className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 font-orbitron shadow">
              {(i + 1).toString().padStart(2, '0')}
            </div>
            <span className="text-base font-semibold text-slate-900 truncate">{formatTeamName(team)}</span>
          </div>
        ))}
      </div>
      {teams.length > 24 && (
        <p className="text-center text-slate-500 text-sm mt-5 font-medium">y {teams.length - 24} equipos más</p>
      )}
    </div>
  );
}
