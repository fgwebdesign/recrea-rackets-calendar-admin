import { Progress } from '@/components/ui/progress';
import { Users2, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryFilterTabs } from './CategoryFilterTabs';
import { EmptyTournaments } from './EmptyTournaments';
import Image from 'next/image';
import { useTournaments } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { useTranslations } from '@/contexts/TranslationContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Tournament, Category } from '@/types/tournament';

interface TournamentRegistrationProgressProps {
  tournaments?: Tournament[];
  categories?: Category[];
}

export function TournamentRegistrationProgress({ 
  tournaments: propTournaments, 
  categories: propCategories 
}: TournamentRegistrationProgressProps) {
  const t = useTranslations('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Usar props si están disponibles, sino usar hooks
  const { tournaments: hookTournaments } = useTournaments();
  const { categories: hookCategories } = useCategories();

  const tournaments = propTournaments || hookTournaments;
  const categories = propCategories || hookCategories;

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Si no hay torneos, mostrar mensaje vacío
  if (!tournaments || tournaments.length === 0) {
    return <EmptyTournaments />;
  }

  // Filtrar torneos por categoría seleccionada
  const filteredTournaments = selectedCategory === 'all'
    ? tournaments
    : tournaments.filter(tournament => {
        // Verificar si el torneo tiene la categoría seleccionada
        return tournament.category?.id === selectedCategory || 
               tournament.category?.name === selectedCategory ||
               tournament.category_id === selectedCategory;
      });


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

      <div className="relative w-full">
        {filteredTournaments.length > 3 ? (
          <Carousel
            opts={{
              align: "start",
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {filteredTournaments.map((tournament) => (
                <CarouselItem key={tournament.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <TournamentCard 
                    tournament={tournament} 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg" />
            <CarouselNext className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg" />
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredTournaments.map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
              />
            ))}
          </div>
        )}

        {/* Pagination Dots */}
        {filteredTournaments.length > 3 && count > 1 && (
          <div className="flex justify-center gap-1.5 sm:gap-2 py-3 sm:py-4">
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-200 ${
                  current === index + 1
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

// Componente de tarjeta extraído para mejor organización
function TournamentCard({ tournament }: { tournament: Tournament }) {
  const t = useTranslations('dashboard');
  // Obtener información del torneo
  const tournamentInfo = tournament.tournament_info;
  const registeredTeams = tournament.tournament_teams?.length || 0;
  const maxTeams = tournament.max_teams || 12; // Default a 12 equipos
  const availableSpots = maxTeams - registeredTeams;
  const registrationProgress = maxTeams > 0 ? (registeredTeams / maxTeams) * 100 : 0;

  // Obtener categoría del torneo
  const categoryName = tournament.category?.name || t('noCategory');

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
      <div className="relative bg-white dark:bg-gray-800/50 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md dark:shadow-lg transition-all duration-300 p-4 sm:p-5 lg:p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group">
        {/* Estado del torneo y categoría */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 truncate">
            {categoryName}
          </span>
          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${getStatusStyle(tournament.status)}`}>
            {getStatusText(tournament.status)}
          </span>
        </div>

        {/* Imagen del torneo */}
        {tournamentInfo?.tournament_thumbnail && (
          <div className="relative w-full mb-4 sm:mb-6" style={{ aspectRatio: '5/4' }}>
            <Image
              src={tournamentInfo.tournament_thumbnail}
              alt={tournament.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Encabezado */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors break-words">
            {tournament.name}
          </h3>
        </div>

        {/* Información principal */}
        <div className="space-y-3 sm:space-y-4">
          {/* Fecha de inicio y fin */}
          <div className="flex flex-col gap-2">
            <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <p className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-300">{t('startDate')}</p>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 break-words">
                {formatDate(tournament.start_date)}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <p className="text-xs sm:text-sm font-medium text-red-900 dark:text-red-300">{t('endDate')}</p>
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 break-words">
                {formatDate(tournament.end_date)}
              </p>
            </div>
          </div>

          {/* Equipos y progreso */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {t('registeredTeams')}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                {registeredTeams} / {maxTeams}
              </span>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Progress 
                value={registrationProgress} 
                className="h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-700" 
                indicatorClassName={`${
                  registrationProgress === 100
                    ? 'bg-blue-500 dark:bg-blue-600'
                    : 'bg-emerald-500 dark:bg-emerald-600'
                }`}
              />
              <div className="flex justify-between gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(registrationProgress)}% {t('completed')}
                </span>
                {tournament.status?.toLowerCase() === 'inscripciones_abiertas' && availableSpots > 0 ? (
                  <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {availableSpots} {t('spotsAvailable')}
                  </span>
                ) : registeredTeams === maxTeams && (
                  <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {t('spotsFull')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Costo de inscripción */}
          {tournamentInfo && tournamentInfo.inscription_cost > 0 && (
            <div className="mt-2 p-2.5 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-0.5 sm:mb-1">
                {t('inscriptionCost')}
              </p>
              <span className="text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                ${tournamentInfo.inscription_cost}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
