import { CalendarDays, Clock, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { EmptySchedule } from "./EmptySchedule";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { useTranslations } from '@/contexts/TranslationContext';

interface Match {
  id: string;
  league_id: string;
  category_id: string;
  category_name: string;
  team1: string;
  team2: string;
  match_date: string;
  court_name: string;
  status: "SCHEDULED" | "COMPLETED" | "WALKOVER";
  team1_sets1_won: number;
  team1_sets2_won: number;
  team2_sets1_won: number;
  team2_sets2_won: number;
}

interface LeagueScheduleCardProps {
  leagueId?: string;
  onMatchesLoaded?: (hasMatches: boolean) => void;
}

export function LeagueScheduleCard({ leagueId, onMatchesLoaded }: LeagueScheduleCardProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const url = `${baseUrl}/leagues/matches/league/${leagueId || 'all'}`;

        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || 
            t('errorLoadingMatches').replace('{status}', response.status.toString()).replace('{statusText}', response.statusText || '')
          );
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error(t('noDataReceived'));
        }

        // El backend devuelve { completed: [], pending: [] }
        const allMatches = [...(data.pending || []), ...(data.completed || [])];
        
        const scheduledMatches = allMatches
          .filter((match: Match) => match.status === "SCHEDULED")
          .sort((a: Match, b: Match) => 
            new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
          );
        
        setMatches(scheduledMatches);
        
        // Notificar al componente padre si hay partidos
        if (onMatchesLoaded) {
          onMatchesLoaded(allMatches.length > 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('unknownError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, onMatchesLoaded]);

  // Efecto para filtrar los partidos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(match => match.category_id === selectedCategory);
      setFilteredMatches(filtered);
    }
    setCurrentPage(0); // Reset page when changing category
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, matches]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: new Intl.DateTimeFormat('es', {  
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      }).format(date),
      date: new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(date)
    };
  };

  const totalPages = Math.ceil(filteredMatches.length / 4);

  const handlePrevious = () => {
    if (sliderRef.current && currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      sliderRef.current.scrollTo({
        left: newPage * sliderRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleNext = () => {
    if (sliderRef.current && currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      sliderRef.current.scrollTo({
        left: newPage * sliderRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (sliderRef.current) {
      const newPage = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
      setCurrentPage(newPage);
    }
  };

  if (isLoading || isLoadingCategories) {
    return (
      <div className="bg-white dark:bg-slate-800/50  border-gray-200 dark:border-gray-700/50 min-h-[200px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 p-4">
        <p className="text-red-500 dark:text-red-400 text-center">
          {error}
        </p>
      </div>
    );
  }

  if (!matches.length) {
    return <EmptySchedule />;
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        {/* Category Tabs */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
              <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-max min-w-full sm:w-auto sm:min-w-0">
                  <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">
                    {t('allCategories')}
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="text-xs sm:text-sm whitespace-nowrap"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarDays className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('noMatches')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            {selectedCategory === 'all' 
              ? t('noMatchesForLeague')
              : t('noMatchesForCategory').replace('{category}', categories.find(cat => cat.id === selectedCategory)?.name || '')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Category Tabs */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
            <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-max min-w-full sm:w-auto sm:min-w-0">
                <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">
                  {t('allCategories')}
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {filteredMatches.length > 0 && (
            <button
              onClick={() => router.push(`/leagues/${matches[0]?.league_id}/matches`)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white
                       bg-gradient-to-r from-purple-500 to-purple-600 
                       hover:from-purple-600 hover:to-purple-700
                       rounded-lg transition-all duration-200
                       shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30
                       whitespace-nowrap flex-shrink-0"
            >
              <ListFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{t('viewAllMatches')}</span>
              <span className="xs:hidden">{t('viewAll')}</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        {/* Navigation Buttons */}
        {currentPage > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full
                     bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm
                     border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200
                     hover:bg-white dark:hover:bg-slate-700
                     transition-all duration-200
                     shadow-lg"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        
        {currentPage < totalPages - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full
                     bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm
                     border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200
                     hover:bg-white dark:hover:bg-slate-700
                     transition-all duration-200
                     shadow-lg"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Cards Container */}
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div 
              key={pageIndex}
              className="flex-none w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 snap-start"
            >
              {filteredMatches.slice(pageIndex * 4, (pageIndex + 1) * 4).map((match) => (
                <div 
                  key={match.id}
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1D283A]/80 dark:to-[#1D283A] 
                           rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 hover:shadow-xl transition-all duration-300
                           border border-gray-200/50 dark:border-gray-700/30
                           backdrop-blur-sm"
                >
                  {/* Categoría Badge */}
                  <div className="absolute -top-2 sm:-top-3 left-2 sm:left-4">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium
                                 bg-gradient-to-r from-purple-500 to-purple-600 
                                 text-white shadow-lg shadow-purple-500/30
                                 dark:from-purple-600 dark:to-purple-700
                                 dark:shadow-purple-900/30">
                      {match.category_name}
                    </span>
                  </div>

                  {/* Court Badge */}
                  <div className="absolute -top-2 sm:-top-3 right-2 sm:right-4">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium
                                 bg-gray-900/5 dark:bg-white/5 
                                 text-gray-700 dark:text-gray-300
                                 border border-gray-200/50 dark:border-gray-700/30">
                      {match.court_name || t('notAssigned')}
                    </span>
                  </div>

                  {/* Match Content */}
                  <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
                    {/* Teams */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={match.team1}>
                            {match.team1}
                          </p>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-full">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700/30"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-2 sm:px-3 text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 
                                         text-white rounded-full py-0.5 sm:py-1 shadow-lg shadow-emerald-500/20
                                         dark:shadow-emerald-900/30">
                              {t('vs')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={match.team2}>
                            {match.team2}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-gray-700/30 gap-2">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatDateTime(match.match_date).time}h
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatDateTime(match.match_date).date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 sm:gap-2 py-3 sm:py-4">
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-200 ${
                  currentPage === index
                    ? 'bg-purple-600 dark:bg-purple-500 w-3 sm:w-4'
                    : 'bg-gray-300 dark:bg-gray-600 w-1.5 sm:w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 