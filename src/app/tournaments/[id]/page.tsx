'use client'

import { use, useState, useEffect } from 'react'
import { useTournament } from '@/hooks/useTournaments'
import { useCategories } from '@/hooks/useCategories'
import { useTournamentPaymentStats } from '@/hooks/useTournamentStats'
import { StatCard, TournamentPaymentChart, PaymentRateChart } from '@/components/Tournaments/stats/TournamentStats'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { 
  ArrowLeftIcon,
  TrophyIcon,
  CalendarIcon,
  CalendarDaysIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MapPinIcon,
  BanknotesIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  StarIcon,
  PlayIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { AlertCircle, RefreshCw, Download, Tv } from 'lucide-react'

const MapPreview = dynamic(
  () => import('@/components/ui/map-preview').then((mod) => ({ default: mod.MapPreview })),
  { ssr: false, loading: () => <div className="w-full h-[200px] rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" /> }
)
import { getCategoryName } from '@/utils/category'
import { TournamentTypeEditor } from '@/components/Tournaments/TournamentTypeEditor'
import { useTranslations } from '@/contexts/TranslationContext'
import { tournamentService } from '@/services/tournamentService'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function TournamentPage({ params }: PageProps) {
  const router = useRouter()
  const t = useTranslations('tournaments')
  
  // ✅ Usar React.use() para acceder a params
  const { id } = use(params)
  
  const { 
    tournament, 
    tournamentInfo, 
    teams,
    sponsors,
    loading, 
    error, 
    refetch 
  } = useTournament(id)

  // Contador de equipos: priorizar tournament_teams (del full-details) o teams como fallback
  const teamsCount = tournament?.tournament_teams?.length ?? teams?.length ?? 0

  const { 
    data: paymentStats, 
    loading: paymentStatsLoading
  } = useTournamentPaymentStats(id)
  
  const { categories } = useCategories()

  // Estado para manejar el tipo de torneo
  const [tournamentType, setTournamentType] = useState(tournament?.tournament_type || '')
  const [rulesPdfUploading, setRulesPdfUploading] = useState(false)
  const [rulesPdfError, setRulesPdfError] = useState<string | null>(null)
  const [rulesPdfSelectedName, setRulesPdfSelectedName] = useState<string | null>(null)
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Geocodificar dirección para mostrar el mapa (Nominatim)
  useEffect(() => {
    const address = tournamentInfo?.tournament_address?.trim()
    if (!address) {
      setLocationCoords(null)
      return
    }
    let cancelled = false
    const params = new URLSearchParams({ q: address, format: 'json', limit: '1' })
    fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'es', 'User-Agent': 'MatchlyTournamentAdmin/1.0' },
    })
      .then((res) => res.json())
      .then((data: { lat?: string; lon?: string }[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return
        const lat = parseFloat(data[0].lat ?? '')
        const lon = parseFloat(data[0].lon ?? '')
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) setLocationCoords({ lat, lng: lon })
      })
      .catch(() => setLocationCoords(null))
    return () => { cancelled = true }
  }, [tournamentInfo?.tournament_address])

  // Actualizar el estado cuando cambie el torneo
  useEffect(() => {
    if (tournament?.tournament_type) {
      setTournamentType(tournament.tournament_type)
    }
  }, [tournament?.tournament_type])

  const handleTournamentTypeChange = (newType: string) => {
    setTournamentType(newType)
    // Refrescar los datos del torneo para obtener la información actualizada
    refetch()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back + Header Skeleton (imagen izq, centro, categoría derecha) */}
          <div className="mb-8">
            <Skeleton className="h-9 w-40 mb-6 rounded-md" />
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 p-6 sm:p-8 items-start">
                <Skeleton className="h-32 w-32 sm:h-36 sm:w-36 rounded-xl flex-shrink-0" />
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-8 w-48 rounded" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-5 w-44 rounded" />
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-5 w-36 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                  </div>
                </div>
                <div className="flex flex-col items-start lg:items-end">
                  <Skeleton className="h-3 w-16 mb-2 rounded" />
                  <Skeleton className="h-12 w-28 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Gestionar torneo Skeleton (6 cards con icono + título + descripción + flecha) */}
          <div className="mb-10">
            <Skeleton className="h-4 w-36 mb-4 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Información del torneo Skeleton (2 cards iguales) */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-48 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-gray-100 dark:border-gray-700/80">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-40 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-4 space-y-4">
                  <div>
                    <Skeleton className="h-3 w-24 mb-2 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-4/5 mt-1 rounded" />
                  </div>
                  <div className="py-3 border-t border-gray-100 dark:border-gray-700/80">
                    <Skeleton className="h-3 w-32 mb-2 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                  <div className="py-3 border-t border-gray-100 dark:border-gray-700/80">
                    <Skeleton className="h-3 w-20 mb-2 rounded" />
                    <div className="flex gap-3">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-7 w-7 rounded-full" />
                    </div>
                  </div>
                  <div className="py-3 border-t border-gray-100 dark:border-gray-700/80">
                    <Skeleton className="h-3 w-28 mb-2 rounded" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md mt-2" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-gray-100 dark:border-gray-700/80">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-4 space-y-4">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80">
                    <Skeleton className="h-3 w-28 mb-2 rounded" />
                    <Skeleton className="h-4 w-40 rounded" />
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex-1 min-h-[220px]">
                    <Skeleton className="h-3 w-16 mb-2 rounded" />
                    <Skeleton className="w-full h-[220px] rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <span>{t('detail.errorLoading')}: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('detail.retry')}
              </Button>
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/tournaments')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {t('detail.backToTournaments')}
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
              {t('detail.tournamentNotFound')}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/tournaments')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {t('detail.backToTournaments')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: t('statusUpcoming'), variant: 'default' as const },
      in_progress: { label: t('statusInProgress'), variant: 'secondary' as const },
      completed: { label: t('statusCompleted'), variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming
    return <Badge variant={config.variant}>{config.label}</Badge>
  }


  const isAmericano = tournament.tournament_type === 'AMERICANO'

  const navigationCards = [
    {
      title: isAmericano ? t('detail.navigation.players') : t('detail.navigation.teams'),
      description: isAmericano ? t('detail.navigation.playersDescription') : t('detail.navigation.teamsDescription'),
      icon: UsersIcon,
      href: `/tournaments/${id}/teams`,
      color: 'bg-green-500'
    },
    {
      title: isAmericano ? t('detail.navigation.rounds') : t('detail.navigation.groups'),
      description: isAmericano ? t('detail.navigation.roundsDescription') : t('detail.navigation.groupsDescription'),
      icon: Cog6ToothIcon,
      href: `/tournaments/${id}/groups`,
      color: 'bg-purple-500'
    },
    {
      title: t('detail.navigation.matches'),
      description: t('detail.navigation.matchesDescription'),
      icon: PlayIcon,
      href: `/tournaments/${id}/matches`,
      color: 'bg-indigo-500'
    },
    {
      title: t('detail.navigation.standings'),
      description: t('detail.navigation.standingsDescription'),
      icon: ChartBarIcon,
      href: `/tournaments/${id}/standings`,
      color: 'bg-orange-500'
    },
    ...(isAmericano ? [] : [{
      title: t('detail.navigation.bracket'),
      description: t('detail.navigation.bracketDescription'),
      icon: TrophyIcon,
      href: `/tournaments/${id}/bracket`,
      color: 'bg-yellow-500'
    }]),
    {
      title: t('detail.navigation.payments'),
      description: t('detail.navigation.paymentsDescription'),
      icon: BanknotesIcon,
      href: `/tournaments/${id}/payments`,
      color: 'bg-emerald-500'
    },
    ...(!isAmericano ? [{
      title: 'Solicitudes',
      description: 'Cambios de franja solicitados por jugadores',
      icon: CalendarDaysIcon,
      href: `/tournaments/${id}/reschedule-requests`,
      color: 'bg-orange-500'
    }] : [])
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <TooltipProvider delayDuration={300}>
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/tournaments')}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                {t('detail.backToTournaments')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/tv?event=single_${id}`, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-2"
              >
                <Tv className="w-4 h-4" />
                Pantalla TV
              </Button>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 p-6 sm:p-8 items-start">
                {/* Izquierda: imagen del torneo */}
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600 shadow-md">
                  {tournamentInfo?.tournament_thumbnail ? (
                    <Image
                      src={tournamentInfo.tournament_thumbnail}
                      alt={tournament.name}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 144px"
                    />
                  ) : (
                    <TrophyIcon className="h-16 w-16 sm:h-20 sm:w-20 text-white/90" />
                  )}
                </div>

                {/* Centro: todos los detalles (más color y bold) */}
                <div className="min-w-0 space-y-4 order-3 lg:order-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 truncate tracking-tight">
                      {tournament.name}
                    </h1>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{getStatusBadge(tournament.status)}</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p>Estado actual del torneo: inscripciones y visibilidad.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <span className="font-semibold text-blue-700 dark:text-blue-300">
                            {new Date(tournament.start_date).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 font-medium">–</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">
                            {new Date(tournament.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Fechas de realización del torneo.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">{teamsCount}</span>
                          <span className="text-gray-500 dark:text-gray-400 font-medium">/</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {tournament.max_teams} {isAmericano ? 'jugadores' : 'equipos'}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{isAmericano ? 'Jugadores inscritos vs. cupo máximo.' : 'Equipos inscritos vs. cupo máximo.'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <TournamentTypeEditor
                            tournamentId={id}
                            currentType={tournamentType}
                            onTypeChange={handleTournamentTypeChange}
                            disabled={tournament.status === 'completed'}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Formato del torneo (ej. grupos + eliminatorias). Clic para editar.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{t('detail.registrationProgress')}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Avance de inscripciones respecto al cupo máximo.</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {teamsCount} / {tournament.max_teams} {isAmericano ? 'jugadores' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          teamsCount >= tournament.max_teams
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((teamsCount / tournament.max_teams) * 100, 100)}%` }}
                      />
                    </div>
                    {teamsCount >= tournament.max_teams && (
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {t('detail.registrationsComplete')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Derecha arriba: categoría bien grande */}
                <div className="flex flex-col items-start lg:items-end order-2 lg:order-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Categoría
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <span className="px-5 py-3 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 border-2 border-violet-200 dark:border-violet-700 font-bold text-xl sm:text-2xl shadow-sm">
                          {getCategoryName(tournament.category_id, categories)}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>Nivel o categoría en la que se disputa este torneo.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Navegación: acciones principales del torneo (más visible) */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Gestionar torneo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {navigationCards.map((card) => {
              const IconComponent = card.icon
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => router.push(card.href)}
                  className="group flex items-center gap-4 w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md active:scale-[0.99] transition-all duration-200"
                >
                  <div className={`flex-shrink-0 p-2.5 rounded-lg ${card.color}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{card.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{card.description}</div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Información del torneo: solo 2 cards de igual tamaño */}
        {tournamentInfo && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Información del torneo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Card 1: Descripción, Costo, Premios, Patrocinadores y Reglamento */}
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-gray-100 dark:border-gray-700/80">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                    <InformationCircleIcon className="h-5 w-5 text-slate-500" />
                    Información general
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-4 flex-1 flex flex-col min-h-0 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{t('detail.info.description')}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {tournamentInfo.description || t('detail.info.noDescription')}
                    </p>
                  </div>

                  <div className="py-3 border-t border-gray-100 dark:border-gray-700/80">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <BanknotesIcon className="h-4 w-4" />
                      {t('detail.info.inscriptionCost')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${tournamentInfo.inscription_cost}</p>
                  </div>

                  {(tournamentInfo.first_place_prize || tournamentInfo.second_place_prize || tournamentInfo.third_place_prize) && (
                    <div className="py-3 border-t border-gray-100 dark:border-gray-700/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                        <TrophyIcon className="h-4 w-4" />
                        {t('detail.info.prizes')}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {tournamentInfo.first_place_prize && (
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">1°</span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tournamentInfo.first_place_prize}</span>
                          </span>
                        )}
                        {tournamentInfo.second_place_prize && (
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                            <span className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">2°</span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tournamentInfo.second_place_prize}</span>
                          </span>
                        )}
                        {tournamentInfo.third_place_prize && (
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-700/30 dark:border-amber-800">
                            <span className="w-5 h-5 rounded-full bg-amber-700 flex items-center justify-center text-white text-xs font-bold">3°</span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tournamentInfo.third_place_prize}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {sponsors && sponsors.length > 0 && (
                    <div className="py-3 border-t border-gray-100 dark:border-gray-700/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                        <StarIcon className="h-4 w-4" />
                        {t('sponsors')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sponsors.map((sponsor, index: number) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            {sponsor.logo_url && (
                              <div className="relative h-6 w-6 rounded overflow-hidden flex-shrink-0">
                                <Image src={sponsor.logo_url} alt={sponsor.name} fill className="object-contain" sizes="24px" loading="lazy" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sponsor.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="py-3 border-t border-gray-100 dark:border-gray-700/80 flex-1 flex flex-col min-h-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                      <DocumentTextIcon className="h-4 w-4" />
                      {t('detail.info.rules')}
                    </p>
                    <div className="space-y-2">
                      {tournamentInfo.rules_pdf_url && (
                        <div className="flex flex-wrap gap-2">
                          <a href={tournamentInfo.rules_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            <DocumentTextIcon className="h-4 w-4" /> Ver PDF
                          </a>
                          <a href={tournamentInfo.rules_pdf_url} download className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Download className="h-4 w-4" /> Descargar
                          </a>
                        </div>
                      )}
                      {tournamentInfo.rules && <p className="text-sm text-gray-600 dark:text-gray-400">{tournamentInfo.rules}</p>}
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{tournamentInfo.rules_pdf_url ? 'Reemplazar' : 'Subir'} reglamento en PDF</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            id="rules-pdf-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="sr-only"
                            disabled={rulesPdfUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setRulesPdfSelectedName(file.name)
                              const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
                              if (!token) { setRulesPdfError('Debes iniciar sesión para subir archivos'); return }
                              setRulesPdfError(null)
                              setRulesPdfUploading(true)
                              try {
                                await tournamentService.uploadRulesPdf(id, file, token)
                                refetch()
                              } catch (err) {
                                setRulesPdfError(err instanceof Error ? err.message : 'Error al subir el PDF')
                              } finally {
                                setRulesPdfUploading(false)
                                setRulesPdfSelectedName(null)
                                e.target.value = ''
                              }
                            }}
                          />
                          <label
                            htmlFor="rules-pdf-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            Elegir archivo
                          </label>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {rulesPdfUploading ? 'Subiendo...' : rulesPdfSelectedName ?? 'Ningún archivo elegido'}
                          </span>
                        </div>
                        {rulesPdfError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{rulesPdfError}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Ubicación + mapa (misma altura) */}
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-gray-100 dark:border-gray-700/80">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                    <MapPinIcon className="h-5 w-5 text-slate-500" />
                    {t('detail.info.location')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-4 flex-1 flex flex-col min-h-0 space-y-4">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{tournamentInfo.tournament_club_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tournamentInfo.tournament_address}</p>
                  {tournament?.tournament_venues && tournament.tournament_venues.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{t('detail.info.venuesAndCourts')}</p>
                      {tournament.tournament_venues.map((tv) => (
                        <div key={tv.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{tv.venue?.name || 'Sede'}</span>
                          {tv.is_primary && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Principal</Badge>}
                          {tv.tournament_venue_courts && tv.tournament_venue_courts.length > 0 && (
                            <span>— {tv.tournament_venue_courts.length} canchas ({tv.tournament_venue_courts.map((cvc) => cvc.court?.name).filter(Boolean).join(', ')})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {locationCoords ? (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex-1 min-h-[200px] flex flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Mapa</p>
                      <MapPreview
                        latitude={locationCoords.lat}
                        longitude={locationCoords.lng}
                        className="w-full flex-1 min-h-[220px] rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[200px]" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Estadísticas Avanzadas */}
        {paymentStats && !paymentStatsLoading && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('detail.tournamentStats')}</h2>
            </div>

            {/* Cards de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={t('detail.stats.potentialRevenue')}
                value={`$${paymentStats.total_potential_revenue.toLocaleString()}`}
                subtitle={`$${paymentStats.inscription_cost} ${t('detail.stats.perTeam')}`}
                icon={<BanknotesIcon className="h-6 w-6 text-green-600" />}
              />
              <StatCard
                title={t('detail.stats.actualRevenue')}
                value={`$${paymentStats.actual_revenue.toLocaleString()}`}
                subtitle={`${paymentStats.paid_teams} ${t('detail.stats.paidTeams')}`}
                icon={<BanknotesIcon className="h-6 w-6 text-blue-600" />}
              />
              <StatCard
                title={t('detail.stats.pendingRevenue')}
                value={`$${paymentStats.pending_revenue.toLocaleString()}`}
                subtitle={`${paymentStats.pending_teams} ${t('detail.stats.pendingTeams')}`}
                icon={<BanknotesIcon className="h-6 w-6 text-orange-600" />}
              />
              <StatCard
                title={t('detail.stats.paymentRate')}
                value={`${paymentStats.payment_rate.toFixed(1)}%`}
                subtitle={`${paymentStats.paid_teams}/${paymentStats.total_teams} ${t('teams')}`}
                icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
              />
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TournamentPaymentChart categoriesBreakdown={paymentStats.categories_breakdown} />
              <PaymentRateChart 
                paymentRate={paymentStats.payment_rate}
                totalTeams={paymentStats.total_teams}
                paidTeams={paymentStats.paid_teams}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
