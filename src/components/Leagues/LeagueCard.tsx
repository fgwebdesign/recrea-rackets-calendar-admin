import { Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { League } from '@/types/league';
import { Category } from '@/hooks/useCategories';
import { getCategoryName } from '@/utils/category';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from '@/contexts/TranslationContext';

interface LeagueCardProps {
  league: League;
  categories: Category[];
}

export function LeagueCard({ league, categories }: LeagueCardProps) {
  const t = useTranslations('leagues');
  const categoryName = getCategoryName(league.category_id, categories);
  const registeredTeams = league.registeredTeams || 0;
  const registrationProgress = (registeredTeams / league.team_size) * 100;
  const availableSpots = league.team_size - registeredTeams;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Inscribiendo':
        return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300';
      case 'Activa':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'Finalizada':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Inscribiendo':
        return t('status.inscribiendo');
      case 'Activa':
        return t('status.activa');
      case 'Finalizada':
        return t('status.finalizada');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Link href={`/leagues/${league.id}`}>
      <div className="relative bg-white dark:bg-gray-800/50 rounded-xl shadow-sm hover:shadow-md dark:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group">
        {/* Estado de la liga y categoría */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
            {categoryName}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(league.status)}`}>
            {getStatusText(league.status)}
          </span>
        </div>

        {/* Imagen de la liga */}
        {league.image_url && (
          <div className="relative w-full mb-6" style={{ aspectRatio: '5/4' }}>
            <Image
              src={league.image_url}
              alt={league.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
          </div>
        )}

        {/* Encabezado */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
            {league.name}
          </h3>
        </div>

        {/* Información principal */}
        <div className="space-y-4">
          {/* Fecha de inicio y fin */}
          <div className="flex flex-col gap-2">
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">{t('startDate')}</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                {formatDate(league.start_date)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">{t('endDate')}</p>
              <p className="text-sm text-red-800 dark:text-red-200">
                {formatDate(league.end_date)}
              </p>
            </div>
          </div>

          {/* Equipos y progreso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('registeredTeams')}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {registeredTeams} / {league.team_size}
              </span>
            </div>

            <div className="space-y-2">
              <Progress 
                value={registrationProgress} 
                className="h-2 bg-gray-100 dark:bg-gray-700" 
                indicatorClassName={`${
                  registrationProgress === 100
                    ? 'bg-blue-500 dark:bg-blue-600'
                    : 'bg-emerald-500 dark:bg-emerald-600'
                }`}
              />
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {registrationProgress}% {t('completed')}
                </span>
                {league.status === 'Inscribiendo' && availableSpots > 0 ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {availableSpots} {t('spotsAvailable')}
                  </span>
                ) : registeredTeams === league.team_size && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t('spotsFull')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Costo de inscripción */}
          {league.inscription_cost > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                {t('inscriptionCost')}
              </p>
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                ${league.inscription_cost}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 