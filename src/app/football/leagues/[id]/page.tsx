'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import * as Collapsible from '@radix-ui/react-collapsible'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CalendarDays, CalendarRange, ChevronDown, Clock, DollarSign, Trophy } from 'lucide-react'
import { FootballLeagueHeader } from '@/components/Football/FootballLeagueHeader'
import { FootballTeams } from '@/components/Football/FootballTeams'
import { FootballSchedule } from '@/components/Football/FootballSchedule'
import { FootballStandings } from '@/components/Football/FootballStandings'
import { useFootballLeague, useFootballMatches, useGenerateFootballFixture } from '@/hooks/useFootballLeague'
import { useFootballStandings } from '@/hooks/useFootballStandings'
import type { FootballLeague } from '@/types/footballLeague'

function Section({
  title,
  open,
  onToggle,
  children
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Collapsible.Root open={open} onOpenChange={onToggle} className="w-full">
      <Card className="w-full overflow-hidden border-border/80 bg-card shadow-sm dark:border-gray-700/50 dark:bg-[#0E1629]">
        <Collapsible.Trigger asChild>
          <CardHeader
            className={`cursor-pointer transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.03] ${open ? 'border-b border-border/60 dark:border-gray-700/50' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-medium text-foreground">{title}</CardTitle>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <CardContent className="p-5 sm:p-6">{children}</CardContent>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  )
}

function footballFrequencyLabel(f: FootballLeague['frequency']) {
  return f === 'biweekly' ? 'Fixture quincenal' : 'Fixture semanal'
}

export default function FootballLeagueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leagueId = params.id as string

  const { league, isLoading, error, refetch: refetchLeague } = useFootballLeague(leagueId)
  const { completed, pending, isLoading: isLoadingMatches, hasMatches, refetch: refetchMatches } = useFootballMatches(leagueId)
  const { standings, isLoading: isLoadingStandings, refetch: refetchStandings } = useFootballStandings(leagueId)

  const { generate, isGenerating } = useGenerateFootballFixture(leagueId, () => {
    refetchMatches()
    refetchStandings()
    refetchLeague()
  })

  const [openTeams, setOpenTeams] = useState(true)
  const [openMatches, setOpenMatches] = useState(true)
  const [openInfo, setOpenInfo] = useState(true)
  const [openStandings, setOpenStandings] = useState(true)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center">
        <Card className="w-[300px] bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando liga...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !league) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-red-500">{error || 'Liga no encontrada'}</p>
            <button onClick={() => router.push('/football/leagues')} className="text-sm underline text-gray-500">
              Volver a ligas de fútbol
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120]">
      <FootballLeagueHeader league={league} onBack={() => router.push('/football/leagues')} />

      <main className="container mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Equipos */}
        <Section title="Equipos registrados" open={openTeams} onToggle={() => setOpenTeams((v) => !v)}>
          <FootballTeams
            teams={league.teams ?? []}
            maxTeams={league.team_size}
            leagueId={leagueId}
            hasGeneratedMatches={hasMatches}
            onUpdate={refetchLeague}
          />

          {(league.teams?.length ?? 0) >= 2 && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={generate}
                disabled={isGenerating || hasMatches}
                title={hasMatches ? 'Partidos ya generados' : 'Generar fixture round-robin'}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                {isGenerating ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Generando...</>
                ) : hasMatches ? (
                  <><Trophy className="w-5 h-5" /> Partidos generados</>
                ) : (
                  <><Trophy className="w-5 h-5" /> Generar fixture</>
                )}
              </button>
            </div>
          )}
        </Section>

        {/* Partidos */}
        <Section title="Partidos" open={openMatches} onToggle={() => setOpenMatches((v) => !v)}>
          <FootballSchedule
            pending={pending}
            completed={completed}
            isLoading={isLoadingMatches}
            onResultSaved={() => { refetchMatches(); refetchStandings() }}
            tournamentPhase={league.tournament_phase}
            teamSize={league.team_size}
            homeAwayFormat={league.home_away_format}
          />
        </Section>

        {/* Tabla de posiciones */}
        <Section title="Tabla de posiciones" open={openStandings} onToggle={() => setOpenStandings((v) => !v)}>
          <FootballStandings standings={standings} isLoading={isLoadingStandings} />
        </Section>

        {/* Información */}
        <Section title="Información de la liga" open={openInfo} onToggle={() => setOpenInfo((v) => !v)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-muted-foreground">Descripción</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {league.description?.trim() || 'Sin descripción.'}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                <p className="text-xs font-medium">Inscripción por equipo</p>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">${league.inscription_cost}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <p className="text-xs font-medium">Calendario</p>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                {new Date(league.start_date.replace('Z', '')).toLocaleDateString('es-UY', {
                  timeZone: 'UTC',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}{' '}
                <span className="text-muted-foreground">→</span>{' '}
                {new Date(league.end_date.replace('Z', '')).toLocaleDateString('es-UY', {
                  timeZone: 'UTC',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{footballFrequencyLabel(league.frequency)}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" />
                <p className="text-xs font-medium">Fase / formato</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{league.tournament_phase}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5" />
                  <p className="text-xs font-medium">Puntuación (fútbol)</p>
                </div>
                <p className="text-xs text-muted-foreground">Desempate: diferencia de goles, luego goles a favor</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: 'Victoria', pts: 3 },
                  { label: 'Empate', pts: 1 },
                  { label: 'Derrota', pts: 0 }
                ].map((row) => (
                  <span
                    key={row.label}
                    className="inline-flex items-baseline gap-2 rounded-lg border border-border/80 bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold tabular-nums">{row.pts} pts</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <p className="text-xs font-medium">Franja horaria de partidos</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(league.time_slots || []).length ? (
                  (league.time_slots || []).map((slot) => (
                    <span
                      key={slot}
                      className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground"
                    >
                      {slot}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Sin horarios definidos</span>
                )}
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  )
}
