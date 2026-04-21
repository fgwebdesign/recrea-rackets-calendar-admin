'use client'

import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Trophy, Users2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { FootballLeague } from '@/types/footballLeague'

export function FootballDashboardRegistration({ leagues, isLoading }: { leagues: FootballLeague[]; isLoading: boolean }) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const CARDS_PER_PAGE = 3
  const totalPages = Math.max(1, Math.ceil((leagues?.length || 0) / CARDS_PER_PAGE))
  const showSlider = (leagues?.length || 0) > CARDS_PER_PAGE

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-gray-500 text-sm">Cargando ligas…</div>
    )
  }

  if (!leagues?.length) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
        No hay ligas de fútbol todavía.{' '}
        <Link href="/football/leagues/create" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Crear primera liga
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      {showSlider && currentPage > 0 && (
        <button
          type="button"
          onClick={handlePrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {showSlider && currentPage < totalPages - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={sliderRef}
        onScroll={(e) => {
          if (sliderRef.current) {
            const p = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth)
            setCurrentPage(p)
          }
        }}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {Array.from({ length: totalPages }).map((_, pageIndex) => (
          <div
            key={pageIndex}
            className="flex-none w-full grid grid-cols-1 md:grid-cols-3 gap-6 snap-start px-1"
          >
            {leagues.slice(pageIndex * CARDS_PER_PAGE, (pageIndex + 1) * CARDS_PER_PAGE).map((league) => {
              const registered = league.registeredTeams ?? 0
              const max = league.team_size || 8
              const pct = max > 0 ? Math.round((registered / max) * 100) : 0
              return (
                <Link
                  key={league.id}
                  href={`/football/leagues/${league.id}`}
                  className="block rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50/80 dark:from-[#0E1629] dark:to-[#131d2e] p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Trophy className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{league.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0">
                      {league.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Users2 className="w-4 h-4" />
                    <span>
                      {registered} / {max} equipos
                    </span>
                  </div>
                  <Progress value={pct} className="h-2 mb-1" />
                  <p className="text-xs text-gray-400">{pct}% cupo</p>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
