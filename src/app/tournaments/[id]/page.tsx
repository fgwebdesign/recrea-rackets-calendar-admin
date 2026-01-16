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
  StarIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { getCategoryName } from '@/utils/category'
import { TournamentTypeEditor } from '@/components/Tournaments/TournamentTypeEditor'
import { useTranslations } from '@/contexts/TranslationContext'

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
    sponsors,
    loading, 
    error, 
    refetch 
  } = useTournament(id)

  const { 
    data: paymentStats, 
    loading: paymentStatsLoading
  } = useTournamentPaymentStats(id)
  
  const { categories } = useCategories()

  // Estado para manejar el tipo de torneo
  const [tournamentType, setTournamentType] = useState(tournament?.tournament_type || '')

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


  const navigationCards = [
    {
      title: t('detail.navigation.teams'),
      description: t('detail.navigation.teamsDescription'),
      icon: UsersIcon,
      href: `/tournaments/${id}/teams`,
      color: 'bg-green-500'
    },
    {
      title: t('detail.navigation.groups'),
      description: t('detail.navigation.groupsDescription'),
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
    {
      title: t('detail.navigation.bracket'),
      description: t('detail.navigation.bracketDescription'),
      icon: TrophyIcon,
      href: `/tournaments/${id}/bracket`,
      color: 'bg-yellow-500'
    },
    {
      title: t('detail.navigation.payments'),
      description: t('detail.navigation.paymentsDescription'),
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
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {t('detail.backToTournaments')}
          </Button>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 shadow-lg">
            <div className="flex items-center gap-6">
              {/* Tournament Image */}
              <div className="relative h-32 w-32 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                {tournamentInfo?.tournament_thumbnail ? (
                  <Image
                    src={tournamentInfo.tournament_thumbnail}
                    alt={tournament.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <TrophyIcon className="h-16 w-16 text-white" />
                )}
              </div>

              {/* Tournament Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {tournament.name}
                  </h1>
                  {getStatusBadge(tournament.status)}
                </div>
                
                {/* Categoría */}
                <div className="mb-4">
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    {getCategoryName(tournament.category_id, categories)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-8 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">
                      {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{tournament.tournament_teams?.length || 0}/{tournament.max_teams} {t('teams')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-500" />
                    <TournamentTypeEditor
                      tournamentId={id}
                      currentType={tournamentType}
                      onTypeChange={handleTournamentTypeChange}
                      disabled={tournament.status === 'completed'}
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t('detail.registrationProgress')}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {tournament.tournament_teams?.length || 0}/{tournament.max_teams}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (tournament.tournament_teams?.length || 0) >= tournament.max_teams
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ 
                        width: `${Math.min(((tournament.tournament_teams?.length || 0) / tournament.max_teams) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  {(tournament.tournament_teams?.length || 0) >= tournament.max_teams && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {t('detail.registrationsComplete')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Info Cards */}
        {tournamentInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <InformationCircleIcon className="h-5 w-5" />
                  {t('detail.info.description')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {tournamentInfo.description || t('detail.info.noDescription')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <MapPinIcon className="h-5 w-5" />
                  {t('detail.info.location')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {tournamentInfo.tournament_club_name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {tournamentInfo.tournament_address}
                </p>
                {/* ✨ NUEVO: Mostrar información de venues si está disponible */}
                {tournament?.tournament_venues && tournament.tournament_venues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
                      {t('detail.info.venuesAndCourts')}:
                    </p>
                    <div className="space-y-2">
                      {tournament.tournament_venues.map((tv) => (
                        <div key={tv.id} className="text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {tv.venue?.name || 'Sede'}
                            </span>
                            {tv.is_primary && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                Principal
                              </Badge>
                            )}
                          </div>
                          {tv.tournament_venue_courts && tv.tournament_venue_courts.length > 0 && (
                            <p className="text-gray-600 dark:text-gray-400 ml-2">
                              {tv.tournament_venue_courts.length} {tv.tournament_venue_courts.length === 1 ? 'cancha' : 'canchas'}
                              {tv.tournament_venue_courts.length > 0 && (
                                <span className="ml-1">
                                  ({tv.tournament_venue_courts.map((cvc) => cvc.court?.name).filter(Boolean).join(', ')})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <BanknotesIcon className="h-5 w-5" />
                  {t('detail.info.inscriptionCost')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${tournamentInfo.inscription_cost}
                </p>
              </CardContent>
            </Card>

            {tournamentInfo.rules && (
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <DocumentTextIcon className="h-5 w-5" />
                    {t('detail.info.rules')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {tournamentInfo.rules}
                  </p>
                </CardContent>
              </Card>
            )}

            {tournamentInfo.first_place_prize && (
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                    <TrophyIcon className="h-5 w-5" />
                    {t('detail.info.prizes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {tournamentInfo.first_place_prize && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{tournamentInfo.first_place_prize}</p>
                      </div>
                    )}
                    {tournamentInfo.second_place_prize && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{tournamentInfo.second_place_prize}</p>
                      </div>
                    )}
                    {tournamentInfo.third_place_prize && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{tournamentInfo.third_place_prize}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {sponsors && sponsors.length > 0 && (
              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-pink-700 dark:text-pink-300">
                    <StarIcon className="h-5 w-5" />
                    {t('sponsors')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {sponsors.map((sponsor, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-pink-200 dark:border-pink-800">
                        {sponsor.logo_url && (
                          <div className="relative h-8 w-8 rounded-md overflow-hidden">
                            <Image
                              src={sponsor.logo_url}
                              alt={sponsor.name}
                              fill
                              className="object-contain"
                              priority={false}
                              sizes="32px"
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {sponsor.name}
                        </span>
                      </div>
                    ))}
                  </div>
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
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-lg"
                onClick={() => router.push(card.href)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${card.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {card.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

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
