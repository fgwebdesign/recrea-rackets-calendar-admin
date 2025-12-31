import { CalendarDays, Clock, ChevronLeft, ChevronRight, ListFilter, MapPin, Building } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { EmptySchedule } from "./EmptySchedule";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { useTournaments } from "@/hooks/useTournaments";
import { matchService, tournamentService } from '@/services/tournamentService';
import { useTranslations } from '@/contexts/TranslationContext';

interface TournamentMatch {
  id: string;
  tournament_id: string;
  tournament_name?: string;
  team1_name?: string;
  team2_name?: string;
  team1?: any;
  team2?: any;
  home_team_id?: string;
  away_team_id?: string;
  home_team_data?: any;
  away_team_data?: any;
  match_day?: string; // Para fase eliminatoria
  tournament_day?: number; // Para fase de grupos (día del torneo: 1, 2, 3, etc.)
  start_time?: string;
  match_date?: string;
  court_name?: string;
  court_id?: string;
  venue_name?: string; // Nombre de la sede
  status: "pending" | "scheduled" | "completed" | "in_progress";
  group_name?: string;
  group_number?: number;
  category_name?: string;
  category_id?: string;
  round?: string;
}

interface TournamentScheduleCardProps {
  tournamentId?: string;
  onMatchesLoaded?: (hasMatches: boolean) => void;
}

export function TournamentScheduleCard({ tournamentId, onMatchesLoaded }: TournamentScheduleCardProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<TournamentMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories: allCategories, isLoading: isLoadingCategories } = useCategories();
  
  // Solo mostrar categorías que tienen partidos programados
  const availableCategories = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    const categoriesWithMatches = [...new Set(matches.map(match => match.category_name).filter(Boolean))];
    return categoriesWithMatches.map(categoryName => ({
      id: categoryName,
      name: categoryName
    }));
  }, [matches]);
  
  const categories = availableCategories;
  const { tournaments } = useTournaments();
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Crear mapa de torneos por ID para acceso rápido a start_date
  const tournamentsMap = useMemo(() => {
    const map = new Map();
    if (tournaments && Array.isArray(tournaments)) {
      tournaments.forEach(tournament => {
        map.set(tournament.id, tournament);
      });
    }
    return map;
  }, [tournaments]);

  useEffect(() => {
    const fetchTournamentMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener todos los torneos activos para mostrar sus partidos
        if (!tournaments || tournaments.length === 0) {
          setMatches([]);
          if (onMatchesLoaded) {
            onMatchesLoaded(false);
          }
          setIsLoading(false);
          return;
        }

        // Obtener partidos de todos los torneos activos usando el servicio existente
        const allMatches: TournamentMatch[] = [];
        
        for (const tournament of tournaments) {
          try {
            // Usar el servicio existente que ya funciona
            const matchesData = await matchService.getTournamentMatches(tournament.id);
            const tournamentMatches = Array.isArray(matchesData) ? matchesData : (matchesData as any)?.matches || [];
            
            // Obtener información de equipos para este torneo
            const teamsData = await tournamentService.getTournamentTeams(tournament.id);
            const tournamentTeams = Array.isArray(teamsData) ? teamsData : (teamsData as any)?.teams || [];
            
            // Crear un mapa de equipos para acceso rápido
            const teamsMap = new Map();
            tournamentTeams.forEach((team: any) => {
              if (team.teams) {
                teamsMap.set(team.teams.id, team.teams);
              }
            });
            
            // Agregar información del torneo y equipos a cada partido
            const matchesWithTournamentInfo = tournamentMatches.map((match: any) => {
              const homeTeam = teamsMap.get(match.home_team_id);
              const awayTeam = teamsMap.get(match.away_team_id);
              
              return {
                ...match,
                tournament_name: tournament.name,
                tournament_id: tournament.id,
                category_name: tournament.category?.name || (tournament as any).categories?.name || 'Sin categoría',
                home_team_data: homeTeam,
                away_team_data: awayTeam
              };
            });
            
            allMatches.push(...matchesWithTournamentInfo);
          } catch (error) {
            console.warn(`Error fetching matches for tournament ${tournament.id}:`, error);
            // Continuar con otros torneos si uno falla
          }
        }
        
        // Filtrar partidos programados y próximos
        const now = new Date();
        const scheduledMatches = allMatches
          .filter((match: TournamentMatch) => {
            // Excluir partidos completados
            if (match.status === 'completed') return false;
            
            // Si tiene hora programada, incluirlo (tanto fase eliminatoria como grupos)
            if (match.start_time) {
              // Para fase eliminatoria: verificar fecha específica
              if (match.match_day) {
                const matchDate = new Date(`${match.match_day} ${match.start_time}`);
                return matchDate >= now;
              }
              
              // Para fase de grupos: incluir si está programado (tiene tournament_day)
              if (match.tournament_day) {
                return true;
              }
            }
            
            // Si no tiene hora pero está programado, incluirlo
            if (match.status === 'scheduled' || match.status === 'pending') {
              return true;
            }
            
            return false;
          })
          .sort((a: TournamentMatch, b: TournamentMatch) => {
            // Función helper para obtener timestamp de fecha
            const getMatchTimestamp = (match: TournamentMatch): number => {
              if (match.match_day && match.start_time) {
                // Fase eliminatoria: fecha específica
                return new Date(`${match.match_day} ${match.start_time}`).getTime();
              } else if (match.tournament_day && match.start_time) {
                // Fase de grupos: calcular fecha basada en tournament_day
                const today = new Date();
                const tournamentStartDate = new Date(today);
                tournamentStartDate.setDate(today.getDate() + 1); // Asumir que empieza mañana
                tournamentStartDate.setDate(tournamentStartDate.getDate() + (match.tournament_day - 1));
                return new Date(`${tournamentStartDate.toISOString().split('T')[0]} ${match.start_time}`).getTime();
              }
              return Infinity;
            };
            
            const dateA = getMatchTimestamp(a);
            const dateB = getMatchTimestamp(b);
            
            // Si ambos tienen fecha, ordenar por fecha
            if (dateA !== Infinity && dateB !== Infinity) {
              return dateA - dateB;
            }
            
            // Si uno tiene fecha y otro no, el que tiene fecha va primero
            if (dateA !== Infinity && dateB === Infinity) return -1;
            if (dateA === Infinity && dateB !== Infinity) return 1;
            
            // Si ninguno tiene fecha, ordenar por hora (start_time)
            if (a.start_time && b.start_time) {
              return a.start_time.localeCompare(b.start_time);
            }
            
            // Fallback: ordenar por ID
            return a.id.localeCompare(b.id);
          })
          .slice(0, 20); // Limitar a los 20 partidos más cercanos
        
        setMatches(scheduledMatches);
        
        // Notificar al componente padre si hay partidos
        if (onMatchesLoaded) {
          onMatchesLoaded(scheduledMatches.length > 0);
        }
      } catch (err) {
        console.error('Error fetching tournament matches:', err);
        setError(err instanceof Error ? err.message : t('unknownError'));
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournamentMatches();
  }, [tournaments, onMatchesLoaded]);

  // Efecto para filtrar los partidos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategory === 'all') {
      // Mostrar todos los partidos ordenados por fecha
      const sortedMatches = [...matches].sort((a, b) => {
        const dateA = new Date(`${a.match_day} ${a.start_time}`).getTime();
        const dateB = new Date(`${b.match_day} ${b.start_time}`).getTime();
        return dateA - dateB;
      });
      setFilteredMatches(sortedMatches);
    } else {
      // Filtrar por categoría y ordenar por fecha
      const filtered = matches
        .filter(match => match.category_name === selectedCategory)
        .sort((a, b) => {
          const dateA = new Date(`${a.match_day} ${a.start_time}`).getTime();
          const dateB = new Date(`${b.match_day} ${b.start_time}`).getTime();
          return dateA - dateB;
        });
      setFilteredMatches(filtered);
    }
    setCurrentPage(0); // Reset page when changing category
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, matches]);

  const getTeamName = (team: any, teamId?: string): string => {
    // Si es un string directo, usarlo
    if (typeof team === 'string') return team;
    
    // Si es un objeto con nombre
    if (team?.name) return team.name;
    if (team?.team_name) return team.team_name;
    
    // Si tiene jugadores con estructura completa (de tournament_teams)
    if (team?.player1 && team?.player2) {
      const player1Name = typeof team.player1 === 'string' ? 
        team.player1 : 
        `${team.player1.first_name} ${team.player1.last_name}`;
      const player2Name = typeof team.player2 === 'string' ? 
        team.player2 : 
        `${team.player2.first_name} ${team.player2.last_name}`;
      return `${player1Name} / ${player2Name}`;
    }
    
    // Si solo tiene un player
    if (team?.player1) {
      const player1Name = typeof team.player1 === 'string' ? 
        team.player1 : 
        `${team.player1.first_name} ${team.player1.last_name}`;
      return player1Name;
    }
    
    // Fallback con team_id si está disponible
    if (teamId) {
      return `Equipo ${teamId.slice(0, 8)}...`;
    }
    
    return 'Equipo desconocido';
  };

  // Función para obtener la fecha del calendario según el día del torneo
  const getCalendarDateForTournamentDay = (tournamentDay: number | null | undefined, tournamentId?: string): string | null => {
    if (!tournamentDay || !tournamentId) return null;
    
    const tournament = tournamentsMap.get(tournamentId);
    if (!tournament?.start_date) return null;
    
    try {
      // Parsear la fecha sin problemas de zona horaria
      const dateParts = tournament.start_date.split('T')[0].split('-');
      if (dateParts.length !== 3) return null;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JS son 0-indexed
      const day = parseInt(dateParts[2], 10);
      
      // Crear fecha en zona horaria local
      const startDate = new Date(year, month, day);
      
      // Día 1 = start_date, Día 2 = start_date + 1 día, Día 3 = start_date + 2 días
      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + (tournamentDay - 1));
      
      // Formatear como "6 feb" (día y mes abreviado)
      return matchDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch (error) {
      console.error('Error calculando fecha:', error);
      return null;
    }
  };

  const formatDateTime = (match: TournamentMatch) => {
    // Si no tiene hora, mostrar estado sin programar
    if (!match.start_time) {
      return {
        time: 'Sin hora',
        date: 'Sin fecha',
        tournamentDayLabel: null,
        relativeDate: 'Sin programar'
      };
    }
    
    // Para partidos de fase eliminatoria: usar match_day
    // Para partidos de fase de grupos: usar tournament_day
    let matchDate: Date;
    let tournamentDayLabel: string | null = null;
    
    if (match.match_day) {
      // Fase eliminatoria: tiene fecha específica
      matchDate = new Date(`${match.match_day} ${match.start_time}`);
    } else if (match.tournament_day && match.tournament_id) {
      // Fase de grupos: usar tournament_day y calcular fecha basada en el torneo
      const tournament = tournamentsMap.get(match.tournament_id);
      if (!tournament?.start_date) {
        return {
          time: match.start_time.substring(0, 5),
          date: 'Sin fecha',
          tournamentDayLabel: `Día ${match.tournament_day}`,
          relativeDate: 'Sin programar'
        };
      }
      
      // Parsear fecha sin problemas de zona horaria
      const dateParts = tournament.start_date.split('T')[0].split('-');
      if (dateParts.length !== 3) {
        return {
          time: match.start_time.substring(0, 5),
          date: 'Sin fecha',
          tournamentDayLabel: `Día ${match.tournament_day}`,
          relativeDate: 'Sin programar'
        };
      }
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      
      const startDate = new Date(year, month, day);
      const matchDateCalc = new Date(startDate);
      matchDateCalc.setDate(startDate.getDate() + (match.tournament_day - 1));
      
      matchDate = new Date(`${matchDateCalc.toISOString().split('T')[0]} ${match.start_time}`);
      
      // Crear label con día y fecha
      const calendarDate = getCalendarDateForTournamentDay(match.tournament_day, match.tournament_id);
      tournamentDayLabel = calendarDate ? `Día ${match.tournament_day} (${calendarDate})` : `Día ${match.tournament_day}`;
    } else {
      // Sin información de fecha
      return {
        time: match.start_time.substring(0, 5),
        date: 'Sin fecha',
        tournamentDayLabel: null,
        relativeDate: 'Sin programar'
      };
    }

    return {
      time: new Intl.DateTimeFormat('es', {  
        hour: '2-digit',
        minute: '2-digit'
      }).format(matchDate),
      date: new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }).format(matchDate),
      tournamentDayLabel: tournamentDayLabel,
      relativeDate: '' // Ya no usamos fecha relativa
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
      <div className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-gray-700/50 min-h-[200px] flex items-center justify-center">
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
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarDays className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('noMatchesScheduled')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            {t('noMatchesScheduledDescription')}
          </p>
        </div>
      </div>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        {/* Category Tabs */}
        <div className="px-6 pt-4">
          <div className="flex justify-between items-center mb-4">
            <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all" className="text-sm">
                  Todos los torneos
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.name || ''}
                    className="text-sm"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarDays className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¡No hay partidos programados aún!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            {selectedCategory === 'all' 
              ? 'Los partidos de torneos aparecerán aquí cuando estén programados. ¡Mantente atento a las próximas competencias!'
              : `No hay partidos programados para la categoría "${selectedCategory}". Los partidos aparecerán aquí cuando estén programados.`}
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
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              <TabsTrigger value="all" className="text-sm">
                Todas las categorías
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.name || ''}
                  className="text-sm"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {filteredMatches.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''} próximos
              </span>
              <button
                onClick={() => router.push('/tournaments')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                         bg-gradient-to-r from-purple-500 to-purple-600 
                         hover:from-purple-600 hover:to-purple-700
                         rounded-lg transition-all duration-200
                         shadow-lg shadow-purple-500/20 dark:shadow-purple-900/30"
              >
                <ListFilter className="w-4 h-4" />
                Ver todos los torneos
              </button>
            </div>
          )}
        </div>
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
                  onClick={() => router.push(`/tournaments/${match.tournament_id}/matches`)}
                  className="relative bg-white dark:bg-[#1D283A] 
                           rounded-xl p-6 hover:shadow-2xl transition-all duration-300
                           border border-gray-200 dark:border-gray-700
                           cursor-pointer hover:scale-[1.01] hover:border-blue-400 dark:hover:border-blue-600
                           group shadow-sm"
                >
                  {/* Torneo Badge */}
                  {match.tournament_name && (
                    <div className="absolute -top-3 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium
                                   bg-gradient-to-r from-blue-500 to-blue-600 
                                   text-white shadow-lg shadow-blue-500/30
                                   dark:from-blue-600 dark:to-blue-700
                                   dark:shadow-blue-900/30">
                        {match.tournament_name}
                      </span>
                    </div>
                  )}

                  {/* Categoría Badge */}
                  {match.category_name && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium
                                   bg-gradient-to-r from-purple-500 to-purple-600 
                                   text-white shadow-lg shadow-purple-500/30
                                   dark:from-purple-600 dark:to-purple-700
                                   dark:shadow-purple-900/30">
                        {match.category_name}
                      </span>
                    </div>
                  )}

                  {/* Grupo Badge */}
                  {(match.group_name || match.group_number) && (
                    <div className="absolute top-3 right-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold
                                   bg-gray-100 dark:bg-gray-800 
                                   text-gray-700 dark:text-gray-300
                                   border border-gray-200 dark:border-gray-700">
                        {match.group_name || `Grupo ${match.group_number}`}
                      </span>
                    </div>
                  )}

                  {/* Click Indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-2 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20">
                      <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  {/* Match Content */}
                  <div className="mt-8 space-y-5">
                    {/* Información de fecha y hora - Primero para mejor jerarquía */}
                    {(() => {
                      const dateTimeInfo = formatDateTime(match);
                      return (
                        <div className="space-y-2.5">
                          {/* Día del torneo (si es fase de grupos) */}
                          {dateTimeInfo.tournamentDayLabel && (
                            <div className="flex items-center justify-center mb-1">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg px-3 py-2 border border-blue-200/50 dark:border-blue-700/50">
                                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                  {dateTimeInfo.tournamentDayLabel}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Hora y fecha */}
                          <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {dateTimeInfo.time}
                              </span>
                            </div>
                            {!dateTimeInfo.tournamentDayLabel && dateTimeInfo.date && (
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {dateTimeInfo.date}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Court Information */}
                    {match.court_name && (
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-200/50 dark:border-gray-700/30">
                          <Building className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {match.court_name}
                          </span>
                          {match.venue_name && (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {match.venue_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700/30"></div>

                    {/* Teams - Más destacados */}
                    <div className="space-y-3.5">
                      {/* Team 1 */}
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate leading-tight" 
                             title={getTeamName(match.home_team_data || match.team1 || match.team1_name, match.home_team_id)}>
                            {getTeamName(match.home_team_data || match.team1 || match.team1_name, match.home_team_id)}
                          </p>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="flex items-center justify-center py-1">
                        <div className="relative w-full">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-gray-300 dark:border-gray-600"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-4 py-1.5 text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-600 
                                         text-white rounded-full shadow-md shadow-emerald-500/30
                                         dark:shadow-emerald-900/40 uppercase tracking-wider">
                              VS
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate leading-tight" 
                             title={getTeamName(match.away_team_data || match.team2 || match.team2_name, match.away_team_id)}>
                            {getTeamName(match.away_team_data || match.team2 || match.team2_name, match.away_team_id)}
                          </p>
                        </div>
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
