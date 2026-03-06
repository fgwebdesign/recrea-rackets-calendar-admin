'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MINUTE_STEP = 15;
const TOTAL_SLOTS = (24 * 60) / MINUTE_STEP; // 96 slots

function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const totalMinutes = i * MINUTE_STEP;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function timeToSlotIndex(time: string): number | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time.trim())) return null;
  const [h, m] = time.trim().split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const total = h * 60 + m;
  if (total % MINUTE_STEP !== 0) return null;
  const idx = total / MINUTE_STEP;
  return idx >= 0 && idx < TOTAL_SLOTS ? idx : null;
}

/** Convierte HH:mm a índice de slot; si no cae en paso de 15 min, redondea al más cercano. */
function timeToSlotIndexOrRound(time: string): number | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time.trim())) return null;
  const [h, m] = time.trim().split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const total = Math.max(0, Math.min(24 * 60 - 1, h * 60 + m));
  const idx = Math.round(total / MINUTE_STEP);
  return idx < TOTAL_SLOTS ? idx : TOTAL_SLOTS - 1;
}

function slotIndexToTime(idx: number): string {
  return TIME_OPTIONS[idx] ?? '00:00';
}

/** Devuelve el siguiente slot de 15 min después de `time` (para usar como minTime en "hora fin"). */
export function getNextTimeSlot(time: string): string {
  const idx = timeToSlotIndex(time);
  if (idx == null || idx >= TOTAL_SLOTS - 1) return TIME_OPTIONS[TOTAL_SLOTS - 1];
  return slotIndexToTime(idx + 1);
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Seleccionar hora',
  minTime,
  maxTime,
  disabled,
  className,
}: TimePickerProps) {
  const minSlot = minTime != null ? timeToSlotIndex(minTime) : 0;
  const maxSlot = maxTime != null ? timeToSlotIndex(maxTime) : TOTAL_SLOTS - 1;

  const selectValue = useMemo(() => {
    if (!value) return '';
    const idx = timeToSlotIndex(value) ?? timeToSlotIndexOrRound(value);
    return idx != null ? slotIndexToTime(idx) : '';
  }, [value]);

  return (
    <Select
      value={selectValue || undefined}
      onValueChange={(v) => onChange(v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS.map((time, idx) => {
          const isDisabled = idx < minSlot || idx > maxSlot;
          return (
            <SelectItem key={time} value={time} disabled={isDisabled}>
              {time}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
