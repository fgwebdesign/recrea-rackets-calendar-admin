'use client'

import { ArrowLeft, CalendarDays, Users } from 'lucide-react'
import { FootballLeague } from '@/types/footballLeague'

const STATUS_STYLES: Record<string, string> = {
  Inscribiendo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Activa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Finalizada: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

function fmt(date: string) {
  return new Date(date.replace('Z', '')).toLocaleDateString('es-UY', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
  })
}

export function FootballLeagueHeader({
  league,
  onBack
}: {
  league: FootballLeague
  onBack: () => void
}) {
  return (
    <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a ligas de fútbol
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {league.image_url ? (
              <img
                src={league.image_url}
                alt={league.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/30 shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shadow">
                <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" strokeWidth="1.5" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Liga · Fútbol</p>
              <h1 className="text-2xl font-bold">{league.name}</h1>
              {league.description && (
                <p className="text-white/80 text-sm mt-0.5 line-clamp-1">{league.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_STYLES[league.status]}`}>
              {league.status}
            </span>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-sm">
              <Users className="w-4 h-4" />
              <span>{league.registeredTeams ?? 0} / {league.team_size} equipos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>{fmt(league.start_date)} → {fmt(league.end_date)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
