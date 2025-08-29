'use client'

import { useEffect, useState } from 'react'
import { useTournaments } from '@/hooks/useTournaments'
import { TournamentScheduler } from '@/components/Tournaments/TournamentScheduler'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  CalendarIcon, 
  UsersIcon, 
  TrophyIcon,
  ChartBarIcon,
  PhotoIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface PageProps {
  params: {
    id: string
  }
}

export default function TournamentPage({ params }: PageProps) {
  const router = useRouter()
  const [id, setId] = useState("")
  
  useEffect(() => {
    // Acceder a params.id dentro de useEffect para evitar errores
    if (params) {
      setId(params.id)
    }
  }, [params])

  const {
    tournament,
    teams,
    matches,
    standings,
    loading,
    error,
    generateGroups
  } = useTournaments(id || undefined)

  const handleGenerateGroups = async () => {
    try {
      await generateGroups()
      toast({
        title: "Grupos generados",
        description: "Los grupos se han generado correctamente"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar los grupos"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error || 'No se pudo cargar el torneo'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/tournaments')}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 relative rounded-lg overflow-hidden bg-gray-100">
                {tournament.tournament_info?.tournament_thumbnail ? (
                  <Image
                    src={tournament.tournament_info.tournament_thumbnail}
                    alt={tournament.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <TrophyIcon className="w-6 h-6 text-gray-400 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-3">
                  {tournament.name}
                  <Badge className={
                    tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    tournament.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {tournament.status === 'upcoming' ? 'Inscripciones abiertas' :
                     tournament.status === 'in_progress' ? 'En Curso' : 'Finalizado'}
                  </Badge>
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" />
                    {teams?.length || 0} / {tournament.max_teams} equipos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {tournament.status === 'upcoming' && teams?.length === tournament.max_teams && (
            <Button 
              onClick={handleGenerateGroups}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <TrophyIcon className="w-5 h-5 mr-2" />
              Generar Grupos
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4" />
              Clasificación
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <PhotoIcon className="w-4 h-4" />
              Galería
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            {id && <TournamentScheduler tournamentId={id} />}
          </TabsContent>

          <TabsContent value="teams">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                {/* TODO: Implementar vista de equipos */}
                <div className="text-muted-foreground">Vista de equipos en desarrollo</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="standings">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                {/* TODO: Implementar vista de clasificación */}
                <div className="text-muted-foreground">Vista de clasificación en desarrollo</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                {/* TODO: Implementar galería de fotos */}
                <div className="text-muted-foreground">Galería en desarrollo</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}