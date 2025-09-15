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
      contactSupport: 'Contacta a soporte',
      // Login page content
      appTitle: 'Matchly',
      appDescription: 'Sistema integral para la creación de ligas, torneos, partidos y usuarios para tu club de pádel.',
      adminPortal: 'Portal Administrativo de Matchly'
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
    users: {
      title: 'Usuarios',
      description: 'Administra y visualiza todos los usuarios.',
      searchPlaceholder: 'Buscar usuario...',
      allRoles: 'Todos los roles',
      player: 'Jugador',
      admin: 'Administrador',
      noUsersFound: 'No se encontraron usuarios con esta búsqueda',
      // Tabla
      user: 'USUARIO',
      email: 'EMAIL',
      phone: 'TELÉFONO',
      role: 'ROL',
      status: 'ESTADO',
      lastAccess: 'ÚLTIMO ACCESO',
      active: 'Activo',
      inactive: 'Inactivo',
      // Paginación
      showing: 'Mostrando',
      to: 'a',
      of: 'de',
      users: 'usuarios',
      // Estados y roles
      notAvailable: 'No disponible'
    },
    sponsors: {
      title: 'Patrocinadores',
      description: 'Administra los patrocinadores del club.',
      addSponsor: 'Añadir Patrocinador',
      // Modal de agregar
      addNewSponsor: 'Añadir nuevo patrocinador',
      sponsorName: 'Nombre del patrocinador',
      sponsorNamePlaceholder: 'Ingresa el nombre del patrocinador',
      sponsorLogo: 'Logo del patrocinador',
      logoRecommendation: 'Recomendación para el logo:',
      recommendedSize: 'Tamaño recomendado: 400 x 200 píxeles',
      format: 'Formato: PNG o JPG',
      maxSize: 'Máximo 5MB',
      transparentBackground: 'Fondo transparente preferiblemente',
      logoDescription: 'Usar estas dimensiones asegurará que el logo se vea perfectamente en el portal del jugador.',
      clickToUpload: 'Click para subir o arrastrar logo',
      fileFormat: 'PNG, JPG (max. 5MB)',
      changeLogo: 'Cambiar logo',
      cancel: 'Cancelar',
      save: 'Guardar',
      saving: 'Guardando...',
      // Modal de editar
      editSponsor: 'Editar patrocinador',
      uploadLogo: 'Subir un logo',
      dragAndDrop: 'o arrastra y suelta',
      fileFormatEdit: 'PNG, JPG, GIF hasta 5MB',
      saveChanges: 'Guardar cambios',
      // Modal de confirmación
      confirmDeletion: 'Confirmar Eliminación',
      deleteConfirmation: '¿Estás seguro que deseas eliminar',
      cannotUndo: 'Esta acción no se puede deshacer.',
      delete: 'Eliminar',
      // Errores
      nameAndLogoRequired: 'El nombre y el logo son requeridos',
      imageTooLarge: 'La imagen no debe superar los 5MB',
      errorCreatingSponsor: 'Error al crear el patrocinador',
      error: 'Error'
    },
    professors: {
      title: 'Profesores',
      description: 'Administra los profesores del club.',
      addProfessor: 'Añadir Profesor',
      // Modal de agregar
      addNewProfessor: 'Añadir nuevo profesor',
      editProfessor: 'Editar profesor',
      // Información personal
      personalInfo: 'Información Personal',
      fullName: 'Nombre completo',
      fullNamePlaceholder: 'Ingresa el nombre completo del profesor',
      experienceYears: 'Años de experiencia',
      descriptionPlaceholder: 'Describe la experiencia y especialidades del profesor',
      // Especialidades
      specializations: 'Especialidades',
      padel: 'Pádel',
      football: 'Fútbol',
      healthWellness: 'Salud y Bienestar',
      otherServices: 'Otros Servicios',
      // Disponibilidad y contacto
      availabilityContact: 'Disponibilidad y Contacto',
      availabilityDays: 'Días de disponibilidad',
      availabilityHours: 'Horarios de disponibilidad',
      availabilityHoursPlaceholder: 'Ej: Lunes a Viernes: 9:00 - 18:00, Sábados: 10:00 - 14:00',
      instagramOptional: 'Instagram (opcional)',
      instagramPlaceholder: '@usuario_instagram',
      whatsappOptional: 'WhatsApp (opcional)',
      whatsappPlaceholder: '+54 9 11 1234-5678',
      professorActive: 'Profesor activo',
      // Foto
      professorPhoto: 'Foto del profesor',
      imageRecommendation: 'Recomendación para la imagen:',
      recommendedSize: 'Tamaño recomendado: 400 x 400 píxeles',
      format: 'Formato: PNG o JPG',
      maxSize: 'Máximo 5MB',
      imageDescription: 'Usar estas dimensiones asegurará que la foto se vea perfectamente en el portal.',
      clickToUpload: 'Click para subir o arrastrar imagen',
      fileFormat: 'PNG, JPG (max. 5MB)',
      changeImage: 'Cambiar imagen',
      // Estados
      active: 'Activo',
      inactive: 'Inactivo',
      available: 'Disponible',
      yearsExperience: 'años de experiencia',
      // Días de la semana
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
      // Botones
      cancel: 'Cancelar',
      save: 'Guardar',
      saving: 'Guardando...',
      saveProfessor: 'Guardar Profesor',
      saveChanges: 'Guardar Cambios',
    // Errores
    nameRequired: 'El nombre es requerido',
    descriptionRequired: 'La descripción es requerida',
    availabilityHoursRequired: 'Los horarios de disponibilidad son requeridos',
    specializationsRequired: 'Debe seleccionar al menos una especialidad',
    availabilityDaysRequired: 'Debe seleccionar al menos un día de disponibilidad',
    imageTooLarge: 'La imagen no debe superar los 5MB',
    errorCreatingProfessor: 'Error al crear el profesor',
    errorUpdatingProfessor: 'Error al actualizar el profesor',
    error: 'Error'
  },
  // Loading Screen
  loading: {
    defaultMessage: 'Cargando...',
    verifyingSession: 'Verificando sesión...',
    loadingData: 'Cargando datos...',
    pleaseWait: 'Por favor espera...'
  },
  // Courts
  courts: {
    title: 'Canchas',
    description: 'Administra las canchas del club.',
    addCourt: 'Añadir Cancha',
    // Modal de agregar
    addNewCourt: 'Añadir nueva cancha',
    editCourt: 'Editar cancha',
    // Campos del formulario
    courtName: 'Nombre de la cancha',
    courtNamePlaceholder: 'Ingresa el nombre de la cancha',
    courtPhoto: 'Foto de la cancha',
    // Recomendaciones de imagen
    imageRecommendation: 'Recomendación para la imagen:',
    recommendedSize: 'Tamaño recomendado: 1920 x 1080 píxeles',
    format: 'Formato: PNG o JPG',
    maxSize: 'Máximo 5MB',
    imageDescription: 'Usar estas dimensiones asegurará que tu foto se vea perfectamente en el portal del jugador.',
    clickToUpload: 'Click para subir o arrastrar imagen',
    fileFormat: 'PNG, JPG (max. 5MB)',
    changeImage: 'Cambiar imagen',
    uploadPhoto: 'Subir una foto',
    dragAndDrop: 'o arrastra y suelta',
    fileFormatEdit: 'PNG, JPG, GIF hasta 10MB',
    // Botones
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando...',
    saveChanges: 'Guardar cambios',
    // Errores
    nameRequired: 'El nombre es requerido',
    photoRequired: 'La foto es requerida',
    nameAndPhotoRequired: 'El nombre y la foto son requeridos',
    imageTooLarge: 'La imagen no debe superar los 5MB',
    errorCreatingCourt: 'Error al crear la cancha',
    error: 'Error'
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
      contactSupport: 'Contact support',
      // Login page content
      appTitle: 'Matchly',
      appDescription: 'Comprehensive system for creating leagues, tournaments, matches and users for your padel club.',
      adminPortal: 'Matchly Administrative Portal'
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
    users: {
      title: 'Users',
      description: 'Manage and view all users.',
      searchPlaceholder: 'Search user...',
      allRoles: 'All roles',
      player: 'Player',
      admin: 'Administrator',
      noUsersFound: 'No users found with this search',
      // Tabla
      user: 'USER',
      email: 'EMAIL',
      phone: 'PHONE',
      role: 'ROLE',
      status: 'STATUS',
      lastAccess: 'LAST ACCESS',
      active: 'Active',
      inactive: 'Inactive',
      // Paginación
      showing: 'Showing',
      to: 'to',
      of: 'of',
      users: 'users',
      // Estados y roles
      notAvailable: 'Not available'
    },
    sponsors: {
      title: 'Sponsors',
      description: 'Manage the club sponsors.',
      addSponsor: 'Add Sponsor',
      // Modal de agregar
      addNewSponsor: 'Add new sponsor',
      sponsorName: 'Sponsor name',
      sponsorNamePlaceholder: 'Enter sponsor name',
      sponsorLogo: 'Sponsor logo',
      logoRecommendation: 'Logo recommendation:',
      recommendedSize: 'Recommended size: 400 x 200 pixels',
      format: 'Format: PNG or JPG',
      maxSize: 'Maximum 5MB',
      transparentBackground: 'Transparent background preferably',
      logoDescription: 'Using these dimensions will ensure the logo looks perfect on the player portal.',
      clickToUpload: 'Click to upload or drag logo',
      fileFormat: 'PNG, JPG (max. 5MB)',
      changeLogo: 'Change logo',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      // Modal de editar
      editSponsor: 'Edit sponsor',
      uploadLogo: 'Upload a logo',
      dragAndDrop: 'or drag and drop',
      fileFormatEdit: 'PNG, JPG, GIF up to 5MB',
      saveChanges: 'Save changes',
      // Modal de confirmación
      confirmDeletion: 'Confirm Deletion',
      deleteConfirmation: 'Are you sure you want to delete',
      cannotUndo: 'This action cannot be undone.',
      delete: 'Delete',
      // Errores
      nameAndLogoRequired: 'Name and logo are required',
      imageTooLarge: 'Image must not exceed 5MB',
      errorCreatingSponsor: 'Error creating sponsor',
      error: 'Error'
    },
    professors: {
      title: 'Professors',
      description: 'Manage the club professors.',
      addProfessor: 'Add Professor',
      // Modal de agregar
      addNewProfessor: 'Add new professor',
      editProfessor: 'Edit professor',
      // Información personal
      personalInfo: 'Personal Information',
      fullName: 'Full name',
      fullNamePlaceholder: 'Enter professor full name',
      experienceYears: 'Years of experience',
      descriptionPlaceholder: 'Describe the professor experience and specializations',
      // Especialidades
      specializations: 'Specializations',
      padel: 'Padel',
      football: 'Football',
      healthWellness: 'Health and Wellness',
      otherServices: 'Other Services',
      // Disponibilidad y contacto
      availabilityContact: 'Availability and Contact',
      availabilityDays: 'Availability days',
      availabilityHours: 'Availability hours',
      availabilityHoursPlaceholder: 'Ex: Monday to Friday: 9:00 - 18:00, Saturdays: 10:00 - 14:00',
      instagramOptional: 'Instagram (optional)',
      instagramPlaceholder: '@instagram_user',
      whatsappOptional: 'WhatsApp (optional)',
      whatsappPlaceholder: '+54 9 11 1234-5678',
      professorActive: 'Active professor',
      // Foto
      professorPhoto: 'Professor photo',
      imageRecommendation: 'Image recommendation:',
      recommendedSize: 'Recommended size: 400 x 400 pixels',
      format: 'Format: PNG or JPG',
      maxSize: 'Maximum 5MB',
      imageDescription: 'Using these dimensions will ensure the photo looks perfect on the portal.',
      clickToUpload: 'Click to upload or drag image',
      fileFormat: 'PNG, JPG (max. 5MB)',
      changeImage: 'Change image',
      // Estados
      active: 'Active',
      inactive: 'Inactive',
      available: 'Available',
      yearsExperience: 'years of experience',
      // Días de la semana
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      // Botones
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      saveProfessor: 'Save Professor',
      saveChanges: 'Save Changes',
    // Errores
    nameRequired: 'Name is required',
    descriptionRequired: 'Description is required',
    availabilityHoursRequired: 'Availability hours are required',
    specializationsRequired: 'Must select at least one specialization',
    availabilityDaysRequired: 'Must select at least one availability day',
    imageTooLarge: 'Image must not exceed 5MB',
    errorCreatingProfessor: 'Error creating professor',
    errorUpdatingProfessor: 'Error updating professor',
    error: 'Error'
  },
  // Loading Screen
  loading: {
    defaultMessage: 'Loading...',
    verifyingSession: 'Verifying session...',
    loadingData: 'Loading data...',
    pleaseWait: 'Please wait...'
  },
  // Courts
  courts: {
    title: 'Courts',
    description: 'Manage the club courts.',
    addCourt: 'Add Court',
    // Modal de agregar
    addNewCourt: 'Add new court',
    editCourt: 'Edit court',
    // Campos del formulario
    courtName: 'Court name',
    courtNamePlaceholder: 'Enter court name',
    courtPhoto: 'Court photo',
    // Recomendaciones de imagen
    imageRecommendation: 'Image recommendation:',
    recommendedSize: 'Recommended size: 1920 x 1080 pixels',
    format: 'Format: PNG or JPG',
    maxSize: 'Maximum 5MB',
    imageDescription: 'Using these dimensions will ensure your photo looks perfect on the player portal.',
    clickToUpload: 'Click to upload or drag image',
    fileFormat: 'PNG, JPG (max. 5MB)',
    changeImage: 'Change image',
    uploadPhoto: 'Upload a photo',
    dragAndDrop: 'or drag and drop',
    fileFormatEdit: 'PNG, JPG, GIF up to 10MB',
    // Botones
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    saveChanges: 'Save changes',
    // Errores
    nameRequired: 'Name is required',
    photoRequired: 'Photo is required',
    nameAndPhotoRequired: 'Name and photo are required',
    imageTooLarge: 'Image must not exceed 5MB',
    errorCreatingCourt: 'Error creating court',
    error: 'Error'
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