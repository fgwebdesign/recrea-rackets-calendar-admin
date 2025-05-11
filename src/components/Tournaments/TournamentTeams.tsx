import { Users, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TournamentTeamsProps {
  teams: any[]; // TODO: Add proper type
  tournamentId: string;
}

export function TournamentTeams({ teams, tournamentId }: TournamentTeamsProps) {
  const [maxTeams, setMaxTeams] = useState(12);
  useEffect(() => {
    // fetch max teams from tournament
    const fetchMaxTeams = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}`);
      const data = await response.json();
      setMaxTeams(data.max_teams);
      console.log(maxTeams);
    };
    fetchMaxTeams();
  }, []);


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Equipos</h2>
          </div>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
            {teams.length}/{maxTeams}
          </span>
        </div>

        <div className="space-y-4">
          {teams.map((teamEntry) => (
            <div key={teamEntry.team_id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-grow">
                <div className="text-sm text-gray-900 dark:text-gray-200">
                  {`${teamEntry.teams.player1?.first_name} ${teamEntry.teams.player1?.last_name} / 
                    ${teamEntry.teams.player2?.first_name} ${teamEntry.teams.player2?.last_name}`}
                </div>
              </div>
            </div>
          ))}

          {/* Espacios vacíos para equipos faltantes */}
          {teams.length < maxTeams && Array.from({ length: maxTeams - teams.length }).map((_, index) => (
            <div key={`empty-${index}`} className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Shield className="h-5 w-5 text-gray-400 dark:text-gray-600" />
              </div>
              <div className="flex-grow">
                <p className="text-sm text-gray-400 dark:text-gray-500">Equipo pendiente</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 