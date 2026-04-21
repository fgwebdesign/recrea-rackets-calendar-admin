'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, Users, Info, ImageIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { FOOTBALL_TEAM_LOGOS_BUCKET, uploadFootballTeamLogo } from '@/lib/footballTeamLogosStorage'
import {
  FootballDraftTeamSlot,
  FootballLeagueFormData,
  FootballTournamentPhase
} from '@/types/footballLeague'
import { createFootballLeague } from '@/services/footballLeagueService'
import { toast } from '@/components/ui/use-toast'

const DEFAULT_SLOTS = ['09:00', '10:00', '11:00', '12:00']

function buildTeamSlots(size: number, prev: FootballDraftTeamSlot[]): FootballDraftTeamSlot[] {
  return Array.from({ length: size }, (_, i) => ({
    display_name: prev[i]?.display_name?.trim() || `Equipo ${i + 1}`,
    imageFile: prev[i]?.imageFile ?? null,
    imageUrl: prev[i]?.imageUrl ?? null,
    preview: prev[i]?.preview ?? null
  }))
}

const INITIAL: FootballLeagueFormData = {
  name: '',
  description: '',
  inscription_cost: 0,
  start_date: '',
  end_date: '',
  team_size: 8,
  frequency: 'weekly',
  tournament_phase: 'Apertura + Clausura',
  time_slots: DEFAULT_SLOTS
}

function calcSuggestedEndDate(startYmd: string, teamSize: number, phase: FootballTournamentPhase): string {
  const rounds = phase === 'Apertura + Clausura' ? (teamSize - 1) * 2 : teamSize - 1
  const [y, m, d] = startYmd.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const dayOfWeek = start.getDay()
  const daysToSaturday = (6 - dayOfWeek + 7) % 7
  const firstSaturday = addDays(start, daysToSaturday)
  const lastSaturday = addDays(firstSaturday, (rounds - 1) * 7)
  return format(lastSaturday, 'yyyy-MM-dd')
}

function LabelWithTooltip({
  htmlFor,
  label,
  tooltip
}: {
  htmlFor?: string
  label: string
  tooltip: string
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Label htmlFor={htmlFor} className="text-slate-700 dark:text-slate-300 font-medium">
        {label}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function DatePickerField({
  label,
  value,
  onChange,
  tooltip
}: {
  label: string
  value: string
  onChange: (val: string) => void
  tooltip: string
}) {
  const selected = value ? new Date(value + 'T12:00:00') : undefined

  return (
    <div>
      <LabelWithTooltip label={label} tooltip={tooltip} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal rounded-lg border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
            {selected ? format(selected, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => onChange(day ? format(day, 'yyyy-MM-dd') : '')}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const inputClassName =
  'bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary'

export interface FootballLeagueFormProps {
  step: number
  onStepChange: (step: number) => void
}

export function FootballLeagueForm({ step, onStepChange }: FootballLeagueFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FootballLeagueFormData>(INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestedEndDate, setSuggestedEndDate] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [teamSlots, setTeamSlots] = useState<FootballDraftTeamSlot[]>([])

  const set = (key: keyof FootballLeagueFormData, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  useEffect(() => {
    if (!form.start_date) {
      setSuggestedEndDate('')
      return
    }
    const suggested = calcSuggestedEndDate(form.start_date, form.team_size, form.tournament_phase)
    setSuggestedEndDate(suggested)
    setForm((prev) => ({ ...prev, end_date: prev.end_date || suggested }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.start_date, form.team_size, form.tournament_phase])

  const toggleSlot = (slot: string) => {
    const cur = form.time_slots
    set('time_slots', cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot].sort())
  }

  const matchdays = Math.max(form.team_size - 1, 1)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Archivo muy grande', description: 'Máximo 5MB', variant: 'destructive' })
        return
      }
      setImageFile(file)
      setImageUrl(null)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const validateStep1 = () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' })
      return false
    }
    if (!form.description.trim()) {
      toast({ title: 'Error', description: 'La descripción es obligatoria', variant: 'destructive' })
      return false
    }
    if (form.team_size < 2 || form.team_size > 32) {
      toast({ title: 'Error', description: 'Equipos máximos debe estar entre 2 y 32', variant: 'destructive' })
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!form.start_date || !form.end_date) {
      toast({ title: 'Error', description: 'Las fechas son obligatorias', variant: 'destructive' })
      return false
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast({ title: 'Error', description: 'La fecha de fin debe ser posterior al inicio', variant: 'destructive' })
      return false
    }
    if (form.time_slots.length === 0) {
      toast({ title: 'Error', description: 'Seleccioná al menos un horario', variant: 'destructive' })
      return false
    }
    if (teamSlots.length !== form.team_size) {
      toast({
        title: 'Error',
        description: `Tenés que definir los ${form.team_size} equipos (volvé un paso si cambiaste el cupo).`,
        variant: 'destructive'
      })
      return false
    }
    for (let i = 0; i < teamSlots.length; i++) {
      if (!teamSlots[i].display_name.trim()) {
        toast({
          title: 'Error',
          description: `Completá el nombre del equipo ${i + 1}`,
          variant: 'destructive'
        })
        return false
      }
    }
    return true
  }

  const handleContinue = async () => {
    if (!validateStep1()) return

    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('tournament-thumbnails').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const {
          data: { publicUrl }
        } = supabase.storage.from('tournament-thumbnails').getPublicUrl(fileName)
        setImageUrl(publicUrl)
        setImageFile(null)
      } catch (err) {
        console.error(err)
        toast({ title: 'Error', description: 'Error al subir la imagen', variant: 'destructive' })
        return
      }
    }

    setTeamSlots((prev) => buildTeamSlots(form.team_size, prev))
    onStepChange(2)
  }

  const updateTeamSlot = (index: number, patch: Partial<FootballDraftTeamSlot>) => {
    setTeamSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const onTeamLogoPick = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'Máximo 5MB por escudo', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () =>
      updateTeamSlot(index, {
        imageFile: file,
        imageUrl: null,
        preview: reader.result as string
      })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const submit = async () => {
    if (!validateStep2()) return
    setIsSubmitting(true)
    try {
      const teamsPayload: { display_name: string; image_url: string | null }[] = []
      for (const slot of teamSlots) {
        let url: string | null = slot.imageUrl
        if (slot.imageFile) {
          url = await uploadFootballTeamLogo(slot.imageFile)
        }
        teamsPayload.push({
          display_name: slot.display_name.trim(),
          image_url: url && url.trim() ? url.trim() : null
        })
      }

      await createFootballLeague({
        name: form.name,
        description: form.description,
        inscription_cost: form.inscription_cost,
        start_date: form.start_date,
        end_date: form.end_date,
        team_size: form.team_size,
        frequency: 'weekly',
        tournament_phase: form.tournament_phase,
        time_slots: form.time_slots,
        image_url: imageUrl || undefined,
        teams: teamsPayload
      })
      toast({ title: 'Liga creada', description: `${form.name} fue creada exitosamente` })
      router.push('/football/leagues')
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al crear la liga',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const phaseButtonClass = (active: boolean) =>
    cn(
      'p-3 rounded-lg transition-all duration-200 border-2 min-w-[120px] flex-1 text-base font-medium',
      active
        ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:scale-[1.02] hover:shadow-sm'
    )

  const slotButtonClass = (active: boolean) =>
    cn(
      'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200',
      active
        ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:scale-[1.02] hover:shadow-sm'
    )

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 bg-background/50 rounded-lg border border-border/50">
        {step === 1 && (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Información básica de la liga
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <LabelWithTooltip
                  htmlFor="fb-name"
                  label="Nombre de la liga"
                  tooltip="Nombre identificativo de la liga de fútbol"
                />
                <Input
                  id="fb-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ej: Liga de Verano 2026"
                  className={inputClassName}
                />
              </div>

              <div>
                <LabelWithTooltip
                  htmlFor="fb-desc"
                  label="Descripción"
                  tooltip="Información adicional sobre la liga"
                />
                <Textarea
                  id="fb-desc"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe los detalles importantes de la liga..."
                  className={cn('min-h-[100px]', inputClassName)}
                />
              </div>

              <div>
                <LabelWithTooltip label="Tipo de torneo" tooltip="Apertura, Clausura o ambas rondas con tabla acumulada" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Apertura', 'Clausura', 'Apertura + Clausura'] as FootballTournamentPhase[]).map((phase) => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => set('tournament_phase', phase)}
                      className={phaseButtonClass(form.tournament_phase === phase)}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-start gap-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                  <span>
                    Con <strong className="text-slate-800 dark:text-slate-200">{form.team_size} equipos</strong> se
                    generarán{' '}
                    <strong className="text-emerald-700 dark:text-emerald-300">
                      {form.tournament_phase === 'Apertura + Clausura'
                        ? `${matchdays * 2} fechas (${matchdays} + ${matchdays})`
                        : `${matchdays} fechas`}
                    </strong>{' '}
                    — {form.tournament_phase}
                  </span>
                </div>
              </div>

              <div>
                <LabelWithTooltip label="Imagen de la liga" tooltip="Imagen representativa de la liga" />
                <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex flex-col items-center">
                    {previewUrl ? (
                      <div className="relative group">
                        <img src={previewUrl} alt="Vista previa" className="h-40 w-40 object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null)
                              setPreviewUrl(null)
                              setImageUrl(null)
                            }}
                            className="text-white hover:text-red-400 text-sm"
                          >
                            Cambiar imagen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full cursor-pointer">
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Click para subir o arrastrar imagen
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG (max. 5MB)</p>
                          <p className="text-xs text-purple-500 dark:text-purple-400 mt-2 text-center">
                            Recomendado: 1080x1080px (formato cuadrado)
                            <br />
                            Esto asegurará que la imagen se vea perfecta.
                          </p>
                        </div>
                        <Input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <LabelWithTooltip
                    htmlFor="fb-cost"
                    label="Costo de inscripción"
                    tooltip="Costo por equipo para participar en la liga"
                  />
                  <Input
                    id="fb-cost"
                    type="number"
                    min={0}
                    value={form.inscription_cost}
                    onChange={(e) => set('inscription_cost', Number(e.target.value))}
                    placeholder="Ej: 5000"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <LabelWithTooltip
                    htmlFor="fb-teams"
                    label="Equipos máximos"
                    tooltip="Cantidad máxima de equipos en la liga"
                  />
                  <Input
                    id="fb-teams"
                    type="number"
                    min={2}
                    max={32}
                    value={form.team_size}
                    onChange={(e) => set('team_size', parseInt(e.target.value, 10) || 8)}
                    placeholder="Ej: 8"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push('/football/leagues')}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleContinue} className="bg-primary hover:bg-primary/90">
                  Continuar
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Fechas y horarios</h2>
              <p className="text-sm text-muted-foreground">Calendario de partidos y franjas horarias rotativas.</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DatePickerField
                  label="Fecha de inicio"
                  tooltip="Primer día hábil del calendario de la liga"
                  value={form.start_date}
                  onChange={(v) => {
                    setForm((prev) => ({ ...prev, start_date: v, end_date: '' }))
                  }}
                />
                <div className="space-y-2">
                  <DatePickerField
                    label="Fecha de fin"
                    tooltip="Última fecha del calendario regular"
                    value={form.end_date}
                    onChange={(v) => set('end_date', v)}
                  />
                  {suggestedEndDate && form.end_date && form.end_date !== suggestedEndDate && (
                    <button
                      type="button"
                      onClick={() => set('end_date', suggestedEndDate)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline text-left"
                    >
                      Sugerida: {format(new Date(suggestedEndDate + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })} — clic
                      para aplicar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <CalendarDays className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <span>
                  Los partidos siempre serán los <strong className="text-slate-800 dark:text-slate-200">sábados</strong>.
                </span>
              </div>

              <div>
                <LabelWithTooltip
                  label="Horarios rotativos"
                  tooltip="Se rotarán automáticamente entre equipos en cada fecha"
                />
                <p className="text-xs text-muted-foreground mb-3">
                  Seleccioná los horarios disponibles (se rotarán automáticamente entre equipos).
                </p>
                <div className="flex flex-wrap gap-3">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map((slot) => {
                    const active = form.time_slots.includes(slot)
                    return (
                      <button key={slot} type="button" onClick={() => toggleSlot(slot)} className={slotButtonClass(active)}>
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Equipos de la liga</h3>
                <p className="text-sm text-muted-foreground">
                  Un cupo por equipo ({form.team_size} en total). Nombre obligatorio; escudo opcional (bucket{' '}
                  <span className="font-mono text-xs">{FOOTBALL_TEAM_LOGOS_BUCKET}</span>).
                </p>
                <div className="max-h-[min(55vh,480px)] overflow-y-auto space-y-4 pr-1">
                  {teamSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`fb-team-name-${index}`} className="text-slate-700 dark:text-slate-300">
                          Equipo {index + 1}
                        </Label>
                        <Input
                          id={`fb-team-name-${index}`}
                          value={slot.display_name}
                          onChange={(e) => updateTeamSlot(index, { display_name: e.target.value })}
                          placeholder={`Nombre equipo ${index + 1}`}
                          className={inputClassName}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Escudo</span>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                            {slot.preview ? (
                              <img src={slot.preview} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <label className="cursor-pointer">
                              <span className="text-xs text-primary hover:underline">Subir imagen</span>
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(ev) => onTeamLogoPick(index, ev)}
                              />
                            </label>
                            {(slot.preview || slot.imageUrl) && (
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:underline text-left"
                                onClick={() =>
                                  updateTeamSlot(index, { imageFile: null, imageUrl: null, preview: null })
                                }
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => onStepChange(1)} className="sm:mr-auto">
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 sm:ml-auto"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Creando…
                    </span>
                  ) : (
                    'Crear liga'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
