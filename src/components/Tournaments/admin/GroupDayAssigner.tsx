'use client'

import { useState } from 'react'
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
  Users, 
  AlertCircle,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Group {
  id: string
  group_number: number
  preferred_day: 'DAY_1' | 'DAY_2' | null
  is_homogeneous: boolean
  teams_count?: number
}

interface GroupDayAssignerProps {
  tournamentId: string
  group: Group
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function GroupDayAssigner({
  tournamentId,
  group,
  isOpen,
  onClose,
  onSuccess
}: GroupDayAssignerProps) {
  const [selectedDay, setSelectedDay] = useState<string>(
    group.preferred_day === 'DAY_1' ? '1' : group.preferred_day === 'DAY_2' ? '2' : '1'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restrictionsWarning, setRestrictionsWarning] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAssign = async () => {
    setLoading(true)
    setError(null)
    setRestrictionsWarning(null)

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/groups/${group.id}/assign-day`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tournament_day: parseInt(selectedDay)
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al asignar día al grupo')
      }

      const data = await response.json()
      
      // Verificar si hay advertencias de restricciones
      if (data.restrictions?.warning) {
        setRestrictionsWarning(data.restrictions.warning)
      }

      toast({
        title: 'Éxito',
        description: data.message || `Día ${selectedDay} asignado exitosamente al grupo ${group.group_number}`,
      })

      onSuccess?.()
      
      // Cerrar después de un breve delay si no hay advertencias
      if (!data.restrictions?.warning) {
        setTimeout(() => {
          onClose()
        }, 1500)
      }
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

  const handleClose = () => {
    setError(null)
    setRestrictionsWarning(null)
    setSelectedDay(group.preferred_day === 'DAY_1' ? '1' : group.preferred_day === 'DAY_2' ? '2' : '1')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Asignar Día al Grupo {group.group_number}
          </DialogTitle>
          <DialogDescription>
            Selecciona el día del torneo para este grupo. Esto actualizará todos los partidos del grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del grupo */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Grupo {group.group_number}
              </span>
              <Badge variant={group.is_homogeneous ? 'default' : 'secondary'}>
                {group.is_homogeneous ? 'Homogéneo' : 'Mixto'}
              </Badge>
            </div>
            {group.teams_count !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{group.teams_count} equipos</span>
              </div>
            )}
            {group.preferred_day && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Día actual: {group.preferred_day === 'DAY_1' ? 'Día 1' : 'Día 2'}</span>
              </div>
            )}
          </div>

          {/* Selector de día */}
          <div className="space-y-2">
            <Label htmlFor="day">Seleccionar Día</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger id="day">
                <SelectValue placeholder="Selecciona un día" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Día 1</SelectItem>
                <SelectItem value="2">Día 2</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Todos los partidos del grupo se asignarán al día seleccionado.
            </p>
          </div>

          {/* Advertencia de restricciones */}
          {restrictionsWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {restrictionsWarning}
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || selectedDay === (group.preferred_day === 'DAY_1' ? '1' : group.preferred_day === 'DAY_2' ? '2' : '')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Asignar Día
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

