import { Tournament } from '@/types/tournament';
import { formatDate } from '@/utils/date';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, Trophy } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const MAX_TEAMS = 12;
  const teamsCount = tournament.tournament_teams?.length || 0;
  const progressPercentage = (teamsCount / MAX_TEAMS) * 100;

  return (
    <Link 
      href={`/tournaments/${tournament.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header con imagen y título */}
      <div className="relative h-32 bg-gradient-to-br from-blue-50 to-gray-50 border-b border-gray-100">
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
            <Trophy className="w-12 h-12 text-gray-300" />
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-4">
        {/* Título y fechas */}
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">
            {tournament.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-500" />
            <div className="flex gap-2">
              <span className="text-green-600 font-medium">{formatDate(tournament.start_date)}</span>
              <span className="text-gray-400">-</span>
              <span className="text-red-600 font-medium">{formatDate(tournament.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        {tournament.tournament_info[0] && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pb-3 border-b border-gray-100">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>{tournament.tournament_info[0].tournament_club_name}</span>
          </div>
        )}
        
        {/* Progreso de inscripción */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-blue-500" />
              <span className='text-green-800 font-semibold'>Cupos disponibles</span>
            </div>
            <span className="font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded-md">
              {teamsCount}/{MAX_TEAMS}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100 
                  ? 'bg-green-500' 
                  : progressPercentage > 75 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
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
