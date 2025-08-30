'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { TournamentGroupsManager } from '@/components/Tournaments/admin/TournamentGroupsManager'
import { toast } from '@/components/ui/use-toast'
import { tournamentGroupsService } from '@/services/tournamentGroupsService'

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

interface Category {
  id: string
  name: string
}

export default function AdminGroupsPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventName, setEventName] = useState<string>('')
  const [tournamentsByCategory, setTournamentsByCategory] = useState<Tournament[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (tournamentId) {
      fetchEventData()
    }
  }, [tournamentId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obtener información del torneo principal
      const tournamentData = await tournamentGroupsService.getTournament(tournamentId)

      // 2. Obtener todas las categorías
      const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      if (!categoriesResponse.ok) {
        throw new Error('Error obteniendo categorías')
      }
      const categoriesData = await categoriesResponse.json()
      setCategories(categoriesData)

      // 3. Usar el servicio para obtener resumen completo del evento
      const eventSummary = await tournamentGroupsService.getEventSummary(tournamentData.name)

      // 4. Enriquecer con nombres de categorías
      const enrichedTournaments: Tournament[] = eventSummary.tournaments.map(tournament => {
        const category = categoriesData.find((c: Category) => c.id === tournament.category_id)
        return {
          id: tournament.id,
          name: tournament.name,
          category_id: tournament.category_id,
          tournament_type: tournament.tournament_type as 'NINE_PLAYERS' | 'TWELVE_PLAYERS',
          max_teams: tournament.max_teams,
          teams_registered: tournament.teams_registered,
          status: tournament.is_ready ? 'ready_for_groups' as const : 'pending' as const,
          groups_generated: tournament.groups_generated,
          category_name: category?.name || `Categoría ${tournament.category_id}`
        }
      })

      setEventName(eventSummary.event_name)
      setTournamentsByCategory(enrichedTournaments)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos del evento')
      console.error('Error fetching event data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupsGenerated = (results: any[]) => {
    toast({
      title: "¡Grupos generados exitosamente!",
      description: `Se generaron grupos para ${results.length} categoría(s)`,
      className: "bg-green-500 text-white border-green-600"
    })
    
    // Recargar datos para reflejar los cambios
    fetchEventData()
  }

  const handleBack = () => {
    router.push(`/tournaments/${tournamentId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120]">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-lg">Cargando información del evento...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120]">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Torneo
              </Button>
              <Button onClick={fetchEventData}>
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tournamentsByCategory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120]">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No se encontraron torneos asociados a este evento</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Torneo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120]">     
      <div className="container mx-auto px-4 py-8">
        <TournamentGroupsManager
          eventName={eventName}
          tournamentsByCategory={tournamentsByCategory}
          onGroupsGenerated={handleGroupsGenerated}
        />
      </div>
    </div>
  )
}
