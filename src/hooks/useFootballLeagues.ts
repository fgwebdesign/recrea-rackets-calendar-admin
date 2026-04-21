import { useState, useEffect, useCallback } from 'react'
import { FootballLeague } from '@/types/footballLeague'
import { getFootballLeagues } from '@/services/footballLeagueService'

export function useFootballLeagues() {
  const [leagues, setLeagues] = useState<FootballLeague[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getFootballLeagues(1, 50)
      setLeagues(data.leagues || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar las ligas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { leagues, isLoading, error, refetch: fetch }
}
