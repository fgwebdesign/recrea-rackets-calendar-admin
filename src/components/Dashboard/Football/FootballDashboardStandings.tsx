'use client'

import { useEffect, useState } from 'react'
import type { FootballLeague, FootballStanding } from '@/types/footballLeague'
import { FootballStandings } from '@/components/Football/FootballStandings'
import { getFootballStandings } from '@/services/footballLeagueService'

export function FootballDashboardStandings({ leagues, isLoading }: { leagues: FootballLeague[]; isLoading: boolean }) {
  const [leagueId, setLeagueId] = useState<string>('')
  const [standings, setStandings] = useState<FootballStanding[]>([])
  const [loadingStandings, setLoadingStandings] = useState(false)

  useEffect(() => {
    if (!isLoading && leagues.length > 0 && !leagueId) {
      setLeagueId(leagues[0].id)
    }
  }, [isLoading, leagues, leagueId])

  useEffect(() => {
    if (!leagueId) return
    let cancelled = false
    ;(async () => {
      setLoadingStandings(true)
      try {
        const data = await getFootballStandings(leagueId)
        if (!cancelled) setStandings(data.standings || [])
      } catch {
        if (!cancelled) setStandings([])
      } finally {
        if (!cancelled) setLoadingStandings(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [leagueId])

  if (isLoading) {
    return <div className="flex justify-center py-12 text-gray-500 text-sm">Cargando…</div>
  }

  if (!leagues.length) {
    return <p className="text-center text-gray-500 text-sm py-8">Creá una liga para ver la tabla de posiciones.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="football-dash-standings-league" className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
          Liga
        </label>
        <select
          id="football-dash-standings-league"
          className="w-full sm:max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
        >
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <FootballStandings standings={standings} isLoading={loadingStandings} />
    </div>
  )
}
