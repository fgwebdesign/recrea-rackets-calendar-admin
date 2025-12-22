// ========================================
// 📦 IMPORTS & DEPENDENCIES
// ========================================
import { supabase } from '../config/supabaseClient.js'
import { Resend } from 'resend'
import fs from 'fs'
import handlebars from 'handlebars'
import { distributeTeamsByDayPreference } from './tournament-intelligent-grouping.js'
import { autoScheduleMatches } from './tournament-auto-scheduling.js'
import { getSchedulingStatus } from './tournament-scheduling-status.js'
import { getSlotAvailability } from './tournament-slot-availability.js'

// ========================================
// 🎯 CONSTANTS & CONFIGURATION
// ========================================
const TOURNAMENT_FORMATS = {
  'SIX_PLAYERS': {
    total_teams: 6,
    groups_count: 2,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 4 equipos clasifican (2 de cada grupo)
    elimination_stages: {
      first: 'SEMI_FINALS',
      matches: ['SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0,  // Todos juegan semifinales
      semifinals_teams: 4,  // Los 4 clasificados juegan semifinales
      description: '4 clasifican: todos juegan semifinales → final'
    }
  },
  'NINE_PLAYERS': {
    total_teams: 9,
    groups_count: 3,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 6 equipos clasifican (2 de cada grupo)
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 2,  // Los 2 mejores primeros pasan directo a semis
      quarter_finals_teams: 4,  // Los otros 4 juegan cuartos
      description: '6 clasifican: 2 mejores 1ros → semis, otros 4 → cuartos'
    }
  },
  'TWELVE_PLAYERS': {
    total_teams: 12,
    groups_count: 4,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 8 equipos clasifican (2 de cada grupo)
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0,  // Todos juegan cuartos
      quarter_finals_teams: 8,  // Todos los 8 clasificados juegan cuartos
      description: '8 clasifican: todos juegan cuartos → semis → final'
    }
  },
  'SIXTEEN_PLAYERS': {
    total_teams: 16,
    groups_count: 4,
    teams_per_group: 4,
    teams_to_qualify: 2,  // 8 equipos clasifican (2 de cada grupo)
    elimination_stages: {
      first: 'OCTAVOS_DE_FINAL',
      matches: ['OCTAVOS_DE_FINAL', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0,  // Todos juegan octavos
      octavos_finals_teams: 8,  // Todos los 8 clasificados juegan octavos
      description: '8 clasifican: todos juegan octavos → cuartos → semis → final'
    }
  }
};

// Límite de restricciones por slot por cancha (se multiplica por número de canchas)
const MAX_RESTRICTIONS_PER_SLOT_PER_COURT = 2;

// ========================================
// 🔍 CONSULTAS (GET) - Obtener información
// ========================================

export async function getTournaments(req, res) {
  try {
    const { start_date, end_date, date_range, status } = req.query;
    
    let query = supabase
      .from('tournaments')
      .select(`
        *,
        tournament_teams (
          team_id,
          teams (*)
        ),
        tournament_info (*),
        categories (*),
        tournament_sponsors (
          sponsor_id,
          sponsors (*)
        ),
        tournament_venues (
          id,
          venue_id,
          courts_count,
          is_primary,
          notes,
          venue:venue_id (
            id,
            name,
            address,
            city,
            phone,
            photo_url
          ),
          tournament_venue_courts (
            id,
            court_id,
            is_available,
            priority,
            court:court_id (
              id,
              name,
              photo_url
            )
          )
        )
      `);

    // 🗓️ Filtro por fechas
    if (start_date && end_date) {
      query = query
        .gte('start_date', start_date)
        .lte('end_date', end_date);
    } else if (start_date) {
      query = query.gte('start_date', start_date);
    } else if (end_date) {
      query = query.lte('end_date', end_date);
    }

    // 📅 Filtro por rango de fechas específico
    if (date_range) {
      const ranges = {
        'this_month': () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]];
        },
        'next_month': () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]];
        },
        'this_year': () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 1);
          const end = new Date(now.getFullYear(), 11, 31);
          return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]];
        },
        'upcoming': () => {
          const today = new Date().toISOString().split('T')[0];
          return [today, null];
        }
      };

      if (ranges[date_range]) {
        const [rangeStart, rangeEnd] = ranges[date_range]();
        query = query.gte('start_date', rangeStart);
        if (rangeEnd) {
          query = query.lte('end_date', rangeEnd);
        }
      }
    }

    // 📊 Filtro por status (mantener compatibilidad)
    if (status) {
      query = query.eq('status', status);
    } else {
      // Por defecto mostrar todos los estados si no se especifica
      query = query.in('status', ['upcoming', 'in_progress', 'completed']);
    }

    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function getTournamentById(req, res) {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_teams (
        team_id,
        teams (*)
      ),
      tournament_info (*),
      categories (*),
      tournament_venues (
        id,
        venue_id,
        courts_count,
        is_primary,
        notes,
        venue:venue_id (
          id,
          name,
          address,
          city,
          phone,
          photo_url
        ),
        tournament_venue_courts (
          id,
          court_id,
          is_available,
          priority,
          court:court_id (
            id,
            name,
            photo_url
          )
        )
      )
    `)
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(500).json({ message: error.message })
  if (!data) return res.status(404).json({ message: 'Tournament not found' })
  
  res.json(data)
}

// ========================================
// 🏢 HELPER: Obtener canchas desde multi-sede
// ========================================

/**
 * Obtiene las canchas de un torneo desde la configuración multi-sede
 * Si no hay multi-sede configurado, usa el método tradicional (courts_available)
 * @param {string} tournamentId - ID del torneo
 * @returns {Promise<Array>} Array de objetos { id, name, venue_id }
 */
async function getTournamentCourts(tournamentId) {
  console.log('🏢 Fetching courts from tournament venues (multi-sede)...');
  
  // 1. Obtener las sedes asignadas a este torneo
  const { data: tournamentVenues, error: venuesError } = await supabase
    .from('tournament_venues')
    .select('id, venue_id, is_primary, venues:venue_id(id, name)')
    .eq('tournament_id', tournamentId)
    .order('is_primary', { ascending: false }); // Primaria primero

  let courts = [];
  let venueCourtMap = new Map(); // Mapeo court_id -> venue_id para asignar sede a partidos

  if (venuesError) {
    console.error('Error fetching tournament venues:', venuesError);
  }

  if (tournamentVenues && tournamentVenues.length > 0) {
    // Torneo tiene multi-sede configurada - obtener canchas específicas
    console.log(`✅ Torneo tiene ${tournamentVenues.length} sedes asignadas`);
    
    const tournamentVenueIds = tournamentVenues.map(tv => tv.id);
    
    // 2. Obtener las canchas específicas de cada sede para este torneo
    const { data: tournamentVenueCourts, error: courtsError } = await supabase
      .from('tournament_venue_courts')
      .select(`
        court_id,
        priority,
        is_available,
        tournament_venue_id,
        court:court_id(id, name, venue_id)
      `)
      .in('tournament_venue_id', tournamentVenueIds)
      .eq('is_available', true)
      .order('priority');

    if (courtsError) {
      console.error('Error fetching tournament venue courts:', courtsError);
      return { courts: [], venueCourtMap: new Map() };
    }

    if (!tournamentVenueCourts || tournamentVenueCourts.length === 0) {
      console.log('⚠️ No hay canchas disponibles en las sedes asignadas a este torneo');
      return { courts: [], venueCourtMap: new Map() };
    }

    // Mapear canchas y sus sedes
    courts = tournamentVenueCourts.map(tvc => ({
      id: tvc.court.id,
      name: tvc.court.name,
      venue_id: tvc.court.venue_id
    }));

    // Crear mapeo para asignar venue_id a partidos
    tournamentVenueCourts.forEach(tvc => {
      venueCourtMap.set(tvc.court.id, tvc.court.venue_id);
    });

    console.log(`🎾 Found ${courts.length} courts from multi-sede:`, 
      courts.map(c => `${c.name} (Sede: ${c.venue_id})`).join(', '));
  } else {
    // Torneo sin multi-sede - fallback a todas las canchas (comportamiento legacy)
    console.log('ℹ️ Torneo sin multi-sede, usando todas las canchas disponibles (legacy)');
    
    // Obtener el torneo para saber cuántas canchas usar
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('courts_available, venue_id')
      .eq('id', tournamentId)
      .single();
    
    if (tournamentError || !tournament) {
      console.error('Error obteniendo torneo para fallback:', tournamentError);
      return { courts: [], venueCourtMap: new Map() };
    }
    
    // Obtener todas las canchas disponibles
    let allCourtsQuery = supabase
      .from('courts')
      .select('id, name, venue_id');
    
    // Si hay venue_id en el torneo, filtrar por esa sede
    if (tournament.venue_id) {
      allCourtsQuery = allCourtsQuery.eq('venue_id', tournament.venue_id);
    }
    
    const { data: allCourts, error: allCourtsError } = await allCourtsQuery
      .limit(tournament.courts_available || 10);
    
    if (allCourtsError) {
      console.error('Error obteniendo canchas (fallback):', allCourtsError);
      return { courts: [], venueCourtMap: new Map() };
    }
    
    courts = allCourts || [];
    allCourts.forEach(c => venueCourtMap.set(c.id, c.venue_id));
    
    console.log(`🎾 Found ${courts.length} courts (legacy mode)`);
  }

  return { courts, venueCourtMap };
}

// 🚀 ALGORITMO DE VALIDACIÓN DE CAPACIDAD
async function validateTournamentCapacity(tournamentType, categories, courts, startDate, endDate) {
  console.log(`🔍 [VALIDACIÓN] Verificando capacidad del torneo...`);
  
  // Calcular equipos por categoría según tipo
  const teamsPerCategory = {
    'SIX_PLAYERS': 6,
    'NINE_PLAYERS': 9,
    'TWELVE_PLAYERS': 12,
    'SIXTEEN_PLAYERS': 16
  };
  
  const teamsPerCat = teamsPerCategory[tournamentType] || 12;
  const totalCategories = categories.length;
  const totalCourts = courts.length;
  
  console.log(`📊 [CAPACIDAD] ${totalCategories} categorías × ${teamsPerCat} equipos = ${totalCategories * teamsPerCat} equipos`);
  console.log(`🏟️ [CANCHAS] ${totalCourts} canchas disponibles`);
  
  // Calcular partidos necesarios
  const totalTeams = totalCategories * teamsPerCat;
  const totalMatches = totalTeams / 2; // Cada partido tiene 2 equipos
  
  console.log(`🎾 [PARTIDOS] ${totalMatches} partidos necesarios`);
  
  // Calcular slots disponibles con capacidad por cancha
  const timeSlots = generateSimpleTimeSlots(startDate, endDate, totalCourts);
  const day1Slots = timeSlots.filter(slot => slot.day === 1).length;
  const day2Slots = timeSlots.filter(slot => slot.day === 2).length;
  const totalSlots = (day1Slots + day2Slots) * totalCourts;
  
  console.log(`⏰ [SLOTS] Día 1: ${day1Slots} × ${totalCourts} = ${day1Slots * totalCourts} slots`);
  console.log(`⏰ [SLOTS] Día 2: ${day2Slots} × ${totalCourts} = ${day2Slots * totalCourts} slots`);
  console.log(`⏰ [SLOTS] Total: ${totalSlots} slots disponibles`);
  
  // Validar capacidad
  const isValid = totalMatches <= totalSlots;
  const utilization = ((totalMatches / totalSlots) * 100).toFixed(1);
  
  console.log(`📊 [UTILIZACIÓN] ${totalMatches}/${totalSlots} slots (${utilization}%)`);
  
  if (!isValid) {
    const shortage = totalMatches - totalSlots;
    console.log(`❌ [ERROR] Faltan ${shortage} slots para programar todos los partidos`);
    return {
      valid: false,
      error: `Capacidad insuficiente: Se necesitan ${totalMatches} slots pero solo hay ${totalSlots} disponibles. Faltan ${shortage} slots.`,
      details: {
        totalMatches,
        totalSlots,
        shortage,
        courts: totalCourts,
        categories: totalCategories,
        teamsPerCategory: teamsPerCat
      }
    };
  }
  
  console.log(`✅ [VÁLIDO] El torneo se puede programar correctamente`);
  return {
    valid: true,
    details: {
      totalMatches,
      totalSlots,
      utilization: `${utilization}%`,
      courts: totalCourts,
      categories: totalCategories,
      teamsPerCategory: teamsPerCat
    }
  };
}

// ========================================
// ✨ CREACIÓN DE TORNEOS
// ========================================

export async function createTournament(req, res) {
  const { 
    name, 
    categories, 
    start_date, 
    end_date, 
    courts_available, 
    selectedCourts = [], 
    time_slots,                
    group_time_slots,          
    tournament_type = 'NINE_PLAYERS',
    // Información adicional para tournament_info
    description,
    rules,
    tournament_location,
    tournament_address,
    tournament_club_name, // Añadido este campo
    signup_limit_date,
    inscription_cost,
    sponsor_ids = [], // Array de IDs de sponsors
    tournament_thumbnail,
    first_place_prize,
    second_place_prize,
    third_place_prize,
    requires_shirts = false, // Campo para indicar si se requieren talles de remera
    // ====== NUEVO: Multi-sede support ======
    // Formato: [{ venue_id: 'uuid', court_ids: ['uuid1', 'uuid2'], is_primary: true/false }]
    venues = []
  } = req.body;

  try {
    // ===== VALIDACIONES BÁSICAS =====
    if (!name || !Array.isArray(categories) || categories.length === 0 || !start_date || !end_date) {
      return res.status(400).json({ message: 'Nombre, categorías (al menos una), start_date y end_date son requeridos' });
    }
    
    if (!Number.isInteger(courts_available) || courts_available < 1) {
      return res.status(400).json({ message: 'El número de canchas disponibles debe ser >= 1' });
    }
    
    if (!['SIX_PLAYERS', 'NINE_PLAYERS', 'TWELVE_PLAYERS', 'SIXTEEN_PLAYERS'].includes(tournament_type)) {
      return res.status(400).json({ message: 'tournament_type inválido. Debe ser SIX_PLAYERS, NINE_PLAYERS, TWELVE_PLAYERS o SIXTEEN_PLAYERS' });
    }

    // ===== VALIDACIONES AVANZADAS DE FECHAS =====
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const now = new Date();
    
    // 1. Validar formato de fechas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Formato de fecha inválido. Use formato YYYY-MM-DD' });
    }
    
    // 2. Validar lógica temporal básica
    if (startDate > endDate) {
      return res.status(400).json({ message: 'start_date debe ser menor o igual a end_date' });
    }
    
    // 3. Validar que las fechas sean futuras (mínimo 1 día de anticipación)
    const minStartDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 día
    if (startDate < minStartDate) {
      return res.status(400).json({ 
        message: 'La fecha de inicio debe ser al menos 1 día en el futuro',
        fecha_minima: minStartDate.toISOString().split('T')[0]
      });
    }
    
    // 4. Validar estructura de 3 días del sistema
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    if (durationDays < 3) {
      return res.status(400).json({ 
        message: 'Los torneos deben durar exactamente 3 días según la estructura del sistema',
        estructura_requerida: {
          dia_1: 'Inscripciones y primeros partidos (18:00-24:00)',
          dia_2: 'Fase de grupos completa (8:00-01:00)',
          dia_3: 'Fase eliminatoria (cuartos, semis, final)'
        },
        duracion_actual: `${durationDays} días`,
        duracion_requerida: '3 días'
      });
    }
    
    if (durationDays > 3) {
      return res.status(400).json({ 
        message: 'Los torneos no pueden durar más de 3 días según la estructura del sistema',
        duracion_actual: `${durationDays} días`,
        duracion_maxima: '3 días'
      });
    }
    
    // 5. Validar que no sea un torneo muy lejano (máximo 6 meses)
    const maxStartDate = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // +6 meses
    if (startDate > maxStartDate) {
      return res.status(400).json({ 
        message: 'La fecha de inicio no puede ser más de 6 meses en el futuro',
        fecha_maxima: maxStartDate.toISOString().split('T')[0]
      });
    }
    
    // 6. Validar días de la semana (opcional: evitar lunes o domingos)
    const startDayOfWeek = startDate.getDay();
    if (startDayOfWeek === 1) { // Lunes
      console.log('⚠️ Advertencia: El torneo inicia un lunes, considera cambiar a fin de semana');
    }
    
    // ===== VALIDACIÓN DE MULTI-SEDE =====
    let validatedVenues = [];
    let totalCourtsFromVenues = 0;
    
    if (venues && Array.isArray(venues) && venues.length > 0) {
      console.log('🏢 Validando configuración multi-sede:', venues.length, 'sedes');
      
      for (const venueConfig of venues) {
        // Validar estructura del objeto venue
        if (!venueConfig.venue_id) {
          return res.status(400).json({ 
            message: 'Cada sede debe tener un venue_id' 
          });
        }
        
        if (!venueConfig.court_ids || !Array.isArray(venueConfig.court_ids) || venueConfig.court_ids.length === 0) {
          return res.status(400).json({ 
            message: `La sede ${venueConfig.venue_id} debe tener al menos una cancha seleccionada` 
          });
        }
        
        // Validar que la sede existe
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id, name, is_active')
          .eq('id', venueConfig.venue_id)
          .single();
        
        if (venueError || !venueData) {
          return res.status(400).json({ 
            message: `Sede no encontrada: ${venueConfig.venue_id}` 
          });
        }
        
        if (!venueData.is_active) {
          return res.status(400).json({ 
            message: `La sede "${venueData.name}" no está activa` 
          });
        }
        
        // Validar que las canchas existen y pertenecen a esta sede
        const { data: courtsData, error: courtsError } = await supabase
          .from('courts')
          .select('id, name, venue_id')
          .in('id', venueConfig.court_ids);
        
        if (courtsError) {
          return res.status(500).json({ 
            message: 'Error validando canchas: ' + courtsError.message 
          });
        }
        
        if (courtsData.length !== venueConfig.court_ids.length) {
          const foundIds = courtsData.map(c => c.id);
          const notFoundIds = venueConfig.court_ids.filter(id => !foundIds.includes(id));
          return res.status(400).json({ 
            message: `Canchas no encontradas: ${notFoundIds.join(', ')}` 
          });
        }
        
        // Validar que las canchas pertenecen a la sede especificada
        const wrongVenueCourts = courtsData.filter(c => c.venue_id !== venueConfig.venue_id);
        if (wrongVenueCourts.length > 0) {
          return res.status(400).json({ 
            message: `Las siguientes canchas no pertenecen a la sede "${venueData.name}": ${wrongVenueCourts.map(c => c.name).join(', ')}` 
          });
        }
        
        validatedVenues.push({
          venue_id: venueConfig.venue_id,
          venue_name: venueData.name,
          court_ids: venueConfig.court_ids,
          courts_count: venueConfig.court_ids.length,
          is_primary: venueConfig.is_primary || false
        });
        
        totalCourtsFromVenues += venueConfig.court_ids.length;
        console.log(`✅ Sede "${venueData.name}" validada con ${venueConfig.court_ids.length} canchas`);
      }
      
      // Asegurar que solo haya una sede primaria
      const primaryVenues = validatedVenues.filter(v => v.is_primary);
      if (primaryVenues.length === 0) {
        // Si no hay ninguna primaria, marcar la primera como primaria
        validatedVenues[0].is_primary = true;
      } else if (primaryVenues.length > 1) {
        return res.status(400).json({ 
          message: 'Solo puede haber una sede principal por torneo' 
        });
      }
      
      console.log(`🎯 Multi-sede validado: ${validatedVenues.length} sedes, ${totalCourtsFromVenues} canchas totales`);
    } else {
      console.log('ℹ️ Torneo sin configuración multi-sede (se usará método tradicional)');
    }

    // ===== VALIDACIONES ESPECÍFICAS POR FORMATO DE TORNEO =====
    const formatConfig = {
      'SIX_PLAYERS': {
        total_teams: 6,
        groups_count: 2,
        teams_per_group: 3,
        description: '6 equipos en 2 grupos de 3 → 4 clasifican → semifinales/final'
      },
      'NINE_PLAYERS': {
        total_teams: 9,
        groups_count: 3,
        teams_per_group: 3,
        description: '9 equipos en 3 grupos de 3 → 6 clasifican → cuartos/semis/final'
      },
      'TWELVE_PLAYERS': {
        total_teams: 12,
        groups_count: 4,
        teams_per_group: 3,
        description: '12 equipos en 4 grupos de 3 → 8 clasifican → cuartos/semis/final'
      },
      'SIXTEEN_PLAYERS': {
        total_teams: 16,
        groups_count: 4,
        teams_per_group: 4,
        description: '16 equipos en 4 grupos de 4 → 8 clasifican → octavos/cuartos/semis/final'
      }
    };

    const currentFormat = formatConfig[tournament_type];
    
    // Validar que el número de canchas sea suficiente para el formato
    const minCourtsRequired = tournament_type === 'SIXTEEN_PLAYERS' ? 2 : 1;
    if (courts_available < minCourtsRequired) {
      return res.status(400).json({ 
        message: `Para formato ${tournament_type} se requieren al menos ${minCourtsRequired} cancha(s)`,
        canchas_disponibles: courts_available,
        canchas_requeridas: minCourtsRequired,
        formato: currentFormat.description
      });
    }

    // Validar que el número de canchas no sea excesivo (máximo 8 canchas)
    if (courts_available > 8) {
      return res.status(400).json({ 
        message: 'El número máximo de canchas permitido es 8',
        canchas_solicitadas: courts_available,
        canchas_maximas: 8
      });
    }

    // ===== ✨ VALIDACIÓN DE CAPACIDAD DE SLOTS =====
    console.log(`🔍 Validando capacidad para crear ${categories.length} categorías de tipo ${tournament_type}...`);
    
    // Calcular partidos por tipo de torneo
    const getMatchesForType = (type) => {
      switch(type) {
        case 'SIX_PLAYERS': return 6;      // 2 grupos × 3 partidos
        case 'NINE_PLAYERS': return 9;     // 3 grupos × 3 partidos
        case 'TWELVE_PLAYERS': return 12;  // 4 grupos × 3 partidos
        case 'SIXTEEN_PLAYERS': return 24; // 4 grupos × 6 partidos (4 equipos por grupo)
        default: return 0;
      }
    };
    
    const matchesPerCategory = getMatchesForType(tournament_type);
    const totalMatchesNeeded = categories.length * matchesPerCategory;
    
    // Calcular slots disponibles
    const DAY_1_SLOTS = 8;  // 17:00-23:00
    const DAY_2_SLOTS = 20; // 08:00-23:00
    const TOTAL_SLOTS_PER_COURT = DAY_1_SLOTS + DAY_2_SLOTS; // 28
    
    const totalAvailableSlots = TOTAL_SLOTS_PER_COURT * courts_available;
    const utilizationPercentage = ((totalMatchesNeeded / totalAvailableSlots) * 100).toFixed(1);
    const surplus = totalAvailableSlots - totalMatchesNeeded;
    
    console.log(`📊 Análisis de capacidad para creación:`);
    console.log(`   - Categorías: ${categories.length}`);
    console.log(`   - Tipo: ${tournament_type}`);
    console.log(`   - Partidos por categoría: ${matchesPerCategory}`);
    console.log(`   - Partidos totales necesarios: ${totalMatchesNeeded}`);
    console.log(`   - Slots disponibles: ${totalAvailableSlots} (${TOTAL_SLOTS_PER_COURT} × ${courts_available} canchas)`);
    console.log(`   - Utilización: ${utilizationPercentage}%`);
    console.log(`   - Sobra/Falta: ${surplus > 0 ? '+' : ''}${surplus} slots`);
    
    // VALIDACIÓN: Rechazar si no hay capacidad
    if (totalMatchesNeeded > totalAvailableSlots) {
      const minCourtsNeeded = Math.ceil(totalMatchesNeeded / TOTAL_SLOTS_PER_COURT);
      
      console.log(`❌ Capacidad insuficiente: ${totalMatchesNeeded} partidos > ${totalAvailableSlots} slots`);
      
      return res.status(400).json({
        message: 'Capacidad insuficiente para crear este torneo',
        error: 'INSUFFICIENT_CAPACITY',
        details: {
          event_configuration: {
            categories: categories.length,
            tournament_type: tournament_type,
            courts_available: courts_available
          },
          capacity_analysis: {
            matches_per_category: matchesPerCategory,
            total_matches_needed: totalMatchesNeeded,
            slots_available: totalAvailableSlots,
            deficit: Math.abs(surplus),
            utilization_percentage: `${utilizationPercentage}%`
          },
          slots_breakdown: {
            slots_per_court: TOTAL_SLOTS_PER_COURT,
            day_1_slots: DAY_1_SLOTS,
            day_2_slots: DAY_2_SLOTS,
            courts_available: courts_available
          },
          suggestion: {
            message: `Se requieren al menos ${minCourtsNeeded} canchas para este evento`,
            min_courts_needed: minCourtsNeeded,
            alternatives: [
              'Aumenta el número de canchas disponibles',
              `Reduce el número de categorías (máximo ${Math.floor(totalAvailableSlots / matchesPerCategory)} categorías con ${courts_available} canchas)`,
              'Elige un tipo de torneo con menos equipos (ej: TWELVE en lugar de SIXTEEN)'
            ]
          }
        }
      });
    }
    
    // ADVERTENCIA: Si la utilización es muy alta (> 90%)
    if (utilizationPercentage > 90 && surplus < 10) {
      console.log(`⚠️ Advertencia: Utilización muy alta (${utilizationPercentage}%) - ${surplus} slots libres`);
      console.log(`   Recomendación: Considera agregar una cancha adicional para mayor flexibilidad`);
    }
    
    console.log(`✅ Capacidad validada: El torneo es viable`);

    // ===== VALIDACIONES ADICIONALES DE LÓGICA DE NEGOCIO =====
    
    // Validar fecha límite de inscripción
    if (signup_limit_date) {
      const signupLimitDate = new Date(signup_limit_date);
      if (isNaN(signupLimitDate.getTime())) {
        return res.status(400).json({ 
          message: 'signup_limit_date tiene formato inválido. Use formato YYYY-MM-DD' 
        });
      }
      
      // La fecha límite debe ser antes del inicio del torneo
      if (signupLimitDate >= startDate) {
        return res.status(400).json({ 
          message: 'La fecha límite de inscripción debe ser anterior al inicio del torneo',
          fecha_limite_inscripcion: signupLimitDate.toISOString().split('T')[0],
          fecha_inicio_torneo: startDate.toISOString().split('T')[0]
        });
      }
      
      // La fecha límite debe ser futura
      if (signupLimitDate < now) {
        return res.status(400).json({ 
          message: 'La fecha límite de inscripción debe ser futura',
          fecha_limite_inscripcion: signupLimitDate.toISOString().split('T')[0],
          fecha_actual: now.toISOString().split('T')[0]
        });
      }
    }

    // Validar costo de inscripción
    if (inscription_cost !== undefined && inscription_cost !== null) {
      const cost = Number(inscription_cost);
      if (isNaN(cost) || cost < 0) {
        return res.status(400).json({ 
          message: 'El costo de inscripción debe ser un número positivo o cero' 
        });
      }
      
      if (cost > 10000) {
        return res.status(400).json({ 
          message: 'El costo de inscripción no puede exceder $10,000',
          costo_solicitado: cost,
          costo_maximo: 10000
        });
      }
    }

    // Validar premios
    const prizes = [first_place_prize, second_place_prize, third_place_prize];
    for (let i = 0; i < prizes.length; i++) {
      if (prizes[i] && prizes[i].length > 200) {
        return res.status(400).json({ 
          message: `El premio ${['primero', 'segundo', 'tercero'][i]} lugar no puede exceder 200 caracteres`,
          premio: prizes[i],
          longitud_actual: prizes[i].length,
          longitud_maxima: 200
        });
      }
    }

    // Validar descripción y reglas
    if (description && description.length > 1000) {
      return res.status(400).json({ 
        message: 'La descripción no puede exceder 1000 caracteres',
        longitud_actual: description.length,
        longitud_maxima: 1000
      });
    }

    if (rules && rules.length > 2000) {
      return res.status(400).json({ 
        message: 'Las reglas no pueden exceder 2000 caracteres',
        longitud_actual: rules.length,
        longitud_maxima: 2000
      });
    }

    // ===== VALIDACIÓN DE COMPATIBILIDAD DE CATEGORÍAS CON LÓGICA DE DISTRIBUCIÓN =====
    
    // Validar que el número de categorías sea compatible con la lógica de distribución de time slots
    const maxCategoriesForOptimalDistribution = calculateMaxCategoriesForOptimalDistribution(
      tournament_type, 
      courts_available, 
      durationDays
    );
    
    if (categories.length > maxCategoriesForOptimalDistribution) {
      return res.status(400).json({ 
        message: 'El número de categorías excede la capacidad óptima del sistema',
        categorias_solicitadas: categories.length,
        categorias_maximas_recomendadas: maxCategoriesForOptimalDistribution,
        razon: `Para ${tournament_type} con ${courts_available} cancha(s) y estructura de ${durationDays} días, el sistema funciona óptimamente con máximo ${maxCategoriesForOptimalDistribution} categorías para mantener la lógica de distribución de time slots compartidos`,
        recomendacion: 'Considere reducir el número de categorías o aumentar las canchas disponibles para mantener la eficiencia del sistema'
      });
    }

    // Validar que haya al menos una categoría (ya validado arriba, pero por claridad)
    if (categories.length < 1) {
      return res.status(400).json({ 
        message: 'Se requiere al menos una categoría para crear el torneo' 
      });
    }

    console.log(`✅ Validaciones de fechas, formato, lógica de negocio y compatibilidad de categorías pasadas: ${durationDays} días, formato ${tournament_type} (${currentFormat.description}), ${categories.length} categorías`);

    // 🚀 VALIDACIÓN DE CAPACIDAD DEL SISTEMA
    console.log(`🔍 [VALIDACIÓN CAPACIDAD] Iniciando validación de capacidad...`);
    
    // Obtener información de canchas para validación
    const { data: courtsData, error: courtsError } = await supabase
      .from('courts')
      .select('id, name');
      
    if (courtsError) {
      return res.status(500).json({ message: 'Error obteniendo información de canchas para validación', error: courtsError.message });
    }
    
    console.log(`🏟️ [CANCHAS] ${courtsData.length} canchas disponibles en el sistema`);
    
    // Validar capacidad del torneo
    const capacityValidation = await validateTournamentCapacity(
      tournament_type, 
      categories, 
      courtsData, 
      startDate, 
      endDate
    );
    
    if (!capacityValidation.valid) {
      console.log(`❌ [CAPACIDAD] ${capacityValidation.error}`);
      return res.status(400).json({ 
        message: 'El torneo no se puede crear debido a limitaciones de capacidad',
        error: capacityValidation.error,
        details: capacityValidation.details,
        recomendaciones: [
          'Reduzca el número de categorías',
          'Aumente el número de canchas disponibles',
          'Cambie el tipo de torneo a uno con menos equipos',
          'Extienda la duración del torneo (si es posible)'
        ]
      });
    }
    
    console.log(`✅ [CAPACIDAD] Validación exitosa: ${capacityValidation.details.utilization} de utilización`);
    console.log(`📊 [CAPACIDAD] ${capacityValidation.details.totalMatches} partidos programables en ${capacityValidation.details.totalSlots} slots disponibles`);

    // 🏟️ Validación de canchas seleccionadas (OPCIONAL)
    if (selectedCourts !== undefined && selectedCourts !== null) {
      // Si se proporciona selectedCourts, debe ser un array válido
      if (!Array.isArray(selectedCourts)) {
        return res.status(400).json({ 
          message: 'selectedCourts debe ser un array de IDs de canchas' 
        });
      }

      // Si el array no está vacío, validar que todas las canchas existan
      if (selectedCourts.length > 0) {
        const { data: existingCourts, error: courtsError } = await supabase
          .from('courts')
          .select('id')
          .in('id', selectedCourts);

        if (courtsError) {
          return res.status(500).json({ message: 'Error validando canchas', error: courtsError.message });
        }

        if (existingCourts.length !== selectedCourts.length) {
          const foundIds = existingCourts.map(c => c.id);
          const notFoundIds = selectedCourts.filter(id => !foundIds.includes(id));
          return res.status(400).json({ 
            message: `Las siguientes canchas no existen: ${notFoundIds.join(', ')}` 
          });
        }

        // Actualizar courts_available basado en las canchas seleccionadas
        courts_available = selectedCourts.length;
      }
    }

    // 🏆 Validación de sponsors (OPCIONAL)
    if (sponsor_ids !== undefined && sponsor_ids !== null) {
      // Si se proporciona sponsor_ids, debe ser un array válido
      if (!Array.isArray(sponsor_ids)) {
        return res.status(400).json({ 
          message: 'sponsor_ids debe ser un array de IDs de sponsors' 
        });
      }

      // Si el array no está vacío, validar que todos los sponsors existan
      if (sponsor_ids.length > 0) {
        const { data: existingSponsors, error: sponsorsError } = await supabase
          .from('sponsors')
          .select('id')
          .in('id', sponsor_ids);

        if (sponsorsError) {
          return res.status(500).json({ message: 'Error validando sponsors', error: sponsorsError.message });
        }

        if (existingSponsors.length !== sponsor_ids.length) {
          const foundIds = existingSponsors.map(s => s.id);
          const notFoundIds = sponsor_ids.filter(id => !foundIds.includes(id));
          return res.status(400).json({ 
            message: `Los siguientes sponsors no existen: ${notFoundIds.join(', ')}` 
          });
        }
      }
    }

    // ---- NUEVA LÓGICA: generación de group slots específicos por categoría ----
    const HHMM = /^\d{2}:\d{2}$/;

    // Obtener información de las categorías para generar time slots específicos
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, "order"')
      .in('id', categories);

    if (categoriesError) {
      return res.status(500).json({ message: 'Error obteniendo información de categorías' });
    }

    console.log(`🎯 Categorías encontradas:`, categoriesData.map(c => `${c.name} (orden: ${c.order})`));

    // ---- compat time_slots (legacy) ----
    let finalTimeSlots = time_slots;
    if (!Array.isArray(finalTimeSlots) || finalTimeSlots.length === 0) {
      finalTimeSlots = [
        [9, 13],   // mañana
        [14, 22],  // tarde/noche
      ];
    }

    // NUEVA LÓGICA: Crear un torneo por cada categoría con time slots específicos
    const tournamentsToCreate = categories.map(category_id => {
      const categoryInfo = categoriesData.find(c => c.id === category_id);
      
      // Generar time slots para la fase de grupos (compartidos entre todas las categorías)
      let categoryGroupSlots = group_time_slots;
      if (!Array.isArray(categoryGroupSlots) || categoryGroupSlots.length === 0) {
        categoryGroupSlots = generateGroupPhaseTimeSlots(start_date, end_date, courts_available);
      }

      return {
        name,
        category_id,
        start_date,
        end_date,
        status: 'upcoming',
        courts_available,
        time_slots: finalTimeSlots,
        group_time_slots: categoryGroupSlots,
        tournament_type,
        max_teams: tournament_type === 'SIX_PLAYERS' ? 6 : tournament_type === 'NINE_PLAYERS' ? 9 : tournament_type === 'TWELVE_PLAYERS' ? 12 : 16
      };
    });

    // Insertar múltiples torneos
    // 1. Crear los torneos primero
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .insert(tournamentsToCreate)
      .select();

    if (tournamentError) return res.status(500).json({ message: tournamentError.message });

    // 2. Crear la información adicional para cada torneo usando la lógica existente
    const tournamentInfoPromises = tournaments.map(tournament => {
      const tournamentInfoData = {
        tournament_id: tournament.id,
        description,
        rules,
        tournament_location,
        tournament_address,
        signup_limit_date,
        inscription_cost,
        tournament_thumbnail,
        first_place_prize,
        second_place_prize,
        third_place_prize
      };

      // Usar la lógica existente del controlador de tournament_info
      return supabase
        .from('tournament_info')
        .insert({
          tournament_id: tournament.id,
          description: description || '',
          rules: rules || '',
          tournament_location: tournament_location || '',
          tournament_address: tournament_address || '',
          tournament_club_name: tournament_club_name || 'Recrea Padel Club', // Valor por defecto
          signup_limit_date,
          inscription_cost: Number(inscription_cost) || 0,
          first_place_prize: first_place_prize || '',
          second_place_prize: second_place_prize || '',
          third_place_prize: third_place_prize || '',
          tournament_thumbnail: tournament_thumbnail || '',
          requires_shirts: Boolean(requires_shirts) // Campo para indicar si se requieren talles de remera
        })
        .select();
    });

    try {
      const tournamentInfoResults = await Promise.all(tournamentInfoPromises);
      const errors = tournamentInfoResults.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errores creando tournament_info:', errors);
        return res.status(500).json({ 
          message: 'Los torneos se crearon pero hubo errores al guardar la información adicional',
          errors: errors.map(e => e.error.message)
        });
      }

      // Combinar la información de torneos con su info adicional
      const completeTournaments = tournaments.map((tournament, index) => ({
        ...tournament,
        tournament_info: tournamentInfoResults[index].data[0]
      }));

      // 🏢 CREAR RELACIONES DE SEDES (MULTI-SEDE)
      if (validatedVenues && validatedVenues.length > 0) {
        console.log('🏢 Asignando sedes a torneos:', validatedVenues.length, 'sedes');
        
        // Crear relaciones para cada torneo creado
        for (const tournament of tournaments) {
          for (const venueConfig of validatedVenues) {
            // 1. Insertar la relación torneo-sede
            const { data: tournamentVenue, error: tournamentVenueError } = await supabase
              .from('tournament_venues')
              .insert({
                tournament_id: tournament.id,
                venue_id: venueConfig.venue_id,
                courts_count: venueConfig.courts_count,
                is_primary: venueConfig.is_primary
              })
              .select()
              .single();
            
            if (tournamentVenueError) {
              console.error('❌ Error creando relación torneo-sede:', tournamentVenueError);
              continue;
            }
            
            // 2. Insertar las relaciones torneo-sede-canchas
            const courtRelations = venueConfig.court_ids.map((court_id, index) => ({
              tournament_venue_id: tournamentVenue.id,
              court_id: court_id,
              is_available: true,
              priority: index
            }));
            
            const { error: courtsError } = await supabase
              .from('tournament_venue_courts')
              .insert(courtRelations);
            
            if (courtsError) {
              console.error('❌ Error asignando canchas a sede:', courtsError);
            } else {
              console.log(`✅ Sede "${venueConfig.venue_name}" asignada con ${venueConfig.courts_count} canchas al torneo ${tournament.id}`);
            }
          }
        }
        
        console.log('✅ Sedes asignadas exitosamente a todos los torneos');
      } else {
        console.log('ℹ️ No se asignaron sedes multi-sede a este torneo (modo tradicional)');
      }

      // 🏆 CREAR RELACIONES DE SPONSORS (OPCIONAL)
      if (sponsor_ids && Array.isArray(sponsor_ids) && sponsor_ids.length > 0) {
        console.log('🏆 Asignando sponsors a torneos:', sponsor_ids);
        
        // Crear relaciones para cada torneo creado
        const sponsorRelations = [];
        tournaments.forEach(tournament => {
          sponsor_ids.forEach(sponsor_id => {
            sponsorRelations.push({
              tournament_id: tournament.id,
              sponsor_id: sponsor_id
            });
          });
        });

        // Insertar todas las relaciones de sponsors
        const { error: sponsorRelationsError } = await supabase
          .from('tournament_sponsors')
          .insert(sponsorRelations);

        if (sponsorRelationsError) {
          console.error('❌ Error creando relaciones de sponsors:', sponsorRelationsError);
          // No fallar la creación del torneo por esto, solo loggear el error
        } else {
          console.log('✅ Sponsors asignados exitosamente a todos los torneos');
        }
      } else {
        console.log('ℹ️ No se asignaron sponsors a este torneo');
      }

      // 📧 ENVIAR NOTIFICACIONES DE NUEVO TORNEO
      // Se ejecuta en background para no bloquear la respuesta
      const tournamentData = {
        name,
        categories,
        start_date,
        end_date,
        courts_available,
        tournament_type
      };
      
      const tournamentInfo = {
        description,
        inscription_cost,
        signup_limit_date,
        first_place_prize,
        second_place_prize,
        third_place_prize
      };

      // Ejecutar notificaciones en background (no bloquea la respuesta)
      sendTournamentNotification(tournamentData, tournamentInfo)
        .then(result => {
          if (result?.error) {
            console.error('❌ Error en notificaciones:', result.error);
          } else {
            console.log(`📧 Notificaciones completadas: ${result?.successful || 0} enviadas`);
          }
        })
        .catch(error => {
          console.error('❌ Error inesperado en notificaciones:', error);
        });

      return res.status(201).json({ 
        message: 'Torneos creados exitosamente con toda su información', 
        torneos: completeTournaments,
        venues: validatedVenues.length > 0 ? validatedVenues : null,
        notifications: {
          status: 'enviando',
          message: 'Las notificaciones por email se están enviando en segundo plano'
        }
      });
    } catch (error) {
      console.error('Error creating tournament_info:', error);
      return res.status(500).json({ 
        message: 'Los torneos se crearon pero hubo un error al guardar la información adicional',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function changeTournamentType(req, res) {
  const { id } = req.params;
  const { new_tournament_type } = req.body;

  console.log(`🔄 Cambiando tipo de torneo: ${id} → ${new_tournament_type}`);

  try {
    // 1. Validaciones básicas
    if (!new_tournament_type || !['SIX_PLAYERS', 'NINE_PLAYERS', 'TWELVE_PLAYERS', 'SIXTEEN_PLAYERS'].includes(new_tournament_type)) {
      return res.status(400).json({ 
        message: 'new_tournament_type es requerido y debe ser SIX_PLAYERS, NINE_PLAYERS, TWELVE_PLAYERS o SIXTEEN_PLAYERS' 
      });
    }

    // 2. Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, max_teams, start_date, end_date, status')
      .eq('id', id)
      .single();

    if (tournamentError) throw tournamentError;
    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    // 3. Verificar que no sea el mismo tipo
    if (tournament.tournament_type === new_tournament_type) {
      return res.status(400).json({ 
        message: `El torneo ya es de tipo ${new_tournament_type}` 
      });
    }

    // 4. Obtener equipos inscritos para información (NO restricción)
    const { data: registeredTeams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select('id')
      .eq('tournament_id', id);

    if (teamsError) throw teamsError;

    const currentTeamsCount = registeredTeams ? registeredTeams.length : 0;

    // 5. Verificar que no haya grupos generados
    console.log(`🔍 Verificando grupos existentes para torneo: ${id}`);
    const { data: existingGroups, error: groupsError } = await supabase
      .from('tournament_groups')
      .select('id, group_number')
      .eq('tournament_id', id);

    if (groupsError) {
      console.error('❌ Error obteniendo grupos:', groupsError);
      throw groupsError;
    }

    console.log(`📊 Grupos encontrados: ${existingGroups?.length || 0}`, existingGroups);

    if (existingGroups && existingGroups.length > 0) {
      console.log(`⚠️ No se puede cambiar tipo: hay ${existingGroups.length} grupos generados`);
      return res.status(400).json({ 
        message: 'No se puede cambiar el tipo con grupos ya generados. Primero elimine los grupos.' 
      });
    }

    // 6. Calcular nuevo max_teams
    const newMaxTeams = new_tournament_type === 'SIX_PLAYERS' ? 6 :
                       new_tournament_type === 'NINE_PLAYERS' ? 9 : 
                       new_tournament_type === 'TWELVE_PLAYERS' ? 12 : 16;

    // 6.5. ✨ VALIDACIÓN DE CAPACIDAD: Verificar viabilidad del cambio
    console.log(`🔍 Validando capacidad para cambio a ${new_tournament_type}...`);
    
    // Obtener TODAS las categorías del mismo evento
    const { data: allEventCategories, error: eventCategoriesError } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, category_id, courts_available, start_date, end_date')
      .eq('name', tournament.name)
      .eq('start_date', tournament.start_date)
      .eq('end_date', tournament.end_date);
    
    if (eventCategoriesError) throw eventCategoriesError;
    
    // Calcular partidos por tipo de torneo
    const getMatchesForType = (type) => {
      switch(type) {
        case 'SIX_PLAYERS': return 6;      // 2 grupos × 3 partidos
        case 'NINE_PLAYERS': return 9;     // 3 grupos × 3 partidos
        case 'TWELVE_PLAYERS': return 12;  // 4 grupos × 3 partidos
        case 'SIXTEEN_PLAYERS': return 24; // 4 grupos × 6 partidos (4 equipos por grupo)
        default: return 0;
      }
    };
    
    // Calcular total de partidos considerando el cambio
    let totalMatchesNeeded = 0;
    allEventCategories.forEach(cat => {
      if (cat.id === id) {
        // Esta categoría cambiará al nuevo tipo
        totalMatchesNeeded += getMatchesForType(new_tournament_type);
      } else {
        // Otras categorías mantienen su tipo actual
        totalMatchesNeeded += getMatchesForType(cat.tournament_type);
      }
    });
    
    // Calcular slots disponibles
    const DAY_1_SLOTS = 8;  // 17:00-23:00
    const DAY_2_SLOTS = 20; // 08:00-23:00
    const TOTAL_SLOTS_PER_COURT = DAY_1_SLOTS + DAY_2_SLOTS; // 28
    
    // Obtener courts_available del evento
    const courtsAvailable = allEventCategories[0]?.courts_available || tournament.courts_available || 1;
    const totalAvailableSlots = TOTAL_SLOTS_PER_COURT * courtsAvailable;
    
    const utilizationPercentage = ((totalMatchesNeeded / totalAvailableSlots) * 100).toFixed(1);
    const surplus = totalAvailableSlots - totalMatchesNeeded;
    
    console.log(`📊 Análisis de capacidad:`);
    console.log(`   - Categorías del evento: ${allEventCategories.length}`);
    console.log(`   - Partidos necesarios: ${totalMatchesNeeded}`);
    console.log(`   - Slots disponibles: ${totalAvailableSlots} (${TOTAL_SLOTS_PER_COURT} × ${courtsAvailable} canchas)`);
    console.log(`   - Utilización: ${utilizationPercentage}%`);
    console.log(`   - Sobra/Falta: ${surplus > 0 ? '+' : ''}${surplus} slots`);
    
    // VALIDACIÓN: Rechazar si no hay capacidad
    if (totalMatchesNeeded > totalAvailableSlots) {
      const minCourtsNeeded = Math.ceil(totalMatchesNeeded / TOTAL_SLOTS_PER_COURT);
      
      console.log(`❌ Capacidad insuficiente: ${totalMatchesNeeded} partidos > ${totalAvailableSlots} slots`);
      
      return res.status(400).json({
        message: 'Capacidad insuficiente para este cambio de tipo',
        error: 'INSUFFICIENT_CAPACITY',
        details: {
          tournament_type_change: {
            from: tournament.tournament_type,
            to: new_tournament_type
          },
          capacity_analysis: {
            total_categories: allEventCategories.length,
            matches_needed: totalMatchesNeeded,
            slots_available: totalAvailableSlots,
            deficit: Math.abs(surplus),
            utilization_percentage: `${utilizationPercentage}%`
          },
          current_configuration: {
            courts_available: courtsAvailable,
            slots_per_court: TOTAL_SLOTS_PER_COURT,
            day_1_slots: DAY_1_SLOTS,
            day_2_slots: DAY_2_SLOTS
          },
          suggestion: {
            message: `Se requieren al menos ${minCourtsNeeded} canchas para este evento con el nuevo tipo`,
            min_courts_needed: minCourtsNeeded,
            alternative: 'Reduce el número de categorías o elige un tipo de torneo con menos equipos'
          }
        }
      });
    }
    
    // ADVERTENCIA: Si la utilización es muy alta (> 95%)
    if (utilizationPercentage > 95 && surplus < 5) {
      console.log(`⚠️ Advertencia: Utilización muy alta (${utilizationPercentage}%)`);
    }
    
    console.log(`✅ Capacidad validada: El cambio es viable`);

    // 7. Actualizar el torneo
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({ 
        tournament_type: new_tournament_type,
        max_teams: newMaxTeams,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 8. ✨ NUEVA LÓGICA: Recalcular horarios para TODO el evento
    console.log(`🔄 [RECALCULAR] Actualizando horarios para el evento "${tournament.name}"`);

    await recalculateEventTimeSlots(
      tournament.name,
      tournament.start_date,
      tournament.end_date,
      updatedTournament.courts_available
    );

    // Log del cambio exitoso
    console.log(`✅ Tipo de torneo cambiado exitosamente: ${tournament.tournament_type} → ${new_tournament_type}`);
    console.log(`📊 Equipos inscritos mantenidos: ${currentTeamsCount}`);
    console.log(`🎯 Nuevo max_teams: ${newMaxTeams}`);

    // 9. Respuesta exitosa
    const formatTournamentType = (type) => {
      const typeConfig = {
        SIX_PLAYERS: '6 Jugadores',
        NINE_PLAYERS: '9 Jugadores',
        TWELVE_PLAYERS: '12 Jugadores', 
        SIXTEEN_PLAYERS: '16 Jugadores'
      }
      return typeConfig[type] || type
    }

    res.json({
      message: `Tipo de torneo cambiado exitosamente de ${formatTournamentType(tournament.tournament_type)} a ${formatTournamentType(new_tournament_type)}`,
      tournament: {
        id: updatedTournament.id,
        name: updatedTournament.name,
        old_type: formatTournamentType(tournament.tournament_type),
        new_type: formatTournamentType(updatedTournament.tournament_type),
        old_max_teams: tournament.max_teams,
        new_max_teams: updatedTournament.max_teams,
        status: updatedTournament.status
      },
      teams_info: {
        current_teams: currentTeamsCount,
        teams_maintained: true,
        max_teams_updated: newMaxTeams,
        note: 'Los equipos inscritos se mantienen automáticamente'
      },
      impact: {
        message: 'Los cupos compartidos han sido recalculados automáticamente',
        new_capacity: newMaxTeams,
        available_for_registration: true
      }
    });

  } catch (error) {
    console.error('❌ Error cambiando tipo de torneo:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      tournamentId: id,
      newType: new_tournament_type
    });
    res.status(500).json({ 
      message: 'Error interno al cambiar tipo de torneo',
      error: error.message 
    });
  }
}

/**
 * 📧 ENVIAR NOTIFICACIÓN DE NUEVO TORNEO
 * Envía emails a todos los usuarios con role 'user' notificando sobre el nuevo torneo
 */
// ========================================
// 📧 NOTIFICACIONES
// ========================================

async function sendTournamentNotification(tournamentData, tournamentInfo) {
  try {
    console.log(`📧 Enviando notificaciones de torneo: ${tournamentData.name}`);
    
    // 🧪 MODO DESARROLLO: Solo enviar a email de testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 MODO DESARROLLO: Enviando solo a fgwebdesign0@gmail.com');
      
      const testUser = {
        id: 'test-user',
        email: 'fgwebdesign0@gmail.com',
        first_name: 'Felipe',
        last_name: 'Gutierrez'
      };

      const result = await sendEmailToUser(testUser, tournamentData, tournamentInfo);
      console.log('✅ Email de prueba enviado exitosamente');
      return {
        total: 1,
        successful: result.success ? 1 : 0,
        failed: result.success ? 0 : 1,
        results: [result]
      };
    }

    // 🚀 MODO PRODUCCIÓN: Enviar a todos los usuarios
    // 1. Obtener todos los usuarios con role 'user'
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('role', 'user');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No hay usuarios para notificar');
      return;
    }

    console.log(`📊 Encontrados ${users.length} usuarios para notificar`);

    // 2. Configurar Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // 3. Cargar template de email
    const template = fs.readFileSync('./src/templates/tournamentNotification.html', 'utf8');
    const compiledTemplate = handlebars.compile(template);

    // 4. Obtener información de categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .in('id', tournamentData.categories);

    const categoryNames = categories?.map(cat => cat.name) || [];

    // 5. Preparar datos del template
    const templateData = {
      firstName: '', // Se personalizará por usuario
      tournamentName: tournamentData.name,
      startDate: new Date(tournamentData.start_date).toLocaleDateString('es-UY'),
      endDate: new Date(tournamentData.end_date).toLocaleDateString('es-UY'),
      courtsAvailable: tournamentData.courts_available,
      tournamentType: tournamentData.tournament_type === 'NINE_PLAYERS' ? '9 Jugadores' : '12 Jugadores',
      inscriptionCost: tournamentInfo?.inscription_cost || 'Consultar',
      signupLimitDate: tournamentInfo?.signup_limit_date ? 
        new Date(tournamentInfo.signup_limit_date).toLocaleDateString('es-UY') : null,
      categories: categoryNames,
      description: tournamentInfo?.description || '',
      prizes: {
        first: tournamentInfo?.first_place_prize || '',
        second: tournamentInfo?.second_place_prize || '',
        third: tournamentInfo?.third_place_prize || ''
      },
      registrationLink: `${process.env.WEB_URL || 'https://recreapadel.com'}/tournaments`,
      webUrl: process.env.WEB_URL || 'https://recreapadel.com',
      year: new Date().getFullYear()
    };

    // 6. Enviar emails con rate limiting
    const emailPromises = users.map(async (user, index) => {
      // Rate limiting: esperar 100ms entre emails para evitar límites de Resend
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      const personalizedData = {
        ...templateData,
        firstName: user.first_name || 'Usuario'
      };

      const htmlContent = compiledTemplate(personalizedData);

      try {
        const result = await resend.emails.send({
          from: 'Recrea Padel Club <noreply@recreapadel.com>',
          to: user.email,
          subject: `🏆 ¡Nuevo Torneo: ${tournamentData.name}!`,
          html: htmlContent
        });

        console.log(`✅ Email enviado a ${user.email} (${user.first_name} ${user.last_name})`);
        return { success: true, email: user.email, result };
      } catch (error) {
        console.error(`❌ Error enviando email a ${user.email}:`, error);
        return { success: false, email: user.email, error };
      }
    });

    // 7. Ejecutar todos los envíos
    const results = await Promise.all(emailPromises);
    
    // 8. Estadísticas
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`);
    
    if (failed > 0) {
      console.error('❌ Emails fallidos:', results.filter(r => !r.success).map(r => r.email));
    }

    return {
      total: users.length,
      successful,
      failed,
      results
    };

  } catch (error) {
    console.error('❌ Error en sendTournamentNotification:', error);
    // No lanzamos el error para no afectar la creación del torneo
    return { error: error.message };
  }
}

/**
 * 📧 FUNCIÓN AUXILIAR: Enviar email a un usuario específico
 */
async function sendEmailToUser(user, tournamentData, tournamentInfo) {
  try {
    // Configurar Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Cargar template de email
    const template = fs.readFileSync('./src/templates/tournamentNotification.html', 'utf8');
    const compiledTemplate = handlebars.compile(template);

    // Obtener información de categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .in('id', tournamentData.categories);

    const categoryNames = categories?.map(cat => cat.name) || [];

    // Preparar datos del template
    const templateData = {
      firstName: user.first_name || 'Usuario',
      tournamentName: tournamentData.name,
      startDate: new Date(tournamentData.start_date).toLocaleDateString('es-UY'),
      endDate: new Date(tournamentData.end_date).toLocaleDateString('es-UY'),
      courtsAvailable: tournamentData.courts_available,
      tournamentType: tournamentData.tournament_type === 'NINE_PLAYERS' ? '9 Jugadores' : '12 Jugadores',
      inscriptionCost: tournamentInfo?.inscription_cost || 'Consultar',
      signupLimitDate: tournamentInfo?.signup_limit_date ? 
        new Date(tournamentInfo.signup_limit_date).toLocaleDateString('es-UY') : null,
      categories: categoryNames,
      description: tournamentInfo?.description || '',
      prizes: {
        first: tournamentInfo?.first_place_prize || '',
        second: tournamentInfo?.second_place_prize || '',
        third: tournamentInfo?.third_place_prize || ''
      },
      registrationLink: `${process.env.WEB_URL || 'https://recreapadel.com'}/tournaments`,
      webUrl: process.env.WEB_URL || 'https://recreapadel.com',
      year: new Date().getFullYear()
    };

    const htmlContent = compiledTemplate(templateData);

    // Enviar email
    const result = await resend.emails.send({
      from: 'Recrea Padel Club <noreply@recreapadel.com>',
      to: user.email,
      subject: `🏆 ¡Nuevo Torneo: ${tournamentData.name}!`,
      html: htmlContent
    });

    console.log(`✅ Email enviado a ${user.email} (${user.first_name} ${user.last_name})`);
    return { success: true, email: user.email, result };

  } catch (error) {
    console.error(`❌ Error enviando email a ${user.email}:`, error);
    return { success: false, email: user.email, error };
  }
}

/**
 * 📧 ENVIAR NOTIFICACIÓN DE CLASIFICACIÓN A ELIMINATORIAS
 * Envía emails a los equipos clasificados con información de su próximo partido
 */
async function sendEliminationBracketEmails(tournamentId, eliminationMatches, qualifiedTeams) {
  try {
    console.log(`📧 Enviando notificaciones de clasificación a ${qualifiedTeams.length} equipos`);
    
    // 🧪 MODO DESARROLLO: Solo enviar a email de testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 MODO DESARROLLO: Enviando solo a fgwebdesign0@gmail.com');
      
      // Crear un equipo de prueba para testing
      const testTeam = {
        team_id: 'test-team',
        player1: { first_name: 'Felipe', last_name: 'Gutierrez' },
        player2: { first_name: 'Test', last_name: 'User' },
        email: 'fgwebdesign0@gmail.com'
      };
      
      const result = await sendEliminationEmailToTeam(testTeam, eliminationMatches[0], tournamentId);
      console.log('✅ Email de prueba enviado exitosamente');
      return {
        total: 1,
        successful: result.success ? 1 : 0,
        failed: result.success ? 0 : 1,
        results: [result]
      };
    }

    // 🚀 MODO PRODUCCIÓN: Enviar a todos los equipos clasificados
    if (!qualifiedTeams || qualifiedTeams.length === 0) {
      console.log('⚠️ No hay equipos clasificados para notificar');
      return;
    }

    console.log(`📊 Encontrados ${qualifiedTeams.length} equipos clasificados para notificar`);

    // Configurar Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Cargar template de email
    const template = fs.readFileSync('./src/templates/eliminationBracketNotification.html', 'utf8');
    const compiledTemplate = handlebars.compile(template);

    // Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) {
      console.error('❌ Error obteniendo información del torneo:', tournamentError);
      return;
    }

    // Obtener información de canchas
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name');
      
    if (courtsError) {
      console.error('❌ Error obteniendo información de canchas:', courtsError);
      return;
    }

    // Crear mapa de canchas para acceso rápido
    const courtsMap = courts.reduce((acc, court) => {
      acc[court.id] = court.name;
      return acc;
    }, {});

    // Enviar emails con rate limiting
    const emailPromises = qualifiedTeams.map(async (team, index) => {
      // Rate limiting: esperar 100ms entre emails para evitar límites de Resend
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      // Buscar el partido del equipo en las eliminatorias
      const teamMatch = eliminationMatches.find(match => 
        match.home_team_id === team.team_id || match.away_team_id === team.team_id
      );

      if (!teamMatch) {
        console.log(`⚠️ No se encontró partido para el equipo ${team.team_id}`);
        return { success: false, team_id: team.team_id, error: 'No match found' };
      }

      // Determinar si es home o away team
      const isHomeTeam = teamMatch.home_team_id === team.team_id;
      const rivalTeamId = isHomeTeam ? teamMatch.away_team_id : teamMatch.home_team_id;
      
      // Buscar información del rival
      const rivalTeam = qualifiedTeams.find(t => t.team_id === rivalTeamId);
      
      if (!rivalTeam) {
        console.log(`⚠️ No se encontró información del rival para el equipo ${team.team_id}`);
        return { success: false, team_id: team.team_id, error: 'Rival team not found' };
      }

      // Preparar datos del template
      const templateData = {
        player1Name: team.player1 ? `${team.player1.first_name} ${team.player1.last_name}` : 'Jugador 1',
        player2Name: team.player2 ? `${team.player2.first_name} ${team.player2.last_name}` : 'Jugador 2',
        categoryName: tournament.categories?.name || 'Categoría',
        tournamentName: tournament.name,
        eliminationPhase: getEliminationPhaseName(teamMatch.elimination_round),
        matchDate: formatDate(teamMatch.match_day),
        matchTime: teamMatch.start_time,
        courtName: courtsMap[teamMatch.court_id] || 'Cancha',
        rivalTeam: rivalTeam.player1 && rivalTeam.player2 ? 
          `${rivalTeam.player1.first_name} ${rivalTeam.player1.last_name} & ${rivalTeam.player2.first_name} ${rivalTeam.player2.last_name}` : 
          'Equipo Rival'
      };

      const htmlContent = compiledTemplate(templateData);

      try {
        const result = await resend.emails.send({
          from: 'Recrea Padel Club <noreply@recreapadel.com>',
          to: team.email,
          subject: `🏆 ¡Clasificaste a Eliminatorias: ${tournament.name}!`,
          html: htmlContent
        });

        console.log(`✅ Email enviado a ${team.email} (${templateData.player1Name} & ${templateData.player2Name})`);
        return { success: true, email: team.email, result };
      } catch (error) {
        console.error(`❌ Error enviando email a ${team.email}:`, error);
        return { success: false, email: team.email, error };
      }
    });

    // Ejecutar todos los envíos
    const results = await Promise.all(emailPromises);
    
    // Estadísticas
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Notificaciones de clasificación enviadas: ${successful} exitosas, ${failed} fallidas`);
    
    if (failed > 0) {
      console.error('❌ Emails fallidos:', results.filter(r => !r.success).map(r => r.email));
    }

    return {
      total: qualifiedTeams.length,
      successful,
      failed,
      results
    };

  } catch (error) {
    console.error('❌ Error en sendEliminationBracketEmails:', error);
    return { error: error.message };
  }
}

/**
 * 📧 FUNCIÓN AUXILIAR: Enviar email de clasificación a un equipo específico
 */
async function sendEliminationEmailToTeam(team, match, tournamentId) {
  try {
    // Configurar Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Cargar template de email
    const template = fs.readFileSync('./src/templates/eliminationBracketNotification.html', 'utf8');
    const compiledTemplate = handlebars.compile(template);

    // Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;

    // Preparar datos del template
    const templateData = {
      player1Name: team.player1 ? `${team.player1.first_name} ${team.player1.last_name}` : 'Jugador 1',
      player2Name: team.player2 ? `${team.player2.first_name} ${team.player2.last_name}` : 'Jugador 2',
      categoryName: tournament.categories?.name || 'Categoría',
      tournamentName: tournament.name,
      eliminationPhase: getEliminationPhaseName(match.elimination_round),
      matchDate: formatDate(match.match_day),
      matchTime: match.start_time,
      courtName: 'Cancha de Prueba',
      rivalTeam: 'Equipo Rival de Prueba'
    };

    const htmlContent = compiledTemplate(templateData);

    // Enviar email
    const result = await resend.emails.send({
      from: 'Recrea Padel Club <noreply@recreapadel.com>',
      to: team.email,
      subject: `🏆 ¡Clasificaste a Eliminatorias: ${tournament.name}!`,
      html: htmlContent
    });

    console.log(`✅ Email enviado a ${team.email} (${templateData.player1Name} & ${templateData.player2Name})`);
    return { success: true, email: team.email, result };

  } catch (error) {
    console.error(`❌ Error enviando email a ${team.email}:`, error);
    return { success: false, email: team.email, error };
  }
}

/**
 * 🔧 FUNCIÓN AUXILIAR: Obtener nombre de la fase eliminatoria
 */
function getEliminationPhaseName(eliminationRound) {
  const phaseNames = {
    'octavos': 'Octavos de Final',
    'quarterfinals': 'Cuartos de Final',
    'semifinals': 'Semifinales',
    'final': 'Final'
  };
  return phaseNames[eliminationRound] || eliminationRound;
}

/**
 * 🔒 VALIDAR CAPACIDAD DE SLOTS
 * Valida que los slots seleccionados no excedan el límite de equipos permitidos
 * @param {string} tournamentId - ID del torneo
 * @param {Array} selectedSlots - Array de slots seleccionados (formato "HH:MM")
 * @param {string} currentTeamId - ID del equipo actual (opcional, para actualizaciones)
 * @returns {Object} { valid: boolean, message: string, details: object }
 */
async function validateSlotCapacity(tournamentId, selectedSlots, currentTeamId = null) {
  try {
    // 1. Obtener información del torneo (especialmente número de canchas)
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('group_time_slots')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('❌ Error obteniendo torneo:', tournamentError);
      return {
        valid: false,
        message: 'Error al validar capacidad de slots',
        details: { error: tournamentError?.message }
      };
    }

    // Obtener número de canchas desde el primer slot
    const courts = tournament.group_time_slots?.[0]?.courts || 2;
    const MAX_TEAMS_PER_SLOT = MAX_RESTRICTIONS_PER_SLOT_PER_COURT * courts;

    // 2. Obtener todas las restricciones existentes del torneo (IMPORTANTE: buscar en todo el evento)
    const { data: eventTournaments } = await supabase
      .from('tournaments')
      .select('id')
      .eq('name', tournament.name || '');
    
    const eventTournamentIds = eventTournaments ? eventTournaments.map(t => t.id) : [tournamentId];

    const { data: allTeamRestrictions, error } = await supabase
      .from('tournament_teams')
      .select('team_id, unavailable_times')
      .in('tournament_id', eventTournamentIds);

    if (error) {
      console.error('❌ Error obteniendo restricciones de equipos:', error);
      return {
        valid: false,
        message: 'Error al validar capacidad de slots',
        details: { error: error.message }
      };
    }

    // 3. Crear contador por slot ID completo (excluyendo el equipo actual si está actualizando)
    const slotUsageCount = {};
    
    (allTeamRestrictions || []).forEach(team => {
      // Si estamos actualizando, excluir el equipo actual del conteo
      if (currentTeamId && team.team_id === currentTeamId) {
        return;
      }

      if (team.unavailable_times && Array.isArray(team.unavailable_times)) {
        team.unavailable_times.forEach(slotId => {
          // slotId puede ser formato nuevo ("slot_day1_1700") o viejo ("17:00")
          slotUsageCount[slotId] = (slotUsageCount[slotId] || 0) + 1;
        });
      }
    });

    // 4. Validar cada slot seleccionado
    const oversaturatedSlots = [];
    
    for (const selectedSlot of selectedSlots) {
      const currentUsage = slotUsageCount[selectedSlot] || 0;
      
      if (currentUsage >= MAX_TEAMS_PER_SLOT) {
        oversaturatedSlots.push({
          slot: selectedSlot,
          current_usage: currentUsage,
          max_allowed: MAX_TEAMS_PER_SLOT
        });
      }
    }

    // 5. Si hay slots sobresaturados, devolver error
    if (oversaturatedSlots.length > 0) {
      const slotsList = oversaturatedSlots.map(s => s.slot).join(', ');
      
      return {
        valid: false,
        message: `Los siguientes horarios ya alcanzaron el límite de restricciones: ${slotsList}`,
        details: {
          oversaturated_slots: oversaturatedSlots,
          max_teams_per_slot: MAX_TEAMS_PER_SLOT,
          courts: courts,
          suggestion: 'Por favor selecciona otros horarios menos restrictivos'
        }
      };
    }

    // 6. Validación exitosa
    return {
      valid: true,
      message: 'Slots disponibles para selección',
      details: {
        selected_slots: selectedSlots,
        max_teams_per_slot: MAX_TEAMS_PER_SLOT,
        courts: courts
      }
    };

  } catch (error) {
    console.error('❌ Error en validateSlotCapacity:', error);
    return {
      valid: false,
      message: 'Error inesperado al validar capacidad de slots',
      details: { error: error.message }
    };
  }
}

// ========================================
// 📝 INSCRIPCIONES - Registration & Join
// ========================================

export async function joinTournament(req, res) {
  const tournament_id = req.params.id;
  const { userId1, userId2, unavailable_time_slot, unavailable_times, shirt_sizes } = req.body; // Soporte para ambos formatos

  try {
    if (!userId1 || !userId2) return res.status(400).json({ message: 'userId1 y userId2 son requeridos' });
    if (userId1 === userId2) return res.status(400).json({ message: 'Los dos jugadores deben ser distintos' });
    
    // NUEVA LÓGICA VOLA: Soporte para múltiples horarios no disponibles
    let unavailableTimesArray = [];
    
    if (unavailable_times && Array.isArray(unavailable_times)) {
      // Formato VOLA: ["17:01", "18:01", "19:01", "20:01", "21:01"]
      unavailableTimesArray = unavailable_times;
    } else if (unavailable_time_slot && typeof unavailable_time_slot === 'string') {
      // Formato actual: "day1_evening"
      unavailableTimesArray = [unavailable_time_slot];
    } else {
      return res.status(400).json({ 
        message: 'Debe proporcionar horarios no disponibles',
        formats_supported: {
          vola_format: 'unavailable_times: ["17:01", "18:01", "19:01"]',
          current_format: 'unavailable_time_slot: "day1_evening"'
        }
      });
    }

    // Permitir 0 horarios (sin restricciones) - comentado para testing
    // if (unavailableTimesArray.length === 0) {
    //   return res.status(400).json({ message: 'Debe seleccionar al menos un horario no disponible' });
    // }

    // 1) Torneo
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select(`
        id, name, common_code, category_id, courts_available, time_slots, group_time_slots,
        tournament_type, max_teams, match_duration_minutes,
        tournament_info!inner ( requires_shirts )
      `)
      .eq('id', tournament_id)
      .single();
    if (tErr || !tournament) return res.status(404).json({ message: 'Tournament not found' });

    // 1.5) ✨ NUEVA VALIDACIÓN: Máximo 2 horarios no disponibles
    const MAX_UNAVAILABLE_TIMES = 2;

    if (unavailableTimesArray.length > MAX_UNAVAILABLE_TIMES) {
      return res.status(400).json({
        message: `Máximo ${MAX_UNAVAILABLE_TIMES} horarios no disponibles permitidos`,
        current_selection: unavailableTimesArray.length,
        max_allowed: MAX_UNAVAILABLE_TIMES,
        note: 'Selecciona máximo 2 horarios en los que NO puedas jugar'
      });
    }

    console.log(`✅ [VALIDACIÓN] ${unavailableTimesArray.length} horarios no disponibles (máx ${MAX_UNAVAILABLE_TIMES})`);

    // 1.5.1) ✨ VALIDACIÓN DE CAPACIDAD DE SLOTS
    const slotValidation = await validateSlotCapacity(tournament_id, unavailableTimesArray);
    if (!slotValidation.valid) {
      return res.status(400).json({
        message: slotValidation.message,
        details: slotValidation.details
      });
    }

    console.log(`✅ [VALIDACIÓN CAPACIDAD] Slots disponibles para selección`);

    // 1.6) Validación de remeras
    const VALID_SHIRT_SIZES = ['XS','S','M','L','XL','XXL'];
    if (tournament.tournament_info[0].requires_shirts) {
      if (!Array.isArray(shirt_sizes) || shirt_sizes.length === 0 || shirt_sizes.length > 2) {
        return res.status(400).json({ message: 'shirt_sizes es requerido (1–2 talles)', valid_sizes: VALID_SHIRT_SIZES });
      }
      const bad = shirt_sizes.filter(s => !VALID_SHIRT_SIZES.includes(s));
      if (bad.length) return res.status(400).json({ message: `Talles inválidos: ${bad.join(', ')}` });
    } else if (shirt_sizes !== undefined && shirt_sizes !== null) {
      return res.status(400).json({ message: 'Este torneo no incluye remeras' });
    }

    // 2) Usuarios existen
    const { data: users, error: uErr } = await supabase
      .from('users').select('id').in('id', [userId1, userId2]);
    if (uErr) return res.status(500).json({ message: uErr.message });
    if (!users || users.length !== 2) return res.status(400).json({ message: 'Uno o ambos usuarios no existen' });

    // 3) Validar que los slots seleccionados sean válidos (usando start time)
    if (!Array.isArray(tournament.group_time_slots) || tournament.group_time_slots.length === 0) {
      return res.status(400).json({ message: 'Torneo sin time_slots configurados' });
    }

    // Validar cada slot ID seleccionado (soporta formato nuevo "slot_day1_1700" y viejo "17:00")
    for (const unavailableTime of unavailableTimesArray) {
      const validSlot = tournament.group_time_slots.find(s =>
        s.id === unavailableTime || s.start === unavailableTime // Soportar ambos formatos
      );
      if (!validSlot) {
        return res.status(400).json({
          message: `Slot "${unavailableTime}" no es válido para fase de grupos`,
          valid_slots: tournament.group_time_slots.map(s => ({ id: s.id, start: s.start, label: s.label, day: s.tournament_day }))
        });
      }
    }

    // 4) Nadie de los dos ya está inscripto en este torneo
    const { data: existingPlayers, error: epErr } = await supabase
      .from('tournament_teams')
      .select('team_id, teams ( id, player1_id, player2_id )')
      .eq('tournament_id', tournament_id);
    if (epErr) return res.status(500).json({ message: epErr.message });

    const alreadyIn = (existingPlayers || []).some(reg => {
      const p1 = reg.teams?.player1_id, p2 = reg.teams?.player2_id;
      return p1 === userId1 || p1 === userId2 || p2 === userId1 || p2 === userId2;
    });
    if (alreadyIn) return res.status(400).json({ message: 'Uno o ambos jugadores ya están registrados en este torneo' });

    // 5) Verificar cupo total del torneo
    const maxTeams = Number.isInteger(tournament.max_teams)
      ? tournament.max_teams
      : (tournament.tournament_type === 'NINE_PLAYERS' ? 9 : 12);
    if ((existingPlayers || []).length >= maxTeams) {
      return res.status(400).json({ message: `El torneo está completo (máximo ${maxTeams} equipos)` });
    }

    // 7) Buscar/crear equipo
    const { data: existingTeam, error: findTeamErr } = await supabase
      .from('teams')
      .select('id')
      .or(`and(player1_id.eq.${userId1},player2_id.eq.${userId2}),and(player1_id.eq.${userId2},player2_id.eq.${userId1})`)
      .limit(1).single();
    if (findTeamErr && findTeamErr.code !== 'PGRST116') return res.status(500).json({ message: findTeamErr.message });

    let teamId = existingTeam?.id;
    if (!teamId) {
      const { data: createdTeam, error: teamErr } = await supabase
        .from('teams').insert({ player1_id: userId1, player2_id: userId2 }).select('id').single();
      if (teamErr) return res.status(500).json({ message: teamErr.message });
      teamId = createdTeam.id;
    }

    // 8) Registrar inscripción con formato VOLA
    const insertPayload = {
      tournament_id,
      team_id: teamId,
      unavailable_times: unavailableTimesArray, // Array de horarios no disponibles (formato VOLA)
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    if (tournament.tournament_info[0].requires_shirts) insertPayload.shirt_sizes = shirt_sizes;

    const { error: joinErr } = await supabase.from('tournament_teams').insert(insertPayload);
    if (joinErr) return res.status(500).json({ message: joinErr.message });

    // 9) Respuesta con formato VOLA
    return res.status(201).json({
      message: 'Inscripción realizada correctamente',
      unavailable_times: unavailableTimesArray,
      team_id: teamId,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        category: tournament.category,
        start_date: tournament.start_date,
        end_date: tournament.end_date
      }
    });
  } catch (error) {
    console.error('joinTournament error:', error);
    return res.status(500).json({ message: error.message });
  }
}


/**
 * Actualizar estado de pago de un equipo en torneo
 */
// ========================================
// 💰 PAGOS
// ========================================

export async function updateTeamPaymentStatus(req, res) {
  const { tournamentId, teamId } = req.params;
  const { payment_status, payment_amount } = req.body;

  try {
    // Validaciones básicas
    if (!payment_status || !['pending', 'paid', 'failed'].includes(payment_status)) {
      return res.status(400).json({ 
        message: 'payment_status es requerido y debe ser: pending, paid o failed' 
      });
    }

    // Si se marca como pagado, obtener el costo de inscripción del torneo
    let finalPaymentAmount = payment_amount;
    if (payment_status === 'paid') {
      // Obtener el costo de inscripción del torneo
      const { data: tournamentInfo, error: infoError } = await supabase
        .from('tournament_info')
        .select('inscription_cost')
        .eq('tournament_id', tournamentId)
        .single();

      if (infoError || !tournamentInfo) {
        return res.status(404).json({ 
          message: 'Información del torneo no encontrada' 
        });
      }

      // Usar el costo del torneo si no se especifica un monto
      finalPaymentAmount = payment_amount || tournamentInfo.inscription_cost;
      
      if (finalPaymentAmount <= 0) {
        return res.status(400).json({ 
          message: 'El monto del pago debe ser mayor a 0' 
        });
      }
    }

    // Verificar que el equipo está registrado en el torneo
    const { data: tournamentTeam, error: checkError } = await supabase
      .from('tournament_teams')
      .select('id, tournament_id, team_id, payment_status')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .single();

    if (checkError || !tournamentTeam) {
      return res.status(404).json({ 
        message: 'Equipo no encontrado en este torneo' 
      });
    }

    // Preparar datos de actualización
    const updateData = {
      payment_status,
      updated_at: new Date().toISOString()
    };

    // Si se marca como pagado, agregar fecha y monto
    if (payment_status === 'paid') {
      updateData.payment_date = new Date().toISOString();
      updateData.payment_amount = finalPaymentAmount;
    } else if (payment_status === 'pending') {
      // Si se vuelve a pendiente, limpiar fecha y monto
      updateData.payment_date = null;
      updateData.payment_amount = null;
    }

    // Actualizar el registro
    const { data: updatedTeam, error: updateError } = await supabase
      .from('tournament_teams')
      .update(updateData)
      .eq('id', tournamentTeam.id)
      .select(`
        id,
        tournament_id,
        team_id,
        payment_status,
        payment_date,
        payment_amount,
        teams (
          id,
          player1_id,
          player2_id
        )
      `)
      .single();

    if (updateError) {
      return res.status(500).json({ 
        message: 'Error actualizando estado de pago',
        error: updateError.message 
      });
    }

    // Obtener información de los jugadores por separado
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`
        id,
        player1_id,
        player2_id,
        player1:users!player1_id (
          first_name,
          last_name
        ),
        player2:users!player2_id (
          first_name,
          last_name
        )
      `)
      .eq('id', updatedTeam.team_id)
      .single();

    if (teamError) {
      return res.status(500).json({ 
        message: 'Error obteniendo información del equipo',
        error: teamError.message 
      });
    }

    // Log del cambio
    console.log(`💰 Estado de pago actualizado: ${tournamentTeam.payment_status} → ${payment_status}`);
    if (payment_status === 'paid') {
      console.log(`💵 Monto: $${finalPaymentAmount}`);
    }

    return res.json({
      message: `Estado de pago actualizado a: ${payment_status}`,
      team: {
        id: updatedTeam.id,
        tournament_id: updatedTeam.tournament_id,
        team_id: updatedTeam.team_id,
        payment_status: updatedTeam.payment_status,
        payment_date: updatedTeam.payment_date,
        payment_amount: updatedTeam.payment_amount,
        players: {
          player1: teamData.player1 ? `${teamData.player1.first_name} ${teamData.player1.last_name}` : 'N/A',
          player2: teamData.player2 ? `${teamData.player2.first_name} ${teamData.player2.last_name}` : 'N/A'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando estado de pago:', error);
    return res.status(500).json({
      message: 'Error interno al actualizar estado de pago',
      error: error.message
    });
  }
}

/**
 * Registra un equipo en un torneo desde el panel de administración
 * Misma lógica que joinTournament pero ejecutada por admin
 */
export async function adminRegisterTeam(req, res) {
  const tournament_id = req.params.id;
  const { userId1, userId2, unavailable_time_slot, unavailable_times, shirt_sizes } = req.body;

  try {
    // ---------- 0) Validaciones básicas de body (IDÉNTICAS A joinTournament) ----------
    if (!userId1 || !userId2) {
      return res.status(400).json({ 
        message: 'userId1 y userId2 son requeridos' 
      });
    }
    if (userId1 === userId2) {
      return res.status(400).json({ 
        message: 'Los dos jugadores deben ser distintos' 
      });
    }

    // Validar horarios no disponibles (formato VOLA)
    let unavailableTimesArray = [];
    
    if (unavailable_times && Array.isArray(unavailable_times)) {
      // Formato VOLA: ["17:01", "18:01", "19:01", "20:01", "21:01"]
      unavailableTimesArray = unavailable_times;
    } else if (unavailable_time_slot && typeof unavailable_time_slot === 'string') {
      // Formato actual: "day1_evening"
      unavailableTimesArray = [unavailable_time_slot];
    } else {
      return res.status(400).json({ 
        message: 'Debe proporcionar horarios no disponibles',
        formats_supported: {
          vola_format: 'unavailable_times: ["17:01", "18:01", "19:01"]',
          current_format: 'unavailable_time_slot: "day1_evening"'
        }
      });
    }
    
    // Validar que al menos haya un horario no disponible
    if (unavailableTimesArray.length === 0) {
      return res.status(400).json({ message: 'Debe seleccionar al menos un horario no disponible' });
    }

    // ---------- 0.5) Validación de talles de remera (CONDICIONAL - se validará después de obtener el torneo) ----------
    // Esta validación se moverá después de obtener la información del torneo

    // ---------- 1) Torneo (IDÉNTICO A joinTournament) ----------
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select(`
        id, name, category_id, courts_available, time_slots, group_time_slots, tournament_type, max_teams,
        tournament_info!inner (
          requires_shirts
        )
      `)
      .eq('id', tournament_id)
      .single();

    if (tErr || !tournament) {
      return res.status(404).json({ 
        message: 'Tournament not found' 
      });
    }

    // ---------- 1.5) ✨ NUEVA VALIDACIÓN: Máximo 2 horarios no disponibles ----------
    const MAX_UNAVAILABLE_TIMES = 2;

    if (unavailableTimesArray.length > MAX_UNAVAILABLE_TIMES) {
      return res.status(400).json({
        message: `Máximo ${MAX_UNAVAILABLE_TIMES} horarios no disponibles permitidos`,
        current_selection: unavailableTimesArray.length,
        max_allowed: MAX_UNAVAILABLE_TIMES,
        note: 'Selecciona máximo 2 horarios en los que NO puedas jugar'
      });
    }

    console.log(`✅ [VALIDACIÓN ADMIN] ${unavailableTimesArray.length} horarios no disponibles (máx ${MAX_UNAVAILABLE_TIMES})`);

    // ---------- 1.5.1) ✨ VALIDACIÓN DE CAPACIDAD DE SLOTS ----------
    const slotValidation = await validateSlotCapacity(tournament_id, unavailableTimesArray);
    if (!slotValidation.valid) {
      return res.status(400).json({
        message: slotValidation.message,
        details: slotValidation.details
      });
    }

    console.log(`✅ [VALIDACIÓN CAPACIDAD ADMIN] Slots disponibles para selección`);

    // ---------- 1.6) Validación de talles de remera (CONDICIONAL) ----------
    const VALID_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    // Solo validar si el torneo requiere remeras
    if (tournament.tournament_info[0].requires_shirts) {
      if (!shirt_sizes || !Array.isArray(shirt_sizes)) {
        return res.status(400).json({ 
          message: 'shirt_sizes es requerido y debe ser un array (este torneo incluye remeras)',
          valid_sizes: VALID_SHIRT_SIZES,
          example: ['M', 'L']
        });
      }
      
      if (shirt_sizes.length === 0 || shirt_sizes.length > 2) {
        return res.status(400).json({ 
          message: 'shirt_sizes debe contener entre 1 y 2 talles (uno por jugador)',
          received: shirt_sizes.length,
          valid_sizes: VALID_SHIRT_SIZES
        });
      }
      
      const invalidSizes = shirt_sizes.filter(size => !VALID_SHIRT_SIZES.includes(size));
      if (invalidSizes.length > 0) {
        return res.status(400).json({ 
          message: `Talles inválidos: ${invalidSizes.join(', ')}`,
          valid_sizes: VALID_SHIRT_SIZES,
          received: shirt_sizes
        });
      }
    } else {
      // Si el torneo no requiere remeras, shirt_sizes debe ser null o undefined
      if (shirt_sizes !== undefined && shirt_sizes !== null) {
        return res.status(400).json({ 
          message: 'shirt_sizes no es requerido para este torneo (no incluye remeras)',
          tournament_requires_shirts: false
        });
      }
    }

    // ---------- 2) Usuarios existen (IDÉNTICO A joinTournament) ----------
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', [userId1, userId2]);

    if (uErr) {
      return res.status(500).json({ 
        message: uErr.message 
      });
    }
    if (!users || users.length !== 2) {
      return res.status(400).json({ 
        message: 'Uno o ambos usuarios no existen' 
      });
    }

    // ---------- 3) Time slot válido dentro de group_time_slots (IDÉNTICO A joinTournament) ----------
    if (!Array.isArray(tournament.group_time_slots) || tournament.group_time_slots.length === 0) {
      return res.status(400).json({ 
        message: 'Torneo sin time_slots configurados' 
      });
    }
    // Validación de time slot eliminada - ahora usamos formato VOLA

    // ---------- 4) Nadie de los dos ya está inscripto en este torneo (IDÉNTICO A joinTournament) ----------
    const { data: existingPlayers, error: epErr } = await supabase
      .from('tournament_teams')
      .select(`
        team_id,
        teams (
          id,
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournament_id);

    if (epErr) {
      return res.status(500).json({ 
        message: epErr.message 
      });
    }

    const someoneAlreadyInTournament = (existingPlayers || []).some(reg => {
      const p1 = reg.teams?.player1_id;
      const p2 = reg.teams?.player2_id;
      return p1 === userId1 || p1 === userId2 || p2 === userId1 || p2 === userId2;
    });

    if (someoneAlreadyInTournament) {
      return res.status(400).json({ 
        message: 'Uno o ambos jugadores ya están registrados en este torneo' 
      });
    }

    // ---------- 5) Cupo del torneo (IDÉNTICO A joinTournament) ----------
    const maxTeams = Number.isInteger(tournament.max_teams)
      ? tournament.max_teams
      : (tournament.tournament_type === 'NINE_PLAYERS' ? 9 : 12);

    if ((existingPlayers || []).length >= maxTeams) {
      return res.status(400).json({ 
        message: `El torneo está completo (máximo ${maxTeams} equipos)` 
      });
    }

    // Validación de cupos por slot eliminada - ahora usamos formato VOLA

    // ---------- 7) Buscar o crear el equipo (IDÉNTICO A joinTournament) ----------
    const { data: existingTeam, error: findTeamErr } = await supabase
      .from('teams')
      .select('id, player1_id, player2_id')
      .or(`and(player1_id.eq.${userId1},player2_id.eq.${userId2}),and(player1_id.eq.${userId2},player2_id.eq.${userId1})`)
      .limit(1)
      .single();

    if (findTeamErr && findTeamErr.code !== 'PGRST116') {
      // PGRST116 suele ser "no rows" en modo single(); la ignoramos
      return res.status(500).json({ 
        message: findTeamErr.message 
      });
    }

    let teamId = existingTeam?.id;

    if (!teamId) {
      const { data: createdTeam, error: teamErr } = await supabase
        .from('teams')
        .insert({
          player1_id: userId1,
          player2_id: userId2
        })
        .select('id')
        .single();

      if (teamErr) {
        return res.status(500).json({ 
          message: teamErr.message 
        });
      }

      teamId = createdTeam.id;
    }

    // ---------- 8) Registrar en tournament_teams con formato VOLA ----------
    const tournamentTeamData = {
      tournament_id,
      team_id: teamId,
      unavailable_times: unavailableTimesArray, // Array de horarios no disponibles (formato VOLA)
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Solo agregar shirt_sizes si el torneo requiere remeras
    if (tournament.tournament_info[0].requires_shirts) {
      tournamentTeamData.shirt_sizes = shirt_sizes;
    }
    
    const { data: tournamentTeam, error: joinErr } = await supabase
      .from('tournament_teams')
      .insert(tournamentTeamData)
      .select(`
        id,
        tournament_id,
        team_id,
        payment_status,
        teams (
          id,
          player1_id,
          player2_id,
          player1:users!player1_id (
            first_name,
            last_name
          ),
          player2:users!player2_id (
            first_name,
            last_name
          )
        )
      `)
      .single();

    if (joinErr) {
      return res.status(500).json({ 
        message: joinErr.message 
      });
    }

    // Log del registro (MEJORADO)
    console.log(`🎾 Equipo registrado por admin en torneo ${tournament_id}:`);
    console.log(`👥 Jugadores: ${users[0].first_name} ${users[0].last_name} & ${users[1].first_name} ${users[1].last_name}`);
    console.log(`⏰ Horarios no disponibles: ${unavailableTimesArray.join(', ')}`);

    return res.json({
      message: 'Equipo registrado exitosamente por administrador',
      tournament_team: {
        id: tournamentTeam.id,
        tournament_id: tournamentTeam.tournament_id,
        team_id: tournamentTeam.team_id,
        payment_status: tournamentTeam.payment_status,
        unavailable_times: unavailableTimesArray,
        players: {
          player1: tournamentTeam.teams?.player1 ? `${tournamentTeam.teams.player1.first_name} ${tournamentTeam.teams.player1.last_name}` : 'N/A',
          player2: tournamentTeam.teams?.player2 ? `${tournamentTeam.teams.player2.first_name} ${tournamentTeam.teams.player2.last_name}` : 'N/A'
        }
      }
    });

  } catch (error) {
    console.error('Error en adminRegisterTeam:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}

export async function getMatchesByTournamentId(req, res) {
  const tournament_id = req.params.id
  
  try {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        courts:court_id (
          id,
          name
        )
      `)
      .eq('tournament_id', tournament_id)
      .order('group_number', { ascending: true })
      .order('match_number', { ascending: true })

    if (error) {
      console.error('Error fetching matches:', error);
      return res.status(500).json({ message: error.message });
    }

    // Formatear datos para incluir nombre de cancha
    const formattedMatches = (data || []).map(match => ({
      ...match,
      court_name: match.courts?.name || null
    }));

    res.json({
      message: 'Matches fetched successfully', 
      matches: formattedMatches
    });
  } catch (error) {
    console.error('Error in getMatchesByTournamentId:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// 👥 GESTIÓN DE EQUIPOS Y GRUPOS
// ========================================

// Función para generar grupos con distribución inteligente basada en restricciones horarias
// MEJORADA: Ahora considera restricciones de todas las categorías del evento
async function generateTournamentGroups(tournament, teams, eventRestrictions = null) {
  const format = TOURNAMENT_FORMATS[tournament.tournament_type];
  
  console.log(`🎯 [GENERAR GRUPOS] Iniciando para torneo ${tournament.id} (${tournament.tournament_type})`);
  console.log(`📊 Equipos a distribuir: ${teams.length}`);
  
  // 1. Obtener las restricciones horarias de cada equipo del torneo actual
  const { data: teamConstraints, error: constraintsError } = await supabase
    .from('tournament_teams')
    .select('team_id, unavailable_times')
    .eq('tournament_id', tournament.id)
    .in('team_id', teams.map(t => t.id));

  if (constraintsError) throw new Error(`Error obteniendo restricciones: ${constraintsError.message}`);

  // 2. Crear mapa de equipos con sus restricciones (formato VOLA)
  const teamsWithConstraints = teams.map(team => {
    const constraint = teamConstraints.find(tc => tc.team_id === team.id);
    return {
      ...team,
      unavailable_times: constraint?.unavailable_times || null
    };
  });

  console.log(`🔍 [RESTRICCIONES] Equipos con restricciones:`, 
    teamsWithConstraints.filter(t => t.unavailable_times).map(t => ({
      team_id: t.id,
      unavailable_times: t.unavailable_times
    })));

  // NUEVA LÓGICA: 3. Considerar restricciones globales del evento si están disponibles
  if (eventRestrictions) {
    console.log(`🌍 [ANÁLISIS GLOBAL] Considerando restricciones de ${eventRestrictions.size} categorías del evento`);
    
    // Analizar conflictos potenciales entre categorías
    const globalRestrictions = new Map();
    for (const [categoryId, restrictions] of eventRestrictions) {
      for (const restriction of restrictions) {
        if (!globalRestrictions.has(restriction.unavailable_times)) {
          globalRestrictions.set(restriction.unavailable_times, []);
        }
        globalRestrictions.get(restriction.unavailable_times).push({
          category_id: categoryId,
          team_id: restriction.team_id
        });
      }
    }
    
    console.log(`⚠️ [CONFLICTOS POTENCIALES] Time slots con múltiples categorías:`,
      Array.from(globalRestrictions.entries())
        .filter(([slot, categories]) => categories.length > 1)
        .map(([slot, categories]) => `${slot}: ${categories.map(c => `Cat${c.category_id}`).join(', ')}`));
  }

  // 3b. Calcular slots disponibles por día (solo si hay contexto multi-categoría)
  let availableSlots = null;
  if (eventRestrictions) {
    console.log(`\n🏟️  [CÁLCULO DE CAPACIDAD] Analizando slots disponibles post otras categorías...`);

    // Obtener partidos YA PROGRAMADOS de OTRAS categorías del evento
    const { data: scheduledMatches, error: matchesErr } = await supabase
      .from('tournament_matches')
      .select('id, start_time, tournament_day, court_id')
      .not('start_time', 'is', null)
      .neq('tournament_id', tournament.id); // Solo otras categorías

    if (matchesErr) {
      console.error(`⚠️  Error obteniendo partidos programados:`, matchesErr);
    } else {
      // Contar slots ocupados por día
      const day1Matches = (scheduledMatches || []).filter(m => m.tournament_day === 1);
      const day2Matches = (scheduledMatches || []).filter(m => m.tournament_day === 2);

      // Obtener información del torneo para saber total de slots
      const totalSlotsDay1 = tournament.group_time_slots?.filter(s => s.tournament_day === 1).length || 16;
      const totalSlotsDay2 = tournament.group_time_slots?.filter(s => s.tournament_day === 2).length || 40;

      const occupiedDay1 = day1Matches.length;
      const occupiedDay2 = day2Matches.length;

      availableSlots = {
        day1: totalSlotsDay1 - occupiedDay1,
        day2: totalSlotsDay2 - occupiedDay2
      };

      console.log(`   DÍA 1: ${occupiedDay1} partidos programados → ${availableSlots.day1} slots libres`);
      console.log(`   DÍA 2: ${occupiedDay2} partidos programados → ${availableSlots.day2} slots libres`);
    }
  }

  // 4. Algoritmo de distribución inteligente por preferencia de día
  const distributedGroups = distributeTeamsByDayPreference(teamsWithConstraints, format, availableSlots);

  console.log(`✅ [DISTRIBUCIÓN] ${distributedGroups.length} grupos creados`);
  
  const groups = [];

  // 5. Crear grupos en la base de datos
  for (let i = 0; i < distributedGroups.length; i++) {
    const groupData = distributedGroups[i];
    const groupTeams = groupData.teams;
    const preferredDay = groupData.preferred_day;
    const isHomogeneous = groupData.is_homogeneous;

    console.log(`📝 [GRUPO ${i + 1}] Creando grupo (${preferredDay}, ${isHomogeneous ? 'HOMOGÉNEO' : 'MIXTO'}) con ${groupTeams.length} equipos:`,
      groupTeams.map(t => ({ id: t.id.substring(0, 8), pref: t.day_preference?.preference })));

    const { data: group, error } = await supabase
      .from('tournament_groups')
      .insert({
        tournament_id: tournament.id,
        group_number: i + 1,
        teams: groupTeams.map(t => t.id),
        preferred_day: preferredDay,
        is_homogeneous: isHomogeneous,
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (error) throw new Error(`Error creando grupo ${i + 1}: ${error.message}`);
    groups.push(group);

    // Generar partidos del grupo con asignación de día
    await generateGroupMatches(tournament.id, group.id, groupTeams, group.group_number, preferredDay);
  }

  console.log(`🎾 [PARTIDOS GENERADOS] Partidos de grupos creados para ${groups.length} grupos`);
  return groups;
}


// Helper para calcular duración de un slot en horas - MOVED TO LINE 3812

// ===== FUNCIÓN DE VALIDACIÓN DE COMPATIBILIDAD DE CATEGORÍAS =====

/**
 * Calcula el número máximo de categorías que el sistema puede manejar óptimamente
 * basado en la lógica de distribución de time slots compartidos
 */
function calculateMaxCategoriesForOptimalDistribution(tournamentType, courtsAvailable, durationDays) {
  // Configuración de partidos por equipo según formato
  const matchesPerTeam = tournamentType === 'SIXTEEN_PLAYERS' ? 3 : 2; // SIX_PLAYERS, NINE_PLAYERS, TWELVE_PLAYERS = 2 partidos
  
  // Configuración del sistema: partidos de 45 minutos
  const matchDurationMinutes = 45;
  const turnosPerHour = 60 / matchDurationMinutes; // 1.33 turnos por hora
  
  // Time slots disponibles en los días 1-2 (fase de grupos)
  // Día 1: 18:00-21:00 (3h) + 22:00-24:00 (2h) = 5 horas
  // Día 2: 08:00-12:00 (4h) + 13:00-17:00 (4h) + 18:00-21:00 (3h) + 22:00-01:00 (3h) = 14 horas
  // Total: 19 horas disponibles para fase de grupos
  const totalAvailableHours = 19;
  
  // Capacidad total del sistema (considerando todas las canchas)
  const totalSystemCapacity = totalAvailableHours * turnosPerHour * courtsAvailable;
  
  // Calcular capacidad por categoría
  let maxTeamsPerCategory;
  switch (tournamentType) {
    case 'SIX_PLAYERS':
      maxTeamsPerCategory = 6;
      break;
    case 'NINE_PLAYERS':
      maxTeamsPerCategory = 9;
      break;
    case 'TWELVE_PLAYERS':
      maxTeamsPerCategory = 12;
      break;
    case 'SIXTEEN_PLAYERS':
      maxTeamsPerCategory = 16;
      break;
    default:
      maxTeamsPerCategory = 12; // Default conservador
  }
  
  // Partidos totales por categoría
  const matchesPerCategory = (maxTeamsPerCategory * matchesPerTeam) / 2;
  
  // Calcular categorías máximas basado en capacidad del sistema
  const maxCategoriesByCapacity = Math.floor(totalSystemCapacity / matchesPerCategory);
  
  // Límites prácticos basados en la experiencia del sistema:
  // - Para mantener la lógica de distribución óptima
  // - Para evitar conflictos de horarios entre categorías
  // - Para mantener la eficiencia del algoritmo de programación
  
  let practicalLimit;
  switch (tournamentType) {
    case 'SIX_PLAYERS':
      // 6 equipos × 2 partidos = 6 partidos por categoría
      practicalLimit = courtsAvailable >= 8 ? 30 : 
                       courtsAvailable >= 6 ? 25 : 
                       courtsAvailable >= 4 ? 15 : 
                       courtsAvailable >= 3 ? 12 : 
                       courtsAvailable >= 2 ? 8 : 4;
      break;
    case 'NINE_PLAYERS':
      // 9 equipos × 2 partidos = 9 partidos por categoría
      practicalLimit = courtsAvailable >= 8 ? 22 : 
                       courtsAvailable >= 6 ? 15 : 
                       courtsAvailable >= 4 ? 8 : 
                       courtsAvailable >= 3 ? 5 : 
                       courtsAvailable >= 2 ? 4 : 2;
      break;
    case 'TWELVE_PLAYERS':
      // 12 equipos × 2 partidos = 12 partidos por categoría  
      practicalLimit = courtsAvailable >= 8 ? 16 : 
                       courtsAvailable >= 6 ? 12 : 
                       courtsAvailable >= 4 ? 8 : 
                       courtsAvailable >= 3 ? 6 : 
                       courtsAvailable >= 2 ? 4 : 1;
      break;
    case 'SIXTEEN_PLAYERS':
      // 16 equipos × 3 partidos = 24 partidos por categoría
      practicalLimit = courtsAvailable >= 8 ? 8 : 
                       courtsAvailable >= 6 ? 6 : 
                       courtsAvailable >= 4 ? 4 : 
                       courtsAvailable >= 3 ? 3 : 
                       courtsAvailable >= 2 ? 2 : 1;
      break;
    default:
      practicalLimit = 2; // Conservador
  }
  
  // Tomar el menor entre capacidad teórica y límite práctico
  const finalLimit = Math.min(maxCategoriesByCapacity, practicalLimit);
  
  console.log(`📊 Cálculo de categorías máximas:
    - Tipo: ${tournamentType}
    - Canchas: ${courtsAvailable}
    - Capacidad del sistema: ${totalSystemCapacity} partidos
    - Partidos por categoría: ${matchesPerCategory}
    - Límite por capacidad: ${maxCategoriesByCapacity}
    - Límite práctico: ${practicalLimit}
    - Límite final: ${finalLimit}`);
  
  return Math.max(1, finalLimit); // Mínimo 1 categoría
}


// Helper para obtener nombre del día en español
function getDayName(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

// Helper para formatear fecha como YYYY-MM-DD sin problemas de zona horaria
function formatDateSafe(date) {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
}

// Función auxiliar para agregar minutos a una hora
function addMinutesToTime(timeStr, minutes) {
  if (!timeStr || typeof timeStr !== 'string') {
    console.error('❌ addMinutesToTime: timeStr inválido:', timeStr);
    return '00:00';
  }
  
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) {
    console.error('❌ addMinutesToTime: formato de tiempo inválido:', timeStr);
    return '00:00';
  }
  
  const [hours, mins] = timeParts.map(Number);
  if (isNaN(hours) || isNaN(mins)) {
    console.error('❌ addMinutesToTime: números inválidos:', timeStr);
    return '00:00';
  }
  
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

/**
 * 🎯 GENERAR FASE DE GRUPOS CON ANÁLISIS GLOBAL DEL EVENTO
 * Analiza restricciones de todas las categorías del evento antes de agrupar
 */
export async function generateGroupsPhase(req, res) {
  const { id: tournament_id } = req.params;

  try {
    // 1) Obtener datos del torneo
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, max_teams, category_id, status')
      .eq('id', tournament_id)
      .single();

    if (tErr || !tournament) return res.status(404).json({ message: 'Tournament not found' });

    console.log(`📋 Torneo actual: ${tournament.name} (${tournament.tournament_type}) - Categoría: ${tournament.category_id}`);

    // NUEVA LÓGICA: 2) Obtener TODOS los torneos del mismo evento
    const { data: eventTournaments, error: eventErr } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, max_teams, category_id, status')
      .eq('name', tournament.name); // Mismo nombre = mismo evento

    if (eventErr) return res.status(500).json({ message: eventErr.message });

    console.log(`🎯 [EVENTO COMPLETO] Encontrados ${eventTournaments.length} torneos del evento:`, 
      eventTournaments.map(t => `${t.tournament_type} (Categoría: ${t.category_id})`));

    // 3) Verificar que no haya grupos ya generados en ESTE torneo específico
    const { data: existingGroups, error: groupsError } = await supabase
      .from('tournament_groups')
      .select('id, group_number')
      .eq('tournament_id', tournament_id);

    if (groupsError) return res.status(500).json({ message: groupsError.message });

    if (existingGroups && existingGroups.length > 0) {
      console.log(`⚠️ [CONFLICTO] Este torneo ya tiene ${existingGroups.length} grupos generados`);
      return res.status(400).json({ 
        message: `No se pueden generar grupos: este torneo ya tiene grupos generados. Primero elimine todos los grupos de este torneo.` 
      });
    }

    console.log(`✅ [VERIFICACIÓN] Este torneo no tiene grupos generados, procediendo con la generación...`);

    // 4) Traer equipos inscriptos del torneo actual
    const { data: tteams, error: teamsErr } = await supabase
      .from('tournament_teams')
      .select('team_id')
      .eq('tournament_id', tournament_id);
    if (teamsErr) return res.status(500).json({ message: teamsErr.message });

    const teams = (tteams || []).map(x => ({ id: x.team_id }));
    if (!teams.length) return res.status(400).json({ message: 'No hay equipos inscriptos' });

    // 5) Validación rápida contra el tipo (6, 9, 12 o 16)
    const expected = tournament.tournament_type === 'SIX_PLAYERS' ? 6 :
                    tournament.tournament_type === 'NINE_PLAYERS' ? 9 : 
                    tournament.tournament_type === 'TWELVE_PLAYERS' ? 12 : 16;
    if (teams.length !== expected) {
      return res.status(400).json({
        message: `Cantidad de equipos inválida: se esperaban ${expected} y hay ${teams.length}`
      });
    }

    console.log(`✅ [VALIDACIÓN] ${teams.length} equipos confirmados para ${tournament.tournament_type}`);

    // NUEVA LÓGICA: 6) Analizar restricciones de TODAS las categorías del evento
    console.log(`🔍 [ANÁLISIS GLOBAL] Analizando restricciones de todas las categorías...`);
    
    const eventRestrictions = new Map();
    for (const eventTournament of eventTournaments) {
      const { data: categoryTeams, error: catTeamsErr } = await supabase
        .from('tournament_teams')
        .select('team_id, unavailable_times')
        .eq('tournament_id', eventTournament.id);

      if (catTeamsErr) {
        console.error(`❌ Error obteniendo equipos de categoría ${eventTournament.category_id}:`, catTeamsErr);
        continue;
      }

      const categoryRestrictions = categoryTeams
        .filter(team => team.unavailable_times)
        .map(team => ({
          team_id: team.team_id,
          unavailable_times: team.unavailable_times,
          category_id: eventTournament.category_id,
          tournament_type: eventTournament.tournament_type
        }));

      eventRestrictions.set(eventTournament.category_id, categoryRestrictions);
      console.log(`📊 Categoría ${eventTournament.category_id}: ${categoryRestrictions.length} equipos con restricciones`);
    }

    // 7) Generar grupos del torneo actual con análisis global
    const groups = await generateTournamentGroups(tournament, teams, eventRestrictions);

    console.log(`✅ [GRUPOS GENERADOS] ${groups.length} grupos creados exitosamente`);

    return res.status(201).json({
      message: 'Grupos generados correctamente con análisis global de restricciones',
      tournament_id,
      tournament_name: tournament.name,
      tournament_type: tournament.tournament_type,
      category_id: tournament.category_id,
      event_analysis: {
        total_categories: eventTournaments.length,
        categories_analyzed: Array.from(eventRestrictions.keys()),
        total_restrictions_found: Array.from(eventRestrictions.values()).reduce((sum, arr) => sum + arr.length, 0)
      },
      groups_created: groups.map(g => ({
        id: g.id,
        group_number: g.group_number,
        teams: g.teams,
        teams_count: g.teams.length,
        preferred_day: g.preferred_day,
        is_homogeneous: g.is_homogeneous
      }))
    });
  } catch (err) {
    console.error('❌ generateGroupsPhase error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// --- Opcional: listar grupos creados ---
export async function getGroups(req, res) {
  try {
    const { data, error } = await supabase
      .from('tournament_groups')
      .select('*')
      .eq('tournament_id', req.params.id)
      .order('group_number', { ascending: true });
    if (error) return res.status(500).json({ message: error.message });
    res.json({ message: 'Grupos del torneo', groups: data });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function generateGroupMatches(tournament_id, group_id, groupTeams, group_number, preferredDay = null) {
  const matches = [];
  let matchCounter = 1;

  // Determinar el día de torneo según la preferencia del grupo
  let tournamentDay = null;
  if (preferredDay === 'DAY_1') {
    tournamentDay = 1;
  } else if (preferredDay === 'DAY_2') {
    tournamentDay = 2;
  }
  // Si es MIXED, dejamos tournamentDay null para que se asigne manualmente

  console.log(`🎾 Generando partidos para grupo ${group_number} (${preferredDay || 'SIN PREFERENCIA'}) - Día asignado: ${tournamentDay || 'POR DEFINIR'}`);

  // Todos contra todos (round-robin)
  // Para grupos de 3: 3 partidos (A vs B, A vs C, B vs C)
  // Para grupos de 4: 6 partidos (A vs B, A vs C, A vs D, B vs C, B vs D, C vs D)
  for (let i = 0; i < groupTeams.length; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      matches.push({
        tournament_id,
        group_id,
        group_number,
        home_team_id: groupTeams[i].id,
        away_team_id: groupTeams[j].id,
        round: 'group',
        stage: 'group',
        match_number: matchCounter,
        tournament_day: tournamentDay, // ✨ NUEVO: Asignación automática de día del torneo
        status: 'pending'
        // start_time y court_id se asignan después desde la UI/admin o algoritmo de scheduling
      });
      matchCounter++;
    }
  }

  console.log(`✅ ${matches.length} partidos creados${tournamentDay ? ` para el día ${tournamentDay}` : ' (día por asignar manualmente)'}`);

  const { error } = await supabase
    .from('tournament_matches')
    .insert(matches);

  if (error) throw new Error(`Error creando partidos de grupo: ${error.message}`);
}

export async function getTournamentTeams(req, res) {
  const tournament_id = req.params.id

  try {
    const { data: teams, error } = await supabase
      .from('tournament_teams')
      .select(`
        team_id,
        unavailable_times,
        shirt_sizes,
        teams (
          id,
          player1_id,
          player2_id,
          player1:users!teams_player1_id_fkey (
            first_name,
            last_name
          ),
          player2:users!teams_player2_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('tournament_id', tournament_id)

    if (error) throw error

    res.json({
      message: 'Tournament teams retrieved successfully',
      teams: teams
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


/**
 * 🕐 GENERAR HORARIOS PARA FASE DE GRUPOS
 *
 * Genera slots de 45 minutos para los días 1 y 2 (fase de grupos).
 * - Día 1: 17:00 - 23:00 (8 slots)
 * - Día 2: 08:00 - 23:00 (20 slots)
 *
 * @param {string} startDate - Fecha de inicio del torneo (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin del torneo (YYYY-MM-DD)
 * @param {number} courtsAvailable - Número de canchas disponibles
 * @returns {Array} Array de slots con capacidad calculada
 */
function generateGroupPhaseTimeSlots(startDate, endDate, courtsAvailable) {
  const slots = [];
  const slotDuration = 45; // minutos

  // Calcular capacidad por slot: canchas × 2 equipos por partido
  // Ejemplo: 2 canchas = 4 equipos pueden jugar simultáneamente (2 partidos en paralelo)
  const capacityPerSlot = courtsAvailable * 2;

  console.log(`⏰ [GENERAR HORARIOS] Inicio: ${startDate}, Fin: ${endDate}, Canchas: ${courtsAvailable}`);
  console.log(`📊 [CAPACIDAD] ${capacityPerSlot} equipos por slot (${courtsAvailable} canchas × 2 equipos/partido)`);

  // Crear objeto Date para día 1 (fecha de inicio)
  const day1Date = new Date(startDate + 'T00:00:00');
  const day1DateStr = formatDateSafe(day1Date);
  const day1Name = getDayName(day1Date);

  // DÍA 1: 17:00 - 23:00 (8 slots de 45 min)
  console.log(`📅 [DÍA 1] ${day1Name} ${day1DateStr}: 17:00 - 23:00`);

  const day1StartHour = 17;
  const day1StartMinute = 0;

  for (let i = 0; i < 8; i++) {
    const totalMinutes = day1StartHour * 60 + day1StartMinute + (i * slotDuration);
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const endTotalMinutes = totalMinutes + slotDuration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    slots.push({
      id: `slot_day1_${startTime.replace(':', '')}`,
      label: `${day1Name} ${startTime} - ${endTime}`,
      day: 1,
      start: startTime,
      end: endTime,
      date: day1DateStr,
      tournament_day: 1,
      duration_minutes: slotDuration,
      capacity: capacityPerSlot,
      courts: courtsAvailable
    });
  }

  // DÍA 2: 08:00 - 23:00 (20 slots de 45 min)
  const day2Date = new Date(day1Date);
  day2Date.setDate(day2Date.getDate() + 1);
  const day2DateStr = formatDateSafe(day2Date);
  const day2Name = getDayName(day2Date);

  console.log(`📅 [DÍA 2] ${day2Name} ${day2DateStr}: 08:00 - 23:00`);

  const day2StartHour = 8;
  const day2StartMinute = 0;

  for (let i = 0; i < 20; i++) {
    const totalMinutes = day2StartHour * 60 + day2StartMinute + (i * slotDuration);
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const endTotalMinutes = totalMinutes + slotDuration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    slots.push({
      id: `slot_day2_${startTime.replace(':', '')}`,
      label: `${day2Name} ${startTime} - ${endTime}`,
      day: 2,
      start: startTime,
      end: endTime,
      date: day2DateStr,
      tournament_day: 2,
      duration_minutes: slotDuration,
      capacity: capacityPerSlot,
      courts: courtsAvailable
    });
  }

  console.log(`✅ [HORARIOS GENERADOS] Total: ${slots.length} slots (Día 1: 8, Día 2: 20)`);
  console.log(`   Capacidad total: ${slots.length} slots × ${capacityPerSlot} cupos = ${slots.length * capacityPerSlot} cupos`);

  return slots;
}

/**
 * 📊 RECALCULAR HORARIOS PARA TODO EL EVENTO
 *
 * Cuando el admin cambia el tipo de un torneo (ej: de 9 a 12 jugadores),
 * se deben recalcular los horarios para TODO el evento.
 *
 * @param {string} eventName - Nombre del evento (común a todas las categorías)
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @param {number} courtsAvailable - Número de canchas
 */
async function recalculateEventTimeSlots(eventName, startDate, endDate, courtsAvailable) {
  console.log(`🔄 [RECALCULAR HORARIOS] Evento: ${eventName}`);

  // Generar nuevos horarios
  const newSlots = generateGroupPhaseTimeSlots(startDate, endDate, courtsAvailable);

  // Obtener todos los torneos del evento
  const { data: eventTournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, category_id')
    .eq('name', eventName);

  if (error) {
    console.error('❌ Error obteniendo torneos del evento:', error);
    throw error;
  }

  console.log(`📋 [ACTUALIZAR] ${eventTournaments.length} torneos del evento "${eventName}"`);

  // Actualizar group_time_slots en todos los torneos del evento
  for (const tournament of eventTournaments) {
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ group_time_slots: newSlots })
      .eq('id', tournament.id);

    if (updateError) {
      console.error(`❌ Error actualizando torneo ${tournament.id}:`, updateError);
    } else {
      console.log(`   ✅ Torneo ${tournament.id} actualizado`);
    }
  }

  console.log(`✅ [RECALCULACIÓN COMPLETA] Horarios actualizados para ${eventTournaments.length} torneos`);

  return newSlots;
}

/**
 * 🎯 OBTENER HORARIOS DISPONIBLES PARA INSCRIPCIÓN
 *
 * Muestra los horarios de fase de grupos con información de cuántos equipos
 * ya los marcaron como NO disponibles.
 *
 * GET /tournaments/:id/available-group-hours
 */
export async function getAvailableGroupHours(req, res) {
  const { id } = req.params;

  try {
    // 1. Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, category_id, group_time_slots, start_date, end_date, max_teams, tournament_type')
      .eq('id', id)
      .single();

    if (tournamentError) throw tournamentError;
    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    // 2. Obtener categoría
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', tournament.category_id)
      .single();

    // 3. Obtener todos los torneos del evento (mismo nombre)
    const { data: eventTournaments } = await supabase
      .from('tournaments')
      .select('id, tournament_type, max_teams')
      .eq('name', tournament.name);

    const totalCategories = eventTournaments ? eventTournaments.length : 1;

    // Calcular total de equipos en el evento
    const totalTeams = eventTournaments
      ? eventTournaments.reduce((sum, t) => sum + (t.max_teams || 0), 0)
      : tournament.max_teams;

    // 4. Obtener todas las restricciones del evento
    const eventTournamentIds = eventTournaments.map(t => t.id);

    const { data: allTeamsInEvent } = await supabase
      .from('tournament_teams')
      .select('unavailable_times')
      .in('tournament_id', eventTournamentIds);

    // Contar restricciones por horario
    const restrictionCounts = {};

    if (allTeamsInEvent) {
      allTeamsInEvent.forEach(team => {
        if (team.unavailable_times && Array.isArray(team.unavailable_times)) {
          team.unavailable_times.forEach(timeSlot => {
            restrictionCounts[timeSlot] = (restrictionCounts[timeSlot] || 0) + 1;
          });
        }
      });
    }

    // 5. Enriquecer slots con información de restricciones y capacidad
    const slots = tournament.group_time_slots || [];
    const courts = slots[0]?.courts || 2;
    const MAX_TEAMS_PER_SLOT = MAX_RESTRICTIONS_PER_SLOT_PER_COURT * courts;
    
    const enrichedSlots = slots.map(slot => {
      const slotKey = slot.start; // Usar start time como key
      const currentRestrictions = restrictionCounts[slotKey] || 0;
      const isHeavilyRestricted = currentRestrictions > (totalTeams * 0.5); // Más del 50% lo marcaron
      const slotsRemaining = Math.max(0, MAX_TEAMS_PER_SLOT - currentRestrictions);
      const isFull = currentRestrictions >= MAX_TEAMS_PER_SLOT;

      return {
        ...slot,
        current_restrictions: currentRestrictions,
        max_restrictions: MAX_TEAMS_PER_SLOT,
        slots_remaining: slotsRemaining,
        is_full: isFull,
        is_heavily_restricted: isHeavilyRestricted,
        restriction_percentage: totalTeams > 0
          ? Math.round((currentRestrictions / totalTeams) * 100)
          : 0
      };
    });

    // 6. Responder
    res.json({
      message: 'Horarios disponibles para fase de grupos',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        category: category?.name || 'Sin categoría',
        type: tournament.tournament_type,
        max_teams: tournament.max_teams,
        total_categories: totalCategories,
        total_teams_in_event: totalTeams
      },
      available_hours: enrichedSlots,
      restrictions: {
        min_selection: 0,
        max_selection: 2,
        recommended: 1,
        message: 'Selecciona máximo 2 horarios en los que NO puedas jugar (día 1 o día 2)'
      },
      info: {
        phase: 'Fase de Grupos (Días 1 y 2)',
        day1_hours: '17:00 - 23:00',
        day2_hours: '08:00 - 23:00',
        match_duration: '45 minutos',
        note: 'Los horarios son compartidos entre todas las categorías del evento'
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo horarios disponibles:', error);
    res.status(500).json({
      message: 'Error al obtener horarios disponibles',
      error: error.message
    });
  }
}

// ============================================
// FIN NUEVA LÓGICA DE HORARIOS
// ============================================

export async function getTournamentsByUserId(req, res) {
  const user_id = req.params.userId

  try {
    // First get the teams where the user is a player
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`)

    if (teamsError) throw teamsError

    if (!teams.length) {
      return res.json({
        message: 'User tournaments retrieved successfully',
        tournaments: []
      })
    }

    // Then get the tournaments for those teams
    const teamIds = teams.map(team => team.id)
    const { data, error } = await supabase
      .from('tournament_teams')
      .select(`
        tournaments (
          id,
          name
        )
      `)
      .in('team_id', teamIds)

    if (error) throw error

    // Transform the data to get just tournament id and name
    const tournaments = data.map(entry => ({
      id: entry.tournaments.id,
      name: entry.tournaments.name
    }))

    res.json({
      message: 'User tournaments retrieved successfully',
      tournaments
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ===================================================================
// PROGRAMACIÓN AUTOMÁTICA DE PARTIDOS
// ===================================================================


/**
 * 🏆 OBTENER TABLA DE POSICIONES POR GRUPO (Sistema Híbrido)
 * Lee desde tournament_standings para máxima performance
 */
// ========================================
// 📊 ESTADÍSTICAS Y STANDINGS
// ========================================

export async function getGroupStandings(req, res) {
  const { id: tournamentId } = req.params;
  
  try {
    console.log(`🏆 Obteniendo standings para torneo: ${tournamentId}`);
    
    // Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;
    
    // Obtener standings desde la tabla persistente con información de equipos
    const { data: standings, error: standingsError } = await supabase
      .from('tournament_standings')
      .select(`
        *,
        teams!team_id(
          id,
          player1:users!player1_id(first_name, last_name),
          player2:users!player2_id(first_name, last_name)
        ),
        tournament_groups!group_id(group_number)
      `)
      .eq('tournament_id', tournamentId)
      .order('group_id')
      .order('points', { ascending: false })
      .order('sets_won', { ascending: false })
      .order('games_won', { ascending: false });
      
    if (standingsError) throw standingsError;
    
    // Si no hay standings persistidos, calcular dinámicamente como fallback
    if (!standings || standings.length === 0) {
      console.log('⚠️ No hay standings persistidos, calculando dinámicamente...');
      return await calculateStandingsDynamically(req, res);
    }
    
    // Organizar standings por grupo
    const standingsByGroup = organizeStandingsByGroup(standings);
    
    // Generar resumen de clasificación
    const classificationSummary = generateClassificationSummaryFromStandings(standingsByGroup, tournament.tournament_type);
    
    res.json({
      message: 'Standings obtenidos exitosamente',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        category: tournament.categories?.name,
        type: tournament.tournament_type
      },
      standings: standingsByGroup,
      classification_summary: classificationSummary,
      data_source: 'persistent' // Indica que viene de la tabla
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo standings:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Organizar standings por grupo desde datos persistentes
 */
function organizeStandingsByGroup(standings) {
  const groups = {};
  
  standings.forEach(standing => {
    const groupNumber = standing.tournament_groups.group_number;
    
    if (!groups[groupNumber]) {
      groups[groupNumber] = {
        group_id: standing.group_id,
        group_number: groupNumber,
        teams: []
      };
    }
    
    // Calcular posición basada en el orden de la query
    const position = groups[groupNumber].teams.length + 1;
    
    groups[groupNumber].teams.push({
      position,
      team_id: standing.team_id,
      team_info: {
        player1: `${standing.teams.player1.first_name} ${standing.teams.player1.last_name}`,
        player2: `${standing.teams.player2.first_name} ${standing.teams.player2.last_name}`
      },
      points: standing.points,
      matches_played: standing.matches_played,
      matches_won: standing.matches_won,
      matches_lost: standing.matches_lost,
      sets_won: standing.sets_won,
      sets_lost: standing.sets_lost,
      sets_difference: standing.sets_won - standing.sets_lost,
      games_won: standing.games_won,
      games_lost: standing.games_lost,
      games_difference: standing.games_won - standing.games_lost
    });
  });
  
  return groups;
}

/**
 * Generar clasificación desde standings persistentes
 */
function generateClassificationSummaryFromStandings(standingsByGroup, tournamentType) {
  const summary = {
    qualified_teams: [],
    format: tournamentType,
    classification_rules: {}
  };
  
  if (tournamentType === 'NINE_PLAYERS') {
    summary.classification_rules = {
      qualified_per_group: 'Top 1 + mejor 2do lugar',
      total_qualified: 4,
      next_phase: 'Semifinales'
    };
    
    // Primeros de cada grupo
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const firstPlace = standingsByGroup[groupNumber].teams[0];
      if (firstPlace) {
        summary.qualified_teams.push({
          team_id: firstPlace.team_id,
          team_info: firstPlace.team_info,
          group: parseInt(groupNumber),
          position: 1,
          qualification_type: 'group_winner',
          stats: {
            matches_won: firstPlace.matches_won,
            sets_difference: firstPlace.sets_difference,
            games_difference: firstPlace.games_difference
          }
        });
      }
    });
    
    // Mejor segundo lugar
    const secondPlaces = [];
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const secondPlace = standingsByGroup[groupNumber].teams[1];
      if (secondPlace) {
        secondPlaces.push({
          ...secondPlace,
          group: parseInt(groupNumber)
        });
      }
    });
    
    // Ordenar segundos lugares
    secondPlaces.sort((a, b) => {
      if (a.matches_won !== b.matches_won) return b.matches_won - a.matches_won;
      if (a.sets_difference !== b.sets_difference) return b.sets_difference - a.sets_difference;
      return b.games_difference - a.games_difference;
    });
    
    if (secondPlaces[0]) {
      summary.qualified_teams.push({
        team_id: secondPlaces[0].team_id,
        team_info: secondPlaces[0].team_info,
        group: secondPlaces[0].group,
        position: 2,
        qualification_type: 'best_second',
        stats: {
          matches_won: secondPlaces[0].matches_won,
          sets_difference: secondPlaces[0].sets_difference,
          games_difference: secondPlaces[0].games_difference
        }
      });
    }
    
  } else if (tournamentType === 'TWELVE_PLAYERS') {
    summary.classification_rules = {
      qualified_per_group: 'Top 2',
      total_qualified: 8,
      next_phase: 'Cuartos de Final'
    };
    
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const group = standingsByGroup[groupNumber];
      [0, 1].forEach(position => {
        const team = group.teams[position];
        if (team) {
          summary.qualified_teams.push({
            team_id: team.team_id,
            team_info: team.team_info,
            group: parseInt(groupNumber),
            position: position + 1,
            qualification_type: position === 0 ? 'group_winner' : 'group_runner_up',
            stats: {
              matches_won: team.matches_won,
              sets_difference: team.sets_difference,
              games_difference: team.games_difference
            }
          });
        }
      });
    });
  } else if (tournamentType === 'SIXTEEN_PLAYERS') {
    summary.classification_rules = {
      qualified_per_group: 'Top 2',
      total_qualified: 8,
      next_phase: 'Octavos de Final'
    };
    
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const group = standingsByGroup[groupNumber];
      [0, 1].forEach(position => {
        const team = group.teams[position];
        if (team) {
          summary.qualified_teams.push({
            team_id: team.team_id,
            team_info: team.team_info,
            group: parseInt(groupNumber),
            position: position + 1,
            qualification_type: position === 0 ? 'group_winner' : 'group_runner_up',
            stats: {
              matches_won: team.matches_won,
              sets_difference: team.sets_difference,
              games_difference: team.games_difference
            }
          });
        }
      });
    });
  }
  
  return summary;
}

/**
 * 🏆 GENERAR CUADRO ELIMINATORIO AUTOMÁTICAMENTE
 * Crea la fase eliminatoria basada en equipos clasificados
 */
// ========================================
// 🎾 GENERACIÓN Y SCHEDULING DE PARTIDOS
// ========================================

export async function generateEliminationBracket(req, res) {
  const { id: tournamentId } = req.params;
  
  try {
    console.log(`🏆 Generando cuadro eliminatorio para torneo: ${tournamentId}`);
    
    // Obtener información del torneo directamente
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;
    
    // Obtener standings actuales  
    const standingsResponse = await getStandingsData(tournamentId);
    const { standings, classification_summary } = standingsResponse;
    
    if (!classification_summary.qualified_teams || classification_summary.qualified_teams.length === 0) {
      return res.status(400).json({ 
        message: 'No hay equipos clasificados aún. Complete la fase de grupos primero.' 
      });
    }
    
    // Generar estructura del bracket
    const bracket = generateBracketStructure(
      classification_summary.qualified_teams, 
      tournament.tournament_type
    );
    
    // Crear partidos eliminatorios en la BD
    const eliminationMatches = await createEliminationMatches(tournamentId, bracket, tournament);
    
    console.log(`✅ ${eliminationMatches.length} partidos eliminatorios creados`);
    console.log(`🏆 Torneo ${tournament.name} ahora en fase ELIMINATORIA`);
    
    // 📧 ENVIAR EMAILS A CLASIFICADOS CON DELAY DE 30 SEGUNDOS
    console.log('📧 Programando envío de emails de clasificación en 30 segundos...');
    setTimeout(async () => {
      try {
        console.log('📧 Iniciando envío de emails de clasificación...');
        
        // Obtener información completa de los equipos clasificados con emails
        const { data: qualifiedTeamsData, error: teamsError } = await supabase
          .from('tournament_teams')
          .select(`
            team_id,
            teams!inner (
              player1_id,
              player2_id,
              player1:users!teams_player1_id_fkey (
                first_name,
                last_name,
                email
              ),
              player2:users!teams_player2_id_fkey (
                first_name,
                last_name,
                email
              )
            )
          `)
          .in('team_id', classification_summary.qualified_teams.map(team => team.team_id));
          
        if (teamsError) {
          console.error('❌ Error obteniendo datos de equipos clasificados:', teamsError);
          return;
        }
        
        // Preparar datos de equipos con emails
        const teamsWithEmails = qualifiedTeamsData.map(teamData => ({
          team_id: teamData.team_id,
          player1: teamData.teams.player1,
          player2: teamData.teams.player2,
          email: teamData.teams.player1?.email || teamData.teams.player2?.email // Usar email del primer jugador disponible
        })).filter(team => team.email); // Solo equipos con email válido
        
        if (teamsWithEmails.length === 0) {
          console.log('⚠️ No se encontraron equipos clasificados con emails válidos');
          return;
        }
        
        console.log(`📊 Enviando emails a ${teamsWithEmails.length} equipos clasificados`);
        
        // Enviar emails
        const emailResults = await sendEliminationBracketEmails(
          tournamentId, 
          eliminationMatches, 
          teamsWithEmails
        );
        
        console.log('📧 Resultados del envío de emails:', emailResults);
        
      } catch (error) {
        console.error('❌ Error en envío de emails de clasificación:', error);
      }
    }, 30000); // 30 segundos de delay
    
    res.json({
      message: 'Cuadro eliminatorio generado exitosamente',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        type: tournament.tournament_type,
        category: tournament.categories?.name
      },
      bracket: bracket,
      elimination_matches: eliminationMatches,
      qualified_teams: classification_summary.qualified_teams
    });
    
  } catch (error) {
    console.error('❌ Error generando cuadro eliminatorio:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Obtener datos de standings (helper interno)
 */
async function getStandingsData(tournamentId) {
  // Simular el request para reutilizar la función getGroupStandings
  const mockReq = { params: { id: tournamentId } };
  let responseData = null;
  
  const mockRes = {
    json: (data) => {
      responseData = data;
      return data;
    },
    status: (code) => ({ 
      json: (data) => {
        responseData = { status: code, ...data };
        return responseData;
      } 
    })
  };
  
  await getGroupStandings(mockReq, mockRes);
  
  if (!responseData || responseData.status >= 400) {
    throw new Error('Error obteniendo standings del torneo');
  }
  
  return responseData;
}

/**
 * Generar estructura del bracket según formato
 */
function generateBracketStructure(qualifiedTeams, tournamentType) {
  if (tournamentType === 'SIX_PLAYERS') {
    return generateSixPlayersBracket(qualifiedTeams);
  } else if (tournamentType === 'NINE_PLAYERS') {
    return generateNinePlayersBracket(qualifiedTeams);
  } else if (tournamentType === 'TWELVE_PLAYERS') {
    return generateTwelvePlayersBracket(qualifiedTeams);
  } else if (tournamentType === 'SIXTEEN_PLAYERS') {
    return generateSixteenPlayersBracket(qualifiedTeams);
  } else {
    throw new Error(`Formato de torneo no soportado: ${tournamentType}`);
  }
}

/**
 * Bracket para 6 jugadores: 4 clasificados → Semifinales → Final
 */
function generateSixPlayersBracket(qualifiedTeams) {
  // Ordenar equipos: primeros de grupo primero, luego segundos
  const groupWinners = qualifiedTeams.filter(t => t.qualification_type === 'group_winner')
    .sort((a, b) => a.group - b.group);
  const groupRunners = qualifiedTeams.filter(t => t.qualification_type === 'group_runner_up')
    .sort((a, b) => a.group - b.group);
    
  // Emparejamiento para semifinales: 
  // Semifinal 1: Ganador Grupo A vs Segundo Grupo B
  // Semifinal 2: Ganador Grupo B vs Segundo Grupo A
  const semifinalsMatchups = [
    { team1: groupWinners[0], team2: groupRunners[1] }, // G1 vs 2do G2
    { team1: groupWinners[1], team2: groupRunners[0] }  // G2 vs 2do G1
  ];

  return {
    format: 'SIX_PLAYERS',
    total_teams: 4,
    structure: {
      semifinals: semifinalsMatchups.map((matchup, index) => ({
        id: `semifinal_${index + 1}`,
        round: 'SEMI_FINALS',
        team1: matchup.team1,
        team2: matchup.team2,
        winner_advances_to: 'final',
        match_number: index + 1
      })),
      final: {
        id: 'final',
        round: 'FINAL',
        team1: null, // Se llenará con ganador de semifinal 1
        team2: null, // Se llenará con ganador de semifinal 2
        winner_advances_to: null, // Es la final
        match_number: 3
      }
    },
    description: '4 equipos clasificados: semifinales → final'
  };
}

/**
 * Bracket para 9 jugadores: 6 clasificados → Cuartos/Semis → Final
 */
function generateNinePlayersBracket(qualifiedTeams) {
  // Ordenar equipos: primeros de grupo primero, luego mejor segundo
  const groupWinners = qualifiedTeams.filter(t => t.qualification_type === 'group_winner');
  const bestSecond = qualifiedTeams.filter(t => t.qualification_type === 'best_second');
  
  const orderedTeams = [...groupWinners, ...bestSecond];
  
  return {
    format: 'NINE_PLAYERS',
    total_teams: 4,
    structure: {
      semifinals: [
        {
          match_id: 'SF1',
          round: 'semifinals',
          match_number: 1,
          team1: orderedTeams[0] || null, // Ganador Grupo 1
          team2: orderedTeams[3] || null, // Mejor 2do lugar
          winner: null,
          status: 'pending'
        },
        {
          match_id: 'SF2', 
          round: 'semifinals',
          match_number: 2,
          team1: orderedTeams[1] || null, // Ganador Grupo 2
          team2: orderedTeams[2] || null, // Ganador Grupo 3
          winner: null,
          status: 'pending'
        }
      ],
      final: [
        {
          match_id: 'F1',
          round: 'final',
          match_number: 1,
          team1: null, // Ganador SF1
          team2: null, // Ganador SF2
          winner: null,
          status: 'pending',
          depends_on: ['SF1', 'SF2']
        }
      ]
    },
    advancement_rules: {
      semifinals: 'Ganadores avanzan a Final',
      final: 'Ganador es Campeón'
    }
  };
}

/**
 * Bracket para 12 jugadores: 8 clasificados → Cuartos → Semis → Final
 */
function generateTwelvePlayersBracket(qualifiedTeams) {
  // Ordenar equipos: alternando ganadores y segundos de cada grupo
  const groupWinners = qualifiedTeams.filter(t => t.qualification_type === 'group_winner')
    .sort((a, b) => a.group - b.group);
  const groupRunners = qualifiedTeams.filter(t => t.qualification_type === 'group_runner_up')
    .sort((a, b) => a.group - b.group);
    
  // Emparejamiento: Ganador Grupo A vs Segundo Grupo B, etc.
  const matchups = [
    { team1: groupWinners[0], team2: groupRunners[1] }, // G1 vs 2do G2
    { team1: groupWinners[1], team2: groupRunners[0] }, // G2 vs 2do G1  
    { team1: groupWinners[2], team2: groupRunners[3] }, // G3 vs 2do G4
    { team1: groupWinners[3], team2: groupRunners[2] }  // G4 vs 2do G3
  ];


  
  return {
    format: 'TWELVE_PLAYERS',
    total_teams: 8,
    structure: {
      quarterfinals: matchups.map((matchup, index) => ({
        match_id: `QF${index + 1}`,
        round: 'quarterfinals',
        match_number: index + 1,
        team1: matchup.team1 || null,
        team2: matchup.team2 || null,
        winner: null,
        status: 'pending'
      })),
      semifinals: [
        {
          match_id: 'SF1',
          round: 'semifinals', 
          match_number: 1,
          team1: null, // Ganador QF1
          team2: null, // Ganador QF2
          winner: null,
          status: 'pending',
          depends_on: ['QF1', 'QF2']
        },
        {
          match_id: 'SF2',
          round: 'semifinals',
          match_number: 2, 
          team1: null, // Ganador QF3
          team2: null, // Ganador QF4
          winner: null,
          status: 'pending',
          depends_on: ['QF3', 'QF4']
        }
      ],
      final: [
        {
          match_id: 'F1',
          round: 'final',
          match_number: 1,
          team1: null, // Ganador SF1
          team2: null, // Ganador SF2
          winner: null,
          status: 'pending',
          depends_on: ['SF1', 'SF2']
        }
      ]
    },
    advancement_rules: {
      quarterfinals: 'Ganadores avanzan a Semifinales',
      semifinals: 'Ganadores avanzan a Final', 
      final: 'Ganador es Campeón'
    }
  };
}

/**
 * Bracket para 16 jugadores: 8 clasificados → Octavos → Cuartos → Semis → Final
 */
function generateSixteenPlayersBracket(qualifiedTeams) {
  // Ordenar equipos: alternando ganadores y segundos de cada grupo
  const groupWinners = qualifiedTeams.filter(t => t.qualification_type === 'group_winner')
    .sort((a, b) => a.group - b.group);
  const groupRunners = qualifiedTeams.filter(t => t.qualification_type === 'group_runner_up')
    .sort((a, b) => a.group - b.group);
    
  // Emparejamiento para octavos: Ganador Grupo A vs Segundo Grupo B, etc.
  const octavosMatchups = [
    { team1: groupWinners[0], team2: groupRunners[1] }, // G1 vs 2do G2
    { team1: groupWinners[1], team2: groupRunners[0] }, // G2 vs 2do G1  
    { team1: groupWinners[2], team2: groupRunners[3] }, // G3 vs 2do G4
    { team1: groupWinners[3], team2: groupRunners[2] }  // G4 vs 2do G3
  ];

  return {
    format: 'SIXTEEN_PLAYERS',
    total_teams: 8,
    structure: {
      octavos: octavosMatchups.map((matchup, index) => ({
        match_id: `OF${index + 1}`,
        round: 'octavos',
        match_number: index + 1,
        team1: matchup.team1 || null,
        team2: matchup.team2 || null,
        winner: null,
        status: 'pending'
      })),
      quarterfinals: [
        {
          match_id: 'QF1',
          round: 'quarterfinals',
          match_number: 1,
          team1: null, // Ganador OF1
          team2: null, // Ganador OF2
          winner: null,
          status: 'pending',
          depends_on: ['OF1', 'OF2']
        },
        {
          match_id: 'QF2',
          round: 'quarterfinals',
          match_number: 2,
          team1: null, // Ganador OF3
          team2: null, // Ganador OF4
          winner: null,
          status: 'pending',
          depends_on: ['OF3', 'OF4']
        }
      ],
      semifinals: [
        {
          match_id: 'SF1',
          round: 'semifinals',
          match_number: 1,
          team1: null, // Ganador QF1
          team2: null, // Ganador QF2
          winner: null,
          status: 'pending',
          depends_on: ['QF1', 'QF2']
        }
      ],
      final: [
        {
          match_id: 'F1',
          round: 'final',
          match_number: 1,
          team1: null, // Ganador SF1
          team2: null, // Ganador SF2
          winner: null,
          status: 'pending',
          depends_on: ['SF1', 'SF2']
        }
      ]
    },
    advancement_rules: {
      octavos: 'Ganadores avanzan a Cuartos de Final',
      quarterfinals: 'Ganadores avanzan a Semifinales',
      semifinals: 'Ganadores avanzan a Final', 
      final: 'Ganador es Campeón'
    }
  };
}

/**
 * Crear partidos eliminatorios en la base de datos
 */
async function createEliminationMatches(tournamentId, bracket, tournament) {
  const matches = [];
  const startDate = new Date(tournament.end_date + 'T00:00:00'); // Día 3 del torneo
  
  // 1. Obtener todos los torneos del mismo evento (mismo nombre)
  const { data: eventTournaments, error: eventError } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      category_id,
      categories!inner (
        id,
        name,
        "order"
      )
    `)
    .eq('name', tournament.name);

  if (eventError) throw eventError;

  console.log('🎯 Torneos encontrados:', eventTournaments.map(t => ({
    id: t.id,
    category: t.categories?.name,
    order: t.categories?.order
  })));

  // Ordenar torneos por el orden de sus categorías (7ma → 6ta → 5ta → 4ta)
  eventTournaments.sort((a, b) => {
    const orderA = a.categories?.order || 99;
    const orderB = b.categories?.order || 99;
    return orderB - orderA; // Orden descendente (7ma primero)
  });

  console.log('📊 Torneos ordenados:', eventTournaments.map(t => ({
    id: t.id,
    category: t.categories?.name,
    order: t.categories?.order
  })));

  // 2. Obtener canchas desde multi-sede o fallback
  const { courts, venueCourtMap } = await getTournamentCourts(tournamentId);
  
  if (!courts || courts.length === 0) {
    throw new Error('No hay canchas disponibles para este torneo');
  }
  
  // Extraer solo los IDs para compatibilidad con el código existente
  const courtIds = courts.map(c => c.id);
  
  // 3. Encontrar la posición de este torneo en el orden de categorías
  const tournamentIndex = eventTournaments.findIndex(t => t.id === tournamentId);
  const MATCH_DURATION = 60; // 1 hora para fase eliminatoria
  const START_HOUR = 8; // Empezar a las 8:00 AM
  
  // 4. NUEVA LÓGICA: Programación escalonada por categorías (como el Excel)
  // Cada categoría tiene sus horarios escalonados según su orden
  const totalCategories = eventTournaments.length;
  const quarterfinalsOffset = tournamentIndex * 2; // 2 horas por categoría para cuartos
  const semifinalsOffset = tournamentIndex * 1; // 1 hora por categoría para semis
  const finalsOffset = tournamentIndex * 1; // 1 hora por categoría para finales
  
  const roundStartTimes = {
    octavos: START_HOUR + quarterfinalsOffset,           // 8:00 + (categoría * 2)
    quarterfinals: START_HOUR + quarterfinalsOffset,     // 8:00 + (categoría * 2)
    semifinals: START_HOUR + 8 + semifinalsOffset,       // 16:00 + (categoría * 1)
    final: START_HOUR + 9 + finalsOffset                 // 17:00 + (categoría * 1)
  };

  console.log('🎯 NUEVA Configuración de horarios ELIMINATORIOS (como Excel):');
  console.log('   ⏰ Hora inicio:', START_HOUR);
  console.log('   ⌛ Duración partido:', MATCH_DURATION, 'minutos (1 hora)');
  console.log('   📊 Total categorías:', totalCategories);
  console.log('   📅 Horarios por ronda:', roundStartTimes);
  console.log('   🏆 Categoría actual:', tournament.categories?.name, '(orden:', tournament.categories?.order, ')');
  console.log('   📍 Índice en el evento:', tournamentIndex);
  console.log('   ⏰ Offset cuartos:', quarterfinalsOffset, 'horas (2h por categoría)');
  console.log('   ⏰ Offset semis:', semifinalsOffset, 'horas (1h por categoría)');
  console.log('   ⏰ Offset finales:', finalsOffset, 'horas (1h por categoría)');
  console.log('   🔄 LÓGICA: Escalonado diferenciado por rondas');
  console.log('   📋 EJEMPLO HORARIOS:');
  console.log(`      Cuartos: ${START_HOUR + quarterfinalsOffset}:00 y ${START_HOUR + quarterfinalsOffset + 1}:00 (concurrente en 2 canchas)`);
  console.log(`      Semifinales: ${START_HOUR + 8 + semifinalsOffset}:00 (concurrente en 2 canchas)`);
  console.log(`      Final: ${START_HOUR + 9 + finalsOffset}:00 (1 cancha)`);

  // 5. Generar partidos con lógica concurrente por rondas
  let globalMatchCounter = 0; // Contador global para distribución de canchas
  
  Object.keys(bracket.structure).forEach(round => {
    const roundStartTime = roundStartTimes[round];
    const matchesInRound = bracket.structure[round].length;
    
    console.log(`🕒 RONDA ${round.toUpperCase()}:`);
    console.log(`   ⏰ Hora inicio: ${roundStartTime}:00`);
    console.log(`   🎾 Total partidos: ${matchesInRound}`);
    
    bracket.structure[round].forEach((match, index) => {
      if (match.team1 && match.team2) {
        // Calcular horario según la lógica del Excel
        let matchTime;
        let assignedCourt;
        
        if (round === 'octavos' || round === 'quarterfinals') {
          // Para cuartos: 2 partidos a las 8:00, 2 partidos a las 9:00
          matchTime = roundStartTime + Math.floor(index / 2); // 8:00 para índices 0,1 | 9:00 para índices 2,3
          assignedCourt = courts[index % courts.length]; // Alternar canchas
        } else if (round === 'semifinals') {
          // Para semifinales: 2 partidos a las 16:00
          matchTime = roundStartTime; // Todos a las 16:00
          assignedCourt = courts[index % courts.length]; // Alternar canchas
        } else if (round === 'final') {
          // Para final: 1 partido a las 17:00
          matchTime = roundStartTime; // A las 17:00
          assignedCourt = courts[0]; // Primera cancha
        }
        
        // Asegurar que assignedCourt tenga la estructura correcta
        if (typeof assignedCourt === 'object' && assignedCourt.id) {
          // Ya es un objeto con id
        } else if (typeof assignedCourt === 'string') {
          // Es un ID, buscar el objeto completo
          const courtObj = courts.find(c => c.id === assignedCourt);
          assignedCourt = courtObj || { id: assignedCourt };
        }
        
        const hour = Math.floor(matchTime);
        const minutes = Math.round((matchTime % 1) * 60);
        
        console.log(`   🎾 Partido ${index + 1}: ${hour}:${minutes.toString().padStart(2, '0')} - Cancha ${assignedCourt.id}`);
        
        // Obtener venue_id desde el mapeo si está disponible
        const venueId = venueCourtMap.get(assignedCourt.id) || null;
        
        const matchData = {
          tournament_id: tournamentId,
          home_team_id: match.team1.team_id,
          away_team_id: match.team2.team_id,
          match_day: startDate.toISOString().split('T')[0],
          start_time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`,
          court_id: assignedCourt.id,
          venue_id: venueId, // ✨ NUEVO: Asignar venue_id desde multi-sede
          status: 'scheduled',
          group_number: null,
          round: round === 'octavos' ? 'octavos' : 
                 round === 'quarterfinals' ? 'quarter_final' : 
                 round === 'semifinals' ? 'semi_final' : 'final',
          elimination_round: round,
          bracket_match_id: match.match_id,
          match_order: match.match_number,
          stage: round === 'octavos' ? 'octavos' : 
                 round === 'quarterfinals' ? 'quarter_final' : 
                 round === 'semifinals' ? 'semi_final' : 'final'
        };
        
        matches.push(matchData);
      }
    });
  });
  
  // Insertar partidos en la BD
  if (matches.length > 0) {
    const { data: insertedMatches, error: insertError } = await supabase
      .from('tournament_matches')
      .insert(matches)
      .select();
      
    if (insertError) throw insertError;
    
    console.log(`✅ ${matches.length} partidos eliminatorios creados`);
    console.log(`🏆 Torneo ${tournament.name} ahora en fase ELIMINATORIA`);
    return insertedMatches;
  }
  
  return [];
}

/**
 * Fallback: calcular standings dinámicamente si no están persistidos
 */
async function calculateStandingsDynamically(req, res) {
  // Implementación original como fallback
  // ... (código anterior)
  const { id: tournamentId } = req.params;
  
  // Obtener partidos y calcular
  const { data: matches, error: matchesError } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('status', 'completed');
    
  if (matchesError) throw matchesError;
  
  const { data: groups, error: groupsError } = await supabase
    .from('tournament_groups')
    .select('*')
    .eq('tournament_id', tournamentId);
    
  if (groupsError) throw groupsError;
  
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*, categories(name)')
    .eq('id', tournamentId)
    .single();
    
  if (tournamentError) throw tournamentError;
  
  const standingsByGroup = calculateStandingsFromMatches(matches, groups, tournament.tournament_type);
  
  res.json({
    message: 'Standings calculados dinámicamente (fallback)',
    tournament: {
      id: tournament.id,
      name: tournament.name,
      category: tournament.categories?.name,
      type: tournament.tournament_type
    },
    standings: standingsByGroup,
    classification_summary: generateClassificationSummary(standingsByGroup, tournament.tournament_type),
    data_source: 'dynamic' // Indica que es cálculo dinámico
  });
}

/**
 * Calcular standings basado en partidos completados
 */
function calculateStandingsFromMatches(matches, groups, tournamentType) {
  const standingsByGroup = {};
  
  // Inicializar standings para cada grupo
  groups.forEach(group => {
    standingsByGroup[group.group_number] = {
      group_id: group.id,
      group_number: group.group_number,
      teams: []
    };
    
    // Inicializar cada equipo del grupo
    const teamIds = Array.isArray(group.teams) ? group.teams : JSON.parse(group.teams);
    teamIds.forEach(teamId => {
      standingsByGroup[group.group_number].teams.push({
        team_id: teamId,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        sets_won: 0,
        sets_lost: 0,
        games_won: 0,
        games_lost: 0,
        points: 0,
        classification_status: null
      });
    });
  });
  
  // Procesar cada partido completado
  matches.forEach(match => {
    const groupStanding = standingsByGroup[match.group_number];
    if (!groupStanding) return;
    
    const homeTeamStats = groupStanding.teams.find(t => t.team_id === match.home_team_id);
    const awayTeamStats = groupStanding.teams.find(t => t.team_id === match.away_team_id);
    
    if (!homeTeamStats || !awayTeamStats) return;
    
    // Calcular estadísticas del partido
    const matchStats = calculateMatchStats(match);
    
    // Actualizar estadísticas del equipo local
    homeTeamStats.matches_played++;
    homeTeamStats.sets_won += matchStats.home.sets_won;
    homeTeamStats.sets_lost += matchStats.home.sets_lost;
    homeTeamStats.games_won += matchStats.home.games_won;
    homeTeamStats.games_lost += matchStats.home.games_lost;
    
    // Actualizar estadísticas del equipo visitante
    awayTeamStats.matches_played++;
    awayTeamStats.sets_won += matchStats.away.sets_won;
    awayTeamStats.sets_lost += matchStats.away.sets_lost;
    awayTeamStats.games_won += matchStats.away.games_won;
    awayTeamStats.games_lost += matchStats.away.games_lost;
    
    // Determinar ganador y perdedor
    if (match.winner_team_id === match.home_team_id) {
      homeTeamStats.matches_won++;
      homeTeamStats.points += 3; // 3 puntos por ganar
      awayTeamStats.matches_lost++;
      awayTeamStats.points += 0; // 0 puntos por perder
    } else {
      awayTeamStats.matches_won++;
      awayTeamStats.points += 3; // 3 puntos por ganar
      homeTeamStats.matches_lost++;
      homeTeamStats.points += 0; // 0 puntos por perder
    }
  });
  
  // Ordenar equipos en cada grupo por criterios de clasificación
  Object.keys(standingsByGroup).forEach(groupNumber => {
    standingsByGroup[groupNumber].teams.sort((a, b) => {
      // 1. Partidos ganados (más importante)
      if (a.matches_won !== b.matches_won) {
        return b.matches_won - a.matches_won;
      }
      
      // 2. Diferencia de sets
      const aDiff = a.sets_won - a.sets_lost;
      const bDiff = b.sets_won - b.sets_lost;
      if (aDiff !== bDiff) {
        return bDiff - aDiff;
      }
      
      // 3. Diferencia de games
      const aGamesDiff = a.games_won - a.games_lost;
      const bGamesDiff = b.games_won - b.games_lost;
      return bGamesDiff - aGamesDiff;
    });
    
    // Asignar posiciones
    standingsByGroup[groupNumber].teams.forEach((team, index) => {
      team.position = index + 1;
    });
  });
  
  return standingsByGroup;
}

/**
 * Calcular estadísticas de un partido individual
 */
function calculateMatchStats(match) {
  const homeStats = {
    sets_won: 0,
    sets_lost: 0,
    games_won: match.team1_sets1_won + match.team1_sets2_won,
    games_lost: match.team2_sets1_won + match.team2_sets2_won
  };
  
  const awayStats = {
    sets_won: 0,
    sets_lost: 0,
    games_won: match.team2_sets1_won + match.team2_sets2_won,
    games_lost: match.team1_sets1_won + match.team1_sets2_won
  };
  
  // Contar sets ganados
  if (match.team1_sets1_won > match.team2_sets1_won) {
    homeStats.sets_won++;
    awayStats.sets_lost++;
  } else {
    homeStats.sets_lost++;
    awayStats.sets_won++;
  }
  
  if (match.team1_sets2_won > match.team2_sets2_won) {
    homeStats.sets_won++;
    awayStats.sets_lost++;
  } else {
    homeStats.sets_lost++;
    awayStats.sets_won++;
  }
  
  return { home: homeStats, away: awayStats };
}

/**
 * Generar resumen de clasificación
 */
function generateClassificationSummary(standingsByGroup, tournamentType) {
  const summary = {
    qualified_teams: [],
    format: tournamentType,
    classification_rules: {}
  };
  
  if (tournamentType === 'NINE_PLAYERS') {
    // Top 1 de cada grupo + mejor 2do = 4 equipos a semis
    summary.classification_rules = {
      qualified_per_group: 'Top 1 + mejor 2do lugar',
      total_qualified: 4,
      next_phase: 'Semifinales'
    };
    
    // Obtener primeros de cada grupo
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const firstPlace = standingsByGroup[groupNumber].teams[0];
      if (firstPlace) {
        summary.qualified_teams.push({
          team_id: firstPlace.team_id,
          group: parseInt(groupNumber),
          position: 1,
          qualification_type: 'group_winner'
        });
      }
    });
    
    // Encontrar mejor segundo lugar
    const secondPlaces = [];
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const secondPlace = standingsByGroup[groupNumber].teams[1];
      if (secondPlace) {
        secondPlaces.push({
          ...secondPlace,
          group: parseInt(groupNumber)
        });
      }
    });
    
    // Ordenar segundos lugares y tomar el mejor
    secondPlaces.sort((a, b) => {
      if (a.matches_won !== b.matches_won) return b.matches_won - a.matches_won;
      const aDiff = a.sets_won - a.sets_lost;
      const bDiff = b.sets_won - b.sets_lost;
      if (aDiff !== bDiff) return bDiff - aDiff;
      const aGamesDiff = a.games_won - a.games_lost;
      const bGamesDiff = b.games_won - b.games_lost;
      return bGamesDiff - aGamesDiff;
    });
    
    if (secondPlaces[0]) {
      summary.qualified_teams.push({
        team_id: secondPlaces[0].team_id,
        group: secondPlaces[0].group,
        position: 2,
        qualification_type: 'best_second'
      });
    }
    
  } else if (tournamentType === 'TWELVE_PLAYERS') {
    // Top 2 de cada grupo = 8 equipos a cuartos
    summary.classification_rules = {
      qualified_per_group: 'Top 2',
      total_qualified: 8,
      next_phase: 'Cuartos de Final'
    };
    
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const group = standingsByGroup[groupNumber];
      [0, 1].forEach(position => {
        const team = group.teams[position];
        if (team) {
          summary.qualified_teams.push({
            team_id: team.team_id,
            group: parseInt(groupNumber),
            position: position + 1,
            qualification_type: position === 0 ? 'group_winner' : 'group_runner_up'
          });
        }
      });
    });
  } else if (tournamentType === 'SIXTEEN_PLAYERS') {
    // Top 2 de cada grupo = 8 equipos a octavos
    summary.classification_rules = {
      qualified_per_group: 'Top 2',
      total_qualified: 8,
      next_phase: 'Octavos de Final'
    };
    
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const group = standingsByGroup[groupNumber];
      [0, 1].forEach(position => {
        const team = group.teams[position];
        if (team) {
          summary.qualified_teams.push({
            team_id: team.team_id,
            group: parseInt(groupNumber),
            position: position + 1,
            qualification_type: position === 0 ? 'group_winner' : 'group_runner_up'
          });
        }
      });
    });
  }
  
  return summary;
}

// ========================================
// 📊 ESTADÍSTICAS DE PAGOS
// ========================================

export async function getTournamentPaymentStats(req, res) {
  const { tournamentId } = req.params;
  const { categoryId } = req.query;

  try {
    // Validar que el torneo existe
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        tournament_type,
        max_teams,
        tournament_info (
          inscription_cost
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    const inscriptionCost = tournament.tournament_info?.[0]?.inscription_cost || 0;

    // Si se especifica una categoría específica
    if (categoryId) {
      return await getCategoryPaymentStats(tournament, categoryId, inscriptionCost, res);
    }

    // Estadísticas generales del torneo
    const { data: teams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select(`
        payment_status,
        payment_amount,
        tournament_id,
        tournaments (
          category_id,
          categories (
            name
          )
        )
      `)
      .eq('tournament_id', tournamentId);

    if (teamsError) {
      return res.status(500).json({ message: 'Error obteniendo equipos', error: teamsError.message });
    }

    // Calcular estadísticas por categoría
    const categoriesStats = {};
    let totalTeams = 0;
    let paidTeams = 0;
    let pendingTeams = 0;
    let failedTeams = 0;
    let totalRevenue = 0;
    let pendingRevenue = 0;

    teams.forEach(team => {
      const categoryName = team.tournaments?.categories?.name || 'Sin categoría';
      
      if (!categoriesStats[categoryName]) {
        categoriesStats[categoryName] = {
          category_name: categoryName,
          teams: 0,
          paid_teams: 0,
          pending_teams: 0,
          failed_teams: 0,
          revenue: 0,
          pending_revenue: 0
        };
      }

      categoriesStats[categoryName].teams++;
      totalTeams++;

      switch (team.payment_status) {
        case 'paid':
          categoriesStats[categoryName].paid_teams++;
          paidTeams++;
          totalRevenue += team.payment_amount || (inscriptionCost * 2);
          break;
        case 'pending':
          categoriesStats[categoryName].pending_teams++;
          pendingTeams++;
          pendingRevenue += inscriptionCost * 2;
          break;
        case 'failed':
          categoriesStats[categoryName].failed_teams++;
          failedTeams++;
          break;
      }
    });

    // Calcular revenue pendiente para cada categoría
    Object.values(categoriesStats).forEach(cat => {
      cat.pending_revenue = cat.pending_teams * inscriptionCost * 2;
      cat.revenue = cat.paid_teams * inscriptionCost * 2;
    });

    const totalPotentialRevenue = totalTeams * inscriptionCost * 2;
    const paymentRate = totalTeams > 0 ? (paidTeams / totalTeams) * 100 : 0;

    return res.json({
      tournament_name: tournament.name,
      tournament_type: tournament.tournament_type,
      inscription_cost: inscriptionCost,
      total_categories: Object.keys(categoriesStats).length,
      total_teams: totalTeams,
      total_potential_revenue: totalPotentialRevenue,
      paid_teams: paidTeams,
      pending_teams: pendingTeams,
      failed_teams: failedTeams,
      actual_revenue: totalRevenue,
      pending_revenue: pendingRevenue,
      payment_rate: Math.round(paymentRate * 100) / 100,
      categories_breakdown: Object.values(categoriesStats)
    });

  } catch (error) {
    console.error('Error en getTournamentPaymentStats:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

async function getCategoryPaymentStats(tournament, categoryId, inscriptionCost, res) {
  try {
    // Obtener equipos de la categoría específica
    const { data: teams, error: teamsError } = await supabase
      .from('tournament_teams')

      .select(`
        id,
        payment_status,
        payment_amount,
        payment_date,
        team_id,
        teams (
          player1_id,
          player2_id,
          player1:users!player1_id (
            first_name,
            last_name
          ),
          player2:users!player2_id (
            first_name,
            last_name
          )
        ),
        tournaments (
          category_id,
          categories (
            name
          )
        )
      `)
      .eq('tournament_id', tournament.id)
      .eq('tournaments.category_id', categoryId);

    if (teamsError) {
      return res.status(500).json({ message: 'Error obteniendo equipos de la categoría', error: teamsError.message });
    }

    // Obtener información de la categoría
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('name, max_teams')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Calcular estadísticas
    let paidTeams = 0;
    let pendingTeams = 0;
    let failedTeams = 0;
    let totalRevenue = 0;
    let pendingRevenue = 0;

    const teamsDetail = teams.map(team => {
      const player1Name = `${team.teams?.player1?.first_name || ''} ${team.teams?.player1?.last_name || ''}`.trim();
      const player2Name = `${team.teams?.player2?.first_name || ''} ${team.teams?.player2?.last_name || ''}`.trim();
      
      const teamData = {
        team_id: team.team_id,
        player1_name: player1Name,
        player2_name: player2Name,
        payment_status: team.payment_status,
        payment_date: team.payment_date,
        payment_amount: team.payment_amount || inscriptionCost * 2
      };

      switch (team.payment_status) {
        case 'paid':
          paidTeams++;
          totalRevenue += teamData.payment_amount;
          break;
        case 'pending':
          pendingTeams++;
          pendingRevenue += inscriptionCost * 2;
          break;
        case 'failed':
          failedTeams++;
          break;
      }

      return teamData;
    });

    const totalTeams = teams.length;
    const paymentRate = totalTeams > 0 ? (paidTeams / totalTeams) * 100 : 0;

    return res.json({
      tournament_name: tournament.name,
      category_name: category.name,
      inscription_cost: inscriptionCost,
      max_teams: category.max_teams,
      registered_teams: totalTeams,
      paid_teams: paidTeams,
      pending_teams: pendingTeams,
      failed_teams: failedTeams,
      total_revenue: totalRevenue,
      pending_revenue: pendingRevenue,
      payment_rate: Math.round(paymentRate * 100) / 100,
      teams_detail: teamsDetail
    });

  } catch (error) {
    console.error('Error en getCategoryPaymentStats:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

export async function getTournamentPeriodStats(req, res) {
  const { start_date, end_date, period = 'monthly' } = req.query;

  try {
    // Validar fechas
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date y end_date son requeridos' });
    }

    // Obtener torneos en el período
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        start_date,
        tournament_type,
        tournament_info (
          inscription_cost
        ),
        tournament_teams (
          payment_status,
          payment_amount
        )
      `)
      .gte('start_date', start_date)
      .lte('start_date', end_date);

    if (tournamentsError) {
      return res.status(500).json({ message: 'Error obteniendo torneos', error: tournamentsError.message });
    }

    // Calcular estadísticas generales
    let totalTournaments = tournaments.length;
    let totalCategories = 0;
    let totalTeams = 0;
    let totalRevenue = 0;
    let totalPaidTeams = 0;

    const monthlyBreakdown = {};

    tournaments.forEach(tournament => {
      const inscriptionCost = tournament.tournament_info?.[0]?.inscription_cost || 0;
      const month = tournament.start_date.substring(0, 7); // YYYY-MM
      
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = {
          month,
          tournaments: 0,
          categories: 0,
          teams: 0,
          revenue: 0,
          paid_teams: 0
        };
      }

      monthlyBreakdown[month].tournaments++;
      totalCategories++;

      tournament.tournament_teams.forEach(team => {
        totalTeams++;
        monthlyBreakdown[month].teams++;

        if (team.payment_status === 'paid') {
          totalPaidTeams++;
          const revenue = team.payment_amount || (inscriptionCost * 2);
          totalRevenue += revenue;
          monthlyBreakdown[month].revenue += revenue;
          monthlyBreakdown[month].paid_teams++;
        }
      });
    });

    const averagePaymentRate = totalTeams > 0 ? (totalPaidTeams / totalTeams) * 100 : 0;

    return res.json({
      period: `${start_date} to ${end_date}`,
      total_tournaments: totalTournaments,
      total_categories: totalCategories,
      total_teams: totalTeams,
      total_revenue: totalRevenue,
      average_payment_rate: Math.round(averagePaymentRate * 100) / 100,
      monthly_breakdown: Object.values(monthlyBreakdown)
    });

  } catch (error) {
    console.error('Error en getTournamentPeriodStats:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

export async function getAvailablePlayersForTournament(req, res) {
  const tournament_id = req.params.id;

  try {
    // 1) Obtener todos los jugadores registrados en este torneo
    const { data: registeredPlayers, error: rpErr } = await supabase
      .from('tournament_teams')
      .select(`
        teams (
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournament_id);

    if (rpErr) {
      return res.status(500).json({ 
        message: rpErr.message 
      });
    }

    // 2) Extraer IDs de jugadores ya registrados
    const registeredPlayerIds = new Set();
    (registeredPlayers || []).forEach(reg => {
      if (reg.teams?.player1_id) registeredPlayerIds.add(reg.teams.player1_id);
      if (reg.teams?.player2_id) registeredPlayerIds.add(reg.teams.player2_id);
    });

    // 3) Obtener todos los usuarios/jugadores
    const { data: allPlayers, error: apErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('role', 'user') // Solo jugadores, no admins
      .order('first_name');

    if (apErr) {
      return res.status(500).json({ 
        message: apErr.message 
      });
    }

    // 4) Marcar jugadores con estado de registro
    const playersWithStatus = (allPlayers || []).map(player => ({
      ...player,
      is_registered: registeredPlayerIds.has(player.id),
      status: registeredPlayerIds.has(player.id) ? 'Ya inscrito' : 'Disponible'
    }));

    return res.json(playersWithStatus);

  } catch (error) {
    console.error('Error en getAvailablePlayersForTournament:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

// ========================================
// 📈 ESTADÍSTICAS GENERALES DE TORNEOS
// ========================================

export async function getTournamentOverviewStats(req, res) {
  try {
    // Obtener estadísticas generales
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select(`
        id,
        status,
        tournament_type,
        start_date,
        tournament_teams (
          payment_status
        )
      `);

    if (tournamentsError) {
      return res.status(500).json({ message: 'Error obteniendo torneos', error: tournamentsError.message });
    }

    // Calcular estadísticas
    let totalTournaments = tournaments.length;
    let activeTournaments = 0;
    let completedTournaments = 0;
    let upcomingTournaments = 0;
    let totalTeams = 0;
    let paidTeams = 0;

    const tournamentTypes = {};

    tournaments.forEach(tournament => {
      // Contar por estado
      switch (tournament.status) {
        case 'in_progress':
          activeTournaments++;
          break;
        case 'completed':
          completedTournaments++;
          break;
        case 'upcoming':
          upcomingTournaments++;
          break;
      }

      // Contar por tipo
      if (!tournamentTypes[tournament.tournament_type]) {
        tournamentTypes[tournament.tournament_type] = 0;
      }
      tournamentTypes[tournament.tournament_type]++;

      // Contar equipos y pagos
      tournament.tournament_teams.forEach(team => {
        totalTeams++;
        if (team.payment_status === 'paid') {
          paidTeams++;
        }
      });
    });

    const paymentRate = totalTeams > 0 ? (paidTeams / totalTeams) * 100 : 0;

    return res.json({
      total_tournaments: totalTournaments,
      active_tournaments: activeTournaments,
      completed_tournaments: completedTournaments,
      upcoming_tournaments: upcomingTournaments,
      total_teams: totalTeams,
      paid_teams: paidTeams,
      payment_rate: Math.round(paymentRate * 100) / 100,
      tournament_types: tournamentTypes
    });

  } catch (error) {
    console.error('Error en getTournamentOverviewStats:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

function generateSimpleTimeSlots(startDate, endDate, courtsAvailable = 2) {
  const slots = [];
  const start = new Date(startDate + 'T00:00:00');

  console.log(`📅 [GENERAR SLOTS] Generando slots para ${courtsAvailable} canchas`);

  // DÍA 1: 17:00-23:00 (8 bloques de 45 min hasta 23:00)
  for (let i = 0; i < 8; i++) {
    const hour = 17 + Math.floor(i * 45 / 60);
    const minute = (i * 45) % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    slots.push({
      day: 1,
      start: timeStr,
      end: addMinutesToTime(timeStr, 45),
      date: formatDateSafe(start),
      tournament_day: 1,
      id: `day1_${i}`,
      label: `Día 1 - ${timeStr}`,
      courts: courtsAvailable, // ✅ Capacidad por slot = número de canchas
      max_capacity: courtsAvailable
    });
  }

  // DÍA 2: 8:00-23:00 (20 bloques de 45 min hasta 23:00)
  const day2Date = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  for (let i = 0; i < 20; i++) {
    const hour = 8 + Math.floor(i * 45 / 60);
    const minute = (i * 45) % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    slots.push({
      day: 2,
      start: timeStr,
      end: addMinutesToTime(timeStr, 45),
      date: formatDateSafe(day2Date),
      tournament_day: 2,
      id: `day2_${i}`,
      label: `Día 2 - ${timeStr}`,
      courts: courtsAvailable, // ✅ Capacidad por slot = número de canchas
      max_capacity: courtsAvailable
    });
  }

  console.log(`✅ [SLOTS GENERADOS] Total: ${slots.length} slots × ${courtsAvailable} canchas = ${slots.length * courtsAvailable} capacidades`);

  return slots;
}

/**
 * 🎾 AUTO-SCHEDULING: Asigna automáticamente hora + cancha a partidos con día asignado
 * Endpoint: POST /tournaments/:id/schedule-matches
 */
export async function scheduleMatchesController(req, res) {
  const tournament_id = req.params.id;

  console.log(`\n🎾 [AUTO-SCHEDULING] Endpoint llamado para torneo: ${tournament_id}`);

  try {
    const result = await autoScheduleMatches(tournament_id);

    return res.status(200).json({
      message: 'Auto-scheduling completado exitosamente',
      ...result
    });
  } catch (err) {
    console.error('❌ [AUTO-SCHEDULING] Error:', err);
    return res.status(500).json({
      message: 'Error en auto-scheduling',
      error: err.message
    });
  }
}

/**
 * 📊 DASHBOARD DE SCHEDULING: Muestra estado completo del scheduling
 * Endpoint: GET /tournaments/:id/scheduling-status
 */
export async function getSchedulingStatusController(req, res) {
  const tournament_id = req.params.id;

  console.log(`\n📊 [SCHEDULING STATUS] Endpoint llamado para torneo: ${tournament_id}`);

  try {
    const status = await getSchedulingStatus(tournament_id);

    return res.status(200).json(status);
  } catch (err) {
    console.error('❌ [SCHEDULING STATUS] Error:', err);
    return res.status(500).json({
      message: 'Error obteniendo estado de scheduling',
      error: err.message
    });
  }
}

/**
 * 🕐 GET SLOT AVAILABILITY (Post-Scheduling)
 * Obtiene la disponibilidad de slots después de programar partidos
 */
export async function getSlotAvailabilityController(req, res) {
  const tournament_id = req.params.id;

  console.log(`\n🕐 [SLOT AVAILABILITY] Endpoint llamado para torneo: ${tournament_id}`);

  try {
    const availability = await getSlotAvailability(tournament_id);

    return res.status(200).json(availability);
  } catch (err) {
    console.error('❌ [SLOT AVAILABILITY] Error:', err);
    return res.status(500).json({
      message: 'Error obteniendo disponibilidad de slots',
      error: err.message
    });
  }
}

/**
 * 🏢 OBTENER SEDES Y CANCHAS DE UN TORNEO
 * Similar a getLeagueVenues para ligas
 * GET /tournaments/:tournamentId/venues
 */
export async function getTournamentVenues(req, res) {
  try {
    const { tournamentId } = req.params;

    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', tournamentId)
      .single();

    if (tError || !tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    const { data: tournamentVenues, error: tvError } = await supabase
      .from('tournament_venues')
      .select(`
        id,
        is_primary,
        courts_count,
        notes,
        venue:venue_id (
          id,
          name,
          address,
          city,
          phone,
          photo_url
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('is_primary', { ascending: false });

    if (tvError) {
      return res.status(500).json({ message: tvError.message });
    }

    const venuesWithCourts = await Promise.all(
      (tournamentVenues || []).map(async (tv) => {
        const { data: courts } = await supabase
          .from('tournament_venue_courts')
          .select(`
            id,
            is_available,
            priority,
            court:court_id (
              id,
              name,
              photo_url
            )
          `)
          .eq('tournament_venue_id', tv.id);

        return {
          ...tv,
          courts: courts?.map(c => ({
            ...c.court,
            is_available: c.is_available,
            priority: c.priority
          })) || []
        };
      })
    );

    const totalCourts = venuesWithCourts.reduce((sum, v) => sum + (v.courts?.length || 0), 0);

    res.status(200).json({
      tournament: {
        id: tournament.id,
        name: tournament.name
      },
      venues: venuesWithCourts,
      summary: {
        total_venues: venuesWithCourts.length,
        total_courts: totalCourts,
        primary_venue: venuesWithCourts.find(v => v.is_primary)?.venue?.name || null
      }
    });
  } catch (error) {
    console.error('Error en getTournamentVenues:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}