'use client'

import { useEffect, useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeagueStatsCard } from '@/components/Dashboard/LeagueStatsCard'
import { FootballDashboardSchedule } from '@/components/Dashboard/Football/FootballDashboardSchedule'
import { FootballDashboardRegistration } from '@/components/Dashboard/Football/FootballDashboardRegistration'
import { FootballDashboardStandings } from '@/components/Dashboard/Football/FootballDashboardStandings'
import { useFootballLeagues } from '@/hooks/useFootballLeagues'
import { getFootballDashboardSummary } from '@/services/footballLeagueService'

export function FootballDashboardPanel() {
  const { leagues, isLoading: loadingLeagues } = useFootballLeagues()
  const [summary, setSummary] = useState({
    activeLeagues: 0,
    enrolledTeams: 0,
    scheduledMatches: 0,
    completedMatches: 0
  })
  const [loadingSummary, setLoadingSummary] = useState(true)

  const [openStats, setOpenStats] = useState(true)
  const [openSchedule, setOpenSchedule] = useState(true)
  const [openReg, setOpenReg] = useState(true)
  const [openStandings, setOpenStandings] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await getFootballDashboardSummary()
        if (!cancelled) {
          setSummary({
            activeLeagues: s.activeLeagues ?? 0,
            enrolledTeams: s.enrolledTeams ?? 0,
            scheduledMatches: s.scheduledMatches ?? 0,
            completedMatches: s.completedMatches ?? 0
          })
        }
      } catch {
        if (!cancelled) setSummary({ activeLeagues: 0, enrolledTeams: 0, scheduledMatches: 0, completedMatches: 0 })
      } finally {
        if (!cancelled) setLoadingSummary(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [leagues.length])

  return (
    <div className="flex flex-col space-y-6">
      <Collapsible.Root open={openStats} onOpenChange={setOpenStats} className="w-full">
        <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <CardHeader
              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${openStats ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Estadísticas Fútbol</CardTitle>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openStats ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <LeagueStatsCard
                  title="Ligas activas"
                  value={loadingSummary ? 0 : summary.activeLeagues}
                  type="active"
                />
                <LeagueStatsCard
                  title="Inscripciones (equipos)"
                  value={loadingSummary ? 0 : summary.enrolledTeams}
                  type="teams"
                />
                <LeagueStatsCard
                  title="Partidos programados"
                  value={loadingSummary ? 0 : summary.scheduledMatches}
                  type="matches"
                />
                <LeagueStatsCard
                  title="Partidos jugados"
                  value={loadingSummary ? 0 : summary.completedMatches}
                  type="completed"
                />
              </div>
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      <Collapsible.Root open={openSchedule} onOpenChange={setOpenSchedule} className="w-full">
        <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <CardHeader
              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${openSchedule ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Próximos partidos</CardTitle>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openSchedule ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <CardContent className="p-0">
              <FootballDashboardSchedule />
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      <Collapsible.Root open={openReg} onOpenChange={setOpenReg} className="w-full">
        <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <CardHeader
              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${openReg ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Progreso de inscripciones</CardTitle>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openReg ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <CardContent className="p-6">
              <FootballDashboardRegistration leagues={leagues} isLoading={loadingLeagues} />
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      <Collapsible.Root open={openStandings} onOpenChange={setOpenStandings} className="w-full">
        <Card className="w-full bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <CardHeader
              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${openStandings ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Tabla de posiciones</CardTitle>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openStandings ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <CardContent className="p-6">
              <FootballDashboardStandings leagues={leagues} isLoading={loadingLeagues} />
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>
    </div>
  )
}
