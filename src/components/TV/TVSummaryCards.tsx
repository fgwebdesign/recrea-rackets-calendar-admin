'use client';

interface TVSummaryCardsProps {
  tournamentName: string;
  teamsCount: number;
  upcomingMatchesCount: number;
  groupsCount: number;
}

const CARD_STYLES = [
  { light: 'bg-blue-50', border: 'border-blue-200', label: 'text-blue-800', number: 'text-blue-900' },
  { light: 'bg-emerald-50', border: 'border-emerald-200', label: 'text-emerald-800', number: 'text-emerald-900' },
  { light: 'bg-amber-50', border: 'border-amber-200', label: 'text-amber-800', number: 'text-amber-900' },
  { light: 'bg-violet-50', border: 'border-violet-200', label: 'text-violet-800', number: 'text-violet-900' },
] as const;

export function TVSummaryCards({ tournamentName, teamsCount, upcomingMatchesCount, groupsCount }: TVSummaryCardsProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 font-orbitron">Categoría</p>
        <p className="text-lg sm:text-xl font-bold text-slate-900 truncate mt-0.5">{tournamentName}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`rounded-2xl border-2 ${CARD_STYLES[0].border} ${CARD_STYLES[0].light} px-5 py-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${CARD_STYLES[0].label} font-orbitron`}>Equipos</p>
          <p className={`text-3xl font-bold tabular-nums ${CARD_STYLES[0].number} font-orbitron mt-1`}>{teamsCount}</p>
        </div>
        <div className={`rounded-2xl border-2 ${CARD_STYLES[1].border} ${CARD_STYLES[1].light} px-5 py-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${CARD_STYLES[1].label} font-orbitron`}>Próximos partidos</p>
          <p className={`text-3xl font-bold tabular-nums ${CARD_STYLES[1].number} font-orbitron mt-1`}>{upcomingMatchesCount}</p>
        </div>
        <div className={`rounded-2xl border-2 ${CARD_STYLES[2].border} ${CARD_STYLES[2].light} px-5 py-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${CARD_STYLES[2].label} font-orbitron`}>Grupos</p>
          <p className={`text-3xl font-bold tabular-nums ${CARD_STYLES[2].number} font-orbitron mt-1`}>{groupsCount}</p>
        </div>
        <div className={`rounded-2xl border-2 ${CARD_STYLES[3].border} ${CARD_STYLES[3].light} px-5 py-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${CARD_STYLES[3].label} font-orbitron`}>Resumen</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">Pantalla TV</p>
        </div>
      </div>
    </div>
  );
}
