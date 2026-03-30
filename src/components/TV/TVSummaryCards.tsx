'use client';

interface TVSummaryCardsProps {
  tournamentName: string;
  teamsCount: number;
  upcomingMatchesCount: number;
  groupsCount: number;
}

const STATS = [
  { key: 'teams',   label: 'EQUIPOS',          gVar: '--tv-g1' },
  { key: 'matches', label: 'PRÓXIMOS',          gVar: '--tv-g2' },
  { key: 'groups',  label: 'GRUPOS',            gVar: '--tv-g3' },
] as const;

export function TVSummaryCards({ tournamentName, teamsCount, upcomingMatchesCount, groupsCount }: TVSummaryCardsProps) {
  const values = { teams: teamsCount, matches: upcomingMatchesCount, groups: groupsCount };

  return (
    <div
      className="flex-shrink-0 flex items-stretch gap-3 mb-3"
      style={{ height: '5rem' }}
    >
      {/* Category name — grows */}
      <div
        className="flex-1 flex flex-col justify-center px-5 rounded-2xl min-w-0"
        style={{
          background: `color-mix(in srgb, var(--tv-accent) 12%, var(--tv-surface))`,
          border: `1.5px solid color-mix(in srgb, var(--tv-accent) 28%, transparent)`,
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest font-orbitron mb-0.5"
          style={{ color: 'var(--tv-accent)' }}
        >
          Categoría
        </p>
        <p
          className="text-lg sm:text-xl font-extrabold leading-tight truncate font-orbitron"
          style={{ color: 'var(--tv-text)' }}
        >
          {tournamentName}
        </p>
      </div>

      {/* Stat cards — fixed width */}
      {STATS.map(({ key, label, gVar }) => (
        <div
          key={key}
          className="flex-shrink-0 flex flex-col justify-center items-center px-5 rounded-2xl"
          style={{
            minWidth: '7rem',
            background: `color-mix(in srgb, var(${gVar}) 12%, var(--tv-surface))`,
            border: `1.5px solid color-mix(in srgb, var(${gVar}) 30%, transparent)`,
          }}
        >
          <p
            className="text-[0.6rem] font-bold uppercase tracking-widest font-orbitron"
            style={{ color: `var(${gVar})` }}
          >
            {label}
          </p>
          <p
            className="text-4xl font-extrabold tabular-nums font-orbitron leading-none mt-0.5"
            style={{ color: `var(${gVar})` }}
          >
            {values[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
