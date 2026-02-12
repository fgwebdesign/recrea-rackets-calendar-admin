'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Calendar, RefreshCw, CheckCircle, Users, AlertCircle, Ban, Info, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getManualSchedulingContext,
  assignDayToGroup,
  scheduleMatches,
  type Franja,
  type GroupWithRestrictions,
  type ScheduleMatchesResult
} from '@/services/tournamentSchedulingService'

export interface GroupForScheduler {
  id: string
  group_number: number
  preferred_day?: 'DAY_1' | 'DAY_2' | null
  is_homogeneous?: boolean
}

interface GroupFranjaSchedulerProps {
  tournamentId: string
  groups: GroupForScheduler[]
  matches: Array<{ group_id?: string; start_time?: string | null }>
  onSuccess?: () => void
}

function formatFranjaIdToLabel(franjaId: string): string {
  const map: Record<string, string> = {
    franja_day1_tarde: 'Día 1 Tarde',
    franja_day1_noche: 'Día 1 Noche',
    franja_day2_manana: 'Día 2 Mañana',
    franja_day2_mediodia: 'Día 2 Mediodía',
    franja_day2_tarde: 'Día 2 Tarde',
    franja_day2_noche: 'Día 2 Noche'
  }
  return map[franjaId] || franjaId
}

export function GroupFranjaScheduler({
  tournamentId,
  groups,
  matches,
  onSuccess
}: GroupFranjaSchedulerProps) {
  const [context, setContext] = useState<{
    franjas: Franja[]
    groupsWithRestrictions: GroupWithRestrictions[]
  } | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [assignModal, setAssignModal] = useState<{
    groupId: string
    groupNumber: number
    franjaId: string
    franjaLabel: string
    count: number
  } | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignResult, setAssignResult] = useState<ScheduleMatchesResult | null>(null)
  const { toast } = useToast()

  const matchList = Array.isArray(matches) ? matches : []
  const groupIdsWithUnscheduled = new Set(
    matchList
      .filter((m) => m.group_id && !m.start_time)
      .map((m) => m.group_id as string)
  )
  const groupsWithUnscheduled = groups.filter((g) => groupIdsWithUnscheduled.has(g.id))

  const unscheduledCountByGroup = matchList.reduce<Record<string, number>>((acc, m) => {
    if (!m.group_id || m.start_time) return acc
    acc[m.group_id] = (acc[m.group_id] || 0) + 1
    return acc
  }, {})

  const unscheduledGroupIds = groupsWithUnscheduled.map((g) => g.id).sort().join(',')

  useEffect(() => {
    if (!tournamentId || groupsWithUnscheduled.length === 0) return

    const load = async () => {
      setLoadingContext(true)
      try {
        const ctx = await getManualSchedulingContext(tournamentId)
        setContext({
          franjas: ctx.franjas || [],
          groupsWithRestrictions: ctx.groups || []
        })
      } catch {
        setContext(null)
      } finally {
        setLoadingContext(false)
      }
    }
    load()
  }, [tournamentId, unscheduledGroupIds, groupsWithUnscheduled.length])

  const handleOpenAssignModal = (groupId: string, groupNumber: number, franjaId: string, franjaLabel: string, count: number) => {
    setAssignResult(null)
    setAssignModal({ groupId, groupNumber, franjaId, franjaLabel, count })
  }

  const handleCloseAssignModal = () => {
    setAssignModal(null)
    setAssignResult(null)
    setAssignLoading(false)
    onSuccess?.()
  }

  const handleConfirmAssign = async () => {
    if (!assignModal) return
    setAssignLoading(true)
    setAssignResult(null)
    try {
      const assignRes = await assignDayToGroup(tournamentId, assignModal.groupId, {
        franja_id: assignModal.franjaId
      })

      const ready = assignRes.matches?.ready_for_auto_scheduling ?? 0
      if (ready > 0) {
        const sched = await scheduleMatches(tournamentId)
        setAssignResult(sched)
      } else {
        setAssignResult({
          success: true,
          message: assignRes.message || 'Franja asignada.',
          scheduled_count: 0,
          failed_count: 0,
          total_matches: 0,
          success_rate: '0%',
          groups_processed: 1,
          warnings: [],
          failed: []
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al asignar franja'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      handleCloseAssignModal()
    } finally {
      setAssignLoading(false)
    }
  }

  if (groupsWithUnscheduled.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay grupos con partidos sin programar. Todos los partidos tienen horario o no hay partidos de grupos.
          </p>
        </CardContent>
      </Card>
    )
  }

  const franjas = context?.franjas ?? []
  const loading = loadingContext

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Franjas en verde:</strong> Todos los equipos del grupo pueden jugar. Clic para asignar y programar automáticamente.
            <br />
            <strong className="text-red-600 dark:text-red-400">Franjas en rojo:</strong> Al menos un equipo indicó que NO puede jugar en ese horario. No se puede asignar.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupsWithUnscheduled.map((group) => {
            const count = unscheduledCountByGroup[group.id] ?? 0
            const groupData = context?.groupsWithRestrictions.find((g) => g.id === group.id)
            const blockedFranjas = groupData?.blocked_franjas ?? []
            const blockedFranjaIds = new Set(blockedFranjas.map((b) => b.franja_id))
            const teamRestrictions = groupData?.team_restrictions ?? []

            return (
              <Card key={group.id} className="border-l-4 border-l-green-500">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Grupo {group.group_number}
                    </span>
                    <Badge variant="secondary">{count} sin programar</Badge>
                  </div>

                  {teamRestrictions.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10 p-3">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
                        <Ban className="h-3.5 w-3" />
                        Horarios en los que los equipos NO pueden jugar:
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        {teamRestrictions.map((tr, idx) => {
                          const labels = (tr.unavailable_times || []).map(formatFranjaIdToLabel)
                          if (labels.length === 0) return null
                          return (
                            <li key={idx} className="flex flex-wrap gap-x-2">
                              <span className="font-medium">{tr.display_name}:</span>
                              <span>{labels.join(', ')}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Cargando franjas…
                    </div>
                  ) : franjas.length === 0 ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No hay franjas configuradas en el torneo. Revisá la configuración de franjas.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {franjas.map((f) => {
                        const isBlocked = blockedFranjaIds.has(f.id)
                        const blockedDetail = blockedFranjas.find((b) => b.franja_id === f.id)
                        const blockedByNames = blockedDetail?.blocked_by.map((x) => x.display_name).join(', ') ?? ''

                        if (isBlocked) {
                          return (
                            <Tooltip key={f.id}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="cursor-not-allowed bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 opacity-90 line-through"
                                  >
                                    <Ban className="h-3.5 w-3 mr-1.5" />
                                    {f.label}
                                    <span className="ml-1.5 text-xs opacity-80">· Día {f.tournament_day}</span>
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-semibold text-red-100">No se puede asignar</p>
                                <p className="text-xs mt-1">
                                  Los siguientes equipos indicaron que NO pueden jugar en {f.label}: {blockedByNames}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )
                        }

                        return (
                          <Tooltip key={f.id}>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                title={`Asignar franja "${f.label}" al grupo y programar los ${count} partidos`}
                                className="bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800"
                                disabled={!!assignModal}
                                onClick={() => handleOpenAssignModal(group.id, group.group_number, f.id, f.label, count)}
                              >
                                <Calendar className="h-3.5 w-3 mr-1.5" />
                                {f.label}
                                <span className="ml-1.5 text-xs opacity-80">· Día {f.tournament_day}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Clic para asignar &quot;{f.label}&quot; al grupo y programar automáticamente los {count} partidos.</p>
                              <p className="text-xs mt-1 opacity-90">Todos los equipos pueden jugar en este horario.</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={!!assignModal} onOpenChange={(open) => !open && handleCloseAssignModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Asignar franja al grupo
            </DialogTitle>
            {assignModal && (
              <DialogDescription asChild>
                <div>
                  {!assignResult ? (
                    <>
                      <p>
                        Asignar <strong>Grupo {assignModal.groupNumber}</strong> a la franja{' '}
                        <strong>{assignModal.franjaLabel}</strong>.
                      </p>
                      <p className="mt-1">
                        {assignModal.count} partido(s) serán asignados a esta franja y programados
                        automáticamente (hora + cancha).
                      </p>
                    </>
                  ) : (
                    <p>Resultado de la programación automática:</p>
                  )}
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          {assignModal && (
            <div className="space-y-4">
              {!assignResult ? (
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseAssignModal} disabled={assignLoading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmAssign} disabled={assignLoading}>
                    {assignLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Asignando…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Asignar y programar automáticamente
                      </>
                    )}
                  </Button>
                </DialogFooter>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                    <p className="font-medium">
                      Programados: {assignResult.scheduled_count} · Fallidos: {assignResult.failed_count ?? 0}
                      {assignResult.success_rate != null && ` · Tasa: ${assignResult.success_rate}`}
                    </p>
                    {Array.isArray(assignResult.warnings) && assignResult.warnings.length > 0 && (
                      <ul className="mt-2 text-amber-700 dark:text-amber-300 space-y-1">
                        {assignResult.warnings.map((w, i) => (
                          <li key={i} className="text-xs">
                            {w}
                          </li>
                        ))}
                      </ul>
                    )}
                    {Array.isArray(assignResult.failed) && assignResult.failed.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                          Partidos que requieren asignación manual:
                        </p>
                        <ul className="text-xs space-y-0.5 text-muted-foreground">
                          {assignResult.failed.map((f, i) => (
                            <li key={i}>
                              Grupo {f.group_number}: {f.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseAssignModal}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
