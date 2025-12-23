/**
 * Script para ejecutar auto-scheduling de partidos
 */

const tournamentId = process.argv[2];
const adminToken = process.argv[3];
const API_URL = process.argv[4] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';

if (!tournamentId || !adminToken) {
  console.error('Uso: node run-auto-scheduling.js <tournament_id> <admin_token> [api_url]');
  process.exit(1);
}

async function runAutoScheduling() {
  try {
    console.log(`\n🎾 Ejecutando auto-scheduling para torneo: ${tournamentId}\n`);
    
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/schedule-matches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log(`\n✅ AUTO-SCHEDULING COMPLETADO:\n`);
    console.log(`   📊 Total partidos: ${result.total}`);
    console.log(`   ✅ Programados: ${result.scheduled}`);
    console.log(`   ❌ Fallidos: ${result.failed}`);
    console.log(`   📈 Tasa de éxito: ${result.success_rate}\n`);
    
    if (result.scheduled_matches && result.scheduled_matches.length > 0) {
      console.log(`   📋 PARTIDOS PROGRAMADOS:\n`);
      result.scheduled_matches.forEach((match, idx) => {
        console.log(`   ${idx + 1}. ${match.court_name || `Cancha ${match.court_id}`} - ${match.start_time}`);
      });
    }
    
    if (result.failed_matches && result.failed_matches.length > 0) {
      console.log(`\n   ⚠️  PARTIDOS NO PROGRAMADOS:\n`);
      result.failed_matches.forEach((match, idx) => {
        console.log(`   ${idx + 1}. Grupo ${match.group} - Partido ${match.match_number}: ${match.reason}`);
      });
    }
    
    console.log(`\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runAutoScheduling();

