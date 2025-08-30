'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Users, 
  Eye,
  Shuffle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react'

interface Tournament {
  id: string
  name: string
  category_id: string
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'
  max_teams: number
  teams_registered: number
  status: 'ready_for_groups' | 'pending' | 'completed'
  groups_generated: boolean
  category_name?: string
}

interface CategoryStatusCardProps {
  tournament: Tournament
  teamsCount: number
  maxTeams: number
  canGenerateGroups: boolean
  isGenerating?: boolean
  onGenerateGroups: (tournamentId: string) => void
  onViewTeams: (tournamentId: string) => void
  onViewGroups: (tournamentId: string) => void
}

export function CategoryStatusCard({
  tournament,
  teamsCount,
  maxTeams,
  canGenerateGroups,
  isGenerating = false,
  onGenerateGroups,
  onViewTeams,
  onViewGroups
}: CategoryStatusCardProps) {
  
  const getStatusInfo = () => {
    if (tournament.groups_generated) {
      return {
        status: 'completed',
        label: 'Grupos Creados',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle2
      }
    }
    
    if (canGenerateGroups) {
      return {
        status: 'ready',
        label: 'Listo para Grupos',
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Trophy
      }
    }
    
    if (teamsCount === 0) {
      return {
        status: 'empty',
        label: 'Sin Equipos',
        color: 'bg-gray-400',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: XCircle
      }
    }
    
    return {
      status: 'pending',
      label: 'Inscripciones Abiertas',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: Clock
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  const progressPercentage = (teamsCount / maxTeams) * 100
  const expectedGroups = tournament.tournament_type === 'NINE_PLAYERS' ? 3 : 4

  return (
    <Card className={`transition-all hover:shadow-md ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            {tournament.category_name || `Categoría ${tournament.category_id}`}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`${statusInfo.color} text-white text-xs px-2 py-1`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progreso de Inscripciones */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-600">Equipos Inscritos</span>
            <span className={`font-bold ${statusInfo.textColor}`}>
              {teamsCount}/{maxTeams}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            // @ts-ignore - Progress component accepts these props
            indicatorClassName={statusInfo.color}
          />
          <div className="text-xs text-gray-500 text-center">
            {progressPercentage.toFixed(0)}% completado
          </div>
        </div>

        {/* Información del Formato */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Formato:</span>
            <Badge variant="outline" className="text-xs">
              {tournament.tournament_type === 'NINE_PLAYERS' ? '9 Equipos' : '12 Equipos'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Grupos esperados:</span>
            <span className="font-medium">{expectedGroups} grupos de 3</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-2">
          {/* Botón principal según estado */}
          {tournament.groups_generated ? (
            <Button
              onClick={() => onViewGroups(tournament.id)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Grupos
            </Button>
          ) : canGenerateGroups ? (
            <Button
              onClick={() => onGenerateGroups(tournament.id)}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generar Grupos
                </>
              )}
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Esperando Equipos
            </Button>
          )}

          {/* Botón secundario para ver equipos */}
          <Button
            onClick={() => onViewTeams(tournament.id)}
            variant="outline"
            className="w-full"
            size="sm"
            disabled={teamsCount === 0}
          >
            <Users className="w-4 h-4 mr-2" />
            Ver Equipos ({teamsCount})
          </Button>
        </div>

        {/* Alertas y notificaciones */}
        {teamsCount > 0 && teamsCount < maxTeams && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-700">
                Faltan {maxTeams - teamsCount} equipos para completar
              </span>
            </div>
          </div>
        )}

        {canGenerateGroups && !tournament.groups_generated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700">
                ¡Listo para generar grupos automáticamente!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
