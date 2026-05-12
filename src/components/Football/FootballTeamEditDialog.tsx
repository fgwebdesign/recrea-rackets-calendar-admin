'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageIcon, Loader2, Upload } from 'lucide-react'
import { FootballLeagueTeam } from '@/types/footballLeague'
import { updateFootballTeam } from '@/services/footballLeagueService'
import {
  MAX_TEAM_DISPLAY_NAME_LEN,
  uploadFootballTeamLogo,
  validateTeamLogoFile
} from '@/lib/footballTeamLogosStorage'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function defaultTeamName(team: FootballLeagueTeam['team']) {
  if (team.display_name?.trim()) return team.display_name.trim()
  const p1 = team.player1 ? `${team.player1.first_name} ${team.player1.last_name}` : ''
  const p2 = team.player2 ? `${team.player2.first_name} ${team.player2.last_name}` : ''
  return [p1, p2].filter(Boolean).join(' / ') || 'Sin nombre'
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leagueId: string
  leagueTeam: FootballLeagueTeam | null
  onSaved: () => void
}

export function FootballTeamEditDialog({ open, onOpenChange, leagueId, leagueTeam, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [displayName, setDisplayName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (!open || !leagueTeam) return
    dragDepth.current = 0
    setDragActive(false)
    setDisplayName(defaultTeamName(leagueTeam.team))
    setImageUrl(leagueTeam.team.image_url?.trim() ?? '')
  }, [open, leagueTeam])

  const processFile = useCallback(async (file: File) => {
    const bad = validateTeamLogoFile(file)
    if (bad) {
      toast({ title: 'Archivo no válido', description: bad, variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const url = await uploadFootballTeamLogo(file)
      setImageUrl(url)
      toast({ title: 'Escudo actualizado' })
    } catch (err) {
      toast({
        title: 'No se pudo subir',
        description: err instanceof Error ? err.message : 'Probá con otra imagen',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  const openPicker = () => {
    if (!uploading) fileRef.current?.click()
  }

  const handleSave = async () => {
    if (!leagueTeam) return
    const name = displayName.trim()
    if (!name) {
      toast({ title: 'Nombre requerido', variant: 'destructive' })
      return
    }
    if (name.length > MAX_TEAM_DISPLAY_NAME_LEN) {
      toast({
        title: 'Nombre muy largo',
        description: `Máximo ${MAX_TEAM_DISPLAY_NAME_LEN} caracteres`,
        variant: 'destructive'
      })
      return
    }
    setSaving(true)
    try {
      await updateFootballTeam(leagueId, leagueTeam.team.id, {
        display_name: name,
        image_url: imageUrl.trim() === '' ? null : imageUrl.trim()
      })
      toast({ title: 'Equipo actualizado' })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo guardar',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 pt-6 pb-5 text-white">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <ImageIcon className="h-4 w-4" aria-hidden />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">Editar equipo</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-emerald-100/90">
              Nombre en la liga y escudo. Subí el logo cuando lo tengas; se guarda al tocar Guardar.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="ft-edit-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nombre del equipo
            </Label>
            <Input
              id="ft-edit-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Los Pibes FC"
              className="h-11 rounded-xl border-border/80 bg-muted/30 focus-visible:ring-emerald-600/30"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Escudo</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="sr-only"
              onChange={handleFileInput}
              tabIndex={-1}
              aria-hidden
            />

            <div
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openPicker()
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                dragDepth.current += 1
                setDragActive(true)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault()
                dragDepth.current = Math.max(0, dragDepth.current - 1)
                if (dragDepth.current === 0) setDragActive(false)
              }}
              onDrop={handleDrop}
              className={cn(
                'relative flex min-h-[168px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2',
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40'
                  : 'border-muted-foreground/20 bg-muted/20 hover:border-emerald-400/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
                uploading && 'pointer-events-none opacity-70'
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
                  <p className="text-sm font-medium text-muted-foreground">Subiendo escudo…</p>
                </div>
              ) : imageUrl ? (
                <div className="flex w-full flex-col items-center gap-4 p-5">
                  <div className="relative">
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900">
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-contain p-1"
                        sizes="96px"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
                      <Upload className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Tocá o arrastrá para <span className="font-medium text-foreground">cambiar el escudo</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Upload className="h-6 w-6" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Arrastrá el logo acá</p>
                    <p className="text-xs text-muted-foreground">o tocá para elegir · PNG, JPG o WebP</p>
                  </div>
                </div>
              )}
            </div>

            {imageUrl && !uploading ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setImageUrl('')
                }}
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
              >
                Quitar escudo
              </button>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-emerald-600 px-6 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
