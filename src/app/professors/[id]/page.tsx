'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Award,
  Calendar,
  Clock,
  Instagram,
  Phone,
  Wallet,
  Building2,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Play,
  Hash,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { SummaryKpiCards } from '@/components/Professors/Classes/SummaryKpiCards';
import { HoursOverTimeChart } from '@/components/Professors/Classes/HoursOverTimeChart';
import { useProfessorProfile } from '@/hooks/useProfessorProfile';

// ── Utilidades de presentación ───────────────────────────────────────
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return format(d, 'MMMM yyyy', { locale: es });
}

const DAYS_MAP: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
};

// ── Skeleton de carga inicial ────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-6">
      <Skeleton className="h-5 w-40" />
      <div className="rounded-2xl border border-border overflow-hidden">
        <Skeleton className="h-24 w-full" />
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2 pt-14">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────
export default function ProfessorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    professor,
    allTime,
    recentClasses,
    loadingProfile,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyPreset,
    periodLabel,
    periodSummary,
    loadingSummary,
    fetchPeriodSummary,
  } = useProfessorProfile(id);

  if (loadingProfile) return <ProfileSkeleton />;
  if (!professor) return null;

  return (
    <div className="min-h-screen bg-background px-6 py-6 space-y-5">

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => router.push('/professors')}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Profesores
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{professor.name}</span>
      </nav>

      {/* ── 1. Tarjeta de perfil — ancho completo, layout horizontal ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-violet-500/20 via-blue-500/10 to-emerald-500/10" />

        <div className="px-6 pb-6">
          {/* Fila: avatar + datos + CTA */}
          <div className="flex flex-wrap items-end gap-5 -mt-12 mb-5">
            {/* Avatar */}
            <div className="relative h-24 w-24 rounded-2xl border-4 border-card shadow-lg overflow-hidden bg-muted shrink-0">
              {professor.photo_url ? (
                <Image src={professor.photo_url} alt={professor.name} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="h-10 w-10 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Nombre + descripción */}
            <div className="flex-1 min-w-0 pt-14">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{professor.name}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  professor.is_active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {professor.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{professor.description}</p>
            </div>

            {/* CTA */}
            <Link href={`/professors/classes?professor_id=${professor.id}`} className="shrink-0 mb-1">
              <Button variant="outline" size="sm" className="gap-2">
                <Clock className="h-4 w-4" />
                Ver todas las clases
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </Link>
          </div>

          {/* Fila de info cards — 4 columnas a ancho completo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard color="violet" icon={<Award className="h-3.5 w-3.5" />} label="Experiencia">
              <span className="text-lg font-bold">{professor.experience_years}</span>
              <span className="text-xs text-muted-foreground ml-1">años</span>
            </InfoCard>

            {(professor.hourly_rate ?? 0) > 0 && (
              <InfoCard color="emerald" icon={<Wallet className="h-3.5 w-3.5" />} label="Tarifa">
                <span className="text-lg font-bold">${professor.hourly_rate}</span>
                <span className="text-xs text-muted-foreground ml-1">/ hr</span>
              </InfoCard>
            )}

            <InfoCard color="blue" icon={<Building2 className="h-3.5 w-3.5" />} label="Comisión club">
              <span className="text-lg font-bold">{professor.effective_commission_percent}%</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5">
                {professor.commission_source === 'professor'
                  ? 'comisión propia'
                  : `default club (${professor.club_default_commission_percent}%)`}
              </span>
            </InfoCard>

            <InfoCard color="teal" icon={<Calendar className="h-3.5 w-3.5" />} label="Disponibilidad">
              <div className="flex flex-wrap gap-1 mt-0.5">
                {professor.availability_days.map((day) => (
                  <span key={day} className="text-[11px] px-1.5 py-0.5 rounded bg-teal-100/90 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 font-medium">
                    {DAYS_MAP[day] || day}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{professor.availability_hours}</p>
            </InfoCard>
          </div>

          {/* Especialidades + contacto en una fila */}
          {(professor.specializations?.length > 0 || professor.instagram_handle || professor.whatsapp_number) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-border/60">
              {professor.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs font-medium text-muted-foreground">Especialidades:</span>
                  {professor.specializations.map((spec, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{spec}</Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 ml-auto">
                {professor.instagram_handle && (
                  <ContactChip color="rose" icon={<Instagram className="h-3.5 w-3.5" />}>
                    @{professor.instagram_handle}
                  </ContactChip>
                )}
                {professor.whatsapp_number && (
                  <ContactChip color="emerald" icon={<Phone className="h-3.5 w-3.5" />}>
                    {professor.whatsapp_number}
                  </ContactChip>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. All-time KPIs — ancho completo ─────────────────────── */}
      {allTime && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Historial completo</h2>
            {allTime.best_month && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                <Star className="h-3 w-3" />
                Mejor mes: {formatMonthLabel(allTime.best_month.month)} — {allTime.best_month.total_hours.toFixed(1)}h
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AllTimeKpi label="Clases totales" icon={<Hash className="h-4 w-4" />} color="bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="text-2xl font-semibold tabular-nums">{allTime.total_classes}</span>
            </AllTimeKpi>
            <AllTimeKpi label="Horas totales" icon={<Clock className="h-4 w-4" />} color="bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <span className="text-2xl font-semibold tabular-nums">{allTime.total_hours.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground ml-1">h</span>
            </AllTimeKpi>
            <AllTimeKpi label="Total cobrado" icon={<Wallet className="h-4 w-4" />} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl font-semibold tabular-nums">{formatCurrency(allTime.total_amount_professor)}</span>
            </AllTimeKpi>
            <AllTimeKpi label="Comisión club" icon={<Building2 className="h-4 w-4" />} color="bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <span className="text-2xl font-semibold tabular-nums">{formatCurrency(allTime.total_amount_club)}</span>
            </AllTimeKpi>
          </div>
        </section>
      )}

      {/* ── 3. Últimas clases — ancho completo ────────────────────── */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Últimas clases
          </CardTitle>
          <Link
            href={`/professors/classes?professor_id=${professor.id}`}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentClasses.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin clases registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Fecha', 'Horario', 'Duración', 'Sede', 'Cobro', 'Comisión'].map((col, i) => (
                      <th key={col} className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${i >= 4 ? 'text-right' : 'text-left'}`}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {format(new Date(`${cls.class_date}T00:00:00`), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDuration(cls.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{cls.venue?.name ?? '–'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(cls.amount_professor)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        {formatCurrency(cls.amount_club)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Resumen por período — ancho completo ──────────────────────── */}
      <section className="space-y-4">
        {/* Barra de filtro */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center divide-x divide-border">
            <div className="px-5 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground whitespace-nowrap">Resumen por período</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{periodLabel}</p>
            </div>
            <div className="px-5 py-4 flex items-center gap-2">
              {(['last7', 'thisMonth', 'lastMonth'] as const).map((key) => (
                <button key={key} type="button" onClick={() => applyPreset(key)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/40 dark:hover:text-violet-300 transition-colors whitespace-nowrap"
                >
                  {{ last7: '7 días', thisMonth: 'Este mes', lastMonth: 'Mes anterior' }[key]}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Desde</Label>
                <DatePicker value={startDate} onChange={(d) => d && setStartDate(d)} placeholder="Inicio" />
              </div>
              <span className="text-muted-foreground/40 mt-4 text-sm">→</span>
              <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Hasta</Label>
                <DatePicker value={endDate} onChange={(d) => d && setEndDate(d)} placeholder="Fin" />
              </div>
            </div>
            <div className="px-5 py-4 ml-auto">
              <Button onClick={fetchPeriodSummary} disabled={loadingSummary} size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold whitespace-nowrap"
              >
                {loadingSummary
                  ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Cargando…</>
                  : <><Play className="h-4 w-4 mr-2" />Aplicar</>}
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs del período */}
        {loadingSummary ? (
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
        ) : periodSummary ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              <span>
                <strong className="text-foreground">{periodSummary.total_classes}</strong> clase{periodSummary.total_classes !== 1 ? 's' : ''} en el período
              </span>
            </div>
            <SummaryKpiCards
              totalHours={periodSummary.total_hours}
              totalAmountProfessor={periodSummary.total_amount_professor}
              totalAmountClub={periodSummary.total_amount_club}
              formatCurrency={formatCurrency}
            />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Sin datos para el período seleccionado</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Seleccioná un rango y hacé clic en Aplicar</p>
          </div>
        )}

        {/* Gráfico de tendencia — ancho completo */}
        {!loadingSummary && periodSummary && periodSummary.by_day.length > 0 && (
          <HoursOverTimeChart data={periodSummary.by_day} formatCurrency={formatCurrency} />
        )}
      </section>

    </div>
  );
}

// ── Sub-componentes de presentación puros ────────────────────────────

type InfoCardColor = 'violet' | 'emerald' | 'blue' | 'teal';
const colorMap: Record<InfoCardColor, { wrap: string; label: string }> = {
  violet: { wrap: 'bg-violet-50/70 dark:bg-violet-950/20 border-violet-100/80 dark:border-violet-900/30', label: 'text-violet-600 dark:text-violet-400' },
  emerald: { wrap: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/30', label: 'text-emerald-600 dark:text-emerald-400' },
  blue: { wrap: 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-100/80 dark:border-blue-900/30', label: 'text-blue-600 dark:text-blue-400' },
  teal: { wrap: 'bg-teal-50/70 dark:bg-teal-950/20 border-teal-100/80 dark:border-teal-900/30', label: 'text-teal-600 dark:text-teal-400' },
};

function InfoCard({ color, icon, label, children, className = '' }: {
  color: InfoCardColor; icon: React.ReactNode; label: string; children: React.ReactNode; className?: string;
}) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border p-3 ${c.wrap} ${className}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${c.label}`}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function AllTimeKpi({ label, icon, color, children }: {
  label: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <div className="flex items-baseline">{children}</div>
          </div>
          <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const contactColorMap: Record<string, string> = {
  rose: 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/30',
  emerald: 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30',
};

function ContactChip({ color, icon, children }: { color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${contactColorMap[color]}`}>
      {icon}{children}
    </span>
  );
}
