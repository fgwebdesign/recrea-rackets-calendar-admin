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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Calendar,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Users,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getAvailableSlotsForDay,
  getManualSchedulingContext,
  rescheduleMatch,
  type AvailableSlot
} from '@/services/tournamentSchedulingService'

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
  const [options, setOptions] = useState<AvailableSlot[]>([])
  const [usedFallbackSlots, setUsedFallbackSlots] = useState(false)
  const [selectedOption, setSelectedOption] = useState<AvailableSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | undefined>(undefined)
  const { toast } = useToast()

  useEffect(() => {
    if (!isOpen || !tournamentId || !match?.id) return

    setSelectedOption(null)
    setError(null)
    setUsedFallbackSlots(false)

    const load = async () => {
      setLoadingSlots(true)
      try {
        const [day1, day2, context] = await Promise.all([
          getAvailableSlotsForDay(tournamentId, 1),
          getAvailableSlotsForDay(tournamentId, 2),
          getManualSchedulingContext(tournamentId)
        ])
        const all = [...day1, ...day2]

        const venue = context.courts?.[0]?.venue_id
        setVenueId(venue)

        const groupData = context.groups?.find((g) => g.group_number === match.group_number)
        const allowedFranjaIds = groupData?.allowed_franja_ids
          ? new Set(groupData.allowed_franja_ids)
          : null

        const filtered =
          allowedFranjaIds && allowedFranjaIds.size > 0
            ? all.filter((slot) => slot.franja_id && allowedFranjaIds.has(slot.franja_id))
            : all

        if (filtered.length === 0 && all.length > 0) {
          setOptions(all)
          setUsedFallbackSlots(true)
        } else {
          setOptions(filtered)
          setUsedFallbackSlots(false)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar horarios'
        toast({ title: 'Error', description: msg, variant: 'destructive' })
        setOptions([])
      } finally {
        setLoadingSlots(false)
      }
    }
    load()
  }, [isOpen, tournamentId, match?.id, match?.group_number, toast])

  const assignOption = async () => {
    if (!match || !selectedOption) return

    setLoading(true)
    setError(null)

    try {
      const body: {
        tournament_day: number
        start_time: string
        court_id: string
        venue_id?: string
      } = {
        tournament_day: selectedOption.tournament_day,
        start_time: selectedOption.start_time,
        court_id: selectedOption.court_id
      }
      if (selectedOption.venue_id || venueId) {
        body.venue_id = selectedOption.venue_id || venueId
      }

      await rescheduleMatch(tournamentId, match.id, body)
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
    <TooltipProvider delayDuration={300}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Asignar horario al partido
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Elegí un horario de la lista. Solo se muestran slots libres donde los jugadores pueden jugar según sus restricciones.
                </p>
                <p className="flex items-center gap-1 text-xs">
                  <Info className="h-3.5 w-3 shrink-0" />
                  El backend valida que ningún equipo tenga ese horario en &quot;no disponible&quot;.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {match && (
            <div className="space-y-4 py-2">
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

              <div className="space-y-2">
                {loadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cargando horarios disponibles…</p>
                  </div>
                ) : options.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay slots libres en ningún horario. Probá: (1) Asignar la franja al grupo desde &quot;Asignar franja por grupo&quot; y ejecutar la programación automática, o (2) Revisar si otras categorías ocupan todos los horarios.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                  {usedFallbackSlots && (
                    <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        Mostramos todos los horarios disponibles. Elegí uno donde todos los equipos puedan jugar; si hay conflicto con las restricciones, te lo indicaremos.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                    {options.map((opt) => {
                      const isSelected =
                        selectedOption?.court_id === opt.court_id &&
                        selectedOption?.start_time === opt.start_time &&
                        selectedOption?.tournament_day === opt.tournament_day
                      return (
                        <Tooltip key={`${opt.tournament_day}-${opt.start_time}-${opt.court_id}`}>
                          <TooltipTrigger asChild>
                            <button
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
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Clic para asignar este horario al partido.</p>
                            <p className="text-xs mt-1 opacity-90">
                              Día {opt.tournament_day} · {opt.franja_label} · {opt.start_time} · {opt.court_name}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                  </>
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
    </TooltipProvider>
  )
}
