'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Tipos
export type Locale = 'es' | 'en';

// Traducciones hardcodeadas temporalmente para debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      cancel: 'Cancelar',
      update: 'Actualizar',
      saving: 'Guardando...',
      product: 'producto',
      category: 'categoría',
      item: 'elemento',
      sponsor: 'patrocinador',
      confirmDeletion: 'Confirmar Eliminación',
      deleteConfirmation: '¿Estás seguro que deseas eliminar',
      cannotUndo: 'Esta acción no se puede deshacer.',
      delete: 'Eliminar',
      size: 'Talle',
      sku: 'SKU',
      quantity: 'Cantidad',
      price: 'Precio',
      total: 'Total',
      subtotal: 'Subtotal',
      selectSize: 'Seleccionar Talle',
      selectSizeLabel: 'Selecciona un talle:',
      selectedSize: 'Talle seleccionado:',
      noSizesAvailable: 'No hay talles disponibles para este producto',
      noStockAvailable: 'No hay stock disponible',
      insufficientStock: 'Stock insuficiente',
      available: 'Disponible',
      noVenuesAvailable: 'No hay sedes disponibles',
      mustSelectVenue: 'Debes seleccionar una sede para continuar',
      error: 'Error',
      understood: 'Entendido'
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
      noTournamentsForCategoryDescription: 'No hay torneos disponibles para la categoría seleccionada.',
      // Active Tournaments Widget
      activeTournaments: 'Torneos Activos',
      activeTournamentsTitle: 'Torneos Activos ({count})',
      noActiveTournaments: 'No hay torneos activos',
      noActiveTournamentsDescription: 'Los torneos activos aparecerán aquí cuando estén en progreso.',
      viewAllTournaments: 'Ver Todos los Torneos',
      // Tournament Phases
      phaseRegistrations: 'Inscripciones',
      phaseGroups: 'Fase de Grupos',
      phaseStandings: 'Clasificaciones',
      phaseBracket: 'Bracket Eliminatorio',
      // Phase Descriptions
      teamsRegistered: '{count}/{max} equipos inscritos',
      groupsGenerated: 'Grupos generados',
      viewMatchesAndGroups: 'Ver partidos y grupos',
      viewStandingsTable: 'Ver tabla de posiciones',
      viewStandings: 'Ver clasificaciones',
      bracketGenerated: 'Bracket generado',
      viewBracket: 'Ver bracket',
      // Phase Actions
      viewPayments: 'Ver Pagos',
      viewMatches: 'Ver Partidos',
      viewStandingsButton: 'Ver Clasificaciones',
      viewBracketButton: 'Ver Bracket',
      goToTournament: 'Ir',
      teams: 'Equipos',
      progress: 'Progreso',
      phaseCompleted: 'Completado',
      phaseInProgress: 'En curso',
      phasePending: 'Pendiente',
      noCategory: 'Sin categoría',
      // Dashboard Stats
      totalUsers: 'Usuarios Totales',
      totalSponsors: 'Patrocinadores Totales',
      monthlyIncome: 'Ingresos del Mes',
      // Status and errors
      noStatus: 'Sin estado',
      noDate: 'Sin fecha',
      unknownError: 'Error desconocido',
      errorLoadingMatches: 'Error al cargar los partidos: {status} {statusText}',
      noDataReceived: 'No se recibieron datos del servidor',
      errorLoadingStandings: 'Error al cargar las posiciones: {status} {statusText}',
      // League Schedule Card
      viewAllMatches: 'Ver todos los partidos',
      notAssigned: 'Sin asignar',
      vs: 'VS',
      noMatches: 'Sin partidos programados',
      noMatchesForLeague: 'No hay partidos programados para las ligas en este momento.',
      // Empty Leagues
      noActiveLeagues: 'Sin ligas activas',
      // Category Standings
      loadingStandings: 'Cargando tabla de posiciones...',
      noDataForCategory: 'No hay datos disponibles para la categoría {category}.',
      position: 'Posición',
      team: 'Equipo',
      gamesPlayed: 'Partidos Jugados',
      gamesWon: 'Partidos Ganados',
      gamesLost: 'Partidos Perdidos',
      setsWon: 'Juegos Ganados',
      setsLost: 'Juegos Perdidos',
      gamesDifference: 'Diferencia de Juegos',
      totalPoints: 'Puntos Totales',
      teamNotAvailable: 'Equipo no disponible'
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
      venues: 'Sedes',
      viewVenues: 'Ver Sedes',
      kiosk: 'Kiosco',
      registerSale: 'Registrar Venta',
      products: 'Productos',
      sales: 'Ventas',
      reports: 'Reportes',
      categories: 'Categorías',
      courts: 'Canchas',
      professors: 'Profesores',
      sponsors: 'Patrocinadores',
      users: 'Usuarios',
      settings: 'Configuraciones',
      guide: 'Guía',
      viewTournaments: 'Ver torneos',
      createTournament: 'Crear torneo',
      viewLeagues: 'Ver ligas',
      createLeague: 'Crear liga',
      club: 'Club:',
      clubName: 'BayPadel San Francisco',
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
    kiosk: {
      title: 'Kiosco',
      description: 'Sistema de ventas y gestión de productos',
      // Dashboard Widget
      lowStock: 'Stock Bajo',
      totalSales: 'Total Ventas',
      requiresAttention: 'Requiere atención',
      thisMonth: 'este mes',
      today: 'Hoy',
      week: 'Semana',
      salesCount: 'ventas',
      vsPreviousMonth: 'vs mes anterior',
      pos: {
        title: 'Registrar Venta',
        description: 'Registra ventas y gestiona el inventario',
        searchProducts: 'Buscar productos...',
        allCategories: 'Todas las categorías',
        cart: 'Carrito',
        emptyCart: 'El carrito está vacío',
        subtotal: 'Subtotal',
        total: 'Total',
        checkout: 'Finalizar Venta',
        paymentDetails: 'Detalles de Pago',
        venue: 'Sede',
        selectVenue: 'Selecciona una sede',
        selectedVenue: 'Sede seleccionada',
        customerName: 'Nombre del Cliente',
        customerNamePlaceholder: 'Opcional',
        paymentMethod: 'Método de Pago',
        cash: 'Efectivo',
        transfer: 'Transferencia',
        card: 'Tarjeta',
        mercadopago: 'Mercado Pago',
        saleContext: 'Contexto de Venta',
        contextGeneral: 'General',
        contextTournament: 'Torneo',
        contextLeague: 'Liga',
        contextClass: 'Clase',
        contextBooking: 'Reserva',
        processing: 'Procesando...',
        confirmSale: 'Confirmar Venta',
        noStockForSize: 'No hay stock disponible para el talle {size}',
        noStockAvailable: 'No hay stock disponible',
        insufficientStockForSize: 'Stock insuficiente para el talle {size}. Disponible: {available}',
        mustSelectVenue: 'Debes seleccionar una sede para continuar',
        selectSize: 'Seleccionar Talle',
        selectSizeLabel: 'Selecciona un talle:',
        selectedSize: 'Talle seleccionado:',
        noSizesAvailable: 'No hay talles disponibles para este producto',
        noVenuesAvailable: 'No hay sedes disponibles'
      },
      categories: {
        title: 'Categorías de Productos',
        description: 'Administra las categorías de productos del kiosco',
        addCategory: 'Añadir Categoría',
        editCategory: 'Editar Categoría',
        deleteCategory: 'Eliminar Categoría',
        name: 'Nombre',
        namePlaceholder: 'Ej: Bebidas, Cervezas',
        descriptionLabel: 'Descripción',
        descriptionPlaceholder: 'Descripción de la categoría',
        icon: 'Icono',
        color: 'Color',
        sortOrder: 'Orden',
        isActive: 'Activa',
        noCategories: 'No hay categorías',
        noCategoriesDescription: 'Crea tu primera categoría para organizar los productos',
        addCategoryDescription: 'Crea una nueva categoría para organizar tus productos',
        editCategoryDescription: 'Edita los detalles de la categoría',
        deleteConfirmation: '¿Estás seguro de eliminar la categoría "{name}"?'
      },
      products: {
        title: 'Productos',
        description: 'Administra los productos del kiosco',
        addProduct: 'Añadir Producto',
        editProduct: 'Editar Producto',
        deleteProduct: 'Eliminar Producto',
        name: 'Nombre',
        namePlaceholder: 'Nombre del producto',
        category: 'Categoría',
        selectCategory: 'Selecciona una categoría',
        descriptionLabel: 'Descripción',
        descriptionPlaceholder: 'Descripción del producto',
        sku: 'SKU',
        skuPlaceholder: 'Código del producto',
        barcode: 'Código de Barras',
        barcodePlaceholder: 'Código de barras',
        price: 'Precio',
        costPrice: 'Precio de Costo',
        stockQuantity: 'Cantidad en Stock',
        minStockAlert: 'Alerta de Stock Mínimo',
        trackInventory: 'Rastrear Inventario',
        image: 'Imagen',
        noImage: 'Sin imagen',
        selectImage: 'Seleccionar Imagen',
        changeImage: 'Cambiar Imagen',
        venue: 'Sede',
        selectVenue: 'Selecciona una sede',
        selectedVenue: 'Sede seleccionada',
        mustSelectVenue: 'Debes seleccionar una sede para ver los productos',
        selectVenueFirst: 'Selecciona una sede primero',
        selectVenueFirstDescription: 'Debes seleccionar una sede para poder ver y gestionar productos',
        venueRequired: 'La sede es requerida',
        allVenues: 'Todas las sedes',
        isFeatured: 'Destacado',
        isActive: 'Activo',
        isInactive: 'Inactivo',
        searchPlaceholder: 'Buscar productos...',
        allCategories: 'Todas las categorías',
        all: 'Todas',
        lowStock: 'Stock Bajo',
        noProducts: 'No hay productos',
        noProductsDescription: 'Crea tu primer producto para comenzar a vender',
        addProductDescription: 'Crea un nuevo producto para el kiosco',
        editProductDescription: 'Edita los detalles del producto',
        deleteConfirmation: '¿Estás seguro de eliminar el producto "{name}"?',
        pagination: {
          previous: 'Anterior',
          next: 'Siguiente'
        }
      },
      sales: {
        title: 'Ventas',
        description: 'Historial de ventas realizadas',
        saleNumber: 'N° Venta',
        product: 'Producto',
        date: 'Fecha',
        customer: 'Cliente',
        venue: 'Sede',
        selectedVenue: 'Sede seleccionada',
        paymentMethod: 'Método de Pago',
        status: 'Estado',
        total: 'Total',
        actions: 'Acciones',
        view: 'Ver',
        saleDetails: 'Detalle de Venta',
        items: 'Items',
        searchPlaceholder: 'Buscar ventas...',
        allVenues: 'Todas las sedes',
        allPaymentMethods: 'Todos los métodos',
        allStatus: 'Todos los estados',
        noSales: 'No hay ventas',
        noSalesDescription: 'Las ventas aparecerán aquí cuando se registren',
        size: 'Talle',
        sku: 'SKU',
        paymentMethods: {
          cash: 'Efectivo',
          transfer: 'Transferencia',
          card: 'Tarjeta',
          mercadopago: 'Mercado Pago',
          pending: 'Pendiente'
        },
        paymentStatus: {
          pending: 'Pendiente',
          completed: 'Completado',
          refunded: 'Reembolsado',
          cancelled: 'Cancelado'
        },
        showing: 'Mostrando',
        to: 'a',
        of: 'de',
        sales: 'ventas'
      },
      reports: {
        title: 'Reportes',
        description: 'Análisis de ventas y productos',
        venue: 'Sede',
        allVenues: 'Todas las sedes',
        selectedVenue: 'Sede seleccionada',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        generate: 'Generar Reporte',
        totalRevenue: 'Ingresos Totales',
        averageTicket: 'Ticket Promedio',
        totalSales: 'Total Ventas',
        sales: 'ventas',
        perSale: 'por venta',
        completedSales: 'ventas completadas',
        topProducts: 'Productos Más Vendidos',
        topProductsDescription: 'Los productos con mayor cantidad de ventas en el período seleccionado',
        unitsSold: 'unidades vendidas',
        revenue: 'Ingresos',
        noData: 'Sin datos',
        noDataDescription: 'Selecciona un período y genera un reporte para ver los datos',
        loading: 'Cargando...',
        dashboard: {
          title: 'Dashboard de Ventas',
          salesToday: 'Ventas Hoy',
          thisWeek: 'Esta Semana',
          thisMonth: 'Este Mes',
          averageTicket: 'Ticket Promedio',
          transactions: 'transacciones',
          averageTicketLabel: 'Ticket promedio',
          monthlyAverage: 'Promedio mensual',
          vsPreviousMonth: 'vs mes anterior',
          paymentMethods: 'Métodos de Pago (Este Mes)',
          cash: 'Efectivo',
          transfer: 'Transferencia',
          card: 'Tarjeta',
          mercadopago: 'Mercadopago'
        },
        stockAlerts: {
          title: 'Alertas de Stock',
          outOfStock: 'sin stock',
          lowStock: 'con stock bajo',
          outOfStockTitle: 'Sin Stock',
          lowStockTitle: 'Stock Bajo',
          units: 'unidades',
          minimum: 'Mínimo',
          noAlerts: 'Stock Saludable',
          noAlertsDescription: 'Todos los productos tienen stock suficiente'
        },
        periodReports: {
          title: 'Reportes por Período'
        },
        charts: {
          title: 'Gráficas de Ventas',
          trendTitle: 'Tendencia de Ventas',
          period: 'Período',
          days: 'días',
          totalPeriod: 'Total período',
          transactions: 'Transacciones',
          averagePerDay: 'Promedio/día',
          dailyRevenue: 'Ingresos Diarios',
          movingAverage: 'Promedio Móvil (7 días)',
          noData: 'Sin datos de tendencia',
          noDataDescription: 'Los gráficos aparecerán aquí cuando haya datos de ventas',
          loading: 'Cargando datos...'
        }
      },
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        update: 'Actualizar',
        saving: 'Guardando...',
        loading: 'Cargando...'
      }
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
    guide: {
      title: 'Guía del Sistema',
      subtitle: 'Aprende a utilizar todas las funcionalidades del panel de administración',
      prerequisites: {
        title: 'Requisitos Previos',
        description: 'Antes de crear ligas o torneos, asegúrate de tener configurado lo siguiente:',
        venues: {
          title: 'Sedes',
          description: 'Debes tener al menos una sede creada. Las sedes son los lugares físicos donde se juegan los partidos.'
        },
        courts: {
          title: 'Canchas',
          description: 'Cada sede debe tener al menos una cancha asignada. Las canchas son los espacios donde se juegan los partidos.'
        },
        categories: {
          title: 'Categorías',
          description: 'Necesitas tener categorías creadas para organizar los equipos por nivel o tipo de competencia.'
        },
        users: {
          title: 'Usuarios',
          description: 'Los usuarios deben estar registrados en el sistema para poder inscribirse en ligas o torneos.'
        }
      },
      createLeague: {
        title: 'Cómo Crear una Liga',
        description: 'Sigue estos pasos para crear una liga exitosamente',
        step1: {
          title: 'Información Básica',
          name: 'Nombre: Asigna un nombre descriptivo a tu liga',
          categories: 'Categorías: Selecciona una o más categorías para la liga',
          description: 'Descripción: Agrega una descripción detallada (opcional)',
          image: 'Imagen: Sube una imagen representativa (opcional)',
          cost: 'Costo de Inscripción: Define el precio para participar',
          teams: 'Número de Equipos: Establece cuántos equipos pueden inscribirse por categoría'
        },
        step2: {
          title: 'Configuración de Fechas y Frecuencia',
          startDate: 'Fecha de Inicio: Selecciona cuándo comenzará la liga',
          endDate: 'Fecha de Fin: Define cuándo finalizará la liga',
          frequency: 'Frecuencia: Elige entre Semanal, Quincenal o Mensual',
          playDay: 'Día de Juego por Categoría: Asigna un día específico para cada categoría (Lunes, Martes, etc.)'
        },
        step3: {
          title: 'Sedes y Canchas',
          selectVenues: 'Seleccionar Sedes: Elige una o más sedes donde se jugará la liga',
          selectCourts: 'Seleccionar Canchas: Para cada sede, selecciona las canchas disponibles',
          primaryVenue: 'Sede Primaria: Marca una sede como primaria (opcional)'
        },
        step4: {
          title: 'Horarios y Configuración Avanzada',
          matchTimes: 'Horarios de Partidos: Define los horarios específicos (ej: 22:30, 23:15)',
          courtsPerTime: 'Canchas por Horario: Indica cuántas canchas se usarán simultáneamente',
          leagueType: 'Tipo de Liga: Elige Round Robin, Eliminación, Grupos o Personalizado',
          rounds: 'Vueltas: 1 vuelta (solo ida) o 2 vueltas (ida y vuelta)'
        },
        tip: '💡 Tip: Una vez creada la liga, los equipos podrán inscribirse. Después de las inscripciones, podrás generar los partidos automáticamente desde la página de detalles de la liga.'
      },
      createTournament: {
        title: 'Cómo Crear un Torneo',
        description: 'Guía paso a paso para crear un torneo',
        step1: {
          title: 'Información Básica',
          description: 'Define el nombre, categorías, fechas, descripción e imagen del torneo.'
        },
        step2: {
          title: 'Configuración',
          description: 'Establece el número de participantes, formato de competencia y reglas especiales.'
        },
        step3: {
          title: 'Sedes y Canchas',
          description: 'Selecciona las sedes y canchas donde se realizará el torneo.'
        },
        step4: {
          title: 'Patrocinadores',
          description: 'Asocia patrocinadores al torneo (opcional).'
        }
      },
      resources: {
        title: 'Gestión de Recursos',
        description: 'Aprende a gestionar sedes, canchas, categorías y más',
        venues: {
          title: 'Sedes',
          description: 'Las sedes son los lugares físicos donde se realizan las competencias. Cada sede puede tener múltiples canchas.',
          contact: 'Agrega información de contacto (dirección, teléfono, email)',
          default: 'Marca una sede como predeterminada',
          status: 'Gestiona el estado activo/inactivo'
        },
        courts: {
          title: 'Canchas',
          description: 'Las canchas son los espacios específicos dentro de una sede donde se juegan los partidos.',
          assign: 'Asigna cada cancha a una sede específica',
          photo: 'Sube una foto de la cancha para identificación visual',
          status: 'Gestiona el estado activo/inactivo'
        },
        categories: {
          title: 'Categorías',
          description: 'Las categorías organizan los equipos por nivel, edad o tipo de competencia.',
          define: 'Define el nombre y descripción de cada categoría',
          associate: 'Asocia categorías a ligas y torneos',
          manage: 'Gestiona múltiples categorías simultáneamente'
        },
        users: {
          title: 'Usuarios',
          description: 'Gestiona los usuarios del sistema, incluyendo jugadores y administradores.',
          view: 'Visualiza y gestiona todos los usuarios registrados',
          roles: 'Asigna roles (Jugador, Administrador)',
          status: 'Gestiona el estado activo/inactivo de usuarios'
        }
      },
      tips: {
        title: '💡 Tips y Mejores Prácticas',
        planning: {
          title: 'Planificación Anticipada',
          description: 'Crea las sedes, canchas y categorías antes de crear ligas o torneos para tener todo listo.'
        },
        schedules: {
          title: 'Horarios Equitativos',
          description: 'El sistema distribuye automáticamente los horarios de manera equitativa entre todos los equipos.'
        },
        verification: {
          title: 'Verificación de Datos',
          description: 'Revisa siempre la información antes de crear ligas o torneos para evitar errores.'
        }
      }
    },
    settings: {
      title: 'Configuraciones',
      description: 'Administra las configuraciones de la aplicación.',
      tabs: {
        profile: 'Perfil',
        integrations: 'Integraciones',
        subscription: 'Suscripción',
        password: 'Contraseña'
      },
      profile: {
        title: 'Perfil',
        personalInfo: 'Información personal',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Email',
        tokenNotFound: 'No se encontró token',
        errorLoadingProfile: 'Error al cargar el perfil',
        error: 'Error'
      },
      integrations: {
        title: 'Integraciones',
        description: 'Conecta tus aplicaciones y servicios favoritos',
        whatsappDescription: 'Conecta con tu cuenta de WhatsApp Business',
        configured: 'Configurado',
        connect: 'Conectar',
        configuredNumber: 'Número configurado:',
        edit: 'Editar',
        whatsappConfigured: 'WhatsApp configurado',
        whatsappUpdated: 'El número de WhatsApp Business se ha actualizado correctamente.',
        error: 'Error',
        errorSavingWhatsapp: 'Error al guardar el número de WhatsApp',
        noAuthToken: 'No hay token de autenticación',
        errorSavingNumber: 'Error al guardar el número'
      },
      subscription: {
        title: 'Suscripción',
        membershipStatus: 'Estado de tu membresía',
        active: 'Activa',
        annualContract: 'Contrato Anual',
        annualContractDescription: 'Tu suscripción tiene un compromiso mínimo de 12 meses. Este período garantiza la continuidad del servicio y el acceso a todas las funcionalidades de la plataforma.',
        premiumPlan: 'Plan Premium',
        perMonth: 'por mes',
        billing: 'Facturación',
        monthly: 'Mensual',
        autoCharge: 'Cargo automático',
        includedFeatures: 'Características incluidas',
        fullPlatformAccess: 'Acceso completo a la plataforma',
        prioritySupport: 'Soporte prioritario 24/7',
        autoBackup: 'Backup automático',
        premiumUpdates: 'Actualizaciones premium'
      }
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
    editCourtDescription: 'Modifica el nombre, la sede y la foto de la cancha',
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
  // Venues
    categories: {
      title: 'Categorías',
      description: 'Administra las categorías de los torneos.',
      addCategory: 'Añadir Categoría',
      editCategory: 'Editar Categoría',
      addNewCategory: 'Añadir Nueva Categoría',
      categoryName: 'Nombre de la Categoría',
      categoryNamePlaceholder: 'Ingresa el nombre de la categoría',
      saving: 'Guardando...',
      update: 'Actualizar'
    },
    venues: {
      title: 'Gestión de Sedes y Canchas',
      description: 'Administra las sedes del club y sus canchas.',
    venues: 'Sedes',
    courts: 'Canchas',
    newVenue: 'Nueva Sede',
    editVenue: 'Editar Sede',
    addCourt: 'Añadir Cancha',
    loadingVenues: 'Cargando sedes...',
    loadingCourts: 'Cargando canchas...',
    // Form fields
    venueName: 'Nombre de la Sede',
    venueNamePlaceholder: 'Ej: Sede Centro',
    address: 'Dirección',
    addressPlaceholder: 'Av. Principal 1234',
    country: 'País',
    countryPlaceholder: 'Selecciona un país',
    state: 'Estado/Departamento',
    statePlaceholder: 'Selecciona un estado',
    stateManualPlaceholder: 'Ingresa el estado/departamento',
    city: 'Ciudad',
    cityPlaceholder: 'Selecciona una ciudad',
    cityManualPlaceholder: 'Ingresa la ciudad',
    phone: 'Teléfono',
    phonePlaceholder: '+598 99 123 456',
    email: 'Email',
    emailPlaceholder: 'sede@club.com',
    descriptionField: 'Descripción',
    descriptionPlaceholder: 'Nuestra sede ubicada en el centro de la ciudad...',
    setAsDefault: 'Establecer como sede por defecto',
    // Search placeholders
    searchCountry: 'Buscar país...',
    searchState: 'Buscar estado...',
    searchCity: 'Buscar ciudad...',
    // Messages
    courtsInfo: 'Canchas de esta sede:',
    courtsInfoDescription: 'Las canchas se asignan desde la sección Canchas.',
    noCountriesAvailable: 'Instala country-state-city para ver países',
    noStatesFound: 'No se encontraron estados',
    noCitiesFound: 'No se encontraron ciudades',
    // Buttons
    cancel: 'Cancelar',
    save: 'Guardar Sede',
    saving: 'Guardando...',
    update: 'Actualizar Sede',
    // Errors
    nameRequired: 'El nombre de la sede es requerido',
    // Venue Card
    defaultVenue: 'Por defecto',
    addressNotConfigured: 'Dirección por configurar',
    courtsCount: 'cancha',
    courtsCountPlural: 'canchas',
    // Filter
    filterByVenue: 'Filtrar por sede',
    allVenues: 'Todas las sedes',
    // Venue Selector (for leagues)
    selectVenuesAndCourts: 'Seleccionar Sedes y Canchas',
    selectVenuesDescription: 'Selecciona las sedes donde se jugará la liga y las canchas disponibles de cada sede.',
    noVenuesAvailable: 'No hay sedes disponibles. Primero debes crear una sede en la sección "Sedes".',
    primaryVenue: 'Sede Primaria',
    courtsLabel: 'Canchas:',
    courtsSelected: 'de {total} canchas seleccionadas',
    summary: 'Resumen:',
    venuesSelected: 'sede(s)',
    courtsSelectedSummary: 'cancha(s) seleccionadas',
    // Court modal
    createVenueFirst: 'Primero debes crear una sede en la pestaña "Sedes"',
    selectVenue: 'Selecciona una sede',
    // Form sections
    basicInfo: 'Información Básica',
    location: 'Ubicación',
    contactInfo: 'Información de Contacto',
    descriptionSection: 'Descripción',
    options: 'Opciones'
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
        prizes: 'Premios',
        venuesAndCourts: 'Sedes y Canchas'
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
            clubName: 'BayPadel San Francisco',
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
    },
    autoScheduling: {
      incompleteCategories: {
        title: 'Categorías Incompletas',
        description: 'No se puede ejecutar el auto-scheduling hasta que todas las categorías tengan sus cupos completos.',
        alertTitle: 'Auto-scheduling bloqueado',
        alertDescription: '{incomplete} de {total} categoría(s) aún no tienen sus cupos completos.',
        categoriesList: 'Categorías que necesitan más equipos:',
        registered: '{registered}/{max} equipos',
        missing: 'Faltan {missing}',
        helpText: 'Por favor, completa los cupos de todas las categorías antes de ejecutar el auto-scheduling. Esto asegura una mejor distribución de horarios entre todas las categorías del evento.'
      }
      }
    },
    // Leagues
    leagues: {
      title: 'Ligas',
      description: 'Administra y visualiza todas las ligas.',
      createLeague: 'Crear Liga',
      createNewLeague: 'Crear Nueva Liga',
      createNewLeagueDescription: 'Configura los detalles de tu nueva liga.',
      noLeagues: 'No hay ligas creadas',
      noLeaguesDescription: 'Comienza creando tu primera liga',
      noLeaguesFound: 'No se encontraron ligas',
      noLeaguesFoundDescription: 'No hay ligas que coincidan con los filtros seleccionados.',
      searchPlaceholder: 'Buscar por categoría...',
      allCategories: 'Todas las categorías',
      allStatus: 'Todos',
      clearFilters: 'Limpiar filtros',
      loadingData: 'Cargando datos...',
      step: 'Paso',
      of: 'de',
      loadingCategories: 'Cargando categorías...',
      creating: 'Creando Liga...',
      createLeagueCheck: 'Crear Liga ✓',
      back: 'Atrás',
      // Status
      status: {
        all: 'Todos',
        inscribiendo: 'Inscribiendo',
        activa: 'Activa',
        finalizada: 'Finalizada'
      },
      // League Card
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      registeredTeams: 'Equipos Registrados',
      completed: 'completado',
      spotsAvailable: 'cupos disponibles',
      spotsFull: 'Cupos Completos',
      inscriptionCost: 'Costo de Inscripción',
      // League Detail Page
      backToLeagues: 'Volver a Ligas',
      loadingLeagueInfo: 'Cargando información de la liga...',
      errorLoadingLeague: 'No se pudo cargar la información de la liga.',
      registeredTeamsTitle: 'Equipos Registrados',
      // Pagination
      showing: 'Mostrando',
      to: 'a',
      leagues: 'ligas',
      // Empty states
      noLeaguesInCategory: 'No hay ligas en categorías que coincidan con',
      inCategory: 'en categoría',
      withStatus: 'que están',
      withOpenRegistrations: 'con inscripciones abiertas',
      inProgress: 'en curso',
      finished: 'finalizadas',
      // League Summary
      leagueSummary: 'Resumen de la Liga',
      name: 'Nombre:',
      type: 'Tipo:',
      categories: 'Categorías:',
      venues: 'Sedes:',
      totalCourts: 'Total Canchas:',
      courtsPerSlot: 'Canchas por Horario:',
      schedules: 'Horarios:',
      frequency: 'Frecuencia:',
      continue: 'Continuar',
      // League Detail Page Sections
      upcomingMatches: 'Próximos Partidos',
      leagueInfo: 'Información de la Liga',
      standings: 'Tabla de Posiciones',
      gallery: 'Galería de Imágenes',
      // League Info Section
      leagueDescription: 'Descripción',
      noDescription: 'Sin descripción',
      leagueInscriptionCost: 'Costo de Inscripción',
      dates: 'Fechas',
      start: 'Inicio:',
      end: 'Fin:',
      scoringSystem: 'Sistema de Puntuación',
      victory: 'Victoria',
      lossWithSet: 'Derrota con Set',
      loss: 'Derrota',
      walkover: 'W.O.',
      points: 'puntos',
      // Standings Section
      loadingStandings: 'Cargando tabla de posiciones...',
      errorLoadingStandings: 'Error al cargar tabla de posiciones:',
      noStandings: 'No hay tabla de posiciones disponible',
      noStandingsDescription: 'No hay datos disponibles para esta liga. Genera partidos para ver la tabla de posiciones.',
      // Generate League Button
      generateLeague: 'Generar partidos de la liga',
      generatingLeague: 'Generando liga...',
      leagueGenerated: 'Los partidos ya han sido generados',
      // Toast Messages
      generatingLeagueToast: 'Generando liga...',
      generatingLeagueDescription: 'Por favor espera mientras se generan los partidos y se envían las notificaciones',
      leagueGeneratedSuccess: '¡Liga generada exitosamente!',
      leagueGeneratedDescription: 'El calendario y la tabla de posiciones han sido generados correctamente',
      authError: 'Error de Autenticación',
      authErrorDescription: 'No hay sesión de administrador activa',
      generateError: 'Error al generar liga',
      generateErrorDescription: 'No se pudo generar el calendario y la tabla de posiciones',
      unexpectedError: 'Error Inesperado',
      unexpectedErrorDescription: 'Ocurrió un error al generar la liga'
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
      cancel: 'Cancel',
      update: 'Update',
      saving: 'Saving...',
      product: 'product',
      category: 'category',
      item: 'item',
      sponsor: 'sponsor',
      professor: 'professor',
      venue: 'venue',
      court: 'court',
      confirmDeletion: 'Confirm Deletion',
      deleteConfirmation: 'Are you sure you want to delete',
      cannotUndo: 'This action cannot be undone.',
      delete: 'Delete',
      size: 'Size',
      sku: 'SKU',
      quantity: 'Quantity',
      price: 'Price',
      total: 'Total',
      subtotal: 'Subtotal',
      selectSize: 'Select Size',
      selectSizeLabel: 'Select a size:',
      selectedSize: 'Selected size:',
      noSizesAvailable: 'No sizes available for this product',
      noStockAvailable: 'No stock available',
      insufficientStock: 'Insufficient stock',
      available: 'Available',
      noVenuesAvailable: 'No venues available',
      mustSelectVenue: 'You must select a venue to continue',
      error: 'Error',
      understood: 'Understood'
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
      noTournamentsForCategoryDescription: 'No tournaments available for the selected category.',
      // Active Tournaments Widget
      activeTournaments: 'Active Tournaments',
      activeTournamentsTitle: 'Active Tournaments ({count})',
      noActiveTournaments: 'No active tournaments',
      noActiveTournamentsDescription: 'Active tournaments will appear here when they are in progress.',
      viewAllTournaments: 'View All Tournaments',
      // Tournament Phases
      phaseRegistrations: 'Registrations',
      phaseGroups: 'Group Stage',
      phaseStandings: 'Standings',
      phaseBracket: 'Elimination Bracket',
      // Phase Descriptions
      teamsRegistered: '{count}/{max} teams registered',
      groupsGenerated: 'Groups generated',
      viewMatchesAndGroups: 'View matches and groups',
      viewStandingsTable: 'View standings table',
      viewStandings: 'View standings',
      bracketGenerated: 'Bracket generated',
      viewBracket: 'View bracket',
      // Phase Actions
      viewPayments: 'View Payments',
      viewMatches: 'View Matches',
      viewStandingsButton: 'View Standings',
      viewBracketButton: 'View Bracket',
      goToTournament: 'Go',
      teams: 'Teams',
      progress: 'Progress',
      phaseCompleted: 'Completed',
      phaseInProgress: 'In Progress',
      phasePending: 'Pending',
      noCategory: 'No category',
      // Dashboard Stats
      totalUsers: 'Total Users',
      totalSponsors: 'Total Sponsors',
      monthlyIncome: 'Monthly Income',
      // Status and errors
      noStatus: 'No status',
      noDate: 'No date',
      unknownError: 'Unknown error',
      errorLoadingMatches: 'Error loading matches: {status} {statusText}',
      noDataReceived: 'No data received from server',
      errorLoadingStandings: 'Error loading standings: {status} {statusText}',
      // League Schedule Card
      viewAllMatches: 'View all matches',
      notAssigned: 'Not assigned',
      vs: 'VS',
      noMatches: 'No matches scheduled',
      noMatchesForLeague: 'No matches scheduled for leagues at this time.',
      // Empty Leagues
      noActiveLeagues: 'No active leagues',
      // Category Standings
      loadingStandings: 'Loading standings table...',
      noDataForCategory: 'No data available for the {category} category.',
      position: 'Position',
      team: 'Team',
      gamesPlayed: 'Games Played',
      gamesWon: 'Games Won',
      gamesLost: 'Games Lost',
      setsWon: 'Sets Won',
      setsLost: 'Sets Lost',
      gamesDifference: 'Games Difference',
      totalPoints: 'Total Points',
      teamNotAvailable: 'Team not available'
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
      venues: 'Venues',
      viewVenues: 'View Venues',
      kiosk: 'Kiosk',
      registerSale: 'Register Sale',
      products: 'Products',
      sales: 'Sales',
      reports: 'Reports',
      categories: 'Categories',
      courts: 'Courts',
      professors: 'Professors',
      sponsors: 'Sponsors',
      users: 'Users',
      settings: 'Settings',
      guide: 'Guide',
      viewTournaments: 'View tournaments',
      createTournament: 'Create tournament',
      viewLeagues: 'View leagues',
      createLeague: 'Create league',
      club: 'Club:',
      clubName: 'BayPadel San Francisco',
      logout: 'Log out',
      loggingOut: 'Logging out...'
    },
    settings: {
      title: 'Settings',
      description: 'Manage application settings.',
      tabs: {
        profile: 'Profile',
        integrations: 'Integrations',
        subscription: 'Subscription',
        password: 'Password'
      },
      profile: {
        title: 'Profile',
        personalInfo: 'Personal information',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        tokenNotFound: 'Token not found',
        errorLoadingProfile: 'Error loading profile',
        error: 'Error'
      },
      integrations: {
        title: 'Integrations',
        description: 'Connect your favorite apps and services',
        whatsappDescription: 'Connect with your WhatsApp Business account',
        configured: 'Configured',
        connect: 'Connect',
        configuredNumber: 'Configured number:',
        edit: 'Edit',
        whatsappConfigured: 'WhatsApp configured',
        whatsappUpdated: 'WhatsApp Business number has been updated successfully.',
        error: 'Error',
        errorSavingWhatsapp: 'Error saving WhatsApp number',
        noAuthToken: 'No authentication token',
        errorSavingNumber: 'Error saving number'
      },
      subscription: {
        title: 'Subscription',
        membershipStatus: 'Your membership status',
        active: 'Active',
        annualContract: 'Annual Contract',
        annualContractDescription: 'Your subscription has a minimum commitment of 12 months. This period ensures service continuity and access to all platform features.',
        premiumPlan: 'Premium Plan',
        perMonth: 'per month',
        billing: 'Billing',
        monthly: 'Monthly',
        autoCharge: 'Auto charge',
        includedFeatures: 'Included features',
        fullPlatformAccess: 'Full platform access',
        prioritySupport: 'Priority support 24/7',
        autoBackup: 'Automatic backup',
        premiumUpdates: 'Premium updates'
      }
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
    kiosk: {
      title: 'Kiosk',
      description: 'Sales system and product management',
      // Dashboard Widget
      lowStock: 'Low Stock',
      totalSales: 'Total Sales',
      requiresAttention: 'Requires attention',
      thisMonth: 'this month',
      today: 'Today',
      week: 'Week',
      salesCount: 'sales',
      vsPreviousMonth: 'vs previous month',
      pos: {
        title: 'Register Sale',
        description: 'Register sales and manage inventory',
        searchProducts: 'Search products...',
        allCategories: 'All categories',
        cart: 'Cart',
        emptyCart: 'Cart is empty',
        subtotal: 'Subtotal',
        total: 'Total',
        checkout: 'Checkout',
        paymentDetails: 'Payment Details',
        venue: 'Venue',
        selectVenue: 'Select a venue',
        selectedVenue: 'Selected venue',
        customerName: 'Customer Name',
        customerNamePlaceholder: 'Optional',
        paymentMethod: 'Payment Method',
        cash: 'Cash',
        transfer: 'Transfer',
        card: 'Card',
        mercadopago: 'Mercado Pago',
        saleContext: 'Sale Context',
        contextGeneral: 'General',
        contextTournament: 'Tournament',
        contextLeague: 'League',
        contextClass: 'Class',
        contextBooking: 'Booking',
        processing: 'Processing...',
        confirmSale: 'Confirm Sale',
        noStockForSize: 'No stock available for size {size}',
        noStockAvailable: 'No stock available',
        insufficientStockForSize: 'Insufficient stock for size {size}. Available: {available}',
        mustSelectVenue: 'You must select a venue to continue',
        selectSize: 'Select Size',
        selectSizeLabel: 'Select a size:',
        selectedSize: 'Selected size:',
        noSizesAvailable: 'No sizes available for this product',
        noVenuesAvailable: 'No venues available'
      },
      categories: {
        title: 'Product Categories',
        description: 'Manage product categories for the kiosk',
        addCategory: 'Add Category',
        editCategory: 'Edit Category',
        deleteCategory: 'Delete Category',
        name: 'Name',
        namePlaceholder: 'E.g: Drinks, Beers',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Category description',
        icon: 'Icon',
        color: 'Color',
        sortOrder: 'Order',
        isActive: 'Active',
        noCategories: 'No categories',
        noCategoriesDescription: 'Create your first category to organize products',
        addCategoryDescription: 'Create a new category to organize your products',
        editCategoryDescription: 'Edit category details',
        deleteConfirmation: 'Are you sure you want to delete category "{name}"?'
      },
      products: {
        title: 'Products',
        description: 'Manage kiosk products',
        addProduct: 'Add Product',
        editProduct: 'Edit Product',
        deleteProduct: 'Delete Product',
        name: 'Name',
        namePlaceholder: 'Product name',
        category: 'Category',
        selectCategory: 'Select a category',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Product description',
        sku: 'SKU',
        skuPlaceholder: 'Product code',
        barcode: 'Barcode',
        barcodePlaceholder: 'Barcode',
        price: 'Price',
        costPrice: 'Cost Price',
        stockQuantity: 'Stock Quantity',
        minStockAlert: 'Min Stock Alert',
        trackInventory: 'Track Inventory',
        image: 'Image',
        noImage: 'No image',
        selectImage: 'Select Image',
        changeImage: 'Change Image',
        venue: 'Venue',
        selectVenue: 'Select a venue',
        selectedVenue: 'Selected venue',
        mustSelectVenue: 'You must select a venue to view products',
        selectVenueFirst: 'Select a venue first',
        selectVenueFirstDescription: 'You must select a venue to view and manage products',
        venueRequired: 'Venue is required',
        allVenues: 'All venues',
        isFeatured: 'Featured',
        isActive: 'Active',
        isInactive: 'Inactive',
        searchPlaceholder: 'Search products...',
        allCategories: 'All categories',
        all: 'All',
        lowStock: 'Low Stock',
        noProducts: 'No products',
        noProductsDescription: 'Create your first product to start selling',
        addProductDescription: 'Create a new product for the kiosk',
        editProductDescription: 'Edit product details',
        deleteConfirmation: 'Are you sure you want to delete product "{name}"?',
        pagination: {
          previous: 'Previous',
          next: 'Next'
        }
      },
      sales: {
        title: 'Sales',
        description: 'Sales history',
        saleNumber: 'Sale #',
        product: 'Product',
        date: 'Date',
        customer: 'Customer',
        venue: 'Venue',
        selectedVenue: 'Selected venue',
        paymentMethod: 'Payment Method',
        status: 'Status',
        total: 'Total',
        actions: 'Actions',
        view: 'View',
        saleDetails: 'Sale Details',
        items: 'Items',
        searchPlaceholder: 'Search sales...',
        allVenues: 'All venues',
        allPaymentMethods: 'All methods',
        allStatus: 'All status',
        noSales: 'No sales',
        noSalesDescription: 'Sales will appear here when registered',
        size: 'Size',
        sku: 'SKU',
        paymentMethods: {
          cash: 'Cash',
          transfer: 'Transfer',
          card: 'Card',
          mercadopago: 'Mercado Pago',
          pending: 'Pending'
        },
        paymentStatus: {
          pending: 'Pending',
          completed: 'Completed',
          refunded: 'Refunded',
          cancelled: 'Cancelled'
        },
        showing: 'Showing',
        to: 'to',
        of: 'of',
        sales: 'sales'
      },
      reports: {
        title: 'Reports',
        description: 'Sales and product analysis',
        venue: 'Venue',
        allVenues: 'All venues',
        selectedVenue: 'Selected venue',
        startDate: 'Start Date',
        endDate: 'End Date',
        generate: 'Generate Report',
        totalRevenue: 'Total Revenue',
        averageTicket: 'Average Ticket',
        totalSales: 'Total Sales',
        sales: 'sales',
        perSale: 'per sale',
        completedSales: 'completed sales',
        topProducts: 'Top Products',
        topProductsDescription: 'Products with the highest sales volume in the selected period',
        unitsSold: 'units sold',
        revenue: 'Revenue',
        noData: 'No data',
        noDataDescription: 'Select a period and generate a report to view data',
        loading: 'Loading...',
        dashboard: {
          title: 'Sales Dashboard',
          salesToday: 'Sales Today',
          thisWeek: 'This Week',
          thisMonth: 'This Month',
          averageTicket: 'Average Ticket',
          transactions: 'transactions',
          averageTicketLabel: 'Average ticket',
          monthlyAverage: 'Monthly average',
          vsPreviousMonth: 'vs previous month',
          paymentMethods: 'Payment Methods (This Month)',
          cash: 'Cash',
          transfer: 'Transfer',
          card: 'Card',
          mercadopago: 'Mercadopago'
        },
        stockAlerts: {
          title: 'Stock Alerts',
          outOfStock: 'out of stock',
          lowStock: 'low stock',
          outOfStockTitle: 'Out of Stock',
          lowStockTitle: 'Low Stock',
          units: 'units',
          minimum: 'Minimum',
          noAlerts: 'Healthy Stock',
          noAlertsDescription: 'All products have sufficient stock'
        },
        periodReports: {
          title: 'Period Reports'
        },
        charts: {
          title: 'Sales Charts',
          trendTitle: 'Sales Trend',
          period: 'Period',
          days: 'days',
          totalPeriod: 'Total period',
          transactions: 'Transactions',
          averagePerDay: 'Average/day',
          dailyRevenue: 'Daily Revenue',
          movingAverage: 'Moving Average (7 days)',
          noData: 'No trend data',
          noDataDescription: 'Charts will appear here when there is sales data',
          loading: 'Loading data...'
        }
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        update: 'Update',
        saving: 'Saving...',
        loading: 'Loading...'
      }
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
  guide: {
    title: 'System Guide',
    subtitle: 'Learn how to use all the features of the administration panel',
    prerequisites: {
      title: 'Prerequisites',
      description: 'Before creating leagues or tournaments, make sure you have the following configured:',
      venues: {
        title: 'Venues',
        description: 'You must have at least one venue created. Venues are the physical locations where matches are played.'
      },
      courts: {
        title: 'Courts',
        description: 'Each venue must have at least one court assigned. Courts are the spaces where matches are played.'
      },
      categories: {
        title: 'Categories',
        description: 'You need to have categories created to organize teams by level or type of competition.'
      },
      users: {
        title: 'Users',
        description: 'Users must be registered in the system to be able to register for leagues or tournaments.'
      }
    },
    createLeague: {
      title: 'How to Create a League',
      description: 'Follow these steps to successfully create a league',
      step1: {
        title: 'Basic Information',
        name: 'Name: Assign a descriptive name to your league',
        categories: 'Categories: Select one or more categories for the league',
        description: 'Description: Add a detailed description (optional)',
        image: 'Image: Upload a representative image (optional)',
        cost: 'Registration Cost: Define the price to participate',
        teams: 'Number of Teams: Set how many teams can register per category'
      },
      step2: {
        title: 'Date and Frequency Configuration',
        startDate: 'Start Date: Select when the league will begin',
        endDate: 'End Date: Define when the league will end',
        frequency: 'Frequency: Choose between Weekly, Bi-weekly or Monthly',
        playDay: 'Play Day per Category: Assign a specific day for each category (Monday, Tuesday, etc.)'
      },
      step3: {
        title: 'Venues and Courts',
        selectVenues: 'Select Venues: Choose one or more venues where the league will be played',
        selectCourts: 'Select Courts: For each venue, select the available courts',
        primaryVenue: 'Primary Venue: Mark a venue as primary (optional)'
      },
      step4: {
        title: 'Schedules and Advanced Configuration',
        matchTimes: 'Match Times: Define specific times (e.g., 22:30, 23:15)',
        courtsPerTime: 'Courts per Time: Indicate how many courts will be used simultaneously',
        leagueType: 'League Type: Choose Round Robin, Elimination, Groups or Custom',
        rounds: 'Rounds: 1 round (single leg) or 2 rounds (home and away)'
      },
      tip: '💡 Tip: Once the league is created, teams will be able to register. After registrations, you can automatically generate matches from the league details page.'
    },
    createTournament: {
      title: 'How to Create a Tournament',
      description: 'Step-by-step guide to create a tournament',
      step1: {
        title: 'Basic Information',
        description: 'Define the name, categories, dates, description and image of the tournament.'
      },
      step2: {
        title: 'Configuration',
        description: 'Set the number of participants, competition format and special rules.'
      },
      step3: {
        title: 'Venues and Courts',
        description: 'Select the venues and courts where the tournament will take place.'
      },
      step4: {
        title: 'Sponsors',
        description: 'Associate sponsors to the tournament (optional).'
      }
    },
    resources: {
      title: 'Resource Management',
      description: 'Learn how to manage venues, courts, categories and more',
      venues: {
        title: 'Venues',
        description: 'Venues are the physical locations where competitions take place. Each venue can have multiple courts.',
        contact: 'Add contact information (address, phone, email)',
        default: 'Mark a venue as default',
        status: 'Manage active/inactive status'
      },
      courts: {
        title: 'Courts',
        description: 'Courts are the specific spaces within a venue where matches are played.',
        assign: 'Assign each court to a specific venue',
        photo: 'Upload a photo of the court for visual identification',
        status: 'Manage active/inactive status'
      },
      categories: {
        title: 'Categories',
        description: 'Categories organize teams by level, age or type of competition.',
        define: 'Define the name and description of each category',
        associate: 'Associate categories to leagues and tournaments',
        manage: 'Manage multiple categories simultaneously'
      },
      users: {
        title: 'Users',
        description: 'Manage system users, including players and administrators.',
        view: 'View and manage all registered users',
        roles: 'Assign roles (Player, Administrator)',
        status: 'Manage active/inactive status of users'
      }
    },
    tips: {
      title: '💡 Tips and Best Practices',
      planning: {
        title: 'Advance Planning',
        description: 'Create venues, courts and categories before creating leagues or tournaments to have everything ready.'
      },
      schedules: {
        title: 'Equitable Schedules',
        description: 'The system automatically distributes schedules equitably among all teams.'
      },
      verification: {
        title: 'Data Verification',
        description: 'Always review the information before creating leagues or tournaments to avoid errors.'
      }
    }
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
    editCourtDescription: 'Modify the name, venue and photo of the court',
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
  // Venues
    categories: {
      title: 'Categories',
      description: 'Manage tournament categories.',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      addNewCategory: 'Add New Category',
      categoryName: 'Category Name',
      categoryNamePlaceholder: 'Enter category name',
      saving: 'Saving...',
      update: 'Update'
    },
    venues: {
      title: 'Venue and Court Management',
      description: 'Manage the club venues and their courts.',
    venues: 'Venues',
    courts: 'Courts',
    newVenue: 'New Venue',
    editVenue: 'Edit Venue',
    addCourt: 'Add Court',
    loadingVenues: 'Loading venues...',
    loadingCourts: 'Loading courts...',
    // Form fields
    venueName: 'Venue Name',
    venueNamePlaceholder: 'Ex: Central Venue',
    address: 'Address',
    addressPlaceholder: 'Main Ave 1234',
    country: 'Country',
    countryPlaceholder: 'Select a country',
    state: 'State/Department',
    statePlaceholder: 'Select a state',
    stateManualPlaceholder: 'Enter state/department',
    city: 'City',
    cityPlaceholder: 'Select a city',
    cityManualPlaceholder: 'Enter city',
    phone: 'Phone',
    phonePlaceholder: '+1 234 567 8900',
    email: 'Email',
    emailPlaceholder: 'venue@club.com',
    descriptionField: 'Description',
    descriptionPlaceholder: 'Our venue located in the city center...',
    setAsDefault: 'Set as default venue',
    // Search placeholders
    searchCountry: 'Search country...',
    searchState: 'Search state...',
    searchCity: 'Search city...',
    // Messages
    courtsInfo: 'Courts for this venue:',
    courtsInfoDescription: 'Courts are assigned from the Courts section.',
    noCountriesAvailable: 'Install country-state-city to see countries',
    noStatesFound: 'No states found',
    noCitiesFound: 'No cities found',
    // Buttons
    cancel: 'Cancel',
    save: 'Save Venue',
    saving: 'Saving...',
    update: 'Update Venue',
    // Errors
    nameRequired: 'Venue name is required',
    // Venue Card
    defaultVenue: 'Default',
    addressNotConfigured: 'Address to configure',
    courtsCount: 'court',
    courtsCountPlural: 'courts',
    // Filter
    filterByVenue: 'Filter by venue',
    allVenues: 'All venues',
    // Venue Selector (for leagues)
    selectVenuesAndCourts: 'Select Venues and Courts',
    selectVenuesDescription: 'Select the venues where the league will be played and the available courts for each venue.',
    noVenuesAvailable: 'No venues available. You must first create a venue in the "Venues" section.',
    primaryVenue: 'Primary Venue',
    courtsLabel: 'Courts:',
    courtsSelected: 'of {total} courts selected',
    summary: 'Summary:',
    venuesSelected: 'venue(s)',
    courtsSelectedSummary: 'court(s) selected',
    // Court modal
    createVenueFirst: 'You must first create a venue in the "Venues" tab',
    selectVenue: 'Select a venue',
    // Form sections
    basicInfo: 'Basic Information',
    location: 'Location',
    contactInfo: 'Contact Information',
    descriptionSection: 'Description',
    options: 'Options'
  },
  // Leagues
  leagues: {
    title: 'Leagues',
    description: 'Manage and view all leagues.',
    createLeague: 'Create League',
    createNewLeague: 'Create New League',
    createNewLeagueDescription: 'Configure the details of your new league.',
    noLeagues: 'No leagues created',
    noLeaguesDescription: 'Start by creating your first league',
    noLeaguesFound: 'No leagues found',
    noLeaguesFoundDescription: 'No leagues match the selected filters.',
    searchPlaceholder: 'Search by category...',
    allCategories: 'All categories',
    allStatus: 'All',
    clearFilters: 'Clear filters',
    loadingData: 'Loading data...',
    step: 'Step',
    of: 'of',
    loadingCategories: 'Loading categories...',
    creating: 'Creating League...',
    createLeagueCheck: 'Create League ✓',
    back: 'Back',
    // Status
    status: {
      all: 'All',
      inscribiendo: 'Open Registrations',
      activa: 'In Progress',
      finalizada: 'Finished'
    },
    // League Card
    startDate: 'Start Date',
    endDate: 'End Date',
    registeredTeams: 'Registered Teams',
    completed: 'completed',
    spotsAvailable: 'spots available',
    spotsFull: 'Spots Full',
    inscriptionCost: 'Registration Cost',
    // League Detail Page
    backToLeagues: 'Back to Leagues',
    loadingLeagueInfo: 'Loading league information...',
    errorLoadingLeague: 'Could not load league information.',
    registeredTeamsTitle: 'Registered Teams',
    // Pagination
    showing: 'Showing',
    to: 'to',
    leagues: 'leagues',
    // Empty states
    noLeaguesInCategory: 'No leagues in categories matching',
    inCategory: 'in category',
    withStatus: 'that are',
    withOpenRegistrations: 'with open registrations',
    inProgress: 'in progress',
    finished: 'finished',
    // League Summary
    leagueSummary: 'League Summary',
    name: 'Name:',
    type: 'Type:',
    categories: 'Categories:',
    venues: 'Venues:',
    totalCourts: 'Total Courts:',
    courtsPerSlot: 'Courts per Slot:',
    schedules: 'Schedules:',
    frequency: 'Frequency:',
    continue: 'Continue',
    // League Detail Page Sections
    upcomingMatches: 'Upcoming Matches',
    leagueInfo: 'League Information',
    standings: 'Standings',
    gallery: 'Image Gallery',
    // League Info Section
    leagueDescription: 'Description',
    noDescription: 'No description',
    leagueInscriptionCost: 'Registration Cost',
    dates: 'Dates',
    start: 'Start:',
    end: 'End:',
    scoringSystem: 'Scoring System',
    victory: 'Victory',
    lossWithSet: 'Loss with Set',
    loss: 'Loss',
    walkover: 'W.O.',
    points: 'points',
    // Standings Section
    loadingStandings: 'Loading standings...',
    errorLoadingStandings: 'Error loading standings:',
    noStandings: 'No standings available',
    noStandingsDescription: 'No data available for this league. Generate matches to see standings.',
    // Generate League Button
    generateLeague: 'Generate league matches',
    generatingLeague: 'Generating league...',
    leagueGenerated: 'Matches have already been generated',
    // Toast Messages
    generatingLeagueToast: 'Generating league...',
    generatingLeagueDescription: 'Please wait while matches are generated and notifications are sent',
    leagueGeneratedSuccess: 'League generated successfully!',
    leagueGeneratedDescription: 'Calendar and standings have been generated correctly',
    authError: 'Authentication Error',
    authErrorDescription: 'No active administrator session',
    generateError: 'Error generating league',
    generateErrorDescription: 'Could not generate calendar and standings',
    unexpectedError: 'Unexpected Error',
    unexpectedErrorDescription: 'An error occurred while generating the league',
    // League Header
    categoryNotSpecified: 'Category not specified',
    spotAvailable: 'spot available',
    maxTeams: 'max teams'
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
        saveResult: 'Save Result',
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
        prizes: 'Prizes',
        venuesAndCourts: 'Venues and Courts'
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
            placeholder: 'E.g: BayPadel San Francisco'
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
    },
    autoScheduling: {
      incompleteCategories: {
        title: 'Incomplete Categories',
        description: 'Auto-scheduling cannot be executed until all categories have their full quotas.',
        alertTitle: 'Auto-scheduling blocked',
        alertDescription: '{incomplete} of {total} categor(ies) do not have their full quotas yet.',
        categoriesList: 'Categories that need more teams:',
        registered: '{registered}/{max} teams',
        missing: 'Missing {missing}',
        helpText: 'Please complete the quotas for all categories before executing auto-scheduling. This ensures better time slot distribution among all event categories.'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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