'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Clock,
  Users,
  Target,
  Zap
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { 
  tournamentGroupsService, 
  type TeamWithConstraints as ServiceTeamWithConstraints,
  type ConflictInfo as ServiceConflictInfo
} from '@/services/tournamentGroupsService'
import { TimeSlotBadge } from './TimeSlotBadge'

interface Tournament {
  id: string
  name: string
  category_id: string
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  max_teams: number
  teams_registered: number
  status: string
  category_name?: string
}

// Usar tipos del servicio
type ConflictInfo = ServiceConflictInfo
type TeamWithConstraints = ServiceTeamWithConstraints & {
  team_name?: string
  unavailable_label?: string
}

interface GeneratedGroup {
  group_number: number
  teams: TeamWithConstraints[]
  conflicts: ConflictInfo[]
  available_slots: Array<{
    slot_id: string
    label: string
    day: number
    start: string
    end: string
  }>
  recommended_slots: string[]
  has_conflicts: boolean
  schedule_flexibility: number
  flexibility_percentage?: number
}

interface GroupsAnalysis {
  groups: GeneratedGroup[]
  summary: {
    total_groups: number
    groups_with_conflicts: number
    total_conflicts: number
    overall_status: 'SIN_CONFLICTOS' | 'CONFLICTOS_DETECTADOS'
  }
}

interface GroupsVisualizationProps {
  tournamentId: string
  tournament: Tournament
  onBack: () => void
  onRegenerateGroups: () => void
}

export function GroupsVisualization({
  tournamentId,
  tournament,
  onBack,
  onRegenerateGroups
}: GroupsVisualizationProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupsAnalysis, setGroupsAnalysis] = useState<GroupsAnalysis | null>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    fetchGroupsAnalysis()
  }, [tournamentId])

  const fetchGroupsAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar el servicio integrado
      const data = await tournamentGroupsService.getGroupsAnalysis(tournamentId)
      
      // Adaptar la estructura de datos
      const adaptedData: GroupsAnalysis = {
        groups: data.groups.map(group => ({
          group_number: group.group_number,
          teams: group.teams.map(team => ({
            ...team,
            team_name: `${team.player1.first_name} ${team.player1.last_name} / ${team.player2.first_name} ${team.player2.last_name}`,
            unavailable_label: team.slot_label || 'Sin restricción'
          })),
          conflicts: group.conflicts,
          available_slots: group.available_slots,
          recommended_slots: [], // Agregar campo faltante
          has_conflicts: group.conflicts.length > 0,
          schedule_flexibility: group.flexibility_percentage || 0,
          flexibility_percentage: group.flexibility_percentage
        })),
        summary: {
          total_groups: data.groups.length,
          groups_with_conflicts: data.groups.filter(g => g.conflicts.length > 0).length,
          total_conflicts: data.summary.total_conflicts,
          overall_status: data.summary.total_conflicts > 0 ? 'CONFLICTOS_DETECTADOS' : 'SIN_CONFLICTOS'
        }
      }
      
      setGroupsAnalysis(adaptedData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando análisis de grupos')
    } finally {
      setLoading(false)
    }
  }

  const validateConflicts = async () => {
    if (!groupsAnalysis) return

    try {
      setValidating(true)

      // Preparar datos para validación
      const groupsForValidation = groupsAnalysis.groups.map(group => ({
        group_number: group.group_number,
        teams: group.teams.map(t => t.team_id)
      }))

      // Usar el servicio integrado
      const validationResult = await tournamentGroupsService.validateGroupConflicts(tournamentId, groupsForValidation)
      
      // Actualizar el análisis con los resultados de validación
      setGroupsAnalysis(prev => {
        if (!prev) return null
        
        // Adaptar los resultados de validación al formato esperado
        const adaptedGroups = validationResult.validation_results 
          ? validationResult.validation_results.map(result => {
              const existingGroup = prev.groups.find(g => g.group_number === result.group_number)
              return {
                group_number: result.group_number,
                teams: existingGroup?.teams || [],
                conflicts: result.conflicts,
                available_slots: result.available_slots,
                recommended_slots: result.recommended_slots,
                has_conflicts: result.has_conflicts,
                schedule_flexibility: result.schedule_flexibility,
                flexibility_percentage: Math.round((result.schedule_flexibility / 8) * 100)
              }
            })
          : prev.groups
        
        return {
          groups: adaptedGroups,
          summary: validationResult.summary || prev.summary
        }
      })

      toast({
        title: "Validación completada",
        description: `${validationResult.summary?.total_conflicts || 0} conflictos detectados`,
        variant: validationResult.summary?.total_conflicts > 0 ? "destructive" : "default"
      })

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error validando conflictos",
        description: err instanceof Error ? err.message : 'Error desconocido'
      })
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Cargando análisis de grupos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!groupsAnalysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">No se han generado grupos para esta categoría</p>
          <Button onClick={onRegenerateGroups}>
            <Zap className="w-4 h-4 mr-2" />
            Generar Grupos Automáticamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { groups, summary } = groupsAnalysis
  const averageFlexibility = groups.reduce((sum, g) => sum + (g.flexibility_percentage || g.schedule_flexibility), 0) / groups.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              Grupos Generados - {tournament.category_name}
            </h2>
            <p className="text-gray-600">
              {groups.length} grupos • {summary.total_conflicts} conflictos detectados
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={validateConflicts} disabled={validating}>
            {validating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Validando...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Validar Conflictos
              </>
            )}
          </Button>
          <Button onClick={onRegenerateGroups}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerar
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Grupos</p>
                <p className="text-2xl font-bold">{summary.total_groups}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conflictos</p>
                <p className="text-2xl font-bold text-red-600">{summary.total_conflicts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Grupos Sin Conflictos</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.total_groups - summary.groups_with_conflicts}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flexibilidad Promedio</p>
                <p className="text-2xl font-bold">{Math.round(averageFlexibility)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado General */}
      <Alert variant={summary.overall_status === 'SIN_CONFLICTOS' ? 'default' : 'destructive'}>
        {summary.overall_status === 'SIN_CONFLICTOS' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertDescription>
          <strong>Estado:</strong> {summary.overall_status === 'SIN_CONFLICTOS' 
            ? '¡Excelente! No se detectaron conflictos horarios. Los grupos están listos para programar partidos.'
            : `Se detectaron ${summary.total_conflicts} conflictos en ${summary.groups_with_conflicts} grupos. Revisa las restricciones horarias.`
          }
        </AlertDescription>
      </Alert>

      {/* Visualización de Grupos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <GroupCard key={group.group_number} group={group} />
        ))}
      </div>

      {/* Recomendaciones */}
      {summary.total_conflicts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recomendaciones para Resolver Conflictos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm">
                  <strong>Regenerar automáticamente:</strong> El algoritmo inteligente redistribuirá los equipos 
                  para minimizar conflictos horarios.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-sm">
                  <strong>Edición manual:</strong> Usa el generador avanzado para ajustar manualmente 
                  la distribución de equipos entre grupos.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm">
                  <strong>Flexibilidad de horarios:</strong> Los grupos con mayor flexibilidad (más slots disponibles) 
                  son más fáciles de programar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Componente para mostrar un grupo individual
function GroupCard({ group }: { group: GeneratedGroup }) {
  const flexibilityPercentage = group.flexibility_percentage || 
    Math.round((group.schedule_flexibility / 8) * 100) // Asumiendo 8 slots máximos

  const getFlexibilityColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <Card className={`transition-all hover:shadow-md ${
      group.has_conflicts ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Grupo {group.group_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            {group.has_conflicts ? (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {group.conflicts.length} conflictos
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Sin conflictos
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Equipos del grupo */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipos ({group.teams.length})
          </h4>
          {group.teams.map((team, index) => (
            <div key={team.team_id} className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-sm font-medium">{team.team_name}</span>
              {team.unavailable_time_slot && (
                <TimeSlotBadge
                  slotId={team.unavailable_time_slot}
                  label={team.unavailable_label || team.slot_label}
                  variant="restriction"
                  size="sm"
                />
              )}
            </div>
          ))}
        </div>

        {/* Flexibilidad de programación */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Flexibilidad</span>
            <span className={`text-sm font-bold ${getFlexibilityColor(flexibilityPercentage).split(' ')[0]}`}>
              {flexibilityPercentage}%
            </span>
          </div>
          <Progress value={flexibilityPercentage} className="h-2" />
          <p className="text-xs text-gray-600">
            {group.available_slots.length} slots disponibles para partidos
          </p>
        </div>

        {/* Conflictos */}
        {group.conflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Conflictos Detectados
            </h4>
            {group.conflicts.map((conflict, index) => (
              <Alert key={index} variant="destructive" className="p-2">
                <AlertDescription className="text-xs">
                  {conflict.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Slots recomendados */}
        {group.recommended_slots.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-green-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Horarios Recomendados
            </h4>
            <div className="flex flex-wrap gap-1">
              {group.recommended_slots.map((slot, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-green-100 text-green-700">
                  ✅ {slot}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
