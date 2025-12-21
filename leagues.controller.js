import { supabase } from '../config/supabaseClient.js'
import { LEAGUE_STATUS } from '../config/index.config.js'
import { sendLeagueConfirmation, sendMatchesGeneratedNotification } from './invitation.controller.js'

export async function createLeague(req, res) {
  console.log('🚀 Starting createLeague with body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Raw frequency value:', req.body.frequency, 'Type:', typeof req.body.frequency);
  
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
    category_days, // Agregamos category_days
    // ====== NUEVO: Multi-sede support ======
    // Formato: [{ venue_id: 'uuid', court_ids: ['uuid1', 'uuid2'], is_primary: true/false }]
    venues = [],
    // ====== NUEVO: Flexibilidad de horarios ======
    // match_times: Array de horarios específicos, ej: ['22:30', '23:15', '21:45']
    match_times = ['22:30', '23:15'],
    // courts_per_time_slot: Cuántas canchas se usan en paralelo por horario
    courts_per_time_slot = 2,
    // league_type: 'round_robin' | 'knockout' | 'groups' | 'custom'
    league_type = 'round_robin',
    // rounds: 1 = solo ida, 2 = ida y vuelta
    rounds = 1,
    // frequency: 'semanal' | 'quincenal' | 'mensual'
    frequency = 'quincenal'
  } = req.body;
  
  // Normalizar frequency a minúsculas
  const normalizedFrequency = frequency ? frequency.toLowerCase() : 'quincenal';
  console.log('🔄 Normalized frequency:', normalizedFrequency, 'from:', frequency);

  console.log('📅 Category days received:', category_days);
  console.log('🏢 Venues received:', venues?.length || 0, venues);
  console.log('⏰ Match times received:', match_times);
  console.log('🎾 Courts per time slot:', courts_per_time_slot);
  console.log('🏆 League type:', league_type, 'Rounds:', rounds);

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

  // ===== VALIDACIÓN DE HORARIOS FLEXIBLES =====
  if (match_times && !Array.isArray(match_times)) {
    return res.status(400).json({ message: 'match_times debe ser un array de horarios (ej: ["22:30", "23:15"])' });
  }
  if (match_times && match_times.length === 0) {
    return res.status(400).json({ message: 'Debe haber al menos un horario en match_times' });
  }
  // Validar formato de horarios (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  for (const time of match_times) {
    if (!timeRegex.test(time)) {
      return res.status(400).json({ message: `Horario inválido: ${time}. Formato esperado: HH:MM (ej: 22:30)` });
    }
  }
  
  if (courts_per_time_slot < 1) {
    return res.status(400).json({ message: 'courts_per_time_slot debe ser al menos 1' });
  }
  
  const validLeagueTypes = ['round_robin', 'knockout', 'groups', 'custom'];
  if (!validLeagueTypes.includes(league_type)) {
    return res.status(400).json({ message: `league_type inválido. Opciones: ${validLeagueTypes.join(', ')}` });
  }
  
  if (rounds < 1 || rounds > 2) {
    return res.status(400).json({ message: 'rounds debe ser 1 (solo ida) o 2 (ida y vuelta)' });
  }

  const validFrequencies = ['semanal', 'quincenal', 'mensual'];
  console.log('🔍 Validating frequency:', { received: normalizedFrequency, valid: validFrequencies });
  if (!validFrequencies.includes(normalizedFrequency)) {
    console.error('❌ Invalid frequency:', normalizedFrequency, 'Valid options:', validFrequencies);
    return res.status(400).json({ message: `frequency inválida. Opciones: ${validFrequencies.join(', ')}. Recibido: ${normalizedFrequency}` });
  }

  console.log('⏰ Configuración de horarios:', { match_times, courts_per_time_slot, league_type, rounds, frequency: normalizedFrequency });

  // ===== VALIDACIÓN DE MULTI-SEDE =====
  let validatedVenues = [];
  let totalCourtsFromVenues = 0;
  
  if (venues && Array.isArray(venues) && venues.length > 0) {
    console.log('🏢 Validando configuración multi-sede:', venues.length, 'sedes');
    
    for (const venueConfig of venues) {
      // Validar estructura del objeto venue
      if (!venueConfig.venue_id) {
        return res.status(400).json({ 
          message: 'Cada sede debe tener un venue_id' 
        });
      }
      
      if (!venueConfig.court_ids || !Array.isArray(venueConfig.court_ids) || venueConfig.court_ids.length === 0) {
        return res.status(400).json({ 
          message: `La sede ${venueConfig.venue_id} debe tener al menos una cancha seleccionada` 
        });
      }
      
      // Validar que la sede existe
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, is_active')
        .eq('id', venueConfig.venue_id)
        .single();
      
      if (venueError || !venueData) {
        return res.status(400).json({ 
          message: `Sede no encontrada: ${venueConfig.venue_id}` 
        });
      }
      
      if (!venueData.is_active) {
        return res.status(400).json({ 
          message: `La sede "${venueData.name}" no está activa` 
        });
      }
      
      // Validar que las canchas existen y pertenecen a esta sede
      const { data: courtsData, error: courtsError } = await supabase
        .from('courts')
        .select('id, name, venue_id')
        .in('id', venueConfig.court_ids);
      
      if (courtsError) {
        return res.status(500).json({ 
          message: 'Error validando canchas: ' + courtsError.message 
        });
      }
      
      if (courtsData.length !== venueConfig.court_ids.length) {
        const foundIds = courtsData.map(c => c.id);
        const notFoundIds = venueConfig.court_ids.filter(id => !foundIds.includes(id));
        return res.status(400).json({ 
          message: `Canchas no encontradas: ${notFoundIds.join(', ')}` 
        });
      }
      
      // Validar que las canchas pertenecen a la sede especificada
      const wrongVenueCourts = courtsData.filter(c => c.venue_id !== venueConfig.venue_id);
      if (wrongVenueCourts.length > 0) {
        return res.status(400).json({ 
          message: `Las siguientes canchas no pertenecen a la sede "${venueData.name}": ${wrongVenueCourts.map(c => c.name).join(', ')}` 
        });
      }
      
      validatedVenues.push({
        venue_id: venueConfig.venue_id,
        venue_name: venueData.name,
        court_ids: venueConfig.court_ids,
        courts_count: venueConfig.court_ids.length,
        is_primary: venueConfig.is_primary || false
      });
      
      totalCourtsFromVenues += venueConfig.court_ids.length;
      console.log(`✅ Sede "${venueData.name}" validada con ${venueConfig.court_ids.length} canchas`);
    }
    
    // Asegurar que solo haya una sede primaria
    const primaryVenues = validatedVenues.filter(v => v.is_primary);
    if (primaryVenues.length === 0) {
      // Si no hay ninguna primaria, marcar la primera como primaria
      validatedVenues[0].is_primary = true;
    } else if (primaryVenues.length > 1) {
      return res.status(400).json({ 
        message: 'Solo puede haber una sede principal por liga' 
      });
    }
    
    console.log(`🎯 Multi-sede validado: ${validatedVenues.length} sedes, ${totalCourtsFromVenues} canchas totales`);
  } else {
    console.log('ℹ️ Liga sin configuración multi-sede (se usará método tradicional)');
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
  console.log('📝 Creating leagues for categories:', categories.length, 'categories');
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
    image_url: image_url || null,
    description,
    // ====== NUEVOS CAMPOS FLEXIBLES ======
    match_times,           // Array de horarios: ['22:30', '23:15']
    courts_per_time_slot,  // Canchas por horario: 2
    league_type,           // Tipo: 'round_robin'
    rounds,                // Vueltas: 1 o 2
    frequency: normalizedFrequency  // Frecuencia: 'quincenal' (normalizada)
  }));

  console.log('💾 Inserting leagues into database:', leaguesToCreate.length, 'leagues');
  const { data, error } = await supabase
    .from('leagues')
    .insert(leaguesToCreate)
    .select(); // Removemos la selección de categoría ya que no es necesaria

  if (error) {
    console.error('❌ Error creating leagues:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({ message: error.message });
  }

  console.log('✅ Leagues created successfully:', data?.length || 0, 'leagues');
  console.log('✅ League IDs:', data?.map(l => l.id) || []);

  // 🏢 CREAR RELACIONES DE SEDES (MULTI-SEDE)
  if (validatedVenues && validatedVenues.length > 0) {
    console.log('🏢 Asignando sedes a ligas:', validatedVenues.length, 'sedes');
    
    // Crear relaciones para cada liga creada
    for (const league of data) {
      for (const venueConfig of validatedVenues) {
        // 1. Insertar la relación liga-sede
        const { data: leagueVenue, error: leagueVenueError } = await supabase
          .from('league_venues')
          .insert({
            league_id: league.id,
            venue_id: venueConfig.venue_id,
            courts_count: venueConfig.courts_count,
            is_primary: venueConfig.is_primary
          })
          .select()
          .single();
        
        if (leagueVenueError) {
          console.error('❌ Error creando relación liga-sede:', leagueVenueError);
          continue;
        }
        
        // 2. Insertar las relaciones liga-sede-canchas
        const courtRelations = venueConfig.court_ids.map((court_id, index) => ({
          league_venue_id: leagueVenue.id,
          court_id: court_id,
          is_available: true,
          priority: index
        }));
        
        const { error: courtsError } = await supabase
          .from('league_venue_courts')
          .insert(courtRelations);
        
        if (courtsError) {
          console.error('❌ Error asignando canchas a sede:', courtsError);
        } else {
          console.log(`✅ Sede "${venueConfig.venue_name}" asignada con ${venueConfig.courts_count} canchas a liga ${league.id}`);
        }
      }
    }
    
    console.log('✅ Sedes asignadas exitosamente a todas las ligas');
  }

  console.log('🎉 League creation completed successfully!');
  console.log('📊 Summary:', {
    leaguesCreated: data?.length || 0,
    venuesAssigned: validatedVenues.length,
    totalCourts: totalCourtsFromVenues || courts_available
  });

  res.status(201).json({
    message: 'Ligas creadas exitosamente',
    ligas: data,
    venues: validatedVenues.length > 0 ? validatedVenues : null
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
              player2_name: `${player2.first_name} ${player2.last_name}`,
              playDay: leagueData.category.play_day.charAt(0).toUpperCase() + leagueData.category.play_day.slice(1),
              categoryName: leagueData.category.name
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
  const rounds = parseInt(req.body.rounds);
  
  // Validar que rounds sea un número válido y esté en el rango correcto
  if (isNaN(rounds) || (rounds !== 1 && rounds !== 2)) {
    console.log('Invalid rounds value:', req.body.rounds, 'parsed as:', rounds);
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

  // ====== NUEVO: Obtener canchas de multi-sede (league_venue_courts) ======
  console.log('🏢 Fetching courts from league venues (multi-sede)...');
  
  // 1. Obtener las sedes asignadas a esta liga
  const { data: leagueVenues, error: venuesError } = await supabase
    .from('league_venues')
    .select('id, venue_id, is_primary, venues:venue_id(id, name)')
    .eq('league_id', league_id)
    .order('is_primary', { ascending: false }); // Primaria primero

  let courts = [];
  let venueCourtMap = new Map(); // Mapeo court_id -> venue_id para asignar sede a partidos

  if (venuesError) {
    console.error('Error fetching league venues:', venuesError);
  }

  if (leagueVenues && leagueVenues.length > 0) {
    // Liga tiene multi-sede configurada - obtener canchas específicas
    console.log(`✅ Liga tiene ${leagueVenues.length} sedes asignadas`);
    
    const leagueVenueIds = leagueVenues.map(lv => lv.id);
    
    // 2. Obtener las canchas específicas de cada sede para esta liga
    const { data: leagueVenueCourts, error: courtsError } = await supabase
      .from('league_venue_courts')
      .select(`
        court_id,
        priority,
        is_available,
        league_venue_id,
        court:court_id(id, name, venue_id)
      `)
      .in('league_venue_id', leagueVenueIds)
      .eq('is_available', true)
      .order('priority');

    if (courtsError) {
      console.error('Error fetching league venue courts:', courtsError);
      return res.status(500).json({ message: 'Error al obtener las canchas de las sedes' });
    }

    if (!leagueVenueCourts || leagueVenueCourts.length === 0) {
      return res.status(400).json({ 
        message: 'No hay canchas disponibles en las sedes asignadas a esta liga' 
      });
    }

    // Mapear canchas y sus sedes
    courts = leagueVenueCourts.map(lvc => ({
      id: lvc.court.id,
      name: lvc.court.name,
      venue_id: lvc.court.venue_id
    }));

    // Crear mapeo para asignar venue_id a partidos
    leagueVenueCourts.forEach(lvc => {
      venueCourtMap.set(lvc.court.id, lvc.court.venue_id);
    });

    console.log(`🎾 Found ${courts.length} courts from multi-sede:`, 
      courts.map(c => `${c.name} (venue: ${c.venue_id})`));

  } else {
    // Liga sin multi-sede - fallback a todas las canchas (comportamiento legacy)
    console.log('ℹ️ Liga sin multi-sede, usando todas las canchas disponibles (legacy)');
    
    const { data: allCourts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name, venue_id')
      .order('name');

    if (courtsError) {
      console.error('Error fetching courts:', courtsError);
      return res.status(500).json({ message: 'Error al obtener las canchas disponibles' });
    }

    if (!allCourts || allCourts.length === 0) {
      return res.status(400).json({ message: 'No hay canchas disponibles para programar los partidos' });
    }

    courts = allCourts;
    allCourts.forEach(c => venueCourtMap.set(c.id, c.venue_id));
    
    console.log(`🎾 Found ${courts.length} available courts (legacy mode):`, 
      courts.map(c => `${c.name} (${c.id})`));
  }

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

  // ====== NUEVO: Usar horarios de la liga (no hardcodeados) ======
  let matchTimes = ['21:45','22:30', '23:15', '23:55']; // Default
  if (league.match_times) {
    if (typeof league.match_times === 'string') {
      try {
        matchTimes = JSON.parse(league.match_times);
      } catch (e) {
        console.error('Error parsing match_times JSON:', e);
        matchTimes = ['21:45','22:30', '23:15', '23:55'];
      }
    } else if (Array.isArray(league.match_times)) {
      matchTimes = league.match_times;
    }
  }
  
  // Validar que matchTimes sea un array válido
  if (!Array.isArray(matchTimes) || matchTimes.length === 0) {
    console.warn('⚠️ match_times inválido, usando defaults');
    matchTimes = ['21:45','22:30', '23:15', '23:55'];
  }
  
  const courtsPerTimeSlot = league.courts_per_time_slot || 2;
  // Normalizar frequency a minúsculas para consistencia
  const leagueFrequency = (league.frequency || 'quincenal').toLowerCase();
  
  console.log('⏰ Configuración de horarios de la liga:', { 
    matchTimes, 
    courtsPerTimeSlot, 
    frequency: leagueFrequency,
    totalCourts: courts.length
  });

  // ====== NUEVO: Obtener todas las ligas del mismo evento para rotación global de horarios ======
  // Buscar todas las ligas con el mismo nombre (mismo evento, diferentes categorías)
  console.log('🔍 Buscando ligas del mismo evento para rotación global de horarios...');
  const { data: allLeaguesInEvent, error: allLeaguesError } = await supabase
    .from('leagues')
    .select('id, name, category_id, created_at')
    .eq('name', league.name)
    .order('created_at', { ascending: true }); // Ordenar por fecha de creación para consistencia

  if (allLeaguesError) {
    console.error('⚠️ Error obteniendo ligas del mismo evento:', allLeaguesError);
  }

  // Determinar el índice de esta liga en el evento (para rotación de horarios)
  const leagueIndexInEvent = allLeaguesInEvent?.findIndex(l => l.id === league_id) || 0;
  const totalLeaguesInEvent = allLeaguesInEvent?.length || 1;
  
  console.log(`📊 Liga actual: ${leagueIndexInEvent + 1}/${totalLeaguesInEvent} en el evento "${league.name}"`);

  // ====== NUEVO: Contar partidos ya generados en otras ligas del mismo evento ======
  // Esto nos permite mantener la rotación global de horarios entre todas las categorías
  let globalMatchCounter = 0;
  if (allLeaguesInEvent && allLeaguesInEvent.length > 1) {
    // Obtener IDs de las ligas que se generaron ANTES que esta (para mantener orden)
    const previousLeagues = allLeaguesInEvent.slice(0, leagueIndexInEvent);
    
    if (previousLeagues.length > 0) {
      const previousLeagueIds = previousLeagues.map(l => l.id);
      const { count: previousMatchesCount, error: countError } = await supabase
        .from('league_matches')
        .select('id', { count: 'exact', head: true })
        .in('league_id', previousLeagueIds);
      
      if (!countError && previousMatchesCount) {
        globalMatchCounter = previousMatchesCount;
        console.log(`📊 Partidos ya generados en otras categorías del evento: ${globalMatchCounter}`);
      } else if (countError) {
        console.error('⚠️ Error contando partidos previos:', countError);
      }
    }
  }

  // Preparar las fechas y horarios
  let currentMatchDate = getNextDayOccurrence(league.start_date, league.category.play_day, false);
  const matches = [];
  let matchNumber = 1;

  // Calcular cuántos partidos caben por fecha (horarios × canchas por horario)
  const matchesPerDate = matchTimes.length * courtsPerTimeSlot;
  
  console.log('Initial match date:', currentMatchDate);
  console.log(`📊 Capacidad: ${matchesPerDate} partidos por fecha (${matchTimes.length} horarios × ${courtsPerTimeSlot} canchas)`);
  
  // Limitar canchas si hay menos disponibles que courts_per_time_slot
  const effectiveCourtsPerSlot = Math.min(courtsPerTimeSlot, courts.length);

  // ====== NUEVO: Rastrear distribución de horarios por equipo para equidad ======
  // Mapa: teamId -> { '22:30': count, '23:15': count, ... }
  const teamTimeDistribution = {};
  teamIds.forEach(teamId => {
    teamTimeDistribution[teamId] = {};
    matchTimes.forEach(time => {
      teamTimeDistribution[teamId][time] = 0;
    });
  });

  // Generar los partidos para cada ronda
  schedule.forEach((round, roundIndex) => {
    console.log(`Processing round ${roundIndex + 1}`);
    let matchesInCurrentDate = 0;
    // Contador de partidos por horario dentro de la fecha actual
    const matchesPerTimeSlot = {}; // { '22:30': 0, '23:15': 0, ... }
    // Contador de horarios usados en la fecha actual para rotación dentro de la fecha
    let timeSlotRotationIndex = 0;

    round.forEach(([team1Id, team2Id]) => {
      const leagueTeam1Id = leagueTeamIdMap.get(team1Id);
      const leagueTeam2Id = leagueTeamIdMap.get(team2Id);

      // Si ya hemos programado todos los partidos que caben en la fecha, avanzar
      if (matchesInCurrentDate >= matchesPerDate) {
        currentMatchDate = getNextDayOccurrence(
          currentMatchDate, 
          playDay, 
          true,
          leagueFrequency
        );
        matchesInCurrentDate = 0;
        timeSlotRotationIndex = 0;
        // Reiniciar contadores por horario al cambiar de fecha
        matchTimes.forEach(time => {
          matchesPerTimeSlot[time] = 0;
        });
      }

      // ====== NUEVA LÓGICA: Distribución equitativa de horarios dentro de la liga ======
      // Priorizar el horario que minimiza la diferencia de distribución para cada equipo individualmente
      // Esto asegura que cada equipo tenga distribución equitativa (3-4 partidos a cada horario)
      
      let bestTime = matchTimes[0];
      let bestScore = Infinity;

      matchTimes.forEach(time => {
        const team1Count = teamTimeDistribution[team1Id][time] || 0;
        const team2Count = teamTimeDistribution[team2Id][time] || 0;
        
        // Obtener el otro horario
        const otherTime = time === matchTimes[0] ? matchTimes[1] : matchTimes[0];
        const team1OtherCount = teamTimeDistribution[team1Id][otherTime] || 0;
        const team2OtherCount = teamTimeDistribution[team2Id][otherTime] || 0;
        
        // Calcular distribución después de asignar este horario
        const team1After = team1Count + 1;
        const team2After = team2Count + 1;
        
        // Calcular la diferencia de distribución para cada equipo después de esta asignación
        // Queremos minimizar esta diferencia (idealmente 0 o 1)
        const team1DiffAfter = Math.abs(team1After - team1OtherCount);
        const team2DiffAfter = Math.abs(team2After - team2OtherCount);
        
        // Score: priorizar horarios que minimizan la diferencia de distribución
        // Penalizar más las diferencias grandes (elevar al cuadrado)
        const score = (team1DiffAfter * team1DiffAfter) + (team2DiffAfter * team2DiffAfter);
        
        if (score < bestScore) {
          bestScore = score;
          bestTime = time;
        }
      });

      // 3. Si hay empate, usar rotación dentro de la fecha para alternar
      const candidatesWithBestScore = matchTimes.filter(time => {
        const team1Count = teamTimeDistribution[team1Id][time] || 0;
        const team2Count = teamTimeDistribution[team2Id][time] || 0;
        const otherTime = time === matchTimes[0] ? matchTimes[1] : matchTimes[0];
        const team1OtherCount = teamTimeDistribution[team1Id][otherTime] || 0;
        const team2OtherCount = teamTimeDistribution[team2Id][otherTime] || 0;
        const team1DiffAfter = Math.abs((team1Count + 1) - team1OtherCount);
        const team2DiffAfter = Math.abs((team2Count + 1) - team2OtherCount);
        const score = (team1DiffAfter * team1DiffAfter) + (team2DiffAfter * team2DiffAfter);
        return score === bestScore;
      });

      // Si hay múltiples candidatos con el mismo score, usar rotación dentro de la fecha
      if (candidatesWithBestScore.length > 1) {
        bestTime = candidatesWithBestScore[timeSlotRotationIndex % candidatesWithBestScore.length];
        timeSlotRotationIndex++;
      }

      const matchTime = bestTime;
      
      // 4. Actualizar distribución de horarios para ambos equipos
      teamTimeDistribution[team1Id][matchTime] = (teamTimeDistribution[team1Id][matchTime] || 0) + 1;
      teamTimeDistribution[team2Id][matchTime] = (teamTimeDistribution[team2Id][matchTime] || 0) + 1;
      
      // 5. Mantener contador global para referencia (pero no usarlo para asignación)
      globalMatchCounter++;
      
      // ====== CORRECCIÓN: Calcular índice de cancha dentro del horario específico ======
      // Inicializar contador para este horario si no existe
      if (matchesPerTimeSlot[matchTime] === undefined) {
        matchesPerTimeSlot[matchTime] = 0;
      }
      
      // Asignar cancha basándose en cuántos partidos ya hay en este horario específico
      // Esto evita conflictos: cada horario tiene sus propias canchas asignadas secuencialmente
      const courtIndexForTimeSlot = matchesPerTimeSlot[matchTime] % effectiveCourtsPerSlot;
      const court = courts[courtIndexForTimeSlot % courts.length];
      
      // Incrementar contador para este horario
      matchesPerTimeSlot[matchTime]++;
      
      // ====== NUEVO: Obtener venue_id de la cancha ======
      const venueId = venueCourtMap.get(court.id) || null;
      
      console.log(`🏸 Match scheduling details (DISTRIBUCIÓN EQUITATIVA):
        - Round: ${roundIndex + 1}
        - Date: ${currentMatchDate}
        - Time: ${matchTime} (asignado para equidad entre equipos)
        - Team1 (${team1Id}): ${teamTimeDistribution[team1Id][matchTime]} partidos a ${matchTime}
        - Team2 (${team2Id}): ${teamTimeDistribution[team2Id][matchTime]} partidos a ${matchTime}
        - Court: ${court.name} (index ${courtIndexForTimeSlot} para horario ${matchTime}, total en este horario: ${matchesPerTimeSlot[matchTime]})
        - Venue: ${venueId || 'N/A'}
        - Teams: ${team1Id} vs ${team2Id}
        - Category: ${league.category?.name || league.category_id}
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
        court_id: court.id,
        venue_id: venueId  // ====== NUEVO: Asignar sede al partido ======
      });

      matchesInCurrentDate++;
    });

    // Al final de cada ronda, avanzar al siguiente día
    currentMatchDate = getNextDayOccurrence(
      currentMatchDate, 
      playDay, 
      true,
      leagueFrequency
    );
    matchNumber++;
  });
  
  console.log(`🔄 Contador global de partidos después de esta liga: ${globalMatchCounter}`);

  console.log(`✅ Total matches generated: ${matches.length}`);
  console.log('📊 Court assignment summary:');
  const courtUsage = courts.reduce((acc, court) => {
    acc[court.name] = matches.filter(m => m.court_id === court.id).length;
    return acc;
  }, {});
  console.log(courtUsage);

  // ====== NUEVO: Mostrar distribución de horarios por equipo ======
  console.log('\n📊 Distribución de horarios por equipo (EQUIDAD):');
  teamIds.forEach(teamId => {
    const totalMatches = Object.values(teamTimeDistribution[teamId]).reduce((sum, count) => sum + count, 0);
    const distribution = matchTimes.map(time => {
      const count = teamTimeDistribution[teamId][time] || 0;
      const percentage = totalMatches > 0 ? ((count / totalMatches) * 100).toFixed(1) : '0.0';
      return `${time}: ${count} (${percentage}%)`;
    }).join(', ');
    console.log(`   Equipo ${teamId}: ${distribution} | Total: ${totalMatches} partidos`);
  });

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

  // ✅ PRODUCCIÓN: Sección de emails habilitada para producción
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
  
  console.log('📧 Email notifications ENABLED for production');

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
      .order('points', { ascending: false })        // 1. Puntos (2 por victoria, 1 por derrota con set ganado)
      .order('sets_won', { ascending: false })      // 2. Sets ganados (desempate principal)
      .order('games_won', { ascending: false })     // 3. Games ganados (desempate secundario)
      .order('sets_difference', { ascending: false }) // 4. Diferencia de sets (desempate terciario)
      .order('games_lost', { ascending: true })     // 5. Games perdidos (menor es mejor)
      .order('team_id', { ascending: true });       // 6. ID del equipo (desempate final)

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

  // Calcular sets ganados correctamente (0, 1 o 2 sets)
  const team1SetsWon = (team1_sets1_won > team2_sets1_won ? 1 : 0) + 
                       (team1_sets2_won > team2_sets2_won ? 1 : 0);
  const team2SetsWon = (team2_sets1_won > team1_sets1_won ? 1 : 0) + 
                       (team2_sets2_won > team1_sets2_won ? 1 : 0);

  // Calcular juegos ganados correctamente considerando tiebreaks
  const team1GamesWon = calculateGamesWon(team1_sets1_won, team2_sets1_won, ties.team1_tie1_won, ties.team2_tie1_won) +
                       calculateGamesWon(team1_sets2_won, team2_sets2_won, ties.team1_tie2_won, ties.team2_tie2_won);
  const team2GamesWon = calculateGamesWon(team2_sets1_won, team1_sets1_won, ties.team2_tie1_won, ties.team1_tie1_won) +
                       calculateGamesWon(team2_sets2_won, team1_sets2_won, ties.team2_tie2_won, ties.team1_tie2_won);

  const homeTeamUpdate = {
    games_played: currentHomeStanding.games_played + 1,
    sets_won: currentHomeStanding.sets_won + team1SetsWon,
    sets_lost: currentHomeStanding.sets_lost + team2SetsWon,
    sets_difference: currentHomeStanding.sets_difference + (team1SetsWon - team2SetsWon),
    games_won: currentHomeStanding.games_won + team1GamesWon,
    games_lost: currentHomeStanding.games_lost + team2GamesWon
  };

  if (team1SetsWon > team2SetsWon) {
    // Victoria 2-0 o 2-1
    homeTeamUpdate.wins = currentHomeStanding.wins + 1;
    homeTeamUpdate.points = currentHomeStanding.points + 2;
  } else if (team2SetsWon > team1SetsWon) { // team2 gana en sets
    homeTeamUpdate.losses = currentHomeStanding.losses + 1;
    homeTeamUpdate.games_lost = currentHomeStanding.games_lost + 1;
    // Solo suma 1 punto si ganó exactamente 1 set pero perdió el partido
    if (team1SetsWon === 1) {
      homeTeamUpdate.points = currentHomeStanding.points + 1;
    }
    // Si ganó 0 sets, no suma puntos (0 puntos)
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
    sets_won: currentAwayStanding.sets_won + team2SetsWon,
    sets_lost: currentAwayStanding.sets_lost + team1SetsWon,
    sets_difference: currentAwayStanding.sets_difference + (team2SetsWon - team1SetsWon),
    games_won: currentAwayStanding.games_won + team2GamesWon,
    games_lost: currentAwayStanding.games_lost + team1GamesWon
  };

  if (team2SetsWon > team1SetsWon) {
    // Victoria 2-0 o 2-1
    awayTeamUpdate.wins = currentAwayStanding.wins + 1;
    awayTeamUpdate.points = currentAwayStanding.points + 2;
  } else if (team1SetsWon > team2SetsWon) { // team1 gana en sets
    awayTeamUpdate.losses = currentAwayStanding.losses + 1;
    awayTeamUpdate.games_lost = currentAwayStanding.games_lost + 1;
    // Solo suma 1 punto si ganó exactamente 1 set pero perdió el partido
    if (team2SetsWon === 1) {
      awayTeamUpdate.points = currentAwayStanding.points + 1;
    }
    // Si ganó 0 sets, no suma puntos (0 puntos)
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

export async function getAvailablePlayers(req, res) {
  const page = Math.max(1, Math.min(parseInt(req.query.page) || 1, 1000)); // Limitar página máxima
  const pageSize = Math.max(1, Math.min(parseInt(req.query.pageSize) || 10, 50)); // Limitar tamaño de página
  const search = req.query.search || '';
  const leagueId = req.query.leagueId; // NUEVO: ID de la liga específica
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (!leagueId) {
    return res.status(400).json({ message: 'leagueId es requerido para filtrar jugadores por liga específica' });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    console.log('Getting available players for user:', currentUserId, { page, pageSize, search, leagueId });

    // Obtener los IDs de usuarios que ya están en equipos con el usuario actual EN ESTA LIGA ESPECÍFICA
    const { data: existingLeagueTeams, error: leagueTeamsError } = await supabase
      .from('league_teams')
      .select(`
        team:team_id (
          player1_id,
          player2_id
        )
      `)
      .eq('league_id', leagueId);

    if (leagueTeamsError) {
      console.error('Error fetching existing league teams:', leagueTeamsError);
      return res.status(500).json({ message: 'Error al obtener equipos de la liga' });
    }

    // Crear lista de IDs de usuarios que no deben aparecer EN ESTA LIGA ESPECÍFICA
    const excludedUserIds = new Set([currentUserId]);
    
    existingLeagueTeams.forEach(leagueTeam => {
      const team = leagueTeam.team;
      if (team) {
        // Si el usuario actual está en este equipo de esta liga, excluir al compañero
        if (team.player1_id === currentUserId) {
          excludedUserIds.add(team.player2_id);
        } else if (team.player2_id === currentUserId) {
          excludedUserIds.add(team.player1_id);
        }
        
        // También excluir a todos los jugadores ya inscritos en esta liga
        excludedUserIds.add(team.player1_id);
        excludedUserIds.add(team.player2_id);
      }
    });

    console.log('Excluded user IDs for league', leagueId, ':', Array.from(excludedUserIds));

    // Primero obtener el conteo total para validar la paginación
    let countQuery = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('id', 'in', `(${Array.from(excludedUserIds).join(',')})`)
      .eq('role', 'user'); // Solo usuarios con rol 'user'

    // Agregar filtro de búsqueda al conteo si existe
    if (search.trim()) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting total count:', countError);
      return res.status(500).json({ message: 'Error al obtener el conteo total' });
    }

    // Validar que la página solicitada no exceda el total disponible
    const maxPage = Math.ceil(totalCount / pageSize);
    if (page > maxPage && totalCount > 0) {
      console.log(`Page ${page} exceeds max page ${maxPage}. Returning empty result.`);
      return res.status(200).json({
        players: [],
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages: maxPage,
          hasMore: false
        },
        search: search || null
      });
    }

    // Construir query para usuarios disponibles
    let query = supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, created_at')
      .not('id', 'in', `(${Array.from(excludedUserIds).join(',')})`)
      .eq('role', 'user'); // Solo usuarios con rol 'user'

    // Agregar filtro de búsqueda si existe
    if (search.trim()) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Aplicar paginación
    query = query
      .order('first_name', { ascending: true })
      .range(from, to);

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching available users:', usersError);
      return res.status(500).json({ message: 'Error al obtener usuarios disponibles' });
    }

    // Formatear respuesta con datos adicionales para el frontend
    const formattedUsers = users.map(user => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`.trim()
    }));

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = page < totalPages;

    console.log('Available players found:', {
      total: totalCount,
      page,
      totalPages,
      hasMore,
      usersInPage: formattedUsers.length,
      excludedUsers: excludedUserIds.size,
      roleFilter: 'user only'
    });

    res.status(200).json({
      players: formattedUsers,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages,
        hasMore
      },
      search: search || null
    });

  } catch (error) {
    console.error('Error in getAvailablePlayers:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getPlayerById(req, res) {
  const { playerId } = req.params;

  try {
    console.log('Getting player by ID:', playerId);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, created_at')
      .eq('id', playerId)
      .single();

    if (userError) {
      console.error('Error fetching player by ID:', userError);
      if (userError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Jugador no encontrado' });
      }
      return res.status(500).json({ message: 'Error al obtener jugador' });
    }

    // Formatear respuesta
    const formattedUser = {
      ...user,
      full_name: `${user.first_name} ${user.last_name}`.trim()
    };

    console.log('Player found:', formattedUser);

    res.status(200).json(formattedUser);

  } catch (error) {
    console.error('Error in getPlayerById:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
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

// Función auxiliar para calcular juegos ganados considerando tiebreaks
function calculateGamesWon(team1SetScore, team2SetScore, team1TieScore, team2TieScore) {
  // Si hay tiebreak (ambos equipos llegaron a 5-5), el ganador del set cuenta como 6 juegos
  if (team1SetScore === 5 && team2SetScore === 5) {
    // El ganador del tiebreak gana el set con 6 juegos
    return team1TieScore > team2TieScore ? 6 : 0;
  }
  
  // Si no hay tiebreak, contar los juegos normalmente
  return team1SetScore;
}

// Función para recalcular standings de una liga
export async function recalculateStandings(req, res) {
  const { league_id } = req.params;

  try {
    console.log('🔄 Recalculando standings para liga:', league_id);

    // Obtener todos los partidos completados de la liga
    const { data: matches, error: matchesError } = await supabase
      .from('league_matches')
      .select('*')
      .eq('league_id', league_id)
      .eq('status', 'COMPLETED');

    if (matchesError) {
      return res.status(500).json({ message: matchesError.message });
    }

    // Obtener todos los equipos de la liga
    const { data: leagueTeams, error: leagueTeamsError } = await supabase
      .from('league_teams')
      .select('id, team_id')
      .eq('league_id', league_id);

    if (leagueTeamsError) {
      return res.status(500).json({ message: leagueTeamsError.message });
    }

    // Crear mapeo de league_team_id a team_id
    const leagueTeamIdMap = new Map(leagueTeams.map(lt => [lt.id, lt.team_id]));

    // Inicializar standings para todos los equipos
    const standings = {};
    leagueTeams.forEach(lt => {
      standings[lt.team_id] = {
        league_id,
        team_id: lt.team_id,
        points: 0,
        wins: 0,
        losses: 0,
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        sets_won: 0,
        sets_lost: 0,
        sets_difference: 0
      };
    });

    // Procesar cada partido
    matches.forEach(match => {
      const team1Id = leagueTeamIdMap.get(match.league_team1_id);
      const team2Id = leagueTeamIdMap.get(match.league_team2_id);

      if (!team1Id || !team2Id) return;

      const team1Standing = standings[team1Id];
      const team2Standing = standings[team2Id];

      // Calcular sets ganados
      const team1SetsWon = (match.team1_sets1_won > match.team2_sets1_won ? 1 : 0) + 
                          (match.team1_sets2_won > match.team2_sets2_won ? 1 : 0);
      const team2SetsWon = (match.team2_sets1_won > match.team1_sets1_won ? 1 : 0) + 
                          (match.team2_sets2_won > match.team1_sets2_won ? 1 : 0);

      // Calcular juegos ganados con tiebreaks
      const team1GamesWon = calculateGamesWon(match.team1_sets1_won, match.team2_sets1_won, match.team1_tie1_won, match.team2_tie1_won) +
                           calculateGamesWon(match.team1_sets2_won, match.team2_sets2_won, match.team1_tie2_won, match.team2_tie2_won);
      const team2GamesWon = calculateGamesWon(match.team2_sets1_won, match.team1_sets1_won, match.team2_tie1_won, match.team1_tie1_won) +
                           calculateGamesWon(match.team2_sets2_won, match.team1_sets2_won, match.team2_tie2_won, match.team1_tie2_won);

      // Actualizar estadísticas
      team1Standing.games_played++;
      team1Standing.sets_won += team1SetsWon;
      team1Standing.sets_lost += team2SetsWon;
      team1Standing.sets_difference += (team1SetsWon - team2SetsWon);
      team1Standing.games_won += team1GamesWon;
      team1Standing.games_lost += team2GamesWon;

      team2Standing.games_played++;
      team2Standing.sets_won += team2SetsWon;
      team2Standing.sets_lost += team1SetsWon;
      team2Standing.sets_difference += (team2SetsWon - team1SetsWon);
      team2Standing.games_won += team2GamesWon;
      team2Standing.games_lost += team1GamesWon;

      // Determinar ganador y puntos
      if (team1SetsWon > team2SetsWon) {
        team1Standing.wins++;
        team1Standing.points += 2;
        team2Standing.losses++;
        if (team2SetsWon === 1) team2Standing.points += 1;
      } else if (team2SetsWon > team1SetsWon) {
        team2Standing.wins++;
        team2Standing.points += 2;
        team1Standing.losses++;
        if (team1SetsWon === 1) team1Standing.points += 1;
      } else {
        // Empate en sets, decidir por tie3
        if (match.team1_tie3_won > match.team2_tie3_won) {
          team1Standing.wins++;
          team1Standing.points += 2;
          team2Standing.losses++;
          team2Standing.points += 1;
        } else {
          team2Standing.wins++;
          team2Standing.points += 2;
          team1Standing.losses++;
          team1Standing.points += 1;
        }
      }
    });

    // Eliminar standings existentes
    await supabase
      .from('league_standings')
      .delete()
      .eq('league_id', league_id);

    // Insertar nuevos standings
    const standingsArray = Object.values(standings);
    const { error: insertError } = await supabase
      .from('league_standings')
      .insert(standingsArray);

    if (insertError) {
      return res.status(500).json({ message: insertError.message });
    }

    console.log('✅ Standings recalculados exitosamente');

    res.status(200).json({
      message: 'Standings recalculados exitosamente',
      standings: standingsArray
    });

  } catch (error) {
    console.error('❌ Error recalculando standings:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
