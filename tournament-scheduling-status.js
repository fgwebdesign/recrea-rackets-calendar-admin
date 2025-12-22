/**
 * 📊 DASHBOARD DE ESTADO DE SCHEDULING
 *
 * Proporciona visibilidad completa del estado de programación del torneo
 * para que el admin pueda revisar y validar las decisiones automáticas
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
    .select('id, venue_id, is_primary')
    .eq('tournament_id', tournamentId)
    .order('is_primary', { ascending: false });

  let courts = [];

  if (venuesError) {
    console.error('Error fetching tournament venues:', venuesError);
  }

  if (tournamentVenues && tournamentVenues.length > 0) {
    // Torneo tiene multi-sede configurada
    const tournamentVenueIds = tournamentVenues.map(tv => tv.id);
    
    const { data: tournamentVenueCourts, error: courtsError } = await supabase
      .from('tournament_venue_courts')
      .select('court_id, is_available')
      .in('tournament_venue_id', tournamentVenueIds)
      .eq('is_available', true);

    if (courtsError) {
      console.error('Error fetching tournament venue courts:', courtsError);
      return { courts: [], courtsCount: 0 };
    }

    courts = tournamentVenueCourts || [];
    console.log(`🎾 Found ${courts.length} courts from multi-sede`);
  } else {
    // Fallback: obtener desde tournament.courts_available
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('courts_available')
      .eq('id', tournamentId)
      .single();
    
    if (!tournamentError && tournament) {
      courts = Array(tournament.courts_available || 0).fill(null); // Array de tamaño courts_available
      console.log(`🎾 Using ${courts.length} courts (legacy mode)`);
    }
  }

  return { courts, courtsCount: courts.length };
}

/**
 * Obtiene el estado completo de scheduling de un torneo
 * @param {string} tournamentId - ID del torneo
 * @returns {Object} Estado detallado del scheduling
 */
export async function getSchedulingStatus(tournamentId) {
  console.log(`\n📊 ========== OBTENIENDO ESTADO DE SCHEDULING ==========`);
  console.log(`📍 Torneo: ${tournamentId}`);

  // 1. Obtener torneo
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('id, name, tournament_type, start_date, end_date, courts_available, group_time_slots')
    .eq('id', tournamentId)
    .single();

  if (tErr || !tournament) {
    throw new Error('Torneo no encontrado');
  }

  // ✨ NUEVO: Obtener canchas reales desde multi-sede
  const { courtsCount } = await getTournamentCourts(tournamentId);
  const actualCourtsAvailable = courtsCount > 0 ? courtsCount : tournament.courts_available;
  
  console.log(`🏟️  Canchas disponibles: ${actualCourtsAvailable} (multi-sede: ${courtsCount > 0 ? 'Sí' : 'No'})`);

  // 2. Obtener grupos
  const { data: groups, error: gErr } = await supabase
    .from('tournament_groups')
    .select('id, group_number, teams, preferred_day, is_homogeneous, status')
    .eq('tournament_id', tournamentId)
    .order('group_number');

  if (gErr) {
    throw new Error(`Error obteniendo grupos: ${gErr.message}`);
  }

  // 3. Obtener partidos
  const { data: matches, error: mErr } = await supabase
    .from('tournament_matches')
    .select('id, group_id, group_number, tournament_day, start_time, court_id, status, home_team_id, away_team_id')
    .eq('tournament_id', tournamentId)
    .eq('stage', 'group');

  if (mErr) {
    throw new Error(`Error obteniendo partidos: ${mErr.message}`);
  }

  // 4. Obtener restricciones de equipos
  const teamIds = [...new Set([...matches.map(m => m.home_team_id), ...matches.map(m => m.away_team_id)])];

  const { data: teamRestrictions, error: restErr } = await supabase
    .from('tournament_teams')
    .select('team_id, unavailable_times')
    .eq('tournament_id', tournamentId)
    .in('team_id', teamIds);

  if (restErr) {
    console.error(`⚠️  Error obteniendo restricciones:`, restErr);
  }

  // 5. Analizar estado
  const analysis = analyzeSchedulingStatus(tournament, groups, matches, teamRestrictions || []);

  console.log(`\n📊 ANÁLISIS COMPLETADO:`);
  console.log(`   ✅ Grupos: ${groups?.length || 0}`);
  console.log(`   ✅ Partidos: ${matches?.length || 0}`);
  console.log(`   ✅ Programados: ${analysis.matches_summary.scheduled}`);
  console.log(`========== FIN ESTADO DE SCHEDULING ==========\n`);

  return analysis;
}

/**
 * Analiza el estado de scheduling del torneo
 */
function analyzeSchedulingStatus(tournament, groups, matches, teamRestrictions) {
  // Análisis de grupos
  const groupsAnalysis = (groups || []).map(group => {
    const groupMatches = matches.filter(m => m.group_id === group.id);
    const scheduledMatches = groupMatches.filter(m => m.start_time !== null);
    const dayAssigned = groupMatches.some(m => m.tournament_day !== null);

    // Obtener restricciones de equipos del grupo
    const groupTeamRestrictions = teamRestrictions.filter(tr => group.teams.includes(tr.team_id));

    let status;
    let needsAction = false;
    let actionDescription = null;

    if (scheduledMatches.length === groupMatches.length) {
      status = '✅ Completamente programado';
    } else if (dayAssigned) {
      status = '⏳ Día asignado, pendiente de horarios';
      needsAction = true;
      actionDescription = 'Ejecutar POST /schedule-matches para asignar horarios';
    } else {
      status = '⚠️ Sin día asignado';
      needsAction = true;
      actionDescription = 'Generar grupos primero con POST /generate-groups';
    }

    return {
      id: group.id,
      group_number: group.group_number,
      preferred_day: group.preferred_day,
      is_homogeneous: group.is_homogeneous,
      teams_count: group.teams.length,
      status,
      needs_action: needsAction,
      action_description: actionDescription,
      matches: {
        total: groupMatches.length,
        scheduled: scheduledMatches.length,
        pending: groupMatches.length - scheduledMatches.length
      },
      restrictions: {
        teams_with_restrictions: groupTeamRestrictions.filter(tr => tr.unavailable_times?.length > 0).length,
        total_restrictions: groupTeamRestrictions.reduce((sum, tr) => sum + (tr.unavailable_times?.length || 0), 0)
      }
    };
  });

  // Análisis de partidos
  const matchesByDay = {
    day1: matches.filter(m => m.tournament_day === 1),
    day2: matches.filter(m => m.tournament_day === 2),
    unassigned: matches.filter(m => m.tournament_day === null)
  };

  const scheduledMatches = matches.filter(m => m.start_time !== null);
  const pendingMatches = matches.filter(m => m.start_time === null);

  // Análisis de slots
  const day1Slots = (tournament.group_time_slots || []).filter(s => s.tournament_day === 1);
  const day2Slots = (tournament.group_time_slots || []).filter(s => s.tournament_day === 2);

  // ✨ NUEVO: Usar canchas reales desde multi-sede
  const slotsCapacity = {
    day1: {
      total_slots: day1Slots.length,
      capacity_per_slot: actualCourtsAvailable,
      total_capacity: day1Slots.length * actualCourtsAvailable,
      matches_assigned: matchesByDay.day1.filter(m => m.start_time !== null).length,
      matches_pending: matchesByDay.day1.filter(m => m.start_time === null).length,
      utilization_percentage: ((matchesByDay.day1.filter(m => m.start_time !== null).length) / (day1Slots.length * actualCourtsAvailable) * 100).toFixed(1)
    },
    day2: {
      total_slots: day2Slots.length,
      capacity_per_slot: actualCourtsAvailable,
      total_capacity: day2Slots.length * actualCourtsAvailable,
      matches_assigned: matchesByDay.day2.filter(m => m.start_time !== null).length,
      matches_pending: matchesByDay.day2.filter(m => m.start_time === null).length,
      utilization_percentage: ((matchesByDay.day2.filter(m => m.start_time !== null).length) / (day2Slots.length * actualCourtsAvailable) * 100).toFixed(1)
    }
  };

  // Determinar siguiente acción
  let nextAction = null;
  if (groups.length === 0) {
    nextAction = {
      action: 'Generar grupos',
      endpoint: `POST /tournaments/${tournament.id}/generate-groups`,
      description: 'Crear grupos y asignar días automáticamente'
    };
  } else if (pendingMatches.length > 0 && matchesByDay.unassigned.length === 0) {
    nextAction = {
      action: 'Auto-programar partidos',
      endpoint: `POST /tournaments/${tournament.id}/schedule-matches`,
      description: `Asignar horarios y canchas a ${pendingMatches.length} partidos pendientes`
    };
  } else if (matchesByDay.unassigned.length > 0) {
    nextAction = {
      action: 'Grupos sin día asignado detectados',
      endpoint: `POST /tournaments/${tournament.id}/generate-groups`,
      description: 'Regenerar grupos para asignar días automáticamente'
    };
  } else {
    nextAction = {
      action: 'Scheduling completado',
      endpoint: null,
      description: '✅ Todos los partidos están programados'
    };
  }

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      tournament_type: tournament.tournament_type,
      courts_available: actualCourtsAvailable, // ✨ NUEVO: Usar canchas reales desde multi-sede
      courts_available_legacy: tournament.courts_available, // Mantener para referencia
      start_date: tournament.start_date,
      end_date: tournament.end_date
    },
    groups_summary: {
      total: groups.length,
      homogeneous: groups.filter(g => g.is_homogeneous).length,
      mixed: groups.filter(g => !g.is_homogeneous).length,
      day1: groups.filter(g => g.preferred_day === 'DAY_1').length,
      day2: groups.filter(g => g.preferred_day === 'DAY_2').length
    },
    matches_summary: {
      total: matches.length,
      scheduled: scheduledMatches.length,
      pending: pendingMatches.length,
      day1_assigned: matchesByDay.day1.length,
      day2_assigned: matchesByDay.day2.length,
      unassigned: matchesByDay.unassigned.length,
      completion_percentage: ((scheduledMatches.length / matches.length) * 100).toFixed(1)
    },
    slots_capacity: slotsCapacity,
    groups: groupsAnalysis,
    next_action: nextAction,
    warnings: generateWarnings(slotsCapacity, matchesByDay, groups)
  };
}

/**
 * Genera advertencias basadas en el análisis
 */
function generateWarnings(slotsCapacity, matchesByDay, groups) {
  const warnings = [];

  // Advertencia de sobrecapacidad
  if (matchesByDay.day1.length > slotsCapacity.day1.total_capacity) {
    warnings.push({
      level: 'error',
      message: `Día 1 sobrecargado: ${matchesByDay.day1.length} partidos pero solo ${slotsCapacity.day1.total_capacity} slots disponibles`
    });
  }

  if (matchesByDay.day2.length > slotsCapacity.day2.total_capacity) {
    warnings.push({
      level: 'error',
      message: `Día 2 sobrecargado: ${matchesByDay.day2.length} partidos pero solo ${slotsCapacity.day2.total_capacity} slots disponibles`
    });
  }

  // Advertencia de desbalance
  const day1Percentage = parseFloat(slotsCapacity.day1.utilization_percentage);
  const day2Percentage = parseFloat(slotsCapacity.day2.utilization_percentage);

  if (Math.abs(day1Percentage - day2Percentage) > 30) {
    warnings.push({
      level: 'warning',
      message: `Desbalance de carga: Día 1 (${day1Percentage}%) vs Día 2 (${day2Percentage}%)`
    });
  }

  // Advertencia de grupos mixtos (no debería pasar con el nuevo sistema)
  const mixedGroups = groups.filter(g => !g.is_homogeneous);
  if (mixedGroups.length > 0) {
    warnings.push({
      level: 'info',
      message: `${mixedGroups.length} grupos fueron asignados automáticamente (originalmente mixtos)`
    });
  }

  return warnings;
}
