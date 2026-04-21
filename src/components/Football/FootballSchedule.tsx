'use client'

import { useMemo, useState } from 'react'
import { FootballMatch, FootballTournamentPhase } from '@/types/footballLeague'
import { FootballMatchResultModal } from './FootballMatchResultModal'
import { CalendarDays, MapPin, CheckCircle2, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Misma lectura que en Supabase: fecha según calendario UTC del `match_date`,
 * hora según `time_slot` (canónico del fixture) o, si no hay slot, la hora UTC del timestamp.
 */
function formatMatchDateTime(match: FootballMatch): string {
  if (!match.match_date) return '—'
  const d = new Date(match.match_date)
  const datePart = d.toLocaleDateString('es-UY', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC'
  })
  const slot = match.time_slot?.trim()
  const timePart = slot
    ? `${slot}h`
    : d.toLocaleTimeString('es-UY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      })
  return `${datePart}, ${timePart}`
}

function groupMatchesByRound(matches: FootballMatch[]): [number, FootballMatch[]][] {
  const map = new Map<number, FootballMatch[]>()
  for (const m of matches) {
    const r = m.matchday_number
    if (!map.has(r)) map.set(r, [])
    map.get(r)!.push(m)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(
      ([r, arr]) =>
        [r, [...arr].sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0))] as [number, FootballMatch[]]
    )
}

type PhaseKey = 'apertura' | 'clausura' | 'single'

interface PhaseBlock {
  key: PhaseKey
  title: string
  subtitle?: string
  rounds: [number, FootballMatch[]][]
  accent: 'purple' | 'emerald'
}

function buildPhaseBlocks(
  rounds: [number, FootballMatch[]][],
  tournamentPhase: FootballTournamentPhase | undefined,
  teamSize: number | undefined
): PhaseBlock[] {
  const n = teamSize && teamSize >= 2 ? teamSize : 8
  const roundsPer = Math.max(n - 1, 1)
  const maxRound = rounds.length ? Math.max(...rounds.map(([r]) => r)) : 0

  if (!tournamentPhase) {
    return [{ key: 'single', title: 'Calendario', rounds, accent: 'purple' }]
  }
  if (tournamentPhase === 'Apertura') {
    return [{ key: 'single', title: 'Apertura', rounds, accent: 'purple' }]
  }
  if (tournamentPhase === 'Clausura') {
    return [{ key: 'single', title: 'Clausura', rounds, accent: 'emerald' }]
  }

  // Apertura + Clausura: si hay más de (n-1) fechas, segunda mitad = Clausura
  if (maxRound > roundsPer) {
    const aper = rounds.filter(([r]) => r <= roundsPer)
    const claus = rounds.filter(([r]) => r > roundsPer)
    const out: PhaseBlock[] = [
      {
        key: 'apertura',
        title: 'Apertura',
        subtitle: `Fechas 1 a ${roundsPer}`,
        rounds: aper,
        accent: 'purple'
      }
    ]
    if (claus.length > 0) {
      out.push({
        key: 'clausura',
        title: 'Clausura',
        subtitle: `Fechas ${roundsPer + 1} a ${maxRound}`,
        rounds: claus,
        accent: 'emerald'
      })
    }
    return out
  }

  return [
    {
      key: 'apertura',
      title: 'Apertura',
      subtitle:
        maxRound === roundsPer
          ? 'Fase de ida. Cuando el fixture incluya la vuelta, la Clausura aparecerá en una sección aparte.'
          : undefined,
      rounds,
      accent: 'purple'
    }
  ]
}

function MatchRow({
  match,
  onEdit,
  showRoundColumn
}: {
  match: FootballMatch
  onEdit: () => void
  showRoundColumn: boolean
}) {
  const done = match.status === 'COMPLETED'

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border transition-colors',
        done
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/50'
          : 'bg-white dark:bg-[#0E1629] border-slate-200 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-700/50 shadow-sm'
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showRoundColumn && (
          <div className="flex flex-col items-center min-w-[2rem] text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wide">F</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{match.matchday_number}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate text-right flex-1">
            {match.team1_label}
          </span>

          {done ? (
            <span className="text-base font-bold text-slate-900 dark:text-white shrink-0 bg-purple-100 dark:bg-purple-900/35 px-2.5 py-0.5 rounded-md tabular-nums">
              {match.home_goals} – {match.away_goals}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 px-1">vs</span>
          )}

          <span className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1">{match.team2_label}</span>
        </div>
      </div>

      <div className={cn('flex items-center gap-3 shrink-0', showRoundColumn && 'sm:pl-0 pl-11')}>
        <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span>{formatMatchDateTime(match)}</span>
          </div>
          {match.court && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{match.court.name}</span>
            </div>
          )}
        </div>

        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shadow-sm"
          >
            Cargar
          </button>
        )}
      </div>
    </div>
  )
}

function FechaBlock({
  roundNumber,
  matches,
  onEdit
}: {
  roundNumber: number
  matches: FootballMatch[]
  onEdit: (m: FootballMatch) => void
}) {
  const sampleDate = matches.find((m) => m.match_date)?.match_date
  const dateLine = sampleDate
    ? new Date(sampleDate).toLocaleDateString('es-UY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : null

  return (
    <Card className="border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden bg-white dark:bg-[#0E1629]/80">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/40 dark:to-[#0E1629] border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white text-sm font-bold shadow-sm">
              {roundNumber}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Fecha {roundNumber}</p>
              {dateLine && (
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{dateLine}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {matches.length} partido{matches.length !== 1 ? 's' : ''}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} onEdit={() => onEdit(m)} showRoundColumn={false} />
        ))}
      </CardContent>
    </Card>
  )
}

function PhaseSection({ block, onEdit }: { block: PhaseBlock; onEdit: (m: FootballMatch) => void }) {
  const border =
    block.accent === 'purple'
      ? 'border-l-purple-500 dark:border-l-purple-400'
      : 'border-l-emerald-500 dark:border-l-emerald-400'

  if (block.rounds.length === 0) return null

  return (
    <section className="space-y-4">
      <div className={cn('border-l-4 pl-4', border)}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          {block.title}
          <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:inline" />
        </h3>
        {block.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">{block.subtitle}</p>}
      </div>

      <div className="space-y-4 pl-0 sm:pl-1">
        {block.rounds.map(([round, ms]) => (
          <FechaBlock key={round} roundNumber={round} matches={ms} onEdit={onEdit} />
        ))}
      </div>
    </section>
  )
}

export function FootballSchedule({
  pending,
  completed,
  isLoading,
  onResultSaved,
  tournamentPhase,
  teamSize
}: {
  pending: FootballMatch[]
  completed: FootballMatch[]
  isLoading: boolean
  onResultSaved: () => void
  tournamentPhase?: FootballTournamentPhase
  teamSize?: number
}) {
  const [editing, setEditing] = useState<FootballMatch | null>(null)
  const [tab, setTab] = useState<'pending' | 'completed'>('pending')

  const shown = tab === 'pending' ? pending : completed

  const phaseBlocks = useMemo(
    () => buildPhaseBlocks(groupMatchesByRound(shown), tournamentPhase, teamSize),
    [shown, tournamentPhase, teamSize]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 w-fit">
        {(['pending', 'completed'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === t
                ? 'bg-white dark:bg-[#0E1629] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {t === 'pending' ? `Pendientes (${pending.length})` : `Jugados (${completed.length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Clock className="w-10 h-10 opacity-30" />
          <p className="text-sm">{tab === 'pending' ? 'No hay partidos pendientes' : 'No hay partidos jugados aún'}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {phaseBlocks.map((block) => (
            <PhaseSection key={`${tab}-${block.key}-${block.title}`} block={block} onEdit={setEditing} />
          ))}
        </div>
      )}

      {editing && (
        <FootballMatchResultModal
          match={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null)
            onResultSaved()
          }}
        />
      )}
    </div>
  )
}
