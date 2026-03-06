'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
  /** Mostrar botones rápidos (Últimos 7 días, Este mes) */
  showPresets?: boolean;
  disabled?: boolean;
}

function getPresetRange(preset: 'last7' | 'thisMonth' | 'lastMonth'): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate());

  if (preset === 'last7') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (preset === 'thisMonth') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start, end };
  }
  // lastMonth
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
  return { start, end: lastDay };
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
  showPresets = true,
  disabled = false
}: DateRangeFilterProps) {
  const handlePreset = (preset: 'last7' | 'thisMonth' | 'lastMonth') => {
    const { start, end } = getPresetRange(preset);
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end gap-4">
        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0 self-center mb-2" aria-hidden />
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[140px]">
            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Desde</Label>
            <DatePicker
              value={startDate}
              onChange={(d) => d && onStartDateChange(d)}
              placeholder="Inicio"
              disabled={disabled}
              className="w-full min-w-[140px] h-10"
            />
          </div>
          <div className="space-y-2 min-w-[140px]">
            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Hasta</Label>
            <DatePicker
              value={endDate}
              onChange={(d) => d && onEndDateChange(d)}
              placeholder="Fin"
              disabled={disabled}
              className="w-full min-w-[140px] h-10"
            />
          </div>
        </div>
      </div>
      {showPresets && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => handlePreset('last7')}
            disabled={disabled}
          >
            7 días
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => handlePreset('thisMonth')}
            disabled={disabled}
          >
            Este mes
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => handlePreset('lastMonth')}
            disabled={disabled}
          >
            Mes pasado
          </Button>
        </div>
      )}
    </div>
  );
}
