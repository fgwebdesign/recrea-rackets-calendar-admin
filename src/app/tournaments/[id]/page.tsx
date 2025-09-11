'use client'

import { use } from 'react'
import { useTournament } from '@/hooks/useTournaments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MapPinIcon,
  BanknotesIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function TournamentPage({ params }: PageProps) {
  const router = useRouter()
  
  // ✅ Usar React.use() para acceder a params
  const { id } = use(params)
  
  const { 
    tournament, 
    tournamentInfo, 
    stats,
    loading, 
    error, 
    refetch 
  } = useTournament(id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-32 w-32 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Error al cargar el torneo: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/tournaments')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a Torneos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontró el torneo solicitado.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/tournaments')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a Torneos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: 'Inscripciones Abiertas', variant: 'default' as const },
      in_progress: { label: 'En Progreso', variant: 'secondary' as const },
      completed: { label: 'Finalizado', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatTournamentType = (type: string) => {
    const typeConfig = {
      NINE_PLAYERS: '9 Jugadores',
      TWELVE_PLAYERS: '12 Jugadores', 
      SIXTEEN_PLAYERS: '16 Jugadores'
    }
    return typeConfig[type as keyof typeof typeConfig] || type
  }

  const navigationCards = [
    {
      title: 'Calendario',
      description: 'Programar partidos y gestionar horarios',
      icon: CalendarIcon,
      href: `/tournaments/${id}/draw`,
      color: 'bg-blue-500'
    },
    {
      title: 'Equipos',
      description: 'Ver equipos inscritos y pagos',
      icon: UsersIcon,
      href: `/tournaments/${id}/teams`,
      color: 'bg-green-500'
    },
    {
      title: 'Grupos',
      description: 'Generar y gestionar grupos',
      icon: Cog6ToothIcon,
      href: `/tournaments/${id}/groups`,
      color: 'bg-purple-500'
    },
    {
      title: 'Clasificación',
      description: 'Ver posiciones y estadísticas',
      icon: ChartBarIcon,
      href: `/tournaments/${id}/admin-groups`,
      color: 'bg-orange-500'
    },
    {
      title: 'Eliminatorias',
      description: 'Bracket de eliminación',
      icon: TrophyIcon,
      href: `/tournaments/${id}/bracket`,
      color: 'bg-yellow-500'
    },
    {
      title: 'Pagos',
      description: 'Gestionar pagos e inscripciones',
      icon: BanknotesIcon,
      href: `/tournaments/${id}/payments`,
      color: 'bg-emerald-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/tournaments')}
            className="mb-4 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver a Torneos
          </Button>

          <div className="flex items-center gap-6">
            {/* Tournament Image */}
            <div className="relative h-32 w-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {tournamentInfo?.tournament_thumbnail ? (
                <Image
                  src={tournamentInfo.tournament_thumbnail}
                  alt={tournament.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <TrophyIcon className="h-16 w-16 text-gray-400" />
              )}
            </div>

            {/* Tournament Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {tournament.name}
                </h1>
                {getStatusBadge(tournament.status)}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>{tournament.tournament_teams?.length || 0}/{tournament.max_teams} equipos</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrophyIcon className="h-4 w-4" />
                  <span>{formatTournamentType(tournament.tournament_type)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Info Cards */}
        {tournamentInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <InformationCircleIcon className="h-4 w-4" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tournamentInfo.description || 'Sin descripción'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="h-4 w-4" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tournamentInfo.tournament_club_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {tournamentInfo.tournament_address}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BanknotesIcon className="h-4 w-4" />
                  Costo de Inscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${tournamentInfo.inscription_cost}
                </p>
              </CardContent>
            </Card>

            {tournamentInfo.rules && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DocumentTextIcon className="h-4 w-4" />
                    Reglamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tournamentInfo.rules}
                  </p>
                </CardContent>
              </Card>
            )}

            {tournamentInfo.first_place_prize && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrophyIcon className="h-4 w-4" />
                    Premios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {tournamentInfo.first_place_prize && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">1º:</span> {tournamentInfo.first_place_prize}
                      </p>
                    )}
                    {tournamentInfo.second_place_prize && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">2º:</span> {tournamentInfo.second_place_prize}
                      </p>
                    )}
                    {tournamentInfo.third_place_prize && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">3º:</span> {tournamentInfo.third_place_prize}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {tournamentInfo.sponsors && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <StarIcon className="h-4 w-4" />
                    Patrocinadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tournamentInfo.sponsors}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon
            return (
              <Card 
                key={card.title}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => router.push(card.href)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Estadísticas del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.total_teams || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Equipos Registrados
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.matches_scheduled || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Partidos Programados
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.groups_generated ? 'Sí' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Grupos Generados
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${stats.total_revenue || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ingresos Totales
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
