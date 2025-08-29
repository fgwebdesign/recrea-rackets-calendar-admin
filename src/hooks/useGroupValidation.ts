import { useState, useEffect } from 'react'
import { TeamWithPlayers } from '@/types/tournament'

interface TeamWithRestrictions extends TeamWithPlayers {
  unavailable_hour?: number
  restrictions?: string[]
}

interface ValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

interface GroupValidation {
  groupId: string
  groupName: string
  teams: TeamWithRestrictions[]
  validation: ValidationResult
}

export function useGroupValidation(
  groups: Array<{
    id: string
    name: string 
    teams: TeamWithRestrictions[]
  }>,
  maxTeamsPerGroup: number = 3
) {
  const [validations, setValidations] = useState<GroupValidation[]>([])
  const [overallValidation, setOverallValidation] = useState<ValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
    suggestions: []
  })

  useEffect(() => {
    const newValidations = groups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      teams: group.teams,
      validation: validateGroup(group.teams, maxTeamsPerGroup)
    }))

    const overall = validateOverallDistribution(newValidations)
    
    setValidations(newValidations)
    setOverallValidation(overall)
  }, [groups, maxTeamsPerGroup])

  const validateGroup = (teams: TeamWithRestrictions[], maxTeams: number): ValidationResult => {
    const validation: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    }

    // Validar número de equipos
    if (teams.length === 0) {
      validation.warnings.push('Grupo vacío')
      validation.isValid = false
    } else if (teams.length < maxTeams) {
      validation.warnings.push(`Faltan ${maxTeams - teams.length} equipos`)
      validation.isValid = false
    } else if (teams.length > maxTeams) {
      validation.errors.push(`Excede el límite: ${teams.length}/${maxTeams} equipos`)
      validation.isValid = false
    }

    // Validar conflictos horarios
    const restrictionCounts: Record<number, TeamWithRestrictions[]> = {}
    teams.forEach(team => {
      if (team.unavailable_hour !== undefined && team.unavailable_hour !== null) {
        if (!restrictionCounts[team.unavailable_hour]) {
          restrictionCounts[team.unavailable_hour] = []
        }
        restrictionCounts[team.unavailable_hour].push(team)
      }
    })

    // Detectar conflictos (más de 1 equipo con la misma restricción)
    Object.entries(restrictionCounts).forEach(([hour, conflictedTeams]) => {
      if (conflictedTeams.length > 1) {
        validation.errors.push(
          `${conflictedTeams.length} equipos no pueden jugar a las ${hour}:00`
        )
        validation.isValid = false
      }
    })

    // Sugerencias de mejora
    if (teams.length === maxTeams && validation.errors.length === 0) {
      const teamsWithRestrictions = teams.filter(t => t.unavailable_hour !== undefined)
      if (teamsWithRestrictions.length === 0) {
        validation.suggestions.push('Grupo ideal: ningún equipo tiene restricciones')
      } else if (teamsWithRestrictions.length === 1) {
        validation.suggestions.push('Buen equilibrio: solo 1 equipo con restricciones')
      } else if (teamsWithRestrictions.length > 1 && validation.errors.length === 0) {
        validation.suggestions.push('Múltiples restricciones pero sin conflictos')
      }
    }

    return validation
  }

  const validateOverallDistribution = (groupValidations: GroupValidation[]): ValidationResult => {
    const overall: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    }

    const totalErrors = groupValidations.reduce((sum, group) => sum + group.validation.errors.length, 0)
    const totalWarnings = groupValidations.reduce((sum, group) => sum + group.validation.warnings.length, 0)
    
    overall.isValid = totalErrors === 0 && totalWarnings === 0

    if (totalErrors > 0) {
      overall.errors.push(`${totalErrors} errores detectados en la distribución`)
    }

    if (totalWarnings > 0) {
      overall.warnings.push(`${totalWarnings} advertencias en la distribución`)
    }

    // Análisis de balance de restricciones
    const allTeams = groupValidations.flatMap(g => g.teams)
    const teamsWithRestrictions = allTeams.filter(t => t.unavailable_hour !== undefined)
    const restrictionDistribution = groupValidations.map(group => {
      const restrictedInGroup = group.teams.filter(t => t.unavailable_hour !== undefined).length
      return { group: group.groupName, count: restrictedInGroup }
    })

    const maxRestricted = Math.max(...restrictionDistribution.map(g => g.count))
    const minRestricted = Math.min(...restrictionDistribution.map(g => g.count))

    if (maxRestricted - minRestricted <= 1) {
      overall.suggestions.push('Excelente balance de restricciones entre grupos')
    } else {
      overall.suggestions.push('Considera redistribuir para mejor balance de restricciones')
    }

    // Validar si todos los grupos están completos
    const completeGroups = groupValidations.filter(g => g.teams.length === 3).length
    if (completeGroups === groupValidations.length) {
      overall.suggestions.push('Todos los grupos están completos')
    }

    return overall
  }

  const getGroupStatus = (groupId: string): 'complete' | 'warning' | 'error' | 'empty' => {
    const group = validations.find(v => v.groupId === groupId)
    if (!group || group.teams.length === 0) return 'empty'
    if (group.validation.errors.length > 0) return 'error'
    if (group.validation.warnings.length > 0) return 'warning'
    return 'complete'
  }

  const getConflictSummary = () => {
    const conflicts: Record<number, string[]> = {}
    
    validations.forEach(group => {
      const restrictionCounts: Record<number, TeamWithRestrictions[]> = {}
      group.teams.forEach(team => {
        if (team.unavailable_hour !== undefined) {
          if (!restrictionCounts[team.unavailable_hour]) {
            restrictionCounts[team.unavailable_hour] = []
          }
          restrictionCounts[team.unavailable_hour].push(team)
        }
      })

      Object.entries(restrictionCounts).forEach(([hour, teams]) => {
        if (teams.length > 1) {
          if (!conflicts[parseInt(hour)]) conflicts[parseInt(hour)] = []
          conflicts[parseInt(hour)].push(`${group.groupName}: ${teams.length} equipos`)
        }
      })
    })

    return conflicts
  }

  return {
    validations,
    overallValidation,
    getGroupStatus,
    getConflictSummary,
    isDistributionValid: overallValidation.isValid,
    hasErrors: validations.some(v => v.validation.errors.length > 0),
    hasWarnings: validations.some(v => v.validation.warnings.length > 0)
  }
}
