'use client';

import { useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  lastDayOfMonth,
  getDate,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Wallet, FileDown } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProfessorClassesSummary } from '@/types/professor';

const PERIOD_TYPES = [
  { value: 'week', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'month', label: 'Mensual' },
  { value: 'custom', label: 'Rango personalizado' },
] as const;

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

function getWeekRange(date: Date): { from: string; to: string } {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { from: formatDateForInput(start), to: formatDateForInput(end) };
}

function getBiweeklyRange(year: number, month: number, half: 1 | 2): { from: string; to: string } {
  const startDate = new Date(year, month - 1, 1);
  const endDate = half === 1
    ? new Date(year, month - 1, 15)
    : lastDayOfMonth(new Date(year, month - 1));
  const from = half === 1 ? 1 : 16;
  const to = half === 1 ? 15 : getDate(endDate);
  return {
    from: formatDateForInput(new Date(year, month - 1, from)),
    to: formatDateForInput(new Date(year, month - 1, to)),
  };
}

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return { from: formatDateForInput(start), to: formatDateForInput(end) };
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

interface PaymentReportSectionProps {
  summary: ProfessorClassesSummary | null;
  isLoading: boolean;
  periodLabel?: string;
  onGenerate: (from: string, to: string) => void;
  formatCurrency: (n: number) => string;
}

export function PaymentReportSection({
  summary,
  isLoading,
  periodLabel,
  onGenerate,
  formatCurrency,
}: PaymentReportSectionProps) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<'week' | 'biweekly' | 'month' | 'custom'>('month');
  const [weekDate, setWeekDate] = useState<Date | undefined>(now);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [biweeklyHalf, setBiweeklyHalf] = useState<'1' | '2'>('1');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handleGenerate = () => {
    let from = '';
    let to = '';
    const y = parseInt(year, 10) || now.getFullYear();
    const m = parseInt(month, 10) || now.getMonth() + 1;

    switch (periodType) {
      case 'week':
        if (weekDate) {
          const r = getWeekRange(weekDate);
          from = r.from;
          to = r.to;
        }
        break;
      case 'biweekly':
        from = getBiweeklyRange(y, m, biweeklyHalf === '1' ? 1 : 2).from;
        to = getBiweeklyRange(y, m, biweeklyHalf === '1' ? 1 : 2).to;
        break;
      case 'month':
        from = getMonthRange(y, m).from;
        to = getMonthRange(y, m).to;
        break;
      case 'custom':
        from = customFrom;
        to = customTo;
        break;
    }
    if (from && to) onGenerate(from, to);
  };

  const canGenerate =
    (periodType === 'week' && !!weekDate) ||
    (periodType === 'biweekly' && !!month && !!year) ||
    (periodType === 'month' && !!month && !!year) ||
    (periodType === 'custom' && !!customFrom && !!customTo);

  const handleExportPagos = () => {
    if (!summary) return;
    const lines: string[] = [];
    const range = periodLabel
      ? `Período: ${periodLabel}`
      : 'Reporte de pagos a profesores';
    lines.push('Reporte de pagos a profesores');
    lines.push(range);
    lines.push('');
    lines.push('Profesor;Horas;Monto a pagar');
    summary.by_professor.forEach((r) => {
      lines.push(
        [
          r.professor_name ?? '–',
          r.total_hours.toFixed(2),
          formatCurrency(r.total_amount_professor),
        ]
          .map(escapeCsvCell)
          .join(';')
      );
    });
    lines.push('');
    lines.push(`TOTAL;${summary.total_hours.toFixed(2)};${formatCurrency(summary.total_amount_professor)}`);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos-profesores-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Período del reporte
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Elegí cómo pagás a los profesores (semanal, quincenal o mensual) y generá el reporte para ver cuánto pagar a cada uno según las clases registradas.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Tipo de período</Label>
              <Select
                value={periodType}
                onValueChange={(v) => setPeriodType(v as typeof periodType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {periodType === 'week' && (
              <div>
                <Label>Semana del</Label>
                <div className="mt-1">
                  <DatePicker
                    value={weekDate}
                    onChange={(d) => setWeekDate(d)}
                    placeholder="Elegir fecha"
                    className="h-9 w-full"
                  />
                </div>
                {weekDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}
                    {' – '}
                    {format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: es })}
                  </p>
                )}
              </div>
            )}

            {(periodType === 'biweekly' || periodType === 'month') && (
              <>
                <div>
                  <Label>Mes</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Año</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {periodType === 'biweekly' && (
              <div>
                <Label>Quincena</Label>
                <Select value={biweeklyHalf} onValueChange={(v) => setBiweeklyHalf(v as '1' | '2')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1ª quincena (día 1 al 15)</SelectItem>
                    <SelectItem value="2">2ª quincena (día 16 al fin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {periodType === 'custom' && (
              <>
                <div>
                  <Label>Desde</Label>
                  <DatePicker
                    value={customFrom ? parseDateFromInput(customFrom) : undefined}
                    onChange={(d) => setCustomFrom(d ? formatDateForInput(d) : '')}
                    placeholder="dd/mm/yyyy"
                    className="mt-1 h-9 w-full"
                  />
                </div>
                <div>
                  <Label>Hasta</Label>
                  <DatePicker
                    value={customTo ? parseDateFromInput(customTo) : undefined}
                    onChange={(d) => setCustomTo(d ? formatDateForInput(d) : '')}
                    placeholder="dd/mm/yyyy"
                    className="mt-1 h-9 w-full"
                  />
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            {isLoading ? 'Generando...' : 'Generar reporte de pagos'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && !summary ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8">
            <Skeleton className="h-48 w-full rounded-lg" />
          </CardContent>
        </Card>
      ) : summary && summary.by_professor.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base font-medium">
                Monto a pagar por profesor
                {periodLabel && (
                  <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                    {periodLabel}
                  </span>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPagos}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesor</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Monto a pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.by_professor.map((r) => (
                  <TableRow key={r.professor_id}>
                    <TableCell className="font-medium">
                      {r.professor_name ?? '–'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.total_hours.toFixed(2)} h
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.total_amount_professor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {summary.total_hours.toFixed(2)} h
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.total_amount_professor)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      ) : summary && summary.by_professor.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-foreground mb-1">Sin clases en este período</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              No hay clases registradas para las fechas elegidas. Probá otro período o registrá clases primero.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
