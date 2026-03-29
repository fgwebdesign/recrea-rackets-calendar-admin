'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeftRight, Loader2, CheckCircle, Clock, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999'

interface MatchSlot {
  id: string
  group_number: number
  match_number: number
  tournament_day: number | null
  start_time: string | null
  court_id: string | null
  court_name?: string
  home_label?: string
  away_label?: string
}

interface MatchSwapperProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  tournamentId: string
  /** Partido pre-seleccionado como match1 (viene del botón de cada fila) */
  preSelectedMatch?: MatchSlot
  /** Lista de partidos con slot completo para elegir match2 */
  scheduledMatches: MatchSlot[]
}

function slotLabel(m: MatchSlot) {
  const time = m.start_time ? m.start_time.slice(0, 5) : '??:??'
  const court = m.court_name || m.court_id?.slice(-6) || '???'
  return `Día ${m.tournament_day} · ${time} · ${court}`
}

function matchLabel(m: MatchSlot) {
  const home = m.home_label || `Equipo ${m.home_label}`
  const away = m.away_label || `Equipo ${m.away_label}`
  return `G${m.group_number}-P${m.match_number}${home && away ? `: ${home} vs ${away}` : ''}`
}

export function MatchSwapper({
  open, onClose, onSuccess, tournamentId, preSelectedMatch, scheduledMatches
}: MatchSwapperProps) {
  const [match1, setMatch1] = useState<MatchSlot | null>(preSelectedMatch || null)
  const [match2, setMatch2] = useState<MatchSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<{ match1_into_match2_slot: unknown[]; match2_into_match1_slot: unknown[] } | null>(null)
  const { toast } = useToast()

  const availableForMatch2 = scheduledMatches.filter(
    m => m.id !== match1?.id && m.tournament_day && m.start_time && m.court_id
  )

  const handleSwap = async () => {
    if (!match1 || !match2) return
    setLoading(true)
    setError(null)
    setConflicts(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
      const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ match1_id: match1.id, match2_id: match2.id })
      })
      const data = await res.json()

      if (res.status === 409) {
        setConflicts(data.conflicts)
        setError(data.message)
        return
      }
      if (!res.ok) {
        setError(data.message || 'Error al realizar el swap')
        return
      }

      toast({
        title: '✅ Swap realizado',
        description: `G${match1.group_number}-P${match1.match_number} ↔ G${match2.group_number}-P${match2.match_number} intercambiados.`
      })
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMatch1(preSelectedMatch || null)
      setMatch2(null)
      setError(null)
      setConflicts(null)
      onClose()
    }
  }

  const hasFullSlot = (m: MatchSlot | null) => !!(m?.tournament_day && m?.start_time && m?.court_id)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-500" />
            Intercambiar slots de dos partidos
          </DialogTitle>
          <DialogDescription>
            Los slots (día, hora y cancha) de los dos partidos se intercambian en una operación atómica.
            El sistema verifica que no haya conflictos con otros partidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Partido 1 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Partido A</p>
            {match1 ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{matchLabel(match1)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />{slotLabel(match1)}
                  </p>
                </div>
                {!preSelectedMatch && (
                  <Button size="sm" variant="ghost" onClick={() => { setMatch1(null); setMatch2(null) }} className="h-7 text-xs">
                    Cambiar
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {scheduledMatches.filter(m => hasFullSlot(m)).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMatch1(m)}
                    className="text-left rounded-lg border border-border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-3 py-2 transition-colors"
                  >
                    <p className="text-sm font-medium">{matchLabel(m)}</p>
                    <p className="text-xs text-muted-foreground">{slotLabel(m)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flecha swap */}
          {match1 && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-px flex-1 bg-border w-16" />
                <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                <div className="h-px flex-1 bg-border w-16" />
              </div>
            </div>
          )}

          {/* Partido 2 */}
          {match1 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Partido B</p>
              {match2 ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{matchLabel(match2)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{slotLabel(match2)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setMatch2(null)} className="h-7 text-xs">
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableForMatch2.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay otros partidos con slot completo</p>
                  ) : (
                    availableForMatch2.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMatch2(m)}
                        className="text-left rounded-lg border border-border hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-3 py-2 transition-colors"
                      >
                        <p className="text-sm font-medium">{matchLabel(m)}</p>
                        <p className="text-xs text-muted-foreground">{slotLabel(m)}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview del swap */}
          {match1 && match2 && !error && (
            <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Resultado del swap</p>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">G{match1.group_number}-P{match1.match_number}</span>
                  <span className="text-muted-foreground"> → </span>
                  <Badge variant="outline" className="text-xs">{slotLabel(match2)}</Badge>
                </p>
                <p>
                  <span className="font-medium">G{match2.group_number}-P{match2.match_number}</span>
                  <span className="text-muted-foreground"> → </span>
                  <Badge variant="outline" className="text-xs">{slotLabel(match1)}</Badge>
                </p>
              </div>
            </div>
          )}

          {/* Error / Conflictos */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                {error}
                {conflicts && (
                  <ul className="mt-1.5 list-disc pl-4 text-xs space-y-0.5">
                    {conflicts.match1_into_match2_slot.map((c: unknown, i) => (
                      <li key={`c1-${i}`}>Conflicto en slot B: partido {(c as { match_id?: string }).match_id?.slice(-6) || '?'}</li>
                    ))}
                    {conflicts.match2_into_match1_slot.map((c: unknown, i) => (
                      <li key={`c2-${i}`}>Conflicto en slot A: partido {(c as { match_id?: string }).match_id?.slice(-6) || '?'}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSwap}
            disabled={!match1 || !match2 || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Intercambiando...</>
              : <><ArrowLeftRight className="w-4 h-4 mr-2" />Confirmar swap</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
