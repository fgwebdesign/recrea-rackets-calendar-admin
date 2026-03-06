'use client';

import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { CalendarDays } from 'lucide-react';

interface ProfessorOption {
  id: string;
  name: string;
}
interface VenueOption {
  id: string;
  name: string;
}

export interface ClassFiltersState {
  professorId: string;
  fromDate: string;
  toDate: string;
  venueId: string;
}

interface ClassFiltersCardProps {
  filters: ClassFiltersState;
  onFiltersChange: (f: Partial<ClassFiltersState>) => void;
  onApply: () => void;
  onClear: () => void;
  professors: ProfessorOption[];
  venues: VenueOption[];
  onPresetRange?: (from: string, to: string) => void;
}

const PRESETS = [
  { label: 'Hoy', getRange: () => { const d = new Date(); const s = formatDateForInput(d); return { from: s, to: s }; } },
  { label: 'Esta semana', getRange: () => { const n = new Date(); const d = new Date(n); d.setDate(n.getDate() - n.getDay()); return { from: formatDateForInput(d), to: formatDateForInput(n) }; } },
  { label: 'Este mes', getRange: () => { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth(), 1); return { from: formatDateForInput(d), to: formatDateForInput(n) }; } },
  { label: 'Mes pasado', getRange: () => { const n = new Date(); const start = new Date(n.getFullYear(), n.getMonth() - 1, 1); const end = new Date(n.getFullYear(), n.getMonth(), 0); return { from: formatDateForInput(start), to: formatDateForInput(end) }; } },
];

export function ClassFiltersCard({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  professors,
  venues,
  onPresetRange,
}: ClassFiltersCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros
          </CardTitle>
          {onPresetRange && (
            <div className="flex flex-wrap gap-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground self-center" />
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const { from, to } = p.getRange();
                    onPresetRange(from, to);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Profesor</Label>
            <Select
              value={filters.professorId || 'all'}
              onValueChange={(v) => onFiltersChange({ professorId: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professors.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Desde</Label>
            <DatePicker
              value={filters.fromDate ? parseDateFromInput(filters.fromDate) : undefined}
              onChange={(date) => onFiltersChange({ fromDate: date ? formatDateForInput(date) : '' })}
              placeholder="dd/mm/yyyy"
              className="h-9 rounded-lg w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Hasta</Label>
            <DatePicker
              value={filters.toDate ? parseDateFromInput(filters.toDate) : undefined}
              onChange={(date) => onFiltersChange({ toDate: date ? formatDateForInput(date) : '' })}
              placeholder="dd/mm/yyyy"
              className="h-9 rounded-lg w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Sede</Label>
            <Select
              value={filters.venueId || 'all'}
              onValueChange={(v) => onFiltersChange({ venueId: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpiar
          </Button>
          <Button size="sm" onClick={onApply}>
            Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
