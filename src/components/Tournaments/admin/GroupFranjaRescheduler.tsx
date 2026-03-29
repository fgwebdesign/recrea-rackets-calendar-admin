'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { rescheduleGroupFranja } from '@/services/rescheduleRequestsService'

interface Franja {
  id: string
  label: string
  date?: string
  tournament_day: number
  start_time: string
  end_time: string
}

interface GroupFranjaReschedulerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  tournamentId: string
  group: {
    id: string
    group_number: number
    assigned_franja: string | null
  }
  franjas: Franja[]
  /** Si se pasa, el selector pre-selecciona esa franja (viene de la aprobación de solicitud) */
  preSelectedFranjaId?: string
  /** Si es true, ejecuta `onConfirm(franjaId)` en lugar del endpoint directo */
  onConfirm?: (newFranjaId: string, adminNote?: string) => Promise<void>
  /** Nota del admin opcional (cuando viene desde aprobación de solicitud) */
  showAdminNote?: boolean
}

export function GroupFranjaRescheduler({
  open,
  onClose,
  onSuccess,
  tournamentId,
  group,
  franjas,
  preSelectedFranjaId,
  onConfirm,
  showAdminNote = false
}: GroupFranjaReschedulerProps) {
  const [selectedFranja, setSelectedFranja] = useState<string>(preSelectedFranjaId || '')
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const availableFranjas = franjas.filter(f => f.id !== group.assigned_franja)
  const currentFranja = franjas.find(f => f.id === group.assigned_franja)
  const selected = franjas.find(f => f.id === selectedFranja)

  const handleConfirm = async () => {
    if (!selectedFranja) {
      setError('Seleccioná una franja destino')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (onConfirm) {
        await onConfirm(selectedFranja, adminNote || undefined)
      } else {
        await rescheduleGroupFranja(tournamentId, group.id, selectedFranja)
        toast({
          title: 'Franja cambiada',
          description: `Grupo ${group.group_number} reasignado a "${selected?.label}". Los partidos fueron re-programados.`
        })
      }
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar la franja'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSelectedFranja(preSelectedFranjaId || '')
      setAdminNote('')
      onClose()
    }
  }

  // Agrupar franjas por día para mejor visualización
  const franjasByDay = availableFranjas.reduce<Record<number, Franja[]>>((acc, f) => {
    if (!acc[f.tournament_day]) acc[f.tournament_day] = []
    acc[f.tournament_day].push(f)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-500" />
            Cambiar franja — Grupo {group.group_number}
          </DialogTitle>
          <DialogDescription>
            Todos los partidos del grupo serán re-programados en la nueva franja.
            Se verifica capacidad con todas las categorías del evento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Franja actual */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Franja actual:</span>
            <Badge variant="outline" className="ml-auto">
              {currentFranja?.label || group.assigned_franja || 'Sin asignar'}
            </Badge>
          </div>

          {/* Selector de franja */}
          {availableFranjas.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>No hay otras franjas disponibles en este torneo.</AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={selectedFranja} onValueChange={setSelectedFranja} className="space-y-3">
              {Object.entries(franjasByDay).map(([day, dayFranjas]) => (
                <div key={day}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Día {day}
                  </p>
                  <div className="space-y-2 pl-1">
                    {dayFranjas.map(franja => (
                      <div
                        key={franja.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedFranja === franja.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedFranja(franja.id)}
                      >
                        <RadioGroupItem value={franja.id} id={franja.id} />
                        <Label htmlFor={franja.id} className="flex-1 cursor-pointer">
                          <span className="font-medium text-sm">{franja.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {franja.start_time} – {franja.end_time}
                            {franja.date && ` · ${new Date(franja.date + 'T12:00:00').toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Nota del admin (opcional, visible al aprobar solicitudes) */}
          {showAdminNote && (
            <div className="space-y-1.5">
              <Label htmlFor="adminNote" className="text-sm font-medium">
                Nota para los jugadores <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <textarea
                id="adminNote"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Ej: Se cambió por disponibilidad de canchas..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Info del cambio */}
          {selected && (
            <div className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-green-700 dark:text-green-300">
                Los partidos del Grupo {group.group_number} se re-programarán en{' '}
                <strong>{selected.label}</strong> ({selected.start_time}–{selected.end_time}).
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFranja || loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cambiando franja...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Confirmar cambio</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
