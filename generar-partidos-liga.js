/**
 * Script para generar partidos (standings) en las 4 categorías de la Liga de Recrea
 * 
 * Este script llama a generateStandings para cada categoría
 * y verifica que los partidos se generen correctamente con:
 * - Rotación global de horarios entre categorías
 * - Asignación correcta de canchas
 * - Respeto de días por categoría
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

// IDs de las 4 ligas (categorías) - NUEVA LIGA - DEBEN GENERARSE EN ORDEN para mantener la rotación global
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

/**
 * Función para generar partidos (standings) de una liga
 */
async function generarPartidos(leagueId, rounds = 1) {
  try {
    console.log(`\n🔄 Generando partidos para liga: ${leagueId}...`);
    
    const response = await fetch(`${API_URL}/leagues/generateStandings/${leagueId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ rounds })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al generar partidos');
    }

    return data;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

/**
 * Función para verificar los partidos generados
 */
async function verificarPartidos(leagueId) {
  try {
    const response = await fetch(`${API_URL}/leagues/matches/league/${leagueId}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener partidos');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error verificando partidos:`, error.message);
    return null;
  }
}

/**
 * Función para generar partidos en todas las categorías
 * IMPORTANTE: Se generan en orden para mantener la rotación global de horarios
 */
async function generarTodosLosPartidos() {
  console.log('\n🚀 Iniciando generación de partidos...\n');
  console.log('⚠️  IMPORTANTE: Las categorías se generan en orden para mantener la rotación global de horarios\n');
  
  let totalGeneradas = 0;
  let totalExitosas = 0;
  let totalErrores = 0;
  const resultados = [];

  for (let i = 0; i < LEAGUES.length; i++) {
    const league = LEAGUES[i];
    totalGeneradas++;

    try {
      console.log(`\n📌 ${league.name} (${i + 1}/4)`);
      console.log(`   Liga ID: ${league.id}`);
      console.log(`   ──────────────────────────────────────`);
      
      // Generar partidos (rounds = 1 para solo ida)
      const result = await generarPartidos(league.id, 1);
      
      totalExitosas++;
      console.log(`   ✅ Partidos generados exitosamente`);
      
      // Verificar partidos generados
      console.log(`   🔍 Verificando partidos generados...`);
      const partidos = await verificarPartidos(league.id);
      
      if (partidos) {
        const totalPartidos = partidos.total || 0;
        const completados = partidos.completed?.length || 0;
        const programados = partidos.pending?.length || 0;
        
        console.log(`   📊 Total partidos: ${totalPartidos}`);
        console.log(`   ✅ Programados: ${programados}`);
        console.log(`   🏁 Completados: ${completados}`);
        
        resultados.push({
          league: league.name,
          leagueId: league.id,
          totalPartidos,
          programados,
          completados,
          success: true
        });
      }
      
      // Pausa entre categorías para no saturar el servidor
      if (i < LEAGUES.length - 1) {
        console.log(`   ⏳ Esperando 1 segundo antes de generar siguiente categoría...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      totalErrores++;
      console.log(`   ❌ Error al generar partidos: ${error.message}`);
      
      resultados.push({
        league: league.name,
        leagueId: league.id,
        success: false,
        error: error.message
      });
    }
  }

  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   Total categorías procesadas: ${totalGeneradas}`);
  console.log(`   ✅ Exitosas: ${totalExitosas}`);
  console.log(`   ❌ Errores: ${totalErrores}`);
  
  console.log('\n📋 DETALLE POR CATEGORÍA:');
  resultados.forEach((result, idx) => {
    if (result.success) {
      console.log(`   ${idx + 1}. ${result.league}: ${result.totalPartidos} partidos (${result.programados} programados)`);
    } else {
      console.log(`   ${idx + 1}. ${result.league}: ❌ Error - ${result.error}`);
    }
  });

  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('   1. Verificar en la base de datos que los partidos se generaron correctamente');
  console.log('   2. Verificar que los horarios roten entre categorías (22:30 → 23:15 → 22:30...)');
  console.log('   3. Verificar que las canchas se asignen correctamente (2 canchas disponibles)');
  console.log('   4. Verificar que cada categoría respete su día de juego (play_day)');
  console.log('   5. Verificar que no haya conflictos (misma cancha, mismo horario)');
  console.log('\n🎉 Proceso completado!\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarTodosLosPartidos().catch(console.error);
}

module.exports = { generarPartidos, verificarPartidos, generarTodosLosPartidos, LEAGUES };

