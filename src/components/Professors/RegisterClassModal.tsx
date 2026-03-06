'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Professor } from '@/types/professor';
import { useClubSettings } from '@/hooks/useClubSettings';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { PopoverContainerProvider } from '@/components/ui/popover';
import { TimePicker, getNextTimeSlot } from '@/components/ui/time-picker';

interface VenueOption {
  id: string;
  name: string;
  courts?: { id: string; name: string }[];
}

interface RegisterClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    professor_id: string;
    venue_id: string;
    court_id?: string | null;
    class_date: string;
    start_time: string;
    end_time: string;
    notes?: string | null;
  }) => Promise<void>;
  professors: Professor[];
  venues: VenueOption[];
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr.trim())) return null;
  const [h, m] = timeStr.trim().split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export default function RegisterClassModal({
  isOpen,
  onClose,
  onSubmit,
  professors,
  venues,
}: RegisterClassModalProps) {
  const { clubSettings, fetchClubSettings } = useClubSettings();
  const [professorId, setProfessorId] = useState('');
  const [classDate, setClassDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  const [courtId, setCourtId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) fetchClubSettings();
  }, [isOpen, fetchClubSettings]);

  const selectedProfessor = useMemo(
    () => professors.find((p) => p.id === professorId),
    [professors, professorId]
  );
  const selectedVenue = useMemo(
    () => venues.find((v) => v.id === venueId),
    [venues, venueId]
  );
  const courts = selectedVenue?.courts ?? [];

  const preview = useMemo(() => {
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (startMin == null || endMin == null || endMin <= startMin) {
      return null;
    }
    const durationMinutes = endMin - startMin;
    const hours = durationMinutes / 60;
    const hourlyRate = Number(selectedProfessor?.hourly_rate) || 0;
    const amountProfessor = Math.round(hourlyRate * hours * 100) / 100;
    const commissionPercent = Number(selectedProfessor?.commission_percent ?? clubSettings.club_commission_percent) || 0;
    return {
      durationMinutes,
      hours,
      amountProfessor,
      amountClub: Math.round(amountProfessor * (commissionPercent / 100) * 100) / 100,
    };
  }, [startTime, endTime, selectedProfessor?.hourly_rate, selectedProfessor?.commission_percent, clubSettings.club_commission_percent]);

  const canSubmit =
    professorId &&
    classDate &&
    startTime &&
    endTime &&
    venueId &&
    selectedProfessor &&
    (Number(selectedProfessor.hourly_rate) || 0) > 0 &&
    preview &&
    preview.durationMinutes > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        professor_id: professorId,
        venue_id: venueId,
        court_id: courtId || null,
        class_date: classDate,
        start_time: startTime.length === 5 ? startTime : startTime.slice(0, 5),
        end_time: endTime.length === 5 ? endTime : endTime.slice(0, 5),
        notes: notes.trim() || null,
      });
      setProfessorId('');
      setClassDate('');
      setStartTime('');
      setEndTime('');
      setVenueId('');
      setCourtId(null);
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <PopoverContainerProvider>
          <DialogHeader>
            <DialogTitle>Registrar clase</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
          <div>
            <Label>Profesor *</Label>
            <Select value={professorId} onValueChange={setProfessorId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar profesor" />
              </SelectTrigger>
              <SelectContent>
                {professors.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {(p.hourly_rate ?? 0) <= 0 ? (
                      <span className="text-muted-foreground"> (sin valor por hora)</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium"> (${p.hourly_rate}/h)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProfessor && (selectedProfessor.hourly_rate ?? 0) <= 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Edita el profesor para asignar un valor por hora y poder registrar clases.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <DatePicker
                value={classDate ? parseDateFromInput(classDate) : undefined}
                onChange={(date) => setClassDate(date ? formatDateForInput(date) : '')}
                placeholder="dd/mm/yyyy"
                className="mt-1 h-9"
                insideDialog
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hora inicio *</Label>
              <TimePicker
                value={startTime}
                onChange={(v) => {
                  setStartTime(v);
                  if (endTime && parseTimeToMinutes(endTime) !== null && (parseTimeToMinutes(v) ?? 0) >= (parseTimeToMinutes(endTime) ?? 0)) {
                    setEndTime(getNextTimeSlot(v));
                  }
                }}
                placeholder="--:--"
                className="mt-1 h-9 w-full"
              />
            </div>
            <div>
              <Label>Hora fin *</Label>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="--:--"
                minTime={startTime ? getNextTimeSlot(startTime) : undefined}
                className="mt-1 h-9 w-full"
              />
            </div>
          </div>
          <div>
            <Label>Sede *</Label>
            <Select value={venueId} onValueChange={(v) => { setVenueId(v); setCourtId(null); }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar sede" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {courts.length > 0 && (
            <div>
              <Label>Cancha (opcional)</Label>
              <Select value={courtId || 'none'} onValueChange={(v) => setCourtId(v === 'none' ? null : v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              className="mt-1 min-h-[80px]"
            />
          </div>

          {preview && preview.durationMinutes > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista previa</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duración: {preview.durationMinutes} min ({preview.hours.toFixed(2)} h)
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cobro profesor: {formatCurrency(preview.amountProfessor)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comisión club: {formatCurrency(preview.amountClub)}
              </p>
            </div>
          )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </PopoverContainerProvider>
      </DialogContent>
    </Dialog>
  );
}
