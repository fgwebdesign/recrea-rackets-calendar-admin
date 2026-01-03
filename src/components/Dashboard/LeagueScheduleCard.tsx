import { CalendarDays, Clock, ListFilter, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { EmptySchedule } from "./EmptySchedule";
import { useCategories } from "@/hooks/useCategories";
import { useTranslations } from '@/contexts/TranslationContext';
import { CategoryFilterTabs } from './CategoryFilterTabs';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const [api, setApi] = useState<CarouselApi>();
  const [visibleCount, setVisibleCount] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
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
  }, [selectedCategory, matches]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateCarousel = () => {
      // Actualizar el slide actual
      setCurrentSlide(api.selectedScrollSnap());
      
      // Calcular cuántas cards son visibles según el tamaño de pantalla
      const container = api.containerNode();
      if (container) {
        const containerWidth = container.offsetWidth;
        // Determinar cuántas cards por vista según breakpoints
        // mobile: 1, tablet (sm): 2, desktop (lg): 4
        let cardsPerView = 1;
        if (containerWidth >= 1024) cardsPerView = 4; // lg (desktop)
        else if (containerWidth >= 640) cardsPerView = 2; // sm (tablet)
        else cardsPerView = 1; // mobile
        
        setVisibleCount(cardsPerView);
      }
    };

    updateCarousel();
    api.on("select", updateCarousel);
    api.on("resize", updateCarousel);
    
    // Actualizar al cambiar el tamaño de la ventana
    window.addEventListener("resize", updateCarousel);
    
    return () => {
      window.removeEventListener("resize", updateCarousel);
    };
  }, [api, filteredMatches.length]);

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
        <CategoryFilterTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          className="px-0"
        />

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
          <CategoryFilterTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            className="px-0 -mx-4 sm:mx-0"
          />
          {filteredMatches.length > 0 && (
            <div className="flex items-center gap-2">
              {filteredMatches.length > 4 && (
                <>
                  <button
                    onClick={() => {
                      if (!api) return;
                      const currentIndex = api.selectedScrollSnap();
                      const slidesToMove = visibleCount;
                      const newIndex = Math.max(0, currentIndex - slidesToMove);
                      api.scrollTo(newIndex, true);
                    }}
                    disabled={!api || (api.selectedScrollSnap() === 0)}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                             shadow-sm hover:shadow-md"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (!api) return;
                      const currentIndex = api.selectedScrollSnap();
                      const slidesToMove = visibleCount;
                      const maxIndex = api.scrollSnapList().length - 1;
                      const newIndex = Math.min(maxIndex, currentIndex + slidesToMove);
                      api.scrollTo(newIndex, true);
                    }}
                    disabled={!api || (api.selectedScrollSnap() >= api.scrollSnapList().length - 1)}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                             shadow-sm hover:shadow-md"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
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
            </div>
          )}
        </div>
      </div>
      
      <div className="relative w-full pb-4 px-2 sm:px-4 lg:px-6">
        {filteredMatches.length > 4 ? (
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: 1,
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {filteredMatches.map((match) => (
                <CarouselItem key={match.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                  <MatchCard match={match} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden lg:flex h-8 w-8 -left-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg" />
            <CarouselNext className="hidden lg:flex h-8 w-8 -right-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg" />
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Pagination Text */}
        {filteredMatches.length > 4 && (
          <div className="flex justify-center py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {(() => {
                // currentSlide es el índice del slide (0-based), donde cada slide es una card
                // Para calcular el rango correcto: start = índice + 1, end = índice + cantidad visible
                const start = currentSlide + 1;
                const end = Math.min(currentSlide + visibleCount, filteredMatches.length);
                return `Mostrando ${start}-${end} de ${filteredMatches.length} partidos`;
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const t = useTranslations('dashboard');

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

  return (
    <div className="group relative bg-white dark:bg-gray-800/90 
                 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 
                 border border-gray-200 dark:border-gray-700/50
                 shadow-sm hover:shadow-lg dark:shadow-gray-900/20
                 transition-all duration-300 ease-out
                 hover:border-purple-300 dark:hover:border-purple-600/50
                 overflow-hidden">
      
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-emerald-50/30 
                   dark:from-purple-900/10 dark:via-transparent dark:to-emerald-900/10
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Top Section with Badges */}
      <div className="relative flex items-start justify-between mb-4 sm:mb-5 lg:mb-6">
        {/* Categoría Badge */}
        <span className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold
                     bg-gradient-to-r from-purple-500 to-purple-600 
                     text-white shadow-sm
                     dark:from-purple-600 dark:to-purple-700">
          {match.category_name}
        </span>

        {/* Court Badge */}
        <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium
                     bg-gray-100 dark:bg-gray-700/80
                     text-gray-700 dark:text-gray-300
                     border border-gray-200 dark:border-gray-600/50">
          {match.court_name || t('notAssigned')}
        </span>
      </div>

      {/* Teams Section */}
      <div className="relative space-y-3 sm:space-y-4 mb-4 sm:mb-5 lg:mb-6">
        {/* Team 1 */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 lg:p-3.5 border border-gray-100 dark:border-gray-700/50">
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 
                    break-words leading-snug text-center" title={match.team1}>
            {match.team1}
          </p>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center my-1 sm:my-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-purple-200 dark:border-purple-700/50"></div>
            </div>
            <div className="relative">
              <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full 
                           bg-gradient-to-br from-emerald-500 to-emerald-600 
                           text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/30
                           dark:from-emerald-600 dark:to-emerald-700
                           dark:shadow-emerald-900/50">
                {t('vs')}
              </span>
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 lg:p-3.5 border border-gray-100 dark:border-gray-700/50">
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 
                    break-words leading-snug text-center" title={match.team2}>
            {match.team2}
          </p>
        </div>
      </div>

      {/* Date and Time Footer */}
      <div className="relative pt-4 sm:pt-5 lg:pt-6 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          {/* Time */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Clock className="w-4 h-4 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Hora
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatDateTime(match.match_date).time}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CalendarDays className="w-4 h-4 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Fecha
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatDateTime(match.match_date).date}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 