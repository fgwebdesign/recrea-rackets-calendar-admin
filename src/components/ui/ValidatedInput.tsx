// ========================================
// 🎾 COMPONENTE DE VALIDACIÓN INLINE - SISTEMA REVOLUCIONARIO
// ========================================

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ========================================
// 🔧 TIPOS DE VALIDACIÓN
// ========================================

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface ValidationError {
  field: string
  message: string
  type: 'required' | 'format' | 'custom' | 'length'
}

export interface ValidationState {
  isValid: boolean
  error: string | null
  isTouched: boolean
  isDirty: boolean
}

// ========================================
// 🎯 HOOK DE VALIDACIÓN
// ========================================

export function useValidation(
  value: any,
  rules: ValidationRule[],
  dependencies: any[] = []
) {
  const [state, setState] = useState<ValidationState>({
    isValid: true,
    error: null,
    isTouched: false,
    isDirty: false
  })

  const validate = (val: any): string | null => {
    for (const rule of rules) {
      // Validación requerida
      if (rule.required && (!val || val.toString().trim() === '')) {
        return rule.message || 'Este campo es obligatorio'
      }

      // Validación de longitud mínima
      if (rule.minLength && val && val.toString().length < rule.minLength) {
        return rule.message || `Debe tener al menos ${rule.minLength} caracteres`
      }

      // Validación de longitud máxima
      if (rule.maxLength && val && val.toString().length > rule.maxLength) {
        return rule.message || `No puede tener más de ${rule.maxLength} caracteres`
      }

      // Validación de patrón
      if (rule.pattern && val && !rule.pattern.test(val.toString())) {
        return rule.message || 'El formato no es válido'
      }

      // Validación personalizada
      if (rule.custom && val) {
        const customError = rule.custom(val)
        if (customError) {
          return customError
        }
      }
    }

    return null
  }

  useEffect(() => {
    const error = validate(value)
    setState(prev => ({
      ...prev,
      isValid: !error,
      error,
      isDirty: prev.isDirty || (value !== '' && value != null)
    }))
  }, [value, ...dependencies])

  const touch = () => {
    setState(prev => ({ ...prev, isTouched: true }))
  }

  const reset = () => {
    setState({
      isValid: true,
      error: null,
      isTouched: false,
      isDirty: false
    })
  }

  return {
    ...state,
    touch,
    reset,
    validate: () => validate(value)
  }
}

// ========================================
// 🎨 COMPONENTE DE INPUT CON VALIDACIÓN
// ========================================

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  rules: ValidationRule[]
  validation?: ReturnType<typeof useValidation>
  showValidation?: boolean
  helperText?: string
  icon?: React.ReactNode
}

export function ValidatedInput({
  label,
  rules,
  validation,
  showValidation = true,
  helperText,
  icon,
  className,
  ...props
}: ValidatedInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const getInputStyles = () => {
    if (!showValidation || !validation?.isTouched) {
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }

    if (validation.isValid) {
      return 'border-green-500 focus:border-green-500 focus:ring-green-500'
    }

    return 'border-red-500 focus:border-red-500 focus:ring-red-500'
  }

  const getIconColor = () => {
    if (!showValidation || !validation?.isTouched) {
      return 'text-gray-400'
    }

    if (validation.isValid) {
      return 'text-green-500'
    }

    return 'text-red-500'
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {rules.some(rule => rule.required) && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {/* Input Container */}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className={cn('h-5 w-5', getIconColor())}>
              {icon}
            </div>
          </div>
        )}

        <input
          {...props}
          className={cn(
            'block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
            icon ? 'pl-10' : 'pl-3',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:bg-gray-50 disabled:text-gray-500',
            getInputStyles(),
            className
          )}
          onFocus={(e) => {
            setIsFocused(true)
            validation?.touch()
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
        />

        {/* Validation Icon */}
        {showValidation && validation?.isTouched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Helper Text / Error Message */}
      {showValidation && validation?.isTouched && validation.error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validation.error}</span>
        </div>
      ) : helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  )
}

// ========================================
// 🎨 COMPONENTE DE TEXTAREA CON VALIDACIÓN
// ========================================

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  rules: ValidationRule[]
  validation?: ReturnType<typeof useValidation>
  showValidation?: boolean
  helperText?: string
}

export function ValidatedTextarea({
  label,
  rules,
  validation,
  showValidation = true,
  helperText,
  className,
  ...props
}: ValidatedTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)

  const getTextareaStyles = () => {
    if (!showValidation || !validation?.isTouched) {
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }

    if (validation.isValid) {
      return 'border-green-500 focus:border-green-500 focus:ring-green-500'
    }

    return 'border-red-500 focus:border-red-500 focus:ring-red-500'
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {rules.some(rule => rule.required) && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {/* Textarea */}
      <textarea
        {...props}
        className={cn(
          'block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors resize-none',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-white',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:bg-gray-50 disabled:text-gray-500',
          getTextareaStyles(),
          className
        )}
        onFocus={(e) => {
          setIsFocused(true)
          validation?.touch()
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
      />

      {/* Helper Text / Error Message */}
      {showValidation && validation?.isTouched && validation.error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validation.error}</span>
        </div>
      ) : helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  )
}

// ========================================
// 🎨 COMPONENTE DE SELECT CON VALIDACIÓN
// ========================================

interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  rules: ValidationRule[]
  validation?: ReturnType<typeof useValidation>
  showValidation?: boolean
  helperText?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function ValidatedSelect({
  label,
  rules,
  validation,
  showValidation = true,
  helperText,
  options,
  placeholder = 'Seleccionar...',
  className,
  ...props
}: ValidatedSelectProps) {
  const [isFocused, setIsFocused] = useState(false)

  const getSelectStyles = () => {
    if (!showValidation || !validation?.isTouched) {
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }

    if (validation.isValid) {
      return 'border-green-500 focus:border-green-500 focus:ring-green-500'
    }

    return 'border-red-500 focus:border-red-500 focus:ring-red-500'
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {rules.some(rule => rule.required) && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {/* Select */}
      <select
        {...props}
        className={cn(
          'block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:bg-gray-50 disabled:text-gray-500',
          getSelectStyles(),
          className
        )}
        onFocus={(e) => {
          setIsFocused(true)
          validation?.touch()
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Helper Text / Error Message */}
      {showValidation && validation?.isTouched && validation.error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validation.error}</span>
        </div>
      ) : helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  )
}

// ========================================
// 🎯 COMPONENTE DE FORMULARIO CON VALIDACIÓN
// ========================================

interface ValidatedFormProps {
  children: React.ReactNode
  onSubmit: (data: any) => void
  className?: string
}

export function ValidatedForm({ children, onSubmit, className }: ValidatedFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Aquí podrías agregar lógica adicional de validación
    // antes de llamar a onSubmit
    
    onSubmit(new FormData(e.target as HTMLFormElement))
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  )
}

// ========================================
// 🚀 EXPORTACIONES PRINCIPALES
// ========================================

export {
  useValidation,
  ValidatedInput,
  ValidatedTextarea,
  ValidatedSelect,
  ValidatedForm
}

export type {
  ValidationRule,
  ValidationError,
  ValidationState
}
