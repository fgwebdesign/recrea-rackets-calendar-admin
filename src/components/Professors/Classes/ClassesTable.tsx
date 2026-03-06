'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ListTodo, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProfessorClass } from '@/types/professor';

type ProfessorClassWithRelations = ProfessorClass & {
  professor?: { name?: string };
  venue?: { name?: string };
  court?: { name?: string } | null;
};

function formatTime(t: string | undefined): string {
  if (!t) return '–';
  const s = String(t);
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

interface ClassesTableProps {
  classes: ProfessorClassWithRelations[];
  isLoading: boolean;
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
  formatCurrency: (n: number) => string;
  onEdit: (c: ProfessorClassWithRelations) => void;
  onDelete: (c: ProfessorClassWithRelations) => void;
  onRegisterClick: () => void;
}

function professorName(c: ProfessorClassWithRelations): string {
  return c.professor?.name ?? '–';
}
function venueName(c: ProfessorClassWithRelations): string {
  return c.venue?.name ?? '–';
}
function courtName(c: ProfessorClassWithRelations): string {
  return c.court?.name ?? '–';
}

export function ClassesTable({
  classes,
  isLoading,
  totalPages,
  page,
  onPageChange,
  formatCurrency,
  onEdit,
  onDelete,
  onRegisterClick,
}: ClassesTableProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground mb-3" />
          <p className="text-sm">Cargando clases...</p>
        </CardContent>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="font-medium text-foreground mb-1">No hay clases registradas</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Usá los filtros o registrá una nueva clase para comenzar.
          </p>
          <Button
            size="sm"
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onRegisterClick}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar clase
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="font-medium text-muted-foreground">Profesor</TableHead>
              <TableHead className="font-medium text-muted-foreground">Fecha</TableHead>
              <TableHead className="font-medium text-muted-foreground">Hora</TableHead>
              <TableHead className="font-medium text-muted-foreground">Duración</TableHead>
              <TableHead className="font-medium text-muted-foreground">Sede</TableHead>
              <TableHead className="font-medium text-muted-foreground">Cancha</TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">Cobro profesor</TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">Comisión club</TableHead>
              <TableHead className="font-medium text-muted-foreground">Notas</TableHead>
              <TableHead className="w-[90px] font-medium text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((c) => (
              <TableRow key={c.id} className="border-b transition-colors hover:bg-muted/50">
                <TableCell className="font-medium">{professorName(c)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(c.class_date), 'dd/MM/yyyy', { locale: es })}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatTime(c.start_time)} – {formatTime(c.end_time)}
                </TableCell>
                <TableCell>{c.duration_minutes} min</TableCell>
                <TableCell>{venueName(c)}</TableCell>
                <TableCell className="text-muted-foreground">{courtName(c)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(c.amount_professor)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatCurrency(c.amount_club)}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-muted-foreground text-sm">
                  {c.notes || '–'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
