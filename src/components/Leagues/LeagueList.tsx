import { useState } from 'react';
import { LeagueCard } from './LeagueCard';
import { League } from '@/types/league';
import { Category } from '@/hooks/useCategories';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslations } from '@/contexts/TranslationContext';

interface LeagueListProps {
  leagues: League[];
  categories: Category[];
}

const LEAGUES_PER_PAGE = 6; // Mostrar 6 ligas por página (2 filas de 3 en desktop)

export function LeagueList({ leagues, categories }: LeagueListProps) {
  const t = useTranslations('leagues');
  const tCommon = useTranslations('common');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(leagues.length / LEAGUES_PER_PAGE);

  const paginatedLeagues = leagues.slice(
    (currentPage - 1) * LEAGUES_PER_PAGE,
    currentPage * LEAGUES_PER_PAGE
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)]">
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedLeagues.map((league) => (
            <LeagueCard key={league.id} league={league} categories={categories} />
          ))}
        </div>
      </div>

      {/* Paginación */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:px-6">
          <div className="flex justify-between w-full">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('showing')} <span className="font-medium">{((currentPage - 1) * LEAGUES_PER_PAGE) + 1}</span> {t('to')}{' '}
              <span className="font-medium">
                {Math.min(currentPage * LEAGUES_PER_PAGE, leagues.length)}
              </span>{' '}
              {tCommon('of')} <span className="font-medium">{leagues.length}</span> {t('leagues')}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 