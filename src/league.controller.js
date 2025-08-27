import { supabase } from '../config/supabaseClient.js'
import { LEAGUE_STATUS, FIRST_SLOT, SECOND_SLOT, COURTS_PER_TIME } from '../config/index.config.js'
import { sendLeagueConfirmation, sendMatchesGeneratedNotification } from './invitation.controller.js'

const TIME_INCREMENT_MINUTES = 45;

export async function createLeague(req, res) {
  console.log('🚀 Starting createLeague with body:', req.body);
  const { 
    name, 
    categories, 
    start_date, 
    end_date, 
    courts_available = 2,
    time_slots, 
    team_size, 
    inscription_cost,
    image_url,
    description,
    category_days // Agregamos category_days
  } = req.body;

  console.log('📅 Category days received:', category_days);

  // Validaciones
  if (!name || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ 
      message: 'Nombre de la liga y al menos una categoría son requeridos' 
    });
  }
  if (!description) {
    return res.status(400).json({
      message: 'La descripción de la liga es requerida'
    });
  }
  if (courts_available < 1) {
    return res.status(400).json({
      message: 'El numero de canchas disponibles debe ser mayor a 0'
    });
  }
  if (team_size < 1) {
    return res.status(400).json({
      message: 'El numero de equipos registrables debe ser mayor a 0'
    });
  }
  if (!Array.isArray(time_slots)) {
    return res.status(400).json({
      message: 'Los horarios deben ser un array de rangos'
    });
  }
  for (const slot of time_slots) {
    if (!Array.isArray(slot) || slot.length !== 2 || !Number.isInteger(slot[0]) || !Number.isInteger(slot[1])) {
      return res.status(400).json({
        message: 'Cada rango debe ser un array de dos números enteros'
      });
    }
    const [start, end] = slot;
    if (start < 0 || start > 24 || end < 0 || end > 24 || end <= start) {
      return res.status(400).json({
        message: 'Los horarios deben ser válidos (inicio < fin, entre 0 y 24)'
      });
    }
  }
  if (typeof inscription_cost !== 'number' || isNaN(inscription_cost)) {
    return res.status(400).json({ message: 'El campo inscription_cost debe ser un número.' });
  }

  // Actualizar los play_day de las categorías
  if (category_days) {
    console.log('🔄 Updating play_days for categories:', category_days);
    for (const [categoryId, playDay] of Object.entries(category_days)) {
      console.log(`📌 Updating category ${categoryId} with play_day: ${playDay}`);
      
      const { data: currentCategory, error: getCategoryError } = await supabase
        .from('categories')
        .select('play_day')
        .eq('id', categoryId)
        .single();

      if (getCategoryError) {
        console.error('❌ Error getting current category:', getCategoryError);
      } else {
        console.log('📋 Current category play_day:', currentCategory?.play_day);
      }

      const { error: updateError } = await supabase
        .from('categories')
        .update({ play_day: playDay })
        .eq('id', categoryId);

      if (updateError) {
        console.error('❌ Error updating play_day for category:', categoryId, updateError);
        return res.status(500).json({ message: 'Error actualizando días de juego de las categorías' });
      }

      // Verificar la actualización
      const { data: updatedCategory, error: verifyError } = await supabase
        .from('categories')
        .select('play_day')
        .eq('id', categoryId)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying update:', verifyError);
      } else {
        console.log('✅ Category updated successfully. New play_day:', updatedCategory?.play_day);
      }
    }
  } else {
    console.log('⚠️ No category_days provided in request');
  }

  // Crear una liga por cada categoría
  const leaguesToCreate = categories.map(category_id => ({
    name,
    category_id,
    start_date,
    end_date,
    status: LEAGUE_STATUS.INSCRIBIENDO,
    courts_available,
    team_size,
    time_slots,
    inscription_cost,
    image_url: image_url || null, // Aseguramos que image_url sea null si no viene
    description
  }));

  const { data, error } = await supabase
    .from('leagues')
    .insert(leaguesToCreate)
    .select(); // Removemos la selección de categoría ya que no es necesaria

  if (error) {
    console.error('❌ Error creating leagues:', error);
    return res.status(500).json({ message: error.message });
  }

  console.log('✅ Leagues created successfully:', data);

  res.status(201).json({
    message: 'Ligas creadas exitosamente',
    ligas: data
  });
}

export async function getLeaguesByUser(req, res) {
  const user_id = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`);

  if (teamsError) {
    return res.status(500).json({ message: teamsError.message });
  }
  if (!teams.length) {
    return res.status(200).json({ leagues: [], page, pageSize, total: 0 });
  }

  const teamIds = teams.map(team => team.id);

  const { data: leagueTeams, error: leagueTeamsError } = await supabase
    .from('league_teams')
    .select('league_id, alternate_player')
    .in('team_id', teamIds);

  if (leagueTeamsError) {
    return res.status(500).json({ message: leagueTeamsError.message });
  }
  if (!leagueTeams.length) {
    return res.status(200).json({ leagues: [], page, pageSize, total: 0 });
  }

  const leagueIds = leagueTeams.map(lt => lt.league_id);

  const { data: leagues, error: leaguesError, count } = await supabase
    .from('leagues')
    .select('*', { count: 'exact' })
    .in('id', leagueIds)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (leaguesError) {
    return res.status(500).json({ message: leaguesError.message });
  }

  res.status(200).json({
    leagues,
    page,
    pageSize,
    total: count
  });
}

export async function getAllLeagues(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Primero obtenemos las ligas
  const { data, error, count } = await supabase
    .from('leagues')
    .select('*, category:category_id(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  // Obtener la cantidad de equipos registrados por liga
  const leagueIds = data.map(l => l.id);
  const { data: teamsData, error: teamsError } = await supabase
    .from('league_teams')
    .select('league_id, team_id, alternate_player')
    .in('league_id', leagueIds);

  if (teamsError) {
    return res.status(500).json({ message: teamsError.message });
  }

  // Contar equipos por liga
  const teamsCount = teamsData.reduce((acc, team) => {
    acc[team.league_id] = (acc[team.league_id] || 0) + 1;
    return acc;
  }, {});

  // Agregar el conteo a cada liga
  const leaguesWithRegistered = data.map(league => ({
    ...league,
    registeredTeams: teamsCount[league.id] || 0
  }));

  res.status(200).json({
    leagues: leaguesWithRegistered,
    page,
    pageSize,
    total: count
  });
}

export async function getLeagueById(req, res) {
  const { id } = req.params;

  // Obtener la información básica de la liga
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select(`
      *,
      category:category_id (
        id,
        name,
        play_day,
        play_time,
        min_teams,
        max_teams,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (leagueError) {
    return res.status(500).json({ message: leagueError.message });
  }
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  // Obtener los equipos registrados y sus jugadores
  const { data: leagueTeams, error: teamsError } = await supabase
    .from('league_teams')
    .select(`
      id,
      inscription_paid,
      alternate_player,
      team:team_id (
        id,
        player1:player1_id (
          id,
          first_name,
          last_name
        ),
        player2:player2_id (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('league_id', id);

  if (teamsError) {
    return res.status(500).json({ message: teamsError.message });
  }

  // Formatear los equipos para una mejor respuesta
  const registeredTeams = leagueTeams.map(lt => ({
    id: lt.team.id,
    league_team_id: lt.id,
    inscription_paid: lt.inscription_paid,
    alternate_player: lt.alternate_player,
    player1: {
      id: lt.team.player1.id,
      name: `${lt.team.player1.first_name} ${lt.team.player1.last_name}`
    },
    player2: {
      id: lt.team.player2.id,
      name: `${lt.team.player2.first_name} ${lt.team.player2.last_name}`
    }
  }));

  const response = {
    ...league,
    registeredTeams: registeredTeams.length,
    teams: registeredTeams
  };

  res.status(200).json(response);
}

export async function joinLeague(req, res) {
  const { league_id, player1_id, player2_id, alternate_player } = req.body;

  // Validar que se proporcionen ambos jugadores y el suplente
  if (!player1_id || !player2_id) {
    return res.status(400).json({ message: 'Se requieren ambos jugadores para crear o encontrar el equipo' });
  }

  if (!alternate_player || alternate_player.trim() === '') {
    return res.status(400).json({ message: 'El nombre del jugador suplente es obligatorio' });
  }

  // Validar que los jugadores sean diferentes
  if (player1_id === player2_id) {
    return res.status(400).json({ message: 'Los jugadores deben ser diferentes' });
  }

  console.log('To get League');
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, status, team_size')
    .eq('id', league_id)
    .single();

  if (leagueError || !league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }
  if (league.status !== LEAGUE_STATUS.INSCRIBIENDO) {
    return res.status(400).json({ message: 'La liga no está abierta para inscripciones' });
  }

  console.log('To Find or Create Team');
  // Buscar si el equipo ya existe (considerando ambos órdenes de jugadores)
  let team = null;
  const { data: existingTeam, error: findTeamError } = await supabase
    .from('teams')
    .select('id')
    .or(`and(player1_id.eq.${player1_id},player2_id.eq.${player2_id}),and(player1_id.eq.${player2_id},player2_id.eq.${player1_id})`)
    .single();

  if (findTeamError && findTeamError.code !== 'PGRST116') { // PGRST116 means No rows found
    console.error('Error finding team:', findTeamError);
    return res.status(500).json({ message: 'Error buscando equipo existente' });
  }

  if (existingTeam) {
    console.log('Existing team found:', existingTeam);
    team = existingTeam;
  } else {
    console.log('No existing team found, creating new team');
    // Crear el equipo si no existe
    const { data: newTeam, error: createTeamError } = await supabase
      .from('teams')
      .insert({
        player1_id,
        player2_id
      })
      .select()
      .single();

    if (createTeamError) {
      console.error('Error creating team:', createTeamError);
      return res.status(500).json({ message: 'Error creando el equipo' });
    }
    team = newTeam;
    console.log('New team created:', team);
  }

  console.log('To Verify team in league');
  // Verificar si el equipo (encontrado o creado) ya está inscrito en la liga
  const { data: existingLeagueTeam, error: existingLeagueTeamError } = await supabase
    .from('league_teams')
    .select('id')
    .eq('league_id', league_id)
    .eq('team_id', team.id)
    .maybeSingle();

  if (existingLeagueTeamError) {
    console.error('Error validating previous inscription:', existingLeagueTeamError);
    return res.status(500).json({ message: 'Error validando inscripción previa' });
  }
  if (existingLeagueTeam) {
    return res.status(400).json({ message: 'El equipo ya está inscrito en esta liga' });
  }

  console.log('To count teams');
  // Contar equipos actuales en la liga
  const { count: currentCount, error: countError } = await supabase
    .from('league_teams')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', league_id);

  if (countError) {
    console.error('Error counting enrolled teams:', countError);
    return res.status(500).json({ message: 'Error contando equipos inscritos' });
  }
  if (currentCount >= league.team_size) {
    return res.status(400).json({ message: 'La liga ya está llena' });
  }

  console.log('To insert league team');
  // Inscribir el equipo en la liga
  const { data: leagueTeam, error: joinError } = await supabase
    .from('league_teams')
    .insert({ 
      league_id, 
      team_id: team.id,
      inscription_paid: false,
      alternate_player: alternate_player || null
    })
    .select()
    .single();

  if (joinError) {
    console.error('Error enrolling team:', joinError);
    return res.status(500).json({ message: 'Error inscribiendo el equipo' });
  }

  console.log('To update state');
  // Si la liga se llena, actualizar su estado
  if (currentCount + 1 === league.team_size) {
    await supabase
      .from('leagues')
      .update({ status: LEAGUE_STATUS.ACTIVA })
      .eq('id', league_id);
  }

  // Enviar emails de confirmación
  try {
    const { data: playersData, error: playersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', [player1_id, player2_id]);

    if (!playersError && playersData && playersData.length === 2) {
      // Obtener datos completos de la liga
      const { data: leagueData, error: leagueDataError } = await supabase
        .from('leagues')
        .select(`
          *,
          category:category_id (
            name,
            play_day
          )
        `)
        .eq('id', league_id)
        .single();

      if (!leagueDataError && leagueData) {
        // Preparar datos para el email
        const player1 = playersData.find(p => p.id === player1_id);
        const player2 = playersData.find(p => p.id === player2_id);

        if (player1 && player2 && player1.email && player2.email) {
          // Crear objeto req simulado para la función de email
          const emailReq = {
            body: {
              league_id,
              player1_email: player1.email,
              player2_email: player2.email,
              player1_name: `${player1.first_name} ${player1.last_name}`,
              player2_name: `${player2.first_name} ${player2.last_name}`
            }
          };

          // Crear objeto res simulado
          const emailRes = {
            status: () => ({ json: () => {} }),
            json: () => {}
          };

          // Enviar email de confirmación (fire and forget)
          sendLeagueConfirmation(emailReq, emailRes).catch(emailError => {
            console.error('Error sending confirmation email:', emailError);
            // No bloquear la respuesta principal si falla el email
          });
        }
      }
    }
  } catch (emailError) {
    console.error('Error processing confirmation email:', emailError);
    // No bloquear la respuesta principal si falla el email
  }

  res.status(201).json({
    message: 'Equipo encontrado/creado e inscrito exitosamente en la liga',
    team,
    league_team: leagueTeam
  });
}

export async function removeTeamFromLeague(req, res) {
  const { league_id, team_id } = req.body;

  // Validaciones básicas
  if (!league_id || !team_id) {
    return res.status(400).json({
      message: 'Se requiere league_id y team_id'
    });
  }

  // 1. Verificar que la liga existe y obtener su estado
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('status')
    .eq('id', league_id)
    .single();

  if (leagueError) {
    return res.status(500).json({ message: leagueError.message });
  }
  if (!league) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  // 2. Verificar que el equipo está inscrito en la liga
  const { data: leagueTeam, error: leagueTeamError } = await supabase
    .from('league_teams')
    .select('id')
    .eq('league_id', league_id)
    .eq('team_id', team_id)
    .single();

  if (leagueTeamError) {
    return res.status(500).json({ message: leagueTeamError.message });
  }
  if (!leagueTeam) {
    return res.status(404).json({ message: 'Equipo no encontrado en la liga' });
  }

  // 3. Verificar si el equipo tiene partidos jugados
  const { data: matches, error: matchesError } = await supabase
    .from('league_matches')
    .select('id, status')
    .or(`league_team1_id.eq.${leagueTeam.id},league_team2_id.eq.${leagueTeam.id}`)
    .eq('status', 'COMPLETED');

  if (matchesError) {
    return res.status(500).json({ message: matchesError.message });
  }

  if (matches && matches.length > 0) {
    return res.status(400).json({
      message: 'No se puede eliminar el equipo porque ya tiene partidos jugados'
    });
  }

  // 4. Eliminar los partidos programados del equipo
  const { error: deleteMatchesError } = await supabase
    .from('league_matches')
    .delete()
    .or(`league_team1_id.eq.${leagueTeam.id},league_team2_id.eq.${leagueTeam.id}`)
    .eq('status', 'SCHEDULED');

  if (deleteMatchesError) {
    return res.status(500).json({ message: deleteMatchesError.message });
  }

  // 5. Eliminar el standing del equipo si existe
  const { error: deleteStandingError } = await supabase
    .from('league_standings')
    .delete()
    .eq('league_id', league_id)
    .eq('team_id', team_id);

  if (deleteStandingError) {
    return res.status(500).json({ message: deleteStandingError.message });
  }

  // 6. Eliminar la inscripción del equipo
  const { error: deleteLeagueTeamError } = await supabase
    .from('league_teams')
    .delete()
    .eq('id', leagueTeam.id);

  if (deleteLeagueTeamError) {
    return res.status(500).json({ message: deleteLeagueTeamError.message });
  }

  // 7. Si la liga estaba activa, volver a "Inscribiendo"
  if (league.status === LEAGUE_STATUS.ACTIVA) {
    const { error: updateLeagueError } = await supabase
      .from('leagues')
      .update({ status: LEAGUE_STATUS.INSCRIBIENDO })
      .eq('id', league_id);

    if (updateLeagueError) {
      console.error('Error actualizando estado de la liga:', updateLeagueError);
      // No retornamos error ya que la operación principal se completó
    }
  }

  res.status(200).json({
    message: 'Equipo removido exitosamente de la liga'
  });
}

export async function generateStandings(req, res) {
  console.log('Starting generateStandings with params:', { league_id: req.params.uuid, body: req.body });
  const league_id = req.params.uuid;
  const rounds = parseInt(req.body.rounds) || 1;

  if (rounds !== 1 && rounds !== 2) {
    console.log('Invalid rounds value:', rounds);
    return res.status(400).json({ message: 'El número de rondas debe ser 1 o 2' });
  }

  // Verificar si ya existen standings para esta liga
  console.log('Checking for existing standings...');
  const { data: existingStandings, error: checkStandingsError } = await supabase
    .from('league_standings')
    .select('id')
    .eq('league_id', league_id)
    .limit(1);

  if (checkStandingsError) {
    console.error('Error checking existing standings:', checkStandingsError);
    return res.status(500).json({ message: checkStandingsError.message });
  }

  if (existingStandings && existingStandings.length > 0) {
    console.log('Standings already exist for this league');
    return res.status(409).json({ message: 'Los standings y partidos para esta liga ya han sido generados.' });
  }

  console.log('Fetching league and category information...');
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('*, category:category_id(*)')
    .eq('id', league_id)
    .single();

  if (leagueError || !league) {
    console.error('Error fetching league:', leagueError);
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  // Obtener las canchas disponibles
  console.log('Fetching available courts...');
  const { data: courts, error: courtsError } = await supabase
    .from('courts')
    .select('id, name')
    .order('name');

  if (courtsError) {
    console.error('Error fetching courts:', courtsError);
    return res.status(500).json({ message: 'Error al obtener las canchas disponibles' });
  }

  if (!courts || courts.length === 0) {
    console.error('No courts available for scheduling matches');
    return res.status(400).json({ message: 'No hay canchas disponibles para programar los partidos' });
  }

  console.log(`🎾 Found ${courts.length} available courts for scheduling:`, courts.map(c => `${c.name} (${c.id})`));

  // Obtener los equipos de la liga
  const { data: leagueTeams, error: leagueTeamsError } = await supabase
    .from('league_teams')
    .select('id, team_id')
    .eq('league_id', league_id);

  if (leagueTeamsError) {
    console.error('Error fetching league teams:', leagueTeamsError);
    return res.status(500).json({ message: 'Error al obtener los equipos de la liga' });
  }

  if (!leagueTeams || leagueTeams.length === 0) {
    return res.status(400).json({ message: 'No hay equipos registrados en la liga' });
  }

  // Crear el mapeo de IDs de equipo a league_team_id
  const leagueTeamIdMap = new Map(leagueTeams.map(lt => [lt.team_id, lt.id]));
  const teamIds = leagueTeams.map(lt => lt.team_id);

  // Generar los standings primero
  console.log('Generating standings...');
  const standings = leagueTeams.map(leagueTeam => ({
    league_id,
    team_id: leagueTeam.team_id,
    points: 0,
    wins: 0,
    losses: 0,
    games_played: 0,
    games_won: 0,
    games_lost: 0,
    sets_won: 0,
    sets_lost: 0,
    sets_difference: 0
  }));

  // Insertar los standings
  console.log('Inserting standings...');
  const { error: standingsError } = await supabase
    .from('league_standings')
    .insert(standings);

  if (standingsError) {
    console.error('Error creating standings:', standingsError);
    return res.status(500).json({ message: standingsError.message });
  }

  // Generar el calendario usando Round Robin
  const schedule = generateRoundRobinSchedule(teamIds);
  const playDay = league.category.play_day;

  // Preparar las fechas y horarios
  let currentMatchDate = getNextDayOccurrence(league.start_date, league.category.play_day, false);
  let currentMatchTime = formatTime(league.category.play_time);
  const matches = [];
  let matchNumber = 1;
  let courtIndex = 0;
  let isFirstRound = true; // Flag para identificar la primera ronda

  console.log('Initial match date and time:', { currentMatchDate, currentMatchTime });

  // Generar los partidos para cada ronda
  schedule.forEach((round, roundIndex) => {
    console.log(`Processing round ${roundIndex + 1}`);
    let matchesInCurrentDate = 0;

    round.forEach(([team1Id, team2Id], matchIndex) => {
      const leagueTeam1Id = leagueTeamIdMap.get(team1Id);
      const leagueTeam2Id = leagueTeamIdMap.get(team2Id);

      // Si ya hemos programado 4 partidos en la fecha actual, avanzar al siguiente día
      if (matchesInCurrentDate >= COURTS_PER_TIME * 2) {
        // Para la primera ronda, usar frecuencia semanal, para las siguientes usar la frecuencia de la liga
        currentMatchDate = getNextDayOccurrence(
          currentMatchDate, 
          playDay, 
          true,
          league.frequency || 'quincenal' // Siempre usar la frecuencia de la liga
        );
        matchesInCurrentDate = 0;
        courtIndex = 0; // Reiniciar el índice de canchas para el nuevo día
      }

      // Calcular el índice global del partido para determinar el horario
      const globalMatchIndex = team1Id; // Usamos el ID del equipo para mantener consistencia

      // Asignar cancha alternando entre las disponibles y según la ronda
      const courtIndexForRound = (roundIndex % 2 === 0) ? 
        courtIndex % courts.length :
        (courtIndex + 1) % courts.length;
      const court = courts[courtIndexForRound];
      const matchTime = addHoursToTime(currentMatchTime, globalMatchIndex, roundIndex);
      
      console.log(`🏸 Match scheduling details:
        - Round: ${roundIndex + 1}
        - Date: ${currentMatchDate}
        - Time: ${matchTime}
        - Court: ${court.name} (${court.id})
        - Teams: ${team1Id} vs ${team2Id}
      `);

      matches.push({
        league_id,
        league_team1_id: leagueTeam1Id,
        league_team2_id: leagueTeam2Id,
        team1_sets1_won: 0,
        team2_sets1_won: 0,
        team1_sets2_won: 0,
        team2_sets2_won: 0,
        team1_tie1_won: 0,
        team2_tie1_won: 0,
        team1_tie2_won: 0,
        team2_tie2_won: 0,
        team1_tie3_won: 0,
        team2_tie3_won: 0,
        winner_league_team_id: null,
        match_date: `${currentMatchDate}T${matchTime}`,
        status: 'SCHEDULED',
        walkover: false,
        walkover_team_id: null,
        match_number: matchNumber,
        category_id: league.category_id,
        court_id: court.id
      });

      // Incrementar el índice de cancha solo cuando pasamos al siguiente horario
      if ((matchesInCurrentDate + 1) % COURTS_PER_TIME === 0) {
        courtIndex = 0; // Reiniciar para el siguiente horario
        console.log('⌛ Moving to next time slot, resetting court index');
      } else {
        courtIndex++;
        console.log(`🔄 Moving to next court (index: ${courtIndex})`);
      }

      matchesInCurrentDate++;
    });

    // Al final de cada ronda, avanzar al siguiente día y resetear el contador
    currentMatchDate = getNextDayOccurrence(
      currentMatchDate, 
      playDay, 
      true,
      'quincenal'
    );
    matchNumber++;
  });

  console.log(`✅ Total matches generated: ${matches.length}`);
  console.log('📊 Court assignment summary:');
  const courtUsage = courts.reduce((acc, court) => {
    acc[court.name] = matches.filter(m => m.court_id === court.id).length;
    return acc;
  }, {});
  console.log(courtUsage);

  console.log('Inserting matches into database...');
  const { error: matchesError } = await supabase
    .from('league_matches')
    .insert(matches);

  if (matchesError) {
    console.error('Error creating matches:', matchesError);
    return res.status(500).json({ message: matchesError.message });
  }

  console.log('Updating league status...');
  const { error: updateError } = await supabase
    .from('leagues')
    .update({ status: LEAGUE_STATUS.ACTIVA })
    .eq('id', league_id);

  if (updateError) {
    console.error('Error updating league status:', updateError);
    return res.status(500).json({ message: updateError.message });
  }

  // ⚠️ DESARROLLO: Comentar esta sección durante pruebas locales para evitar envío de emails
  // ℹ️ PRODUCCIÓN: Asegurarse de que esta sección esté descomentada
  console.log('👥 Fetching players for notifications...');
  const uniqueTeamIds = [...new Set(teamIds)];
  console.log('📋 Unique team IDs:', uniqueTeamIds);
  
  const { data: teams, error: teamsQueryError } = await supabase
    .from('teams')
    .select('player1_id, player2_id')
    .in('id', uniqueTeamIds);

  if (teamsQueryError) {
    console.error('❌ Error fetching teams for notifications:', teamsQueryError);
    // No bloqueamos la respuesta principal si falla la obtención de jugadores
  } else {
    // Obtener IDs únicos de jugadores
    const playerIds = [...new Set(teams.flatMap(team => [team.player1_id, team.player2_id]))]; // Corregido: team2_id -> team.player2_id
    console.log('👤 Found player IDs:', playerIds);
    
    // Obtener información de los jugadores
    const { data: players, error: playersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', playerIds);

    if (!playersError && players) {
      console.log(`✅ Found ${players.length} players to notify`);
      console.log('📧 Player details:', players.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        email: p.email
      })));

      // Crear objeto req simulado para la función de email
      const emailReq = {
        body: {
          league_id,
          players
        }
      };

      // Crear objeto res simulado que captura y loguea las respuestas
      const emailRes = {
        status: (code) => {
          console.log(`📫 Email notification response status: ${code}`);
          return {
            json: (data) => {
              console.log('📬 Email notification response:', data);
            }
          };
        },
        json: (data) => {
          console.log('📬 Email notification direct response:', data);
        }
      };

      console.log('📤 Attempting to send notifications...');
      try {
        await sendMatchesGeneratedNotification(emailReq, emailRes);
        console.log('✅ Notifications sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending matches generated notifications:', emailError);
        // No bloquear la respuesta principal si falla el email
      }
    } else {
      console.error('❌ Error fetching player details:', playersError);
    }
  }

  res.status(201).json({
    message: 'Standings y partidos generados exitosamente',
    data: {
      standings,
      matches
    }
  });
}

export async function getStandings(req, res) {
  const league_id = req.params.league_id;

  try {
    console.log('Fetching standings for league:', league_id);

    const { data, error } = await supabase
      .from('league_standings')
      .select(`
        *,
        team:team_id (
          id,
          player1:player1_id (
            id,
            first_name,
            last_name
          ),
          player2:player2_id (
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('league_id', league_id)
      .order('points', { ascending: false });

    if (error) {
      console.error('Error fetching standings:', error);
      return res.status(500).json({ message: error.message });
    }

    console.log('Raw standings data:', data);

    // Asegurarnos de que los datos incluyan la información del equipo
    const formattedStandings = data.map(standing => ({
      ...standing,
      team: standing.team || null
    }));

    console.log('Formatted standings:', formattedStandings);

    res.status(200).json({ standings: formattedStandings });
  } catch (error) {
    console.error('Error in getStandings:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getStandingById(req, res) {
  const id = req.params.id;

  const { data, error } = await supabase
    .from('league_standings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  if (!data) {
    return res.status(404).json({ message: 'Standing no encontrado' });
  }

  res.status(200).json({ standing: data });
}

export async function updateMatchResult(req, res) {
  const match_id = req.params.id;
  const { 
    team1_sets1_won, 
    team2_sets1_won,
    team1_sets2_won,
    team2_sets2_won,
    team1_tie1_won,
    team2_tie1_won,
    team1_tie2_won,
    team2_tie2_won,
    team1_tie3_won,
    team2_tie3_won
  } = req.body;

  // Validar que los sets sean obligatorios
  if (typeof team1_sets1_won !== 'number' || typeof team2_sets1_won !== 'number' ||
      typeof team1_sets2_won !== 'number' || typeof team2_sets2_won !== 'number') {
    return res.status(400).json({ 
      message: 'Los campos team1_sets1_won, team2_sets1_won, team1_sets2_won y team2_sets2_won son obligatorios y deben ser números' 
    });
  }

  // Validar que los sets sean números positivos
  if (team1_sets1_won < 0 || team2_sets1_won < 0 || team1_sets2_won < 0 || team2_sets2_won < 0) {
    return res.status(400).json({ message: 'Los sets deben ser números positivos' });
  }

  // Establecer valores por defecto para los ties si no vienen
  const ties = {
    team1_tie1_won: team1_tie1_won ?? 0,
    team2_tie1_won: team2_tie1_won ?? 0,
    team1_tie2_won: team1_tie2_won ?? 0,
    team2_tie2_won: team2_tie2_won ?? 0,
    team1_tie3_won: team1_tie3_won ?? 0,
    team2_tie3_won: team2_tie3_won ?? 0
  };

  // Validar que los ties sean números positivos si vienen
  for (const [key, value] of Object.entries(ties)) {
    if (typeof value !== 'number' || value < 0) {
      return res.status(400).json({ message: `El campo ${key} debe ser un número positivo` });
    }
  }

  const { data: match, error: matchError } = await supabase
    .from('league_matches')
    .select('*')
    .eq('id', match_id)
    .single();

  if (matchError || !match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  console.log(match);
  
  // Validar que los equipos sean diferentes
  if (match.league_team1_id === match.league_team2_id) {
    return res.status(400).json({ message: 'Los equipos no pueden ser iguales' });
  }

  // Obtener los team_ids a partir de los league_team_ids
  const { data: leagueTeam1, error: leagueTeam1Error } = await supabase
    .from('league_teams')
    .select('team_id')
    .eq('id', match.league_team1_id)
    .single();

  const { data: leagueTeam2, error: leagueTeam2Error } = await supabase
    .from('league_teams')
    .select('team_id')
    .eq('id', match.league_team2_id)
    .single();

  if (leagueTeam1Error || leagueTeam2Error) {
    return res.status(500).json({ message: 'Error al obtener los equipos de la liga' });
  }

  // Calcular el ganador basado en los sets
  let winnerLeagueTeamId = null;
  const team1TotalSets = team1_sets1_won + team1_sets2_won;
  const team2TotalSets = team2_sets1_won + team2_sets2_won;

  if (team1TotalSets > team2TotalSets) {
    winnerLeagueTeamId = match.league_team1_id;
  } else if (team2TotalSets > team1TotalSets) {
    winnerLeagueTeamId = match.league_team2_id;
  } else { // Si los sets son iguales, decide por tie3
    if (ties.team1_tie3_won > ties.team2_tie3_won) {
      winnerLeagueTeamId = match.league_team1_id;
    } else if (ties.team2_tie3_won > ties.team1_tie3_won) {
      winnerLeagueTeamId = match.league_team2_id;
    }
    // Si tie3 también es igual, winnerLeagueTeamId permanece null
  }

  const { error: updateMatchError } = await supabase
    .from('league_matches')
    .update({
      team1_sets1_won,
      team2_sets1_won,
      team1_sets2_won,
      team2_sets2_won,
      ...ties,
      winner_league_team_id: winnerLeagueTeamId,
      status: 'COMPLETED'
    })
    .eq('id', match_id);

  if (updateMatchError) {
    return res.status(500).json({ message: updateMatchError.message });
  }

  // Actualizar los standings usando los team_ids correctos
  const homeTeamStanding = await supabase
    .from('league_standings')
    .select('*')
    .eq('league_id', match.league_id)
    .eq('team_id', leagueTeam1.team_id)
    .single();

  const awayTeamStanding = await supabase
    .from('league_standings')
    .select('*')
    .eq('league_id', match.league_id)
    .eq('team_id', leagueTeam2.team_id)
    .single();

  console.log('Home Team Standing:', homeTeamStanding);
  console.log('Away Team Standing:', awayTeamStanding);
  
  if (homeTeamStanding.error || awayTeamStanding.error) {
    return res.status(500).json({ message: 'Error al obtener standings' });
  }

  const currentHomeStanding = homeTeamStanding.data;
  const currentAwayStanding = awayTeamStanding.data;

  const homeTeamUpdate = {
    games_played: currentHomeStanding.games_played + 1,
    sets_won: currentHomeStanding.sets_won + team1TotalSets,
    sets_lost: currentHomeStanding.sets_lost + team2TotalSets,
    sets_difference: currentHomeStanding.sets_difference + (team1TotalSets - team2TotalSets)
  };

  if (team1TotalSets > team2TotalSets) {
    // Victoria 2-0 o 2-1
    homeTeamUpdate.wins = currentHomeStanding.wins + 1;
    homeTeamUpdate.points = currentHomeStanding.points + 2;
    homeTeamUpdate.games_won = currentHomeStanding.games_won + 1;
  } else if (team2TotalSets > team1TotalSets) { // team2 gana en sets
    homeTeamUpdate.losses = currentHomeStanding.losses + 1;
    homeTeamUpdate.games_lost = currentHomeStanding.games_lost + 1;
    // Si ganó al menos un set, suma 1 punto
    if (team1TotalSets > 0) {
      homeTeamUpdate.points = currentHomeStanding.points + 1;
    }
  } else { // sets iguales, se decide por tie3
    if (ties.team1_tie3_won > ties.team2_tie3_won) {
      homeTeamUpdate.wins = currentHomeStanding.wins + 1;
      homeTeamUpdate.points = currentHomeStanding.points + 2;
      homeTeamUpdate.games_won = currentHomeStanding.games_won + 1;
    } else {
      homeTeamUpdate.losses = currentHomeStanding.losses + 1;
      homeTeamUpdate.games_lost = currentHomeStanding.games_lost + 1;
      // Al llegar al tie3, ya ganó un set, así que suma 1 punto
      homeTeamUpdate.points = currentHomeStanding.points + 1;
    }
  }

  const awayTeamUpdate = {
    games_played: currentAwayStanding.games_played + 1,
    sets_won: currentAwayStanding.sets_won + team2TotalSets,
    sets_lost: currentAwayStanding.sets_lost + team1TotalSets,
    sets_difference: currentAwayStanding.sets_difference + (team2TotalSets - team1TotalSets)
  };

  if (team2TotalSets > team1TotalSets) {
    // Victoria 2-0 o 2-1
    awayTeamUpdate.wins = currentAwayStanding.wins + 1;
    awayTeamUpdate.points = currentAwayStanding.points + 2;
    awayTeamUpdate.games_won = currentAwayStanding.games_won + 1;
  } else if (team1TotalSets > team2TotalSets) { // team1 gana en sets
    awayTeamUpdate.losses = currentAwayStanding.losses + 1;
    awayTeamUpdate.games_lost = currentAwayStanding.games_lost + 1;
    // Si ganó al menos un set, suma 1 punto
    if (team2TotalSets > 0) {
      awayTeamUpdate.points = currentAwayStanding.points + 1;
    }
  } else { // sets iguales, se decide por tie3
    if (ties.team2_tie3_won > ties.team1_tie3_won) {
      awayTeamUpdate.wins = currentAwayStanding.wins + 1;
      awayTeamUpdate.points = currentAwayStanding.points + 2;
      awayTeamUpdate.games_won = currentAwayStanding.games_won + 1;
    } else {
      awayTeamUpdate.losses = currentAwayStanding.losses + 1;
      awayTeamUpdate.games_lost = currentAwayStanding.games_lost + 1;
      // Al llegar al tie3, ya ganó un set, así que suma 1 punto
      awayTeamUpdate.points = currentAwayStanding.points + 1;
    }
  }

  const { error: homeUpdateError } = await supabase
    .from('league_standings')
    .update(homeTeamUpdate)
    .eq('id', currentHomeStanding.id);

  const { error: awayUpdateError } = await supabase
    .from('league_standings')
    .update(awayTeamUpdate)
    .eq('id', currentAwayStanding.id);

    console.log(homeUpdateError);
    console.log(awayUpdateError);
    
  if (homeUpdateError || awayUpdateError) {
    return res.status(500).json({ message: 'Error al actualizar standings' });
  }

  res.status(200).json({
    message: 'Resultado del partido actualizado exitosamente',
    match: { 
      ...match, 
      team1_sets1_won,
      team2_sets1_won,
      team1_sets2_won,
      team2_sets2_won,
      ...ties,
      winner_league_team_id: winnerLeagueTeamId, 
      status: 'COMPLETED'
    }
  });
}

export async function updateMatchSchedule(req, res) {
  const match_id = req.params.id;
  const { date, time, status, court_id } = req.body;

  const { data: match, error: matchError } = await supabase
    .from('league_matches')
    .select('*')
    .eq('id', match_id)
    .single();

  if (matchError || !match) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  if (match.status === 'completed') {
    return res.status(400).json({ message: 'No se puede modificar un partido con resultado registrado' });
    
  }

  if (date && !isValidDate(date)) {
    return res.status(400).json({ message: 'Fecha inválida' });
  }

  if (time && !isValidTime(time)) {
    return res.status(400).json({ message: 'Hora inválida' });
  }

  if (court_id && date && time) {
    const { data: conflicts, error: conflictError } = await supabase
      .from('league_matches')
      .select('id')
      .eq('court_id', court_id)
      .eq('date', date)
      .eq('time', time)
      .neq('id', match_id);

    if (conflictError) {
      return res.status(500).json({ message: conflictError.message });
    }

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Conflicto de horario: ya existe un partido programado en la misma cancha, fecha y hora' });
    }
  }

  const { error: updateError } = await supabase
    .from('league_matches')
    .update({
      date: date || match.date,
      time: time || match.time,
      status: status || match.status,
      court_id: court_id || match.court_id
    })
    .eq('id', match_id);

  if (updateError) {
    return res.status(500).json({ message: updateError.message });
  }

  res.status(200).json({
    message: 'Horario del partido actualizado exitosamente',
    match: { ...match, date, time, status, court_id }
  });
}

function isValidDate(date) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
}

function isValidTime(time) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

export async function getMatchesByUserId(req, res) {
  const user_id = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // 1. Obtener los equipos del usuario
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`);

    if (teamsError) {
      return res.status(500).json({ message: teamsError.message });
    }

    if (!teams.length) {
      return res.status(200).json({ 
        matches: [], 
        page, 
        pageSize, 
        total: 0 
      });
    }

    // 2. Obtener los league_teams asociados a estos equipos
    const teamIds = teams.map(team => team.id);
    const { data: leagueTeams, error: leagueTeamsError } = await supabase
      .from('league_teams')
      .select('id')
      .in('team_id', teamIds);

    if (leagueTeamsError) {
      return res.status(500).json({ message: leagueTeamsError.message });
    }

    if (!leagueTeams.length) {
      return res.status(200).json({ 
        matches: [], 
        page, 
        pageSize, 
        total: 0 
      });
    }

    // 3. Obtener los partidos donde el usuario participa
    const leagueTeamIds = leagueTeams.map(lt => lt.id);
    const { data: matches, error: matchesError, count } = await supabase
      .from('league_matches')
      .select(`
        *,
        league:league_id (
          id,
          name,
          status
        ),
        team1:league_team1_id (
          team:team_id (
            player1:player1_id (
              id,
              first_name,
              last_name
            ),
            player2:player2_id (
              id,
              first_name,
              last_name
            )
          )
        ),
        team2:league_team2_id (
          team:team_id (
            player1:player1_id (
              id,
              first_name,
              last_name
            ),
            player2:player2_id (
              id,
              first_name,
              last_name
            )
          )
        ),
        team1_sets1_won,
        team2_sets1_won,
        team1_sets2_won,
        team2_sets2_won,
        team1_tie1_won,
        team2_tie1_won,
        team1_tie2_won,
        team2_tie2_won,
        team1_tie3_won,
        team2_tie3_won,
        winner_league_team_id,
        status,
        walkover,
        walkover_team_id,
        match_number,
        court:court_id (
          id,
          name
        )
      `)
      .or(`league_team1_id.in.(${leagueTeamIds.join(',')}),league_team2_id.in.(${leagueTeamIds.join(',')})`)
      .order('match_date', { ascending: false })
      .range(from, to);

    if (matchesError) {
      return res.status(500).json({ message: matchesError.message });
    }

    res.status(200).json({
      matches,
      page,
      pageSize,
      total: count
    });

  } catch (error) {
    console.error('Error getting user matches:', error);
    res.status(500).json({ message: 'Error al obtener los partidos del usuario' });
  }
}

// Funciones auxiliares para el manejo de fechas y horas
function getNextDayOccurrence(currentDateStr, targetDayName, findNext = false, frequency = 'quincenal') {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDayIndex = dayNames.indexOf(targetDayName.toLowerCase());
  
  if (targetDayIndex === -1) {
    console.error('Invalid day name:', targetDayName);
    throw new Error('Invalid day name: ' + targetDayName);
  }
  
  const date = new Date(currentDateStr);
  date.setHours(date.getHours() - 3); // Ajustar por la zona horaria de Uruguay (UTC-3)
  
  if (findNext) {
    // Primero agregamos los días según la frecuencia
    let daysToAdd;
    switch(frequency.toLowerCase()) {
      case 'semanal':
        daysToAdd = 7;
        break;
      case 'quincenal':
        daysToAdd = 14;
        break;
      case 'mensual':
        daysToAdd = 28; // Cambiamos a 28 para mantener mejor la consistencia
        break;
      default:
        daysToAdd = 14;
    }
    
    // Agregamos los días base según la frecuencia
    date.setDate(date.getDate() + daysToAdd);
    
    // Ajustamos al día correcto de la semana
    const currentDay = date.getDay();
    let adjustment = targetDayIndex - currentDay;
    
    // Si el ajuste es negativo, avanzamos a la próxima semana
    if (adjustment < 0) {
      adjustment += 7;
    }
    
    // Aplicamos el ajuste para llegar al día correcto
    date.setDate(date.getDate() + adjustment);
  } else {
    const currentDay = date.getDay();
    let daysUntilTarget = targetDayIndex - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    date.setDate(date.getDate() + daysUntilTarget);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export async function getMatchesByRound(req, res) {
  const { leagueId } = req.params;
  const round = parseInt(req.query.round) || 1;

  const { data: matches, error } = await supabase
    .from('league_matches')
    .select(`
      *,
      team1:league_team1_id (
        team:team_id (
          player1:player1_id (
            id,
            first_name,
            last_name
          ),
          player2:player2_id (
            id,
            first_name,
            last_name
          )
        )
      ),
      team2:league_team2_id (
        team:team_id (
          player1:player1_id (
            id,
            first_name,
            last_name
          ),
          player2:player2_id (
            id,
            first_name,
            last_name
          )
        )
      )
    `)
    .eq('league_id', leagueId)
    .eq('match_number', round)
    .order('match_date', { ascending: true });

  if (error) {
    console.error('Error getting matches:', error);
    return res.status(500).json({ message: error.message });
  }

  // Formatear los nombres de los equipos
  const formattedMatches = matches.map(match => ({
    ...match,
    team1: `${match.team1.team.player1.first_name} ${match.team1.team.player1.last_name} - ${match.team1.team.player2.first_name} ${match.team1.team.player2.last_name}`,
    team2: `${match.team2.team.player1.first_name} ${match.team2.team.player1.last_name} - ${match.team2.team.player2.first_name} ${match.team2.team.player2.last_name}`
  }));

  res.status(200).json({
    matches: formattedMatches
  });
}

export async function getMatchesByLeague(req, res) {
  const { leagueId } = req.params;

  try {
    console.log('Getting matches for league:', leagueId);

    let query = supabase
      .from('league_matches')
      .select(`
        *,
        category:category_id (
          id,
          name,
          play_day,
          play_time
        ),
        court:court_id (
          id,
          name
        ),
        team1:league_team1_id (
          team:team_id (
            player1:player1_id (
              id,
              first_name,
              last_name
            ),
            player2:player2_id (
              id,
              first_name,
              last_name
            )
          )
        ),
        team2:league_team2_id (
          team:team_id (
            player1:player1_id (
              id,
              first_name,
              last_name
            ),
            player2:player2_id (
              id,
              first_name,
              last_name
            )
          )
        )
      `);

    if (leagueId && leagueId !== 'all') {
      query = query.eq('league_id', leagueId);
    }

    // Ordenar primero por match_number (ronda) y luego por fecha
    query = query
      .order('match_number', { ascending: true })
      .order('match_date', { ascending: true });

    const { data: matches, error } = await query;

    if (error) {
      console.error('Error fetching matches:', error);
      return res.status(500).json({ message: error.message });
    }

    if (!matches) {
      return res.status(200).json({
        completed: [],
        pending: [],
        total: 0
      });
    }

    // Formatear los nombres de los equipos con manejo seguro de nulos
    const formattedMatches = matches.map(match => {
      const formatTeamName = (teamData) => {
        if (!teamData?.team?.player1 || !teamData?.team?.player2) {
          return 'Equipo no disponible';
        }
        const { player1, player2 } = teamData.team;
        return `${player1.first_name || ''} ${player1.last_name || ''} - ${player2.first_name || ''} ${player2.last_name || ''}`.trim();
      };

      return {
        ...match,
        category_name: match.category?.name || 'Categoría no disponible',
        court_name: match.court?.name || 'Sin asignar',
        team1: formatTeamName(match.team1),
        team2: formatTeamName(match.team2)
      };
    });

    // Separar los partidos por estado
    const completedMatches = formattedMatches.filter(match => match.status === 'COMPLETED');
    const pendingMatches = formattedMatches.filter(match => match.status === 'SCHEDULED');

    console.log('Completed matches:', completedMatches?.length);
    console.log('Pending matches:', pendingMatches?.length);

    return res.status(200).json({
      completed: completedMatches,
      pending: pendingMatches,
      total: formattedMatches.length
    });

  } catch (error) {
    console.error('Error processing matches:', error);
    return res.status(500).json({ 
      message: 'Error al procesar los partidos de la liga',
      error: error.message 
    });
  }
}

export async function updateInscriptionPaymentStatus(req, res) {
  const { league_team_id, inscription_paid } = req.body;

  // Validar que se proporcionen los campos requeridos
  if (league_team_id === undefined || inscription_paid === undefined) {
    return res.status(400).json({
      message: 'Se requiere league_team_id y inscription_paid'
    });
  }

  // Validar que inscription_paid sea booleano
  if (typeof inscription_paid !== 'boolean') {
    return res.status(400).json({
      message: 'El campo inscription_paid debe ser un valor booleano'
    });
  }

  // Verificar que el league_team existe
  const { data: leagueTeam, error: leagueTeamError } = await supabase
    .from('league_teams')
    .select('id')
    .eq('id', league_team_id)
    .single();

  if (leagueTeamError) {
    return res.status(500).json({ message: leagueTeamError.message });
  }
  if (!leagueTeam) {
    return res.status(404).json({ message: 'Equipo no encontrado en la liga' });
  }

  // Actualizar el estado de pago
  const { error: updateError } = await supabase
    .from('league_teams')
    .update({ inscription_paid })
    .eq('id', league_team_id);

  if (updateError) {
    return res.status(500).json({ message: updateError.message });
  }

  res.status(200).json({
    message: `Estado de pago ${inscription_paid ? 'confirmado' : 'pendiente'} exitosamente`,
    league_team_id,
    inscription_paid
  });
}

export async function updateLeague(req, res) {
  const league_id = req.params.id;
  const { 
    name, 
    description, 
    inscription_cost
  } = req.body;

  // Verificar que la liga existe
  const { data: existingLeague, error: leagueError } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', league_id)
    .single();

  if (leagueError || !existingLeague) {
    return res.status(404).json({ message: 'Liga no encontrada' });
  }

  // Validaciones de campos
  const updates = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ message: 'El nombre no puede estar vacío' });
    }
    updates.name = name;
  }

  if (description !== undefined) {
    if (!description.trim()) {
      return res.status(400).json({ message: 'La descripción no puede estar vacía' });
    }
    updates.description = description;
  }

  if (inscription_cost !== undefined) {
    if (typeof inscription_cost !== 'number' || isNaN(inscription_cost) || inscription_cost < 0) {
      return res.status(400).json({ message: 'El costo de inscripción debe ser un número válido y no negativo' });
    }
    updates.inscription_cost = inscription_cost;
  }

  // Si no hay campos para actualizar
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ 
      message: 'No se proporcionaron campos válidos para actualizar' 
    });
  }

  // Realizar la actualización
  const { data: updatedLeague, error: updateError } = await supabase
    .from('leagues')
    .update(updates)
    .eq('id', league_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating league:', updateError);
    return res.status(500).json({ message: 'Error al actualizar la liga' });
  }

  res.status(200).json({
    message: 'Liga actualizada exitosamente',
    league: updatedLeague
  });
}

// Función para formatear la hora
function formatTime(timeStr) {
  // Siempre empezar con el primer turno (22:30)
  return FIRST_SLOT;
}

function addHoursToTime(timeStr, matchIndex, roundIndex) {
  // Determinar el slot basado en la combinación de la ronda y el índice del partido
  const isEvenMatch = matchIndex % 2 === 0;
  const isEvenRound = roundIndex % 2 === 0;
  
  // Si la ronda es par, invertimos el patrón del horario
  if (isEvenRound) {
    return isEvenMatch ? SECOND_SLOT : FIRST_SLOT;
  } else {
    return isEvenMatch ? FIRST_SLOT : SECOND_SLOT;
  }
}

// Implementación del algoritmo Round Robin
function generateRoundRobinSchedule(teams) {
  const n = teams.length;
  if (n % 2 !== 0) {
    teams.push(null); // Añadir un equipo "fantasma" si el número es impar
  }

  const rounds = [];
  const numRounds = n - 1;
  const halfSize = n / 2;

  for (let round = 0; round < numRounds; round++) {
    const roundMatches = [];
    for (let i = 0; i < halfSize; i++) {
      const team1 = teams[i];
      const team2 = teams[n - 1 - i];
      if (team1 !== null && team2 !== null) {
        roundMatches.push([team1, team2]);
      }
    }
    rounds.push(roundMatches);

    // Rotar los equipos (excepto el primero)
    teams.splice(1, 0, teams.pop());
  }

  return rounds;
}
