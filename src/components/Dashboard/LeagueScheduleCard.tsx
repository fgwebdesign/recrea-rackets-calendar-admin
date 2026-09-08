import { CalendarDays, Clock, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { EmptySchedule } from "./EmptySchedule";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { TeamLabel } from "@/utils/teamLabel";

interface Match {
  id: string;
  league_id: string;
  category_id: string;
  category_name: string;
  group_name: string | null;
  team1: string;
  team2: string;
  match_date: string;
  match_number: number;
  time_slot?: string;
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'A' | 'B'>('all');
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const sliderRef = useRef<HTMLDivElement>(null);

  // Memoizar la detección de grupos para evitar recalcular en cada render
  const selectedCategoryHasGroups = useMemo(() => {
    return selectedCategory !== 'all' && 
      matches.some(match => 
        match.category_id === selectedCategory && 
        match.group_name !== null && 
        match.group_name !== undefined
      );
  }, [selectedCategory, matches]);

  // Memoizar la función de notificación
  const notifyMatchesLoaded = useCallback((hasMatches: boolean) => {
    if (onMatchesLoaded) {
      onMatchesLoaded(hasMatches);
    }
  }, [onMatchesLoaded]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        // Aumentar el límite a 40 para tener suficientes partidos de todas las categorías y grupos
        // Esto asegura que haya partidos disponibles para filtrar por cada categoría/grupo
        const url = `${baseUrl}/leagues/matches/league/${leagueId || 'all'}?upcoming_only=true&limit=40`;

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
            `Error al cargar los partidos: ${response.status} ${response.statusText}`
          );
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error('No se recibieron datos del servidor');
        }

        const allMatches = [...(data.pending || []), ...(data.completed || [])];
        
        const scheduledMatches = allMatches
          .filter((match: Match) => match.status === "SCHEDULED")
          .sort((a: Match, b: Match) => 
            new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
          );
        
        setMatches(scheduledMatches);
        
        // Notificar al componente padre si hay partidos
        notifyMatchesLoaded(allMatches.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [leagueId, notifyMatchesLoaded]);

  // Efecto para filtrar los partidos cuando cambia la categoría o grupo seleccionado
  useEffect(() => {
    let filtered = matches;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name;
      
      filtered = filtered.filter(match => {
        const matchesById = match.category_id === selectedCategory;
        const matchesByName = selectedCategoryName && 
          match.category_name?.toLowerCase() === selectedCategoryName.toLowerCase();
        
        return matchesById || matchesByName;
      });
    }

    // Filtrar por grupo si la categoría tiene grupos
    if (selectedCategoryHasGroups && selectedGroup !== 'all') {
      filtered = filtered.filter(match => match.group_name === selectedGroup);
    }

    // Limitar a los primeros 8 partidos para mantener rendimiento (2 páginas de 4)
    const limitedFiltered = filtered.slice(0, 8);
    
    setFilteredMatches(limitedFiltered);
    setCurrentPage(0);
    
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, selectedGroup, matches, selectedCategoryHasGroups, categories]);

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
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-12 h-12 text-red-500 dark:text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No se pudieron cargar los partidos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-4">
            Ocurrió un problema al intentar cargar la información de los próximos partidos.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white
                     bg-gradient-to-r from-purple-500 to-purple-600 
                     hover:from-purple-600 hover:to-purple-700
                     rounded-lg transition-all duration-200
                     shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!matches.length) {
    return <EmptySchedule />;
  }

  if (filteredMatches.length === 0) {
    const categoryName = categories.find(cat => cat.id === selectedCategory)?.name || '';
    let emptyMessage = 'No hay partidos programados en ninguna categoría.';
    
    if (selectedCategory !== 'all') {
      if (selectedCategoryHasGroups && selectedGroup !== 'all') {
        emptyMessage = `No hay partidos programados para ${categoryName} - Grupo ${selectedGroup}.`;
      } else if (selectedCategoryHasGroups) {
        emptyMessage = `No hay partidos programados para ${categoryName} (todos los grupos).`;
      } else {
        emptyMessage = `No hay partidos programados para la categoría ${categoryName}.`;
      }
    }

    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        {/* Category Tabs */}
        <div className="px-6 pt-4">
          <div className="flex justify-between items-center mb-4">
            <Tabs defaultValue="all" value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setSelectedGroup('all');
            }}>
              <TabsList>
                <TabsTrigger value="all" className="text-sm">
                  Todas las categorías
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-sm"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Group Tabs */}
          {selectedCategoryHasGroups && (
            <div className="mb-4">
              <Tabs value={selectedGroup} onValueChange={(value) => setSelectedGroup(value as 'all' | 'A' | 'B')}>
                <TabsList>
                  <TabsTrigger value="all" className="text-sm">
                    Todos los grupos
                  </TabsTrigger>
                  <TabsTrigger value="A" className="text-sm">
                    Grupo A
                  </TabsTrigger>
                  <TabsTrigger value="B" className="text-sm">
                    Grupo B
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarDays className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay partidos programados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Category Tabs */}
      <div className="px-6 pt-4">
        <div className="flex justify-between items-center mb-4">
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value);
            setSelectedGroup('all'); // Reset group when changing category
          }}>
            <TabsList>
              <TabsTrigger value="all" className="text-sm">
                Todas las categorías
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-sm"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {filteredMatches.length > 0 && (
            <button
              onClick={() => router.push(`/leagues/${matches[0]?.league_id}/matches`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                       bg-gradient-to-r from-purple-500 to-purple-600 
                       hover:from-purple-600 hover:to-purple-700
                       rounded-lg transition-all duration-200
                       shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30"
            >
              <ListFilter className="w-4 h-4" />
              Ver todos los partidos
            </button>
          )}
        </div>

        {/* Group Tabs - Solo mostrar si la categoría seleccionada tiene grupos */}
        {selectedCategoryHasGroups && (
          <div className="mb-4">
            <Tabs value={selectedGroup} onValueChange={(value) => setSelectedGroup(value as 'all' | 'A' | 'B')}>
              <TabsList>
                <TabsTrigger value="all" className="text-sm">
                  Todos los grupos
                </TabsTrigger>
                <TabsTrigger value="A" className="text-sm">
                  Grupo A
                </TabsTrigger>
                <TabsTrigger value="B" className="text-sm">
                  Grupo B
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>
      
      <div className="relative">
        {/* Navigation Buttons */}
        {currentPage > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full
                     bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                     border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200
                     hover:bg-white dark:hover:bg-slate-700
                     transition-all duration-200
                     shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {currentPage < totalPages - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full
                     bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                     border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-200
                     hover:bg-white dark:hover:bg-slate-700
                     transition-all duration-200
                     shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
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
              className="flex-none w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-6 p-6 snap-start"
            >
              {filteredMatches.slice(pageIndex * 4, (pageIndex + 1) * 4).map((match) => (
                <div 
                  key={match.id}
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1D283A]/80 dark:to-[#1D283A] 
                           rounded-2xl p-5 hover:shadow-xl transition-all duration-300
                           border border-gray-200/50 dark:border-gray-700/30
                           backdrop-blur-sm"
                >
                  {/* Categoría Badge */}
                  <div className="absolute -top-3 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium
                                 bg-gradient-to-r from-purple-500 to-purple-600 
                                 text-white shadow-lg shadow-purple-500/30
                                 dark:from-purple-600 dark:to-purple-700
                                 dark:shadow-purple-900/30">
                      {match.category_name}
                    </span>
                    {match.group_name && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg
                                     ${match.group_name === 'A' 
                                       ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30 dark:from-blue-600 dark:to-blue-700 dark:shadow-blue-900/30' 
                                       : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30 dark:from-purple-600 dark:to-purple-700 dark:shadow-purple-900/30'}`}>
                        Grupo {match.group_name}
                      </span>
                    )}
                  </div>

                  {/* Court Badge */}
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium
                                 bg-gray-900/5 dark:bg-white/5 
                                 text-gray-700 dark:text-gray-300
                                 border border-gray-200/50 dark:border-gray-700/30">
                      {match.court_name || 'Sin asignar'}
                    </span>
                  </div>

                  {/* Match Content */}
                  <div className="mt-4 space-y-6">
                    {/* Teams */}
                    <div className="space-y-4">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1 min-w-0">
                          <TeamLabel label={match.team1} />
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-full">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700/30"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-3 text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600
                                         text-white rounded-full py-1 shadow-lg shadow-emerald-500/20
                                         dark:shadow-emerald-900/30">
                              VS
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1 min-w-0">
                          <TeamLabel label={match.team2} />
                        </div>
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {match.time_slot || formatDateTime(match.match_date).time}h
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
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
          <div className="flex justify-center gap-2 py-4">
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentPage === index
                    ? 'bg-purple-600 dark:bg-purple-500 w-4'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 