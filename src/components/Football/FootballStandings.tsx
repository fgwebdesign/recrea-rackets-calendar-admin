'use client'

import Image from 'next/image'
import { HelpCircle, Users } from 'lucide-react'
import { FootballStanding } from '@/types/footballLeague'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function teamLabel(s: FootballStanding) {
  const t = s.team
  if (!t) return '—'
  if (t.display_name?.trim()) return t.display_name.trim()
  const p1 = t.player1 ? `${t.player1.first_name} ${t.player1.last_name}` : ''
  const p2 = t.player2 ? `${t.player2.first_name} ${t.player2.last_name}` : ''
  return [p1, p2].filter(Boolean).join(' / ') || '—'
}

const HEADER_CELL =
  'px-2 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white/95 sm:px-3 sm:text-xs'

function HeaderTip({ label, title }: { label: string; title: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex cursor-default items-center justify-center gap-0.5 border-b border-dotted border-white/35 pb-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
        >
          {label}
          <HelpCircle className="hidden h-3 w-3 shrink-0 opacity-70 sm:inline" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] border border-border bg-popover text-popover-foreground shadow-md">
        <p className="font-medium">{title}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function FootballStandings({
  standings,
  isLoading
}: {
  standings: FootballStanding[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-600" />
      </div>
    )
  }

  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 py-14 text-center text-muted-foreground">
        <p className="text-sm">La tabla aparecerá cuando haya resultados cargados en la liga.</p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm dark:border-gray-700/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white shadow-inner">
                <th className="w-10 px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider sm:w-12 sm:px-4 sm:text-xs">
                  #
                </th>
                <th className="min-w-[160px] px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider sm:px-4 sm:text-xs">
                  Equipo
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="PJ" title="Partidos jugados" />
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="PG" title="Partidos ganados (3 pts)" />
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="PE" title="Partidos empatados (1 pt)" />
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="PP" title="Partidos perdidos (0 pts)" />
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="GF" title="Goles a favor" />
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="GC" title="Goles en contra" />
                </th>
                <th className={HEADER_CELL}>
                  <HeaderTip label="DIF" title="Diferencia de goles (GF − GC)" />
                </th>
                <th className="px-2 py-3.5 text-center sm:px-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="inline-flex cursor-default items-center justify-center gap-0.5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-100 ring-1 ring-white/20 sm:text-xs"
                      >
                        PTS
                        <HelpCircle className="hidden h-3 w-3 sm:inline" aria-hidden />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] border border-border bg-popover text-popover-foreground shadow-md">
                      <p className="font-medium">Puntos totales en la tabla (victoria, empate, derrota).</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const pos = i + 1
                const isTop3 = pos <= 3
                const img = s.team?.image_url?.trim()
                const name = teamLabel(s)
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      'border-t border-border/60 transition-colors',
                      isTop3
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/25'
                        : 'bg-background hover:bg-muted/40 dark:bg-[#0f1624] dark:hover:bg-white/[0.04]'
                    )}
                  >
                    <td className="px-3 py-3.5 tabular-nums text-sm font-bold text-muted-foreground sm:px-4">{pos}</td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <div className="flex min-w-0 max-w-[220px] items-center gap-3 sm:max-w-[280px]">
                        <div
                          className={cn(
                            'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted shadow-sm',
                            isTop3 ? 'border-emerald-200/80 dark:border-emerald-800/50' : 'border-border/80'
                          )}
                        >
                          {img ? (
                            <Image src={img} alt="" fill unoptimized className="object-contain p-0.5" sizes="40px" />
                          ) : (
                            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                          )}
                        </div>
                        <span className="truncate font-semibold text-foreground" title={name}>
                          {name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 text-center tabular-nums text-muted-foreground sm:px-3">
                      {s.pj ?? s.matches_played}
                    </td>
                    <td className="px-2 py-3.5 text-center tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 sm:px-3">
                      {s.pg ?? s.wins}
                    </td>
                    <td className="px-2 py-3.5 text-center tabular-nums font-semibold text-amber-600 dark:text-amber-400 sm:px-3">
                      {s.pe ?? s.draws}
                    </td>
                    <td className="px-2 py-3.5 text-center tabular-nums font-semibold text-red-600 dark:text-red-400 sm:px-3">
                      {s.pp ?? s.losses}
                    </td>
                    <td className="px-2 py-3.5 text-center tabular-nums text-foreground/90 sm:px-3">{s.gf ?? s.goals_for}</td>
                    <td className="px-2 py-3.5 text-center tabular-nums text-foreground/90 sm:px-3">{s.gc ?? s.goals_against}</td>
                    <td
                      className={cn(
                        'px-2 py-3.5 text-center tabular-nums font-semibold sm:px-3',
                        (s.dif ?? s.goal_difference) > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : (s.dif ?? s.goal_difference) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                      )}
                    >
                      {(s.dif ?? s.goal_difference) > 0 ? '+' : ''}
                      {s.dif ?? s.goal_difference}
                    </td>
                    <td className="px-2 py-3 text-center sm:px-3">
                      <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 px-2 text-sm font-bold text-white shadow-sm tabular-nums">
                        {s.pts ?? s.points}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/60 bg-muted/30 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground dark:bg-white/[0.02]">
          <span className="font-medium text-foreground/80">Desempate:</span> diferencia de goles → goles a favor.
        </p>
      </div>
    </TooltipProvider>
  )
}
