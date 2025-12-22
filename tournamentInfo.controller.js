import { supabase } from '../config/supabaseClient.js'


export async function setTournamentRequiredInfo(req, res) {
  try {
    const { id } = req.params
    const {
      description,
      rules,
      tournament_location,
      tournament_address,
      tournament_club_name,
      signup_limit_date,
      inscription_cost,
      first_place_prize, 
      second_place_prize, 
      third_place_prize,  
      tournament_thumbnail,
      sponsors      
    } = req.body

    // Solo validar campos que vienen en el request
    const fieldsToUpdate = {
      description,
      rules,
      tournament_location,
      tournament_address,
      tournament_club_name,
      signup_limit_date,
      inscription_cost,
      first_place_prize,
      second_place_prize,
      third_place_prize,
      tournament_thumbnail,
      sponsors
    };

    // Filtrar campos undefined/null para actualización parcial
    const validFields = Object.fromEntries(
      Object.entries(fieldsToUpdate).filter(([, value]) => value !== undefined)
    );

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('id', id)
      .single()

    if (tournamentError || !tournament) {
      return res.status(404).json({ message: 'Tournament not found' })
    }

    // Create or update tournament info
    const { data, error } = await supabase
      .from('tournament_info')
      .upsert({
        tournament_id: id,
        ...validFields
      })
      .select()

    if (error) return res.status(500).json({ message: error.message })

    res.status(201).json({
      message: 'Tournament info set successfully',
      info: data[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function setTournamentThumbnail(req, res) {
  try {
    const { id } = req.params
    const { file } = req.files

    if (!file) {
      return res.status(400).json({ 
        message: 'Tournament thumbnail is required' 
      })
    }

    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'File must be an image' })
    }

    // Sanitize filename: remove spaces and special characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const path = `${Date.now()}_${sanitizedName}`
    
    const { error: uploadError } = await supabase.storage
      .from('tournament-thumbnails')
      .upload(path, file.data)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('tournament-thumbnails')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from('tournament_info')
      .update({ tournament_thumbnail: publicUrl })
      .eq('tournament_id', id)
      .select()

    if (error) {
      await supabase.storage
        .from('tournament-thumbnails')
        .remove([path])
      throw error
    }

    res.json({
      message: 'Tournament thumbnail updated successfully',
      info: data[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function setTournamentPrize(req, res) {
  try {
    const { id } = req.params
    const { first_place_prize, second_place_prize, third_place_prize } = req.body

    const { data, error } = await supabase
      .from('tournament_info')
      .update({ first_place_prize, second_place_prize, third_place_prize })
      .eq('tournament_id', id)
      .select() 

    if (error) throw error

    res.json({
      message: 'Tournament prize updated successfully',
      info: data[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function setTournamentSponsors(req, res) {
  try {
    const { id } = req.params
    const { sponsorsIds } = req.body
    
    const { data, error } = await supabase
      .from('tournament_info')
      .update({ sponsors: sponsorsIds })
      .eq('tournament_id', id)
      .select() 

    if (error) throw error

    res.json({
      message: 'Tournament sponsors updated successfully',
      info: data[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function getAvailableHoursForRegistration(req, res) {
  const { id } = req.params
  
  try {
    // Get tournament details including time_slots and courts_available
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('time_slots, courts_available')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to get tournament: ${error.message}`)
    if (!tournament) throw new Error('Tournament not found')

    // ✨ NUEVO: Obtener número total de canchas desde multi-sede o fallback
    let totalCourts = tournament.courts_available || 0;
    
    // Intentar obtener desde multi-sede
    const { data: tournamentVenues } = await supabase
      .from('tournament_venues')
      .select('id')
      .eq('tournament_id', id);
    
    if (tournamentVenues && tournamentVenues.length > 0) {
      // Hay multi-sede configurado - contar canchas desde tournament_venue_courts
      const tournamentVenueIds = tournamentVenues.map(tv => tv.id);
      const { data: venueCourts } = await supabase
        .from('tournament_venue_courts')
        .select('id')
        .in('tournament_venue_id', tournamentVenueIds)
        .eq('is_available', true);
      
      if (venueCourts && venueCourts.length > 0) {
        totalCourts = venueCourts.length;
        console.log(`🏢 Usando ${totalCourts} canchas desde multi-sede`);
      }
    } else {
      // Sin multi-sede - usar courts_available como fallback
      console.log(`ℹ️ Usando ${totalCourts} canchas desde courts_available (legacy)`);
    }

    // Get all teams' unavailable times
    const { data: existingTeams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select('unavailable_times')
      .eq('tournament_id', id)

    if (teamsError) throw new Error(`Failed to get teams: ${teamsError.message}`)

    const availabilityMap = {}
    const maxUnavailableTeams = 8 - (totalCourts * 2)

    // For each tournament time slot
    tournament.time_slots.forEach(([start, end]) => {
      for (let hour = start; hour < end; hour++) {
        // Count how many teams are unavailable at this hour
        const teamsUnavailableAtHour = existingTeams.filter(team => 
          team.unavailable_times?.some(([tStart, tEnd]) => hour >= tStart && hour < tEnd)
        ).length

        availabilityMap[hour] = {
          available: teamsUnavailableAtHour < maxUnavailableTeams,
          remaining_slots: maxUnavailableTeams - teamsUnavailableAtHour
        }
      }
    })

    res.json({
      message: 'Available hours retrieved successfully',
      availability: availabilityMap
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
  
}