'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTVEvents } from '@/hooks/useTVEvents';
import { useTVEventData } from '@/hooks/useTVEventData';
import { TVLayout } from '@/components/TV/TVLayout';
import { TVSummaryCards } from '@/components/TV/TVSummaryCards';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TVStandingsView } from '@/components/TV/TVStandingsView';
import { TVUpcomingMatchesView } from '@/components/TV/TVUpcomingMatchesView';
import { TVBracketCrossesView } from '@/components/TV/TVBracketCrossesView';
import { TVTeamsView } from '@/components/TV/TVTeamsView';
import { Loader2 } from 'lucide-react';

const ROTATION_INTERVAL_MS = 18000;
const VIEW_ORDER = ['standings', 'matches', 'bracket', 'teams'] as const;

export default function TVPage() {
  const searchParams = useSearchParams();
  const { events, loading: eventsLoading } = useTVEvents();
  const eventFromUrl = searchParams.get('event');
  const [selectedCommonCode, setSelectedCommonCode] = useState<string | null>(eventFromUrl || null);
  const [showExit, setShowExit] = useState(false);

  useEffect(() => {
    if (eventFromUrl) setSelectedCommonCode(eventFromUrl);
  }, [eventFromUrl]);

  const { data, loading: dataLoading, error } = useTVEventData(selectedCommonCode);

  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const currentView = VIEW_ORDER[currentViewIndex];

  useEffect(() => {
    if (events.length > 0 && !selectedCommonCode && !eventFromUrl) {
      setSelectedCommonCode(events[0].common_code);
    }
  }, [events, selectedCommonCode, eventFromUrl]);

  const rotateView = useCallback(() => {
    setCurrentViewIndex((i) => (i + 1) % VIEW_ORDER.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateView, ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [rotateView]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExit((s) => !s);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleExit = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  const title = useMemo(
    () => (data?.tournament?.name ? `Pantalla TV - ${data.tournament.name}` : 'Pantalla TV - Torneos'),
    [data?.tournament?.name]
  );

  const isLoading = eventsLoading || (selectedCommonCode && dataLoading && !data);

  const upcomingCount = useMemo(() => {
    if (!data?.matches) return 0;
    return data.matches.filter((m: { status?: string }) => m.status === 'scheduled' || m.status === 'in_progress').length;
  }, [data?.matches]);

  const groupsCount = useMemo(() => {
    if (!data?.standings) return 0;
    return Object.keys(data.standings).length;
  }, [data?.standings]);

  return (
    <TVLayout title={title} showExit={showExit} onExit={handleExit}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <Select
            value={selectedCommonCode || ''}
            onValueChange={(v) => setSelectedCommonCode(v || null)}
          >
            <SelectTrigger className="w-[min(24rem,100%)] bg-white border-2 border-slate-200 text-slate-800 text-base h-12 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {events.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  {eventsLoading ? 'Cargando...' : 'No hay torneos activos'}
                </SelectItem>
              ) : (
                events.map((e) => (
                  <SelectItem key={e.common_code} value={e.common_code} className="text-base">
                    {e.display_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-800">
            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-4" />
            <p className="text-xl font-semibold">Cargando...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p className="text-rose-700 text-xl font-semibold">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-700 text-xl">
            <p className="font-semibold">Seleccioná una categoría para ver los datos</p>
          </div>
        ) : (
          <>
            <TVSummaryCards
              tournamentName={data.tournament?.name ?? '—'}
              teamsCount={data.teams?.length ?? 0}
              upcomingMatchesCount={upcomingCount}
              groupsCount={groupsCount}
            />
            <div className="min-h-[50vh]">
              {currentView === 'standings' && <TVStandingsView standings={data.standings} />}
              {currentView === 'matches' && (
                <TVUpcomingMatchesView matches={data.matches} teams={data.teams} />
              )}
              {currentView === 'bracket' && (
                <TVBracketCrossesView matches={data.matches} teams={data.teams} />
              )}
              {currentView === 'teams' && (
                <TVTeamsView
                  teams={data.teams}
                  classificationSummary={data.classification_summary}
                />
              )}
            </div>
          </>
        )}
      </div>
    </TVLayout>
  );
}
