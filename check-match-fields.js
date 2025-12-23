/**
 * Script para verificar qué campos devuelve el backend para los partidos
 */

const tournamentId = process.argv[2];
const adminToken = process.argv[3];
const API_URL = process.argv[4] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';

if (!tournamentId || !adminToken) {
  console.error('Uso: node check-match-fields.js <tournament_id> <admin_token> [api_url]');
  process.exit(1);
}

async function checkMatchFields() {
  try {
    console.log(`\n🔍 Verificando campos de partidos del backend\n`);
    
    const matchesResponse = await fetch(`${API_URL}/tournaments/${tournamentId}/matches`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!matchesResponse.ok) {
      throw new Error(`Error: ${matchesResponse.statusText}`);
    }
    
    const matchesData = await matchesResponse.json();
    const matches = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);
    
    if (matches.length === 0) {
      console.log('No hay partidos para verificar');
      return;
    }
    
    // Mostrar el primer partido con todos sus campos
    const firstMatch = matches[0];
    
    console.log('📋 CAMPOS DISPONIBLES EN EL PRIMER PARTIDO:\n');
    console.log(JSON.stringify(firstMatch, null, 2));
    
    console.log('\n🔍 CAMPOS RELEVANTES PARA DÍA DEL TORNEO:\n');
    console.log(`   tournament_day: ${firstMatch.tournament_day} (tipo: ${typeof firstMatch.tournament_day})`);
    console.log(`   match_day: ${firstMatch.match_day} (tipo: ${typeof firstMatch.match_day})`);
    console.log(`   start_time: ${firstMatch.start_time}`);
    console.log(`   court_name: ${firstMatch.court_name}`);
    
    // Verificar cuántos partidos tienen tournament_day
    const withTournamentDay = matches.filter(m => m.tournament_day !== undefined && m.tournament_day !== null);
    console.log(`\n📊 Partidos con tournament_day: ${withTournamentDay.length}/${matches.length}`);
    
    if (withTournamentDay.length > 0) {
      console.log('\n📅 DISTRIBUCIÓN POR DÍA:\n');
      const day1 = withTournamentDay.filter(m => m.tournament_day === 1).length;
      const day2 = withTournamentDay.filter(m => m.tournament_day === 2).length;
      const day3 = withTournamentDay.filter(m => m.tournament_day === 3).length;
      console.log(`   Día 1: ${day1} partidos`);
      console.log(`   Día 2: ${day2} partidos`);
      console.log(`   Día 3: ${day3} partidos`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMatchFields();

