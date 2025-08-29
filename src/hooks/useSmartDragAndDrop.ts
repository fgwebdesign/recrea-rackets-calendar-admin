import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

interface TeamWithRestrictions {
  team_id: string
  player1: {
    id: string
    first_name: string
    last_name: string
  }
  player2: {
    id: string
    first_name: string
    last_name: string
  }
  unavailable_hour?: number
  restrictions?: string[]
}

interface SmartDragAndDropOptions {
  groupId: string
  maxTeamsPerGroup: number
  onValidationError?: (message: string) => void
  validateTeamPlacement?: (team: TeamWithRestrictions, targetGroupId: string) => {
    isValid: boolean
    reason?: string
  }
}

export function useSmartDragAndDrop(
  initialTeams: TeamWithRestrictions[] = [],
  options: SmartDragAndDropOptions
) {
  const { groupId, maxTeamsPerGroup, onValidationError, validateTeamPlacement } = options
  
  // Estado para tracking de validaciones
  const [dropError, setDropError] = useState<string | null>(null)
  const [isDropValid, setIsDropValid] = useState(true)

  // Función de validación mejorada
  const validateDrop = useCallback((
    draggedTeam: TeamWithRestrictions,
    targetTeams: TeamWithRestrictions[]
  ): { isValid: boolean; reason?: string } => {
    // 1. Verificar límite de equipos
    if (targetTeams.length >= maxTeamsPerGroup) {
      return {
        isValid: false,
        reason: `El grupo ya tiene el máximo de ${maxTeamsPerGroup} equipos`
      }
    }

    // 2. Verificar si el equipo ya está en el grupo
    if (targetTeams.some(team => team.team_id === draggedTeam.team_id)) {
      return {
        isValid: false,
        reason: 'El equipo ya está en este grupo'
      }
    }

    // 3. Verificar conflictos horarios
    if (draggedTeam.unavailable_hour !== undefined) {
      const conflictingTeam = targetTeams.find(team => 
        team.unavailable_hour === draggedTeam.unavailable_hour
      )
      
      if (conflictingTeam) {
        return {
          isValid: false,
          reason: `Conflicto horario: otro equipo en este grupo tampoco puede jugar a las ${draggedTeam.unavailable_hour}:00`
        }
      }
    }

    // 4. Validación personalizada
    if (validateTeamPlacement) {
      const customValidation = validateTeamPlacement(draggedTeam, groupId)
      if (!customValidation.isValid) {
        return customValidation
      }
    }

    return { isValid: true }
  }, [maxTeamsPerGroup, groupId, validateTeamPlacement])

  // Configurar drag & drop básico (las validaciones las manejaremos en eventos)
  const [groupRef, teams, setTeams] = useDragAndDrop<HTMLDivElement, TeamWithRestrictions>(
    initialTeams,
    {
      group: 'tournament-teams',
      sortable: true
    }
  )

  // Función para agregar equipo con validación
  const addTeamToGroup = useCallback((team: TeamWithRestrictions): boolean => {
    const validation = validateDrop(team, teams)
    
    if (!validation.isValid) {
      setDropError(validation.reason || 'No se puede agregar el equipo')
      if (onValidationError) {
        onValidationError(validation.reason || 'No se puede agregar el equipo')
      }
      return false
    }

    setTeams(prev => [...prev, team])
    setDropError(null)
    return true
  }, [teams, validateDrop, setTeams, onValidationError])

  // Función para remover equipo
  const removeTeamFromGroup = useCallback((teamId: string) => {
    setTeams(prev => prev.filter(team => team.team_id !== teamId))
    setDropError(null)
  }, [setTeams])

  // Función para verificar si un equipo puede ser agregado
  const canAddTeam = useCallback((team: TeamWithRestrictions): boolean => {
    return validateDrop(team, teams).isValid
  }, [teams, validateDrop])

  // Función para obtener conflictos potenciales
  const getConflicts = useCallback((): string[] => {
    const conflicts: string[] = []
    const restrictionCounts: Record<number, TeamWithRestrictions[]> = {}

    teams.forEach(team => {
      if (team.unavailable_hour !== undefined) {
        if (!restrictionCounts[team.unavailable_hour]) {
          restrictionCounts[team.unavailable_hour] = []
        }
        restrictionCounts[team.unavailable_hour].push(team)
      }
    })

    Object.entries(restrictionCounts).forEach(([hour, conflictedTeams]) => {
      if (conflictedTeams.length > 1) {
        conflicts.push(
          `${conflictedTeams.length} equipos no pueden jugar a las ${hour}:00`
        )
      }
    })

    return conflicts
  }, [teams])

  return {
    groupRef,
    teams,
    setTeams,
    addTeamToGroup,
    removeTeamFromGroup,
    canAddTeam,
    getConflicts,
    dropError,
    isDropValid,
    hasConflicts: getConflicts().length > 0,
    isGroupFull: teams.length >= maxTeamsPerGroup,
    isGroupComplete: teams.length === maxTeamsPerGroup && getConflicts().length === 0
  }
}
