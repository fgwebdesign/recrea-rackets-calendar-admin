'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournaments } from '@/hooks/useTournaments';
import { Match as MatchType } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { HookTournamentTeam } from '@/types/hooks';
import { SetMatchResultModal, ScoreInput } from '@/components/Tournaments/matches/SetMatchResultModal';

const getTeamDisplay = (teamIdToFind: string | null, allHookTeams: HookTournamentTeam[]): string => {
  if (!teamIdToFind) return 'Equipo no definido';
  const hookTeamEntry = allHookTeams.find(entry => entry.team_id === teamIdToFind || entry.teams?.id === teamIdToFind);
  if (hookTeamEntry && hookTeamEntry.teams) {
    const teamDetails = hookTeamEntry.teams;
    const p1Name = teamDetails.player1?.name || 'Jugador 1';
    const p2Name = teamDetails.player2?.name || 'Jugador 2';
    return teamDetails.name || `${p1Name} / ${p2Name}`;
  }
  return `Equipo ID: ${teamIdToFind.substring(0, 6)}`;
};

interface ModalState {
  isOpen: boolean;
  selectedMatch: MatchType | null;
}

export default function SetTournamentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const { tournament, teams: tournamentTeamsData, loading: tournamentInfoLoading } = useTournaments(tournamentId);
  
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, selectedMatch: null });

  useEffect(() => {
    if (tournamentId) {
      const fetchMatches = async () => {
        setMatchesLoading(true);
        setMatchesError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error fetching matches data' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.matches) {
            setMatches(data.matches);
          } else {
            setMatches([]);
          }
        } catch (error) {
          console.error("Failed to fetch matches:", error);
          setMatchesError(error instanceof Error ? error.message : 'An unknown error occurred while fetching matches');
          setMatches([]);
        } finally {
          setMatchesLoading(false);
        }
      };
      fetchMatches();
    }
  }, [tournamentId]);

  const handleOpenSetResultModal = (match: MatchType) => {
    setModalState({ isOpen: true, selectedMatch: match });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, selectedMatch: null });
  };

  const handleSaveResult = async (matchId: string, scoreData: ScoreInput) => {
    console.log(`TODO: Save result for match ${matchId}, score: ${scoreData.score}`);
    setMatches(prevMatches => 
      prevMatches.map(m => 
        m.id === matchId ? { ...m, score: scoreData.score, status: 'completed' } : m
      )
    );
    handleCloseModal();
  };

  if (tournamentInfoLoading) return <LoadingSpinner />;

  const typedTeams = (tournamentTeamsData || []) as HookTournamentTeam[];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Setear Resultados para: {tournament?.name || 'Torneo'}
        </h1>
      </header>

      {matchesLoading && <LoadingSpinner />}
      {matchesError && <p className="text-center text-red-500 py-4">Error al cargar partidos: {matchesError}</p>}
      
      {!matchesLoading && !matchesError && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No hay partidos registrados para este torneo o aún no se han generado.
            </p>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="flex-grow">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {getTeamDisplay(match.home_team_id, typedTeams)}
                    <span className="text-gray-500 dark:text-gray-400 mx-1"> vs </span>
                    {getTeamDisplay(match.away_team_id, typedTeams)}
                  </p>
                  {match.score && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Resultado Actual: <span className="font-semibold">{match.score}</span>
                    </p>
                  )}
                   <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {match.round && <span>Ronda: {match.round} </span>}
                      {match.match_day && <span>Día: {new Date(match.match_day as string).toLocaleDateString()} </span>}
                      {match.start_time && <span>Hora: {new Date(match.start_time as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                   </div>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleOpenSetResultModal(match)}
                >
                  Setear Resultado
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {modalState.isOpen && modalState.selectedMatch && (
        <SetMatchResultModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSave={handleSaveResult}
          match={modalState.selectedMatch}
          teams={typedTeams}
        />
      )}
    </div>
  );
} 