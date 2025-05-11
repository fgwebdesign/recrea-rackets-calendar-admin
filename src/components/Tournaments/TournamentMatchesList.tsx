'use client';

import { Match } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { HookTournamentTeam, HookPlayer, HookTeamDetails } from '@/types/hooks'; // Import from new central location

const getTeamDisplay = (teamIdToFind: string | null, allHookTeams: HookTournamentTeam[]): string => {
  if (!teamIdToFind) return 'Equipo no definido';

  // match.home_team_id or match.away_team_id corresponds to HookTournamentTeam.team_id
  const hookTeamEntry = allHookTeams.find(entry => entry.team_id === teamIdToFind);

  if (hookTeamEntry && hookTeamEntry.teams) {
    const teamDetails = hookTeamEntry.teams;
    const p1Name = teamDetails.player1?.name || 'Jugador 1';
    const p2Name = teamDetails.player2?.name || 'Jugador 2';
    // If teamDetails.name exists and is preferred, use it. Otherwise, construct from players.
    return teamDetails.name || `${p1Name} / ${p2Name}`;
  }
  return `Equipo ID: ${teamIdToFind.substring(0, 6)}`; // Fallback
};

interface TournamentMatchesListProps {
  matches: Match[];
  teams: HookTournamentTeam[]; // Use the locally defined accurate type
  tournamentId: string;
}

export function TournamentMatchesList({ matches, teams, tournamentId }: TournamentMatchesListProps) {
  const router = useRouter();

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-4 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        No hay partidos registrados aún para este torneo.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lista de Partidos</h3>
        <Button 
          variant="outline"
          onClick={() => router.push(`/tournaments/${tournamentId}/set-results`)}
        >
          Setear Resultados
        </Button>
      </div>
      <ScrollArea className="h-[500px] rounded-md border border-gray-200 dark:border-gray-700 p-4">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {matches.map((match) => {
            const hasResult = match.score && match.score.trim() !== '';
            const buttonText = hasResult ? 'Resultado' : 'Cargar Resultado';

            return (
              <li key={match.id} className="py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {getTeamDisplay(match.home_team_id, teams)}
                      <span className="text-gray-500 dark:text-gray-400 mx-1"> vs </span>
                      {getTeamDisplay(match.away_team_id, teams)}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-2">
                      {match.round && <span>Ronda: {match.round}</span>}
                      {match.match_day && <span>Día: {new Date(match.match_day as string).toLocaleDateString()}</span>}
                      {match.start_time && <span>Hora: {new Date(match.start_time as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={match.status.toLowerCase() === 'completed' ? 'default' : 'outline'}
                           className={match.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' :
                                      match.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' :
                                      match.status.toLowerCase() === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}>
                      {match.status.toLowerCase() === 'pending' ? 'Pendiente' :
                       match.status.toLowerCase() === 'completed' ? 'Completado' :
                       match.status.toLowerCase() === 'live' ? 'En vivo' :
                       match.status}
                    </Badge>
                    {hasResult && <p className="text-sm font-semibold">{match.score}</p>}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => console.log(`TODO: Navigate to set results for match ${match.id} in tournament ${tournamentId}`)}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
} 