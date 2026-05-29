'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ListFilter } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(matches.length / 4) || 1

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
  }, [matches.length])

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
      <div className="flex justify-end px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/football/leagues')}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <ListFilter className="h-4 w-4 shrink-0" />
          Ver ligas
        </button>
      </div>

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
                className="flex-none w-full grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6 2xl:grid-cols-4 2xl:gap-4 snap-start"
              >
                {matches.slice(pageIndex * 4, (pageIndex + 1) * 4).map((match) => (
                  <article
                    key={match.id}
                    className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/60 dark:bg-[#131c2e]"
                  >
                    <header className="space-y-1 border-b border-border/60 bg-muted/25 px-4 py-3 dark:bg-white/[0.03]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Liga</p>
                      <h3
                        className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
                        title={match.league_name}
                      >
                        {match.league_name}
                      </h3>
                    </header>

                    <div className="flex flex-1 flex-col justify-center gap-5 px-4 py-6">
                      <div className="min-h-[2.75rem] text-center">
                        <p
                          className="text-[15px] font-semibold leading-snug text-foreground sm:text-base"
                          title={match.team1}
                        >
                          {match.team1}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 px-1">
                        <div className="h-px flex-1 bg-border dark:bg-gray-600/50" />
                        <span className="shrink-0 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                          VS
                        </span>
                        <div className="h-px flex-1 bg-border dark:bg-gray-600/50" />
                      </div>
                      <div className="min-h-[2.75rem] text-center">
                        <p
                          className="text-[15px] font-semibold leading-snug text-foreground sm:text-base"
                          title={match.team2}
                        >
                          {match.team2}
                        </p>
                      </div>
                    </div>

                    <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 text-xs dark:bg-white/[0.02]">
                      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600/70 dark:text-emerald-400/70" />
                        <span className="truncate font-medium tabular-nums text-foreground/90">
                          {match.time_slot ? `${match.time_slot} h` : `${formatDateTime(match.match_date).time} h`}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-emerald-600/70 dark:text-emerald-400/70" />
                        <span className="font-medium tabular-nums text-foreground/90">
                          {formatDateTime(match.match_date).date}
                        </span>
                      </div>
                    </footer>
                  </article>
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
    </div>
  )
}
