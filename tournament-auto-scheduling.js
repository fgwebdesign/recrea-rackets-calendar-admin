/**
 * 🎾 AUTO-SCHEDULING DE PARTIDOS
 *
 * Asigna automáticamente hora + cancha a partidos de grupos homogéneos
 * que ya tienen día asignado (tournament_day = 1 o 2)
 *
 * Algoritmo:
 * 1. Obtiene partidos con día asignado pero sin hora/cancha
 * 2. Obtiene slots disponibles del día correspondiente
 * 3. Filtra slots según restricciones de los equipos
 * 4. Asigna partidos distribuyendo en canchas disponibles
 * 5. Respeta capacidad de slots y evita conflictos
 * 
 * ✨ ACTUALIZADO: Soporta sistema multi-sede
 */

import { supabase } from '../config/supabaseClient.js';

/**
 * 🏢 HELPER: Obtener canchas desde multi-sede
 * (Duplicado desde tournament.controller.js para uso en este módulo)
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
    
    // Crear mapeo vacío para legacy
    courts.forEach(court => {
      if (court.venue_id) {
        venueCourtMap.set(court.id, court.venue_id);
      }
    });
    
    console.log(`🎾 Found ${courts.length} courts (legacy mode)`);
  }

  return { courts, venueCourtMap };
}

/**
 * Obtiene los slots disponibles para un día específico del torneo
 * IMPORTANTE: Solo devuelve slots de días 1 y 2 (fase de grupos)
 * El día 3 es para eliminatorias y no se programa aquí
 * @param {Object} tournament - Datos del torneo
 * @param {number} day - Día del torneo (1 o 2)
 * @returns {Array} Slots disponibles ordenados por hora
 */
function getSlotsForDay(tournament, day) {
  if (!tournament.group_time_slots || !Array.isArray(tournament.group_time_slots)) {
    return [];
  }

  // ✨ FILTRAR: Solo días 1 y 2 (fase de grupos)
  // El día 3 es para eliminatorias y se programa automáticamente al generar el bracket
  if (day !== 1 && day !== 2) {
    console.log(`⚠️  Auto-scheduling: Día ${day} no es válido para fase de grupos (solo días 1 y 2)`);
    return [];
  }

  return tournament.group_time_slots
    .filter(slot => slot.tournament_day === day)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Verifica si un equipo puede jugar en un slot específico
 * @param {Array} unavailableTimes - Array de slot IDs no disponibles (ej: ["slot_day1_1700", "slot_day2_0800"])
 * @param {string} slotId - ID único del slot (ej: "slot_day1_1700")
 * @param {string} slotStart - Hora de inicio del slot (HH:MM) - para retrocompatibilidad
 * @returns {boolean} true si puede jugar, false si tiene restricción
 */
function canTeamPlayInSlot(unavailableTimes, slotId, slotStart = null) {
  if (!unavailableTimes || !Array.isArray(unavailableTimes) || unavailableTimes.length === 0) {
    return true; // Sin restricciones
  }

  // Verificar por slot ID completo (formato nuevo: "slot_day1_1700")
  if (unavailableTimes.includes(slotId)) {
    return false;
  }
  
  // Retrocompatibilidad: verificar por hora simple (formato viejo: "17:00")
  if (slotStart && unavailableTimes.includes(slotStart)) {
    return false;
  }

  return true;
}

/**
 * Verifica si un partido puede jugarse en un slot específico
 * @param {Object} homeTeamRestrictions - Restricciones del equipo local
 * @param {Object} awayTeamRestrictions - Restricciones del equipo visitante
 * @param {string} slotId - ID único del slot (ej: "slot_day1_1700")
 * @param {string} slotStart - Hora de inicio del slot (HH:MM) - para retrocompatibilidad
 * @returns {boolean} true si ambos equipos pueden jugar
 */
function canMatchBeScheduledInSlot(homeTeamRestrictions, awayTeamRestrictions, slotId, slotStart = null) {
  const homeCanPlay = canTeamPlayInSlot(homeTeamRestrictions?.unavailable_times, slotId, slotStart);
  const awayCanPlay = canTeamPlayInSlot(awayTeamRestrictions?.unavailable_times, slotId, slotStart);

  return homeCanPlay && awayCanPlay;
}

/**
 * Asigna automáticamente hora y cancha a partidos con día asignado
 * @param {string} tournamentId - ID del torneo
 * @returns {Object} Resultado del scheduling
 */
export async function autoScheduleMatches(tournamentId) {
  console.log(`\n🎾 ========== INICIANDO AUTO-SCHEDULING ==========`);
  console.log(`📍 Torneo: ${tournamentId}`);

  // 1. Obtener torneo y sus datos
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('id, name, group_time_slots, courts_available, start_date, end_date')
    .eq('id', tournamentId)
    .single();

  if (tErr || !tournament) {
    throw new Error('Torneo no encontrado');
  }

  console.log(`📋 Torneo: ${tournament.name}`);
  console.log(`🏟️  Canchas disponibles: ${tournament.courts_available}`);

  // 2. ✨ NUEVO: Obtener canchas desde multi-sede o fallback tradicional
  const { courts, venueCourtMap } = await getTournamentCourts(tournamentId);
  
  if (!courts || courts.length === 0) {
    throw new Error('No hay canchas disponibles para este torneo');
  }

  console.log(`🎾 Canchas obtenidas (${courts.length}): ${courts.map(c => c.name).join(', ')}`);

  // 3. ✨ Obtener partidos que tienen día asignado pero sin hora/cancha
  // IMPORTANTE: Solo procesar días 1 y 2 (fase de grupos)
  // El día 3 es para eliminatorias y se programa automáticamente al generar el bracket
  const { data: matches, error: matchesErr } = await supabase
    .from('tournament_matches')
    .select(`
      id,
      tournament_day,
      group_number,
      match_number,
      home_team_id,
      away_team_id,
      start_time,
      court_id
    `)
    .eq('tournament_id', tournamentId)
    .eq('stage', 'group')
    .in('tournament_day', [1, 2]) // ✨ SOLO días 1 y 2 (fase de grupos)
    .is('start_time', null);

  if (matchesErr) {
    throw new Error(`Error obteniendo partidos: ${matchesErr.message}`);
  }

  if (!matches || matches.length === 0) {
    console.log(`⚠️  No hay partidos para programar automáticamente`);
    return {
      scheduled: 0,
      total: 0,
      message: 'No hay partidos con día asignado pendientes de programación'
    };
  }

  console.log(`📊 Total partidos a programar: ${matches.length}`);

  // 4. Obtener restricciones de todos los equipos
  const teamIds = [...new Set([...matches.map(m => m.home_team_id), ...matches.map(m => m.away_team_id)])];

  const { data: teamRestrictions, error: restErr } = await supabase
    .from('tournament_teams')
    .select('team_id, unavailable_times')
    .eq('tournament_id', tournamentId)
    .in('team_id', teamIds);

  if (restErr) {
    throw new Error(`Error obteniendo restricciones: ${restErr.message}`);
  }

  const restrictionsMap = new Map();
  (teamRestrictions || []).forEach(tr => {
    restrictionsMap.set(tr.team_id, tr);
  });

  console.log(`🔍 Restricciones cargadas para ${restrictionsMap.size} equipos`);

  // 5. Agrupar partidos por día
  const matchesByDay = {
    1: matches.filter(m => m.tournament_day === 1),
    2: matches.filter(m => m.tournament_day === 2)
  };

  console.log(`\n📅 DISTRIBUCIÓN POR DÍA:`);
  console.log(`   DÍA 1: ${matchesByDay[1].length} partidos`);
  console.log(`   DÍA 2: ${matchesByDay[2].length} partidos`);

  // 6. Obtener otras categorías del mismo evento (buscar por mismas fechas)
  const { data: eventTournaments } = await supabase
    .from('tournaments')
    .select('id')
    .eq('start_date', tournament.start_date)
    .eq('end_date', tournament.end_date)
    .neq('id', tournamentId);

  const eventTournamentIds = eventTournaments?.map(t => t.id) || [];

  console.log(`\n🌍 Verificando partidos de ${eventTournamentIds.length} categorías del mismo evento (mismas fechas)...`);

  // Obtener partidos YA PROGRAMADOS de otras categorías del MISMO EVENTO
  const { data: allScheduledMatches, error: allMatchesErr } = await supabase
    .from('tournament_matches')
    .select('id, start_time, court_id, tournament_id, tournament_day')
    .not('start_time', 'is', null)
    .in('tournament_id', eventTournamentIds);

  if (allMatchesErr) {
    console.error(`⚠️  Error obteniendo partidos de otras categorías:`, allMatchesErr);
  }

  console.log(`   📊 Partidos ya programados en otras categorías: ${allScheduledMatches?.length || 0}`);

  // Crear mapa de slots ocupados por otras categorías POR DÍA: { "day:start_time:court_id": match }
  const globalSlotUsage = new Map();
  (allScheduledMatches || []).forEach(match => {
    // Normalizar start_time a formato HH:MM (cortar segundos si existen)
    const normalizedTime = match.start_time.substring(0, 5); // "17:00:00" → "17:00"
    const key = `${match.tournament_day}:${normalizedTime}:${match.court_id.trim()}`;
    globalSlotUsage.set(key, match);
  });

  console.log(`   🔒 Slots bloqueados por otras categorías (por día): ${globalSlotUsage.size}`);

  // 7. Programar partidos por día
  const scheduledMatches = [];
  const failedMatches = [];

  for (const [day, dayMatches] of Object.entries(matchesByDay)) {
    if (dayMatches.length === 0) continue;

    console.log(`\n🔹 PROGRAMANDO DÍA ${day}:`);

    const daySlots = getSlotsForDay(tournament, parseInt(day));
    console.log(`   📊 Slots disponibles: ${daySlots.length}`);

    if (daySlots.length === 0) {
      console.log(`   ⚠️  No hay slots configurados para día ${day}`);
      failedMatches.push(...dayMatches.map(m => ({ match: m, reason: 'No hay slots configurados' })));
      continue;
    }

    // Track de slots usados por ESTE torneo: { slot_id: { court_id: [match_ids] } }
    const slotUsage = new Map();

    // Intentar programar cada partido
    for (const match of dayMatches) {
      const homeRestrictions = restrictionsMap.get(match.home_team_id);
      const awayRestrictions = restrictionsMap.get(match.away_team_id);

      let scheduled = false;

      // Intentar asignar en cada slot disponible
      for (const slot of daySlots) {
        if (!canMatchBeScheduledInSlot(homeRestrictions, awayRestrictions, slot.id, slot.start)) {
          continue; // Equipos tienen restricción en este slot
        }

        // Verificar si hay canchas disponibles en este slot
        const usageInSlot = slotUsage.get(slot.id) || new Map();

        // Buscar cancha disponible
        for (const court of courts) {
          const matchesInCourt = usageInSlot.get(court.id) || [];

          // ✨ VERIFICAR CONFLICTO GLOBAL: Verificar si otra categoría ya usa este slot+cancha EN EL MISMO DÍA
          const globalKey = `${day}:${slot.start}:${court.id.trim()}`;
          const isOccupiedByOtherCategory = globalSlotUsage.has(globalKey);

          if (matchesInCourt.length === 0 && !isOccupiedByOtherCategory) {
            // ✅ Cancha disponible en este slot (sin conflictos globales)
            scheduledMatches.push({
              match_id: match.id,
              start_time: slot.start,
              court_id: court.id,
              slot_id: slot.id,
              court_name: court.name
            });

            // Marcar como usado en tracking local
            matchesInCourt.push(match.id);
            usageInSlot.set(court.id, matchesInCourt);
            slotUsage.set(slot.id, usageInSlot);

            // ⭐ IMPORTANTE: También marcar en globalSlotUsage para evitar conflictos con partidos siguientes
            globalSlotUsage.set(globalKey, { tournament_id: tournamentId, match_id: match.id, tournament_day: parseInt(day) });

            console.log(`   ✅ Partido ${match.group_number}-${match.match_number}: ${slot.start} en ${court.name}`);

            scheduled = true;
            break;
          } else if (isOccupiedByOtherCategory) {
            const occupyingMatch = globalSlotUsage.get(globalKey);
            console.log(`   ⏭️  Slot ${slot.start} - ${court.name} ocupado por categoría ${occupyingMatch.tournament_id.slice(0, 8)}`);
          }
        }

        if (scheduled) break;
      }

      if (!scheduled) {
        failedMatches.push({ match, reason: 'No hay slots disponibles sin conflictos' });
        console.log(`   ❌ Partido ${match.group_number}-${match.match_number}: No se pudo programar`);
      }
    }
  }

  // 7. Actualizar partidos en la base de datos
  console.log(`\n💾 ACTUALIZANDO BASE DE DATOS...`);

  for (const scheduled of scheduledMatches) {
    // ✨ NUEVO: Obtener venue_id desde el mapeo si está disponible
    const venueId = venueCourtMap.get(scheduled.court_id) || null;
    
    const updateData = {
      start_time: scheduled.start_time,
      court_id: scheduled.court_id,
      status: 'scheduled'
    };
    
    // ✨ NUEVO: Agregar venue_id si está disponible (soporte multi-sede)
    if (venueId) {
      updateData.venue_id = venueId;
    }
    
    const { error: updateErr } = await supabase
      .from('tournament_matches')
      .update(updateData)
      .eq('id', scheduled.match_id);

    if (updateErr) {
      console.error(`   ❌ Error actualizando partido ${scheduled.match_id}:`, updateErr);
    }
  }

  console.log(`\n📊 RESUMEN DE AUTO-SCHEDULING:`);
  console.log(`   ✅ Partidos programados: ${scheduledMatches.length}`);
  console.log(`   ❌ Partidos sin programar: ${failedMatches.length}`);
  console.log(`========== FIN AUTO-SCHEDULING ==========\n`);

  return {
    scheduled: scheduledMatches.length,
    failed: failedMatches.length,
    total: matches.length,
    success_rate: `${Math.round((scheduledMatches.length / matches.length) * 100)}%`,
    scheduled_matches: scheduledMatches,
    failed_matches: failedMatches.map(f => ({
      match_id: f.match.id,
      group: f.match.group_number,
      match_number: f.match.match_number,
      reason: f.reason
    }))
  };
}
