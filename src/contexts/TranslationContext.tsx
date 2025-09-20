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
      noMatchesScheduled: '¡No hay partidos programados aún!',
      noMatchesScheduledDescription: 'Los partidos de torneos aparecerán aquí cuando estén programados. ¡Mantente atento a las próximas competencias!',
      noMatchesForAllCategories: 'Los partidos de torneos aparecerán aquí cuando estén programados. ¡Mantente atento a las próximas competencias!',
      noMatchesForCategory: 'No hay partidos programados para la categoría {category}. ¡Revisa otras categorías o espera a que se programen más partidos!',
      noMatchesForNow: 'Sin partidos por ahora.',
      noLeaguesAvailable: 'No hay ligas disponibles en este momento.',
      noPositionsAvailable: 'No hay posiciones disponibles en este momento.',
      errorLoadingPositions: 'Error al cargar posiciones',
      selectTournament: '¡Selecciona un torneo!',
      selectTournamentDescription: 'Elige un torneo del menú desplegable para ver su tabla de posiciones y estadísticas.',
      positionsComingSoon: 'Posiciones próximamente',
      positionsComingSoonDescription: 'Las posiciones aparecerán aquí cuando se generen los partidos del torneo.',
      noTournaments: 'Sin torneos disponibles',
      noTournamentsDescription: 'No hay torneos disponibles en este momento. Los torneos aparecerán aquí cuando estén creados.',
      noTournamentsForCategory: 'Sin torneos en esta categoría',
      noTournamentsForCategoryDescription: 'No hay torneos disponibles para la categoría seleccionada.'
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
  },
  // Tournaments
  tournaments: {
    title: 'Torneos',
    description: 'Administra y visualiza todos los torneos del sistema.',
    createTournament: 'Crear Torneo',
    createFirstTournament: 'Crear Primer Torneo',
    // Estados de torneos
    statusUpcoming: 'Inscripciones Abiertas',
    statusInProgress: 'En Curso',
    statusCompleted: 'Finalizado',
    statusCompletedPlural: 'Finalizados',
    // Estadísticas
    totalTournaments: 'Total Torneos',
    totalTeams: 'Total Equipos',
    revenue: 'Ingresos',
    inProgress: 'En Curso',
    // Filtros
    searchPlaceholder: 'Buscar por nombre o categoría...',
    allCategories: 'Todas las categorías',
    allStatuses: 'Todos',
    dateFilter: 'Filtro Fechas',
    clearFilters: 'Limpiar Filtros',
    viewAllTournaments: 'Ver Todos los Torneos',
    // Torneo específico
    registrations: 'Inscripciones',
    complete: '¡Completo!',
    teams: 'Equipos',
    startDate: 'Inicio',
    endDate: 'Fin',
    sponsors: 'Patrocinadores',
    noSponsors: 'Sin patrocinadores',
    // Tipos de torneo
    nineTeams: '9 Equipos',
    twelveTeams: '12 Equipos',
    sixteenTeams: '16 Equipos',
    // Empty states
    noTournamentsFound: 'No se encontraron torneos',
    startFirstTournament: '¡Comienza tu primer torneo!',
    noTournamentsFoundDescription: 'No hay torneos que coincidan con los filtros seleccionados. Intenta ajustar tu búsqueda.',
    startFirstTournamentDescription: 'Crea tu primer torneo y comienza a organizar competencias increíbles de pádel.',
    // Botones de acción
    retry: 'Reintentar',
    // Calendar Filter
    quickFilters: 'Filtros Rápidos',
    customRange: 'Rango Personalizado',
    selectDates: 'Seleccionar fechas',
    selectEnd: 'Seleccionar fin',
    thisMonth: 'Este Mes',
    nextMonth: 'Próximo Mes',
    thisYear: 'Este Año',
    upcoming: 'Próximos',
    clear: 'Limpiar',
    daysSelected: 'días seleccionados',
    showingTournaments: 'Mostrando torneos del',
    to: 'al',
    activeFilter: 'Filtro activo:',
    // Tournament Detail Page
    detail: {
      errorLoading: 'Error al cargar el torneo',
      retry: 'Reintentar',
      backToTournaments: 'Volver a Torneos',
      tournamentNotFound: 'No se encontró el torneo solicitado.',
      registrationProgress: 'Progreso de Inscripciones',
      registrationsComplete: '¡Inscripciones completas!',
      tournamentStats: 'Estadísticas del Torneo',
      navigation: {
        calendar: 'Calendario',
        calendarDescription: 'Programar partidos y gestionar horarios',
        teams: 'Equipos',
        teamsDescription: 'Ver equipos inscritos y pagos',
        groups: 'Grupos',
        groupsDescription: 'Generar y gestionar grupos',
        matches: 'Partidos',
        matchesDescription: 'Gestionar partidos y resultados',
        standings: 'Clasificación',
        standingsDescription: 'Ver posiciones y estadísticas',
        bracket: 'Eliminatorias',
        bracketDescription: 'Bracket de eliminación',
        payments: 'Pagos',
        paymentsDescription: 'Gestionar pagos e inscripciones'
      },
      info: {
        description: 'Descripción',
        noDescription: 'Sin descripción',
        location: 'Ubicación',
        inscriptionCost: 'Costo de Inscripción',
        rules: 'Reglamento',
        prizes: 'Premios'
      },
      stats: {
        potentialRevenue: 'Revenue Potencial',
        actualRevenue: 'Revenue Actual',
        pendingRevenue: 'Revenue Pendiente',
        paymentRate: 'Tasa de Pago',
        perTeam: 'por equipo',
        paidTeams: 'equipos pagados',
        pendingTeams: 'equipos pendientes',
        registeredTeams: 'Equipos Registrados',
        scheduledMatches: 'Partidos Programados',
        groupsGenerated: 'Grupos Generados',
        totalRevenue: 'Ingresos Totales',
        // Tournament Stats Component
        fullCapacity: 'Cupo completo',
        teamsRemaining: 'Faltan {count} equipos',
        paidTeamsTitle: 'Equipos Pagados',
        ofTotal: 'del total',
        noTeams: 'Sin equipos',
        pending: 'Pendientes',
        toPay: 'por pagar',
        revenue: 'Ingresos',
        collected: 'recaudado'
      }
    },
    // Teams Page
    teamsPage: {
      errorLoading: 'Error al cargar los equipos',
      backToTournament: 'Volver al torneo',
      title: 'Equipos',
      description: 'Lista de equipos inscritos en el torneo',
      registerTeam: 'Registrar Equipo',
      registeredTeams: 'Equipos Inscritos',
      noTeamsRegistered: 'No hay equipos inscritos',
      noTeamsDescription: 'Este torneo aún no tiene equipos registrados. Los equipos aparecerán aquí una vez que se inscriban.',
      // Stats translations
      fullCapacity: 'Cupo completo',
      teamsRemaining: 'Faltan {count} equipos',
      paidTeamsTitle: 'Equipos Pagados',
      ofTotal: 'del total',
      noTeams: 'Sin equipos',
      pending: 'Pendientes',
      toPay: 'por pagar',
      revenue: 'Ingresos',
      collected: 'recaudado',
      // Team Card translations
      team: 'Equipo',
      players: 'Jugadores',
      player1: 'Jugador 1',
      player2: 'Jugador 2',
      shirtSizes: 'Talles de Remera',
      oneSizeSelected: 'Un talle seleccionado',
      multipleSizesSelected: '{count} talles seleccionados',
      unknownTeam: 'Equipo desconocido',
      noRestrictions: 'Sin restricciones',
      paymentStatus: {
        paid: 'Pagado',
        pending: 'Pendiente',
        failed: 'Fallido'
      },
      timeSlots: {
        day1Morning: 'Día 1 - Mañana',
        day1Afternoon: 'Día 1 - Tarde',
        day1Evening: 'Día 1 - Noche',
        day1Night: 'Día 1 - Noche',
        day2Morning: 'Día 2 - Mañana',
        day2Afternoon: 'Día 2 - Tarde',
        day2Evening: 'Día 2 - Noche',
        day2Night: 'Día 2 - Noche',
        day3Morning: 'Día 3 - Mañana',
        day3Afternoon: 'Día 3 - Tarde',
        day3Evening: 'Día 3 - Noche',
        day3Night: 'Día 3 - Noche',
        morning: 'Mañana',
        afternoon: 'Tarde',
        evening: 'Noche',
        night: 'Noche'
      }
    },
    // Admin Register Team Page
    adminRegister: {
      backToTeams: 'Volver a equipos',
      title: 'Registrar Equipo',
      description: 'Inscribe un equipo en el torneo desde el panel de administración',
      formTitle: 'Formulario de Registro',
      placeholders: {
        selectFirstPlayer: 'Seleccionar primer jugador...',
        selectSecondPlayer: 'Seleccionar segundo jugador...'
      },
      validation: {
        player1Required: 'Debe seleccionar el primer jugador',
        player2Required: 'Debe seleccionar el segundo jugador',
        playersMustBeDifferent: 'Los dos jugadores deben ser distintos',
        slotRequired: 'Debe seleccionar un horario',
        slotFull: 'Este horario está completo',
        shirtSizesRequired: 'Debe seleccionar al menos un talle de remera',
        shirtSizesMax: 'No puede seleccionar más de 2 talles'
      },
      errors: {
        title: 'Error',
        loadPlayers: 'Error al cargar jugadores disponibles',
        loadPlayersDescription: 'Error al cargar la lista de jugadores disponibles',
        loadSlots: 'Error al cargar slots disponibles',
        loadSlotsDescription: 'Error al cargar los horarios disponibles',
        registrationError: 'Error de Registro',
        playersAlreadyRegistered: 'Uno o ambos jugadores ya están registrados en este torneo',
        tournamentFull: 'Torneo Completo',
        tournamentFullDescription: 'El torneo está completo o el horario seleccionado no tiene cupos disponibles',
        invalidPlayers: 'Jugadores Inválidos',
        validationError: 'Error de Validación',
        validationErrorDescription: 'Error en los datos enviados',
        tournamentNotFound: 'Torneo No Encontrado',
        tournamentNotFoundDescription: 'El torneo solicitado no existe',
        serverError: 'Error del Servidor',
        serverErrorDescription: 'Error interno del servidor. Intenta nuevamente.',
        registerTeamError: 'Error al registrar el equipo',
        connectionError: 'Error de Conexión',
        connectionErrorDescription: 'Verifica tu conexión a internet e intenta nuevamente.'
      },
      success: {
        title: '¡Equipo Registrado Exitosamente!',
        registeredIn: 'registrados en'
      },
      registering: 'Registrando Equipo...',
      registerTeam: 'Registrar Equipo',
      playerSelector: {
        selected: 'Seleccionado',
        searchPlaceholder: 'Buscar jugador...',
        noPlayersFound: 'No se encontraron jugadores',
        tryDifferentSearch: 'Intenta con otro término de búsqueda'
      },
      timeSlotSelector: {
        label: 'Horario No Disponible *',
        selectPlaceholder: 'Seleccionar horario...',
        slotsAvailable: 'cupos disponibles',
        occupied: 'ocupado',
        full: 'COMPLETO',
        scheduleInfo: 'Información del Horario',
        availableSlots: 'Cupos disponibles',
        occupation: 'Ocupación',
        totalCapacity: 'Capacidad total',
        teams: 'equipos'
      },
      teamSummary: {
        title: 'Equipo Seleccionado',
        complete: 'Completo',
        players: 'Jugadores',
        player1: 'Jugador 1',
        player2: 'Jugador 2',
        schedule: 'Horario',
        availableSlots: 'Cupos disponibles',
        occupation: 'Ocupación',
        totalCapacity: 'Capacidad total',
        teams: 'equipos'
      },
      formStatus: {
        title: 'Estado del Formulario',
        completedCount: 'completados',
        firstPlayer: 'Primer Jugador',
        secondPlayer: 'Segundo Jugador',
        schedule: 'Horario',
        error: 'Error',
        completed: 'Completado',
        pending: 'Pendiente',
        fixErrors: 'Corrige los errores antes de continuar',
        readyToSubmit: 'Formulario completo y listo para enviar'
      },
      shirtSizesSelector: {
        title: 'Seleccionar Talles de Remera',
        description: 'Selecciona entre 1 y 2 talles para el equipo. Puedes elegir el mismo talle para ambos jugadores.',
        selected: 'Seleccionados',
        note: 'Nota',
        noteDescription: 'Si seleccionas el mismo talle dos veces (ej: M, M), ambos jugadores recibirán el mismo talle de remera.'
      }
    },
    // Create Tournament
    create: {
      title: 'Crear Nuevo Torneo',
      description: 'Configure los detalles de su nuevo torneo',
      loadingCategories: 'Cargando categorías...',
      stepProgress: 'Paso {step} de 2',
      progressPercentage: '{percentage}%',
      basicInfo: {
        title: 'Información Básica del Torneo',
        name: {
          label: 'Nombre del Torneo',
          tooltip: 'Nombre identificativo del torneo',
          placeholder: 'Ej: Torneo de Verano 2024'
        },
        categories: {
          label: 'Categorías',
          tooltip: 'Selecciona las categorías que participarán en el torneo'
        },
        shirts: {
          label: 'Remeras para Participantes',
          tooltip: 'Marca esta opción si el torneo incluye remeras para los participantes. Los jugadores deberán seleccionar sus talles al inscribirse.',
          switchLabel: 'Incluir remeras para participantes',
          description: 'Los jugadores seleccionarán sus talles al inscribirse',
          sizesInfo: 'Talles disponibles: XS, S, M, L, XL, XXL'
        },
        sponsors: {
          label: 'Patrocinadores',
          tooltip: 'Selecciona los patrocinadores que participarán en el torneo',
          loading: 'Cargando patrocinadores...',
          error: 'Error al cargar sponsors: {error}',
          noSponsors: 'No hay sponsors disponibles. Puedes crear sponsors desde la sección "Patrocinadores".',
          sponsorLabel: 'Patrocinador',
          seeMore: 'Ver más ({count} más)',
          seeLess: 'Ver menos',
          selected: '{count} sponsor seleccionado',
          selectedPlural: '{count} sponsors seleccionados'
        },
        dates: {
          startDate: {
            label: 'Fecha de Inicio',
            tooltip: 'Fecha de inicio del torneo',
            placeholder: 'Selecciona fecha de inicio'
          },
          endDate: {
            label: 'Fecha de Fin',
            tooltip: 'Fecha de finalización del torneo. La fecha verde es la recomendada (exactamente 3 días: inicio, día 2, día 3), las rojas están restringidas (muy cortas o muy largas).',
            placeholder: 'Selecciona fecha de fin'
          }
        },
        courts: {
          label: 'Canchas Disponibles',
          tooltip: 'Número de canchas disponibles para el torneo',
          placeholder: 'Selecciona las canchas',
          single: 'cancha',
          plural: 'canchas'
        },
        tournamentType: {
          label: 'Tipo de Torneo',
          tooltip: 'Formato del torneo',
          placeholder: 'Selecciona el tipo',
          sixPlayers: '6 Jugadores',
          ninePlayers: '9 Jugadores',
          twelvePlayers: '12 Jugadores',
          sixteenPlayers: '16 Jugadores'
        },
        image: {
          label: 'Imagen del Torneo',
          tooltip: 'Imagen representativa del torneo'
        },
        continue: 'Continuar'
      },
      detailInfo: {
        title: 'Información Detallada del Torneo',
        description: {
          label: 'Descripción',
          tooltip: 'Descripción general del torneo',
          placeholder: 'Describe los detalles importantes del torneo...'
        },
        rules: {
          label: 'Reglas del Torneo',
          tooltip: 'Reglas y normativas específicas',
          placeholder: 'Especifica las reglas y normativas del torneo...'
        },
        location: {
          title: 'Ubicación del Torneo',
          placeName: {
            label: 'Nombre del Lugar',
            placeholder: 'Ej: Club Deportivo Central'
          },
          address: {
            label: 'Dirección',
            placeholder: 'Ej: Av. Principal 123, Ciudad'
          },
          clubName: {
            label: 'Nombre del Club',
            placeholder: 'Ej: Recrea Padel Club'
          },
          signupLimit: {
            label: 'Fecha Límite de Inscripción',
            placeholder: 'Selecciona fecha límite'
          }
        },
        prizes: {
          title: 'Premios del Torneo',
          firstPlace: {
            label: 'Primer Lugar',
            placeholder: 'Ej: Trofeo + $50,000'
          },
          secondPlace: {
            label: 'Segundo Lugar',
            placeholder: 'Ej: Medalla + $30,000'
          },
          thirdPlace: {
            label: 'Tercer Lugar',
            placeholder: 'Ej: Medalla + $20,000'
          }
        },
        sponsors: {
          title: 'Patrocinadores'
        },
        inscriptionCost: {
          label: 'Costo de Inscripción',
          tooltip: 'Costo por equipo para participar en el torneo'
        },
        back: 'Atrás',
        create: 'Crear Torneo',
        creating: 'Creando...'
      },
      validation: {
        nameRequired: 'El nombre del torneo es requerido',
        categoriesRequired: 'Debes seleccionar al menos una categoría',
        startDateRequired: 'La fecha de inicio es requerida',
        endDateRequired: 'La fecha de fin es requerida',
        endDateAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio',
        courtsRequired: 'Debe haber al menos una cancha disponible',
        imageRequired: 'La imagen del torneo es requerida',
        descriptionRequired: 'La descripción es requerida',
        rulesRequired: 'Las reglas del torneo son requeridas',
        locationRequired: 'La ubicación del torneo es requerida',
        addressRequired: 'La dirección del torneo es requerida',
        clubNameRequired: 'El nombre del club es requerido',
        signupLimitRequired: 'La fecha límite de inscripción es requerida',
        costNegative: 'El costo de inscripción no puede ser negativo',
        firstPlaceRequired: 'El premio para el primer lugar es requerido',
        secondPlaceRequired: 'El premio para el segundo lugar es requerido',
        thirdPlaceRequired: 'El premio para el tercer lugar es requerido'
      },
      success: {
        title: '¡Éxito!',
        description: 'Se han creado {count} torneo(s) correctamente'
      },
      error: {
        title: 'Error',
        uploadImage: 'Error al subir la imagen',
        createTournament: 'Error al crear el torneo',
        notAuthenticated: 'No estás autenticado'
      }
    }
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
      noMatchesScheduled: 'No matches scheduled yet!',
      noMatchesScheduledDescription: 'Tournament matches will appear here when they are scheduled. Stay tuned for upcoming competitions!',
      noMatchesForAllCategories: 'Tournament matches will appear here when they are scheduled. Stay tuned for upcoming competitions!',
      noMatchesForCategory: 'No matches scheduled for the {category} category. Check other categories or wait for more matches to be scheduled!',
      noMatchesForNow: 'No matches for now.',
      noLeaguesAvailable: 'No leagues available at the moment.',
      noPositionsAvailable: 'No positions available at the moment.',
      errorLoadingPositions: 'Error loading positions',
      selectTournament: 'Select a tournament!',
      selectTournamentDescription: 'Choose a tournament from the dropdown menu to see its standings and statistics.',
      positionsComingSoon: 'Positions coming soon',
      positionsComingSoonDescription: 'Positions will appear here when tournament matches are generated.',
      noTournaments: 'No tournaments available',
      noTournamentsDescription: 'No tournaments are available at this time. Tournaments will appear here when they are created.',
      noTournamentsForCategory: 'No tournaments in this category',
      noTournamentsForCategoryDescription: 'No tournaments available for the selected category.'
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
  },
  // Tournaments
  tournaments: {
    title: 'Tournaments',
    description: 'Manage and view all tournaments in the system.',
    createTournament: 'Create Tournament',
    createFirstTournament: 'Create First Tournament',
    // Estados de torneos
    statusUpcoming: 'Registrations Open',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusCompletedPlural: 'Completed',
    // Estadísticas
    totalTournaments: 'Total Tournaments',
    totalTeams: 'Total Teams',
    revenue: 'Revenue',
    inProgress: 'In Progress',
    // Filtros
    searchPlaceholder: 'Search by name or category...',
    allCategories: 'All categories',
    allStatuses: 'All',
    dateFilter: 'Date Filter',
    clearFilters: 'Clear Filters',
    viewAllTournaments: 'View All Tournaments',
    // Torneo específico
    registrations: 'Registrations',
    complete: 'Complete!',
    teams: 'Teams',
    startDate: 'Start',
    endDate: 'End',
    sponsors: 'Sponsors',
    noSponsors: 'No sponsors',
    // Tipos de torneo
    nineTeams: '9 Teams',
    twelveTeams: '12 Teams',
    sixteenTeams: '16 Teams',
    // Empty states
    noTournamentsFound: 'No tournaments found',
    startFirstTournament: 'Start your first tournament!',
    noTournamentsFoundDescription: 'No tournaments match the selected filters. Try adjusting your search.',
    startFirstTournamentDescription: 'Create your first tournament and start organizing amazing padel competitions.',
    // Botones de acción
    retry: 'Retry',
    // Calendar Filter
    quickFilters: 'Quick Filters',
    customRange: 'Custom Range',
    selectDates: 'Select dates',
    selectEnd: 'Select end',
    thisMonth: 'This Month',
    nextMonth: 'Next Month',
    thisYear: 'This Year',
    upcoming: 'Upcoming',
    clear: 'Clear',
    daysSelected: 'days selected',
    showingTournaments: 'Showing tournaments from',
    to: 'to',
    activeFilter: 'Active filter:',
    // Tournament Detail Page
    detail: {
      errorLoading: 'Error loading tournament',
      retry: 'Retry',
      backToTournaments: 'Back to Tournaments',
      tournamentNotFound: 'The requested tournament was not found.',
      registrationProgress: 'Registration Progress',
      registrationsComplete: 'Registrations complete!',
      tournamentStats: 'Tournament Statistics',
      navigation: {
        calendar: 'Calendar',
        calendarDescription: 'Schedule matches and manage schedules',
        teams: 'Teams',
        teamsDescription: 'View registered teams and payments',
        groups: 'Groups',
        groupsDescription: 'Generate and manage groups',
        matches: 'Matches',
        matchesDescription: 'Manage matches and results',
        standings: 'Standings',
        standingsDescription: 'View positions and statistics',
        bracket: 'Eliminations',
        bracketDescription: 'Elimination bracket',
        payments: 'Payments',
        paymentsDescription: 'Manage payments and registrations'
      },
      info: {
        description: 'Description',
        noDescription: 'No description',
        location: 'Location',
        inscriptionCost: 'Registration Cost',
        rules: 'Rules',
        prizes: 'Prizes'
      },
      stats: {
        potentialRevenue: 'Potential Revenue',
        actualRevenue: 'Actual Revenue',
        pendingRevenue: 'Pending Revenue',
        paymentRate: 'Payment Rate',
        perTeam: 'per team',
        paidTeams: 'paid teams',
        pendingTeams: 'pending teams',
        registeredTeams: 'Registered Teams',
        scheduledMatches: 'Scheduled Matches',
        groupsGenerated: 'Groups Generated',
        totalRevenue: 'Total Revenue',
        // Tournament Stats Component
        fullCapacity: 'Full capacity',
        teamsRemaining: '{count} teams remaining',
        paidTeamsTitle: 'Paid Teams',
        ofTotal: 'of total',
        noTeams: 'No teams',
        pending: 'Pending',
        toPay: 'to pay',
        revenue: 'Revenue',
        collected: 'collected'
      }
    },
    // Teams Page
    teamsPage: {
      errorLoading: 'Error loading teams',
      backToTournament: 'Back to tournament',
      title: 'Teams',
      description: 'List of teams registered in the tournament',
      registerTeam: 'Register Team',
      registeredTeams: 'Registered Teams',
      noTeamsRegistered: 'No teams registered',
      noTeamsDescription: 'This tournament does not have any registered teams yet. Teams will appear here once they register.',
      // Stats translations
      fullCapacity: 'Full capacity',
      teamsRemaining: '{count} teams remaining',
      paidTeamsTitle: 'Paid Teams',
      ofTotal: 'of total',
      noTeams: 'No teams',
      pending: 'Pending',
      toPay: 'to pay',
      revenue: 'Revenue',
      collected: 'collected',
      // Team Card translations
      team: 'Team',
      players: 'Players',
      player1: 'Player 1',
      player2: 'Player 2',
      shirtSizes: 'Shirt Sizes',
      oneSizeSelected: 'One size selected',
      multipleSizesSelected: '{count} sizes selected',
      unknownTeam: 'Unknown team',
      noRestrictions: 'No restrictions',
      paymentStatus: {
        paid: 'Paid',
        pending: 'Pending',
        failed: 'Failed'
      },
      timeSlots: {
        day1Morning: 'Day 1 - Morning',
        day1Afternoon: 'Day 1 - Afternoon',
        day1Evening: 'Day 1 - Evening',
        day1Night: 'Day 1 - Night',
        day2Morning: 'Day 2 - Morning',
        day2Afternoon: 'Day 2 - Afternoon',
        day2Evening: 'Day 2 - Evening',
        day2Night: 'Day 2 - Night',
        day3Morning: 'Day 3 - Morning',
        day3Afternoon: 'Day 3 - Afternoon',
        day3Evening: 'Day 3 - Evening',
        day3Night: 'Day 3 - Night',
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        night: 'Night'
      }
    },
    // Admin Register Team Page
    adminRegister: {
      backToTeams: 'Back to teams',
      title: 'Register Team',
      description: 'Register a team in the tournament from the administration panel',
      formTitle: 'Registration Form',
      placeholders: {
        selectFirstPlayer: 'Select first player...',
        selectSecondPlayer: 'Select second player...'
      },
      validation: {
        player1Required: 'Must select the first player',
        player2Required: 'Must select the second player',
        playersMustBeDifferent: 'The two players must be different',
        slotRequired: 'Must select a schedule',
        slotFull: 'This schedule is full',
        shirtSizesRequired: 'Must select at least one shirt size',
        shirtSizesMax: 'Cannot select more than 2 sizes'
      },
      errors: {
        title: 'Error',
        loadPlayers: 'Error loading available players',
        loadPlayersDescription: 'Error loading the list of available players',
        loadSlots: 'Error loading available slots',
        loadSlotsDescription: 'Error loading available schedules',
        registrationError: 'Registration Error',
        playersAlreadyRegistered: 'One or both players are already registered in this tournament',
        tournamentFull: 'Tournament Full',
        tournamentFullDescription: 'The tournament is full or the selected schedule has no available spots',
        invalidPlayers: 'Invalid Players',
        validationError: 'Validation Error',
        validationErrorDescription: 'Error in the data sent',
        tournamentNotFound: 'Tournament Not Found',
        tournamentNotFoundDescription: 'The requested tournament does not exist',
        serverError: 'Server Error',
        serverErrorDescription: 'Internal server error. Please try again.',
        registerTeamError: 'Error registering team',
        connectionError: 'Connection Error',
        connectionErrorDescription: 'Check your internet connection and try again.'
      },
      success: {
        title: 'Team Registered Successfully!',
        registeredIn: 'registered in'
      },
      registering: 'Registering Team...',
      registerTeam: 'Register Team',
      playerSelector: {
        selected: 'Selected',
        searchPlaceholder: 'Search player...',
        noPlayersFound: 'No players found',
        tryDifferentSearch: 'Try with a different search term'
      },
      timeSlotSelector: {
        label: 'Unavailable Schedule *',
        selectPlaceholder: 'Select schedule...',
        slotsAvailable: 'slots available',
        occupied: 'occupied',
        full: 'FULL',
        scheduleInfo: 'Schedule Information',
        availableSlots: 'Available slots',
        occupation: 'Occupation',
        totalCapacity: 'Total capacity',
        teams: 'teams'
      },
      teamSummary: {
        title: 'Selected Team',
        complete: 'Complete',
        players: 'Players',
        player1: 'Player 1',
        player2: 'Player 2',
        schedule: 'Schedule',
        availableSlots: 'Available slots',
        occupation: 'Occupation',
        totalCapacity: 'Total capacity',
        teams: 'teams'
      },
      formStatus: {
        title: 'Form Status',
        completedCount: 'completed',
        firstPlayer: 'First Player',
        secondPlayer: 'Second Player',
        schedule: 'Schedule',
        error: 'Error',
        completed: 'Completed',
        pending: 'Pending',
        fixErrors: 'Fix errors before continuing',
        readyToSubmit: 'Form complete and ready to submit'
      },
      shirtSizesSelector: {
        title: 'Select Shirt Sizes',
        description: 'Select between 1 and 2 sizes for the team. You can choose the same size for both players.',
        selected: 'Selected',
        note: 'Note',
        noteDescription: 'If you select the same size twice (e.g., M, M), both players will receive the same shirt size.'
      }
    },
    // Create Tournament
    create: {
      title: 'Create New Tournament',
      description: 'Configure the details of your new tournament',
      loadingCategories: 'Loading categories...',
      stepProgress: 'Step {step} of 2',
      progressPercentage: '{percentage}%',
      basicInfo: {
        title: 'Basic Tournament Information',
        name: {
          label: 'Tournament Name',
          tooltip: 'Identifying name of the tournament',
          placeholder: 'E.g: Summer Tournament 2024'
        },
        categories: {
          label: 'Categories',
          tooltip: 'Select the categories that will participate in the tournament'
        },
        shirts: {
          label: 'Shirts for Participants',
          tooltip: 'Check this option if the tournament includes shirts for participants. Players will need to select their sizes when registering.',
          switchLabel: 'Include shirts for participants',
          description: 'Players will select their sizes when registering',
          sizesInfo: 'Available sizes: XS, S, M, L, XL, XXL'
        },
        sponsors: {
          label: 'Sponsors',
          tooltip: 'Select the sponsors that will participate in the tournament',
          loading: 'Loading sponsors...',
          error: 'Error loading sponsors: {error}',
          noSponsors: 'No sponsors available. You can create sponsors from the "Sponsors" section.',
          sponsorLabel: 'Sponsor',
          seeMore: 'See more ({count} more)',
          seeLess: 'See less',
          selected: '{count} sponsor selected',
          selectedPlural: '{count} sponsors selected'
        },
        dates: {
          startDate: {
            label: 'Start Date',
            tooltip: 'Tournament start date',
            placeholder: 'Select start date'
          },
          endDate: {
            label: 'End Date',
            tooltip: 'Tournament end date. The green date is recommended (exactly 3 days: start, day 2, day 3), red ones are restricted (too short or too long).',
            placeholder: 'Select end date'
          }
        },
        courts: {
          label: 'Available Courts',
          tooltip: 'Number of courts available for the tournament',
          placeholder: 'Select courts',
          single: 'court',
          plural: 'courts'
        },
        tournamentType: {
          label: 'Tournament Type',
          tooltip: 'Tournament format',
          placeholder: 'Select type',
          sixPlayers: '6 Players',
          ninePlayers: '9 Players',
          twelvePlayers: '12 Players',
          sixteenPlayers: '16 Players'
        },
        image: {
          label: 'Tournament Image',
          tooltip: 'Representative image of the tournament'
        },
        continue: 'Continue'
      },
      detailInfo: {
        title: 'Detailed Tournament Information',
        description: {
          label: 'Description',
          tooltip: 'General tournament description',
          placeholder: 'Describe the important details of the tournament...'
        },
        rules: {
          label: 'Tournament Rules',
          tooltip: 'Specific rules and regulations',
          placeholder: 'Specify the rules and regulations of the tournament...'
        },
        location: {
          title: 'Tournament Location',
          placeName: {
            label: 'Place Name',
            placeholder: 'E.g: Central Sports Club'
          },
          address: {
            label: 'Address',
            placeholder: 'E.g: Main Ave 123, City'
          },
          clubName: {
            label: 'Club Name',
            placeholder: 'E.g: Recrea Padel Club'
          },
          signupLimit: {
            label: 'Registration Deadline',
            placeholder: 'Select deadline'
          }
        },
        prizes: {
          title: 'Tournament Prizes',
          firstPlace: {
            label: 'First Place',
            placeholder: 'E.g: Trophy + $50,000'
          },
          secondPlace: {
            label: 'Second Place',
            placeholder: 'E.g: Medal + $30,000'
          },
          thirdPlace: {
            label: 'Third Place',
            placeholder: 'E.g: Medal + $20,000'
          }
        },
        sponsors: {
          title: 'Sponsors'
        },
        inscriptionCost: {
          label: 'Registration Cost',
          tooltip: 'Cost per team to participate in the tournament'
        },
        back: 'Back',
        create: 'Create Tournament',
        creating: 'Creating...'
      },
      validation: {
        nameRequired: 'Tournament name is required',
        categoriesRequired: 'You must select at least one category',
        startDateRequired: 'Start date is required',
        endDateRequired: 'End date is required',
        endDateAfterStart: 'End date must be after start date',
        courtsRequired: 'There must be at least one court available',
        imageRequired: 'Tournament image is required',
        descriptionRequired: 'Description is required',
        rulesRequired: 'Tournament rules are required',
        locationRequired: 'Tournament location is required',
        addressRequired: 'Tournament address is required',
        clubNameRequired: 'Club name is required',
        signupLimitRequired: 'Registration deadline is required',
        costNegative: 'Registration cost cannot be negative',
        firstPlaceRequired: 'First place prize is required',
        secondPlaceRequired: 'Second place prize is required',
        thirdPlaceRequired: 'Third place prize is required'
      },
      success: {
        title: 'Success!',
        description: '{count} tournament(s) created successfully'
      },
      error: {
        title: 'Error',
        uploadImage: 'Error uploading image',
        createTournament: 'Error creating tournament',
        notAuthenticated: 'You are not authenticated'
      }
    }
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