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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
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

interface Court {
  id: string
  name: string
}

interface AvailableSlot {
  id: string
  start: string
  end: string
  courts: Court[]
  availability: {
    available: number
    occupied: number
    total: number
  }
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
  const [selectedDay, setSelectedDay] = useState<string>('1')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [selectedCourt, setSelectedCourt] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar slots disponibles cuando cambia el día
  useEffect(() => {
    if (isOpen && selectedDay) {
      loadAvailableSlots(parseInt(selectedDay))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDay])

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen && match) {
      setSelectedDay(match.tournament_day?.toString() || '1')
      setSelectedSlot('')
      setSelectedCourt('')
      setError(null)
      setValidationError(null)
    }
  }, [isOpen, match])

  const loadAvailableSlots = async (day: number) => {
    setLoadingSlots(true)
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/available-slots-for-day?day=${day}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cargar slots disponibles')
      }

      const data = await response.json()
      
      // El backend retorna courts separado y slots sin courts dentro
      const courtsList = data.courts || []
      const slots = (data.slots || []).map((slot: {
        id: string
        start: string
        end: string
        availability?: {
          total_capacity?: number
          total?: number
          occupied?: number
          available?: number
        }
      }) => {
        const totalCapacity = slot.availability?.total_capacity ?? slot.availability?.total ?? courtsList.length
        const occupied = slot.availability?.occupied ?? 0
        const available = slot.availability?.available ?? (totalCapacity - occupied)
        
        return {
          ...slot,
          courts: courtsList, // Asignar todas las canchas a cada slot
          availability: {
            available: Math.max(0, available),
            occupied: occupied,
            total: totalCapacity
          }
        }
      })
      
      setAvailableSlots(slots)
      setCourts(courtsList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoadingSlots(false)
    }
  }

  const validateSchedule = async () => {
    if (!match || !selectedSlot || !selectedCourt) return

    setValidationError(null)
    setLoading(true)

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      const slot = availableSlots.find(s => s.id === selectedSlot)
      if (!slot) {
        throw new Error('Slot no encontrado')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${match.id}/validate-schedule`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tournament_day: parseInt(selectedDay),
            start_time: slot.start,
            court_id: selectedCourt
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al validar horario')
      }

      const data = await response.json()
      
      if (!data.valid || !data.can_schedule) {
        let errorMsg = 'El horario seleccionado tiene conflictos:\n'
        
        if (data.conflicts?.has_conflicts) {
          errorMsg += '- Conflictos con otros partidos\n'
        }
        
        if (data.team_restrictions?.has_conflicts) {
          errorMsg += '- Restricciones de equipos\n'
        }
        
        setValidationError(errorMsg)
        return false
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setValidationError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!match || !selectedSlot || !selectedCourt) return

    // Validar antes de asignar
    const isValid = await validateSchedule()
    if (!isValid) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      const slot = availableSlots.find(s => s.id === selectedSlot)
      if (!slot) {
        throw new Error('Slot no encontrado')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${match.id}/schedule`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tournament_day: parseInt(selectedDay),
            start_time: slot.start,
            court_id: selectedCourt
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al reasignar partido')
      }

      toast({
        title: 'Éxito',
        description: 'Partido reasignado exitosamente',
      })

      onSuccess?.()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPlayerNames = (team: Match['home_team'] | null): string => {
    if (!team) return 'Equipo no disponible'
    
    if (team.team_name) return team.team_name
    
    // El backend puede retornar players como array de strings (nombres completos)
    if (Array.isArray(team.players)) {
      if (team.players.length >= 2) {
        return `${team.players[0]} / ${team.players[1]}`
      }
      if (team.players.length === 1) {
        return team.players[0]
      }
      return 'Equipo no disponible'
    }
    
    // O como objeto con player1 y player2
    const player1 = team.players?.player1
    const player2 = team.players?.player2
    
    if (!player1 || !player2) return 'Equipo no disponible'
    
    const name1 = `${player1.first_name || ''} ${player1.last_name || ''}`.trim()
    const name2 = `${player2.first_name || ''} ${player2.last_name || ''}`.trim()
    
    return `${name1} / ${name2}`
  }

  const selectedSlotData = availableSlots.find(s => s.id === selectedSlot)
  const availableCourts = (Array.isArray(selectedSlotData?.courts) 
    ? selectedSlotData.courts 
    : courts).filter(() => 
    (selectedSlotData?.availability.available ?? 0) > 0
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Reasignar Partido
          </DialogTitle>
          <DialogDescription>
            Cambia el día, hora y cancha del partido. El sistema validará conflictos automáticamente.
          </DialogDescription>
        </DialogHeader>

        {match && (
          <div className="space-y-4 py-4">
            {/* Información del partido */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Grupo {match.group_number} - Partido #{match.match_number}
                </span>
                {match.tournament_day && match.start_time && (
                  <Badge variant="outline" className="text-xs">
                    Día {match.tournament_day} - {match.start_time.substring(0, 5)}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatPlayerNames(match.home_team)}
                  </span>
                </div>
                <div className="text-center text-xs text-gray-400">vs</div>
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <Users className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatPlayerNames(match.away_team)}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de día */}
            <div className="space-y-2">
              <Label htmlFor="day">Día del Torneo</Label>
              <Select value={selectedDay} onValueChange={(value) => {
                setSelectedDay(value)
                setSelectedSlot('')
                setSelectedCourt('')
              }}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Día 1</SelectItem>
                  <SelectItem value="2">Día 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector de slot/hora */}
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="slot">Hora</Label>
                <Select 
                  value={selectedSlot} 
                  onValueChange={(value) => {
                    setSelectedSlot(value)
                    setSelectedCourt('')
                  }}
                >
                  <SelectTrigger id="slot">
                    <SelectValue placeholder="Selecciona una hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots
                      .filter(slot => slot.availability.available > 0)
                      .map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.start} - {slot.end} ({slot.availability.available} disponibles)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {availableSlots.filter(s => s.availability.available > 0).length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay slots disponibles para el día {selectedDay}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Selector de cancha */}
            {selectedSlot && availableCourts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="court">Cancha</Label>
                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                  <SelectTrigger id="court">
                    <SelectValue placeholder="Selecciona una cancha" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {court.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Resumen de selección */}
            {selectedSlot && selectedCourt && selectedSlotData && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Resumen de asignación
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Día {selectedDay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{selectedSlotData.start} - {selectedSlotData.end}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{availableCourts.find(c => c.id === selectedCourt)?.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Errores */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">
                  {validationError}
                </AlertDescription>
              </Alert>
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={loading || !selectedSlot || !selectedCourt || loadingSlots}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reasignando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Reasignar Partido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

