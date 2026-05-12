'use client'

import { useEffect, useState } from 'react'
import type { FootballLeague, FootballStanding } from '@/types/footballLeague'
import { FootballStandings } from '@/components/Football/FootballStandings'
import { getFootballStandings } from '@/services/footballLeagueService'

/** Tabla del primer liga de la lista (sin selector en dashboard). */
export function FootballDashboardStandings({ leagues, isLoading }: { leagues: FootballLeague[]; isLoading: boolean }) {
  const primaryLeagueId = leagues[0]?.id ?? ''
  const [standings, setStandings] = useState<FootballStanding[]>([])
  const [loadingStandings, setLoadingStandings] = useState(false)

  useEffect(() => {
    if (!primaryLeagueId) return
    let cancelled = false
    ;(async () => {
      setLoadingStandings(true)
      try {
        const data = await getFootballStandings(primaryLeagueId)
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
  }, [primaryLeagueId])

  if (isLoading) {
    return <div className="flex justify-center py-12 text-gray-500 text-sm">Cargando…</div>
  }

  if (!leagues.length) {
    return <p className="text-center text-gray-500 text-sm py-8">Creá una liga para ver la tabla de posiciones.</p>
  }

  return <FootballStandings standings={standings} isLoading={loadingStandings} />
}
