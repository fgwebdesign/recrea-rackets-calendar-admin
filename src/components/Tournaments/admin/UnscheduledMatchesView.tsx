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
  Users, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UnscheduledMatch {
  id: string
  group_number: number
  match_number: number
  tournament_day: number | null
  start_time: string | null
  court_id: string | null
  home_team: {
    id: string
    team_name?: string
    players?: string[] | {
      player1?: { first_name?: string; last_name?: string }
      player2?: { first_name?: string; last_name?: string }
    }
  } | null
  away_team: {
    id: string
    team_name?: string
    players?: string[] | {
      player1?: { first_name?: string; last_name?: string }
      player2?: { first_name?: string; last_name?: string }
    }
  } | null
  needs: {
    day: boolean
    time: boolean
    court: boolean
  }
  needs_manual?: boolean
}

interface UnscheduledMatchesViewProps {
  tournamentId: string
  onMatchSelect?: (matchId: string) => void
  onRefresh?: () => void
}

export function UnscheduledMatchesView({ 
  tournamentId, 
  onMatchSelect,
  onRefresh 
}: UnscheduledMatchesViewProps) {
  const [matches, setMatches] = useState<UnscheduledMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const { toast } = useToast()

  const fetchUnscheduledMatches = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/unscheduled`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cargar partidos sin programar')
      }

      const data = await response.json()
      setMatches(data.matches || [])
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
    fetchUnscheduledMatches()
  }, [tournamentId])

  const formatPlayerNames = (team: UnscheduledMatch['home_team']): string => {
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

  const filteredMatches = selectedDay === 'all' 
    ? matches 
    : matches.filter(m => {
        if (selectedDay === 'unassigned') return m.tournament_day === null
        return m.tournament_day === parseInt(selectedDay)
      })

  const matchesByDay = {
    all: matches.length,
    unassigned: matches.filter(m => m.tournament_day === null).length,
    day1: matches.filter(m => m.tournament_day === 1).length,
    day2: matches.filter(m => m.tournament_day === 2).length
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
            onClick={fetchUnscheduledMatches}
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{matchesByDay.all}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Sin Día</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{matchesByDay.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Día 1</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{matchesByDay.day1}</p>
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
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Día 2</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">{matchesByDay.day2}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Tabs value={selectedDay} onValueChange={setSelectedDay}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">Todos ({matchesByDay.all})</TabsTrigger>
          <TabsTrigger value="unassigned">Sin Día ({matchesByDay.unassigned})</TabsTrigger>
          <TabsTrigger value="1">Día 1 ({matchesByDay.day1})</TabsTrigger>
          <TabsTrigger value="2">Día 2 ({matchesByDay.day2})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedDay} className="mt-4">
          {filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Todos los partidos están programados!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay partidos sin programar en esta categoría.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <Card 
                  key={match.id}
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-blue-300"
                  onClick={() => onMatchSelect?.(match.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Grupo {match.group_number} - Partido #{match.match_number}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {match.needs.day && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            <Calendar className="h-3 w-3 mr-1" />
                            Día
                          </Badge>
                        )}
                        {match.needs.time && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Hora
                          </Badge>
                        )}
                        {match.needs.court && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <MapPin className="h-3 w-3 mr-1" />
                            Cancha
                          </Badge>
                        )}
                        {match.needs_manual && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Requiere asignación
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Equipos */}
                    <div className="space-y-2">
                      {match.home_team && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {formatPlayerNames(match.home_team).charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
                            {formatPlayerNames(match.home_team)}
                          </p>
                        </div>
                      )}

                      <div className="text-center text-xs text-gray-400">vs</div>

                      {match.away_team && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {formatPlayerNames(match.away_team).charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
                            {formatPlayerNames(match.away_team)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Información actual */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      {match.tournament_day && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>Día {match.tournament_day}</span>
                        </div>
                      )}
                      {match.start_time && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{match.start_time.substring(0, 5)}</span>
                        </div>
                      )}
                      {!match.tournament_day && !match.start_time && (
                        <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                          <XCircle className="h-3 w-3" />
                          <span>Sin programar</span>
                        </div>
                      )}
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
          onClick={() => {
            fetchUnscheduledMatches()
            onRefresh?.()
          }}
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}

