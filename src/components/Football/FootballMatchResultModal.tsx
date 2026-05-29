'use client'

import { useState } from 'react'
import { FootballMatch } from '@/types/footballLeague'
import { updateFootballMatchResult } from '@/services/footballLeagueService'
import { toast } from '@/components/ui/use-toast'
import { X, Users } from 'lucide-react'

export function FootballMatchResultModal({
  match,
  onClose,
  onSuccess
}: {
  match: FootballMatch
  onClose: () => void
  onSuccess: () => void
}) {
  const [homeGoals, setHomeGoals] = useState(match.home_goals ?? 0)
  const [awayGoals, setAwayGoals] = useState(match.away_goals ?? 0)
  const [walkover, setWalkover] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateFootballMatchResult(match.id, homeGoals, awayGoals, walkover)
      toast({ title: 'Resultado guardado' })
      onSuccess()
      onClose()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0E1629] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cargar Resultado</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Equipos y goles */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            {/* Local */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center line-clamp-2">
                {match.team1_label || match.team1_name || 'Local'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHomeGoals((v) => Math.max(0, v - 1))}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-lg flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-3xl font-bold text-gray-900 dark:text-white w-10 text-center">{homeGoals}</span>
                <button
                  onClick={() => setHomeGoals((v) => v + 1)}
                  className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">vs</span>

            {/* Visitante */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center line-clamp-2">
                {match.team2_label || match.team2_name || 'Visitante'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAwayGoals((v) => Math.max(0, v - 1))}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-lg flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-3xl font-bold text-gray-900 dark:text-white w-10 text-center">{awayGoals}</span>
                <button
                  onClick={() => setAwayGoals((v) => v + 1)}
                  className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Walkover */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <input
              type="checkbox"
              checked={walkover}
              onChange={(e) => setWalkover(e.target.checked)}
              className="w-4 h-4 accent-green-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Walkover (W.O.)</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar resultado'}
          </button>
        </div>
      </div>
    </div>
  )
}
