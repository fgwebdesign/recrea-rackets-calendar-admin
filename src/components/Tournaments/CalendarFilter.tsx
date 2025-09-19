'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isSameDay, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/contexts/TranslationContext'

interface CalendarFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void
  onQuickFilterChange: (filter: string) => void
  className?: string
}

export default function CalendarFilter({ 
  onDateRangeChange, 
  onQuickFilterChange,
  className 
}: CalendarFilterProps) {
  const t = useTranslations('tournaments')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)

  const quickFilters = [
    { key: 'this_month', label: t('thisMonth'), icon: '📅' },
    { key: 'next_month', label: t('nextMonth'), icon: '📆' },
    { key: 'this_year', label: t('thisYear'), icon: '🗓️' },
    { key: 'upcoming', label: t('upcoming'), icon: '⏰' },
    { key: 'clear', label: t('clear'), icon: '❌' }
  ]

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    if (!startDate || (startDate && endDate)) {
      // Seleccionar fecha de inicio
      setStartDate(date)
      setEndDate(null)
      onDateRangeChange(date, null)
    } else if (startDate && !endDate) {
      // Seleccionar fecha de fin
      const newEndDate = date < startDate ? date : date
      const newStartDate = date < startDate ? date : startDate
      
      setStartDate(newStartDate)
      setEndDate(newEndDate)
      onDateRangeChange(newStartDate, newEndDate)
      setIsOpen(false) // Cerrar el popover cuando se selecciona el rango completo
    }
  }

  const handleQuickFilter = (filterKey: string) => {
    if (filterKey === 'clear') {
      setStartDate(null)
      setEndDate(null)
      setActiveQuickFilter('')
      onDateRangeChange(null, null)
      onQuickFilterChange('')
    } else {
      setActiveQuickFilter(filterKey)
      setStartDate(null)
      setEndDate(null)
      onQuickFilterChange(filterKey)
    }
  }

  const clearCustomRange = () => {
    setStartDate(null)
    setEndDate(null)
    setActiveQuickFilter('')
    onDateRangeChange(null, null)
    onQuickFilterChange('')
  }

  const hasActiveFilter = startDate || endDate || activeQuickFilter

  // Función para determinar si una fecha está en el rango seleccionado
  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false
    return isWithinInterval(date, { start: startDate, end: endDate })
  }

  // Función para determinar si una fecha es el inicio o fin del rango
  const isRangeEdge = (date: Date) => {
    if (!startDate || !endDate) return false
    return isSameDay(date, startDate) || isSameDay(date, endDate)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 🗓️ Filtros Rápidos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('quickFilters')}
        </p>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeQuickFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter(filter.key)}
              className={cn(
                "h-8 px-3 text-xs transition-all duration-200",
                activeQuickFilter === filter.key
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 📅 Selector de Rango Personalizado - Estilo Airbnb */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('customRange')}
        </p>
        
        <div className="flex items-center gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !startDate && !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate && endDate ? (
                  `${format(startDate, "dd MMM", { locale: es })} - ${format(endDate, "dd MMM", { locale: es })}`
                ) : startDate ? (
                  `${format(startDate, "dd MMM", { locale: es })} - ${t('selectEnd')}`
                ) : (
                  t('selectDates')
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                {/* Header del calendario con navegación */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  <h3 className="text-lg font-semibold">
                    {format(currentMonth, "MMMM yyyy", { locale: es })}
                  </h3>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Calendario personalizado */}
                <Calendar
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                  locale={es}
                  className="rounded-md border-0"
                  components={{
                    Day: ({ date, ...props }) => {
                      const isSelected = startDate && isSameDay(date, startDate)
                      const isEndSelected = endDate && isSameDay(date, endDate)
                      const isInRange = isDateInRange(date)
                      const isEdge = isRangeEdge(date)
                      
                      return (
                        <button
                          {...props}
                          className={cn(
                            "h-9 w-9 rounded-full text-sm font-medium transition-colors",
                            "hover:bg-blue-100 dark:hover:bg-blue-900/20",
                            isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                            isEndSelected && "bg-blue-600 text-white hover:bg-blue-700",
                            isInRange && !isEdge && "bg-blue-100 dark:bg-blue-900/20",
                            isEdge && "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          {format(date, "d")}
                        </button>
                      )
                    }
                  }}
                />

                {/* Información del rango seleccionado */}
                {startDate && endDate && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {format(startDate, "dd MMM yyyy", { locale: es })} - {format(endDate, "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} {t('daysSelected')}
                    </p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCustomRange}
              className="h-10 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 📊 Indicador de Rango Seleccionado */}
        {startDate && endDate && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {t('showingTournaments')} {format(startDate, "dd MMM yyyy", { locale: es })} {t('to')} {format(endDate, "dd MMM yyyy", { locale: es })}
            </span>
          </div>
        )}

        {activeQuickFilter && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {t('activeFilter')} {quickFilters.find(f => f.key === activeQuickFilter)?.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
