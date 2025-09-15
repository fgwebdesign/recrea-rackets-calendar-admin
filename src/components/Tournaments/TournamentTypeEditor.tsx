'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from '@/components/ui/use-toast'
import { API_BASE_URL } from '@/services/tournamentService'

interface TournamentTypeEditorProps {
  tournamentId: string
  currentType: string
  onTypeChange: (newType: string) => void
  disabled?: boolean
}

export function TournamentTypeEditor({ 
  tournamentId, 
  currentType, 
  onTypeChange, 
  disabled = false 
}: TournamentTypeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedType, setSelectedType] = useState(currentType)
  const [isLoading, setIsLoading] = useState(false)

  const formatTournamentType = (type: string) => {
    const typeConfig = {
      SIX_PLAYERS: '6 Jugadores',
      NINE_PLAYERS: '9 Jugadores',
      TWELVE_PLAYERS: '12 Jugadores', 
      SIXTEEN_PLAYERS: '16 Jugadores'
    }
    return typeConfig[type as keyof typeof typeConfig] || type
  }

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setSelectedType(currentType)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSelectedType(currentType)
  }

  const handleSave = async () => {
    if (selectedType === currentType) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No estás autenticado')
      }

      const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/change-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_tournament_type: selectedType
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al cambiar el tipo de torneo')
      }

      const result = await response.json()
      
      toast({
        title: "¡Éxito!",
        description: result.message || 'Tipo de torneo cambiado exitosamente'
      })

      onTypeChange(selectedType)
      setIsEditing(false)
    } catch (error) {
      console.error('Error changing tournament type:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cambiar el tipo de torneo',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SIX_PLAYERS">6 Jugadores</SelectItem>
            <SelectItem value="NINE_PLAYERS">9 Jugadores</SelectItem>
            <SelectItem value="TWELVE_PLAYERS">12 Jugadores</SelectItem>
            <SelectItem value="SIXTEEN_PLAYERS">16 Jugadores</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
        >
          <CheckIcon className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-2 py-1"
        >
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{formatTournamentType(currentType)}</span>
      {!disabled && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <PencilIcon className="h-3 w-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
        </Button>
      )}
    </div>
  )
}
