'use client'

import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Loader2, Mail, UserCheck, Users } from 'lucide-react'
import { getFootballTeamMembers } from '@/services/footballLeagueService'
import { FootballTeamMember } from '@/types/footballLeague'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
function memberName(m: FootballTeamMember) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ').trim()
  if (full) return full
  if (m.email) return m.email.split('@')[0]
  return 'Usuario'
}

function memberInitials(m: FootballTeamMember) {
  const a = m.first_name?.charAt(0) ?? ''
  const b = m.last_name?.charAt(0) ?? ''
  const init = `${a}${b}`.toUpperCase()
  return init || (m.email?.charAt(0).toUpperCase() ?? '?')
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string | null
  teamLabel: string
  teamImageUrl?: string | null
}

export function FootballTeamMembersDialog({
  open,
  onOpenChange,
  teamId,
  teamLabel,
  teamImageUrl
}: Props) {
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<FootballTeamMember[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getFootballTeamMembers(teamId)
      setMembers(data.members ?? [])
    } catch (e) {
      setMembers([])
      setError(e instanceof Error ? e.message : 'No se pudo cargar el plantel')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    if (open && teamId) load()
    if (!open) {
      setMembers([])
      setError(null)
    }
  }, [open, teamId, load])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200/60 bg-white p-1 shadow-sm dark:border-emerald-800/40 dark:bg-gray-900">
              {teamImageUrl ? (
                <img src={teamImageUrl} alt="" className="h-full w-full rounded-full object-contain" />
              ) : (
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="truncate text-lg">Plantel — {teamLabel}</DialogTitle>
              <DialogDescription>
                {loading
                  ? 'Cargando jugadores…'
                  : `${members.length} ${members.length === 1 ? 'jugador inscripto' : 'jugadores inscriptos'}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm">Obteniendo plantel…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nadie se unió a este equipo desde el portal aún</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3 dark:border-gray-700/50 dark:bg-gray-800/50"
                >
                  {m.profile_photo ? (
                    <img
                      src={m.profile_photo}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white ring-2 ring-white dark:ring-gray-700">
                      {memberInitials(m)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{memberName(m)}</p>
                      {m.role === 'captain' && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                          <UserCheck className="h-3 w-3" />
                          Capitán
                        </span>
                      )}
                    </div>
                    {m.email && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        {m.email}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/80">
                      <Calendar className="h-3 w-3" />
                      Unido el {format(parseISO(m.joined_at), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
