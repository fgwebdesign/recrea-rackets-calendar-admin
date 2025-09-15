'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Tipos
export type Locale = 'es' | 'en';

// Traducciones hardcodeadas temporalmente para debugging
const translations: Record<Locale, Record<string, any>> = {
  es: {
    auth: {
      email: 'Correo electrónico',
      emailPlaceholder: 'admin@ejemplo.com',
      password: 'Contraseña',
      passwordPlaceholder: '••••••••',
      loginButton: 'Iniciar sesión',
      needHelp: '¿Necesitas ayuda?',
      contactSupport: 'Contacta a soporte'
    },
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar'
    },
    dashboard: {
      title: 'Panel de Control',
      description: 'Gestión y visualización de ligas y torneos de pádel.',
      leagues: 'Ligas',
      tournaments: 'Torneos',
      leagueStats: 'Estadísticas de Ligas',
      tournamentStats: 'Estadísticas de Torneos',
      upcomingMatchesLeagues: 'Próximos Partidos - Ligas',
      upcomingMatchesTournaments: 'Próximos Partidos - Torneos',
      registrationProgressLeagues: 'Progreso de Inscripciones - Ligas',
      registrationProgressTournaments: 'Progreso de Inscripciones - Torneos',
      standingsLeagues: 'Tabla de Posiciones - Ligas',
      standingsTournaments: 'Tabla de Posiciones - Torneos',
      activeCategories: 'Categorías activas',
      totalPlayers: 'Total Jugadores',
      totalMatches: 'Partidos Totales',
      completedMatches: 'Partidos Completados',
      totalTournaments: 'Total Torneos',
      inProgress: 'En Curso',
      totalTeams: 'Total Equipos',
      revenue: 'Ingresos',
      // Componentes específicos
      allCategories: 'Todas las categorías',
      registrationsOpen: 'Inscripciones abiertas',
      inProgressStatus: 'En Curso',
      finished: 'Finalizada',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin',
      registeredTeams: 'Equipos registrados',
      completed: 'completado',
      spotsAvailable: 'cupos disponibles',
      spotsFull: 'Cupos completos',
      inscriptionCost: 'Costo de inscripción',
      categoryNotFound: 'Categoría no encontrada',
      date: 'Fecha',
      time: 'Hora',
      noMatchesScheduled: 'No hay partidos programados aún.',
      noMatchesForNow: 'Sin partidos por ahora.',
      noLeaguesAvailable: 'No hay ligas disponibles en este momento.',
      noPositionsAvailable: 'No hay posiciones disponibles en este momento.',
      errorLoadingPositions: 'Error al cargar posiciones',
      selectTournament: '¡Selecciona un torneo!',
      selectTournamentDescription: 'Elige un torneo del menú desplegable para ver su tabla de posiciones y estadísticas.',
      positionsComingSoon: '¡Posiciones próximamente!',
      positionsComingSoonDescription: 'Las posiciones aparecerán aquí cuando los equipos comiencen a jugar partidos. ¡Mantente atento para ver quién lidera la competencia!'
    },
    datetime: {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
      january: 'enero',
      february: 'febrero',
      march: 'marzo',
      april: 'abril',
      may: 'mayo',
      june: 'junio',
      july: 'julio',
      august: 'agosto',
      september: 'septiembre',
      october: 'octubre',
      november: 'noviembre',
      december: 'diciembre'
    },
    sidebar: {
      home: 'Inicio',
      tournaments: 'Torneos',
      leagues: 'Ligas',
      categories: 'Categorías',
      courts: 'Canchas',
      professors: 'Profesores',
      sponsors: 'Patrocinadores',
      users: 'Usuarios',
      settings: 'Configuraciones',
      viewTournaments: 'Ver torneos',
      createTournament: 'Crear torneo',
      viewLeagues: 'Ver ligas',
      createLeague: 'Crear liga',
      club: 'Club:',
      clubName: 'Recrea Padel Club',
      logout: 'Cerrar sesión',
      loggingOut: 'Cerrando sesión...'
    },
    weather: {
      morning: 'Mañana',
      day: 'Mediodía',
      evening: 'Tarde',
      night: 'Noche',
      humidity: 'Humedad',
      wind: 'Viento',
      weatherInfo: 'Información no disponible',
      loadingWeather: 'Error al cargar el clima',
      location: 'Montevideo, Uruguay.',
      // Condiciones climáticas
      clouds: 'Nubes',
      sunny: 'Soleado',
      rainy: 'Lluvioso',
      thunderstorm: 'Tormenta',
      partlyCloudy: 'Parcialmente nublado'
    }
  },
  en: {
    auth: {
      email: 'Email',
      emailPlaceholder: 'admin@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      loginButton: 'Log in',
      needHelp: 'Need help?',
      contactSupport: 'Contact support'
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel'
    },
    dashboard: {
      title: 'Dashboard',
      description: 'Management and visualization of padel leagues and tournaments.',
      leagues: 'Leagues',
      tournaments: 'Tournaments',
      leagueStats: 'League Statistics',
      tournamentStats: 'Tournament Statistics',
      upcomingMatchesLeagues: 'Upcoming Matches - Leagues',
      upcomingMatchesTournaments: 'Upcoming Matches - Tournaments',
      registrationProgressLeagues: 'Registration Progress - Leagues',
      registrationProgressTournaments: 'Registration Progress - Tournaments',
      standingsLeagues: 'Standings - Leagues',
      standingsTournaments: 'Standings - Tournaments',
      activeCategories: 'Active Categories',
      totalPlayers: 'Total Players',
      totalMatches: 'Total Matches',
      completedMatches: 'Completed Matches',
      totalTournaments: 'Total Tournaments',
      inProgress: 'In Progress',
      totalTeams: 'Total Teams',
      revenue: 'Revenue',
      // Componentes específicos
      allCategories: 'All categories',
      registrationsOpen: 'Registrations open',
      inProgressStatus: 'In Progress',
      finished: 'Finished',
      startDate: 'Start date',
      endDate: 'End date',
      registeredTeams: 'Registered teams',
      completed: 'completed',
      spotsAvailable: 'spots available',
      spotsFull: 'Spots full',
      inscriptionCost: 'Registration cost',
      categoryNotFound: 'Category not found',
      date: 'Date',
      time: 'Time',
      noMatchesScheduled: 'No matches scheduled yet.',
      noMatchesForNow: 'No matches for now.',
      noLeaguesAvailable: 'No leagues available at the moment.',
      noPositionsAvailable: 'No positions available at the moment.',
      errorLoadingPositions: 'Error loading positions',
      selectTournament: 'Select a tournament!',
      selectTournamentDescription: 'Choose a tournament from the dropdown menu to see its standings and statistics.',
      positionsComingSoon: 'Positions coming soon!',
      positionsComingSoonDescription: 'Positions will appear here when teams start playing matches. Stay tuned to see who leads the competition!'
    },
    datetime: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December'
    },
    sidebar: {
      home: 'Home',
      tournaments: 'Tournaments',
      leagues: 'Leagues',
      categories: 'Categories',
      courts: 'Courts',
      professors: 'Professors',
      sponsors: 'Sponsors',
      users: 'Users',
      settings: 'Settings',
      viewTournaments: 'View tournaments',
      createTournament: 'Create tournament',
      viewLeagues: 'View leagues',
      createLeague: 'Create league',
      club: 'Club:',
      clubName: 'Recrea Padel Club',
      logout: 'Log out',
      loggingOut: 'Logging out...'
    },
    weather: {
      morning: 'Morning',
      day: 'Noon',
      evening: 'Evening',
      night: 'Night',
      humidity: 'Humidity',
      wind: 'Wind',
      weatherInfo: 'Information not available',
      loadingWeather: 'Error loading weather',
      location: 'Montevideo, Uruguay.',
      // Condiciones climáticas
      clouds: 'Clouds',
      sunny: 'Sunny',
      rainy: 'Rainy',
      thunderstorm: 'Thunderstorm',
      partlyCloudy: 'Partly cloudy'
    }
  }
};

// Contexto de traducciones
interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (namespace: string, key: string) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Hook principal para usar traducciones
export function useTranslations(namespace: string) {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }

  return useCallback((key: string) => {
    return context.t(namespace, key);
  }, [context, namespace]);
}

// Hook para cambiar idioma
export function useLanguage() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useLanguage must be used within a TranslationProvider');
  }

  return {
    locale: context.locale,
    changeLanguage: context.setLocale,
    isLoading: context.isLoading
  };
}

// Provider principal
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar idioma guardado del localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('preferred-language') as Locale;
    if (savedLocale && (savedLocale === 'es' || savedLocale === 'en')) {
      setLocale(savedLocale);
    }
  }, []);

  // Función para cambiar idioma
  const handleSetLocale = useCallback((newLocale: Locale) => {
    setIsLoading(true);
    setLocale(newLocale);
    localStorage.setItem('preferred-language', newLocale);
    
    // Simular carga
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);

  // Función para obtener traducción
  const t = useCallback((namespace: string, key: string): string => {
    const localeTranslations = translations[locale];
    if (!localeTranslations) {
      console.warn(`No translations found for locale: ${locale}`);
      return key;
    }

    const namespaceTranslations = localeTranslations[namespace];
    if (!namespaceTranslations) {
      console.warn(`No translations found for namespace: ${namespace}`);
      return key;
    }

    const keys = key.split('.');
    let value: any = namespaceTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${namespace}.${key}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [locale]);

  const contextValue: TranslationContextType = {
    locale,
    setLocale: handleSetLocale,
    t,
    isLoading
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}