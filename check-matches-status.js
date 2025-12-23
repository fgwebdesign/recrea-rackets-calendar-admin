/**
 * Script para verificar el estado de los partidos antes de ejecutar auto-scheduling
 */

const tournamentId = process.argv[2];
const adminToken = process.argv[3];
const API_URL = process.argv[4] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';

if (!tournamentId || !adminToken) {
  console.error('Uso: node check-matches-status.js <tournament_id> <admin_token> [api_url]');
  process.exit(1);
}

async function checkMatchesStatus() {
  try {
    console.log(`\n🔍 Verificando estado de partidos del torneo: ${tournamentId}\n`);
    
    // Obtener partidos
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
    
    console.log(`📊 Total partidos: ${matches.length}\n`);
    
    // Analizar partidos
    const byStatus = {
      scheduled: matches.filter(m => m.start_time && m.court_id),
      unscheduled: matches.filter(m => !m.start_time || !m.court_id),
      withDay: matches.filter(m => m.tournament_day === 1 || m.tournament_day === 2),
      withoutDay: matches.filter(m => !m.tournament_day || (m.tournament_day !== 1 && m.tournament_day !== 2)),
      day1: matches.filter(m => m.tournament_day === 1),
      day2: matches.filter(m => m.tournament_day === 2)
    };
    
    console.log(`📈 ESTADÍSTICAS:`);
    console.log(`   ✅ Programados (con hora y cancha): ${byStatus.scheduled.length}`);
    console.log(`   ⏳ Sin programar: ${byStatus.unscheduled.length}`);
    console.log(`   📅 Con día asignado (1 o 2): ${byStatus.withDay.length}`);
    console.log(`   ❌ Sin día asignado: ${byStatus.withoutDay.length}`);
    console.log(`   ☀️  Día 1: ${byStatus.day1.length}`);
    console.log(`   🌙 Día 2: ${byStatus.day2.length}\n`);
    
    // Partidos que pueden ser programados automáticamente
    const canBeScheduled = matches.filter(m => 
      (m.tournament_day === 1 || m.tournament_day === 2) && 
      (!m.start_time || !m.court_id) &&
      m.stage === 'group'
    );
    
    console.log(`🎯 PARTIDOS QUE PUEDEN SER PROGRAMADOS AUTOMÁTICAMENTE: ${canBeScheduled.length}\n`);
    
    if (canBeScheduled.length > 0) {
      console.log(`   Lista de partidos pendientes:`);
      canBeScheduled.forEach((match, idx) => {
        console.log(`   ${idx + 1}. Grupo ${match.group_number} - Partido ${match.match_number} (Día ${match.tournament_day})`);
      });
      console.log(`\n✅ Puedes ejecutar el auto-scheduling para estos ${canBeScheduled.length} partidos\n`);
    } else {
      console.log(`⚠️  No hay partidos que puedan ser programados automáticamente`);
      if (byStatus.withoutDay.length > 0) {
        console.log(`   ${byStatus.withoutDay.length} partidos no tienen día asignado (necesitan asignación manual)`);
      }
      if (byStatus.scheduled.length === matches.length) {
        console.log(`   Todos los partidos ya están programados`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMatchesStatus();

