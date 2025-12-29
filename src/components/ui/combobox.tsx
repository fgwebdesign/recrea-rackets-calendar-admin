"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxInputProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function ComboboxInput({
  options,
  value = "",
  onValueChange,
  placeholder = "Escribir o seleccionar...",
  disabled = false,
  className,
  id,
}: ComboboxInputProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [showList, setShowList] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Filtrar opciones basado en lo que el usuario escribe
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options
    const searchLower = inputValue.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowList(true)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  const handleSelectOption = (option: ComboboxOption) => {
    setInputValue(option.label)
    setShowList(false)
    if (onValueChange) {
      onValueChange(option.label)
    }
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (filteredOptions.length > 0) {
      setShowList(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Si el focus va a la lista, no cerrar
    if (listRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    setShowList(false)
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setShowList(false)
      }
    }

    if (showList) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showList])

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 pr-10",
            className
          )}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      {showList && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              onClick={() => handleSelectOption(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
