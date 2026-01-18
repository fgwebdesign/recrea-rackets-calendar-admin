'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, Sun, Moon, Sunset, Coffee, X, CheckCircle } from 'lucide-react'

interface TimeSlotBadgeProps {
  slotId: string
  label: string
  variant?: 'restriction' | 'available' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export function TimeSlotBadge({ 
  slotId, 
  label, 
  variant = 'restriction',
  size = 'sm' 
}: TimeSlotBadgeProps) {
  
  // Determinar el icono basado en el horario
  const getTimeIcon = () => {
    if (slotId.includes('morning') || slotId.includes('8') || slotId.includes('9') || slotId.includes('10') || slotId.includes('11')) {
      return <Coffee className="w-3 h-3 mr-1" />
    }
    if (slotId.includes('afternoon') || slotId.includes('13') || slotId.includes('14') || slotId.includes('15') || slotId.includes('16') || slotId.includes('17')) {
      return <Sun className="w-3 h-3 mr-1" />
    }
    if (slotId.includes('evening') || slotId.includes('18') || slotId.includes('19') || slotId.includes('20') || slotId.includes('21')) {
      return <Sunset className="w-3 h-3 mr-1" />
    }
    if (slotId.includes('night') || slotId.includes('late') || slotId.includes('22') || slotId.includes('23')) {
      return <Moon className="w-3 h-3 mr-1" />
    }
    return <Clock className="w-3 h-3 mr-1" />
  }

  // Determinar el icono de prefijo según la variante
  const getPrefixIcon = () => {
    if (variant === 'restriction') {
      return <X className="w-3 h-3 mr-1" />
    }
    if (variant === 'available') {
      return <CheckCircle className="w-3 h-3 mr-1" />
    }
    return null
  }

  // Estilos según la variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'restriction':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    }
  }

  // Tamaño del badge
  const getSizeStyles = () => {
    switch (size) {
      case 'lg':
        return 'text-sm px-3 py-2'
      case 'md':
        return 'text-xs px-2 py-1'
      case 'sm':
      default:
        return 'text-xs px-2 py-1'
    }
  }

  return (
    <Badge 
      variant="outline" 
      className={`${getVariantStyles()} ${getSizeStyles()} font-medium transition-colors flex items-center`}
    >
      {getPrefixIcon() || getTimeIcon()}
      {label}
    </Badge>
  )
}
