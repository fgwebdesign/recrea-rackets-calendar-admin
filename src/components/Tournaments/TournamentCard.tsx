import { Category, Tournament } from '@/types/tournament';
import { formatDate } from '@/utils/date';
import { getCategoryName } from '@/utils/category';
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import Image from 'next/image';

interface TournamentCardProps {
  tournament: Tournament;
  categories: Category[];
}

export const TournamentCard = ({ tournament, categories }: TournamentCardProps) => {
  const MAX_TEAMS = 12;
  const teamsCount = tournament.tournament_teams?.length || 0;
  const progressPercentage = (teamsCount / MAX_TEAMS) * 100;
  const info = tournament.tournament_info;

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
                shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      <div className="relative h-48">
        {info?.tournament_thumbnail ? (
          <Image
            src={info.tournament_thumbnail}
            alt={tournament.name}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-500">Sin imagen</div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 rounded-full text-sm font-medium shadow-sm">
            {tournament.status === 'upcoming' ? 'Próximo' :
             tournament.status === 'in_progress' ? 'En Curso' : 'Finalizado'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 
                     group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tournament.name}
        </h2>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
            {getCategoryName(tournament.category_id, categories)}
          </span>
        </div>

        <div className="space-y-2 text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm">
              {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
            </span>
          </div>

          {info && (
            <>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm">{info.tournament_club_name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Equipos inscriptos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {teamsCount}/{MAX_TEAMS}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}; 