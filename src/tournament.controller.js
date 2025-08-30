import { supabase } from '../config/supabaseClient.js'
import { validateTournamentSchedule } from '../helpers/tournament.helpers.js'


export async function getTournaments(req, res) {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_teams (
        team_id,
        teams (*)
      ),
      tournament_info (*)
    `)
    .eq('status', 'upcoming')
    .order('start_date', { ascending: true })

  if (error) return res.status(500).json({ message: error.message })
  res.json(data)
}

export async function getTournamentById(req, res) {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_teams (
        team_id,
        teams (*)
      ),
      tournament_info (*)
    `)
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(500).json({ message: error.message })
  if (!data) return res.status(404).json({ message: 'Tournament not found' })
  
  res.json(data)
}

export async function createTournament(req, res) {
  const { 
    name, 
    categories, // Cambiado de category_id a categories (array)
    start_date, 
    end_date, 
    courts_available, 
    time_slots,                
    group_time_slots,          
    tournament_type = 'NINE_PLAYERS',
    // Información adicional para tournament_info
    description,
    rules,
    tournament_location,
    tournament_address,
    tournament_club_name, // Añadido este campo
    signup_limit_date,
    inscription_cost,
    sponsors,
    tournament_thumbnail,
    first_place_prize,
    second_place_prize,
    third_place_prize
  } = req.body;

  try {
    // Validación de categorías
    if (!name || !Array.isArray(categories) || categories.length === 0 || !start_date || !end_date) {
      return res.status(400).json({ message: 'Nombre, categorías (al menos una), start_date y end_date son requeridos' });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ message: 'start_date debe ser menor o igual a end_date' });
    }
    if (!Number.isInteger(courts_available) || courts_available < 1) {
      return res.status(400).json({ message: 'El número de canchas disponibles debe ser >= 1' });
    }
    if (!['NINE_PLAYERS', 'TWELVE_PLAYERS'].includes(tournament_type)) {
      return res.status(400).json({ message: 'tournament_type inválido' });
    }

    // ---- generación dinámica de group slots basada en fechas del torneo ----
    const HHMM = /^\d{2}:\d{2}$/;

    let finalGroupSlots = group_time_slots;
    if (!Array.isArray(finalGroupSlots) || finalGroupSlots.length === 0) {
      // Generar time slots dinámicamente basados en start_date y end_date
      finalGroupSlots = generateDynamicTimeSlots(start_date, end_date);
    }
    // Validar time slots (dinámicos o personalizados)
    for (const s of finalGroupSlots) {
      if (!validateDynamicTimeSlot(s)) {
        return res.status(400).json({ message: `group_time_slots inválido en ${s.id}` });
      }
    }

    // ---- compat time_slots (legacy) ----
    let finalTimeSlots = time_slots;
    if (!Array.isArray(finalTimeSlots) || finalTimeSlots.length === 0) {
      finalTimeSlots = [
        [9, 13],   // mañana
        [14, 22],  // tarde/noche
      ];
    }

    // Crear un torneo por cada categoría
    const tournamentsToCreate = categories.map(category_id => ({
      name,
      category_id,
      start_date,
      end_date,
      status: 'upcoming',
      courts_available,
      time_slots: finalTimeSlots,
      group_time_slots: finalGroupSlots,
      tournament_type,
      max_teams: tournament_type === 'NINE_PLAYERS' ? 9 : 12
    }));

    // Insertar múltiples torneos
    // 1. Crear los torneos primero
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .insert(tournamentsToCreate)
      .select();

    if (tournamentError) return res.status(500).json({ message: tournamentError.message });

    // 2. Crear la información adicional para cada torneo usando la lógica existente
    const tournamentInfoPromises = tournaments.map(tournament => {
      const tournamentInfoData = {
        tournament_id: tournament.id,
        description,
        rules,
        tournament_location,
        tournament_address,
        signup_limit_date,
        inscription_cost,
        sponsors,
        tournament_thumbnail,
        first_place_prize,
        second_place_prize,
        third_place_prize
      };

      // Usar la lógica existente del controlador de tournament_info
      return supabase
        .from('tournament_info')
        .insert({
          tournament_id: tournament.id,
          description: description || '',
          rules: rules || '',
          tournament_location: tournament_location || '',
          tournament_address: tournament_address || '',
          tournament_club_name: tournament_club_name || 'Recrea Padel Club', // Valor por defecto
          signup_limit_date,
          inscription_cost: Number(inscription_cost) || 0,
          first_place_prize: first_place_prize || '',
          second_place_prize: second_place_prize || '',
          third_place_prize: third_place_prize || '',
          tournament_thumbnail: tournament_thumbnail || '',
          sponsors: sponsors || []
        })
        .select();
    });

    try {
      const tournamentInfoResults = await Promise.all(tournamentInfoPromises);
      const errors = tournamentInfoResults.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errores creando tournament_info:', errors);
        return res.status(500).json({ 
          message: 'Los torneos se crearon pero hubo errores al guardar la información adicional',
          errors: errors.map(e => e.error.message)
        });
      }

      // Combinar la información de torneos con su info adicional
      const completeTournaments = tournaments.map((tournament, index) => ({
        ...tournament,
        tournament_info: tournamentInfoResults[index].data[0]
      }));

      return res.status(201).json({ 
        message: 'Torneos creados exitosamente con toda su información', 
        torneos: completeTournaments 
      });
    } catch (error) {
      console.error('Error creating tournament_info:', error);
      return res.status(500).json({ 
        message: 'Los torneos se crearon pero hubo un error al guardar la información adicional',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function addTeamToTournament(req, res) {
  const { tournament_id } = req.params
  const { team_id } = req.body

  const { data, error } = await supabase
    .from('tournament_teams')
    .insert({
      tournament_id,
      team_id
    })
    .select()

  if (error) return res.status(500).json({ message: error.message })

  res.status(201).json({
    message: 'Team added to tournament',
    data: data[0]
  })
}

export async function updateTournament(req, res) {
  const tournament = tournaments.find(t => t.id === req.params.id)
  if (!tournament) return res.status(404).json({ message: 'Tournament not found' })
  tournament.name = req.body.name || tournament.name
  tournament.categoryId = req.body.categoryId || tournament.categoryId
  res.json(tournament)
}

export async function deleteTournament(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)
    .select()

  if (error) return res.status(500).json({ message: error.message })
  res.json({ message: 'Tournament deleted' })
}

export async function joinTournament(req, res) {
  const tournament_id = req.params.id;
  const { userId1, userId2, unavailable_time_slot, payment_status } = req.body;

  try {
    // ---------- 0) Validaciones básicas de body ----------
    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'userId1 y userId2 son requeridos' });
    }
    if (userId1 === userId2) {
      return res.status(400).json({ message: 'Los dos jugadores deben ser distintos' });
    }

    // Validar time slot seleccionado
    if (!unavailable_time_slot || typeof unavailable_time_slot !== 'string') {
      return res.status(400).json({ message: 'unavailable_time_slot es requerido y debe ser un string válido' });
    }

    const payMethod = (payment_status || '').toLowerCase();
    if (payMethod && payMethod !== 'mercadopago' && payMethod !== 'cash') {
      return res.status(400).json({ message: 'payment_status debe ser "mercadopago" o "cash"' });
    }

    // ---------- 1) Torneo ----------
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, name, category_id, courts_available, time_slots, group_time_slots, tournament_type, max_teams')
      .eq('id', tournament_id)
      .single();

    if (tErr || !tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // ---------- 2) Usuarios existen ----------
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id')
      .in('id', [userId1, userId2]);

    if (uErr) {
      return res.status(500).json({ message: uErr.message });
    }
    if (!users || users.length !== 2) {
      return res.status(400).json({ message: 'Uno o ambos usuarios no existen' });
    }

    // ---------- 3) Time slot válido dentro de group_time_slots ----------
    if (!Array.isArray(tournament.group_time_slots) || tournament.group_time_slots.length === 0) {
      return res.status(400).json({ message: 'Torneo sin time_slots configurados' });
    }
    const validSlot = tournament.group_time_slots.find(slot => slot.id === unavailable_time_slot);
    if (!validSlot) {
      return res.status(400).json({ message: 'El time slot elegido no es válido para este torneo' });
    }

    // ---------- 4) Nadie de los dos ya está inscripto en este torneo ----------
    const { data: existingPlayers, error: epErr } = await supabase
      .from('tournament_teams')
      .select(`
        team_id,
        teams (
          id,
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournament_id);

    if (epErr) {
      return res.status(500).json({ message: epErr.message });
    }

    const someoneAlreadyInTournament = (existingPlayers || []).some(reg => {
      const p1 = reg.teams?.player1_id;
      const p2 = reg.teams?.player2_id;
      return p1 === userId1 || p1 === userId2 || p2 === userId1 || p2 === userId2;
    });

    if (someoneAlreadyInTournament) {
      return res.status(400).json({ message: 'Uno o ambos jugadores ya están registrados en este torneo' });
    }

    // ---------- 5) Cupo del torneo ----------
    const maxTeams = Number.isInteger(tournament.max_teams)
      ? tournament.max_teams
      : (tournament.tournament_type === 'NINE_PLAYERS' ? 9 : 12);

    if ((existingPlayers || []).length >= maxTeams) {
      return res.status(400).json({ message: `El torneo está completo (máximo ${maxTeams} equipos)` });
    }

    // ---------- 6) Cupo por time slot ----------
    // Obtener información de todas las categorías del mismo torneo (evento)
    const { data: allTournaments, error: allTournamentsErr } = await supabase
      .from('tournaments')
      .select('id, category_id')
      .eq('name', tournament.name);

    if (allTournamentsErr) {
      return res.status(500).json({ message: allTournamentsErr.message });
    }

    const totalCategoriesCount = allTournaments.length;
    const slotCapacities = calculateTimeSlotCapacity(tournament, totalCategoriesCount);
    const selectedSlotCapacity = slotCapacities.find(cap => cap.slot_id === unavailable_time_slot);
    
    if (!selectedSlotCapacity) {
      return res.status(500).json({ message: 'Error calculando capacidad del time slot' });
    }

    // Contar equipos ya registrados en este time slot (TODAS las categorías del evento)
    const allTournamentIds = allTournaments.map(t => t.id);
    const { data: allRegisteredTeams, error: allTeamsErr } = await supabase
      .from('tournament_teams')
      .select('id, unavailable_times, tournament_id')
      .in('tournament_id', allTournamentIds)
      .eq('unavailable_times', unavailable_time_slot);

    console.log(`📊 Verificando cupos en slot "${unavailable_time_slot}":`, {
      current_usage: (allRegisteredTeams || []).length,
      max_capacity: selectedSlotCapacity.final_capacity,
      tournaments_checked: allTournamentIds
    });

    if (allTeamsErr) {
      return res.status(500).json({ message: allTeamsErr.message });
    }

    const teamsInSelectedSlot = (allRegisteredTeams || []).length;
    if (teamsInSelectedSlot >= selectedSlotCapacity.final_capacity) {
      return res.status(400).json({
        message: `El time slot "${validSlot.label}" está completo (${teamsInSelectedSlot}/${selectedSlotCapacity.final_capacity} equipos)`
      });
    }

    // ---------- 7) Buscar o crear el equipo (reutiliza si existe en cualquier orden) ----------
    const { data: existingTeam, error: findTeamErr } = await supabase
      .from('teams')
      .select('id, player1_id, player2_id')
      .or(`and(player1_id.eq.${userId1},player2_id.eq.${userId2}),and(player1_id.eq.${userId2},player2_id.eq.${userId1})`)
      .limit(1)
      .single();

    if (findTeamErr && findTeamErr.code !== 'PGRST116') {
      // PGRST116 suele ser "no rows" en modo single(); la ignoramos
      return res.status(500).json({ message: findTeamErr.message });
    }

    let teamId = existingTeam?.id;

    if (!teamId) {
      const { data: createdTeam, error: teamErr } = await supabase
        .from('teams')
        .insert({ player1_id: userId1, player2_id: userId2 })
        .select('id')
        .single();

      if (teamErr) {
        return res.status(500).json({ message: teamErr.message });
      }
      teamId = createdTeam.id;
    }

    // ---------- 8) Registrar en tournament_teams ----------
    const reference = payMethod === 'mercadopago' ? `MP-${Date.now()}` : `CASH-${Date.now()}`;

    const { error: joinErr } = await supabase
      .from('tournament_teams')
      .insert({
        tournament_id,
        team_id: teamId,
        unavailable_times: unavailable_time_slot,  // guardamos el ID del time slot
        payment_status: 'pending',                 // se actualizará cuando confirmes pago
        payment_reference: reference
      });

    if (joinErr) {
      return res.status(500).json({ message: joinErr.message });
    }

    // ---------- 9) Respuesta enriquecida ----------
    const updatedSlotCount = teamsInSelectedSlot + 1;
    const slotAvailability = {
      slot_id: unavailable_time_slot,
      slot_label: validSlot.label,
      selected_count: updatedSlotCount,
      total_capacity: selectedSlotCapacity.final_capacity,
      remaining_slots: Math.max(0, selectedSlotCapacity.final_capacity - updatedSlotCount),
      percentage_full: Math.round((updatedSlotCount / selectedSlotCapacity.final_capacity) * 100)
    };

    // nombre de categoría (opcional)
    let categoryName = 'Sin categoría';
    if (tournament.category_id) {
      const { data: cat, error: catErr } = await supabase
        .from('categories')
        .select('name')
        .eq('id', tournament.category_id)
        .single();
      if (!catErr && cat?.name) categoryName = cat.name;
    }

    return res.status(201).json({
      message: 'Inscripción realizada correctamente',
      tournament_info: {
        id: tournament.id,
        name: tournament.name,
        category: categoryName,
        tournament_type: tournament.tournament_type,
        max_teams: maxTeams,
        current_teams: (existingPlayers || []).length + 1
      },
      time_slot: {
        slot_info: slotAvailability
      },
      team_id: teamId
    });
  } catch (error) {
    console.error('joinTournament error:', error);
    return res.status(500).json({ message: error.message });
  }
}


export async function getStandings(req, res) {

  const standings = [
    { teamId: 'team1', points: 6, gamesDiff: 10 },
    { teamId: 'team2', points: 4, gamesDiff: 5 }
  ]
  res.json(standings)
}

export async function generateLeagueMatches(req, res) {
  const tournament_id = req.params.id

  // Get all teams in tournament
  const { data: tournamentTeams, error: teamsError } = await supabase
    .from('tournament_teams')
    .select(`
      team_id,
      teams (
        player1_id,
        player2_id
      )
    `)
    .eq('tournament_id', tournament_id)

  if (teamsError) return res.status(500).json({ message: teamsError.message })
  if (!tournamentTeams.length) return res.status(400).json({ message: 'No teams in tournament' })

  // Create matches for round-robin (everyone plays against everyone)
  const matches = []
  const teams = tournamentTeams.map(tt => tt.team_id)
  
  // Generate all possible combinations of teams
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        tournament_id,
        home_team_id: teams[i],
        away_team_id: teams[j],
        status: 'pending'
      })
    }
  }

  // Insert matches into database
  const { data: createdMatches, error: matchError } = await supabase
    .from('matches')
    .insert(matches)
    .select()

  if (matchError) return res.status(500).json({ message: matchError.message })

  res.json({
    message: `Generated ${matches.length} matches successfully`,
    matches: createdMatches
  })

}

export async function getMatchesByTournamentId(req, res) {
  const tournament_id = req.params.id
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournament_id)

  if (error) return res.status(500).json({ message: error.message })
  res.json({message: 'Matches fetched successfully', matches: data})
}

export async function getPlayersByTournamentId(req, res) {
  const tournament_id = req.params.id
  const { data, error } = await supabase
    .from('tournament_teams')
    .select('*')
    .eq('tournament_id', tournament_id)

  if (error) return res.status(500).json({ message: error.message })
  res.json({message: 'Players fetched successfully', players: data})
}

// Configuración de formatos de torneo (ACTUALIZADA)
const TOURNAMENT_FORMATS = {
  'NINE_PLAYERS': {
    total_teams: 9,
    groups_count: 3,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 6 equipos clasifican (2 de cada grupo)
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 2,  // Los 2 mejores primeros pasan directo a semis
      quarter_finals_teams: 4,  // Los otros 4 juegan cuartos
      description: '6 clasifican: 2 mejores 1ros → semis, otros 4 → cuartos'
    }
  },
  'TWELVE_PLAYERS': {
    total_teams: 12,
    groups_count: 4,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 8 equipos clasifican (2 de cada grupo)
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0,  // Todos juegan cuartos
      quarter_finals_teams: 8,  // Todos los 8 clasificados juegan cuartos
      description: '8 clasifican: todos juegan cuartos → semis → final'
    }
  }
};

// Función para generar grupos con distribución inteligente basada en restricciones horarias
async function generateTournamentGroups(tournament, teams) {
  const format = TOURNAMENT_FORMATS[tournament.tournament_type];
  
  // 1. Obtener las restricciones horarias de cada equipo
  const { data: teamConstraints, error: constraintsError } = await supabase
    .from('tournament_teams')
    .select('team_id, unavailable_times')
    .eq('tournament_id', tournament.id)
    .in('team_id', teams.map(t => t.id));

  if (constraintsError) throw new Error(`Error obteniendo restricciones: ${constraintsError.message}`);

  // 2. Crear mapa de equipos con sus restricciones
  const teamsWithConstraints = teams.map(team => {
    const constraint = teamConstraints.find(tc => tc.team_id === team.id);
    return {
      ...team,
      unavailable_slot: constraint?.unavailable_times || null
    };
  });

  // 3. Algoritmo de distribución inteligente
  const distributedGroups = distributeTeamsIntelligently(teamsWithConstraints, format);
  
  const groups = [];

  // 4. Crear grupos en la base de datos
  for (let i = 0; i < distributedGroups.length; i++) {
    const groupTeams = distributedGroups[i];
    
    const { data: group, error } = await supabase
      .from('tournament_groups')
      .insert({
        tournament_id: tournament.id,
        group_number: i + 1,
        teams: groupTeams.map(t => t.id),
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (error) throw new Error(`Error creando grupo ${i + 1}: ${error.message}`);
    groups.push(group);

    // Generar partidos del grupo
    await generateGroupMatches(tournament.id, group.id, groupTeams, group.group_number);
  }

  return groups;
}

// Función para calcular cupos disponibles por time slot (MEJORADA)
function calculateTimeSlotCapacity(tournament, totalCategoriesCount) {
  const groupSlots = tournament.group_time_slots || [];
  const totalTeamsAcrossCategories = totalCategoriesCount * tournament.max_teams;
  
  console.log(`📊 Calculando cupos para ${totalCategoriesCount} categorías × ${tournament.max_teams} equipos = ${totalTeamsAcrossCategories} parejas totales`);
  
  // NUEVA LÓGICA: cada equipo juega 2 partidos en fase de grupos (grupos de 3)
  const matchesPerTeam = 2; // En grupos de 3: A vs B, A vs C, B vs C
  const totalMatches = (totalTeamsAcrossCategories * matchesPerTeam) / 2; // /2 porque cada partido involucra 2 equipos
  
  console.log(`🎾 Total de partidos en fase de grupos: ${totalMatches}`);
  
  // CONFIGURACIÓN REAL DEL CLUB: partidos de 45 minutos
  const matchDurationMinutes = 45;
  const turnosPerHour = 60 / matchDurationMinutes; // 1.33 turnos por hora
  
  // Calcular capacidad total de programación entre todos los slots
  let totalSlotCapacity = 0;
  const slotDetails = groupSlots.map(slot => {
    const slotDurationHours = calculateSlotDurationHours(slot.start, slot.end);
    const maxConcurrentMatches = tournament.courts_available;
    
    // Capacidad real considerando partidos de 45 minutos
    const turnosInSlot = Math.floor(slotDurationHours * turnosPerHour);
    const maxMatchesInSlot = turnosInSlot * maxConcurrentMatches;
    totalSlotCapacity += maxMatchesInSlot;
    
    return {
      slot_id: slot.id,
      label: slot.label,
      duration_hours: slotDurationHours,
      turnos_in_slot: turnosInSlot,
      max_matches_in_slot: maxMatchesInSlot,
      courts_available: maxConcurrentMatches
    };
  });
  
  console.log(`⏰ Capacidad total de programación: ${totalSlotCapacity} partidos entre todos los slots`);
  
  // Verificar si hay suficiente capacidad
  if (totalSlotCapacity < totalMatches) {
    console.warn(`⚠️ ADVERTENCIA: No hay suficiente capacidad de programación (${totalSlotCapacity} < ${totalMatches})`);
  }
  
  // NUEVA LÓGICA: calcular cupos por slot basado en restricciones
  // Un equipo que elige un slot como "no disponible" reduce la flexibilidad de programación
  // El objetivo es distribuir estas restricciones de manera equilibrada
  
  const capacityPerSlot = slotDetails.map(slot => {
    // Capacidad base: distribución equitativa de restricciones
    const baseCapacityPerSlot = Math.floor(totalTeamsAcrossCategories / groupSlots.length);
    
    // Capacidad máxima: basada en la capacidad de programación del slot
    // Si un slot tiene más horas/canchas, puede acomodar más restricciones
    const slotWeight = slot.max_matches_in_slot / totalSlotCapacity;
    const weightedCapacity = Math.floor(totalTeamsAcrossCategories * slotWeight * 1.5); // Factor 1.5 para flexibilidad
    
    // Capacidad final: el menor entre distribución equitativa y capacidad weighted
    const finalCapacity = Math.min(baseCapacityPerSlot + 2, weightedCapacity); // +2 para flexibilidad mínima
    
    return {
      slot_id: slot.slot_id,
      label: slot.label,
      duration_hours: slot.duration_hours,
      max_matches_in_slot: slot.max_matches_in_slot,
      base_capacity: baseCapacityPerSlot,
      weighted_capacity: weightedCapacity,
      final_capacity: finalCapacity,
      slot_weight: Math.round(slotWeight * 100) // porcentaje
    };
  });
  
  console.log('🎯 Capacidades calculadas por time slot (MEJORADO):');
  capacityPerSlot.forEach(cap => {
    const slotDetail = slotDetails.find(s => s.slot_id === cap.slot_id);
    console.log(`  ${cap.label}: ${cap.final_capacity} cupos (${cap.duration_hours}h, ${slotDetail?.turnos_in_slot}t, ${cap.max_matches_in_slot} partidos máx, ${cap.slot_weight}% peso)`);
  });
  
  return capacityPerSlot;
}

// Helper para calcular duración de un slot en horas
function calculateSlotDurationHours(startTime, endTime) {
  const [startHour] = startTime.split(':').map(Number);
  let [endHour] = endTime.split(':').map(Number);
  
  // Manejar slots que cruzan medianoche (ej: 22:00 - 01:00)
  if (endHour < startHour) {
    endHour += 24; // Agregar 24 horas para el día siguiente
  }
  
  return endHour - startHour;
}

// Función para generar time slots dinámicamente basados en fechas del torneo
function generateDynamicTimeSlots(startDate, endDate) {
  // Asegurar que las fechas se interpreten en zona horaria local
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  // Calcular duración del torneo en días
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  console.log(`🗓️ Generando time slots dinámicos para torneo de ${durationDays} días (${start.toDateString()} - ${end.toDateString()})`);
  
  const slots = [];
  
  // DÍA 1: Primer día del torneo (después de las 18:00)
  const day1 = new Date(start);
  const day1Name = getDayName(day1);
  
  slots.push(
    {
      id: `day1_evening`,
      day: day1Name.toLowerCase(),
      start: '18:00',
      end: '21:00',
      label: `${day1Name} Tarde (18-21hs)`,
      tournament_day: 1,
      date: formatDateSafe(day1)
    },
    {
      id: `day1_night`,
      day: day1Name.toLowerCase(),
      start: '22:00',
      end: '00:00',
      label: `${day1Name} Noche (22-24hs)`,
      tournament_day: 1,
      date: formatDateSafe(day1)
    }
  );
  
  // DÍA 2: Segundo día del torneo (todo el día, si hay al menos 2 días)
  if (durationDays >= 2) {
    const day2 = new Date(start);
    day2.setDate(day2.getDate() + 1);
    const day2Name = getDayName(day2);
    
    slots.push(
      {
        id: `day2_morning`,
        day: day2Name.toLowerCase(),
        start: '08:00',
        end: '12:00',
        label: `${day2Name} Mañana (8-12hs)`,
        tournament_day: 2,
        date: formatDateSafe(day2)
      },
      {
        id: `day2_afternoon`,
        day: day2Name.toLowerCase(),
        start: '13:00',
        end: '17:00',
        label: `${day2Name} Tarde (13-17hs)`,
        tournament_day: 2,
        date: formatDateSafe(day2)
      },
      {
        id: `day2_evening`,
        day: day2Name.toLowerCase(),
        start: '18:00',
        end: '21:00',
        label: `${day2Name} Noche (18-21hs)`,
        tournament_day: 2,
        date: formatDateSafe(day2)
      },
      {
        id: `day2_late_night`,
        day: day2Name.toLowerCase(),
        start: '22:00',
        end: '01:00',
        label: `${day2Name} Noche Tardía (22-01hs)`,
        tournament_day: 2,
        date: formatDateSafe(day2)
      }
    );
  }
  
  // DÍA 3: RESERVADO PARA ELIMINATORIAS (cuartos, semis, final)
  // NO se generan slots para inscripción - solo para programación automática posterior
  if (durationDays >= 3) {
    console.log(`🏆 Día 3 (${getDayName(new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000))}) reservado para fase eliminatoria`);
    // Los slots del día 3 se generarán automáticamente cuando se programen las eliminatorias
  }
  
  console.log('🎯 Time slots generados dinámicamente:', slots.map(s => `${s.label} (${s.id})`));
  
  return slots;
}

// Helper para obtener nombre del día en español
function getDayName(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

// Helper para formatear fecha como YYYY-MM-DD sin problemas de zona horaria
function formatDateSafe(date) {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
}

// Helper para validar time slots dinámicos
function validateDynamicTimeSlot(slot) {
  const HHMM = /^\d{2}:\d{2}$/;
  const allowedDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  return slot.id && 
         allowedDays.includes(slot.day) && 
         HHMM.test(slot.start) && 
         HHMM.test(slot.end) &&
         slot.tournament_day &&
         slot.date;
}

// Función auxiliar para distribución inteligente de equipos basada en time slots
function distributeTeamsIntelligently(teams, format) {
  console.log('🎯 Iniciando distribución inteligente de equipos:', teams.map(t => ({
    id: t.id,
    unavailable_slot: t.unavailable_slot
  })));

  // 1. Agrupar equipos por time slot no disponible
  const teamsByUnavailableSlot = {};
  const teamsWithoutConstraints = [];

  teams.forEach(team => {
    if (team.unavailable_slot !== null && team.unavailable_slot !== undefined) {
      const slot = team.unavailable_slot;
      if (!teamsByUnavailableSlot[slot]) {
        teamsByUnavailableSlot[slot] = [];
      }
      teamsByUnavailableSlot[slot].push(team);
    } else {
      teamsWithoutConstraints.push(team);
    }
  });

  console.log('📊 Equipos agrupados por time slot:', teamsByUnavailableSlot);
  console.log('🆓 Equipos sin restricciones:', teamsWithoutConstraints.length);

  // 2. Estrategia de distribución inteligente
  const groups = [];
  const usedTeams = new Set();
  
  // 2a. Crear grupos con equipos de diferentes time slots (máxima compatibilidad)
  const slotGroups = Object.keys(teamsByUnavailableSlot);
  
  if (slotGroups.length >= format.groups_count) {
    // Caso ideal: tenemos suficientes slots diferentes para balancear
    for (let groupIndex = 0; groupIndex < format.groups_count; groupIndex++) {
      const group = [];
      
      // Tomar un equipo de cada slot diferente si es posible
      for (let teamIndex = 0; teamIndex < format.teams_per_group; teamIndex++) {
        let teamAdded = false;
        
        // Intentar tomar de slots diferentes
        for (const slot of slotGroups) {
          const availableTeams = teamsByUnavailableSlot[slot].filter(t => !usedTeams.has(t.id));
          if (availableTeams.length > 0 && group.length < format.teams_per_group) {
            const team = availableTeams[0];
            group.push(team);
            usedTeams.add(team.id);
            teamAdded = true;
            break;
          }
        }
        
        // Si no encontramos en slots diferentes, usar equipos sin restricciones
        if (!teamAdded && teamsWithoutConstraints.length > 0) {
          const availableTeams = teamsWithoutConstraints.filter(t => !usedTeams.has(t.id));
          if (availableTeams.length > 0) {
            const team = availableTeams[0];
            group.push(team);
            usedTeams.add(team.id);
          }
        }
      }
      
      if (group.length === format.teams_per_group) {
        groups.push(group);
      }
    }
  }

  // 2b. Llenar grupos restantes con cualquier equipo disponible
  const remainingTeams = teams.filter(t => !usedTeams.has(t.id));
  let teamIndex = 0;
  
  for (let groupIndex = groups.length; groupIndex < format.groups_count; groupIndex++) {
    const group = [];
    for (let i = 0; i < format.teams_per_group && teamIndex < remainingTeams.length; i++) {
      group.push(remainingTeams[teamIndex]);
      teamIndex++;
    }
    if (group.length === format.teams_per_group) {
      groups.push(group);
    }
  }

  // 3. Validación y logging
  console.log('✅ Grupos formados:');
  groups.forEach((group, index) => {
    console.log(`Grupo ${index + 1}:`, group.map(t => ({
      id: t.id,
      unavailable_slot: t.unavailable_slot
    })));
    
    // Calcular time slots disponibles para este grupo
    const unavailableSlots = group
      .map(t => t.unavailable_slot)
      .filter(s => s !== null && s !== undefined);
    console.log(`  Time slots NO disponibles para partidos: [${unavailableSlots.join(', ')}]`);
  });

  return groups;
}

// --- NUEVO: endpoint para generación manual de grupos ---
export async function generateGroupsManual(req, res) {
  const tournament_id = req.params.id;
  const { groups } = req.body; // Array de { group_number, teams: [team_ids] }

  try {
    // 1) Validar request
    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ message: 'Se requiere array de grupos' });
    }

    // 2) Traer torneo
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, max_teams')
      .eq('id', tournament_id)
      .single();
    if (tErr || !tournament) return res.status(404).json({ message: 'Tournament not found' });

    // 3) Validar cantidad de grupos
    const expected = tournament.tournament_type === 'NINE_PLAYERS' ? 3 : 4;
    if (groups.length !== expected) {
      return res.status(400).json({
        message: `Se esperaban ${expected} grupos y se recibieron ${groups.length}`
      });
    }

    // 4) Validar que cada grupo tenga exactamente 3 equipos
    for (const group of groups) {
      if (!Array.isArray(group.teams) || group.teams.length !== 3) {
        return res.status(400).json({
          message: `El grupo ${group.group_number} debe tener exactamente 3 equipos`
        });
      }
    }

    // 5) Crear grupos en la BD
    const createdGroups = [];
    for (const groupConfig of groups) {
      const { data: group, error } = await supabase
        .from('tournament_groups')
        .insert({
          tournament_id,
          group_number: groupConfig.group_number,
          teams: groupConfig.teams,
          status: 'IN_PROGRESS'
        })
        .select()
        .single();

      if (error) throw new Error(`Error creando grupo ${groupConfig.group_number}: ${error.message}`);
      createdGroups.push(group);

      // 6) Generar partidos del grupo
      const groupTeams = groupConfig.teams.map(team_id => ({ id: team_id }));
      await generateGroupMatches(tournament_id, group.id, groupTeams, group.group_number);
    }

    return res.status(201).json({
      message: 'Grupos generados manualmente con éxito',
      tournament_id,
      groups_created: createdGroups.map(g => ({ 
        id: g.id, 
        group_number: g.group_number, 
        teams: g.teams 
      }))
    });
  } catch (err) {
    console.error('generateGroupsManual error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// --- NUEVO: wrapper HTTP para generar grupos automáticos ---
export async function generateGroupsPhase(req, res) {
  const tournament_id = req.params.id;

  try {
    // 1) Traer torneo
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, name, tournament_type, max_teams')
      .eq('id', tournament_id)
      .single();
    if (tErr || !tournament) return res.status(404).json({ message: 'Tournament not found' });

    // 2) Traer equipos inscriptos
    const { data: tteams, error: teamsErr } = await supabase
      .from('tournament_teams')
      .select('team_id')
      .eq('tournament_id', tournament_id);
    if (teamsErr) return res.status(500).json({ message: teamsErr.message });

    const teams = (tteams || []).map(x => ({ id: x.team_id }));
    if (!teams.length) return res.status(400).json({ message: 'No hay equipos inscriptos' });

    // Validación rápida contra el tipo (9 o 12)
    const expected = tournament.tournament_type === 'NINE_PLAYERS' ? 9 : 12;
    if (teams.length !== expected) {
      return res.status(400).json({
        message: `Cantidad de equipos inválida: se esperaban ${expected} y hay ${teams.length}`
      });
    }

    // 3) Generar grupos (usa tu helper ya definido arriba)
    const groups = await generateTournamentGroups(tournament, teams); // <-- ya lo tienes como helper interno

    return res.status(201).json({
      message: 'Grupos generados correctamente',
      tournament_id,
      groups_created: groups.map(g => ({ id: g.id, group_number: g.group_number, teams: g.teams }))
    });
  } catch (err) {
    console.error('generateGroupsPhase error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// --- Opcional: listar grupos creados ---
export async function getGroups(req, res) {
  try {
    const { data, error } = await supabase
      .from('tournament_groups')
      .select('*')
      .eq('tournament_id', req.params.id)
      .order('group_number', { ascending: true });
    if (error) return res.status(500).json({ message: error.message });
    res.json({ message: 'Grupos del torneo', groups: data });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// Nueva función para validar conflictos horarios en grupos
export async function validateGroupScheduleConflicts(req, res) {
  const tournament_id = req.params.id;
  const { groups } = req.body; // Array de grupos propuestos por el admin
  
  try {
    // 1. Obtener time slots del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('group_time_slots, tournament_type')
      .eq('id', tournament_id)
      .single();
      
    if (tournamentError) return res.status(500).json({ message: tournamentError.message });
    
    // 2. Obtener restricciones de todos los equipos
    const { data: teamConstraints, error: constraintsError } = await supabase
      .from('tournament_teams')
      .select(`
        team_id, 
        unavailable_times,
        teams (
          player1:users!teams_player1_id_fkey (first_name, last_name),
          player2:users!teams_player2_id_fkey (first_name, last_name)
        )
      `)
      .eq('tournament_id', tournament_id);
      
    if (constraintsError) return res.status(500).json({ message: constraintsError.message });
    
    // 3. Validar cada grupo propuesto
    const validationResults = [];
    
    for (const group of groups) {
      const groupValidation = {
        group_number: group.group_number,
        teams: group.teams,
        conflicts: [],
        available_slots: [],
        recommended_slots: []
      };
      
      // Obtener restricciones de los equipos en este grupo
      const groupTeamConstraints = group.teams.map(teamId => {
        const constraint = teamConstraints.find(tc => tc.team_id === teamId);
        return {
          team_id: teamId,
          unavailable_slot: constraint?.unavailable_times,
          team_name: constraint ? 
            `${constraint.teams.player1.first_name} ${constraint.teams.player1.last_name} / ${constraint.teams.player2.first_name} ${constraint.teams.player2.last_name}` :
            `Equipo ${teamId}`
        };
      });
      
      // Identificar conflictos horarios
      const unavailableSlots = groupTeamConstraints
        .map(tc => tc.unavailable_slot)
        .filter(slot => slot !== null && slot !== undefined);
      
      const availableSlots = tournament.group_time_slots.filter(slot => 
        !unavailableSlots.includes(slot.id) && 
        (slot.tournament_day === 1 || slot.tournament_day === 2) // Solo días 1-2
      );
      
      // Detectar conflictos específicos
      groupTeamConstraints.forEach(team => {
        if (team.unavailable_slot) {
          const conflictSlot = tournament.group_time_slots.find(s => s.id === team.unavailable_slot);
          if (conflictSlot) {
            groupValidation.conflicts.push({
              team_id: team.team_id,
              team_name: team.team_name,
              unavailable_slot: team.unavailable_slot,
              unavailable_label: conflictSlot.label,
              message: `${team.team_name} NO puede jugar en ${conflictSlot.label}`
            });
          }
        }
      });
      
      groupValidation.available_slots = availableSlots.map(slot => ({
        slot_id: slot.id,
        label: slot.label,
        day: slot.tournament_day,
        start: slot.start,
        end: slot.end
      }));
      
      // Recomendar mejores horarios (más opciones disponibles)
      groupValidation.recommended_slots = availableSlots
        .slice(0, 3) // Top 3 recomendados
        .map(slot => slot.label);
        
      groupValidation.has_conflicts = groupValidation.conflicts.length > 0;
      groupValidation.schedule_flexibility = availableSlots.length;
      
      validationResults.push(groupValidation);
    }
    
    // 4. Resumen general
    const totalConflicts = validationResults.reduce((sum, g) => sum + g.conflicts.length, 0);
    const groupsWithConflicts = validationResults.filter(g => g.has_conflicts).length;
    
    res.json({
      message: 'Validación de conflictos horarios completada',
      tournament_id,
      summary: {
        total_groups: groups.length,
        groups_with_conflicts: groupsWithConflicts,
        total_conflicts: totalConflicts,
        overall_status: totalConflicts === 0 ? 'SIN_CONFLICTOS' : 'CONFLICTOS_DETECTADOS'
      },
      validation_results: validationResults
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function generateGroupMatches(tournament_id, group_id, groupTeams, group_number) {
  const matches = [];
  let matchCounter = 1;

  // Todos contra todos (round-robin entre 3 equipos -> 3 partidos)
  for (let i = 0; i < groupTeams.length; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      matches.push({
        tournament_id,
        group_id,
        group_number,               
        home_team_id: groupTeams[i].id,
        away_team_id: groupTeams[j].id,
        round: 'group',              
        stage: 'group',              
        match_number: matchCounter,  
        status: 'pending'            
        // match_day, start_time y court_id se asignan después desde la UI/admin
      });
      matchCounter++;
    }
  }

  const { error } = await supabase
    .from('tournament_matches')
    .insert(matches);

  if (error) throw new Error(`Error creando partidos de grupo: ${error.message}`);
}

// Función para generar fase eliminatoria
async function generateEliminationPhase(tournament_id, qualified_teams) {
  const tournament = await getTournamentDetails(tournament_id);
  const format = TOURNAMENT_FORMATS[tournament.tournament_type];
  
  // Ordenar equipos por puntos y diferencia de juegos
  const sortedTeams = qualified_teams.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    return b.games_diff - a.games_diff;
  });

  let bracket = [];
  if (tournament.tournament_type === 'NINE_PLAYERS') {
    // Los 2 mejores primeros pasan directo a semis
    const directToSemis = sortedTeams.slice(0, 2);
    const playQuarters = sortedTeams.slice(2);
    
    // Generar cuartos de final (4 equipos)
    bracket = await generateQuarterFinals(tournament_id, playQuarters);
    
    // Agregar los que pasan directo a semis
    bracket = [...directToSemis, ...bracket];
  } else {
    // Todos juegan cuartos (8 equipos)
    bracket = await generateQuarterFinals(tournament_id, sortedTeams);
  }

  return bracket;
}

// First, get available courts for the tournament
async function getTournamentCourts(tournament_id) {
  const { data: courts, error } = await supabase
    .from('courts')
    .select('id')
    .eq('status', 'active')  // Assuming you have a status field

  if (error) throw new Error(`Failed to get courts: ${error.message}`)
  return courts.map(court => court.id)
}

// FUNCIÓN VIEJA ELIMINADA - Reemplazada por nueva implementación más avanzada

function generateAvailableTimeSlots(timeSlots, startDate, endDate) {
  const slots = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    for (const [startHour, endHour] of timeSlots) {
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push({
          date: new Date(date),
          hour
        })
      }
    }
  }
  return slots
}

// FUNCIÓN VIEJA ELIMINADA - Reemplazada por nueva implementación avanzada

function isSlotValidForTeams(slot, homeTeamId, awayTeamId, teams) {
  const hour = parseInt(slot.hour)
  
  // For semifinal/final matches where teams aren't known yet
  if (!homeTeamId || !awayTeamId) return true

  // Find team constraints
  const homeTeamData = teams.find(t => t.team_id === homeTeamId)
  const awayTeamData = teams.find(t => t.team_id === awayTeamId)

  if (!homeTeamData || !awayTeamData) {
    return false
  }

  // Check if either team is unavailable at this hour
  const isHomeTeamUnavailable = homeTeamData.unavailable_times === hour
  const isAwayTeamUnavailable = awayTeamData.unavailable_times === hour

  return !isHomeTeamUnavailable && !isAwayTeamUnavailable
}

function validateSchedule(matches, teams, maxConcurrentMatches) {
  const errors = []
  const matchesBySlot = new Map()

  // Group matches by time slot
  for (const match of matches) {
    const hour = parseInt(match.start_time.split(':')[0])
    const slotKey = `${match.match_day}_${hour}`
    const currentSlotMatches = matchesBySlot.get(slotKey) || []
    currentSlotMatches.push(match)
    matchesBySlot.set(slotKey, currentSlotMatches)

    // Validate team availability
    if (match.home_team_id) {
      const homeTeam = teams.find(t => t.team_id === match.home_team_id)
      if (homeTeam && homeTeam.unavailable_times === hour) {
        errors.push(`Team ${match.home_team_id} is scheduled at ${hour}:00 but is unavailable`)
      }
    }
    if (match.away_team_id) {
      const awayTeam = teams.find(t => t.team_id === match.away_team_id)
      if (awayTeam && awayTeam.unavailable_times === hour) {
        errors.push(`Team ${match.away_team_id} is scheduled at ${hour}:00 but is unavailable`)
      }
    }
  }

  // Check concurrent matches limit
  for (const [slotKey, slotMatches] of matchesBySlot) {
    if (slotMatches.length > maxConcurrentMatches) {
      errors.push(`Time slot ${slotKey} has ${slotMatches.length} matches, exceeding limit of ${maxConcurrentMatches}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function scheduleMatches(matches, availableSlots, maxConcurrentMatches, teams) {
  const scheduledMatches = []
  const unscheduledMatches = []
  const usedSlots = new Map()
  
  // Group matches by round
  const matchesByRound = {}
  for (const match of matches) {
    if (!matchesByRound[match.round]) matchesByRound[match.round] = []
    matchesByRound[match.round].push(match)
  }
  
  // Find earliest possible start date for each round
  const earliestRoundDates = {}
  for (let round = 1; round <= 3; round++) {
    if (round === 1) {
      // First round can start immediately
      earliestRoundDates[round] = new Date(Math.min(...availableSlots.map(s => s.date.getTime())))
    } else {
      // Later rounds must wait for earlier rounds to complete
      earliestRoundDates[round] = null // Will be set after scheduling previous round
    }
  }
  
  // Schedule round by round
  for (let round = 1; round <= 3; round++) {
    const roundMatches = matchesByRound[round] || []
    
    // Schedule each match in this round
    for (const match of roundMatches) {
      let scheduled = false
      
      // Try to find a valid slot
      for (const slot of availableSlots) {
        // Skip slots before the earliest allowed date for this round
        if (earliestRoundDates[round] && slot.date < earliestRoundDates[round]) {
          continue
        }
        
        const slotKey = `${slot.date.toISOString().split('T')[0]}_${slot.hour}`
        const currentSlotMatches = usedSlots.get(slotKey) || 0
        
        // Skip if slot is already at max capacity
        if (currentSlotMatches >= maxConcurrentMatches) {
          continue
        }
        
        // Skip if either team is unavailable (only for first round where teams are known)
        if (match.home_team_id && match.away_team_id) {
          if (!isSlotValidForTeams(slot, match.home_team_id, match.away_team_id, teams)) {
            continue
          }
        }
        
        // Schedule the match
        const matchDateTime = new Date(slot.date)
        matchDateTime.setHours(slot.hour)
        
        scheduledMatches.push({
          tournament_id: match.tournament_id,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          match_day: matchDateTime.toISOString().split('T')[0],
          start_time: `${slot.hour}:00:00`,
          status: 'pending',
          round: match.round
        })
        
        // Update used slots
        usedSlots.set(slotKey, currentSlotMatches + 1)
        scheduled = true
        break
      }
      
      if (!scheduled) {
        unscheduledMatches.push(match)
      }
    }
    
    // Update earliest date for next round if we scheduled anything
    if (round < 3 && scheduledMatches.filter(m => m.round === round).length > 0) {
      // Get the last match day for this round
      const roundMatchDays = scheduledMatches
        .filter(m => m.round === round)
        .map(m => new Date(m.match_day + 'T' + m.start_time).getTime())
      
      const lastMatchDate = new Date(Math.max(...roundMatchDays))
      // Next round can start the next day
      const nextRoundDate = new Date(lastMatchDate)
      nextRoundDate.setDate(nextRoundDate.getDate() + 1)
      earliestRoundDates[round + 1] = nextRoundDate
    }
  }
  
  return { scheduledMatches, unscheduledMatches }
}

export async function getTournamentTeams(req, res) {
  const tournament_id = req.params.id

  try {
    const { data: teams, error } = await supabase
      .from('tournament_teams')
      .select(`
        team_id,
        unavailable_times,
        teams (
          id,
          player1_id,
          player2_id,
          player1:users!teams_player1_id_fkey (
            first_name,
            last_name
          ),
          player2:users!teams_player2_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('tournament_id', tournament_id)

    if (error) throw error

    res.json({
      message: 'Tournament teams retrieved successfully',
      teams: teams
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Nueva función para obtener time slots disponibles para inscripción (SOLO DÍAS 1-2)
export async function getAvailableTimeSlotsForRegistration(req, res) {
  const { id } = req.params;
  
  try {
    // 1. Obtener información del torneo
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('name, group_time_slots, courts_available, category_id, tournament_type, max_teams, start_date, end_date')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to get tournament: ${error.message}`);
    if (!tournament) throw new Error('Tournament not found');

    // 2. Contar total de categorías para este torneo (asumiendo que hay múltiples categorías)
    const { data: allTournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, category_id')
      .eq('name', tournament.name); // Todos los torneos con el mismo nombre son del mismo evento

    if (tournamentsError) throw new Error(`Failed to get tournaments: ${tournamentsError.message}`);
    const totalCategoriesCount = allTournaments.length;

    // 3. Filtrar solo time slots de DÍAS 1-2 (Viernes y Sábado para fase de grupos)
    const groupPhaseSlots = tournament.group_time_slots.filter(slot => 
      slot.tournament_day === 1 || slot.tournament_day === 2
    );
    
    console.log(`🎯 Slots disponibles para jugadores (solo días 1-2):`, groupPhaseSlots.map(s => s.label));

    // 4. Calcular capacidades solo para slots de fase de grupos
    const tournamentWithFilteredSlots = { ...tournament, group_time_slots: groupPhaseSlots };
    const slotCapacities = calculateTimeSlotCapacity(tournamentWithFilteredSlots, totalCategoriesCount);

    // 5. Obtener equipos ya registrados de TODAS las categorías del mismo evento
    const allTournamentIds = allTournaments.map(t => t.id);
    const { data: allRegisteredTeams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select('unavailable_times, tournament_id')
      .in('tournament_id', allTournamentIds);

    if (teamsError) throw new Error(`Failed to get registered teams: ${teamsError.message}`);

    console.log(`📊 Equipos registrados en TODAS las categorías:`, allRegisteredTeams?.length || 0);

    // 6. Contar equipos por time slot (COMPARTIDO entre todas las categorías)
    const slotUsage = {};
    (allRegisteredTeams || []).forEach(team => {
      const slotId = team.unavailable_times;
      if (slotId && groupPhaseSlots.find(s => s.id === slotId)) {
        slotUsage[slotId] = (slotUsage[slotId] || 0) + 1;
      }
    });

    console.log(`🎯 Uso actual de slots (compartido):`, slotUsage);

    // 7. Construir respuesta con disponibilidad
    const availableSlots = slotCapacities.map(capacity => {
      const currentUsage = slotUsage[capacity.slot_id] || 0;
      const remainingSlots = Math.max(0, capacity.final_capacity - currentUsage);
      
      return {
        slot_id: capacity.slot_id,
        label: capacity.label,
        total_capacity: capacity.final_capacity,
        current_usage: currentUsage,
        remaining_slots: remainingSlots,
        is_available: remainingSlots > 0,
        percentage_full: Math.round((currentUsage / capacity.final_capacity) * 100),
        duration_hours: capacity.duration_hours
      };
    });

    res.json({
      message: 'Available time slots retrieved successfully (GROUP PHASE ONLY)',
      tournament_info: {
        category_id: tournament.category_id,
        tournament_type: tournament.tournament_type,
        max_teams: tournament.max_teams,
        courts_available: tournament.courts_available,
        total_categories: totalCategoriesCount,
        total_teams_across_categories: totalCategoriesCount * tournament.max_teams,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        group_phase_days: `${getDayName(new Date(tournament.start_date))} y ${getDayName(new Date(new Date(tournament.start_date).setDate(new Date(tournament.start_date).getDate() + 1)))}`
      },
      available_slots: availableSlots,
      note: "🔄 CUPOS COMPARTIDOS: Los time slots son compartidos entre TODAS las categorías del evento. Si una pareja de Sexta elige un slot, afecta la disponibilidad para Cuarta, Quinta, etc.",
      debug_info: {
        all_tournament_ids: allTournamentIds,
        total_registered_teams: (allRegisteredTeams || []).length,
        slot_usage_breakdown: slotUsage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAvailableHoursForRegistration(req, res) {
  const { id } = req.params;
  
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('time_slots, courts_available, category_id, tournament_type, start_date, end_date, max_teams')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to get tournament: ${error.message}`);
    if (!tournament) throw new Error('Tournament not found');

    // Datos de categoría
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('name, max_teams')
      .eq('id', tournament.category_id)
      .single();
    if (categoryError) throw new Error(`Failed to get category: ${categoryError.message}`);

    // Equipos inscriptos
    const { data: existingTeams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select(`
        unavailable_times, 
        team_id,
        teams (
          player1_id,
          player2_id,
          player1:users!teams_player1_id_fkey (
            first_name,
            last_name
          ),
          player2:users!teams_player2_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('tournament_id', id);
    if (teamsError) throw new Error(`Failed to get teams: ${teamsError.message}`);

    // ---- NUEVA LÓGICA: cálculo de capacidad ----
    const totalTeams = category.max_teams;   // en el futuro puede ser sumatoria si torneo admite varias cat.
    const totalMatches = Math.ceil(totalTeams / 2);
    
    // horas disponibles entre start_date y end_date
    const start = new Date(tournament.start_date);
    const end = new Date(tournament.end_date);
    const days = Math.ceil((end - start) / (1000*60*60*24)) + 1;

    let horasPorDia = 0;
    tournament.time_slots.forEach(([st, en]) => { horasPorDia += (en - st); });

    const slotsDisponibles = horasPorDia * days * tournament.courts_available;
    const partidosPorSlot = Math.max(1, Math.ceil(totalMatches / slotsDisponibles));
    const cupoPorSlot = partidosPorSlot * 2;  // 2 equipos por partido

    // ---- Conteo de equipos que ya eligieron un horario ----
    const hourCounts = {};
    existingTeams.forEach(team => {
      const hour = team.unavailable_times;
      if (hour !== null && hour !== undefined) {
        hourCounts[hour] = hourCounts[hour] || { count: 0, teams: [] };
        hourCounts[hour].count++;
        hourCounts[hour].teams.push({
          team_id: team.team_id,
          player1: {
            id: team.teams.player1_id,
            first_name: team.teams.player1.first_name,
            last_name: team.teams.player1.last_name
          },
          player2: {
            id: team.teams.player2_id,
            first_name: team.teams.player2.first_name,
            last_name: team.teams.player2.last_name
          }
        });
      }
    });

    const availabilityMap = {};
    tournament.time_slots.forEach(([start, end]) => {
      for (let hour = start; hour < end; hour++) {
        const hourData = hourCounts[hour] || { count: 0, teams: [] };
        availabilityMap[hour] = {
          total_capacity: cupoPorSlot,
          selected_count: hourData.count,
          available: hourData.count < cupoPorSlot,
          remaining_slots: Math.max(0, cupoPorSlot - hourData.count),
          teams: hourData.teams,
          percentage_full: Math.round((hourData.count / cupoPorSlot) * 100)
        };
      }
    });

    res.json({
      message: 'Available hours retrieved successfully',
      tournament_info: {
        category: category.name,
        tournament_type: tournament.tournament_type,
        max_teams: category.max_teams,
        courts_available: tournament.courts_available,
        days,
        horasPorDia,
        totalMatches,
        slotsDisponibles,
        cupoPorSlot
      },
      availability: availabilityMap
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function validateScheduleEndpoint(req, res) {
  try {
    const result = await validateTournamentSchedule(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getTournamentsByUserId(req, res) {
  const user_id = req.params.userId

  try {
    // First get the teams where the user is a player
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`)

    if (teamsError) throw teamsError

    if (!teams.length) {
      return res.json({
        message: 'User tournaments retrieved successfully',
        tournaments: []
      })
    }

    // Then get the tournaments for those teams
    const teamIds = teams.map(team => team.id)
    const { data, error } = await supabase
      .from('tournament_teams')
      .select(`
        tournaments (
          id,
          name
        )
      `)
      .in('team_id', teamIds)

    if (error) throw error

    // Transform the data to get just tournament id and name
    const tournaments = data.map(entry => ({
      id: entry.tournaments.id,
      name: entry.tournaments.name
    }))

    res.json({
      message: 'User tournaments retrieved successfully',
      tournaments
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ===================================================================
// PROGRAMACIÓN AUTOMÁTICA DE PARTIDOS
// ===================================================================

/**
 * Programa automáticamente los partidos de un torneo
 * Asigna horarios y canchas respetando restricciones de equipos
 * 
 * @param {Request} req - tournamentId en params
 * @param {Response} res - Partidos programados con horarios/canchas
 */
export const scheduleMatchesAutomatically = async (req, res) => {
  try {
    const { id: tournamentId } = req.params;
    
    console.log(`🏆 [PROGRAMACIÓN] Iniciando programación automática para torneo: ${tournamentId}`);
    
    // 1. Verificar que el torneo existe y obtener información
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id, name, start_date, end_date, courts_available, 
        tournament_type, group_time_slots, category_id
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({ 
        message: 'Torneo no encontrado',
        error: tournamentError?.message 
      });
    }

    // 2. Obtener todos los partidos pendientes de programación
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_matches')
      .select(`
        id, home_team_id, away_team_id, group_id, group_number
      `)
      .eq('tournament_id', tournamentId)
      .is('match_day', null)      // Solo partidos sin programar
      .is('start_time', null)
      .is('court_id', null);

    if (matchesError) {
      throw new Error(`Error obteniendo partidos: ${matchesError.message}`);
    }

    if (!matches || matches.length === 0) {
      return res.status(400).json({ 
        message: 'No hay partidos pendientes de programación para este torneo' 
      });
    }

    console.log(`📊 [PARTIDOS] Encontrados ${matches.length} partidos pendientes`);

    // 3. Obtener restricciones de todos los equipos participantes
    const teamIds = [...new Set([
      ...matches.map(m => m.home_team_id),
      ...matches.map(m => m.away_team_id)
    ])];

    const { data: teamRestrictions, error: restrictionsError } = await supabase
      .from('tournament_teams')
      .select('team_id, unavailable_times')
      .eq('tournament_id', tournamentId)
      .in('team_id', teamIds);

    if (restrictionsError) {
      throw new Error(`Error obteniendo restricciones: ${restrictionsError.message}`);
    }

    // 4. Crear mapa de restricciones para acceso rápido
    const restrictionsMap = new Map();
    teamRestrictions.forEach(tr => {
      restrictionsMap.set(tr.team_id, tr.unavailable_times);
    });

    // 5. Obtener time slots disponibles (solo días 1-2 para fase de grupos)
    const availableTimeSlots = tournament.group_time_slots.filter(slot => 
      slot.tournament_day === 1 || slot.tournament_day === 2
    );

    console.log(`⏰ [TIME SLOTS] ${availableTimeSlots.length} slots disponibles para programación`);

    // 6. Obtener UUIDs reales de las canchas disponibles
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name')
      .limit(tournament.courts_available);
    
    if (courtsError) {
      throw new Error(`Error obteniendo canchas: ${courtsError.message}`);
    }
    
    if (!courts || courts.length < tournament.courts_available) {
      throw new Error(`No hay suficientes canchas disponibles. Se requieren ${tournament.courts_available}, pero solo hay ${courts?.length || 0}`);
    }

    console.log(`🏟️ [CANCHAS] Usando ${courts.length} canchas: ${courts.map(c => c.name).join(', ')}`);

    // 7. Ejecutar algoritmo de programación inteligente
    const scheduledMatches = await scheduleMatchesIntelligently(
      matches,
      restrictionsMap,
      availableTimeSlots,
      courts,
      tournament.start_date
    );

    // 7. Actualizar partidos en la base de datos
    const updatePromises = scheduledMatches.map(match => 
      supabase
        .from('tournament_matches')
        .update({
          match_day: match.scheduled_date,
          start_time: match.scheduled_time,
          court_id: match.assigned_court
        })
        .eq('id', match.id)
    );

    const updateResults = await Promise.all(updatePromises);
    
    // Verificar errores en actualizaciones
    const updateErrors = updateResults.filter(result => result.error);
    if (updateErrors.length > 0) {
      console.error('❌ [ERROR] Errores al actualizar partidos:', updateErrors.map(e => e.error));
      console.error('❌ [ERROR] Ejemplo de datos enviados:', {
        match_day: scheduledMatches[0]?.scheduled_date,
        start_time: scheduledMatches[0]?.scheduled_time,
        court_id: scheduledMatches[0]?.assigned_court
      });
      throw new Error(`Error actualizando ${updateErrors.length} partidos: ${updateErrors[0].error.message}`);
    }

    console.log(`✅ [ÉXITO] ${scheduledMatches.length} partidos programados exitosamente`);

    // 8. Respuesta con estadísticas detalladas
    const programmedByDay = scheduledMatches.reduce((acc, match) => {
      const day = match.scheduled_date;
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const programmedByCourt = scheduledMatches.reduce((acc, match) => {
      const court = match.assigned_court;
      acc[court] = (acc[court] || 0) + 1;
      return acc;
    }, {});

    res.json({
      message: 'Partidos programados exitosamente',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        type: tournament.tournament_type
      },
      programming_summary: {
        total_matches: scheduledMatches.length,
        programming_period: {
          start_date: tournament.start_date,
          end_date: tournament.end_date
        },
        matches_by_day: programmedByDay,
        matches_by_court: programmedByCourt,
        available_courts: tournament.courts_available
      },
      scheduled_matches: scheduledMatches.map(match => ({
        id: match.id,
        group: match.group_name,
        teams: `${match.home_team_name} vs ${match.away_team_name}`,
        date: match.scheduled_date,
        time: match.scheduled_time,
        court: match.assigned_court,
        conflicts_avoided: match.conflicts_avoided || []
      }))
    });

  } catch (error) {
    console.error('❌ [ERROR PROGRAMACIÓN]:', error);
    res.status(500).json({ 
      message: 'Error en la programación automática',
      error: error.message 
    });
  }
};

/**
 * Algoritmo inteligente de programación de partidos
 * Asigna horarios y canchas evitando conflictos
 * 
 * @param {Array} matches - Partidos a programar
 * @param {Map} restrictionsMap - Mapa de restricciones por equipo
 * @param {Array} timeSlots - Time slots disponibles
 * @param {Array} courts - Array de objetos cancha con {id, name}
 * @param {string} startDate - Fecha inicio del torneo
 * @returns {Array} Partidos con programación asignada
 */
const scheduleMatchesIntelligently = async (matches, restrictionsMap, timeSlots, courts, startDate) => {
  const scheduledMatches = [];
  const courtSchedule = new Map(); // Tracking de ocupación por cancha/horario
  
  console.log(`🧠 [ALGORITMO] Iniciando programación inteligente:`);
  console.log(`   📋 Partidos a programar: ${matches.length}`);
  console.log(`   🏟️  Canchas disponibles: ${courts.length}`);
  console.log(`   ⏰ Time slots: ${timeSlots.length}`);

  // Generar horarios específicos para cada time slot
  const specificTimeSlots = generateSpecificTimeSlots(timeSlots, startDate);
  
  console.log(`   🕐 Horarios específicos generados: ${specificTimeSlots.length}`);

  // Ordenar partidos por prioridad (grupos más restringidos primero)
  const prioritizedMatches = prioritizeMatchesByRestrictions(matches, restrictionsMap);

  for (const match of prioritizedMatches) {
    const homeRestriction = restrictionsMap.get(match.home_team_id);
    const awayRestriction = restrictionsMap.get(match.away_team_id);
    
    console.log(`⚽ [PARTIDO] Programando ${match.id} (Grupo: ${match.group_number})`);
    console.log(`   🏠 Equipo local restricción: ${homeRestriction || 'Ninguna'}`);
    console.log(`   🏃 Equipo visitante restricción: ${awayRestriction || 'Ninguna'}`);

    // Encontrar horarios compatibles para ambos equipos
    const compatibleSlots = findCompatibleTimeSlots(
      specificTimeSlots, 
      homeRestriction, 
      awayRestriction
    );

    console.log(`   ✅ Horarios compatibles encontrados: ${compatibleSlots.length}`);

    // Buscar el mejor slot disponible considerando canchas
    let bestSlot = null;
    let assignedCourt = null;
    let conflictsAvoided = [];

    for (const slot of compatibleSlots) {
      // Verificar disponibilidad de canchas en este horario
      const availableCourt = findAvailableCourt(slot, courtSchedule, courts);
      
      if (availableCourt) {
        bestSlot = slot;
        assignedCourt = availableCourt;
        
        // Registrar conflictos evitados
        if (homeRestriction && slot.slot_id === homeRestriction) {
          conflictsAvoided.push(`Evitado conflicto equipo local: ${homeRestriction}`);
        }
        if (awayRestriction && slot.slot_id === awayRestriction) {
          conflictsAvoided.push(`Evitado conflicto equipo visitante: ${awayRestriction}`);
        }
        
        break;
      }
    }

    if (!bestSlot || !assignedCourt) {
      console.warn(`⚠️  [ADVERTENCIA] No se pudo programar partido ${match.id} - sin horarios/canchas disponibles`);
      continue;
    }

    // Marcar horario/cancha como ocupado
    const scheduleKey = `${bestSlot.date}_${bestSlot.time}_${assignedCourt.id}`;
    courtSchedule.set(scheduleKey, {
      match_id: match.id,
      date: bestSlot.date,
      time: bestSlot.time,
      court: assignedCourt
    });

    // Agregar a resultados
    scheduledMatches.push({
      id: match.id,
      group_name: `Grupo ${match.group_number}`,
      home_team_name: `Equipo ${match.home_team_id.slice(-6)}`, // Últimos 6 chars del UUID
      away_team_name: `Equipo ${match.away_team_id.slice(-6)}`,
      scheduled_date: bestSlot.date,
      scheduled_time: bestSlot.time,
      assigned_court: assignedCourt.id, // UUID de la cancha
      assigned_court_name: assignedCourt.name,
      slot_info: bestSlot,
      conflicts_avoided: conflictsAvoided
    });

    console.log(`   ✅ Programado: ${bestSlot.date} ${bestSlot.time} - Cancha ${assignedCourt.name}`);
  }

  console.log(`🎉 [RESULTADO] ${scheduledMatches.length}/${matches.length} partidos programados exitosamente`);
  
  return scheduledMatches;
};

/**
 * Genera horarios específicos (fecha + hora) para cada time slot
 */
const generateSpecificTimeSlots = (timeSlots, startDate) => {
  const specificSlots = [];
  const matchDurationMinutes = 45;
  
  for (const slot of timeSlots) {
    const slotDate = slot.date;
    const startHour = parseInt(slot.start.split(':')[0]);
    const endHour = parseInt(slot.end.split(':')[0]);
    
    // Manejar slots que cruzan medianoche
    const actualEndHour = endHour === 0 ? 24 : endHour;
    
    // Generar horarios cada 45 minutos
    for (let hour = startHour; hour < actualEndHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += matchDurationMinutes) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Verificar que no se salga del time slot
        const slotEndTime = actualEndHour * 60 + (slot.end.includes(':') ? parseInt(slot.end.split(':')[1]) : 0);
        const currentTime = hour * 60 + minutes;
        
        if (currentTime + matchDurationMinutes <= slotEndTime) {
          specificSlots.push({
            slot_id: slot.id,
            slot_label: slot.label,
            date: slotDate,
            time: timeStr,
            tournament_day: slot.tournament_day,
            priority: slot.tournament_day === 1 ? 1 : 2 // Priorizar día 1
          });
        }
      }
    }
  }
  
  // Ordenar por prioridad (día 1 primero) y luego por hora
  return specificSlots.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
};

/**
 * Prioriza partidos por restricciones (más restringidos primero)
 */
const prioritizeMatchesByRestrictions = (matches, restrictionsMap) => {
  return matches.sort((a, b) => {
    const aRestrictions = [
      restrictionsMap.get(a.home_team_id),
      restrictionsMap.get(a.away_team_id)
    ].filter(Boolean).length;
    
    const bRestrictions = [
      restrictionsMap.get(b.home_team_id),
      restrictionsMap.get(b.away_team_id)
    ].filter(Boolean).length;
    
    return bRestrictions - aRestrictions; // Más restricciones primero
  });
};

/**
 * Encuentra time slots compatibles para ambos equipos
 */
const findCompatibleTimeSlots = (specificSlots, homeRestriction, awayRestriction) => {
  return specificSlots.filter(slot => {
    // Verificar que no conflicte con restricción de equipo local
    if (homeRestriction && slot.slot_id === homeRestriction) {
      return false;
    }
    
    // Verificar que no conflicte con restricción de equipo visitante
    if (awayRestriction && slot.slot_id === awayRestriction) {
      return false;
    }
    
    return true;
  });
};

/**
 * Encuentra una cancha disponible para el horario específico
 */
const findAvailableCourt = (slot, courtSchedule, courts) => {
  for (const court of courts) {
    const scheduleKey = `${slot.date}_${slot.time}_${court.id}`;
    
    if (!courtSchedule.has(scheduleKey)) {
      return court; // Retorna el objeto completo {id, name}
    }
  }
  
  return null; // No hay canchas disponibles
};

/**
 * 🏆 OBTENER TABLA DE POSICIONES POR GRUPO (Sistema Híbrido)
 * Lee desde tournament_standings para máxima performance
 */
export async function getGroupStandings(req, res) {
  const { id: tournamentId } = req.params;
  
  try {
    console.log(`🏆 Obteniendo standings para torneo: ${tournamentId}`);
    
    // Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;
    
    // Obtener standings desde la tabla persistente con información de equipos
    const { data: standings, error: standingsError } = await supabase
      .from('tournament_standings')
      .select(`
        *,
        teams!team_id(
          id,
          player1:users!player1_id(first_name, last_name),
          player2:users!player2_id(first_name, last_name)
        ),
        tournament_groups!group_id(group_number)
      `)
      .eq('tournament_id', tournamentId)
      .order('group_id')
      .order('points', { ascending: false })
      .order('sets_won', { ascending: false })
      .order('games_won', { ascending: false });
      
    if (standingsError) throw standingsError;
    
    // Si no hay standings persistidos, calcular dinámicamente como fallback
    if (!standings || standings.length === 0) {
      console.log('⚠️ No hay standings persistidos, calculando dinámicamente...');
      return await calculateStandingsDynamically(req, res);
    }
    
    // Organizar standings por grupo
    const standingsByGroup = organizeStandingsByGroup(standings);
    
    // Generar resumen de clasificación
    const classificationSummary = generateClassificationSummaryFromStandings(standingsByGroup, tournament.tournament_type);
    
    res.json({
      message: 'Standings obtenidos exitosamente',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        category: tournament.categories?.name,
        type: tournament.tournament_type
      },
      standings: standingsByGroup,
      classification_summary: classificationSummary,
      data_source: 'persistent' // Indica que viene de la tabla
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo standings:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Organizar standings por grupo desde datos persistentes
 */
function organizeStandingsByGroup(standings) {
  const groups = {};
  
  standings.forEach(standing => {
    const groupNumber = standing.tournament_groups.group_number;
    
    if (!groups[groupNumber]) {
      groups[groupNumber] = {
        group_id: standing.group_id,
        group_number: groupNumber,
        teams: []
      };
    }
    
    // Calcular posición basada en el orden de la query
    const position = groups[groupNumber].teams.length + 1;
    
    groups[groupNumber].teams.push({
      position,
      team_id: standing.team_id,
      team_info: {
        player1: `${standing.teams.player1.first_name} ${standing.teams.player1.last_name}`,
        player2: `${standing.teams.player2.first_name} ${standing.teams.player2.last_name}`
      },
      points: standing.points,
      matches_played: standing.matches_played,
      matches_won: standing.matches_won,
      matches_lost: standing.matches_lost,
      sets_won: standing.sets_won,
      sets_lost: standing.sets_lost,
      sets_difference: standing.sets_won - standing.sets_lost,
      games_won: standing.games_won,
      games_lost: standing.games_lost,
      games_difference: standing.games_won - standing.games_lost
    });
  });
  
  return groups;
}

/**
 * Generar clasificación desde standings persistentes
 */
function generateClassificationSummaryFromStandings(standingsByGroup, tournamentType) {
  const summary = {
    qualified_teams: [],
    format: tournamentType,
    classification_rules: {}
  };
  
  if (tournamentType === 'NINE_PLAYERS') {
    summary.classification_rules = {
      qualified_per_group: 'Top 1 + mejor 2do lugar',
      total_qualified: 4,
      next_phase: 'Semifinales'
    };
    
    // Primeros de cada grupo
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const firstPlace = standingsByGroup[groupNumber].teams[0];
      if (firstPlace) {
        summary.qualified_teams.push({
          team_id: firstPlace.team_id,
          team_info: firstPlace.team_info,
          group: parseInt(groupNumber),
          position: 1,
          qualification_type: 'group_winner',
          stats: {
            matches_won: firstPlace.matches_won,
            sets_difference: firstPlace.sets_difference,
            games_difference: firstPlace.games_difference
          }
        });
      }
    });
    
    // Mejor segundo lugar
    const secondPlaces = [];
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const secondPlace = standingsByGroup[groupNumber].teams[1];
      if (secondPlace) {
        secondPlaces.push({
          ...secondPlace,
          group: parseInt(groupNumber)
        });
      }
    });
    
    // Ordenar segundos lugares
    secondPlaces.sort((a, b) => {
      if (a.matches_won !== b.matches_won) return b.matches_won - a.matches_won;
      if (a.sets_difference !== b.sets_difference) return b.sets_difference - a.sets_difference;
      return b.games_difference - a.games_difference;
    });
    
    if (secondPlaces[0]) {
      summary.qualified_teams.push({
        team_id: secondPlaces[0].team_id,
        team_info: secondPlaces[0].team_info,
        group: secondPlaces[0].group,
        position: 2,
        qualification_type: 'best_second',
        stats: {
          matches_won: secondPlaces[0].matches_won,
          sets_difference: secondPlaces[0].sets_difference,
          games_difference: secondPlaces[0].games_difference
        }
      });
    }
    
  } else if (tournamentType === 'TWELVE_PLAYERS') {
    summary.classification_rules = {
      qualified_per_group: 'Top 2',
      total_qualified: 8,
      next_phase: 'Cuartos de Final'
    };
    
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const group = standingsByGroup[groupNumber];
      [0, 1].forEach(position => {
        const team = group.teams[position];
        if (team) {
          summary.qualified_teams.push({
            team_id: team.team_id,
            team_info: team.team_info,
            group: parseInt(groupNumber),
            position: position + 1,
            qualification_type: position === 0 ? 'group_winner' : 'group_runner_up',
            stats: {
              matches_won: team.matches_won,
              sets_difference: team.sets_difference,
              games_difference: team.games_difference
            }
          });
        }
      });
    });
  }
  
  return summary;
}

/**
 * 🏆 GENERAR CUADRO ELIMINATORIO AUTOMÁTICAMENTE
 * Crea la fase eliminatoria basada en equipos clasificados
 */
export async function generateEliminationBracket(req, res) {
  const { id: tournamentId } = req.params;
  
  try {
    console.log(`🏆 Generando cuadro eliminatorio para torneo: ${tournamentId}`);
    
    // Obtener información del torneo directamente
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, categories(name)')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) throw tournamentError;
    
    // Obtener standings actuales  
    const standingsResponse = await getStandingsData(tournamentId);
    const { standings, classification_summary } = standingsResponse;
    
    if (!classification_summary.qualified_teams || classification_summary.qualified_teams.length === 0) {
      return res.status(400).json({ 
        message: 'No hay equipos clasificados aún. Complete la fase de grupos primero.' 
      });
    }
    
    // Generar estructura del bracket
    const bracket = generateBracketStructure(
      classification_summary.qualified_teams, 
      tournament.tournament_type
    );
    
    // Crear partidos eliminatorios en la BD
    const eliminationMatches = await createEliminationMatches(tournamentId, bracket, tournament);
    
    res.json({
      message: 'Cuadro eliminatorio generado exitosamente',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        type: tournament.tournament_type,
        category: tournament.categories?.name
      },
      bracket: bracket,
      elimination_matches: eliminationMatches,
      qualified_teams: classification_summary.qualified_teams
    });
    
  } catch (error) {
    console.error('❌ Error generando cuadro eliminatorio:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Obtener datos de standings (helper interno)
 */
async function getStandingsData(tournamentId) {
  // Simular el request para reutilizar la función getGroupStandings
  const mockReq = { params: { id: tournamentId } };
  let responseData = null;
  
  const mockRes = {
    json: (data) => {
      responseData = data;
      return data;
    },
    status: (code) => ({ 
      json: (data) => {
        responseData = { status: code, ...data };
        return responseData;
      } 
    })
  };
  
  await getGroupStandings(mockReq, mockRes);
  
  if (!responseData || responseData.status >= 400) {
    throw new Error('Error obteniendo standings del torneo');
  }
  
  return responseData;
}

/**
 * Generar estructura del bracket según formato
 */
function generateBracketStructure(qualifiedTeams, tournamentType) {
  if (tournamentType === 'NINE_PLAYERS') {
    return generateNinePlayersBracket(qualifiedTeams);
  } else if (tournamentType === 'TWELVE_PLAYERS') {
    return generateTwelvePlayersBracket(qualifiedTeams);
  } else {
    throw new Error(`Formato de torneo no soportado: ${tournamentType}`);
  }
}

/**
 * Bracket para 9 jugadores: 4 clasificados → Semifinales → Final
 */
function generateNinePlayersBracket(qualifiedTeams) {
  // Ordenar equipos: primeros de grupo primero, luego mejor segundo
  const groupWinners = qualifiedTeams.filter(t => t.qualification_type === 'group_winner');
  const bestSecond = qualifiedTeams.filter(t => t.qualification_type === 'best_second');
  
  const orderedTeams = [...groupWinners, ...bestSecond];
  
  return {
    format: 'NINE_PLAYERS',
    total_teams: 4,
    structure: {
      semifinals: [
        {
          match_id: 'SF1',
          round: 'semifinals',
          match_number: 1,
          team1: orderedTeams[0] || null, // Ganador Grupo 1
          team2: orderedTeams[3] || null, // Mejor 2do lugar
          winner: null,
          status: 'pending'
        },
        {
          match_id: 'SF2', 
          round: 'semifinals',
          match_number: 2,
          team1: orderedTeams[1] || null, // Ganador Grupo 2
          team2: orderedTeams[2] || null, // Ganador Grupo 3
          winner: null,
          status: 'pending'
        }
      ],
      final: [
        {
          match_id: 'F1',
          round: 'final',
          match_number: 1,
          team1: null, // Ganador SF1
          team2: null, // Ganador SF2
          winner: null,
          status: 'pending',
          depends_on: ['SF1', 'SF2']
        }
      ]
    },
    advancement_rules: {
      semifinals: 'Ganadores avanzan a Final',
      final: 'Ganador es Campeón'
    }
  };
}

/**
 * Bracket para 12 jugadores: 8 clasificados → Cuartos → Semis → Final
 */
function generateTwelvePlayersBracket(qualifiedTeams) {
  // Ordenar equipos: alternando ganadores y segundos de cada grupo
  const groupWinners = qualifiedTeams.filter(t => t.qualification_type === 'group_winner')
    .sort((a, b) => a.group - b.group);
  const groupRunners = qualifiedTeams.filter(t => t.qualification_type === 'group_runner_up')
    .sort((a, b) => a.group - b.group);
    
  // Emparejamiento: Ganador Grupo A vs Segundo Grupo B, etc.
  const matchups = [
    { team1: groupWinners[0], team2: groupRunners[1] }, // G1 vs 2do G2
    { team1: groupWinners[1], team2: groupRunners[0] }, // G2 vs 2do G1  
    { team1: groupWinners[2], team2: groupRunners[3] }, // G3 vs 2do G4
    { team1: groupWinners[3], team2: groupRunners[2] }  // G4 vs 2do G3
  ];


  
  return {
    format: 'TWELVE_PLAYERS',
    total_teams: 8,
    structure: {
      quarterfinals: matchups.map((matchup, index) => ({
        match_id: `QF${index + 1}`,
        round: 'quarterfinals',
        match_number: index + 1,
        team1: matchup.team1 || null,
        team2: matchup.team2 || null,
        winner: null,
        status: 'pending'
      })),
      semifinals: [
        {
          match_id: 'SF1',
          round: 'semifinals', 
          match_number: 1,
          team1: null, // Ganador QF1
          team2: null, // Ganador QF2
          winner: null,
          status: 'pending',
          depends_on: ['QF1', 'QF2']
        },
        {
          match_id: 'SF2',
          round: 'semifinals',
          match_number: 2, 
          team1: null, // Ganador QF3
          team2: null, // Ganador QF4
          winner: null,
          status: 'pending',
          depends_on: ['QF3', 'QF4']
        }
      ],
      final: [
        {
          match_id: 'F1',
          round: 'final',
          match_number: 1,
          team1: null, // Ganador SF1
          team2: null, // Ganador SF2
          winner: null,
          status: 'pending',
          depends_on: ['SF1', 'SF2']
        }
      ]
    },
    advancement_rules: {
      quarterfinals: 'Ganadores avanzan a Semifinales',
      semifinals: 'Ganadores avanzan a Final', 
      final: 'Ganador es Campeón'
    }
  };
}

/**
 * Crear partidos eliminatorios en la base de datos
 */
async function createEliminationMatches(tournamentId, bracket, tournament) {
  const matches = [];
  const startDate = new Date(tournament.end_date + 'T00:00:00'); // Día 3 del torneo
  
  // 1. Obtener todos los torneos del mismo evento (mismo nombre)
  const { data: eventTournaments, error: eventError } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      category_id,
      categories!inner (
        id,
        name,
        "order"
      )
    `)
    .eq('name', tournament.name);

  if (eventError) throw eventError;

  console.log('🎯 Torneos encontrados:', eventTournaments.map(t => ({
    id: t.id,
    category: t.categories?.name,
    order: t.categories?.order
  })));

  // Ordenar torneos por el orden de sus categorías (7ma → 6ta → 5ta → 4ta)
  eventTournaments.sort((a, b) => {
    const orderA = a.categories?.order || 99;
    const orderB = b.categories?.order || 99;
    return orderB - orderA; // Orden descendente (7ma primero)
  });

  console.log('📊 Torneos ordenados:', eventTournaments.map(t => ({
    id: t.id,
    category: t.categories?.name,
    order: t.categories?.order
  })));

  // 2. Obtener IDs de canchas
  const { data: courts, error: courtsError } = await supabase
    .from('courts')
    .select('id')
    .limit(tournament.courts_available);
    
  if (courtsError) throw courtsError;
  
  // 3. Encontrar la posición de este torneo en el orden de categorías
  const tournamentIndex = eventTournaments.findIndex(t => t.id === tournamentId);
  const MATCH_DURATION = 45; // minutos
  const START_HOUR = 8; // Empezar a las 8:00 AM
  
  // 4. Calcular horarios por ronda para todas las categorías
  const roundStartTimes = {
    quarterfinals: START_HOUR,                    // 7:00 AM
    semifinals: START_HOUR + 2.5,                 // 9:30 AM
    final: START_HOUR + 5                         // 12:00 PM
  };

  // Tiempo por categoría dentro de cada ronda
  const timePerCategory = MATCH_DURATION / 60; // 45 minutos en horas

  console.log('🎯 Configuración de horarios:');
  console.log('   ⏰ Hora inicio:', START_HOUR);
  console.log('   ⌛ Duración partido:', MATCH_DURATION, 'minutos');
  console.log('   📊 Tiempo por categoría:', timePerCategory, 'horas');
  console.log('   📅 Horarios base por ronda:', roundStartTimes);
  console.log('   🏆 Categoría actual:', tournament.categories?.name, '(orden:', tournament.categories?.order, ')');
  console.log('   📍 Índice en el evento:', tournamentIndex);

  // 5. Calcular el horario específico para esta categoría en cada ronda
  Object.keys(bracket.structure).forEach(round => {
    const roundBaseTime = roundStartTimes[round];
    const categoryStartTime = roundBaseTime + (tournamentIndex * timePerCategory);
    
    console.log(`🕒 Categoría ${tournament.categories?.name} (orden: ${tournament.categories?.order}) - ${round}:`);
    console.log(`   ⏰ Empezará a las ${Math.floor(categoryStartTime)}:${String(Math.round((categoryStartTime % 1) * 60)).padStart(2, '0')}`);
    console.log(`   📍 Base time: ${roundBaseTime}, Index: ${tournamentIndex}, Offset: ${timePerCategory}h`);
    
    bracket.structure[round].forEach((match, index) => {
      if (match.team1 && match.team2) {
        // Calcular hora y minutos exactos
        const matchTime = categoryStartTime;
        const hour = Math.floor(matchTime);
        const minutes = Math.round((matchTime % 1) * 60);
        
        const matchData = {
          tournament_id: tournamentId,
          home_team_id: match.team1.team_id,
          away_team_id: match.team2.team_id,
          match_day: startDate.toISOString().split('T')[0],
          start_time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`,
          court_id: courts[index % courts.length].id, // Distribuir en canchas disponibles
          status: 'scheduled',
          group_number: null,
          round: 'group',
          elimination_round: round,
          bracket_match_id: match.match_id,
          match_order: match.match_number,
          stage: round === 'quarterfinals' ? 'quarter_final' : round === 'semifinals' ? 'semi_final' : 'final'
        };
        
        matches.push(matchData);
      }
    });
  });
  
  // Insertar partidos en la BD
  if (matches.length > 0) {
    const { data: insertedMatches, error: insertError } = await supabase
      .from('tournament_matches')
      .insert(matches)
      .select();
      
    if (insertError) throw insertError;
    
    console.log(`✅ ${matches.length} partidos eliminatorios creados`);
    return insertedMatches;
  }
  
  return [];
}

/**
 * Fallback: calcular standings dinámicamente si no están persistidos
 */
async function calculateStandingsDynamically(req, res) {
  // Implementación original como fallback
  // ... (código anterior)
  const { id: tournamentId } = req.params;
  
  // Obtener partidos y calcular
  const { data: matches, error: matchesError } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('status', 'completed');
    
  if (matchesError) throw matchesError;
  
  const { data: groups, error: groupsError } = await supabase
    .from('tournament_groups')
    .select('*')
    .eq('tournament_id', tournamentId);
    
  if (groupsError) throw groupsError;
  
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*, categories(name)')
    .eq('id', tournamentId)
    .single();
    
  if (tournamentError) throw tournamentError;
  
  const standingsByGroup = calculateStandingsFromMatches(matches, groups, tournament.tournament_type);
  
  res.json({
    message: 'Standings calculados dinámicamente (fallback)',
    tournament: {
      id: tournament.id,
      name: tournament.name,
      category: tournament.categories?.name,
      type: tournament.tournament_type
    },
    standings: standingsByGroup,
    classification_summary: generateClassificationSummary(standingsByGroup, tournament.tournament_type),
    data_source: 'dynamic' // Indica que es cálculo dinámico
  });
}

/**
 * Calcular standings basado en partidos completados
 */
function calculateStandingsFromMatches(matches, groups, tournamentType) {
  const standingsByGroup = {};
  
  // Inicializar standings para cada grupo
  groups.forEach(group => {
    standingsByGroup[group.group_number] = {
      group_id: group.id,
      group_number: group.group_number,
      teams: []
    };
    
    // Inicializar cada equipo del grupo
    const teamIds = Array.isArray(group.teams) ? group.teams : JSON.parse(group.teams);
    teamIds.forEach(teamId => {
      standingsByGroup[group.group_number].teams.push({
        team_id: teamId,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        sets_won: 0,
        sets_lost: 0,
        games_won: 0,
        games_lost: 0,
        points: 0,
        classification_status: null
      });
    });
  });
  
  // Procesar cada partido completado
  matches.forEach(match => {
    const groupStanding = standingsByGroup[match.group_number];
    if (!groupStanding) return;
    
    const homeTeamStats = groupStanding.teams.find(t => t.team_id === match.home_team_id);
    const awayTeamStats = groupStanding.teams.find(t => t.team_id === match.away_team_id);
    
    if (!homeTeamStats || !awayTeamStats) return;
    
    // Calcular estadísticas del partido
    const matchStats = calculateMatchStats(match);
    
    // Actualizar estadísticas del equipo local
    homeTeamStats.matches_played++;
    homeTeamStats.sets_won += matchStats.home.sets_won;
    homeTeamStats.sets_lost += matchStats.home.sets_lost;
    homeTeamStats.games_won += matchStats.home.games_won;
    homeTeamStats.games_lost += matchStats.home.games_lost;
    
    // Actualizar estadísticas del equipo visitante
    awayTeamStats.matches_played++;
    awayTeamStats.sets_won += matchStats.away.sets_won;
    awayTeamStats.sets_lost += matchStats.away.sets_lost;
    awayTeamStats.games_won += matchStats.away.games_won;
    awayTeamStats.games_lost += matchStats.away.games_lost;
    
    // Determinar ganador y perdedor
    if (match.winner_team_id === match.home_team_id) {
      homeTeamStats.matches_won++;
      homeTeamStats.points += 3; // 3 puntos por ganar
      awayTeamStats.matches_lost++;
      awayTeamStats.points += 0; // 0 puntos por perder
    } else {
      awayTeamStats.matches_won++;
      awayTeamStats.points += 3; // 3 puntos por ganar
      homeTeamStats.matches_lost++;
      homeTeamStats.points += 0; // 0 puntos por perder
    }
  });
  
  // Ordenar equipos en cada grupo por criterios de clasificación
  Object.keys(standingsByGroup).forEach(groupNumber => {
    standingsByGroup[groupNumber].teams.sort((a, b) => {
      // 1. Partidos ganados (más importante)
      if (a.matches_won !== b.matches_won) {
        return b.matches_won - a.matches_won;
      }
      
      // 2. Diferencia de sets
      const aDiff = a.sets_won - a.sets_lost;
      const bDiff = b.sets_won - b.sets_lost;
      if (aDiff !== bDiff) {
        return bDiff - aDiff;
      }
      
      // 3. Diferencia de games
      const aGamesDiff = a.games_won - a.games_lost;
      const bGamesDiff = b.games_won - b.games_lost;
      return bGamesDiff - aGamesDiff;
    });
    
    // Asignar posiciones
    standingsByGroup[groupNumber].teams.forEach((team, index) => {
      team.position = index + 1;
    });
  });
  
  return standingsByGroup;
}

/**
 * Calcular estadísticas de un partido individual
 */
function calculateMatchStats(match) {
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
  
  // Contar sets ganados
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

/**
 * Generar resumen de clasificación
 */
function generateClassificationSummary(standingsByGroup, tournamentType) {
  const summary = {
    qualified_teams: [],
    format: tournamentType,
    classification_rules: {}
  };
  
  if (tournamentType === 'NINE_PLAYERS') {
    // Top 1 de cada grupo + mejor 2do = 4 equipos a semis
    summary.classification_rules = {
      qualified_per_group: 'Top 1 + mejor 2do lugar',
      total_qualified: 4,
      next_phase: 'Semifinales'
    };
    
    // Obtener primeros de cada grupo
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const firstPlace = standingsByGroup[groupNumber].teams[0];
      if (firstPlace) {
        summary.qualified_teams.push({
          team_id: firstPlace.team_id,
          group: parseInt(groupNumber),
          position: 1,
          qualification_type: 'group_winner'
        });
      }
    });
    
    // Encontrar mejor segundo lugar
    const secondPlaces = [];
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const secondPlace = standingsByGroup[groupNumber].teams[1];
      if (secondPlace) {
        secondPlaces.push({
          ...secondPlace,
          group: parseInt(groupNumber)
        });
      }
    });
    
    // Ordenar segundos lugares y tomar el mejor
    secondPlaces.sort((a, b) => {
      if (a.matches_won !== b.matches_won) return b.matches_won - a.matches_won;
      const aDiff = a.sets_won - a.sets_lost;
      const bDiff = b.sets_won - b.sets_lost;
      if (aDiff !== bDiff) return bDiff - aDiff;
      const aGamesDiff = a.games_won - a.games_lost;
      const bGamesDiff = b.games_won - b.games_lost;
      return bGamesDiff - aGamesDiff;
    });
    
    if (secondPlaces[0]) {
      summary.qualified_teams.push({
        team_id: secondPlaces[0].team_id,
        group: secondPlaces[0].group,
        position: 2,
        qualification_type: 'best_second'
      });
    }
    
  } else if (tournamentType === 'TWELVE_PLAYERS') {
    // Top 2 de cada grupo = 8 equipos a cuartos
    summary.classification_rules = {
      qualified_per_group: 'Top 2',
      total_qualified: 8,
      next_phase: 'Cuartos de Final'
    };
    
    Object.keys(standingsByGroup).forEach(groupNumber => {
      const group = standingsByGroup[groupNumber];
      [0, 1].forEach(position => {
        const team = group.teams[position];
        if (team) {
          summary.qualified_teams.push({
            team_id: team.team_id,
            group: parseInt(groupNumber),
            position: position + 1,
            qualification_type: position === 0 ? 'group_winner' : 'group_runner_up'
          });
        }
      });
    });
  }
  
  return summary;
} 