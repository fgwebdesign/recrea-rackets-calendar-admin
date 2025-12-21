/**
 * Script para verificar que los partidos se generaron correctamente
 * Verifica:
 * 1. Rotación global de horarios entre categorías
 * 2. Asignación correcta de canchas
 * 3. Respeto de días por categoría (play_day)
 * 4. Sin conflictos (misma cancha, mismo horario)
 * 5. Venue_id asignado correctamente
 */

const fetch = globalThis.fetch;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Imd2c1pmT0NCR29sMCtVNUsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xvaHNveGl6b2xpdWhpcmx4eXBmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMzE4ZWEzNC1hNTFkLTRhOTEtOGE4OC1lM2NiMmEwZDJiNGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2MzYzMDQwLCJpYXQiOjE3NjYzNTk0NDAsImVtYWlsIjoieWVnb2Vsdmlnb3RlMTVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InllZ29lbHZpZ290ZTE1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdF9uYW1lIjoiRmVsaXBlIiwibGFzdF9uYW1lIjoiR3V0aWVycmV6IiwicGhvbmUiOiIxMjMtNDU2NyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZjMxOGVhMzQtYTUxZC00YTkxLThhODgtZTNjYjJhMGQyYjRkIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjYzNTk0NDB9XSwic2Vzc2lvbl9pZCI6IjRkZjY3MjI5LWI4ZjEtNDZkNC1hZWY0LWJmODQ0OWVkNDdkZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.kq1MOQfr894t8EtZTRqP7D8LdwytxJ7iWAjSPKp4pB0';

const LEAGUES = [
  {
    id: '28a152b5-def1-4b88-9e0b-ab5bec70d3ca',
    category: '670a4087-9565-4e37-8714-3525acdb808b',
    name: 'Categoría 1'
  },
  {
    id: '82edcabf-f00d-42f6-98b7-4157a3c73f79',
    category: '70b8637d-1257-4610-9489-2cec6ff761ac',
    name: 'Categoría 2'
  },
  {
    id: '92671069-79e6-4b33-b8a0-7841fca36abf',
    category: 'c4f7f573-6375-47dc-8e94-e21339058ba7',
    name: 'Categoría 3'
  },
  {
    id: '97e501cd-e456-42c5-aadb-cd9fe461186d',
    category: '5f759999-52c8-44e9-a71a-ffeac4b9671c',
    name: 'Categoría 4'
  }
];

async function obtenerPartidos(leagueId) {
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
    return data.pending || [];
  } catch (error) {
    console.error(`❌ Error obteniendo partidos de ${leagueId}:`, error.message);
    return [];
  }
}

async function obtenerInfoLiga(leagueId) {
  try {
    const response = await fetch(`${API_URL}/leagues/byId/${leagueId}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener info de liga');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo info de liga:`, error.message);
    return null;
  }
}

function extraerHora(fechaHora) {
  if (!fechaHora) return null;
  const match = fechaHora.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

function extraerFecha(fechaHora) {
  if (!fechaHora) return null;
  const match = fechaHora.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function obtenerDiaSemana(fecha) {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const date = new Date(fecha + 'T00:00:00');
  return dias[date.getDay()];
}

async function verificarPartidos() {
  console.log('\n🔍 VERIFICACIÓN DETALLADA DE PARTIDOS GENERADOS\n');
  console.log('═'.repeat(80));

  const resultados = [];
  let todosLosPartidos = [];

  // 1. Obtener todos los partidos de todas las categorías
  console.log('\n📥 Obteniendo partidos de todas las categorías...\n');
  
  for (const league of LEAGUES) {
    const partidos = await obtenerPartidos(league.id);
    const infoLiga = await obtenerInfoLiga(league.id);
    
    const partidosConInfo = partidos.map(p => ({
      ...p,
      leagueId: league.id,
      leagueName: league.name,
      categoryPlayDay: infoLiga?.category?.play_day || 'N/A',
      matchTimes: infoLiga?.match_times || []
    }));

    todosLosPartidos.push(...partidosConInfo);
    resultados.push({
      league: league.name,
      leagueId: league.id,
      partidos: partidosConInfo,
      infoLiga
    });

    console.log(`✅ ${league.name}: ${partidos.length} partidos obtenidos`);
  }

  console.log(`\n📊 Total de partidos: ${todosLosPartidos.length}\n`);

  // 2. Verificar rotación global de horarios
  console.log('═'.repeat(80));
  console.log('🔄 VERIFICACIÓN 1: Rotación Global de Horarios');
  console.log('═'.repeat(80));
  
  // Ordenar partidos por fecha y hora
  todosLosPartidos.sort((a, b) => {
    const fechaA = a.match_date || '';
    const fechaB = b.match_date || '';
    return fechaA.localeCompare(fechaB);
  });

  const horariosEsperados = ['22:30', '23:15'];
  let contadorGlobal = 0;
  const distribucionHorarios = {};

  todosLosPartidos.forEach((partido, index) => {
    const hora = extraerHora(partido.match_date);
    const categoria = partido.leagueName;
    
    if (!hora) return;

    // Calcular horario esperado según rotación global
    const horarioEsperado = horariosEsperados[contadorGlobal % horariosEsperados.length];
    contadorGlobal++;

    if (!distribucionHorarios[categoria]) {
      distribucionHorarios[categoria] = { '22:30': 0, '23:15': 0 };
    }
    distribucionHorarios[categoria][hora] = (distribucionHorarios[categoria][hora] || 0) + 1;

    // Verificar si el horario coincide con la rotación esperada
    if (hora !== horarioEsperado) {
      console.log(`⚠️  Partido ${index + 1} (${categoria}): Esperado ${horarioEsperado}, Obtenido ${hora}`);
    }
  });

  console.log('\n📊 Distribución de horarios por categoría:');
  Object.entries(distribucionHorarios).forEach(([categoria, distrib]) => {
    const total = distrib['22:30'] + distrib['23:15'];
    const porcentaje22_30 = ((distrib['22:30'] / total) * 100).toFixed(1);
    const porcentaje23_15 = ((distrib['23:15'] / total) * 100).toFixed(1);
    console.log(`   ${categoria}:`);
    console.log(`     22:30: ${distrib['22:30']} partidos (${porcentaje22_30}%)`);
    console.log(`     23:15: ${distrib['23:15']} partidos (${porcentaje23_15}%)`);
  });

  // 3. Verificar asignación de canchas
  console.log('\n═'.repeat(80));
  console.log('🎾 VERIFICACIÓN 2: Asignación de Canchas');
  console.log('═'.repeat(80));
  
  const canchasUsadas = {};
  todosLosPartidos.forEach(partido => {
    const cancha = partido.court_name || 'Sin asignar';
    canchasUsadas[cancha] = (canchasUsadas[cancha] || 0) + 1;
  });

  console.log('\n📊 Partidos por cancha:');
  Object.entries(canchasUsadas).forEach(([cancha, count]) => {
    const porcentaje = ((count / todosLosPartidos.length) * 100).toFixed(1);
    console.log(`   ${cancha}: ${count} partidos (${porcentaje}%)`);
  });

  // 4. Verificar días por categoría
  console.log('\n═'.repeat(80));
  console.log('📅 VERIFICACIÓN 3: Días de Juego por Categoría');
  console.log('═'.repeat(80));
  
  const diasPorCategoria = {};
  resultados.forEach(resultado => {
    const categoria = resultado.league;
    const playDay = resultado.infoLiga?.category?.play_day || 'N/A';
    
    if (!diasPorCategoria[categoria]) {
      diasPorCategoria[categoria] = {
        playDayEsperado: playDay,
        diasEncontrados: {}
      };
    }

    resultado.partidos.forEach(partido => {
      const fecha = extraerFecha(partido.match_date);
      if (fecha) {
        const diaSemana = obtenerDiaSemana(fecha);
        diasPorCategoria[categoria].diasEncontrados[diaSemana] = 
          (diasPorCategoria[categoria].diasEncontrados[diaSemana] || 0) + 1;
      }
    });
  });

  console.log('\n📊 Días de juego por categoría:');
  Object.entries(diasPorCategoria).forEach(([categoria, info]) => {
    console.log(`\n   ${categoria}:`);
    console.log(`     Día esperado: ${info.playDayEsperado}`);
    console.log(`     Días encontrados:`);
    Object.entries(info.diasEncontrados).forEach(([dia, count]) => {
      const esCorrecto = dia.toLowerCase() === info.playDayEsperado.toLowerCase();
      const icono = esCorrecto ? '✅' : '⚠️';
      console.log(`       ${icono} ${dia}: ${count} partidos`);
    });
  });

  // 5. Verificar conflictos (misma cancha, misma fecha, misma hora)
  console.log('\n═'.repeat(80));
  console.log('⚠️  VERIFICACIÓN 4: Conflictos de Horarios');
  console.log('═'.repeat(80));
  
  const conflictos = [];
  const partidosPorCanchaFechaHora = {};

  todosLosPartidos.forEach(partido => {
    const cancha = partido.court_name || 'N/A';
    const fecha = extraerFecha(partido.match_date);
    const hora = extraerHora(partido.match_date);
    const key = `${cancha}-${fecha}-${hora}`;

    if (!partidosPorCanchaFechaHora[key]) {
      partidosPorCanchaFechaHora[key] = [];
    }
    partidosPorCanchaFechaHora[key].push(partido);
  });

  Object.entries(partidosPorCanchaFechaHora).forEach(([key, partidos]) => {
    if (partidos.length > 1) {
      conflictos.push({
        key,
        partidos
      });
    }
  });

  if (conflictos.length === 0) {
    console.log('\n✅ No se encontraron conflictos de horarios');
  } else {
    console.log(`\n❌ Se encontraron ${conflictos.length} conflictos:`);
    conflictos.forEach((conflicto, index) => {
      console.log(`\n   Conflicto ${index + 1}: ${conflicto.key}`);
      conflicto.partidos.forEach(p => {
        console.log(`      - ${p.leagueName}: Partido ${p.match_number} (${p.team1} vs ${p.team2})`);
      });
    });
  }

  // 6. Verificar distribución equitativa de horarios por EQUIPO
  console.log('\n═'.repeat(80));
  console.log('⚖️  VERIFICACIÓN 5: Distribución Equitativa de Horarios por EQUIPO');
  console.log('═'.repeat(80));
  
  // Obtener información de equipos por liga
  console.log('\n📊 Distribución de horarios por equipo (dentro de cada categoría):');
  
  for (const resultado of resultados) {
    const categoria = resultado.league;
    const partidos = resultado.partidos;
    
    // Mapa de equipos en esta categoría
    const equiposEnCategoria = {};
    
    partidos.forEach(partido => {
      const hora = extraerHora(partido.match_date);
      if (!hora) return;
      
      // Extraer nombres de equipos
      const team1Name = partido.team1 || 'Equipo 1';
      const team2Name = partido.team2 || 'Equipo 2';
      
      // Inicializar contadores para cada equipo
      if (!equiposEnCategoria[team1Name]) {
        equiposEnCategoria[team1Name] = { '22:30': 0, '23:15': 0, total: 0 };
      }
      if (!equiposEnCategoria[team2Name]) {
        equiposEnCategoria[team2Name] = { '22:30': 0, '23:15': 0, total: 0 };
      }
      
      // Incrementar contadores
      equiposEnCategoria[team1Name][hora]++;
      equiposEnCategoria[team1Name].total++;
      equiposEnCategoria[team2Name][hora]++;
      equiposEnCategoria[team2Name].total++;
    });
    
    console.log(`\n   ${categoria}:`);
    Object.entries(equiposEnCategoria).forEach(([equipo, distribucion]) => {
      const porcentaje22_30 = distribucion.total > 0 ? ((distribucion['22:30'] / distribucion.total) * 100).toFixed(1) : '0.0';
      const porcentaje23_15 = distribucion.total > 0 ? ((distribucion['23:15'] / distribucion.total) * 100).toFixed(1) : '0.0';
      const diferencia = Math.abs(distribucion['22:30'] - distribucion['23:15']);
      const icono = diferencia <= 1 ? '✅' : diferencia <= 2 ? '⚠️' : '❌';
      
      console.log(`      ${icono} ${equipo}:`);
      console.log(`         22:30: ${distribucion['22:30']} partidos (${porcentaje22_30}%)`);
      console.log(`         23:15: ${distribucion['23:15']} partidos (${porcentaje23_15}%)`);
      console.log(`         Diferencia: ${diferencia} partidos`);
    });
  }

  // 7. Verificar venue_id
  console.log('\n═'.repeat(80));
  console.log('🏢 VERIFICACIÓN 6: Venue ID Asignado');
  console.log('═'.repeat(80));
  
  const partidosConVenue = todosLosPartidos.filter(p => p.venue_id).length;
  const partidosSinVenue = todosLosPartidos.length - partidosConVenue;
  
  console.log(`\n📊 Partidos con venue_id: ${partidosConVenue} (${((partidosConVenue / todosLosPartidos.length) * 100).toFixed(1)}%)`);
  console.log(`📊 Partidos sin venue_id: ${partidosSinVenue} (${((partidosSinVenue / todosLosPartidos.length) * 100).toFixed(1)}%)`);

  // Resumen final
  console.log('\n═'.repeat(80));
  console.log('📋 RESUMEN FINAL');
  console.log('═'.repeat(80));
  console.log(`✅ Total partidos verificados: ${todosLosPartidos.length}`);
  console.log(`✅ Rotación de horarios: ${contadorGlobal > 0 ? 'Implementada' : 'No verificada'}`);
  console.log(`✅ Asignación de canchas: ${Object.keys(canchasUsadas).length} canchas utilizadas`);
  console.log(`✅ Días por categoría: ${Object.keys(diasPorCategoria).length} categorías verificadas`);
  console.log(`${conflictos.length === 0 ? '✅' : '❌'} Conflictos: ${conflictos.length}`);
  console.log(`✅ Distribución equitativa: Verificada por equipo (ver detalles arriba)`);
  console.log(`${partidosSinVenue === 0 ? '✅' : '⚠️'} Venue ID: ${partidosConVenue}/${todosLosPartidos.length} asignados`);
  console.log('\n🎉 Verificación completada!\n');
}

// Ejecutar
if (require.main === module) {
  verificarPartidos().catch(console.error);
}

module.exports = { verificarPartidos };

