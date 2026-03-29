'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Users, MessageSquare, CalendarClock, Loader2, ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  fetchRescheduleRequests,
  approveRescheduleRequest,
  rejectRescheduleRequest,
  type RescheduleRequest
} from '@/services/rescheduleRequestsService'
import { GroupFranjaRescheduler } from './GroupFranjaRescheduler'
import type { Franja } from '@/services/tournamentSchedulingService'

interface RescheduleRequestsPanelProps {
  tournamentId: string
  franjas: Franja[]
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300', icon: XCircle }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-UY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function getTeamName(req: RescheduleRequest) {
  const t = req.team?.teams
  if (!t) return 'Equipo desconocido'
  if (t.display_name) return t.display_name
  const p1 = t.player1 ? `${t.player1.first_name} ${t.player1.last_name}` : ''
  const p2 = t.player2 ? `${t.player2.first_name} ${t.player2.last_name}` : ''
  return [p1, p2].filter(Boolean).join(' / ') || 'Equipo desconocido'
}

export function RescheduleRequestsPanel({ tournamentId, franjas }: RescheduleRequestsPanelProps) {
  const [requests, setRequests] = useState<RescheduleRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')

  // Aprobar
  const [approveTarget, setApproveTarget] = useState<RescheduleRequest | null>(null)
  // Rechazar
  const [rejectTarget, setRejectTarget] = useState<RescheduleRequest | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)

  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const status = activeTab === 'pending' ? 'pending' : undefined
      const data = await fetchRescheduleRequests(tournamentId, status)
      setRequests(data.requests)
      setPendingCount(data.pending_count)
    } catch {
      toast({ title: 'Error al cargar solicitudes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [tournamentId, activeTab, toast])

  useEffect(() => { load() }, [load])

  const handleApproveSuccess = async (franjaId: string, adminNote?: string) => {
    if (!approveTarget) return
    await approveRescheduleRequest(tournamentId, approveTarget.id, franjaId, adminNote)
    toast({
      title: '✅ Solicitud aprobada',
      description: `Se notificó por email a todos los equipos del Grupo ${approveTarget.group?.group_number}.`
    })
    setApproveTarget(null)
    load()
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setRejectLoading(true)
    try {
      await rejectRescheduleRequest(tournamentId, rejectTarget.id, rejectNote || undefined)
      toast({
        title: 'Solicitud rechazada',
        description: `Se notificó al equipo por email.`
      })
      setRejectTarget(null)
      setRejectNote('')
      load()
    } catch (err) {
      toast({
        title: 'Error al rechazar',
        description: err instanceof Error ? err.message : 'Error inesperado',
        variant: 'destructive'
      })
    } finally {
      setRejectLoading(false)
    }
  }

  const displayed = requests

  return (
    <div className="space-y-4">
      {/* Header con contador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Solicitudes de cambio de franja</h2>
          {pendingCount > 0 && (
            <Badge className="bg-orange-500 text-white text-xs px-2">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'pending' | 'all')}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Pendientes
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-orange-500 text-white text-xs px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {activeTab === 'pending' ? 'No hay solicitudes pendientes' : 'No hay solicitudes registradas'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(req => {
                const cfg = STATUS_CONFIG[req.status]
                const Icon = cfg.icon
                return (
                  <Card key={req.id} className={`border ${req.status === 'pending' ? 'border-orange-200 dark:border-orange-800' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icono de estado */}
                        <div className={`mt-0.5 rounded-full p-1.5 ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm">
                              Grupo {req.group?.group_number}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {req.group?.assigned_franja || 'sin franja'}
                            </Badge>
                            <Badge className={`text-xs border ${cfg.color}`}>
                              {cfg.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{getTeamName(req)}</span>
                          </div>

                          <div className="flex items-start gap-1.5 text-sm mb-2">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="text-foreground/80 italic">"{req.reason}"</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              Solicitado {formatDate(req.requested_at)}
                            </span>

                            {req.status === 'approved' && req.resolved_franja_label && (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <ChevronRight className="w-3 h-3" />
                                Nueva franja: <strong>{req.resolved_franja_label}</strong>
                              </span>
                            )}

                            {req.status === 'rejected' && req.admin_note && (
                              <span className="text-xs text-muted-foreground italic">
                                Motivo: "{req.admin_note}"
                              </span>
                            )}

                            {/* Acciones para pendientes */}
                            {req.status === 'pending' && (
                              <div className="flex gap-2 ml-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  onClick={() => { setRejectTarget(req); setRejectNote('') }}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rechazar
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setApproveTarget(req)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aprobar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de aprobación → usa GroupFranjaRescheduler */}
      {approveTarget && (
        <GroupFranjaRescheduler
          open={!!approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={load}
          tournamentId={tournamentId}
          group={{
            id: approveTarget.group.id,
            group_number: approveTarget.group.group_number,
            assigned_franja: approveTarget.group.assigned_franja
          }}
          franjas={franjas}
          showAdminNote
          onConfirm={handleApproveSuccess}
        />
      )}

      {/* Dialog de rechazo */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectNote('') }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Rechazar solicitud
            </DialogTitle>
            <DialogDescription>
              Se notificará por email al equipo solicitante.
            </DialogDescription>
          </DialogHeader>
          {rejectTarget && (
            <div className="space-y-3 py-2">
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                <p className="font-medium mb-0.5">Grupo {rejectTarget.group?.group_number} — {getTeamName(rejectTarget)}</p>
                <p className="text-muted-foreground italic">"{rejectTarget.reason}"</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rejectNote" className="text-sm">
                  Motivo del rechazo <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <textarea
                  id="rejectNote"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Ej: No hay franjas disponibles para este grupo..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejectLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectLoading}
              variant="destructive"
            >
              {rejectLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rechazando...</>
                : <><XCircle className="w-4 h-4 mr-2" />Confirmar rechazo</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
