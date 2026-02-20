'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTVTournamentData } from '@/hooks/useTVTournamentData';
import { TVLayout } from '@/components/TV/TVLayout';
import { TVStandingsView } from '@/components/TV/TVStandingsView';
import { TVUpcomingMatchesView } from '@/components/TV/TVUpcomingMatchesView';
import { TVBracketCrossesView } from '@/components/TV/TVBracketCrossesView';
import { TVTeamsView } from '@/components/TV/TVTeamsView';
import { Loader2 } from 'lucide-react';

const ROTATION_INTERVAL_MS = 18000; // 18 segundos
const VIEW_ORDER = ['standings', 'matches', 'bracket', 'teams'] as const;

export default function TVTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const { data, loading, error } = useTVTournamentData(tournamentId);

  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [showExit, setShowExit] = useState(false);

  const currentView = VIEW_ORDER[currentViewIndex];

  const rotateView = useCallback(() => {
    setCurrentViewIndex((i) => (i + 1) % VIEW_ORDER.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateView, ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [rotateView]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExit((s) => !s);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleExit = useCallback(() => {
    router.push('/tv');
  }, [router]);

  const title = useMemo(() => data?.tournament?.name || 'Cargando...', [data?.tournament?.name]);

  if (loading && !data) {
    return (
      <TVLayout title="Cargando...">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-16 w-16 text-blue-400 animate-spin mb-4" />
          <p className="text-slate-400 text-xl">Cargando torneo...</p>
        </div>
      </TVLayout>
    );
  }

  if (error || !data) {
    return (
      <TVLayout title="Error" showExit onExit={handleExit}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-red-400 text-xl mb-4">{error || 'No se encontró el torneo'}</p>
          <button
            onClick={handleExit}
            className="px-6 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600"
          >
            Volver
          </button>
        </div>
      </TVLayout>
    );
  }

  return (
    <TVLayout
      title={title}
      showExit={showExit}
      onExit={handleExit}
    >
      <div className="min-h-full">
        {currentView === 'standings' && (
          <TVStandingsView standings={data.standings} />
        )}
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
    </TVLayout>
  );
}
