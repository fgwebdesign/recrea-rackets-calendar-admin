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
  
  // DÍA 3: Tercer día para fase de grupos (si hay al menos 3 días)
  if (durationDays >= 3) {
    const day3 = new Date(start);
    day3.setDate(day3.getDate() + 2);
    const day3Name = getDayName(day3);
    
    // Para 2 canchas con partidos de 45min, necesitamos más slots de grupos
    slots.push(
      {
        id: `day3_morning`,
        day: day3Name.toLowerCase(),
        start: '08:00',
        end: '12:00',
        label: `${day3Name} Mañana (8-12hs)`,
        tournament_day: 3,
        date: formatDateSafe(day3)
      },
      {
        id: `day3_afternoon`,
        day: day3Name.toLowerCase(),
        start: '13:00',
        end: '17:00',
        label: `${day3Name} Tarde (13-17hs)`,
        tournament_day: 3,
        date: formatDateSafe(day3)
      }
    );
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

// Modified main function to get courts first
export async function generateEliminationBracket(req, res) {
  const tournament_id = req.params.id

  try {
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single()

    if (tournamentError) return res.status(500).json({ message: tournamentError.message })
    if (!tournament) return res.status(404).json({ message: 'Torneo no encontrado' })

    // Get all teams in tournament with their constraints
    const { data: tournamentTeams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournament_id)

    if (teamsError) return res.status(500).json({ message: teamsError.message })
    if (tournamentTeams.length !== 8) {
      return res.status(400).json({ message: 'Torneo debe tener exactamente 8 equipos' })
    }

    // Generate all possible time slots
    const allTimeSlots = generateAvailableTimeSlots(
      tournament.time_slots,
      tournament.start_date,
      tournament.end_date
    )

    // Generate bracket matches
    const bracketMatches = generateBracketStructure(tournamentTeams)

    // Schedule matches with improved constraint checking
    const { scheduledMatches, unscheduledMatches } = await scheduleMatches(
      bracketMatches,
      allTimeSlots,
      tournament.courts_available,
      tournamentTeams
    )

    // Validate the schedule before saving
    const validationResult = validateSchedule(scheduledMatches, tournamentTeams, tournament.courts_available)
    if (!validationResult.isValid) {
      return res.status(400).json({
        message: 'Generated schedule violates constraints',
        errors: validationResult.errors
      })
    }

    // Insert scheduled matches
    const { error: insertError } = await supabase
      .from('matches')
      .insert(scheduledMatches)

    if (insertError) return res.status(500).json({ message: insertError.message })

    return res.json({
      message: 'Elimination bracket generated',
      scheduledMatches,
      unscheduledMatches: unscheduledMatches.length ? unscheduledMatches : null
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

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

function generateBracketStructure(teams) {
  const shuffledTeams = teams.sort(() => 0.5 - Math.random())
  const matches = []
  
  // Quarter-finals (Round 1)
  for (let i = 0; i < 8; i += 2) {
    matches.push({
      tournament_id: teams[0].tournament_id,
      home_team_id: shuffledTeams[i].team_id,
      away_team_id: shuffledTeams[i + 1].team_id,
      round: 1,
      status: 'pending'
    })
  }

  // Semi-finals (Round 2)
  for (let i = 0; i < 2; i++) {
    matches.push({
      tournament_id: teams[0].tournament_id,
      home_team_id: null,
      away_team_id: null,
      round: 2,
      status: 'pending'
    })
  }

  // Final (Round 3)
  matches.push({
    tournament_id: teams[0].tournament_id,
    home_team_id: null,
    away_team_id: null,
    round: 3,
    status: 'pending'
  })

  return matches
}

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