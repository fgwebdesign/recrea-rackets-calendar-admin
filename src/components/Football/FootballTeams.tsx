'use client'

import { useState } from 'react'
import { FootballLeagueTeam } from '@/types/footballLeague'
import { updateFootballInscriptionPayment, removeTeamFromFootballLeague } from '@/services/footballLeagueService'
import { toast } from '@/components/ui/use-toast'
import { Users, Trash2, CheckCircle, Clock, Pencil } from 'lucide-react'
import { FootballTeamEditDialog } from '@/components/Football/FootballTeamEditDialog'

function teamLabel(team: FootballLeagueTeam['team']) {
  if (team.display_name?.trim()) return team.display_name.trim()
  const p1 = team.player1 ? `${team.player1.first_name} ${team.player1.last_name}` : ''
  const p2 = team.player2 ? `${team.player2.first_name} ${team.player2.last_name}` : ''
  return [p1, p2].filter(Boolean).join(' / ') || 'Sin nombre'
}

export function FootballTeams({
  teams,
  maxTeams,
  leagueId,
  hasGeneratedMatches,
  onUpdate
}: {
  teams: FootballLeagueTeam[]
  maxTeams: number
  leagueId: string
  hasGeneratedMatches: boolean
  onUpdate: () => void
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editTeam, setEditTeam] = useState<FootballLeagueTeam | null>(null)

  const togglePaid = async (lt: FootballLeagueTeam) => {
    setLoadingId(lt.league_team_id)
    try {
      await updateFootballInscriptionPayment(lt.league_team_id, !lt.inscription_paid)
      toast({ title: 'Pago actualizado' })
      onUpdate()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' })
    } finally {
      setLoadingId(null)
    }
  }

  const removeTeam = async (lt: FootballLeagueTeam) => {
    if (!confirm(`¿Eliminar el equipo "${teamLabel(lt.team)}" de la liga?`)) return
    setLoadingId(lt.league_team_id)
    try {
      await removeTeamFromFootballLeague(leagueId, lt.team.id)
      toast({ title: 'Equipo removido' })
      onUpdate()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' })
    } finally {
      setLoadingId(null)
    }
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
        <Users className="w-12 h-12 opacity-30" />
        <p className="text-sm">No hay equipos inscritos aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <FootballTeamEditDialog
        open={editTeam !== null}
        onOpenChange={(o) => !o && setEditTeam(null)}
        leagueId={leagueId}
        leagueTeam={editTeam}
        onSaved={() => onUpdate()}
      />
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
        <span>{teams.length} de {maxTeams} equipos inscriptos</span>
        <span>{teams.filter((t) => t.inscription_paid).length} pagados</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(teams.length / maxTeams) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.map((lt) => (
          <div
            key={lt.league_team_id}
            className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-green-200/50 dark:border-green-800/40">
                {lt.team.image_url ? (
                  <img src={lt.team.image_url} alt="" className="w-full h-full object-contain bg-white dark:bg-gray-900" />
                ) : (
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {teamLabel(lt.team)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditTeam(lt)}
                disabled={loadingId === lt.league_team_id}
                title="Editar nombre y escudo"
                className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => togglePaid(lt)}
                disabled={loadingId === lt.league_team_id}
                title={lt.inscription_paid ? 'Marcar como pendiente' : 'Confirmar pago'}
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  lt.inscription_paid
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}
              >
                {lt.inscription_paid ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Pagado</>
                ) : (
                  <><Clock className="w-3.5 h-3.5" /> Pendiente</>
                )}
              </button>

              {!hasGeneratedMatches && (
                <button
                  onClick={() => removeTeam(lt)}
                  disabled={loadingId === lt.league_team_id}
                  title="Eliminar equipo"
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
