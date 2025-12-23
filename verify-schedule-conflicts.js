/**
 * Script para verificar que los horarios programados NO entren en conflicto
 * con las restricciones de horarios que los equipos seleccionaron
 */

const tournamentId = process.argv[2];
const adminToken = process.argv[3];
const API_URL = process.argv[4] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';

if (!tournamentId || !adminToken) {
  console.error('Uso: node verify-schedule-conflicts.js <tournament_id> <admin_token> [api_url]');
  process.exit(1);
}

// Función para normalizar slot ID a start time
function normalizeSlotToStartTime(slotId, slotMap) {
  if (!slotId) return null;
  
  // Si ya es un start time (formato "17:00")
  if (typeof slotId === 'string' && /^\d{2}:\d{2}$/.test(slotId)) {
    return slotId;
  }
  
  // Si es un ID de slot (formato "slot_day1_1700")
  if (typeof slotId === 'string' && slotId.startsWith('slot_day')) {
    const match = slotId.match(/slot_day(\d+)_(\d+)/);
    if (match) {
      const time = match[2];
      return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    }
  }
  
  // Intentar buscar en el mapa de slots
  if (slotMap && slotMap[slotId]) {
    return slotMap[slotId].start;
  }
  
  return slotId;
}

async function verifyScheduleConflicts() {
  try {
    console.log(`\n🔍 VERIFICANDO CONFLICTOS DE HORARIOS PROGRAMADOS\n`);
    console.log(`📍 Torneo: ${tournamentId}\n`);
    
    // 1. Obtener torneo y slots
    const tournamentResponse = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tournamentResponse.ok) {
      throw new Error(`Error obteniendo torneo: ${tournamentResponse.statusText}`);
    }
    
    const tournament = await tournamentResponse.json();
    
    // Crear mapa de slots para normalización
    const slotMap = {};
    if (tournament.group_time_slots && Array.isArray(tournament.group_time_slots)) {
      tournament.group_time_slots.forEach(slot => {
        if (slot.id) slotMap[slot.id] = slot;
        if (slot.start) slotMap[slot.start] = slot;
      });
    }
    
    // 2. Obtener partidos programados
    const matchesResponse = await fetch(`${API_URL}/tournaments/${tournamentId}/matches`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!matchesResponse.ok) {
      throw new Error(`Error obteniendo partidos: ${matchesResponse.statusText}`);
    }
    
    const matchesData = await matchesResponse.json();
    const matches = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);
    
    // Filtrar solo partidos programados (con hora y cancha)
    const scheduledMatches = matches.filter(m => m.start_time && m.court_id);
    
    console.log(`📊 Partidos programados: ${scheduledMatches.length}\n`);
    
    // 3. Obtener equipos con sus restricciones
    const teamsResponse = await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!teamsResponse.ok) {
      throw new Error(`Error obteniendo equipos: ${teamsResponse.statusText}`);
    }
    
    const teamsData = await teamsResponse.json();
    const teams = teamsData.teams || (Array.isArray(teamsData) ? teamsData : []);
    
    // Crear mapa de restricciones por equipo
    const teamRestrictionsMap = new Map();
    teams.forEach(team => {
      const unavailableTimes = team.unavailable_times;
      let normalizedRestrictions = [];
      
      if (Array.isArray(unavailableTimes)) {
        normalizedRestrictions = unavailableTimes.map(slot => 
          normalizeSlotToStartTime(slot, slotMap)
        ).filter(Boolean);
      } else if (typeof unavailableTimes === 'string') {
        const normalized = normalizeSlotToStartTime(unavailableTimes, slotMap);
        if (normalized) normalizedRestrictions.push(normalized);
      }
      
      teamRestrictionsMap.set(team.team_id, {
        team_id: team.team_id,
        restrictions: normalizedRestrictions,
        team_info: team.teams
      });
    });
    
    console.log(`👥 Equipos analizados: ${teams.length}\n`);
    
    // 4. Verificar conflictos
    const conflicts = [];
    
    scheduledMatches.forEach(match => {
      // Normalizar hora del partido (formato HH:MM)
      const matchTime = match.start_time ? match.start_time.substring(0, 5) : null;
      
      if (!matchTime) return;
      
      // Verificar restricciones del equipo local
      const homeRestrictions = teamRestrictionsMap.get(match.home_team_id);
      if (homeRestrictions && homeRestrictions.restrictions.includes(matchTime)) {
        const player1 = homeRestrictions.team_info?.player1;
        const player2 = homeRestrictions.team_info?.player2;
        const teamName = player1 && player2
          ? `${player1.first_name} ${player1.last_name} / ${player2.first_name} ${player2.last_name}`
          : `Equipo ${match.home_team_id.slice(-8)}`;
        
        conflicts.push({
          match_id: match.id,
          match_number: match.match_number,
          group_number: match.group_number,
          team_id: match.home_team_id,
          team_name: teamName,
          team_type: 'home',
          scheduled_time: matchTime,
          scheduled_court: match.court_name || `Court ${match.court_id}`,
          scheduled_day: match.tournament_day,
          conflict_type: 'RESTRICTION_VIOLATION',
          restriction: matchTime
        });
      }
      
      // Verificar restricciones del equipo visitante
      const awayRestrictions = teamRestrictionsMap.get(match.away_team_id);
      if (awayRestrictions && awayRestrictions.restrictions.includes(matchTime)) {
        const player1 = awayRestrictions.team_info?.player1;
        const player2 = awayRestrictions.team_info?.player2;
        const teamName = player1 && player2
          ? `${player1.first_name} ${player1.last_name} / ${player2.first_name} ${player2.last_name}`
          : `Equipo ${match.away_team_id.slice(-8)}`;
        
        conflicts.push({
          match_id: match.id,
          match_number: match.match_number,
          group_number: match.group_number,
          team_id: match.away_team_id,
          team_name: teamName,
          team_type: 'away',
          scheduled_time: matchTime,
          scheduled_court: match.court_name || `Court ${match.court_id}`,
          scheduled_day: match.tournament_day,
          conflict_type: 'RESTRICTION_VIOLATION',
          restriction: matchTime
        });
      }
    });
    
    // 5. Mostrar resultados
    console.log('='.repeat(80));
    console.log('📋 RESULTADO DE VERIFICACIÓN\n');
    
    if (conflicts.length === 0) {
      console.log('✅ ¡PERFECTO! No se encontraron conflictos de horarios.');
      console.log('   Todos los partidos están programados respetando las restricciones de los equipos.\n');
    } else {
      console.log(`❌ SE ENCONTRARON ${conflicts.length} CONFLICTO(S) DE HORARIOS:\n`);
      
      conflicts.forEach((conflict, idx) => {
        console.log(`   ${idx + 1}. CONFLICTO EN PARTIDO ${conflict.group_number}-${conflict.match_number}:`);
        console.log(`      Equipo: ${conflict.team_name} (${conflict.team_type === 'home' ? 'Local' : 'Visitante'})`);
        console.log(`      Horario programado: ${conflict.scheduled_time} (Día ${conflict.scheduled_day})`);
        console.log(`      Cancha: ${conflict.scheduled_court}`);
        console.log(`      ⚠️  Este equipo marcó ${conflict.restriction} como NO DISPONIBLE`);
        console.log('');
      });
      
      console.log('='.repeat(80));
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('   Estos partidos necesitan ser reprogramados para evitar conflictos.\n');
    }
    
    // 6. Resumen detallado
    console.log('📊 RESUMEN DETALLADO:\n');
    console.log(`   Total partidos programados: ${scheduledMatches.length}`);
    console.log(`   Total equipos analizados: ${teams.length}`);
    console.log(`   Conflictos encontrados: ${conflicts.length}`);
    console.log(`   Tasa de éxito: ${((scheduledMatches.length - conflicts.length) / scheduledMatches.length * 100).toFixed(1)}%\n`);
    
    // 7. Mostrar distribución de restricciones
    const teamsWithRestrictions = Array.from(teamRestrictionsMap.values())
      .filter(t => t.restrictions.length > 0);
    
    console.log(`📋 EQUIPOS CON RESTRICCIONES: ${teamsWithRestrictions.length}\n`);
    teamsWithRestrictions.forEach(team => {
      const player1 = team.team_info?.player1;
      const player2 = team.team_info?.player2;
      const teamName = player1 && player2
        ? `${player1.first_name} ${player1.last_name} / ${player2.first_name} ${player2.last_name}`
        : `Equipo ${team.team_id.slice(-8)}`;
      
      console.log(`   - ${teamName}: ${team.restrictions.join(', ')}`);
    });
    
    console.log('\n');
    
    return {
      total_matches: scheduledMatches.length,
      total_teams: teams.length,
      conflicts: conflicts.length,
      conflicts_list: conflicts,
      success_rate: ((scheduledMatches.length - conflicts.length) / scheduledMatches.length * 100).toFixed(1)
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyScheduleConflicts();

