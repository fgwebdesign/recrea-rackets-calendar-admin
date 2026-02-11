'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Match {
  id: string
  group_number: number
  match_number: number
  tournament_day: number | null
  start_time: string | null
  court_id: string | null
  home_team: {
    id?: string
    team_id?: string
    team_name?: string
    players?: string[] | {
      player1?: { first_name?: string; last_name?: string }
      player2?: { first_name?: string; last_name?: string }
    }
  } | null
  away_team: {
    id?: string
    team_id?: string
    team_name?: string
    players?: string[] | {
      player1?: { first_name?: string; last_name?: string }
      player2?: { first_name?: string; last_name?: string }
    }
  } | null
}

/** Una opción concreta: Día + Franja + Hora + Cancha (un solo clic para asignar) */
export interface AssignableOption {
  tournament_day: number
  start_time: string
  court_id: string
  court_name: string
  franja_label: string
}

/** Partido del mismo grupo ya programado (contexto para mostrar horarios cercanos) */
export interface GroupScheduledMatch {
  match_number: number
  tournament_day: number
  start_time: string
  court_id: string
  court_name: string
  franja_label: string
}

interface MatchReschedulerProps {
  tournamentId: string
  match: Match | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function MatchRescheduler({
  tournamentId,
  match,
  isOpen,
  onClose,
  onSuccess
}: MatchReschedulerProps) {
  const [options, setOptions] = useState<AssignableOption[]>([])
  const [groupScheduledMatches, setGroupScheduledMatches] = useState<GroupScheduledMatch[]>([])
  const [selectedOption, setSelectedOption] = useState<AssignableOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar solo opciones válidas para este partido (franjas sin restricciones + slots libres)
  useEffect(() => {
    if (!isOpen || !tournamentId || !match?.id) return

    setSelectedOption(null)
    setError(null)

    const load = async () => {
      setLoadingSlots(true)
      try {
        const token = localStorage.getItem('adminToken')
        if (!token) throw new Error('No hay token de autenticación disponible')

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${match.id}/available-slots`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.message || 'Error al cargar horarios')
        }

        const data = await response.json()
        const opts: AssignableOption[] = (data.options || []).map((o: { tournament_day: number; start_time: string; court_id: string; court_name: string; franja_label: string }) => ({
          tournament_day: o.tournament_day,
          start_time: o.start_time?.length === 5 ? o.start_time : (o.start_time || '').substring(0, 5),
          court_id: o.court_id,
          court_name: o.court_name,
          franja_label: o.franja_label || `Día ${o.tournament_day}`
        }))
        setOptions(opts)
        setGroupScheduledMatches((data.group_scheduled_matches ?? []) as GroupScheduledMatch[])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar horarios'
        toast({ title: 'Error', description: msg, variant: 'destructive' })
        setOptions([])
        setGroupScheduledMatches([])
      } finally {
        setLoadingSlots(false)
      }
    }
    load()
  }, [isOpen, tournamentId, match?.id, toast])

  const assignOption = async () => {
    if (!match || !selectedOption) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) throw new Error('No hay token de autenticación disponible')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${match.id}/schedule`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournament_day: selectedOption.tournament_day,
            start_time: selectedOption.start_time,
            court_id: selectedOption.court_id
          })
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Error al asignar partido')
      }

      toast({ title: 'Listo', description: 'Partido asignado correctamente.' })
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al asignar'
      setError(msg)
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const formatPlayerNames = (team: Match['home_team'] | null): string => {
    if (!team) return 'Equipo no disponible'
    if (team.team_name) return team.team_name
    if (Array.isArray(team.players)) {
      if (team.players.length >= 2) return `${team.players[0]} / ${team.players[1]}`
      if (team.players.length === 1) return team.players[0]
      return 'Equipo no disponible'
    }
    const p1 = team.players?.player1
    const p2 = team.players?.player2
    if (!p1 || !p2) return 'Equipo no disponible'
    const n1 = `${p1.first_name || ''} ${p1.last_name || ''}`.trim()
    const n2 = `${p2.first_name || ''} ${p2.last_name || ''}`.trim()
    return `${n1} / ${n2}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Asignar horario al partido
          </DialogTitle>
          <DialogDescription>
            Elegí un horario de la lista. Los horarios cercanos a los ya asignados del grupo aparecen primero. Solo se muestran opciones válidas (ambos equipos pueden jugar y el slot está libre).
          </DialogDescription>
        </DialogHeader>

        {match && (
          <div className="space-y-4 py-2">
            {/* Partido */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Grupo {match.group_number} · Partido #{match.match_number}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3" />
                {formatPlayerNames(match.home_team)} vs {formatPlayerNames(match.away_team)}
              </div>
            </div>

            {/* Contexto: partidos del grupo ya programados */}
            {!loadingSlots && groupScheduledMatches.length > 0 && (
              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Este grupo ya tiene partidos programados:
                </div>
                <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
                  {groupScheduledMatches.map((m) => (
                    <li key={`${m.match_number}-${m.tournament_day}-${m.start_time}-${m.court_id}`} className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs font-normal">
                        Partido #{m.match_number}
                      </Badge>
                      <span>→ Día {m.tournament_day} · {m.franja_label} · {m.start_time} · {m.court_name}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Los horarios cercanos a estos aparecen primero en la lista.
                </p>
              </div>
            )}

            {/* Lista única de horarios disponibles (ordenados por proximidad al grupo) */}
            <div className="space-y-2">
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : options.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay horarios disponibles para este partido (restricciones de equipos o todos los slots ocupados).
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                  {options.map((opt) => {
                    const isSelected = selectedOption?.court_id === opt.court_id &&
                      selectedOption?.start_time === opt.start_time &&
                      selectedOption?.tournament_day === opt.tournament_day
                    return (
                      <button
                        key={`${opt.tournament_day}-${opt.start_time}-${opt.court_id}`}
                        type="button"
                        onClick={() => setSelectedOption(isSelected ? null : opt)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-normal">
                              Día {opt.tournament_day}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                              {opt.franja_label}
                            </Badge>
                            <span className="font-medium tabular-nums">{opt.start_time}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3" />
                              {opt.court_name}
                            </span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedOption && (
              <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  Asignar aquí: Día {selectedOption.tournament_day} · {selectedOption.start_time} · {selectedOption.court_name}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={assignOption}
            disabled={loading || !selectedOption || loadingSlots || options.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Asignar partido aquí
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
