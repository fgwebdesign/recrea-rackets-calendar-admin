'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import * as Collapsible from '@radix-ui/react-collapsible'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChevronDown, Trophy } from 'lucide-react'
import { FootballLeagueHeader } from '@/components/Football/FootballLeagueHeader'
import { FootballTeams } from '@/components/Football/FootballTeams'
import { FootballSchedule } from '@/components/Football/FootballSchedule'
import { FootballStandings } from '@/components/Football/FootballStandings'
import { useFootballLeague, useFootballMatches, useGenerateFootballFixture } from '@/hooks/useFootballLeague'
import { useFootballStandings } from '@/hooks/useFootballStandings'
import { CalendarDays, DollarSign, Clock } from 'lucide-react'

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
      <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <Collapsible.Trigger asChild>
          <CardHeader className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${open ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <CardContent className="p-6">{children}</CardContent>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  )
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
        <Section title="Equipos Registrados" open={openTeams} onToggle={() => setOpenTeams((v) => !v)}>
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
          />
        </Section>

        {/* Tabla de posiciones */}
        <Section title="Tabla de Posiciones" open={openStandings} onToggle={() => setOpenStandings((v) => !v)}>
          <FootballStandings standings={standings} isLoading={isLoadingStandings} />
        </Section>

        {/* Información */}
        <Section title="Información de la Liga" open={openInfo} onToggle={() => setOpenInfo((v) => !v)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Descripción</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{league.description || '—'}</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase">Inscripción</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${league.inscription_cost}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CalendarDays className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase">Fechas</p>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {new Date(league.start_date.replace('Z', '')).toLocaleDateString('es-UY', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
                {' → '}
                {new Date(league.end_date.replace('Z', '')).toLocaleDateString('es-UY', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Todos los sábados</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 space-y-2 md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Trophy className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase">Sistema de puntos</p>
              </div>
              <div className="flex gap-4 flex-wrap">
                {[{ label: 'Victoria', value: 3 }, { label: 'Empate', value: 1 }, { label: 'Derrota', value: 0 }].map((item) => (
                  <div key={item.label} className="bg-white dark:bg-purple-900/30 rounded-lg px-5 py-3 text-center min-w-[80px]">
                    <p className="text-xs text-purple-500 dark:text-purple-400">{item.label}</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{item.value}</p>
                    <p className="text-xs text-purple-400">pts</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                Desempate: diferencia de goles → goles a favor
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Clock className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase">Horarios</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(league.time_slots || []).map((slot) => (
                  <span key={slot} className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-medium">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  )
}
