'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTVEvents } from '@/hooks/useTVEvents';
import { useTVEventData } from '@/hooks/useTVEventData';
import { useTVTheme } from '@/hooks/useTVTheme';
import { useTVSettings } from '@/hooks/useTVSettings';
import { TVLayout } from '@/components/TV/TVLayout';
import { TVSummaryCards } from '@/components/TV/TVSummaryCards';
import { TVStandingsView } from '@/components/TV/TVStandingsView';
import { TVUpcomingMatchesView } from '@/components/TV/TVUpcomingMatchesView';
import { TVBracketCrossesView } from '@/components/TV/TVBracketCrossesView';
import { TVTeamsView } from '@/components/TV/TVTeamsView';
import { TVSettingsPanel } from '@/components/TV/TVSettingsPanel';
import { Loader2 } from 'lucide-react';

type TView = 'standings' | 'matches' | 'bracket' | 'teams';

type MatchRecord = { status?: string; round?: string };

/** Calcula qué vistas tienen datos reales para la categoría actual */
function computeAvailableViews(data: {
  standings?: Record<string, { teams?: unknown[] }> | null;
  matches?: MatchRecord[];
  teams?: unknown[];
} | null): TView[] {
  if (!data) return [];

  const views: TView[] = [];

  // standings: al menos un grupo con equipos
  const hasStandings =
    data.standings &&
    Object.values(data.standings).some((g) => Array.isArray(g.teams) && g.teams.length > 0);
  if (hasStandings) views.push('standings');

  // matches: partidos programados de fase de grupos
  const hasMatches = Array.isArray(data.matches) &&
    data.matches.some(
      (m) =>
        (m.status === 'scheduled' || m.status === 'in_progress') &&
        (!m.round || m.round === 'group')
    );
  if (hasMatches) views.push('matches');

  // bracket: partidos eliminatorios pendientes
  const hasBracket = Array.isArray(data.matches) &&
    data.matches.some(
      (m) =>
        m.round &&
        m.round !== 'group' &&
        (m.status === 'scheduled' || m.status === 'pending' || m.status === 'in_progress')
    );
  if (hasBracket) views.push('bracket');

  // teams: hay equipos inscritos
  const hasTeams = Array.isArray(data.teams) && data.teams.length > 0;
  if (hasTeams) views.push('teams');

  // Garantía mínima: si no hay nada (torneo recién creado), mostrar standings vacío
  if (views.length === 0) views.push('standings');

  return views;
}

export default function TVPage() {
  const searchParams = useSearchParams();
  const { events, loading: eventsLoading } = useTVEvents();
  const { currentTheme, applyTheme } = useTVTheme();
  const { settings, updateSettings } = useTVSettings();

  const eventFromUrl = searchParams.get('event');

  // ── Category rotation ─────────────────────────────────
  const [categoryIndex, setCategoryIndex] = useState(0);
  const categoryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const effectiveCategory =
    eventFromUrl ??
    settings.lockedCategory ??
    (events[categoryIndex]?.common_code ?? null);

  // ── Data fetching ─────────────────────────────────────
  const { data, loading: dataLoading } = useTVEventData(effectiveCategory);

  // ── Vistas disponibles según data real ────────────────
  const availableViews = useMemo(() => computeAvailableViews(data), [data]);

  // ── View rotation ─────────────────────────────────────
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [viewProgress, setViewProgress] = useState(0);
  const viewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cuando cambia la categoría o las vistas disponibles, resetear al índice 0
  useEffect(() => {
    setCurrentViewIndex(0);
    setViewProgress(0);
  }, [effectiveCategory, availableViews.join(',')]);

  // ── Settings panel ────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showExit, setShowExit] = useState(false);

  // ── Keyboard handler ──────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else {
          setShowExit((s) => !s);
          setSettingsOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen]);

  // ── Category auto-rotation ────────────────────────────
  const rotateCategoryFn = useCallback(() => {
    if (settings.lockedCategory || eventFromUrl) return;
    setCategoryIndex((i) => (i + 1) % Math.max(1, events.length));
    setCurrentViewIndex(0);
    setViewProgress(0);
  }, [settings.lockedCategory, eventFromUrl, events.length]);

  useEffect(() => {
    if (categoryTimerRef.current) clearInterval(categoryTimerRef.current);
    if (
      settings.categoryInterval > 0 &&
      !settings.lockedCategory &&
      !eventFromUrl &&
      events.length > 1
    ) {
      categoryTimerRef.current = setInterval(rotateCategoryFn, settings.categoryInterval * 1000);
    }
    return () => { if (categoryTimerRef.current) clearInterval(categoryTimerRef.current); };
  }, [settings.categoryInterval, settings.lockedCategory, eventFromUrl, events.length, rotateCategoryFn]);

  // ── View rotation — solo entre vistas con data ────────
  const rotateViewFn = useCallback(() => {
    setCurrentViewIndex((i) => (i + 1) % Math.max(1, availableViews.length));
    setViewProgress(0);
  }, [availableViews.length]);

  useEffect(() => {
    if (viewTimerRef.current) clearInterval(viewTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    if (availableViews.length === 0) return;

    const intervalMs = settings.viewInterval * 1000;
    viewTimerRef.current = setInterval(rotateViewFn, intervalMs);

    const tickMs = 250;
    progressTimerRef.current = setInterval(() => {
      setViewProgress((p) => Math.min(100, p + (tickMs / intervalMs) * 100));
    }, tickMs);

    return () => {
      if (viewTimerRef.current) clearInterval(viewTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [settings.viewInterval, rotateViewFn, availableViews.length]);

  // Auto-select first category when events load
  useEffect(() => {
    if (events.length > 0 && !eventFromUrl && !settings.lockedCategory) {
      setCategoryIndex(0);
    }
  }, [events, eventFromUrl, settings.lockedCategory]);

  // Vista actual (siempre dentro de las disponibles)
  const safeIndex = availableViews.length > 0 ? currentViewIndex % availableViews.length : 0;
  const currentView: TView = availableViews[safeIndex] ?? 'standings';

  const isLoading = eventsLoading || (effectiveCategory && dataLoading && !data);

  const upcomingCount = Array.isArray(data?.matches)
    ? (data.matches as MatchRecord[]).filter(
        (m) => m.status === 'scheduled' || m.status === 'in_progress'
      ).length
    : 0;

  const groupsCount = data?.standings ? Object.keys(data.standings).length : 0;

  const activeCategoryIndex =
    settings.lockedCategory
      ? events.findIndex((e) => e.common_code === settings.lockedCategory)
      : eventFromUrl
      ? events.findIndex((e) => e.common_code === eventFromUrl)
      : categoryIndex;

  const categoryLabel =
    data?.tournament?.name ??
    events.find((e) => e.common_code === effectiveCategory)?.display_name ??
    undefined;

  return (
    <>
      <TVLayout
        title="Pantalla TV"
        theme={currentTheme}
        showExit={showExit}
        onExit={() => { window.location.href = '/dashboard'; }}
        onOpenSettings={() => setSettingsOpen(true)}
        currentView={currentView}
        viewOrder={availableViews}
        categoryIndex={Math.max(0, activeCategoryIndex)}
        categoryTotal={settings.lockedCategory || eventFromUrl ? 1 : Math.max(1, events.length)}
        categoryLabel={categoryLabel}
        viewProgress={viewProgress}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'var(--tv-text)' }}>
            <Loader2 className="h-20 w-20 animate-spin" style={{ color: 'var(--tv-accent)' }} />
            <p className="text-2xl font-bold font-orbitron tracking-wide">Cargando...</p>
          </div>
        ) : !data ? (
          <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: 'var(--tv-text-muted)' }}>
            {eventsLoading ? (
              <>
                <Loader2 className="h-16 w-16 animate-spin" style={{ color: 'var(--tv-accent)' }} />
                <p className="text-2xl font-bold font-orbitron">Cargando eventos...</p>
              </>
            ) : events.length === 0 ? (
              <p className="text-2xl font-bold font-orbitron">No hay torneos activos</p>
            ) : (
              <p className="text-2xl font-bold font-orbitron">Esperando datos...</p>
            )}
          </div>
        ) : (
          // flex-col que llena todo el main — sin scroll
          <div className="flex flex-col h-full min-h-0 gap-0">
            <TVSummaryCards
              tournamentName={data.tournament?.name ?? '—'}
              teamsCount={data.teams?.length ?? 0}
              upcomingMatchesCount={upcomingCount}
              groupsCount={groupsCount}
            />
            {/* Vista activa — ocupa todo el espacio restante */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {currentView === 'standings' && <TVStandingsView standings={data.standings} />}
              {currentView === 'matches' && (
                <TVUpcomingMatchesView matches={data.matches} teams={data.teams} />
              )}
              {currentView === 'bracket' && (
                <TVBracketCrossesView matches={data.matches} teams={data.teams} />
              )}
              {currentView === 'teams' && (
                <TVTeamsView teams={data.teams} classificationSummary={data.classification_summary} />
              )}
            </div>
          </div>
        )}
      </TVLayout>

      {settingsOpen && (
        <TVSettingsPanel
          currentTheme={currentTheme}
          settings={settings}
          events={events}
          onThemeChange={applyTheme}
          onSettingsChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
