'use client';

import { useParams, useRouter } from 'next/navigation';
import { TournamentHeader } from '@/components/Tournaments/TournamentHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTournaments } from '@/hooks/useTournaments';
import { TournamentOverview } from '@/components/Tournaments/TournamentOverview';
import { TournamentPrizes } from '@/components/Tournaments/TournamentPrizes';
import { TournamentTeams } from '@/components/Tournaments/TournamentTeams';
import { TournamentRules } from '@/components/Tournaments/TournamentRules';
import { TournamentStats } from '@/components/Tournaments/TournamentStats';
import { SocialMediaGenerator } from '@/components/Tournaments/SocialMediaGenerator';
import { RulesDownloader } from '@/components/Tournaments/RulesDownloader';
import { TournamentSchedule } from '@/components/Tournaments/TournamentSchedule';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Match as MatchType } from '@/types/tournament';
import { TournamentMatchesList, HookTournamentTeam } from '@/components/Tournaments/TournamentMatchesList';

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { tournament, teams, loading: tournamentLoading } = useTournaments(params.id as string);

  // State for matches
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      const fetchMatches = async () => {
        setMatchesLoading(true);
        setMatchesError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${params.id}/matches`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error fetching matches' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.matches) {
            setMatches(data.matches);
          } else if (data.message && data.matches === undefined) { // Handle specific error messages from API
             // If data.matches is explicitly empty array, it's handled by TournamentMatchesList
            setMatchesError(data.message);
            setMatches([]); // Ensure matches is empty if error implies no data
          }
        } catch (error) {
          console.error("Failed to fetch matches:", error);
          setMatchesError(error instanceof Error ? error.message : 'An unknown error occurred');
          setMatches([]); // Clear matches on error
        } finally {
          setMatchesLoading(false);
        }
      };

      fetchMatches();
    }
  }, [params.id]);

  if (tournamentLoading) return <LoadingSpinner />;
  if (!tournament) return <p className="text-center text-red-500">Torneo no encontrado.</p>;

  // The `teams` variable from `useTournaments` hook should be an array of `HookTournamentTeam`.
  // If `useTournaments` doesn't explicitly type its return for `teams` this way,
  // this cast assumes its structure matches `HookTournamentTeam`.
  const typedTeamsForMatchesList = teams as HookTournamentTeam[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TournamentHeader 
        tournament={tournament}
        onBack={() => router.push('/tournaments')}
      />

      <main className="max-w-7xl mx-auto px-4 -mt-16 relative z-10 sm:px-6 lg:px-8">
        {/* Primera fila: Información General y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 backdrop-blur-sm
                          border border-gray-200 dark:border-gray-700">
              <TournamentOverview tournament={tournament} />
            </div>
          </div>
          
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 backdrop-blur-sm
                          border border-gray-200 dark:border-gray-700">
              <TournamentStats 
                tournament={tournament}
                teams={teams}
                tournamentId={params.id as string}
              />
            </div>
          </div>
        </div>

        {/* Segunda fila: Horarios */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                        border border-gray-200 dark:border-gray-700">
            <TournamentSchedule tournament={tournament} />
          </div>
        </div>

        {/* Tercera fila: Premios */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 
                        dark:from-yellow-900/20 dark:to-yellow-800/20
                        rounded-xl shadow-sm p-6 
                        border border-yellow-200 dark:border-yellow-700">
            <TournamentPrizes tournament={tournament} />
          </div>
        </div>

        {/* Cuarta fila: Equipos */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                        border border-gray-200 dark:border-gray-700">
            <TournamentTeams teams={teams} tournamentId={tournament.id} />
          </div>
        </div>

        {/* Quinta fila: Utilidades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                        border border-gray-200 dark:border-gray-700">
            <RulesDownloader 
              tournament={tournament}
              tournamentInfo={{
                rules: tournament.tournament_info?.[0]?.rules || ''
              }}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                        border border-gray-200 dark:border-gray-700">
            <SocialMediaGenerator 
              tournament={tournament}
              tournamentInfo={tournament.tournament_info?.[0]}
            />
          </div>
        </div>

        {/* Sexta fila: Reglas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                      border border-gray-200 dark:border-gray-700 mb-8">
          <TournamentRules tournament={tournament} />
        </div>

        {/* Nueva sección: Lista de Partidos */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                        border border-gray-200 dark:border-gray-700">
            {matchesLoading && <LoadingSpinner />}
            {matchesError && <p className="text-center text-red-500">Error al cargar partidos: {matchesError}</p>}
            {!matchesLoading && !matchesError && (
              <TournamentMatchesList
                matches={matches}
                teams={typedTeamsForMatchesList}
                tournamentId={tournament.id}
              />
            )}
          </div>
        </div>

        <div className="bg-gray-800 dark:bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Estadísticas del Torneo</h2>
          
          <Link 
            href={`/tournaments/${tournament.id}/groups`} 
            className="w-full mt-4"
          >
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              variant="default"
            >
              Ver parejas inscritas
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
