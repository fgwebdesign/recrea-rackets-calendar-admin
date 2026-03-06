'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProfessorClassesSummary } from '@/types/professor';

interface SummaryTablesProps {
  summary: ProfessorClassesSummary;
  formatCurrency: (n: number) => string;
}

export function SummaryTables({ summary, formatCurrency }: SummaryTablesProps) {
  const hasByProfessor = summary.by_professor.length > 0;
  const hasByDay = summary.by_day.length > 0;

  if (!hasByProfessor && !hasByDay) return null;

  return (
    <div className="space-y-6">
      {hasByProfessor && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Por profesor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-medium text-muted-foreground">Profesor</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Horas</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Cobro profesor</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Comisión club</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.by_professor.map((row) => (
                  <TableRow key={row.professor_id} className="border-b hover:bg-muted/50">
                    <TableCell className="font-medium">{row.professor_name ?? '–'}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.total_hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(row.total_amount_professor)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(row.total_amount_club)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {hasByDay && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Por día</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-medium text-muted-foreground">Fecha</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Horas</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Cobro profesor</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Comisión club</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.by_day.map((row) => (
                  <TableRow key={row.date} className="border-b hover:bg-muted/50">
                    <TableCell>{format(new Date(row.date), 'dd/MM/yyyy', { locale: es })}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.total_hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(row.total_amount_professor)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(row.total_amount_club)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
