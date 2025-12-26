'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Court {
  id: string
  name: string
}

interface SlotAvailability {
  available: number
  occupied: number
  total: number
}

interface AvailableSlot {
  id: string
  start: string
  end: string
  courts: Court[]
  availability: SlotAvailability
}

interface AvailableSlotsViewProps {
  tournamentId: string
  onSlotSelect?: (slot: AvailableSlot, court: Court) => void
}

export function AvailableSlotsView({ 
  tournamentId,
  onSlotSelect 
}: AvailableSlotsViewProps) {
  const [day1Slots, setDay1Slots] = useState<AvailableSlot[]>([])
  const [day2Slots, setDay2Slots] = useState<AvailableSlot[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<'1' | '2'>('1')
  const { toast } = useToast()

  const fetchSlots = async (day: number) => {
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
      // Necesitamos asignar las canchas a cada slot
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
        // Normalizar availability - el backend puede usar total_capacity o total
        const totalCapacity = slot.availability?.total_capacity ?? slot.availability?.total ?? courtsList.length
        const occupied = slot.availability?.occupied ?? 0
        const available = slot.availability?.available ?? (totalCapacity - occupied)
        
        return {
          ...slot,
          courts: courtsList, // Asignar todas las canchas a cada slot
          availability: {
            available: Math.max(0, available), // Asegurar que no sea negativo
            occupied: occupied,
            total: totalCapacity
          }
        }
      })
      
      return { slots, courts: courtsList }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      throw new Error(errorMessage)
    }
  }

  const loadSlots = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [result1, result2] = await Promise.all([
        fetchSlots(1),
        fetchSlots(2)
      ])
      
      setDay1Slots(result1.slots)
      setDay2Slots(result2.slots)
      // Usar las canchas del día 1 (deberían ser las mismas para ambos días)
      setCourts(result1.courts || result2.courts || [])
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

  useEffect(() => {
    loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  const currentSlots = selectedDay === '1' ? day1Slots : day2Slots

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage === 0) return 'bg-red-500'
    if (percentage < 50) return 'bg-orange-500'
    if (percentage < 100) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getAvailabilityBadge = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage === 0) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Lleno</Badge>
    }
    if (percentage < 50) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Poco disponible</Badge>
    }
    if (percentage < 100) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Disponible</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Totalmente disponible</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadSlots}
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const day1Summary = day1Slots.reduce((acc, slot) => ({
    total: acc.total + slot.availability.total,
    available: acc.available + slot.availability.available,
    occupied: acc.occupied + slot.availability.occupied
  }), { total: 0, available: 0, occupied: 0 })

  const day2Summary = day2Slots.reduce((acc, slot) => ({
    total: acc.total + slot.availability.total,
    available: acc.available + slot.availability.available,
    occupied: acc.occupied + slot.availability.occupied
  }), { total: 0, available: 0, occupied: 0 })

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Día 1</p>
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                  {day1Summary.available}/{day1Summary.total} disponibles
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {day1Slots.length} slots
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Día 2</p>
                <p className="text-sm font-bold text-green-900 dark:text-green-100">
                  {day2Summary.available}/{day2Summary.total} disponibles
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {day2Slots.length} slots
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para cambiar entre días */}
      <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as '1' | '2')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="1" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Día 1 ({day1Slots.length} slots)
          </TabsTrigger>
          <TabsTrigger value="2" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Día 2 ({day2Slots.length} slots)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedDay} className="mt-4">
          {currentSlots.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No hay slots disponibles
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron slots para el día {selectedDay}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSlots.map((slot) => (
                <Card 
                  key={slot.id}
                  className="hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {slot.start} - {slot.end}
                      </CardTitle>
                      {getAvailabilityBadge(slot.availability.available, slot.availability.total)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Barra de disponibilidad */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Disponibilidad</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {slot.availability.available}/{slot.availability.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getAvailabilityColor(slot.availability.available, slot.availability.total)}`}
                          style={{ 
                            width: `${(slot.availability.available / slot.availability.total) * 100}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Canchas disponibles */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <MapPin className="h-3 w-3" />
                        Canchas ({Array.isArray(slot.courts) ? slot.courts.length : courts.length})
                      </div>
                      <div className="space-y-1">
                        {(Array.isArray(slot.courts) ? slot.courts : courts).map((court) => {
                          const isAvailable = slot.availability.available > 0
                          return (
                            <div
                              key={court.id}
                              className={`flex items-center justify-between p-2 rounded border ${
                                isAvailable 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                              }`}
                              onClick={() => {
                                if (isAvailable && onSlotSelect) {
                                  onSlotSelect(slot, court)
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className={`h-3 w-3 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {court.name}
                                </span>
                              </div>
                              {isAvailable && (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                  Disponible
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Ocupados: {slot.availability.occupied}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Disponibles: {slot.availability.available}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Botón de actualizar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadSlots}
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}

