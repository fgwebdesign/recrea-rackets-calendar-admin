'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, PlusCircle, BarChart3, LayoutGrid, ListTodo, FileText } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfessorClasses } from '@/hooks/useProfessorClasses';
import { useProfessorClassesSummary } from '@/hooks/useProfessorClasses';
import { useProfessors } from '@/hooks/useProfessors';
import { useVenues } from '@/hooks/useVenues';
import { useClubSettings } from '@/hooks/useClubSettings';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import type { ProfessorClass } from '@/types/professor';
import RegisterClassModal from '@/components/Professors/RegisterClassModal';
import EditClassModal from '@/components/Professors/EditClassModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import {
  CommissionCard,
  ClassFiltersCard,
  ClassesTable,
  SummaryKpiCards,
  HoursByProfessorChart,
  HoursOverTimeChart,
  RevenueDistributionChart,
  SummaryTables,
  ExportReportButton,
} from '@/components/Professors/Classes';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ProfessorClassesPage() {
  const searchParams = useSearchParams();
  const [professorId, setProfessorId] = useState<string>(() => searchParams.get('professor_id') || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [venueId, setVenueId] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ProfessorClass | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; classId: string | null; label: string }>({
    isOpen: false,
    classId: null,
    label: '',
  });

  const filters = {
    professor_id: professorId || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    venue_id: venueId || undefined,
  };
  const { classes, total, isLoading, fetchClasses, createClass, updateClass, deleteClass } =
    useProfessorClasses(filters);
  const { professors } = useProfessors();
  const { venues } = useVenues({ includeCourts: true });
  const { clubSettings, fetchClubSettings, updateClubSettings } = useClubSettings();
  const summaryFilters = {
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    professor_id: professorId || undefined,
  };
  const { summary, isLoading: summaryLoading, fetchSummary } = useProfessorClassesSummary(summaryFilters);

  const loadClasses = useCallback(() => {
    fetchClasses(page, 20);
  }, [fetchClasses, page]);

  useEffect(() => {
    const q = searchParams.get('professor_id');
    if (q) setProfessorId(q);
  }, [searchParams]);

  useEffect(() => {
    loadClasses();
    fetchClubSettings();
  }, [loadClasses, fetchClubSettings]);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'reports') fetchSummary();
  }, [activeTab, fetchSummary]);

  const handleSaveCommission = async (percent: number) => {
    try {
      await updateClubSettings({ club_commission_percent: percent });
      toast({ title: 'Éxito', description: 'Comisión del club actualizada' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error al guardar', variant: 'destructive' });
    }
  };

  const filtersState = {
    professorId,
    fromDate,
    toDate,
    venueId,
  };

  const setFiltersState = (partial: Partial<typeof filtersState>) => {
    if (partial.professorId !== undefined) setProfessorId(partial.professorId);
    if (partial.fromDate !== undefined) setFromDate(partial.fromDate);
    if (partial.toDate !== undefined) setToDate(partial.toDate);
    if (partial.venueId !== undefined) setVenueId(partial.venueId);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchClasses(1, 20);
  };

  const handleClearFilters = () => {
    setProfessorId('');
    setFromDate('');
    setToDate('');
    setVenueId('');
    setPage(1);
  };

  const handlePresetRange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    setPage(1);
  };

  const handleRegisterSubmit = async (payload: {
    professor_id: string;
    venue_id: string;
    court_id?: string | null;
    class_date: string;
    start_time: string;
    end_time: string;
    notes?: string | null;
  }) => {
    try {
      await createClass(payload);
      toast({ title: 'Éxito', description: 'Clase registrada correctamente' });
      setIsRegisterOpen(false);
      loadClasses();
      fetchSummary();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al registrar la clase',
        variant: 'destructive',
      });
      throw e;
    }
  };

  const handleEditSubmit = async (
    classId: string,
    payload: { venue_id?: string; court_id?: string | null; class_date?: string; start_time?: string; end_time?: string; notes?: string | null }
  ) => {
    try {
      await updateClass(classId, payload);
      toast({ title: 'Éxito', description: 'Clase actualizada correctamente' });
      setEditingClass(null);
      loadClasses();
      fetchSummary();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al actualizar la clase',
        variant: 'destructive',
      });
      throw e;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.classId) return;
    try {
      await deleteClass(deleteModal.classId);
      toast({ title: 'Éxito', description: 'Clase eliminada' });
      setDeleteModal({ isOpen: false, classId: null, label: '' });
      loadClasses();
      fetchSummary();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Error al eliminar',
        variant: 'destructive',
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const venueList = venues || [];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header
          title="Registro de clases"
          icon={<Clock className="w-6 h-6 text-foreground" />}
          description="Dashboard de clases de profesores, reportes y totales por cobro y comisión."
          button={
            <Button
              onClick={() => setIsRegisterOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar clase
            </Button>
          }
        />

        <CommissionCard
          clubSettings={clubSettings}
          onSave={handleSaveCommission}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-11 rounded-lg bg-muted/60 p-1 grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="dashboard" className="rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-md gap-2">
              <ListTodo className="h-4 w-4" />
              Listado
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-md gap-2">
              <FileText className="h-4 w-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6 mt-0">
            <ClassFiltersCard
              filters={filtersState}
              onFiltersChange={setFiltersState}
              onApply={() => { setPage(1); fetchClasses(1, 20); fetchSummary(); }}
              onClear={handleClearFilters}
              professors={professors}
              venues={venueList}
              onPresetRange={handlePresetRange}
            />

            {summaryLoading && !summary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : summary ? (
              <>
                <SummaryKpiCards
                  totalHours={summary.total_hours}
                  totalAmountProfessor={summary.total_amount_professor}
                  totalAmountClub={summary.total_amount_club}
                  formatCurrency={formatCurrency}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HoursByProfessorChart data={summary.by_professor} formatCurrency={formatCurrency} />
                  <RevenueDistributionChart
                    totalAmountProfessor={summary.total_amount_professor}
                    totalAmountClub={summary.total_amount_club}
                    formatCurrency={formatCurrency}
                  />
                </div>
                <HoursOverTimeChart data={summary.by_day} formatCurrency={formatCurrency} />
                <SummaryTables summary={summary} formatCurrency={formatCurrency} />
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium text-foreground mb-1">Sin datos</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Aplicá filtros y hacé clic en Aplicar para ver el dashboard con totales y gráficas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Listado */}
          <TabsContent value="list" className="space-y-6 mt-0">
            <ClassFiltersCard
              filters={filtersState}
              onFiltersChange={setFiltersState}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              professors={professors}
              venues={venueList}
              onPresetRange={handlePresetRange}
            />
            <ClassesTable
              classes={classes}
              isLoading={isLoading}
              totalPages={totalPages}
              page={page}
              onPageChange={setPage}
              formatCurrency={formatCurrency}
              onEdit={(c) => setEditingClass(c)}
              onDelete={(c) =>
                setDeleteModal({
                  isOpen: true,
                  classId: c.id,
                  label: `${(c as ProfessorClass & { professor?: { name?: string } }).professor?.name ?? '–'} - ${format(new Date(c.class_date), 'dd/MM/yyyy', { locale: es })}`,
                })
              }
              onRegisterClick={() => setIsRegisterOpen(true)}
            />
          </TabsContent>

          {/* Reportes */}
          <TabsContent value="reports" className="space-y-6 mt-0">
            <Card className="border-0 shadow-sm">
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Mismo rango de fechas y profesor que en los filtros. Actualizá el resumen para refrescar datos.
                </p>
                <div className="flex gap-2">
                  <ExportReportButton
                    summary={summary ?? null}
                    formatCurrency={formatCurrency}
                    fromDate={fromDate || undefined}
                    toDate={toDate || undefined}
                    disabled={summaryLoading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSummary()}
                    disabled={summaryLoading}
                  >
                    {summaryLoading ? 'Actualizando...' : 'Actualizar resumen'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {summaryLoading && !summary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-48 rounded-lg" />
              </div>
            ) : summary ? (
              <>
                <SummaryKpiCards
                  totalHours={summary.total_hours}
                  totalAmountProfessor={summary.total_amount_professor}
                  totalAmountClub={summary.total_amount_club}
                  formatCurrency={formatCurrency}
                />
                <SummaryTables summary={summary} formatCurrency={formatCurrency} />
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium text-foreground mb-1">Sin datos de reporte</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Aplicá filtros en Dashboard o Listado y luego actualizá el resumen para exportar.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <RegisterClassModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSubmit={handleRegisterSubmit}
          professors={professors}
          venues={venueList}
        />
        {editingClass && (
          <EditClassModal
            isOpen={!!editingClass}
            onClose={() => setEditingClass(null)}
            onSubmit={handleEditSubmit}
            professorClass={editingClass}
            venues={venueList}
          />
        )}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, classId: null, label: '' })}
          onConfirm={handleDeleteConfirm}
          itemName={deleteModal.label}
          itemType="clase"
        />
      </div>
    </div>
  );
}
