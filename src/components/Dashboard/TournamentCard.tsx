import { Tournament } from '@/types/tournament';
import { formatDate } from '@/utils/date';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const [maxTeams, setMaxTeams] = useState(12);

  useEffect(() => {
    const fetchMaxTeams = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.id}`);
      const data = await response.json();
      setMaxTeams(data.max_teams);
    };
    fetchMaxTeams();
  }, [tournament.id]);

  const teamsCount = tournament.tournament_teams?.length || 0;
  const progressPercentage = (teamsCount / maxTeams) * 100;

  return (
    <Link 
      href={`/tournaments/${tournament.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header con imagen y título */}
      <div className="relative h-32 bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="absolute inset-0 flex items-center justify-center">
          {tournament.tournament_info[0]?.tournament_thumbnail ? (
            <Image
              src={tournament.tournament_info[0].tournament_thumbnail}
              alt={tournament.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-4">
        {/* Título y fechas */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">
            {tournament.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <div className="flex gap-2">
              <span className="text-green-600 dark:text-green-400 font-medium">{formatDate(tournament.start_date)}</span>
              <span className="text-gray-400 dark:text-gray-500">-</span>
              <span className="text-red-600 dark:text-red-400 font-medium">{formatDate(tournament.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        {tournament.tournament_info[0] && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pb-3 border-b border-gray-100 dark:border-gray-700">
            <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>{tournament.tournament_info[0].tournament_club_name}</span>
          </div>
        )}
        
        {/* Progreso de inscripción */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-green-800 dark:text-green-400 font-semibold">Cupos disponibles</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
              {teamsCount}/{maxTeams}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100 
                  ? 'bg-green-500 dark:bg-green-400' 
                  : progressPercentage > 75 
                    ? 'bg-yellow-500 dark:bg-yellow-400' 
                    : 'bg-blue-500 dark:bg-blue-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
