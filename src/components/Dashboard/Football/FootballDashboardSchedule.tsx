'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ListFilter } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/Spinner'
import { EmptySchedule } from '@/components/Dashboard/EmptySchedule'
import { getFootballUpcomingMatches } from '@/services/footballLeagueService'

export type FootballUpcomingMatch = {
  id: string
  league_id: string
  league_name: string
  team1: string
  team2: string
  match_date: string | null
  time_slot: string | null
  court_name: string | null
}

function formatDateTime(dateTime: string | null) {
  if (!dateTime) return { time: '—', date: '—' }
  const date = new Date(dateTime)
  return {
    time: new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }).format(date),
    date: new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date)
  }
}

export function FootballDashboardSchedule() {
  const router = useRouter()
  const [matches, setMatches] = useState<FootballUpcomingMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const leagueTabs = useMemo(() => {
    const names = new Map<string, string>()
    matches.forEach((m) => names.set(m.league_id, m.league_name))
    return Array.from(names.entries()).map(([id, name]) => ({ id, name }))
  }, [matches])

  const filtered = useMemo(() => {
    if (selectedLeague === 'all') return matches
    return matches.filter((m) => m.league_id === selectedLeague)
  }, [matches, selectedLeague])

  const totalPages = Math.ceil(filtered.length / 4) || 1

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getFootballUpcomingMatches(48)
      setMatches(data.matches || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar partidos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setCurrentPage(0)
    if (sliderRef.current) sliderRef.current.scrollTo({ left: 0 })
  }, [selectedLeague, filtered.length])

  const handlePrevious = () => {
    if (sliderRef.current && currentPage > 0) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      sliderRef.current.scrollTo({ left: newPage * sliderRef.current.offsetWidth, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (sliderRef.current && currentPage < totalPages - 1) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      sliderRef.current.scrollTo({ left: newPage * sliderRef.current.offsetWidth, behavior: 'smooth' })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (sliderRef.current) {
      const newPage = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth)
      setCurrentPage(newPage)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 min-h-[200px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 p-8 text-center space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
        <button
          type="button"
          onClick={() => load()}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!matches.length) {
    return (
      <EmptySchedule message="Generá el fixture desde una liga de fútbol para ver aquí los próximos partidos." />
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      <div className="px-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <Tabs value={selectedLeague} onValueChange={setSelectedLeague}>
            <TabsList className="flex-wrap h-auto gap-1 py-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todas las ligas
              </TabsTrigger>
              {leagueTabs.map(({ id, name }) => (
                <TabsTrigger key={id} value={id} className="text-xs sm:text-sm max-w-[140px] truncate">
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={() => router.push('/football/leagues')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white shrink-0
                       bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                       rounded-lg transition-colors shadow-sm"
            >
              <ListFilter className="w-4 h-4" />
              Ver ligas de fútbol
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 pb-8 text-center text-gray-500 text-sm">No hay partidos programados para esta liga.</div>
      ) : (
        <div className="relative">
          {currentPage > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full
                     bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full
                     bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div
                key={pageIndex}
                className="flex-none w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 p-6 snap-start"
              >
                {filtered.slice(pageIndex * 4, (pageIndex + 1) * 4).map((match) => (
                  <div
                    key={match.id}
                    className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1D283A]/80 dark:to-[#1D283A]
                           rounded-2xl p-5 hover:shadow-xl transition-all duration-300
                           border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-sm"
                  >
                    <div className="absolute -top-3 left-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg
                                 bg-gradient-to-r from-green-600 to-emerald-600"
                      >
                        {match.league_name}
                      </span>
                    </div>
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-900/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/30">
                        {match.court_name || 'Sin cancha'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-6">
                      <div className="space-y-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={match.team1}>
                            {match.team1}
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-200 dark:border-gray-700/30" />
                            </div>
                            <div className="relative flex justify-center">
                              <span className="px-3 text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full py-1 shadow-lg">
                                VS
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={match.team2}>
                            {match.team2}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {match.time_slot ? `${match.time_slot}h` : formatDateTime(match.match_date).time + 'h'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDateTime(match.match_date).date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-4">
              {Array.from({ length: totalPages }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentPage === index ? 'bg-green-600 dark:bg-green-500 w-4' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
