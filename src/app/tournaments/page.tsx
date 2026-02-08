'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '@/types/tournament'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { useCategories } from '@/hooks/useCategories'
import { useTournaments } from '@/hooks/useTournaments'
import { useTranslations } from '@/contexts/TranslationContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, PlusIcon, TrophyIcon, UsersIcon, ClockIcon, FunnelIcon, StarIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, DollarSign } from 'lucide-react'
import Image from 'next/image'
import CalendarFilter from '@/components/Tournaments/CalendarFilter'

export default function TournamentsPage() {
  const router = useRouter()
  const t = useTranslations('tournaments')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCalendarFilter, setShowCalendarFilter] = useState(false)
  
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { 
    tournaments, 
    loading, 
    error, 
    refetch,
    fetchTournamentsWithFilters
  } = useTournaments()

  // 🗓️ Manejar filtros de fecha
  const handleDateRangeChange = async (startDate: Date | null, endDate: Date | null) => {
    const filters: { start_date?: string; end_date?: string } = {}
    
    if (startDate) {
      filters.start_date = startDate.toISOString().split('T')[0]
    }
    if (endDate) {
      filters.end_date = endDate.toISOString().split('T')[0]
    }
    
    await fetchTournamentsWithFilters(filters)
  }

  const handleQuickFilterChange = async (filter: string) => {
    await fetchTournamentsWithFilters(filter ? { date_range: filter } : {})
  }

  // 🎯 Filtrar torneos con lógica mejorada
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tournament.category_id === selectedCategory
    const matchesStatus = selectedStatus === 'all' || tournament.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // 🏆 Badge de estado mejorado
  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">{t('statusUpcoming')}</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">{t('statusInProgress')}</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors">{t('statusCompleted')}</Badge>
    }
  }

  // 📊 Estadísticas rápidas
  const stats = {
    total: tournaments.length,
    upcoming: tournaments.filter(t => t.status === 'upcoming').length,
    inProgress: tournaments.filter(t => t.status === 'in_progress').length,
    completed: tournaments.filter(t => t.status === 'completed').length,
    totalTeams: tournaments.reduce((sum, t) => sum + (t.tournament_teams?.length || 0), 0),
    totalRevenue: tournaments.reduce((sum, t) => sum + ((t.tournament_teams?.length || 0) * (t.tournament_info?.inscription_cost || 0)), 0)
  }

  // 🚨 Manejo de errores mejorado
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                className="ml-4"
              >
                {t('retry')}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // ⏳ Loading mejorado con skeletons
  if (loading || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tournament Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-xl" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* 🎯 Header mejorado */}
        <Header 
          title={t('title')}
          icon={<TrophyIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('description')}
          button={
            <Button
              onClick={() => router.push('/tournaments/create')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="mr-2 w-5 h-5" />
              {t('createTournament')}
            </Button>
          }
        />

        {/* 📊 Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('totalTournaments')}</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                </div>
                <TrophyIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('inProgress')}</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.inProgress}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('totalTeams')}</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.totalTeams}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t('revenue')}</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🔍 Filtros mejorados */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-transparent border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px] bg-transparent border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder={t('allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCategories')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 🗓️ Botón de filtro de calendario */}
                <Button
                  variant={showCalendarFilter ? "default" : "outline"}
                  onClick={() => setShowCalendarFilter(!showCalendarFilter)}
                  className={`h-10 px-4 transition-all duration-200 ${
                    showCalendarFilter 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  {t('dateFilter')}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('all')}
                  className={`h-9 transition-all ${
                    selectedStatus === 'all' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {t('allStatuses')}
                </Button>
                <Button
                  variant={selectedStatus === 'upcoming' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('upcoming')}
                  className={`h-9 transition-all ${
                    selectedStatus === 'upcoming' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {t('statusUpcoming')}
                </Button>
                <Button
                  variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('in_progress')}
                  className={`h-9 transition-all ${
                    selectedStatus === 'in_progress' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {t('statusInProgress')}
                </Button>
                <Button
                  variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('completed')}
                  className={`h-9 transition-all ${
                    selectedStatus === 'completed' 
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {t('statusCompletedPlural')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🗓️ Filtro de Calendario */}
        {showCalendarFilter && (
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {t('dateFilter')}
                </h3>
              </div>
              <CalendarFilter
                onDateRangeChange={handleDateRangeChange}
                onQuickFilterChange={handleQuickFilterChange}
              />
            </CardContent>
          </Card>
        )}

        {/* 🏆 Grid de Torneos Revolucionario Mejorado */}
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTournaments.map((tournament, index) => {
              const teamsCount = tournament.tournament_teams?.length || 0
              const progressPercentage = (teamsCount / tournament.max_teams) * 100
              const isFull = teamsCount === tournament.max_teams
              const isAlmostFull = progressPercentage >= 80
              
              return (
                <div
                  key={tournament.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                <Card
                  key={tournament.id}
                  className="group bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900/50 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-500 cursor-pointer overflow-hidden transform hover:scale-[1.02] hover:-translate-y-3 backdrop-blur-sm"
                  onClick={() => router.push(`/tournaments/${tournament.id}`)}
                >
                  {/* 🖼️ Header con imagen (solo si existe) */}
                  {tournament.tournament_info?.tournament_thumbnail && (
                    <div className="relative h-52 overflow-hidden">
                      {/* Efecto de overlay dinámico */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <Image
                        src={tournament.tournament_info.tournament_thumbnail}
                        alt={tournament.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      
                      {/* 🏷️ Badges superpuestos */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {getStatusBadge(tournament.status)}
                        {tournament.category && (
                          <Badge variant="outline" className="bg-white/90 dark:bg-slate-800/90 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 backdrop-blur-sm">
                            {tournament.category.name}
                          </Badge>
                        )}
                      </div>

                      {/* 📊 Indicador de progreso mejorado */}
                      {tournament.status === 'upcoming' && (
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20 dark:border-gray-700/50">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">{t('registrations')}</span>
                              <span className="font-bold text-sm">{teamsCount}/{tournament.max_teams}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
                                  isFull ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                                  isAlmostFull ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                }`}
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              />
                            </div>
                            {isFull && (
                              <div className="flex items-center gap-1 mt-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">{t('complete')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🏷️ Badges para torneos sin imagen */}
                  {!tournament.tournament_info?.tournament_thumbnail && (
                    <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          {tournament.category && (
                            <Badge variant="outline" className="bg-white/90 dark:bg-slate-800/90 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 backdrop-blur-sm w-fit">
                              {tournament.category.name}
                            </Badge>
                          )}
                        </div>
                        <div>
                          {getStatusBadge(tournament.status)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 📋 Contenido principal mejorado */}
                  <CardContent className="p-7">
                    <div className="space-y-5">
                      {/* 🏆 Título mejorado */}
                      <div className="text-center">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-2">
                          {tournament.name}
                        </h3>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
                          <TrophyIcon className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {tournament.tournament_type === 'NINE_PLAYERS' ? t('nineTeams') : 
                             tournament.tournament_type === 'TWELVE_PLAYERS' ? t('twelveTeams') : t('sixteenTeams')}
                          </p>
                        </div>
                      </div>

                      {/* 📅 Fechas Mejoradas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-medium text-green-700 dark:text-green-300">{t('startDate')}</p>
                          </div>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                            {(() => {
                              const date = new Date(tournament.start_date + 'T00:00:00')
                              return date.toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short' 
                              })
                            })()}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-3 border border-red-100 dark:border-red-800 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <p className="text-xs font-medium text-red-700 dark:text-red-300">{t('endDate')}</p>
                          </div>
                          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                            {(() => {
                              const date = new Date(tournament.end_date + 'T00:00:00')
                              return date.toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short' 
                              })
                            })()}
                          </p>
                        </div>
                      </div>

                       {/* 📊 Estadísticas mejoradas */}
                       <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                         {/* Sponsors con logos */}
                         <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <StarIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                             <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('sponsors')}</p>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {tournament.tournament_sponsors && tournament.tournament_sponsors.length > 0 ? (
                               tournament.tournament_sponsors.map((ts: { sponsor?: { logo_url?: string; name?: string } }, index: number) => (
                                 <div key={index} className="relative h-8 w-8 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                                   {ts.sponsor?.logo_url ? (
                                     <Image
                                       src={ts.sponsor.logo_url}
                                       alt={ts.sponsor.name ?? ''}
                                       fill
                                       className="object-contain p-1"
                                       sizes="32px"
                                     />
                                   ) : (
                                     <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                                       <StarIcon className="h-4 w-4 text-gray-400" />
                                     </div>
                                   )}
                                 </div>
                               ))
                             ) : (
                               <p className="text-xs text-gray-400 dark:text-gray-500">{t('noSponsors')}</p>
                             )}
                           </div>
                         </div>

                         {/* Equipos */}
                         <div className="text-center group/stat">
                           <div className="flex items-center justify-center gap-2 mb-2">
                             <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl group-hover/stat:scale-110 transition-transform duration-300">
                               <UsersIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                             </div>
                             <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('teams')}</p>
                           </div>
                           <p className="text-xl font-bold text-gray-900 dark:text-white">
                             {teamsCount}
                             <span className="text-sm text-gray-500 dark:text-gray-400">/{tournament.max_teams}</span>
                           </p>
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              )
            })}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full p-6 mb-6">
                <TrophyIcon className="w-16 h-16 text-blue-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? t('noTournamentsFound')
                  : t('startFirstTournament')}
              </h3>
              
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? t('noTournamentsFoundDescription')
                  : t('startFirstTournamentDescription')}
              </p>

              {!searchQuery && selectedCategory === 'all' && selectedStatus === 'all' && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => router.push('/tournaments/create')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('createFirstTournament')}
                  </Button>
                </div>
              )}

              {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedStatus('all')
                  }}
                  className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {t('clearFilters')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}