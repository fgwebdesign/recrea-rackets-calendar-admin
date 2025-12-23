/**
 * Script de verificación de grupos de torneo
 * Verifica que los grupos se hayan generado correctamente sin conflictos de horarios
 * 
 * Uso: node verify-groups.js <tournament_id> <admin_token> [api_url]
 * 
 * Ejemplo:
 * node verify-groups.js 8b96f0d3-d088-460b-8f24-52e46bef0df9 "token..." http://localhost:9999
 */

const API_URL = process.argv[4] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';

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

// Función para verificar conflictos en un grupo
function checkGroupConflicts(group, teamsData, slotMap) {
  const conflicts = [];
  
  // Manejar teams que puede ser array o string JSON
  let groupTeamIds = [];
  if (Array.isArray(group.teams)) {
    groupTeamIds = group.teams;
  } else if (typeof group.teams === 'string') {
    try {
      groupTeamIds = JSON.parse(group.teams);
    } catch (e) {
      console.warn(`⚠️  Error parseando teams del grupo ${group.group_number}:`, e.message);
      groupTeamIds = [];
    }
  }
  
  const groupTeams = teamsData.filter(team => 
    groupTeamIds.includes(team.team_id)
  );
  
  // Crear mapa de restricciones por equipo
  const teamRestrictions = {};
  groupTeams.forEach(team => {
    const unavailableTimes = team.unavailable_times;
    let normalizedTimes = [];
    
    if (Array.isArray(unavailableTimes)) {
      normalizedTimes = unavailableTimes.map(slot => 
        normalizeSlotToStartTime(slot, slotMap)
      ).filter(Boolean);
    } else if (typeof unavailableTimes === 'string') {
      const normalized = normalizeSlotToStartTime(unavailableTimes, slotMap);
      if (normalized) normalizedTimes.push(normalized);
    }
    
    teamRestrictions[team.team_id] = normalizedTimes;
  });
  
  // Verificar conflictos entre equipos del mismo grupo
  for (let i = 0; i < groupTeams.length; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      const team1 = groupTeams[i];
      const team2 = groupTeams[j];
      const restrictions1 = teamRestrictions[team1.team_id] || [];
      const restrictions2 = teamRestrictions[team2.team_id] || [];
      
      // Encontrar horarios comunes (conflictos)
      const commonRestrictions = restrictions1.filter(r => restrictions2.includes(r));
      
      if (commonRestrictions.length > 0) {
        conflicts.push({
          team1: team1,
          team2: team2,
          conflictingSlots: commonRestrictions,
          severity: commonRestrictions.length >= 2 ? 'HIGH' : 'MEDIUM'
        });
      }
    }
  }
  
  return {
    groupNumber: group.group_number,
    teams: groupTeams,
    conflicts: conflicts,
    hasConflicts: conflicts.length > 0
  };
}

// Función principal de verificación
async function verifyTournamentGroups(tournamentId, adminToken) {
  try {
    console.log(`\n🔍 Verificando grupos del torneo: ${tournamentId}`);
    console.log(`🌐 API URL: ${API_URL}\n`);
    
    // 1. Obtener información del torneo
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
    if (!tournament) {
      throw new Error('Torneo no encontrado');
    }
    
    console.log(`✅ Torneo encontrado: ${tournament.name}`);
    console.log(`   Tipo: ${tournament.tournament_type}`);
    console.log(`   Categoría: ${tournament.category_id}\n`);
    
    // 2. Obtener grupos
    const groupsResponse = await fetch(`${API_URL}/tournaments/${tournamentId}/groups`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!groupsResponse.ok) {
      const errorText = await groupsResponse.text();
      throw new Error(`Error obteniendo grupos: ${groupsResponse.statusText} - ${errorText}`);
    }
    
    const groupsData = await groupsResponse.json();
    // El endpoint devuelve { message: 'Grupos del torneo', groups: data }
    const groups = groupsData.groups || (Array.isArray(groupsData) ? groupsData : []);
    console.log(`✅ Grupos encontrados: ${groups.length}\n`);
    
    if (groups.length === 0) {
      console.log('⚠️  No hay grupos generados para este torneo');
      return;
    }
    
    // 3. Obtener equipos con sus restricciones
    const teamsResponse = await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      throw new Error(`Error obteniendo equipos: ${teamsResponse.statusText} - ${errorText}`);
    }
    
    const teamsData = await teamsResponse.json();
    // El endpoint devuelve { message: 'Tournament teams retrieved successfully', teams: teams }
    const teams = teamsData.teams || (Array.isArray(teamsData) ? teamsData : []);
    console.log(`✅ Equipos encontrados: ${teams.length}\n`);
    
    // 4. Crear mapa de slots para normalización
    const slotMap = {};
    if (tournament.group_time_slots && Array.isArray(tournament.group_time_slots)) {
      tournament.group_time_slots.forEach(slot => {
        if (slot.id) slotMap[slot.id] = slot;
        if (slot.start) slotMap[slot.start] = slot;
      });
    }
    
    console.log(`🔍 Mapa de slots creado: ${Object.keys(slotMap).length} entradas\n`);
    
    // 5. Verificar cada grupo
    console.log('📊 ANÁLISIS DE GRUPOS:\n');
    console.log('='.repeat(80));
    
    let totalConflicts = 0;
    const groupAnalyses = [];
    
    groups.forEach(group => {
      const analysis = checkGroupConflicts(group, teams, slotMap);
      groupAnalyses.push(analysis);
      
      console.log(`\n📋 GRUPO ${analysis.groupNumber}:`);
      console.log(`   Equipos: ${analysis.teams.length}`);
      
      // Mostrar equipos y sus restricciones
      analysis.teams.forEach(team => {
        const unavailableTimes = team.unavailable_times;
        let normalizedTimes = [];
        
        if (Array.isArray(unavailableTimes)) {
          normalizedTimes = unavailableTimes.map(slot => 
            normalizeSlotToStartTime(slot, slotMap)
          ).filter(Boolean);
        } else if (typeof unavailableTimes === 'string') {
          const normalized = normalizeSlotToStartTime(unavailableTimes, slotMap);
          if (normalized) normalizedTimes.push(normalized);
        }
        
        const player1 = team.teams?.player1;
        const player2 = team.teams?.player2;
        const teamName = player1 && player2 
          ? `${player1.first_name} ${player1.last_name} / ${player2.first_name} ${player2.last_name}`
          : `Equipo ${team.team_id.slice(-8)}`;
        
        console.log(`   - ${teamName}`);
        console.log(`     Restricciones: ${normalizedTimes.length > 0 ? normalizedTimes.join(', ') : 'Sin restricciones'}`);
      });
      
      // Mostrar conflictos si los hay
      if (analysis.hasConflicts) {
        totalConflicts += analysis.conflicts.length;
        console.log(`\n   ⚠️  CONFLICTOS DETECTADOS: ${analysis.conflicts.length}`);
        analysis.conflicts.forEach(conflict => {
          const team1Name = conflict.team1.teams?.player1 && conflict.team1.teams?.player2
            ? `${conflict.team1.teams.player1.first_name} ${conflict.team1.teams.player1.last_name} / ${conflict.team1.teams.player2.first_name} ${conflict.team1.teams.player2.last_name}`
            : `Equipo ${conflict.team1.team_id.slice(-8)}`;
          
          const team2Name = conflict.team2.teams?.player1 && conflict.team2.teams?.player2
            ? `${conflict.team2.teams.player1.first_name} ${conflict.team2.teams.player1.last_name} / ${conflict.team2.teams.player2.first_name} ${conflict.team2.teams.player2.last_name}`
            : `Equipo ${conflict.team2.team_id.slice(-8)}`;
          
          console.log(`     ❌ ${team1Name} vs ${team2Name}`);
          console.log(`        Horarios conflictivos: ${conflict.conflictingSlots.join(', ')}`);
          console.log(`        Severidad: ${conflict.severity}`);
        });
      } else {
        console.log(`\n   ✅ Sin conflictos - Grupo bien distribuido`);
      }
    });
    
    // 6. Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:\n');
    console.log(`   Total grupos: ${groups.length}`);
    console.log(`   Total equipos: ${teams.length}`);
    console.log(`   Grupos con conflictos: ${groupAnalyses.filter(a => a.hasConflicts).length}`);
    console.log(`   Total conflictos encontrados: ${totalConflicts}`);
    
    if (totalConflicts === 0) {
      console.log('\n   ✅ ¡EXCELENTE! Todos los grupos están bien distribuidos sin conflictos de horarios.');
    } else {
      console.log('\n   ⚠️  ADVERTENCIA: Se encontraron conflictos de horarios en algunos grupos.');
      console.log('      Esto puede causar problemas al programar los partidos.');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar verificación
const tournamentId = process.argv[2];
const adminToken = process.argv[3];
const customApiUrl = process.argv[4];

if (!tournamentId || !adminToken) {
  console.error('Uso: node verify-groups.js <tournament_id> <admin_token> [api_url]');
  console.error('');
  console.error('Ejemplo:');
  console.error('  node verify-groups.js 8b96f0d3-d088-460b-8f24-52e46bef0df9 "token..." http://localhost:9999');
  process.exit(1);
}

if (customApiUrl) {
  const API_URL = customApiUrl;
}

verifyTournamentGroups(tournamentId, adminToken);

