'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GroupTimeSlot {
  id: string;
  label: string;
  day?: number;
  tournament_day: number;
  date: string;
  start_time: string;
  end_time: string;
}

const TIME_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
];

function getDateForDay(startDate: string, day: number): string {
  if (!startDate) return '';
  const d = new Date(startDate + 'T12:00:00');
  d.setDate(d.getDate() + (day - 1));
  return d.toISOString().split('T')[0];
}

function generateFranjaId(day: number, type: string, existingIds: Set<string>): string {
  let id = `franja_day${day}_${type}`;
  let suffix = 0;
  while (existingIds.has(id)) {
    suffix++;
    id = `franja_day${day}_${type}_${suffix}`;
  }
  return id;
}

interface FranjasHorariasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate: string;
  initialFranjas: GroupTimeSlot[];
  onConfirm: (franjas: GroupTimeSlot[]) => void;
}

export function FranjasHorariasModal({
  open,
  onOpenChange,
  startDate,
  endDate,
  initialFranjas,
  onConfirm
}: FranjasHorariasModalProps) {
  const [franjas, setFranjas] = useState<GroupTimeSlot[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFranjas(initialFranjas.length > 0 ? [...initialFranjas] : []);
      setValidationError(null);
    }
  }, [open, initialFranjas]);

  const updateFranja = (index: number, field: keyof GroupTimeSlot, value: string | number) => {
    const next = franjas.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    );
    setFranjas(next);
    setValidationError(null);
  };

  const removeFranja = (index: number) => {
    setFranjas(franjas.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const addFranja = () => {
    const day2Date = getDateForDay(startDate, 2);
    const existingIds = new Set(franjas.map((f) => f.id));
    const id = generateFranjaId(2, 'nuevo', existingIds);
    setFranjas([
      ...franjas,
      {
        id,
        label: 'Día 2 Nueva',
        day: 2,
        tournament_day: 2,
        date: day2Date,
        start_time: '09:00',
        end_time: '13:00'
      }
    ]);
    setValidationError(null);
  };

  const validate = (): boolean => {
    if (franjas.length === 0) {
      setValidationError('Debe haber al menos una franja horaria');
      return false;
    }
    for (let i = 0; i < franjas.length; i++) {
      const f = franjas[i];
      if (!f.id || !f.label || !f.date || !f.start_time || !f.end_time) {
        setValidationError(`La franja ${i + 1} tiene campos incompletos`);
        return false;
      }
      const startHour = parseInt(f.start_time.slice(0, 2), 10);
      const endHour = f.end_time === '00:00' ? 24 : parseInt(f.end_time.slice(0, 2), 10);
      const start = f.start_time === '00:00' ? 0 : startHour;
      const end = endHour;
      if (start >= end) {
        setValidationError(`La franja "${f.label}": la hora de fin debe ser posterior a la de inicio`);
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm(franjas);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Franjas Horarias</DialogTitle>
          <DialogDescription>
            Editá los horarios de cada franja o agregá nuevas. Las franjas definen los bloques de tiempo para jugar por día.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {franjas.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay franjas. Hacé clic en &quot;Agregar franja&quot; para crear una, o cerra y usá &quot;Generar franjas estándar&quot; de nuevo.
            </p>
          ) : (
            <div className="space-y-3">
              {franjas.map((franja, idx) => (
                <div
                  key={franja.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 p-3 rounded-lg border",
                    "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className="w-12 shrink-0">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                      D{franja.tournament_day}
                    </span>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {franja.label}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {franja.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={franja.start_time}
                      onValueChange={(v) => updateFranja(idx, 'start_time', v)}
                    >
                      <SelectTrigger className="w-[100px] h-9">
                        <SelectValue placeholder="Inicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-slate-400 text-sm">-</span>
                    <Select
                      value={franja.end_time}
                      onValueChange={(v) => updateFranja(idx, 'end_time', v)}
                    >
                      <SelectTrigger className="w-[100px] h-9">
                        <SelectValue placeholder="Fin" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFranja(idx)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 w-9 p-0 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFranja}
            disabled={!startDate || !endDate}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar franja
          </Button>

          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={franjas.length === 0}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
