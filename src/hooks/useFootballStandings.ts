import { useState, useEffect, useCallback } from 'react'
import { FootballStanding } from '@/types/footballLeague'
import { getFootballStandings } from '@/services/footballLeagueService'

export function useFootballStandings(leagueId: string) {
  const [standings, setStandings] = useState<FootballStanding[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!leagueId) return
    setIsLoading(true)
    try {
      const data = await getFootballStandings(leagueId)
      setStandings(data.standings || [])
    } catch {
      setStandings([])
    } finally {
      setIsLoading(false)
    }
  }, [leagueId])

  useEffect(() => { fetch() }, [fetch])

  return { standings, isLoading, refetch: fetch }
}
