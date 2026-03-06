'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrophyIcon, 
  ClockIcon, 
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { TournamentMatch, TournamentTeam } from '@/types/tournament'

interface MatchResultModalProps {
  isOpen: boolean
  onClose: () => void
  match: TournamentMatch | null
  teams: TournamentTeam[]
  onSave: (result: MatchResult) => Promise<void>
  loading?: boolean
}

interface MatchResult {
  team1_sets1_won: number
  team2_sets1_won: number
  team1_sets2_won: number
  team2_sets2_won: number
  team1_tie1_won: number
  team2_tie1_won: number
  team1_tie2_won: number
  team2_tie2_won: number
  team1_tie3_won: number
  team2_tie3_won: number
  winner_team_id: string
}

interface ValidationError {
  field: string
  message: string
}

export default function MatchResultModal({ 
  isOpen, 
  onClose, 
  match, 
  teams,
  onSave, 
  loading = false 
}: MatchResultModalProps) {
  const [result, setResult] = useState<MatchResult>({
    team1_sets1_won: 0,
    team2_sets1_won: 0,
    team1_sets2_won: 0,
    team2_sets2_won: 0,
    team1_tie1_won: 0,
    team2_tie1_won: 0,
    team1_tie2_won: 0,
    team2_tie2_won: 0,
    team1_tie3_won: 0,
    team2_tie3_won: 0,
    winner_team_id: ''
  })

  const [errors, setErrors] = useState<ValidationError[]>([])
  const [showTiebreaks, setShowTiebreaks] = useState(false)
  const [showSuperTiebreak, setShowSuperTiebreak] = useState(false)

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && match) {
      setResult({
        team1_sets1_won: match.team1_sets1_won || 0,
        team2_sets1_won: match.team2_sets1_won || 0,
        team1_sets2_won: match.team1_sets2_won || 0,
        team2_sets2_won: match.team2_sets2_won || 0,
        team1_tie1_won: match.team1_tie1_won || 0,
        team2_tie1_won: match.team2_tie1_won || 0,
        team1_tie2_won: match.team1_tie2_won || 0,
        team2_tie2_won: match.team2_tie2_won || 0,
        team1_tie3_won: match.team1_tie3_won || 0,
        team2_tie3_won: match.team2_tie3_won || 0,
        winner_team_id: match.winner_team_id || ''
      })
      setErrors([])
      setShowTiebreaks(false)
      setShowSuperTiebreak(false)
    }
  }, [isOpen, match])

  // Validaciones en tiempo real
  useEffect(() => {
    validateResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validateResult depende de result, ya en deps
  }, [result])

  const validateResult = () => {
    const newErrors: ValidationError[] = []

    // Validar que al menos un set tenga resultado
    if (result.team1_sets1_won === 0 && result.team2_sets1_won === 0 && 
        result.team1_sets2_won === 0 && result.team2_sets2_won === 0) {
      newErrors.push({
        field: 'sets',
        message: 'Debe ingresar al menos un resultado de set'
      })
    }

    // Validar sets individuales
    if (result.team1_sets1_won > 0 || result.team2_sets1_won > 0) {
      if (result.team1_sets1_won === result.team2_sets1_won) {
        newErrors.push({
          field: 'set1',
          message: 'El Set 1 no puede terminar en empate'
        })
      }
      if (result.team1_sets1_won < 6 && result.team2_sets1_won < 6) {
        newErrors.push({
          field: 'set1',
          message: 'Al menos un equipo debe ganar 6 juegos en el Set 1'
        })
      }
    }

    if (result.team1_sets2_won > 0 || result.team2_sets2_won > 0) {
      if (result.team1_sets2_won === result.team2_sets2_won) {
        newErrors.push({
          field: 'set2',
          message: 'El Set 2 no puede terminar en empate'
        })
      }
      if (result.team1_sets2_won < 6 && result.team2_sets2_won < 6) {
        newErrors.push({
          field: 'set2',
          message: 'Al menos un equipo debe ganar 6 juegos en el Set 2'
        })
      }
    }

    // Validar tiebreaks
    if (showTiebreaks) {
      if (result.team1_tie1_won > 0 || result.team2_tie1_won > 0) {
        if (result.team1_tie1_won === result.team2_tie1_won) {
          newErrors.push({
            field: 'tie1',
            message: 'El Tiebreak 1 no puede terminar en empate'
          })
        }
        if (result.team1_tie1_won < 7 && result.team2_tie1_won < 7) {
          newErrors.push({
            field: 'tie1',
            message: 'Al menos un equipo debe ganar 7 puntos en el Tiebreak 1'
          })
        }
      }

      if (result.team1_tie2_won > 0 || result.team2_tie2_won > 0) {
        if (result.team1_tie2_won === result.team2_tie2_won) {
          newErrors.push({
            field: 'tie2',
            message: 'El Tiebreak 2 no puede terminar en empate'
          })
        }
        if (result.team1_tie2_won < 7 && result.team2_tie2_won < 7) {
          newErrors.push({
            field: 'tie2',
            message: 'Al menos un equipo debe ganar 7 puntos en el Tiebreak 2'
          })
        }
      }
    }

    // Validar super tiebreak
    if (showSuperTiebreak) {
      if (result.team1_tie3_won > 0 || result.team2_tie3_won > 0) {
        if (result.team1_tie3_won === result.team2_tie3_won) {
          newErrors.push({
            field: 'tie3',
            message: 'El Super Tiebreak no puede terminar en empate'
          })
        }
        if (result.team1_tie3_won < 10 && result.team2_tie3_won < 10) {
          newErrors.push({
            field: 'tie3',
            message: 'Al menos un equipo debe ganar 10 puntos en el Super Tiebreak'
          })
        }
      }
    }

    setErrors(newErrors)
  }

  const handleInputChange = (field: keyof MatchResult, value: string) => {
    const numValue = parseInt(value) || 0
    setResult(prev => ({ ...prev, [field]: numValue }))
  }

  const calculateWinner = (): string => {
    if (!match) return ''
    const team1SetsWon = (result.team1_sets1_won > result.team2_sets1_won ? 1 : 0) + 
                        (result.team1_sets2_won > result.team2_sets2_won ? 1 : 0)
    const team2SetsWon = (result.team2_sets1_won > result.team1_sets1_won ? 1 : 0) + 
                        (result.team2_sets2_won > result.team1_sets2_won ? 1 : 0)

    if (team1SetsWon > team2SetsWon) return match.home_team_id
    if (team2SetsWon > team1SetsWon) return match.away_team_id
    return ''
  }

  const handleSave = async () => {
    const winnerId = calculateWinner()
    const finalResult = { ...result, winner_team_id: winnerId }
    
    try {
      await onSave(finalResult)
      onClose()
    } catch (error) {
      console.error('Error saving match result:', error)
    }
  }

  const canSave = errors.length === 0 && 
                  (result.team1_sets1_won > 0 || result.team2_sets1_won > 0 || 
                   result.team1_sets2_won > 0 || result.team2_sets2_won > 0)

  const getTeamById = (teamId: string): TournamentTeam | null => {
    if (!Array.isArray(teams)) return null
    return teams.find((t) => t.team_id === teamId) ?? null
  }

  const formatEmbeddedTeam = (team: { player1?: { first_name?: string; last_name?: string }; player2?: { first_name?: string; last_name?: string } } | null | undefined): string => {
    if (!team || (!team.player1 && !team.player2)) return 'Equipo no encontrado'
    const name1 = team.player1 ? `${team.player1.first_name || ''} ${team.player1.last_name || ''}`.trim() : ''
    const name2 = team.player2 ? `${team.player2.first_name || ''} ${team.player2.last_name || ''}`.trim() : ''
    if (!name1 && !name2) return 'Jugadores no disponibles'
    if (!name2) return name1
    return `${name1} / ${name2}`
  }

  const formatPlayerNames = (team: TournamentTeam | null): string => {
    if (!team) return 'Equipo no encontrado'
    const player1 = team.teams?.player1
    const player2 = team.teams?.player2
    if (!player1 && !player2) return 'Jugadores no disponibles'
    const name1 = player1 ? `${player1.first_name || ''} ${player1.last_name || ''}`.trim() : ''
    const name2 = player2 ? `${player2.first_name || ''} ${player2.last_name || ''}`.trim() : ''
    if (!name2) return name1 || 'Jugadores no disponibles'
    return `${name1} / ${name2}`
  }

  const homeTeamName = match?.home_team ? formatEmbeddedTeam(match.home_team) : formatPlayerNames(getTeamById(match?.home_team_id ?? ''))
  const awayTeamName = match?.away_team ? formatEmbeddedTeam(match.away_team) : formatPlayerNames(getTeamById(match?.away_team_id ?? ''))

  if (!match) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
            Resultado del Partido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Partido */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
                <UsersIcon className="h-5 w-5" />
                Información del Partido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Equipo Local */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Equipo Local
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      L
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {homeTeamName}
                    </span>
                  </div>
                </div>

                {/* Equipo Visitante */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Equipo Visitante
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      V
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {awayTeamName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalles adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  <span>Grupo {match.group_number}</span>
                </div>
                {match.match_day && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(match.match_day).toLocaleDateString()}</span>
                  </div>
                )}
                {match.start_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    <span>{match.start_time}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados de Sets */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
                <TrophyIcon className="h-5 w-5" />
                Resultados de Sets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Set 1 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Set 1
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Local
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="7"
                        value={result.team1_sets1_won}
                        onChange={(e) => handleInputChange('team1_sets1_won', e.target.value)}
                        className={cn(
                          "text-center font-semibold",
                          errors.some(e => e.field === 'set1') && "border-red-500"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Visitante
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="7"
                        value={result.team2_sets1_won}
                        onChange={(e) => handleInputChange('team2_sets1_won', e.target.value)}
                        className={cn(
                          "text-center font-semibold",
                          errors.some(e => e.field === 'set1') && "border-red-500"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Set 2 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Set 2
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Local
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="7"
                        value={result.team1_sets2_won}
                        onChange={(e) => handleInputChange('team1_sets2_won', e.target.value)}
                        className={cn(
                          "text-center font-semibold",
                          errors.some(e => e.field === 'set2') && "border-red-500"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Visitante
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="7"
                        value={result.team2_sets2_won}
                        onChange={(e) => handleInputChange('team2_sets2_won', e.target.value)}
                        className={cn(
                          "text-center font-semibold",
                          errors.some(e => e.field === 'set2') && "border-red-500"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón para mostrar tiebreaks */}
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTiebreaks(!showTiebreaks)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showTiebreaks ? 'Ocultar Tiebreaks' : 'Mostrar Tiebreaks'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tiebreaks */}
          {showTiebreaks && (
            <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
                  <TrophyIcon className="h-5 w-5" />
                  Tiebreaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tiebreak 1 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tiebreak 1
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Local
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={result.team1_tie1_won}
                          onChange={(e) => handleInputChange('team1_tie1_won', e.target.value)}
                          className={cn(
                            "text-center font-semibold",
                            errors.some(e => e.field === 'tie1') && "border-red-500"
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Visitante
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={result.team2_tie1_won}
                          onChange={(e) => handleInputChange('team2_tie1_won', e.target.value)}
                          className={cn(
                            "text-center font-semibold",
                            errors.some(e => e.field === 'tie1') && "border-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tiebreak 2 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tiebreak 2
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Local
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={result.team1_tie2_won}
                          onChange={(e) => handleInputChange('team1_tie2_won', e.target.value)}
                          className={cn(
                            "text-center font-semibold",
                            errors.some(e => e.field === 'tie2') && "border-red-500"
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Visitante
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={result.team2_tie2_won}
                          onChange={(e) => handleInputChange('team2_tie2_won', e.target.value)}
                          className={cn(
                            "text-center font-semibold",
                            errors.some(e => e.field === 'tie2') && "border-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón para mostrar super tiebreak */}
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSuperTiebreak(!showSuperTiebreak)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    {showSuperTiebreak ? 'Ocultar Super Tiebreak' : 'Mostrar Super Tiebreak'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Super Tiebreak */}
          {showSuperTiebreak && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300">
                  <TrophyIcon className="h-5 w-5" />
                  Super Tiebreak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Super Tiebreak (10 puntos)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Local
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="15"
                        value={result.team1_tie3_won}
                        onChange={(e) => handleInputChange('team1_tie3_won', e.target.value)}
                        className={cn(
                          "text-center font-semibold text-lg",
                          errors.some(e => e.field === 'tie3') && "border-red-500"
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Visitante
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="15"
                        value={result.team2_tie3_won}
                        onChange={(e) => handleInputChange('team2_tie3_won', e.target.value)}
                        className={cn(
                          "text-center font-semibold text-lg",
                          errors.some(e => e.field === 'tie3') && "border-red-500"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errores de Validación */}
          {errors.length > 0 && (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Errores de Validación
                  </span>
                </div>
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 dark:text-red-400">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              Guardar Resultado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
