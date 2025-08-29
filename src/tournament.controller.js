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
    category_id, 
    start_date, 
    end_date, 
    courts_available, 
    time_slots,                
    group_time_slots,          
    tournament_type = 'NINE_PLAYERS',
    tournament_info = {}
  } = req.body;

  try {
    if (!name || !category_id || !start_date || !end_date) {
      return res.status(400).json({ message: 'Nombre, categoría, start_date y end_date son requeridos' });
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

    // ---- default group slots ----
    const HHMM = /^\d{2}:\d{2}$/;
    const allowedDays = ['friday', 'saturday'];

    let finalGroupSlots = group_time_slots;
    if (!Array.isArray(finalGroupSlots) || finalGroupSlots.length === 0) {
      finalGroupSlots = [
        { id: 'fri_night',    day: 'friday',   start: '18:00', end: '23:30', label: 'Viernes noche' },
        { id: 'sat_morning',  day: 'saturday', start: '09:00', end: '13:00', label: 'Sábado mañana' },
        { id: 'sat_afternoon',day: 'saturday', start: '14:00', end: '22:00', label: 'Sábado tarde' },
      ];
    }
    for (const s of finalGroupSlots) {
      if (!s.id || !allowedDays.includes(s.day) || !HHMM.test(s.start) || !HHMM.test(s.end)) {
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

    const newTournament = {
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
    };

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert(newTournament)
      .select()
      .single();

    if (tournamentError) return res.status(500).json({ message: tournamentError.message });

    return res.status(201).json({ message: 'Torneo creado exitosamente', torneo: tournament });
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
  const { userId1, userId2, unavailableHour, payment_status } = req.body;

  try {
    // ---------- 0) Validaciones básicas de body ----------
    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'userId1 y userId2 son requeridos' });
    }
    if (userId1 === userId2) {
      return res.status(400).json({ message: 'Los dos jugadores deben ser distintos' });
    }

    // un único número entero (una sola hora)
    const hourValue = Number.parseInt(unavailableHour, 10);
    if (!Number.isInteger(hourValue)) {
      return res.status(400).json({ message: 'unavailableHour debe ser un entero válido' });
    }

    const payMethod = (payment_status || '').toLowerCase();
    if (payMethod && payMethod !== 'mercadopago' && payMethod !== 'cash') {
      return res.status(400).json({ message: 'payment_status debe ser "mercadopago" o "cash"' });
    }

    // ---------- 1) Torneo ----------
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, name, category_id, courts_available, time_slots, tournament_type, max_teams')
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

    // ---------- 3) Hora válida dentro de time_slots ----------
    if (!Array.isArray(tournament.time_slots) || tournament.time_slots.length === 0) {
      return res.status(400).json({ message: 'Torneo sin time_slots configurados' });
    }
    const isValidHour = tournament.time_slots.some(([start, end]) => {
      return Number.isInteger(start) && Number.isInteger(end) && hourValue >= start && hourValue < end;
    });
    if (!isValidHour) {
      return res.status(400).json({ message: 'La hora elegida está fuera de los horarios del torneo' });
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

    // ---------- 6) Cupo por hora (aprox 1/3 del total) ----------
    const maxUnavailableTeams = Math.floor(maxTeams / 3);

    const { data: hourTeams, error: htErr } = await supabase
      .from('tournament_teams')
      .select('id, unavailable_times')
      .eq('tournament_id', tournament_id);

    if (htErr) {
      return res.status(500).json({ message: htErr.message });
    }

    const teamsUnavailableAtHour = (hourTeams || []).filter(tt => tt.unavailable_times === hourValue).length;
    if (teamsUnavailableAtHour >= maxUnavailableTeams) {
      return res.status(400).json({
        message: `Este horario ya no está disponible (máximo ${maxUnavailableTeams} equipos pueden seleccionarlo)`
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
        unavailable_times: hourValue,       // guardamos la hora como entero (tu uso actual)
        payment_status: 'pending',          // se actualizará cuando confirmes pago
        payment_reference: reference
      });

    if (joinErr) {
      return res.status(500).json({ message: joinErr.message });
    }

    // ---------- 9) Respuesta enriquecida ----------
    const updatedUnavailableCount = teamsUnavailableAtHour + 1;
    const hourAvailability = {
      selected_count: updatedUnavailableCount,
      total_capacity: maxUnavailableTeams,
      remaining_slots: Math.max(0, maxUnavailableTeams - updatedUnavailableCount),
      percentage_full: Math.round((updatedUnavailableCount / maxUnavailableTeams) * 100)
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
        hour: hourValue,
        availability: hourAvailability
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

// Configuración de formatos de torneo
const TOURNAMENT_FORMATS = {
  'NINE_PLAYERS': {
    groups_count: 3,
    teams_per_group: 3,
    teams_to_qualify: 2,
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 2  // Los 2 mejores primeros pasan directo
    }
  },
  'TWELVE_PLAYERS': {
    groups_count: 4,
    teams_per_group: 3,
    teams_to_qualify: 2,
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0  // Todos juegan cuartos
    }
  }
};

// Función para generar grupos
async function generateTournamentGroups(tournament, teams) {
  const format = TOURNAMENT_FORMATS[tournament.tournament_type];
  const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
  const groups = [];

  // Crear grupos
  for (let i = 0; i < format.groups_count; i++) {
    const groupTeams = shuffledTeams.slice(
      i * format.teams_per_group,
      (i + 1) * format.teams_per_group
    );

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
    await generateGroupMatches(tournament.id, group.id, groupTeams,  group.group_number );
  }

  return groups;
}

// --- NUEVO: wrapper HTTP para generar grupos ---
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
          player2_id
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
      .select('unavailable_times, team_id, teams ( player1_id, player2_id )')
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
          player1_id: team.teams.player1_id,
          player2_id: team.teams.player2_id
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