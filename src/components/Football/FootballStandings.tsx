'use client'

import { FootballStanding } from '@/types/footballLeague'

function teamLabel(s: FootballStanding) {
  const t = s.team
  if (!t) return '—'
  if (t.display_name?.trim()) return t.display_name.trim()
  const p1 = t.player1 ? `${t.player1.first_name} ${t.player1.last_name}` : ''
  const p2 = t.player2 ? `${t.player2.first_name} ${t.player2.last_name}` : ''
  return [p1, p2].filter(Boolean).join(' / ') || '—'
}


export function FootballStandings({
  standings,
  isLoading
}: {
  standings: FootballStanding[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    )
  }

  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
        <p className="text-sm">La tabla de posiciones aparecerá cuando se carguen resultados</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-600 text-white">
            <th className="text-left px-4 py-3 font-semibold w-8">#</th>
            <th className="text-left px-4 py-3 font-semibold">Equipo</th>
            <th className="text-center px-3 py-3 font-semibold">Pj</th>
            <th className="text-center px-3 py-3 font-semibold">Pg</th>
            <th className="text-center px-3 py-3 font-semibold">Pe</th>
            <th className="text-center px-3 py-3 font-semibold">Pp</th>
            <th className="text-center px-3 py-3 font-semibold">GF</th>
            <th className="text-center px-3 py-3 font-semibold">GC</th>
            <th className="text-center px-3 py-3 font-semibold">Dif</th>
            <th className="text-center px-3 py-3 font-semibold text-yellow-200">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const pos = i + 1
            const isTop3 = pos <= 3
            return (
              <tr
                key={s.id}
                className={`border-t border-gray-100 dark:border-gray-700/50 transition-colors ${
                  isTop3
                    ? 'bg-green-50/60 dark:bg-green-900/10'
                    : 'bg-white dark:bg-[#0E1629] hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                <td className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
                  {pos}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  {teamLabel(s)}
                </td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{s.pj ?? s.matches_played}</td>
                <td className="px-3 py-3 text-center text-green-700 dark:text-green-400 font-medium">{s.pg ?? s.wins}</td>
                <td className="px-3 py-3 text-center text-yellow-600 dark:text-yellow-400 font-medium">{s.pe ?? s.draws}</td>
                <td className="px-3 py-3 text-center text-red-600 dark:text-red-400 font-medium">{s.pp ?? s.losses}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{s.gf ?? s.goals_for}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{s.gc ?? s.goals_against}</td>
                <td className={`px-3 py-3 text-center font-medium ${
                  (s.dif ?? s.goal_difference) > 0
                    ? 'text-green-600 dark:text-green-400'
                    : (s.dif ?? s.goal_difference) < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500'
                }`}>
                  {(s.dif ?? s.goal_difference) > 0 ? '+' : ''}{s.dif ?? s.goal_difference}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-600 text-white font-bold text-sm">
                    {s.pts ?? s.points}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 dark:text-gray-500 p-3">
        Desempate: diferencia de goles → goles a favor
      </p>
    </div>
  )
}
