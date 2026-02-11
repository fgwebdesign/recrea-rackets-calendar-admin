'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, RefreshCw, CheckCircle, Users, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface GroupForScheduler {
  id: string
  group_number: number  
  preferred_day?: 'DAY_1' | 'DAY_2' | null
  is_homogeneous?: boolean
}

export interface FranjaOption {
  id: string
  label: string
  tournament_day: number
  start_time: string
  end_time: string
  date?: string
  /** true si el grupo ya tiene partidos en este día/franja (recomendado para mantener horarios cercanos) */
  is_nearby?: boolean
}

export interface GroupScheduledMatchInfo {
  match_number: number
  tournament_day: number
  start_time: string
  franja_label: string
}

interface GroupFranjaSchedulerProps {
  tournamentId: string
  groups: GroupForScheduler[]
  /** Match ids or match objects with group_id and start_time to detect unscheduled */
  matches: Array<{ group_id?: string; start_time?: string | null }>
  onSuccess?: () => void
}

export function GroupFranjaScheduler({
  tournamentId,
  groups,
  matches,
  onSuccess
}: GroupFranjaSchedulerProps) {
  const [franjasByGroup, setFranjasByGroup] = useState<Record<string, {
    franjas: FranjaOption[]
    loading: boolean
    groupScheduledMatches: GroupScheduledMatchInfo[]
  }>>({})
  const [schedulingGroupId, setSchedulingGroupId] = useState<string | null>(null)
  const { toast } = useToast()

  const matchList = Array.isArray(matches) ? matches : []
  const groupIdsWithUnscheduled = new Set(
    matchList
      .filter(m => m.group_id && !m.start_time)
      .map(m => m.group_id as string)
  )
  const groupsWithUnscheduled = groups.filter(g => groupIdsWithUnscheduled.has(g.id))

  const unscheduledCountByGroup = matchList.reduce<Record<string, number>>((acc, m) => {
    if (!m.group_id || m.start_time) return acc
    acc[m.group_id] = (acc[m.group_id] || 0) + 1
    return acc
  }, {})

  const unscheduledGroupIds = groupsWithUnscheduled.map(g => g.id).sort().join(',')

  useEffect(() => {
    if (!tournamentId || groupsWithUnscheduled.length === 0) return

    const load = async () => {
      const next: Record<string, { franjas: FranjaOption[]; loading: boolean; groupScheduledMatches: GroupScheduledMatchInfo[] }> = {}
      for (const g of groupsWithUnscheduled) {
        next[g.id] = { franjas: [], loading: true, groupScheduledMatches: [] }
      }
      setFranjasByGroup(prev => ({ ...prev, ...next }))

      await Promise.all(
        groupsWithUnscheduled.map(async (group) => {
          try {
            const token = localStorage.getItem('adminToken')
            if (!token) return
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/groups/${group.id}/available-franjas`,
              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            )
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Error al cargar franjas')
            setFranjasByGroup(prev => ({
              ...prev,
              [group.id]: {
                franjas: data.franjas || [],
                loading: false,
                groupScheduledMatches: (data.group_scheduled_matches || []) as GroupScheduledMatchInfo[]
              }
            }))
          } catch {
            setFranjasByGroup(prev => ({
              ...prev,
              [group.id]: { franjas: [], loading: false, groupScheduledMatches: [] }
            }))
          }
        })
      )
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when tournament or unscheduled groups change
  }, [tournamentId, unscheduledGroupIds])

  const handleScheduleInFranja = async (groupId: string, franjaId: string) => {
    setSchedulingGroupId(groupId)
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) throw new Error('No hay token de autenticación')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/groups/${groupId}/schedule-in-franja`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ franja_id: franjaId })
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al programar')

      const scheduledCount = data.scheduled_count ?? data.summary?.scheduled_count ?? 0
      const total = (data.summary?.total_matches ?? 0) || 1
      const allOk = scheduledCount === total && scheduledCount > 0

      toast({
        title: allOk ? 'Listo' : scheduledCount > 0 ? 'Parcial' : 'Sin slots libres',
        description: data.message || (allOk ? 'Partidos programados.' : 'Revisá el mensaje.'),
        variant: allOk ? 'default' : 'destructive'
      })
      onSuccess?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al programar'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSchedulingGroupId(null)
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Solo se muestran franjas en las que pueden jugar todos los equipos del grupo. <strong>Un clic en la franja asigna esa franja al grupo y programa todos sus partidos</strong> (hora y cancha). Si no hay slots libres, el sistema te avisará y podés probar otra franja.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupsWithUnscheduled.map((group) => {
          const { franjas, loading, groupScheduledMatches } = franjasByGroup[group.id] ?? {
            franjas: [],
            loading: true,
            groupScheduledMatches: []
          }
          const count = unscheduledCountByGroup[group.id] ?? 0
          return (
            <Card key={group.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Grupo {group.group_number}
                  </span>
                  <Badge variant="secondary">{count} sin programar</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Cargando franjas disponibles…
                  </div>
                ) : franjas.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ninguna franja disponible para este grupo (todos los equipos tienen restricciones). Revisá las restricciones de los equipos o asigná manualmente partido por partido.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {groupScheduledMatches.length > 0 && (
                      <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1.5">
                          Partidos ya programados en este grupo:
                        </p>
                        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                          {groupScheduledMatches.map((m) => (
                            <li key={`${m.match_number}-${m.tournament_day}-${m.start_time}`}>
                              Partido #{m.match_number} → Día {m.tournament_day} · {m.franja_label} · {m.start_time}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                          Las franjas cercanas aparecen primero; elegí una para mantener el grupo en horarios similares.
                        </p>
                      </div>
                    )}
                    <p className="text-xs font-medium text-muted-foreground">
                      Clic en una franja = asignar y programar todos los partidos del grupo:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {franjas.map((f) => (
                        <Button
                          key={f.id}
                          size="sm"
                          variant="outline"
                          title={f.is_nearby ? `Cercano a partidos ya asignados del grupo · ${f.label}` : `Asignar franja "${f.label}" y programar los ${count} partidos del grupo`}
                          className={
                            f.is_nearby
                              ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 border-green-400 dark:border-green-600 ring-1 ring-green-300/50 dark:ring-green-600/50'
                              : 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800'
                          }
                          disabled={schedulingGroupId === group.id}
                          onClick={() => handleScheduleInFranja(group.id, f.id)}
                        >
                          {schedulingGroupId === group.id ? (
                            <RefreshCw className="h-3.5 w-3 animate-spin mr-1.5" />
                          ) : (
                            <Calendar className="h-3.5 w-3 mr-1.5" />
                          )}
                          {f.is_nearby && (
                            <Badge variant="secondary" className="mr-1.5 text-[10px] px-1 py-0 bg-green-200/80 dark:bg-green-800/50">
                              Cercano
                            </Badge>
                          )}
                          {f.label}
                          <span className="ml-1.5 text-xs opacity-80">· Día {f.tournament_day}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
