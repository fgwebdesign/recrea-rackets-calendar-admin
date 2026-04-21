import { useState, useEffect, useCallback } from 'react'
import { FootballLeague, FootballMatch } from '@/types/footballLeague'
import { getFootballLeagueById, getFootballMatchesByLeague, generateFootballFixture } from '@/services/footballLeagueService'
import { toast } from '@/components/ui/use-toast'

export function useFootballLeague(leagueId: string) {
  const [league, setLeague] = useState<FootballLeague | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!leagueId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getFootballLeagueById(leagueId)
      setLeague(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la liga')
    } finally {
      setIsLoading(false)
    }
  }, [leagueId])

  useEffect(() => { fetch() }, [fetch])

  return { league, isLoading, error, refetch: fetch }
}

export function useFootballMatches(leagueId: string) {
  const [completed, setCompleted] = useState<FootballMatch[]>([])
  const [pending, setPending] = useState<FootballMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!leagueId) return
    setIsLoading(true)
    try {
      const data = await getFootballMatchesByLeague(leagueId)
      setCompleted(data.completed || [])
      setPending(data.pending || [])
    } catch {
      // silencioso — la UI muestra estado vacío
    } finally {
      setIsLoading(false)
    }
  }, [leagueId])

  useEffect(() => { fetch() }, [fetch])

  return { completed, pending, isLoading, hasMatches: completed.length + pending.length > 0, refetch: fetch }
}

export function useGenerateFootballFixture(leagueId: string, onSuccess: () => void) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async () => {
    setIsGenerating(true)
    try {
      await generateFootballFixture(leagueId)
      toast({ title: 'Fixture generado', description: 'Los partidos fueron creados exitosamente' })
      onSuccess()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al generar el fixture',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating }
}
