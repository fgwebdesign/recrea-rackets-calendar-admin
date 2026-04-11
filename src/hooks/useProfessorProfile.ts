import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import type {
  ProfessorProfileData,
  ProfessorClassesSummary,
} from '@/types/professor';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getDefaultRange() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  // Default: mes anterior (más probabilidad de tener datos que el mes en curso)
  const prev = subMonths(end, 1);
  return { start: startOfMonth(prev), end: endOfMonth(prev) };
}

export type PeriodPreset = 'last7' | 'thisMonth' | 'lastMonth';

export function useProfessorProfile(professorId: string) {
  const router = useRouter();

  // ── Datos estáticos del perfil (profesor + all-time + recientes) ──
  const [profileData, setProfileData] = useState<ProfessorProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Rango de período para el resumen filtrado ─────────────────────
  const { start: defStart, end: defEnd } = getDefaultRange();
  const [startDate, setStartDate] = useState<Date>(defStart);
  const [endDate, setEndDate] = useState<Date>(defEnd);

  // ── Resumen filtrado por período (on-demand) ──────────────────────
  const [periodSummary, setPeriodSummary] = useState<ProfessorClassesSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // ── Fetch: perfil completo desde el nuevo endpoint ────────────────
  // Un solo request al backend reemplaza los 3 que había antes
  useEffect(() => {
    if (!professorId) return;
    setLoadingProfile(true);
    fetch(`${API_URL}/professors/${professorId}/profile`, { headers: getAuthHeaders() })
      .then((r) => {
        if (r.status === 404) throw new Error('not_found');
        if (!r.ok) throw new Error('server_error');
        return r.json();
      })
      .then((data: ProfessorProfileData) => {
        setProfileData(data);
      })
      .catch((err) => {
        const msg = err.message === 'not_found'
          ? 'Profesor no encontrado'
          : 'No se pudo cargar el perfil del profesor';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        router.push('/professors');
      })
      .finally(() => setLoadingProfile(false));
  }, [professorId, router]);

  // ── Fetch: resumen filtrado por período (user-triggered) ──────────
  const fetchPeriodSummary = useCallback(async () => {
    if (!professorId) return;
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams({
        professor_id: professorId,
        from_date: format(startDate, 'yyyy-MM-dd'),
        to_date: format(endDate, 'yyyy-MM-dd'),
      });
      const res = await fetch(`${API_URL}/professors/classes/summary?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setPeriodSummary(await res.json());
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el resumen del período', variant: 'destructive' });
      setPeriodSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [professorId, startDate, endDate]);

  // Carga el resumen del período por defecto al montar
  useEffect(() => {
    if (professorId) fetchPeriodSummary();
    // Solo al montar; el usuario decide cuándo refrescar con el botón Aplicar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId]);

  // ── Presets de rango rápido ───────────────────────────────────────
  const applyPreset = useCallback((preset: PeriodPreset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset === 'last7') {
      setStartDate(subDays(today, 6));
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      setStartDate(startOfMonth(today));
      setEndDate(today);
    } else {
      const prev = subMonths(today, 1);
      setStartDate(startOfMonth(prev));
      setEndDate(endOfMonth(prev));
    }
  }, []);

  // ── Label legible del período activo ─────────────────────────────
  const periodLabel = useMemo(
    () => `${format(startDate, 'dd MMM', { locale: es })} – ${format(endDate, 'dd MMM yyyy', { locale: es })}`,
    [startDate, endDate]
  );

  return {
    // Perfil completo (datos estáticos + all-time + recientes)
    professor: profileData?.professor ?? null,
    allTime: profileData?.all_time ?? null,
    recentClasses: profileData?.recent_classes ?? [],
    loadingProfile,
    // Período filtrado (on-demand)
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyPreset,
    periodLabel,
    periodSummary,
    loadingSummary,
    fetchPeriodSummary,
  };
}
