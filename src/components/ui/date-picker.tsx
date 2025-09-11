"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

// Función helper para convertir Date a string YYYY-MM-DD sin problemas de zona horaria
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Función helper para convertir string YYYY-MM-DD a Date sin problemas de zona horaria
const parseDateFromInput = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  disabled = false,
  className,
  error = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70",
            !value && "text-muted-foreground",
            error && "border-red-500 dark:border-red-500",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={(date) => date < new Date("1900-01-01")}
          initialFocus
          locale={es}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  value?: { from: Date | undefined; to: Date | undefined }
  onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecciona un rango de fechas",
  disabled = false,
  className,
  error = false
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const formatRange = () => {
    if (!value?.from) return placeholder
    if (!value?.to) return format(value.from, "dd/MM/yyyy", { locale: es })
    return `${format(value.from, "dd/MM/yyyy", { locale: es })} - ${format(value.to, "dd/MM/yyyy", { locale: es })}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70",
            !value?.from && "text-muted-foreground",
            error && "border-red-500 dark:border-red-500",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            onChange?.(range || { from: undefined, to: undefined })
            if (range?.from && range?.to) {
              setOpen(false)
            }
          }}
          disabled={(date) => date < new Date("1900-01-01")}
          initialFocus
          locale={es}
          className="rounded-md border"
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}

// Exportar las funciones helper para uso en otros componentes
export { formatDateForInput, parseDateFromInput }
