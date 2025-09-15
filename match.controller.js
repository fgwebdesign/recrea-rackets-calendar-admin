import { supabase } from '../config/supabaseClient.js'

/**
 * 🏆 ACTUALIZAR STANDINGS DEL GRUPO DESPUÉS DE UN PARTIDO
 * Sistema híbrido: calcula y persiste en tournament_standings
 */
async function updateGroupStandingsAfterMatch(tournamentId, groupNumber) {
  try {
    console.log(`🏆 Actualizando standings - Torneo: ${tournamentId}, Grupo: ${groupNumber}`);
    
    // Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('tournament_type')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;
    
    // Obtener grupo específico
    const { data: group, error: groupError } = await supabase
      .from('tournament_groups')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('group_number', groupNumber)
      .single();
      
    if (groupError) throw groupError;
    
    // Obtener todos los partidos completados del grupo
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('group_number', groupNumber)
      .eq('status', 'completed');
      
    if (matchesError) throw matchesError;
    
    // Calcular standings para este grupo
    const teamIds = Array.isArray(group.teams) ? group.teams : JSON.parse(group.teams);
    const standingsData = calculateGroupStandings(teamIds, matches, group.id);
    
    // Eliminar standings existentes del grupo
    await supabase
      .from('tournament_standings')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('group_id', group.id);
    
    // Insertar nuevos standings
    if (standingsData.length > 0) {
      const { error: insertError } = await supabase
        .from('tournament_standings')
        .insert(standingsData);
        
      if (insertError) throw insertError;
    }
    
    console.log(`✅ Standings actualizados para grupo ${groupNumber}`);
    
  } catch (error) {
    console.error('❌ Error actualizando standings:', error);
    // No lanzamos el error para no afectar la respuesta del partido
  }
}

/**
 * Calcular standings de un grupo específico
 */
function calculateGroupStandings(teamIds, matches, groupId) {
  const standings = {};
  
  // Obtener tournament_id desde los partidos
  const tournamentId = matches.length > 0 ? matches[0].tournament_id : null;
  
  // Inicializar estadísticas para cada equipo
  teamIds.forEach(teamId => {
    standings[teamId] = {
      tournament_id: tournamentId, // Asignar desde el primer partido
      team_id: teamId,
      group_id: groupId,
      points: 0,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      sets_won: 0,
      sets_lost: 0,
      games_won: 0,
      games_lost: 0
    };
  });
  
  // Procesar cada partido
  matches.forEach(match => {
    const homeTeam = standings[match.home_team_id];
    const awayTeam = standings[match.away_team_id];
    
    if (!homeTeam || !awayTeam) return;
    
    // tournament_id ya está asignado en la inicialización
    
    // Calcular estadísticas del partido
    const matchStats = calculateMatchStatsForStandings(match);
    
    // Actualizar estadísticas
    homeTeam.matches_played++;
    homeTeam.sets_won += matchStats.home.sets_won;
    homeTeam.sets_lost += matchStats.home.sets_lost;
    homeTeam.games_won += matchStats.home.games_won;
    homeTeam.games_lost += matchStats.home.games_lost;
    
    awayTeam.matches_played++;
    awayTeam.sets_won += matchStats.away.sets_won;
    awayTeam.sets_lost += matchStats.away.sets_lost;
    awayTeam.games_won += matchStats.away.games_won;
    awayTeam.games_lost += matchStats.away.games_lost;
    
    // Determinar ganador
    if (match.winner_team_id === match.home_team_id) {
      homeTeam.matches_won++;
      homeTeam.points += 3;
      awayTeam.matches_lost++;
    } else {
      awayTeam.matches_won++;
      awayTeam.points += 3;
      homeTeam.matches_lost++;
    }
  });
  
  return Object.values(standings);
}

/**
 * Calcular estadísticas de match para standings
 */
function calculateMatchStatsForStandings(match) {
  const homeStats = {
    sets_won: 0,
    sets_lost: 0,
    games_won: match.team1_sets1_won + match.team1_sets2_won,
    games_lost: match.team2_sets1_won + match.team2_sets2_won
  };
  
  const awayStats = {
    sets_won: 0,
    sets_lost: 0,
    games_won: match.team2_sets1_won + match.team2_sets2_won,
    games_lost: match.team1_sets1_won + match.team1_sets2_won
  };
  
  // Contar sets
  if (match.team1_sets1_won > match.team2_sets1_won) {
    homeStats.sets_won++;
    awayStats.sets_lost++;
  } else {
    homeStats.sets_lost++;
    awayStats.sets_won++;
  }
  
  if (match.team1_sets2_won > match.team2_sets2_won) {
    homeStats.sets_won++;
    awayStats.sets_lost++;
  } else {
    homeStats.sets_lost++;
    awayStats.sets_won++;
  }
  
  return { home: homeStats, away: awayStats };
}

// Obtener todos los partidos de un torneo (puedes filtrar por ?tournament_id)
export async function getMatches(req, res) {
  try {
    const { tournament_id } = req.query

    let query = supabase.from('tournament_matches').select('*')

    if (tournament_id) {
      query = query.eq('tournament_id', tournament_id)
    }

    const { data, error } = await query
    if (error) throw error

    res.json({
      message: 'Matches fetched successfully',
      matches: data
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Obtener un partido por ID
export async function getMatch(req, res) {
  const matchId = req.params.id

  try {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (error) throw error
    if (!data) {
      return res.status(404).json({ message: 'Match not found' })
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Crear partido
export async function createMatch(req, res) {
  const { 
    tournament_id,
    home_team_id,
    away_team_id,
    court_id,
    match_day,    // 'YYYY-MM-DD'
    start_time,   // 'HH:mm:ss'
    round = 'group',
    stage = 'group',
    status = 'scheduled'
  } = req.body

  try {
    const { data, error } = await supabase
      .from('tournament_matches')
      .insert({
        tournament_id,
        home_team_id,
        away_team_id,
        court_id,
        match_day,
        start_time,
        round,
        stage,
        status
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Actualizar partido
export async function updateMatch(req, res) {
  const matchId = req.params.id
  const {
    tournament_id,
    home_team_id,
    away_team_id,
    court_id,
    match_day,
    start_time,
    status,
    score,
    winner_team_id
  } = req.body

  try {
    // Verificar que exista
    const { data: existingMatch, error: fetchError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (fetchError) throw fetchError
    if (!existingMatch) {
      return res.status(404).json({ message: 'Match not found' })
    }

    // Armar update dinámico
    const updateData = {}
    if (tournament_id) updateData.tournament_id = tournament_id
    if (home_team_id) updateData.home_team_id = home_team_id
    if (away_team_id) updateData.away_team_id = away_team_id
    if (court_id) updateData.court_id = court_id
    if (match_day) updateData.match_day = match_day
    if (start_time) updateData.start_time = start_time
    if (status) updateData.status = status
    if (score) updateData.score = score
    if (winner_team_id) updateData.winner_team_id = winner_team_id

    const { data: updatedMatch, error: updateError } = await supabase
      .from('tournament_matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      message: 'Match updated successfully',
      match: updatedMatch
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Actualizar resultado de un partido (Sistema Pádel Uruguayo)
export async function updateMatchResult(req, res) {
  const { tournamentId, matchId } = req.params;
  const { set1, set2, superTiebreak, walkover, walkover_team_id } = req.body;

  try {
    // Validar que el partido existe y pertenece al torneo
    const { data: existingMatch, error: fetchError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .eq('tournament_id', tournamentId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingMatch) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }

    // ===== MANEJO DE WALKOVER =====
    if (walkover && walkover_team_id) {
      // Validar que el equipo ganador por walkover es uno de los equipos del partido
      if (walkover_team_id !== existingMatch.home_team_id && walkover_team_id !== existingMatch.away_team_id) {
        return res.status(400).json({ 
          message: 'El equipo ganador por walkover debe ser uno de los equipos del partido' 
        });
      }

      // Determinar el equipo perdedor
      const losingTeamId = walkover_team_id === existingMatch.home_team_id 
        ? existingMatch.away_team_id 
        : existingMatch.home_team_id;

      // Preparar datos para walkover (2-0 con sets 7-0, 7-0)
      const walkoverData = {
        // Set 1: Ganador 7-0
        team1_sets1_won: walkover_team_id === existingMatch.home_team_id ? 7 : 0,
        team2_sets1_won: walkover_team_id === existingMatch.away_team_id ? 7 : 0,
        team1_tie1_won: 0,
        team2_tie1_won: 0,
        
        // Set 2: Ganador 7-0
        team1_sets2_won: walkover_team_id === existingMatch.home_team_id ? 7 : 0,
        team2_sets2_won: walkover_team_id === existingMatch.away_team_id ? 7 : 0,
        team1_tie2_won: 0,
        team2_tie2_won: 0,
        
        // No hay super tie-break en walkover
        team1_tie3_won: 0,
        team2_tie3_won: 0,
        
        // Resultado final
        winner_team_id: walkover_team_id,
        status: 'completed',
        walkover: true,
        walkover_team_id: walkover_team_id,
        updated_at: new Date().toISOString()
      };

      // Actualizar el partido con walkover
      const { data: updatedMatch, error: updateError } = await supabase
        .from('tournament_matches')
        .update(walkoverData)
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Actualizar standings si es partido de grupo
      if (updatedMatch.round === 'group') {
        await updateGroupStandingsAfterMatch(tournamentId, updatedMatch.group_number);
      }

      // Manejar progresión eliminatoria si es necesario
      if (updatedMatch.round !== 'group') {
        await handleEliminationProgression(tournamentId, updatedMatch);
      }

      return res.json({
        message: 'Resultado por walkover actualizado exitosamente',
        match: updatedMatch,
        result_summary: {
          sets_won: { 
            [walkover_team_id]: 2, 
            [losingTeamId]: 0 
          },
          games_won: { 
            [walkover_team_id]: 14, 
            [losingTeamId]: 0 
          },
          winner: walkover_team_id,
          match_type: 'walkover',
          walkover_reason: 'Equipo no se presentó'
        }
      });
    }

    // Validar formato de datos
    if (!set1 || typeof set1.team1 !== 'number' || typeof set1.team2 !== 'number') {
      return res.status(400).json({ message: 'Set 1 es requerido con formato válido' });
    }

    if (!set2 || typeof set2.team1 !== 'number' || typeof set2.team2 !== 'number') {
      return res.status(400).json({ message: 'Set 2 es requerido con formato válido' });
    }

    // Validar que los sets sean números positivos
    if (set1.team1 < 0 || set1.team2 < 0 || set2.team1 < 0 || set2.team2 < 0) {
      return res.status(400).json({ message: 'Los sets deben ser números positivos' });
    }

    // Validar tie-breaks en sets si existen
    if (set1.tiebreak) {
      if (typeof set1.tiebreak.team1 !== 'number' || typeof set1.tiebreak.team2 !== 'number') {
        return res.status(400).json({ message: 'Tie-break del Set 1 debe tener formato válido con team1 y team2' });
      }
      
      if (set1.tiebreak.team1 < 0 || set1.tiebreak.team2 < 0) {
        return res.status(400).json({ message: 'Los puntos del tie-break del Set 1 deben ser positivos' });
      }

      // Validar que el tie-break se juegue a 7 puntos mínimo
      const maxPoints = Math.max(set1.tiebreak.team1, set1.tiebreak.team2);
      const minPoints = Math.min(set1.tiebreak.team1, set1.tiebreak.team2);
      
      if (maxPoints < 7) {
        return res.status(400).json({ 
          message: 'El tie-break del Set 1 debe jugarse a 7 puntos mínimo. Puntos recibidos: ' + maxPoints 
        });
      }

      // Validar diferencia mínima de 2 puntos si hay empate 5-5
      if (maxPoints >= 7 && minPoints >= 5) {
        const difference = Math.abs(set1.tiebreak.team1 - set1.tiebreak.team2);
        if (difference < 2) {
          return res.status(400).json({ 
            message: `Tie-break del Set 1 inválido: debe haber diferencia mínima de 2 puntos cuando ambos equipos tienen 5+ puntos. Diferencia actual: ${difference}` 
          });
        }
      }

      // Validar que el set sea 5-5 si hay tie-break
      if (set1.team1 !== 5 || set1.team2 !== 5) {
        return res.status(400).json({ 
          message: 'El tie-break del Set 1 solo se puede jugar cuando el set está empatado 5-5' 
        });
      }
    }

    if (set2.tiebreak) {
      if (typeof set2.tiebreak.team1 !== 'number' || typeof set2.tiebreak.team2 !== 'number') {
        return res.status(400).json({ message: 'Tie-break del Set 2 debe tener formato válido con team1 y team2' });
      }
      
      if (set2.tiebreak.team1 < 0 || set2.tiebreak.team2 < 0) {
        return res.status(400).json({ message: 'Los puntos del tie-break del Set 2 deben ser positivos' });
      }

      // Validar que el tie-break se juegue a 7 puntos mínimo
      const maxPoints = Math.max(set2.tiebreak.team1, set2.tiebreak.team2);
      const minPoints = Math.min(set2.tiebreak.team1, set2.tiebreak.team2);
      
      if (maxPoints < 7) {
        return res.status(400).json({ 
          message: 'El tie-break del Set 2 debe jugarse a 7 puntos mínimo. Puntos recibidos: ' + maxPoints 
        });
      }

      // Validar diferencia mínima de 2 puntos si hay empate 5-5
      if (maxPoints >= 7 && minPoints >= 5) {
        const difference = Math.abs(set2.tiebreak.team1 - set2.tiebreak.team2);
        if (difference < 2) {
          return res.status(400).json({ 
            message: `Tie-break del Set 2 inválido: debe haber diferencia mínima de 2 puntos cuando ambos equipos tienen 5+ puntos. Diferencia actual: ${difference}` 
          });
        }
      }

      // Validar que el set sea 5-5 si hay tie-break
      if (set2.team1 !== 5 || set2.team2 !== 5) {
        return res.status(400).json({ 
          message: 'El tie-break del Set 2 solo se puede jugar cuando el set está empatado 5-5' 
        });
      }
    }

    // Validar formato de super tie-break si existe
    if (superTiebreak) {
      if (typeof superTiebreak.team1 !== 'number' || typeof superTiebreak.team2 !== 'number') {
        return res.status(400).json({ message: 'Super tie-break debe tener formato válido con team1 y team2' });
      }
      
      if (superTiebreak.team1 < 0 || superTiebreak.team2 < 0) {
        return res.status(400).json({ message: 'Los puntos del super tie-break deben ser positivos' });
      }

      // Validar que el super tie-break se juegue a 11 puntos mínimo
      const maxPoints = Math.max(superTiebreak.team1, superTiebreak.team2);
      const minPoints = Math.min(superTiebreak.team1, superTiebreak.team2);
      
      if (maxPoints < 11) {
        return res.status(400).json({ 
          message: 'El super tie-break debe jugarse a 11 puntos mínimo. Puntos recibidos: ' + maxPoints 
        });
      }

      // Validar diferencia mínima de 2 puntos si hay empate 10-10
      if (maxPoints >= 11 && minPoints >= 10) {
        const difference = Math.abs(superTiebreak.team1 - superTiebreak.team2);
        if (difference < 2) {
          return res.status(400).json({ 
            message: `Super tie-break inválido: debe haber diferencia mínima de 2 puntos cuando ambos equipos tienen 10+ puntos. Diferencia actual: ${difference}` 
          });
        }
      }
    }

    // Calcular resultado y ganador
    const result = calculateMatchResult(set1, set2, superTiebreak);

    // Preparar datos para actualizar
    const updateData = {
      // Set 1
      team1_sets1_won: set1.team1,
      team2_sets1_won: set1.team2,
      team1_tie1_won: set1.tiebreak?.team1 || 0,
      team2_tie1_won: set1.tiebreak?.team2 || 0,
      
      // Set 2
      team1_sets2_won: set2.team1,
      team2_sets2_won: set2.team2,
      team1_tie2_won: set2.tiebreak?.team1 || 0,
      team2_tie2_won: set2.tiebreak?.team2 || 0,
      
      // Super tie-break (si existe)
      team1_tie3_won: superTiebreak?.team1 || 0,
      team2_tie3_won: superTiebreak?.team2 || 0,
      
      // Resultado final
      winner_team_id: result.winner === 'team1' ? existingMatch.home_team_id : existingMatch.away_team_id,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    // Actualizar el partido
    const { data: updatedMatch, error: updateError } = await supabase
      .from('tournament_matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Si es un partido de grupo, actualizar standings automáticamente después de completar el partido
    if (updatedMatch.round === 'group') {
      await updateGroupStandingsAfterMatch(tournamentId, updatedMatch.group_number);
    }

    // Si es un partido eliminatorio, manejar la progresión
    if (updatedMatch.round !== 'group') {
      await handleEliminationProgression(tournamentId, updatedMatch);
    }

    res.json({
      message: 'Resultado actualizado exitosamente',
      match: updatedMatch,
      result_summary: {
        sets_won: result.setsWon,
        games_won: result.gamesWon,
        winner: result.winner,
        match_type: result.matchType
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Función auxiliar para calcular el resultado del partido
function calculateMatchResult(set1, set2, superTiebreak) {
  let team1SetsWon = 0;
  let team2SetsWon = 0;
  let team1GamesWon = set1.team1 + set2.team1;
  let team2GamesWon = set1.team2 + set2.team2;

  // Determinar ganador del Set 1
  if (set1.tiebreak) {
    // Si hay tie-break, el ganador se determina por el tie-break
    if (set1.tiebreak.team1 > set1.tiebreak.team2) {
      team1SetsWon++;
    } else {
      team2SetsWon++;
    }
  } else {
    // Si no hay tie-break, el ganador se determina por el score del set
    if (set1.team1 > set1.team2) {
      team1SetsWon++;
    } else {
      team2SetsWon++;
    }
  }

  // Determinar ganador del Set 2
  if (set2.tiebreak) {
    // Si hay tie-break, el ganador se determina por el tie-break
    if (set2.tiebreak.team1 > set2.tiebreak.team2) {
      team1SetsWon++;
    } else {
      team2SetsWon++;
    }
  } else {
    // Si no hay tie-break, el ganador se determina por el score del set
    if (set2.team1 > set2.team2) {
      team1SetsWon++;
    } else {
      team2SetsWon++;
    }
  }

  let matchType = 'normal'; // normal, super_tiebreak
  let winner;

  // Si hay empate 1-1 en sets, el super tie-break decide
  if (team1SetsWon === 1 && team2SetsWon === 1) {
    if (!superTiebreak) {
      throw new Error('Super tie-break requerido cuando hay empate 1-1 en sets');
    }
    matchType = 'super_tiebreak';
    if (superTiebreak.team1 > superTiebreak.team2) {
      winner = 'team1';
    } else {
      winner = 'team2';
    }
  } else {
    // Ganador por sets
    winner = team1SetsWon > team2SetsWon ? 'team1' : 'team2';
  }

  return {
    winner,
    setsWon: { team1: team1SetsWon, team2: team2SetsWon },
    gamesWon: { team1: team1GamesWon, team2: team2GamesWon },
    matchType
  };
}

// Eliminar partido
export async function deleteMatch(req, res) {
  const matchId = req.params.id

  try {
    const { data, error } = await supabase
      .from('tournament_matches')
      .delete()
      .eq('id', matchId)
      .select()
      .single()

    if (error) throw error
    if (!data) {
      return res.status(404).json({ message: 'Match not found' })
    }

    res.json({ message: 'Match deleted', match: data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * 🏆 MANEJAR PROGRESIÓN ELIMINATORIA CON NUEVA LÓGICA DE HORARIOS
 * Cuando se completa un partido eliminatorio, crear automáticamente el siguiente partido
 * con horarios escalonados por categorías (como el Excel)
 */
async function handleEliminationProgression(tournamentId, completedMatch) {
  try {
    console.log(`🏆 Procesando progresión eliminatoria para partido ${completedMatch.id}`);
    console.log(`   📊 Datos del partido completado:`);
    console.log(`      - Round: ${completedMatch.round}`);
    console.log(`      - Match Number: ${completedMatch.match_number}`);
    console.log(`      - Match Order: ${completedMatch.match_order}`);
    console.log(`      - Winner: ${completedMatch.winner_team_id}`);
    
    // Determinar la siguiente ronda
    let nextRound = null;
    let nextMatchNumber = null;
    
    switch (completedMatch.round) {
      case 'quarter_final':
      case 'quarterfinals': // Por si acaso está en plural
        nextRound = 'semi_final';
        // Determinar número de semifinal basado en el partido de cuartos
        // Usar match_order en lugar de match_number (que puede ser null)
        const matchOrder = completedMatch.match_order || completedMatch.match_number || 1;
        nextMatchNumber = Math.max(1, Math.ceil(matchOrder / 2));
        break;
      case 'semi_final':
      case 'semifinals': // Por si acaso está en plural
        nextRound = 'final';
        nextMatchNumber = 1; // Solo hay una final
        break;
      case 'final':
        // No hay siguiente ronda, el torneo termina
        console.log('🏆 ¡Torneo completado!');
        return;
      default:
        console.log(`⚠️ Ronda no reconocida: ${completedMatch.round}`);
        return;
    }
    
    // ===== NUEVA LÓGICA: Obtener información del torneo y categorías =====
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name, order)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;
    
    // Obtener todos los torneos del mismo evento (mismo nombre)
    const { data: eventTournaments, error: eventError } = await supabase
      .from('tournaments')
      .select('id, categories(order)')
      .eq('name', tournament.name);
      
    if (eventError) throw eventError;
    
    // Ordenar torneos por el orden de sus categorías (7ma → 6ta → 5ta → 4ta)
    eventTournaments.sort((a, b) => {
      const orderA = a.categories?.order || 99;
      const orderB = b.categories?.order || 99;
      return orderB - orderA; // Orden descendente (7ma primero)
    });
    
    // Encontrar la posición de este torneo en el orden de categorías
    const tournamentIndex = eventTournaments.findIndex(t => t.id === tournamentId);
    
    // ===== NUEVA LÓGICA: Calcular horarios escalonados =====
    const START_HOUR = 8; // Empezar a las 8:00 AM
    const semifinalsOffset = tournamentIndex * 1; // 1 hora por categoría para semis
    const finalsOffset = tournamentIndex * 1; // 1 hora por categoría para finales
    
    const semifinalsTime = START_HOUR + 8 + semifinalsOffset; // 16:00 + offset
    const finalsTime = START_HOUR + 9 + finalsOffset;        // 17:00 + offset
    
    console.log(`🎯 NUEVA LÓGICA DE PROGRESIÓN:`);
    console.log(`   🏆 Categoría: ${tournament.categories?.name} (orden: ${tournament.categories?.order})`);
    console.log(`   📍 Índice: ${tournamentIndex}`);
    console.log(`   ⏰ Semifinales: ${semifinalsTime}:00`);
    console.log(`   ⏰ Finales: ${finalsTime}:00`);
    
    // ===== NUEVA LÓGICA: Obtener canchas disponibles =====
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id')
      .limit(tournament.courts_available);
      
    if (courtsError) throw courtsError;
    
    // ===== NUEVA LÓGICA: Calcular fecha y horario =====
    const startDate = new Date(tournament.end_date + 'T00:00:00'); // Último día del torneo
    const matchTime = nextRound === 'semi_final' ? semifinalsTime : finalsTime;
    const hour = Math.floor(matchTime);
    const minutes = Math.round((matchTime % 1) * 60);
    
    // ===== NUEVA LÓGICA: Asignar cancha según la ronda =====
    let assignedCourt;
    if (nextRound === 'semi_final') {
      assignedCourt = courts[nextMatchNumber % courts.length]; // Alternar canchas para semis
    } else if (nextRound === 'final') {
      assignedCourt = courts[0]; // Primera cancha para final
    }
    
    console.log(`   🎾 ${nextRound.toUpperCase()} ${nextMatchNumber}: ${hour}:${minutes.toString().padStart(2, '0')} - Cancha ${assignedCourt.id}`);
    
    // Verificar si ya existe el partido de la siguiente ronda
    const { data: existingNextMatch, error: checkError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', nextRound)
      .eq('match_number', nextMatchNumber)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError;
    }
    
    if (existingNextMatch) {
      console.log(`✅ Partido ${nextRound} ${nextMatchNumber} ya existe`);
      
      // Actualizar el partido existente con el ganador Y los nuevos horarios
      const winnerTeamId = completedMatch.winner_team_id;
      const isHomeTeam = existingNextMatch.home_team_id === null;
      
      const updateData = {
        ...(isHomeTeam ? { home_team_id: winnerTeamId } : { away_team_id: winnerTeamId }),
        // ===== NUEVA LÓGICA: Actualizar también horarios =====
        match_day: startDate.toISOString().split('T')[0],
        start_time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`,
        court_id: assignedCourt.id
      };
      
      const { error: updateError } = await supabase
        .from('tournament_matches')
        .update(updateData)
        .eq('id', existingNextMatch.id);
      
      if (updateError) throw updateError;
      
      console.log(`✅ Ganador ${winnerTeamId} agregado al partido ${nextRound} ${nextMatchNumber} con nuevos horarios`);
    } else {
      console.log(`🔮 Creando nuevo partido ${nextRound} ${nextMatchNumber}`);
      
      // Crear nuevo partido para la siguiente ronda con NUEVA LÓGICA
      const newMatchData = {
        tournament_id: tournamentId,
        home_team_id: completedMatch.winner_team_id, // El ganador va como local
        away_team_id: null, // Se llenará cuando se complete el otro partido de la ronda actual
        round: nextRound,
        stage: nextRound,
        match_number: nextMatchNumber,
        status: 'scheduled',
        // ===== NUEVA LÓGICA: Asignar cancha, fecha y horario =====
        court_id: assignedCourt.id,
        match_day: startDate.toISOString().split('T')[0],
        start_time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
      };
      
      const { error: createError } = await supabase
        .from('tournament_matches')
        .insert(newMatchData);
      
      if (createError) throw createError;
      
      console.log(`✅ Partido ${nextRound} ${nextMatchNumber} creado con ganador ${completedMatch.winner_team_id} y nuevos horarios`);
    }
    
  } catch (error) {
    console.error('❌ Error en progresión eliminatoria:', error);
    // No lanzamos el error para no afectar la respuesta del partido
  }
}