/**
 * Script para inscribir equipos en las 4 categorías de la Liga de Recrea
 * 
 * Configuración:
 * - 1 sede
 * - 2 canchas
 * - 4 categorías
 * - 2 match_times (22:30, 23:15)
 * - 8 equipos por categoría
 * 
 * Uso: node inscripciones-liga.js
 * 
 * Nota: Requiere Node.js 18+ (para soporte nativo de fetch)
 *       O instalar: npm install node-fetch
 */

// Verificar que fetch esté disponible (Node.js 18+ tiene fetch nativo)
if (typeof globalThis.fetch === 'undefined') {
  console.error('❌ Error: fetch no está disponible.');
  console.error('   Este script requiere Node.js 18+ o instalar node-fetch: npm install node-fetch');
  process.exit(1);
}

const fetch = globalThis.fetch;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Imd2c1pmT0NCR29sMCtVNUsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xvaHNveGl6b2xpdWhpcmx4eXBmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMzE4ZWEzNC1hNTFkLTRhOTEtOGE4OC1lM2NiMmEwZDJiNGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2MzYzMDQwLCJpYXQiOjE3NjYzNTk0NDAsImVtYWlsIjoieWVnb2Vsdmlnb3RlMTVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InllZ29lbHZpZ290ZTE1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdF9uYW1lIjoiRmVsaXBlIiwibGFzdF9uYW1lIjoiR3V0aWVycmV6IiwicGhvbmUiOiIxMjMtNDU2NyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZjMxOGVhMzQtYTUxZC00YTkxLThhODgtZTNjYjJhMGQyYjRkIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjYzNTk0NDB9XSwic2Vzc2lvbl9pZCI6IjRkZjY3MjI5LWI4ZjEtNDZkNC1hZWY0LWJmODQ0OWVkNDdkZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.kq1MOQfr894t8EtZTRqP7D8LdwytxJ7iWAjSPKp4pB0';

// IDs de las 4 ligas (categorías) - NUEVA LIGA
const LEAGUES = [
  {
    id: '28a152b5-def1-4b88-9e0b-ab5bec70d3ca',
    category: '670a4087-9565-4e37-8714-3525acdb808b',
    name: 'Liga de Recrea - Categoría 1'
  },
  {
    id: '82edcabf-f00d-42f6-98b7-4157a3c73f79',
    category: '70b8637d-1257-4610-9489-2cec6ff761ac',
    name: 'Liga de Recrea - Categoría 2'
  },
  {
    id: '92671069-79e6-4b33-b8a0-7841fca36abf',
    category: 'c4f7f573-6375-47dc-8e94-e21339058ba7',
    name: 'Liga de Recrea - Categoría 3'
  },
  {
    id: '97e501cd-e456-42c5-aadb-cd9fe461186d',
    category: '5f759999-52c8-44e9-a71a-ffeac4b9671c',
    name: 'Liga de Recrea - Categoría 4'
  }
];

// Usuarios disponibles (primeros 16 para formar 8 equipos por categoría)
// Puedes usar los mismos usuarios para todas las categorías o diferentes
const PLAYERS = [
  { id: '0101c3f3-a44c-481f-9c31-722440eac839', name: 'Lucas Martinez' },
  { id: '043a05b9-0744-45b1-987a-67859e93c152', name: 'Gianni Baccino' },
  { id: '23e2841e-d697-4a77-a4f5-3aa7f42fd064', name: 'Juan Diaz' },
  { id: '27d3a303-4c60-47b1-86e5-cab0429a2c52', name: 'Agustin Tapia' },
  { id: '2e98d103-85f2-4d16-8cb9-2fa557724d73', name: 'Milton Navarro' },
  { id: '3929b30b-958b-44d8-ace8-230224ed833b', name: 'Enzo Pelizzari' },
  { id: '3ab2f81d-cbb9-4d59-8615-bf7c5521d446', name: 'Santiago Rizzo' },
  { id: '5a6f97a9-6c38-44a1-8eaa-1b3e00204489', name: 'Agustin Rizzo' },
  { id: '615a8571-63f6-4533-8617-31ad934e0331', name: 'Enzo Morales' },
  { id: '657d6048-396b-4d4d-9219-418f53c89174', name: 'Santiago Gutierrez' },
  { id: '679fa9a5-6152-46c2-a6dd-51b5c75868e6', name: 'Maxi Salvo' },
  { id: '6d87c72d-74f4-49a3-b37e-1e287a80a16f', name: 'Richard Nuñez' },
  { id: '6f103b3d-ff0f-4279-ae3d-19e06c44d5d4', name: 'Facundo Costa' },
  { id: '77d996b5-08db-4cd1-be66-e9e0b97a78db', name: 'Francisco Erramuspe' },
  { id: '780f7850-682f-41f2-ab17-5b8a72506ff4', name: 'Runate Goncalves' },
  { id: '7dc78fbc-ec65-4ee2-be78-d0f65df38539', name: 'Carlos Pereira' }
];

// Formar 8 equipos (16 jugadores = 8 equipos de 2)
const TEAMS = [];
for (let i = 0; i < 8; i++) {
  TEAMS.push({
    player1_id: PLAYERS[i * 2].id,
    player1_name: PLAYERS[i * 2].name,
    player2_id: PLAYERS[i * 2 + 1].id,
    player2_name: PLAYERS[i * 2 + 1].name,
    alternate_player: `Suplente Equipo ${i + 1}`
  });
}

console.log('📋 Equipos formados:');
TEAMS.forEach((team, idx) => {
  console.log(`  Equipo ${idx + 1}: ${team.player1_name} + ${team.player2_name}`);
});

/**
 * Función para inscribir un equipo en una liga
 */
async function inscribirEquipo(leagueId, player1Id, player2Id, alternatePlayer) {
  try {
    const response = await fetch(`${API_URL}/leagues/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        league_id: leagueId,
        player1_id: player1Id,
        player2_id: player2Id,
        alternate_player: alternatePlayer
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al inscribir equipo');
    }

    return data;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

/**
 * Función para inscribir todos los equipos en todas las categorías
 */
async function inscribirTodosLosEquipos() {
  console.log('\n🚀 Iniciando inscripciones...\n');
  
  let totalInscripciones = 0;
  let totalExitosas = 0;
  let totalErrores = 0;

  for (const league of LEAGUES) {
    console.log(`\n📌 ${league.name}`);
    console.log(`   Liga ID: ${league.id}`);
    console.log(`   ──────────────────────────────────────`);

    for (let i = 0; i < TEAMS.length; i++) {
      const team = TEAMS[i];
      totalInscripciones++;

      try {
        console.log(`   Inscribiendo Equipo ${i + 1}/8: ${team.player1_name} + ${team.player2_name}...`);
        
        await inscribirEquipo(
          league.id,
          team.player1_id,
          team.player2_id,
          team.alternate_player
        );

        totalExitosas++;
        console.log(`   ✅ Equipo ${i + 1} inscrito exitosamente`);
        
        // Pequeña pausa para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        totalErrores++;
        console.log(`   ❌ Error al inscribir Equipo ${i + 1}: ${error.message}`);
      }
    }

    console.log(`   ✅ Categoría completada: 8/8 equipos`);
  }

  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   Total inscripciones intentadas: ${totalInscripciones}`);
  console.log(`   ✅ Exitosas: ${totalExitosas}`);
  console.log(`   ❌ Errores: ${totalErrores}`);
  console.log(`\n🎉 Proceso completado!\n`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  inscribirTodosLosEquipos().catch(console.error);
}

module.exports = { inscribirEquipo, inscribirTodosLosEquipos, LEAGUES, TEAMS };

