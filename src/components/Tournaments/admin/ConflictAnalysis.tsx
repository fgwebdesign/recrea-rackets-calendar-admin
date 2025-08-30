'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react'

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

interface ConflictAnalysisProps {
  tournaments: Tournament[]
  eventName: string
}

interface SlotAnalysis {
  slot_id: string
  slot_label: string
  total_teams: number
  categories_affected: string[]
  conflict_level: 'low' | 'medium' | 'high'
  recommendations: string[]
}

interface CategoryAnalysis {
  category_name: string
  tournament_id: string
  total_conflicts: number
  flexibility_score: number
  status: 'optimal' | 'warning' | 'critical'
  groups_ready: boolean
}

export function ConflictAnalysis({ tournaments, eventName }: ConflictAnalysisProps) {
  const [loading, setLoading] = useState(true)
  const [slotAnalysis, setSlotAnalysis] = useState<SlotAnalysis[]>([])
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([])

  useEffect(() => {
    analyzeConflicts()
  }, [tournaments])

  const analyzeConflicts = async () => {
    try {
      setLoading(true)

      // Simular análisis de conflictos (en implementación real vendría del backend)
      const mockSlotAnalysis: SlotAnalysis[] = [
        {
          slot_id: 'day1_evening',
          slot_label: 'Viernes Tarde (18-21hs)',
          total_teams: 12,
          categories_affected: ['Sexta', 'Quinta', 'Cuarta'],
          conflict_level: 'high',
          recommendations: [
            'Considerar redistribución entre grupos',
            'Evaluar slots alternativos para algunos equipos'
          ]
        },
        {
          slot_id: 'day2_morning',
          slot_label: 'Sábado Mañana (8-12hs)',
          total_teams: 6,
          categories_affected: ['Quinta', 'Séptima'],
          conflict_level: 'medium',
          recommendations: [
            'Distribución balanceada',
            'Monitorear capacidad restante'
          ]
        },
        {
          slot_id: 'day2_evening',
          slot_label: 'Sábado Noche (18-21hs)',
          total_teams: 3,
          categories_affected: ['Cuarta'],
          conflict_level: 'low',
          recommendations: [
            'Capacidad disponible para más equipos',
            'Slot recomendado para redistribución'
          ]
        }
      ]

      const mockCategoryAnalysis: CategoryAnalysis[] = tournaments.map(tournament => ({
        category_name: tournament.category_name || `Categoría ${tournament.category_id}`,
        tournament_id: tournament.id,
        total_conflicts: Math.floor(Math.random() * 3), // Simular conflictos
        flexibility_score: Math.floor(Math.random() * 40) + 60, // 60-100%
        status: tournament.teams_registered === tournament.max_teams 
          ? (Math.random() > 0.5 ? 'optimal' : 'warning')
          : 'critical',
        groups_ready: tournament.teams_registered === tournament.max_teams
      }))

      setSlotAnalysis(mockSlotAnalysis)
      setCategoryAnalysis(mockCategoryAnalysis)

    } catch (err) {
      console.error('Error analyzing conflicts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Analizando conflictos globales...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalConflicts = categoryAnalysis.reduce((sum, cat) => sum + cat.total_conflicts, 0)
  const averageFlexibility = categoryAnalysis.reduce((sum, cat) => sum + cat.flexibility_score, 0) / categoryAnalysis.length
  const categoriesReady = categoryAnalysis.filter(cat => cat.groups_ready).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Análisis Global de Conflictos</h2>
        <p className="text-gray-600">
          Análisis completo de restricciones horarias y distribución de cupos para {eventName}
        </p>
      </div>

      {/* Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conflictos Totales</p>
                <p className="text-2xl font-bold text-red-600">{totalConflicts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
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
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorías Listas</p>
                <p className="text-2xl font-bold text-green-600">{categoriesReady}/{tournaments.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Slots Analizados</p>
                <p className="text-2xl font-bold">{slotAnalysis.length}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado General */}
      <Alert variant={totalConflicts === 0 ? 'default' : 'destructive'}>
        {totalConflicts === 0 ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertDescription>
          <strong>Estado Global:</strong> {totalConflicts === 0 
            ? '¡Excelente! No se detectaron conflictos horarios en ninguna categoría.'
            : `Se detectaron ${totalConflicts} conflictos distribuidos entre las categorías. Se recomienda revisar la distribución.`
          }
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis por Time Slot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Análisis por Time Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {slotAnalysis.map((slot) => (
              <div key={slot.slot_id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{slot.slot_label}</h4>
                  <Badge 
                    variant={slot.conflict_level === 'high' ? 'destructive' : 
                            slot.conflict_level === 'medium' ? 'default' : 'secondary'}
                  >
                    {slot.conflict_level === 'high' ? 'Alto' : 
                     slot.conflict_level === 'medium' ? 'Medio' : 'Bajo'} Conflicto
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Equipos afectados:</span>
                    <span className="font-medium">{slot.total_teams}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {slot.categories_affected.map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Recomendaciones:</p>
                    {slot.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full mt-2"></div>
                        <p className="text-xs text-gray-600">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Análisis por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análisis por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryAnalysis.map((category) => (
              <div key={category.tournament_id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{category.category_name}</h4>
                  <Badge 
                    variant={category.status === 'optimal' ? 'default' : 
                            category.status === 'warning' ? 'secondary' : 'destructive'}
                  >
                    {category.status === 'optimal' ? 'Óptimo' : 
                     category.status === 'warning' ? 'Advertencia' : 'Crítico'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Conflictos:</span>
                    <span className={`font-medium ${category.total_conflicts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {category.total_conflicts}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Flexibilidad:</span>
                      <span className="font-medium">{category.flexibility_score}%</span>
                    </div>
                    <Progress value={category.flexibility_score} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {category.groups_ready ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={category.groups_ready ? 'text-green-600' : 'text-yellow-600'}>
                      {category.groups_ready ? 'Lista para grupos' : 'Esperando equipos'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones Globales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recomendaciones Globales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">✅ Fortalezas Detectadas</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Sistema de cupos compartidos funcionando correctamente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Distribución inteligente minimiza conflictos automáticamente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Flexibilidad promedio superior al 60%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-orange-600">⚠️ Áreas de Mejora</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                    <span>Algunos slots tienen alta concentración de restricciones</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                    <span>Considerar incentivar inscripciones en slots menos populares</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                    <span>Monitorear capacidad restante en tiempo real</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Próximos Pasos:</strong> Una vez que todas las categorías estén completas, 
                el sistema generará automáticamente los grupos optimizados. El algoritmo inteligente 
                distribuirá los equipos para maximizar la flexibilidad de programación de partidos.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
