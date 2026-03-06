'use client';

import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProfessorClassesSummary } from '@/types/professor';

interface ExportReportButtonProps {
  summary: ProfessorClassesSummary | null;
  formatCurrency: (n: number) => string;
  fromDate?: string;
  toDate?: string;
  disabled?: boolean;
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function ExportReportButton({
  summary,
  formatCurrency,
  fromDate,
  toDate,
  disabled,
}: ExportReportButtonProps) {
  const handleExport = () => {
    if (!summary) return;
    const lines: string[] = [];
    const range = [fromDate, toDate].filter(Boolean).length
      ? `Período: ${fromDate ? format(new Date(fromDate), 'dd/MM/yyyy', { locale: es }) : '?'} - ${toDate ? format(new Date(toDate), 'dd/MM/yyyy', { locale: es }) : '?'}`
      : 'Resumen completo';
    lines.push('Reporte de clases - Profesores');
    lines.push(range);
    lines.push('');
    lines.push('Totales');
    lines.push('Total horas;Total cobro profesor;Total comisión club');
    lines.push(`${summary.total_hours.toFixed(2)};${formatCurrency(summary.total_amount_professor)};${formatCurrency(summary.total_amount_club)}`);
    lines.push('');
    if (summary.by_professor.length > 0) {
      lines.push('Por profesor');
      lines.push('Profesor;Horas;Cobro profesor;Comisión club');
      summary.by_professor.forEach((r) => {
        lines.push([r.professor_name ?? '–', r.total_hours.toFixed(2), formatCurrency(r.total_amount_professor), formatCurrency(r.total_amount_club)].map(escapeCsvCell).join(';'));
      });
      lines.push('');
    }
    if (summary.by_day.length > 0) {
      lines.push('Por día');
      lines.push('Fecha;Horas;Cobro profesor;Comisión club');
      summary.by_day.forEach((r) => {
        lines.push([format(new Date(r.date), 'dd/MM/yyyy', { locale: es }), r.total_hours.toFixed(2), formatCurrency(r.total_amount_professor), formatCurrency(r.total_amount_club)].map(escapeCsvCell).join(';'));
      });
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clases-profesores-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !summary || (summary.by_professor.length === 0 && summary.by_day.length === 0)}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
