import { Progress } from '@/components/ui/progress';
import { Users2, Trophy, Calendar, Clock, ChevronLeft, ChevronRight, ArrowRight, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { CategoryFilterTabs } from './CategoryFilterTabs';
import { EmptyTournaments } from './EmptyTournaments';
import Image from 'next/image';
import { useTournaments } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { useTranslations } from '@/contexts/TranslationContext';

interface TournamentRegistrationProgressProps {
  tournaments?: any[];
  categories?: any[];
}

export function TournamentRegistrationProgress({ 
  tournaments: propTournaments, 
  categories: propCategories 
}: TournamentRegistrationProgressProps) {
  const t = useTranslations('dashboard');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const sliderRef = useRef<HTMLDivElement>(null);

  // Usar props si están disponibles, sino usar hooks
  const { tournaments: hookTournaments, loading: tournamentsLoading } = useTournaments();
  const { categories: hookCategories, isLoading: categoriesLoading } = useCategories();

  const tournaments = propTournaments || hookTournaments;
  const categories = propCategories || hookCategories;

  // Si no hay torneos, mostrar mensaje vacío
  if (!tournaments || tournaments.length === 0) {
    return <EmptyTournaments />;
  }

  // Filtrar torneos por categoría seleccionada
  const filteredTournaments = selectedCategory === 'all'
    ? tournaments
    : tournaments.filter(tournament => {
        // Verificar si el torneo tiene la categoría seleccionada
        const tournamentCategories = tournament.categories || tournament.category;
        if (Array.isArray(tournamentCategories)) {
          return tournamentCategories.some((cat: any) => 
            cat.id === selectedCategory || cat.name === selectedCategory
          );
        }
        return tournamentCategories?.id === selectedCategory || 
               tournamentCategories?.name === selectedCategory ||
               tournament.category_id === selectedCategory;
      });

  const CARDS_PER_PAGE = 3;
  const totalPages = Math.ceil(filteredTournaments.length / CARDS_PER_PAGE);
  const showSlider = filteredTournaments.length > CARDS_PER_PAGE;

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

  if (filteredTournaments.length === 0) {
    return (
      <div className="space-y-6">
        <CategoryFilterTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          className="px-0"
        />

        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('noTournamentsForCategory')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            {t('noTournamentsForCategoryDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryFilterTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        className="px-0"
      />

      <div className="relative">
        {/* Navigation Buttons */}
        {showSlider && currentPage > 0 && (
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
        
        {showSlider && currentPage < totalPages - 1 && (
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
          className={`${
            showSlider 
              ? 'flex overflow-x-auto snap-x snap-mandatory scrollbar-hide' 
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          }`}
          style={showSlider ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
        >
          {showSlider ? (
            // Slider view
            Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div 
                key={pageIndex}
                className="flex-none w-full grid grid-cols-1 md:grid-cols-3 gap-4 snap-start"
              >
                {filteredTournaments
                  .slice(pageIndex * CARDS_PER_PAGE, (pageIndex + 1) * CARDS_PER_PAGE)
                  .map((tournament) => (
                    <TournamentCard 
                      key={tournament.id} 
                      tournament={tournament} 
                      categories={categories}
                    />
                  ))}
              </div>
            ))
          ) : (
            // Grid view
            filteredTournaments.map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                categories={categories}
              />
            ))
          )}
        </div>

        {/* Pagination Dots */}
        {showSlider && totalPages > 1 && (
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

// Componente de tarjeta extraído para mejor organización
function TournamentCard({ tournament, categories }: { tournament: any; categories: any[] }) {
  // Obtener información del torneo
  const tournamentInfo = tournament.tournament_info || tournament;
  const registeredTeams = tournament.tournament_teams?.length || 0;
  const maxTeams = tournamentInfo.max_teams || 12; // Default a 12 equipos
  const availableSpots = maxTeams - registeredTeams;
  const registrationProgress = maxTeams > 0 ? (registeredTeams / maxTeams) * 100 : 0;

  // Obtener categoría del torneo
  const tournamentCategory = tournament.categories?.[0] || tournament.category;
  const categoryName = tournamentCategory?.name || 'Sin categoría';

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'inscripciones_abiertas':
      case 'upcoming':
        return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300';
      case 'en_curso':
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'finalizado':
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'inscripciones_abiertas':
      case 'upcoming':
        return t('registrationsOpen');
      case 'en_curso':
      case 'active':
        return t('inProgressStatus');
      case 'finalizado':
      case 'completed':
        return t('finished');
      default:
        return status || t('noStatus');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('noDate');
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className="relative bg-white dark:bg-gray-800/50 rounded-xl shadow-sm hover:shadow-md dark:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group">
        {/* Estado del torneo y categoría */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {categoryName}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(tournament.status)}`}>
            {getStatusText(tournament.status)}
          </span>
        </div>

        {/* Imagen del torneo */}
        {tournament.image_url && (
          <div className="relative w-full mb-6" style={{ aspectRatio: '5/4' }}>
            <Image
              src={tournament.image_url}
              alt={tournament.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Encabezado */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
            {tournament.name}
          </h3>
        </div>

        {/* Información principal */}
        <div className="space-y-4">
          {/* Fecha de inicio y fin */}
          <div className="flex flex-col gap-2">
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Fecha de inicio</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                {formatDate(tournamentInfo.start_date || tournament.start_date)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">Fecha de fin</p>
              <p className="text-sm text-red-800 dark:text-red-200">
                {formatDate(tournamentInfo.end_date || tournament.end_date)}
              </p>
            </div>
          </div>

          {/* Equipos y progreso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Equipos registrados
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {registeredTeams} / {maxTeams}
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
                  {Math.round(registrationProgress)}% completado
                </span>
                {tournament.status?.toLowerCase() === 'inscripciones_abiertas' && availableSpots > 0 ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {availableSpots} cupos disponibles
                  </span>
                ) : registeredTeams === maxTeams && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Cupos completos
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Costo de inscripción */}
          {(tournamentInfo.inscription_cost || tournament.inscription_cost) > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                Costo de inscripción
              </p>
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                ${tournamentInfo.inscription_cost || tournament.inscription_cost}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
