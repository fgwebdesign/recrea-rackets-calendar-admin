'use client'

import { useState } from 'react'
import { FootballLeagueTeam } from '@/types/footballLeague'
import { updateFootballInscriptionPayment, removeTeamFromFootballLeague } from '@/services/footballLeagueService'
import { toast } from '@/components/ui/use-toast'
import { Users, Trash2, CheckCircle, Clock, Pencil, UserCircle2 } from 'lucide-react'
import { FootballTeamEditDialog } from '@/components/Football/FootballTeamEditDialog'
import { FootballTeamMembersDialog } from '@/components/Football/FootballTeamMembersDialog'

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
  const [membersTeam, setMembersTeam] = useState<FootballLeagueTeam | null>(null)

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
      <FootballTeamMembersDialog
        open={membersTeam !== null}
        onOpenChange={(o) => !o && setMembersTeam(null)}
        teamId={membersTeam?.team.id ?? null}
        teamLabel={membersTeam ? teamLabel(membersTeam.team) : ''}
        teamImageUrl={membersTeam?.team.image_url}
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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {teams.map((lt) => (
          <div
            key={lt.league_team_id}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700/50 dark:bg-gray-800/60 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-green-200/50 bg-green-100 dark:border-green-800/40 dark:bg-green-900/30">
                {lt.team.image_url ? (
                  <img src={lt.team.image_url} alt="" className="h-full w-full object-contain bg-white dark:bg-gray-900" />
                ) : (
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {teamLabel(lt.team)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              <button
                type="button"
                onClick={() => setMembersTeam(lt)}
                disabled={loadingId === lt.league_team_id}
                className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                Ver plantel
              </button>
              <button
                type="button"
                onClick={() => setEditTeam(lt)}
                disabled={loadingId === lt.league_team_id}
                className="flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1.5 text-xs font-medium text-violet-800 transition-colors hover:bg-violet-200 disabled:opacity-50 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => togglePaid(lt)}
                disabled={loadingId === lt.league_team_id}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  lt.inscription_paid
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}
              >
                {lt.inscription_paid ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Inscripción pagada
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Marcar pago
                  </>
                )}
              </button>

              {!hasGeneratedMatches && (
                <button
                  type="button"
                  onClick={() => removeTeam(lt)}
                  disabled={loadingId === lt.league_team_id}
                  className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  Quitar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
