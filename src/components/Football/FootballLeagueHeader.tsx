'use client'

import Image from 'next/image'
import { ArrowLeft, CalendarDays, Users } from 'lucide-react'
import { FootballLeague } from '@/types/footballLeague'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  Inscribiendo: 'bg-white/10 text-amber-100 ring-1 ring-white/15',
  Activa: 'bg-white/10 text-emerald-100 ring-1 ring-white/15',
  Finalizada: 'bg-white/10 text-slate-200 ring-1 ring-white/15'
}

function fmt(date: string) {
  return new Date(date.replace('Z', '')).toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function metaLine(league: FootballLeague) {
  const phase = league.tournament_phase
  const freq = league.frequency === 'biweekly' ? 'Quincenal' : 'Semanal'
  const slots = (league.time_slots || []).filter(Boolean).join(' · ')
  const parts = [`${phase}`, freq]
  if (slots) parts.push(slots)
  return parts.join(' · ')
}

export function FootballLeagueHeader({
  league,
  onBack
}: {
  league: FootballLeague
  onBack: () => void
}) {
  const teams = league.registeredTeams ?? 0
  const meta = metaLine(league)

  return (
    <header className="border-b border-emerald-900/20 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white">
      <div className="container mx-auto max-w-6xl px-4 py-5 md:py-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-sm md:h-16 md:w-16">
              {league.image_url ? (
                <Image
                  src={league.image_url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/40">⚽</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[11px] font-medium text-white/50">Liga de fútbol</p>
              <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-2xl">{league.name}</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/65">{meta}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-col md:items-end md:gap-2">
            <span
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium',
                STATUS_STYLES[league.status] ?? STATUS_STYLES.Inscribiendo
              )}
            >
              {league.status}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-black/15 px-2.5 py-1 ring-1 ring-white/10">
                <Users className="h-3.5 w-3.5 opacity-80" />
                {teams}/{league.team_size} equipos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-black/15 px-2.5 py-1 ring-1 ring-white/10">
                <CalendarDays className="h-3.5 w-3.5 opacity-80" />
                {fmt(league.start_date)} — {fmt(league.end_date)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
