'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/contexts/TranslationContext'
import {
  CalendarIcon,
  CalendarRange,
  ChevronDown,
  Clock,
  XCircle,
  Sparkles,
} from 'lucide-react'

interface CalendarFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void
  onQuickFilterChange: (filter: string) => void
  /** Sincronizar desde el padre (p. ej. currentFilters del hook) para que el estado persista tras loading que desmonta el componente. */
  activeDateRange?: { start_date?: string; end_date?: string; date_range?: string }
  className?: string
}

const CLEAR_KEY = 'clear'

const PRESET_KEYS = ['this_month', 'next_month', 'this_year', 'upcoming'] as const

export default function CalendarFilter({
  onDateRangeChange,
  onQuickFilterChange,
  activeDateRange,
  className,
}: CalendarFilterProps) {
  const t = useTranslations('tournaments')
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(() => {
    if (activeDateRange?.start_date) {
      const d = new Date(activeDateRange.start_date + 'T00:00:00')
      return isNaN(d.getTime()) ? null : d
    }
    return null
  })
  const [endDate, setEndDate] = useState<Date | null>(() => {
    if (activeDateRange?.end_date) {
      const d = new Date(activeDateRange.end_date + 'T00:00:00')
      return isNaN(d.getTime()) ? null : d
    }
    return null
  })
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>(() => {
    if (activeDateRange?.date_range && PRESET_KEYS.includes(activeDateRange.date_range as (typeof PRESET_KEYS)[number])) {
      return activeDateRange.date_range
    }
    return ''
  })

  const quickFilters: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'this_month', label: t('thisMonth'), icon: <CalendarIcon className="h-4 w-4" /> },
    { key: 'next_month', label: t('nextMonth'), icon: <CalendarRange className="h-4 w-4" /> },
    { key: 'this_year', label: t('thisYear'), icon: <Sparkles className="h-4 w-4" /> },
    { key: 'upcoming', label: t('upcoming'), icon: <Clock className="h-4 w-4" /> },
  ]

  const handlePreset = (key: string) => {
    if (key === CLEAR_KEY) {
      setStartDate(null)
      setEndDate(null)
      setActiveQuickFilter('')
      onDateRangeChange(null, null)
      onQuickFilterChange('')
    } else {
      setStartDate(null)
      setEndDate(null)
      setActiveQuickFilter(key)
      onQuickFilterChange(key)
    }
    setOpen(false)
  }

  // Solo actualizar estado local; no disparar filtro hasta que el usuario pulse "Aplicar"
  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    const from = range?.from ?? null
    const to = range?.to ?? null
    const start = from && to ? (from <= to ? from : to) : from
    const end = from && to ? (from <= to ? to : from) : to
    setStartDate(start)
    setEndDate(end ?? null)
    setActiveQuickFilter('')
  }

  const applyRange = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate)
      onQuickFilterChange('')
      setOpen(false)
    }
  }

  const clearAll = () => {
    setStartDate(null)
    setEndDate(null)
    setActiveQuickFilter('')
    onDateRangeChange(null, null)
    onQuickFilterChange('')
    setOpen(false)
  }

  const hasActive = activeQuickFilter || startDate || endDate
  const hasRangeComplete = startDate && endDate
  const rangeValue = hasRangeComplete ? { from: startDate, to: endDate } : startDate ? { from: startDate, to: undefined } : undefined

  const triggerLabel = activeQuickFilter
    ? quickFilters.find((f) => f.key === activeQuickFilter)?.label ?? t('dateFilter')
    : hasRangeComplete
      ? `${format(startDate, 'd MMM', { locale: es })} – ${format(endDate, 'd MMM', { locale: es })}`
      : startDate
        ? `${format(startDate, 'd MMM', { locale: es })} – ${t('selectEnd')}`
        : t('selectDates')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'min-w-[220px] justify-between gap-2 font-normal transition-colors',
              hasActive && 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm ring-2 ring-primary/20'
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className={cn('h-4 w-4 shrink-0', hasActive ? 'text-primary-foreground/90' : 'text-muted-foreground')} />
              <span className="truncate">{triggerLabel}</span>
              {hasActive && (
                <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  Activo
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            {/* Presets */}
            <div className="border-b sm:border-b-0 sm:border-r border-border bg-muted/30 p-2 sm:min-w-[160px]">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('quickFilters')}
              </p>
              <div className="flex flex-row flex-wrap gap-1 sm:flex-col sm:flex-nowrap">
                {quickFilters.map((f) => (
                  <Button
                    key={f.key}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'justify-start gap-2 text-sm font-normal',
                      activeQuickFilter === f.key && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => handlePreset(f.key)}
                  >
                    {f.icon}
                    {f.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-sm font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handlePreset(CLEAR_KEY)}
                >
                  <XCircle className="h-4 w-4" />
                  {t('clear')}
                </Button>
              </div>
            </div>
            {/* Calendar range: primera clic = inicio, segunda clic = fin → filtra por start_date y end_date en backend */}
            <div className="p-3">
              <p className="mb-1 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('customRange')}
              </p>
              <p className="mb-2 px-1 text-[11px] text-muted-foreground">
                {hasRangeComplete
                  ? `${format(startDate, 'd MMM', { locale: es })} – ${format(endDate, 'd MMM', { locale: es })}`
                  : startDate
                    ? t('selectEnd')
                    : 'Clic en fecha de inicio, luego en fecha de fin'}
              </p>
              <Calendar
                mode="range"
                selected={rangeValue}
                onSelect={handleRangeSelect}
                disabled={(date) => date < new Date('2000-01-01')}
                locale={es}
                numberOfMonths={2}
                defaultMonth={startDate ?? new Date()}
                className="rounded-md border-0"
              />
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate(null)
                    setEndDate(null)
                  }}
                >
                  {t('clear')}
                </Button>
                <Button
                  size="sm"
                  disabled={!startDate || !endDate}
                  onClick={applyRange}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={clearAll}
          title={t('clear')}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
