// ========================================
// 🏟️ VENUE CONTROLLER
// ========================================
// Gestión de Sedes/Clubs para el sistema multi-sede
// ========================================

import { supabase } from '../config/supabaseClient.js';

// ========================================
// 🔍 CONSULTAS (GET)
// ========================================

/**
 * Obtener todas las sedes activas
 */
export async function getAllVenues(req, res) {
  try {
    const { include_courts, is_active } = req.query;

    let query = supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });

    // Filtrar por estado activo (por defecto solo activas)
    if (is_active !== 'all') {
      query = query.eq('is_active', is_active !== 'false');
    }

    const { data: venues, error } = await query;

    if (error) {
      console.error('Error fetching venues:', error);
      return res.status(500).json({ message: error.message });
    }

    // Si se solicita incluir canchas, obtenerlas
    if (include_courts === 'true') {
      const venueIds = venues.map(v => v.id);
      
      const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select('*')
        .in('venue_id', venueIds);

      if (courtsError) {
        console.error('Error fetching courts for venues:', courtsError);
        return res.status(500).json({ message: courtsError.message });
      }

      // Agrupar canchas por sede
      const venuesWithCourts = venues.map(venue => ({
        ...venue,
        courts: courts.filter(c => c.venue_id === venue.id),
        courts_count: courts.filter(c => c.venue_id === venue.id).length
      }));

      return res.status(200).json({ venues: venuesWithCourts });
    }

    res.status(200).json({ venues });
  } catch (error) {
    console.error('Error in getAllVenues:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener una sede por ID
 */
export async function getVenueById(req, res) {
  try {
    const { id } = req.params;

    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Sede no encontrada' });
      }
      return res.status(500).json({ message: error.message });
    }

    // Obtener canchas de esta sede
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('*')
      .eq('venue_id', id)
      .order('name');

    if (courtsError) {
      console.error('Error fetching courts:', courtsError);
    }

    // Contar torneos y ligas asociados
    const [tournamentsCount, leaguesCount] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', id),
      supabase
        .from('leagues')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', id)
    ]);

    res.status(200).json({
      venue: {
        ...venue,
        courts: courts || [],
        courts_count: courts?.length || 0,
        tournaments_count: tournamentsCount.count || 0,
        leagues_count: leaguesCount.count || 0
      }
    });
  } catch (error) {
    console.error('Error in getVenueById:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener la sede por defecto
 */
export async function getDefaultVenue(req, res) {
  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'No hay sede por defecto configurada' });
      }
      return res.status(500).json({ message: error.message });
    }

    res.status(200).json({ venue });
  } catch (error) {
    console.error('Error in getDefaultVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener canchas de una sede específica
 */
export async function getCourtsByVenue(req, res) {
  try {
    const { venueId } = req.params;

    // Verificar que la sede existe
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, is_active')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .eq('venue_id', venueId)
      .order('name');

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.status(200).json({
      venue: {
        id: venue.id,
        name: venue.name,
        is_active: venue.is_active
      },
      courts,
      courts_count: courts.length
    });
  } catch (error) {
    console.error('Error in getCourtsByVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// ✨ CREACIÓN (POST)
// ========================================

/**
 * Crear una nueva sede
 */
export async function createVenue(req, res) {
  try {
    const {
      name,
      address,
      city,
      state,
      country = 'Uruguay',
      postal_code,
      phone,
      email,
      description,
      logo_url,
      photo_url,
      latitude,
      longitude,
      timezone = 'America/Montevideo',
      opening_hours = {},
      amenities = [],
      social_links = {},
      is_active = true,
      is_default = false
    } = req.body;

    // Validaciones
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre de la sede es requerido' });
    }

    // Generar slug único
    let slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Verificar si el slug ya existe y hacer único si es necesario
    const { data: existingSlug } = await supabase
      .from('venues')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Si es la primera sede, hacerla por defecto
    const { count: venuesCount } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true });

    const shouldBeDefault = venuesCount === 0 || is_default;

    // Si se marca como default, quitar el default de otras sedes
    if (shouldBeDefault) {
      await supabase
        .from('venues')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    // Crear la sede
    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        name: name.trim(),
        slug,
        address,
        city,
        state,
        country,
        postal_code,
        phone,
        email,
        description,
        logo_url,
        photo_url,
        latitude,
        longitude,
        timezone,
        opening_hours,
        amenities,
        social_links,
        is_active,
        is_default: shouldBeDefault
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating venue:', error);
      return res.status(500).json({ message: error.message });
    }

    console.log(`✅ Sede creada: ${venue.name} (${venue.id})`);

    res.status(201).json({
      message: 'Sede creada exitosamente',
      venue
    });
  } catch (error) {
    console.error('Error in createVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// ✏️ ACTUALIZACIÓN (PUT/PATCH)
// ========================================

/**
 * Actualizar una sede
 */
export async function updateVenue(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que la sede existe
    const { data: existingVenue, error: findError } = await supabase
      .from('venues')
      .select('id, is_default')
      .eq('id', id)
      .single();

    if (findError || !existingVenue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // Si se está marcando como default, quitar el default de otras sedes
    if (updates.is_default === true && !existingVenue.is_default) {
      await supabase
        .from('venues')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    // No permitir quitar el default si es la única sede
    if (updates.is_default === false && existingVenue.is_default) {
      const { count } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (count === 1) {
        return res.status(400).json({ 
          message: 'No se puede quitar el estado "por defecto" de la única sede activa' 
        });
      }
    }

    // Actualizar slug si cambia el nombre
    if (updates.name && updates.name !== existingVenue.name) {
      updates.slug = updates.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'name', 'slug', 'address', 'city', 'state', 'country', 'postal_code',
      'phone', 'email', 'description', 'logo_url', 'photo_url',
      'latitude', 'longitude', 'timezone', 'opening_hours', 'amenities',
      'social_links', 'is_active', 'is_default'
    ];

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );

    const { data: venue, error } = await supabase
      .from('venues')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating venue:', error);
      return res.status(500).json({ message: error.message });
    }

    console.log(`✅ Sede actualizada: ${venue.name}`);

    res.status(200).json({
      message: 'Sede actualizada exitosamente',
      venue
    });
  } catch (error) {
    console.error('Error in updateVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Asignar cancha a una sede
 */
export async function assignCourtToVenue(req, res) {
  try {
    const { venueId } = req.params;
    const { court_id } = req.body;

    if (!court_id) {
      return res.status(400).json({ message: 'court_id es requerido' });
    }

    // Verificar que la sede existe
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // Verificar que la cancha existe
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('id, name, venue_id')
      .eq('id', court_id)
      .single();

    if (courtError || !court) {
      return res.status(404).json({ message: 'Cancha no encontrada' });
    }

    // Actualizar la cancha con el venue_id
    const { error: updateError } = await supabase
      .from('courts')
      .update({ venue_id: venueId })
      .eq('id', court_id);

    if (updateError) {
      return res.status(500).json({ message: updateError.message });
    }

    console.log(`✅ Cancha "${court.name}" asignada a sede "${venue.name}"`);

    res.status(200).json({
      message: `Cancha "${court.name}" asignada a "${venue.name}" exitosamente`,
      court_id,
      venue_id: venueId
    });
  } catch (error) {
    console.error('Error in assignCourtToVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Asignar múltiples canchas a una sede
 */
export async function assignCourtsToVenue(req, res) {
  try {
    const { venueId } = req.params;
    const { court_ids } = req.body;

    if (!Array.isArray(court_ids) || court_ids.length === 0) {
      return res.status(400).json({ message: 'court_ids debe ser un array con al menos un ID' });
    }

    // Verificar que la sede existe
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // Verificar que todas las canchas existen
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name')
      .in('id', court_ids);

    if (courtsError) {
      return res.status(500).json({ message: courtsError.message });
    }

    if (courts.length !== court_ids.length) {
      const foundIds = courts.map(c => c.id);
      const notFound = court_ids.filter(id => !foundIds.includes(id));
      return res.status(404).json({ 
        message: 'Algunas canchas no fueron encontradas',
        not_found: notFound 
      });
    }

    // Actualizar todas las canchas
    const { error: updateError } = await supabase
      .from('courts')
      .update({ venue_id: venueId })
      .in('id', court_ids);

    if (updateError) {
      return res.status(500).json({ message: updateError.message });
    }

    console.log(`✅ ${courts.length} canchas asignadas a sede "${venue.name}"`);

    res.status(200).json({
      message: `${courts.length} canchas asignadas a "${venue.name}" exitosamente`,
      courts_assigned: courts.map(c => ({ id: c.id, name: c.name })),
      venue_id: venueId
    });
  } catch (error) {
    console.error('Error in assignCourtsToVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// 🗑️ ELIMINACIÓN (DELETE)
// ========================================

/**
 * Eliminar una sede (soft delete - desactivar)
 */
export async function deleteVenue(req, res) {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Verificar que la sede existe
    const { data: venue, error: findError } = await supabase
      .from('venues')
      .select('id, name, is_default')
      .eq('id', id)
      .single();

    if (findError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // No permitir eliminar la sede por defecto
    if (venue.is_default) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la sede por defecto. Primero asigna otra sede como predeterminada.' 
      });
    }

    // Verificar si hay torneos o ligas activos en esta sede
    const [activeTournaments, activeLeagues] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', id)
        .in('status', ['upcoming', 'in_progress']),
      supabase
        .from('leagues')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', id)
        .eq('status', 'Activa')
    ]);

    const hasActiveEvents = (activeTournaments.count || 0) > 0 || (activeLeagues.count || 0) > 0;

    if (hasActiveEvents && !force) {
      return res.status(400).json({
        message: 'La sede tiene torneos o ligas activos. Use force=true para desactivar de todos modos.',
        active_tournaments: activeTournaments.count || 0,
        active_leagues: activeLeagues.count || 0
      });
    }

    // Soft delete: desactivar la sede
    const { error } = await supabase
      .from('venues')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    console.log(`✅ Sede desactivada: ${venue.name}`);

    res.status(200).json({
      message: 'Sede desactivada exitosamente',
      venue_id: id,
      venue_name: venue.name
    });
  } catch (error) {
    console.error('Error in deleteVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Eliminar permanentemente una sede (hard delete)
 * Solo si no tiene datos asociados
 */
export async function hardDeleteVenue(req, res) {
  try {
    const { id } = req.params;

    // Verificar que la sede existe
    const { data: venue, error: findError } = await supabase
      .from('venues')
      .select('id, name, is_default')
      .eq('id', id)
      .single();

    if (findError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // No permitir eliminar la sede por defecto
    if (venue.is_default) {
      return res.status(400).json({ 
        message: 'No se puede eliminar permanentemente la sede por defecto' 
      });
    }

    // Verificar si hay datos asociados
    const [courtsCount, tournamentsCount, leaguesCount] = await Promise.all([
      supabase.from('courts').select('id', { count: 'exact', head: true }).eq('venue_id', id),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('venue_id', id),
      supabase.from('leagues').select('id', { count: 'exact', head: true }).eq('venue_id', id)
    ]);

    const hasAssociatedData = 
      (courtsCount.count || 0) > 0 || 
      (tournamentsCount.count || 0) > 0 || 
      (leaguesCount.count || 0) > 0;

    if (hasAssociatedData) {
      return res.status(400).json({
        message: 'No se puede eliminar permanentemente. La sede tiene datos asociados.',
        associated_data: {
          courts: courtsCount.count || 0,
          tournaments: tournamentsCount.count || 0,
          leagues: leaguesCount.count || 0
        },
        suggestion: 'Use DELETE /venues/:id para desactivar la sede en su lugar'
      });
    }

    // Hard delete
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    console.log(`🗑️ Sede eliminada permanentemente: ${venue.name}`);

    res.status(200).json({
      message: 'Sede eliminada permanentemente',
      venue_id: id,
      venue_name: venue.name
    });
  } catch (error) {
    console.error('Error in hardDeleteVenue:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// 📸 GESTIÓN DE IMÁGENES
// ========================================

/**
 * Subir imagen de perfil para una sede
 * @body { file: File } (multipart/form-data)
 */
export async function uploadVenuePhoto(req, res) {
  try {
    const { id } = req.params;
    const { file } = req.files;

    if (!file) {
      return res.status(400).json({ 
        message: 'Archivo de imagen es requerido' 
      });
    }

    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen' });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'La imagen no debe superar los 5MB' });
    }

    // Verificar que la sede existe
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, photo_url')
      .eq('id', id)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // Sanitizar nombre de archivo
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileExt = sanitizedName.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `venues/${fileName}`;

    // Intentar subir a diferentes buckets (por si no existe venues-bucket)
    let uploadError = null;
    let publicUrl = null;
    const bucketsToTry = ['venues-bucket', 'courts-bucket', 'tournament-thumbnails'];

    for (const bucketName of bucketsToTry) {
      try {
        const { error: uploadErr } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file.data, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadErr) {
          // Obtener URL pública
          const { data: { publicUrl: url } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          publicUrl = url;
          break;
        } else {
          uploadError = uploadErr;
        }
      } catch (err) {
        uploadError = err;
        continue;
      }
    }

    if (!publicUrl) {
      console.error('Error uploading to all buckets:', uploadError);
      return res.status(500).json({ 
        message: 'Error al subir la imagen. Verifica que el bucket de almacenamiento esté configurado correctamente.',
        error: uploadError?.message || 'Bucket no encontrado'
      });
    }

    // Si había una imagen anterior, intentar eliminarla
    if (venue.photo_url) {
      try {
        // Extraer el path de la URL anterior
        const oldUrl = venue.photo_url;
        const urlParts = oldUrl.split('/');
        const oldPath = urlParts.slice(urlParts.indexOf('storage') + 2).join('/');
        const oldBucket = urlParts[urlParts.indexOf('storage') + 1];
        
        if (oldPath && oldBucket) {
          await supabase.storage
            .from(oldBucket)
            .remove([oldPath]);
        }
      } catch (deleteError) {
        console.warn('No se pudo eliminar la imagen anterior:', deleteError);
        // No fallar si no se puede eliminar la imagen anterior
      }
    }

    // Actualizar la sede con la nueva URL
    const { data: updatedVenue, error: updateError } = await supabase
      .from('venues')
      .update({ photo_url: publicUrl })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      // Si falla la actualización, eliminar la imagen subida
      try {
        const urlParts = publicUrl.split('/');
        const path = urlParts.slice(urlParts.indexOf('storage') + 2).join('/');
        const bucket = urlParts[urlParts.indexOf('storage') + 1];
        await supabase.storage
          .from(bucket)
          .remove([path]);
      } catch (cleanupError) {
        console.error('Error limpiando imagen subida:', cleanupError);
      }
      
      return res.status(500).json({ message: updateError.message });
    }

    console.log(`✅ Imagen de perfil actualizada para sede: ${venue.name}`);

    res.status(200).json({
      message: 'Imagen de perfil actualizada exitosamente',
      venue: updatedVenue,
      photo_url: publicUrl
    });
  } catch (error) {
    console.error('Error in uploadVenuePhoto:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
}

// ========================================
// 📊 ESTADÍSTICAS
// ========================================

/**
 * Obtener estadísticas de una sede
 */
export async function getVenueStats(req, res) {
  try {
    const { id } = req.params;

    // Verificar que la sede existe
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', id)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }

    // Obtener estadísticas en paralelo
    const [
      courtsCount,
      tournamentsTotal,
      tournamentsActive,
      leaguesTotal,
      leaguesActive,
      matchesTournament,
      matchesLeague
    ] = await Promise.all([
      supabase.from('courts').select('id', { count: 'exact', head: true }).eq('venue_id', id),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('venue_id', id),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('venue_id', id).eq('status', 'in_progress'),
      supabase.from('leagues').select('id', { count: 'exact', head: true }).eq('venue_id', id),
      supabase.from('leagues').select('id', { count: 'exact', head: true }).eq('venue_id', id).eq('status', 'Activa'),
      supabase.from('tournament_matches').select('id', { count: 'exact', head: true }).eq('venue_id', id),
      supabase.from('league_matches').select('id', { count: 'exact', head: true }).eq('venue_id', id)
    ]);

    res.status(200).json({
      venue: {
        id: venue.id,
        name: venue.name
      },
      stats: {
        courts: courtsCount.count || 0,
        tournaments: {
          total: tournamentsTotal.count || 0,
          active: tournamentsActive.count || 0
        },
        leagues: {
          total: leaguesTotal.count || 0,
          active: leaguesActive.count || 0
        },
        matches: {
          tournament: matchesTournament.count || 0,
          league: matchesLeague.count || 0,
          total: (matchesTournament.count || 0) + (matchesLeague.count || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error in getVenueStats:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// 🏆 GESTIÓN DE SEDES EN TORNEOS
// ========================================

/**
 * Agregar sedes a un torneo con sus canchas
 * @body { venues: [{ venue_id, court_ids: [], is_primary? }] }
 */
export async function addVenuesToTournament(req, res) {
  try {
    const { tournamentId } = req.params;
    const { venues } = req.body;

    if (!Array.isArray(venues) || venues.length === 0) {
      return res.status(400).json({ 
        message: 'Se requiere al menos una sede con sus canchas',
        example: {
          venues: [
            { venue_id: 'uuid', court_ids: ['court1', 'court2'], is_primary: true },
            { venue_id: 'uuid2', court_ids: ['court3'], is_primary: false }
          ]
        }
      });
    }

    // Verificar que el torneo existe
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('id, name, status')
      .eq('id', tournamentId)
      .single();

    if (tError || !tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    const results = {
      venues_added: [],
      courts_added: [],
      errors: []
    };

    // Asegurar que solo haya una sede primaria
    const primaryCount = venues.filter(v => v.is_primary).length;
    if (primaryCount > 1) {
      return res.status(400).json({ message: 'Solo puede haber una sede primaria' });
    }

    // Procesar cada sede
    for (const venueData of venues) {
      const { venue_id, court_ids = [], is_primary = false, notes = '' } = venueData;

      // Verificar que la sede existe
      const { data: venue, error: vError } = await supabase
        .from('venues')
        .select('id, name, is_active')
        .eq('id', venue_id)
        .single();

      if (vError || !venue) {
        results.errors.push({ venue_id, error: 'Sede no encontrada' });
        continue;
      }

      if (!venue.is_active) {
        results.errors.push({ venue_id, error: 'Sede no está activa' });
        continue;
      }

      // Verificar que las canchas pertenecen a esta sede
      if (court_ids.length > 0) {
        const { data: validCourts, error: cError } = await supabase
          .from('courts')
          .select('id, name')
          .in('id', court_ids)
          .eq('venue_id', venue_id);

        if (cError) {
          results.errors.push({ venue_id, error: 'Error validando canchas' });
          continue;
        }

        if (validCourts.length !== court_ids.length) {
          const validIds = validCourts.map(c => c.id);
          const invalidIds = court_ids.filter(id => !validIds.includes(id));
          results.errors.push({ 
            venue_id, 
            error: `Algunas canchas no pertenecen a esta sede: ${invalidIds.join(', ')}` 
          });
          continue;
        }
      }

      // Insertar o actualizar la relación torneo-sede
      const { data: tournamentVenue, error: tvError } = await supabase
        .from('tournament_venues')
        .upsert({
          tournament_id: tournamentId,
          venue_id,
          is_primary,
          notes
        }, {
          onConflict: 'tournament_id,venue_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (tvError) {
        results.errors.push({ venue_id, error: tvError.message });
        continue;
      }

      results.venues_added.push({
        venue_id,
        venue_name: venue.name,
        is_primary,
        tournament_venue_id: tournamentVenue.id
      });

      // Insertar las canchas para esta sede en el torneo
      if (court_ids.length > 0) {
        const courtsToInsert = court_ids.map(court_id => ({
          tournament_venue_id: tournamentVenue.id,
          court_id,
          is_available: true
        }));

        const { error: tvcError } = await supabase
          .from('tournament_venue_courts')
          .upsert(courtsToInsert, {
            onConflict: 'tournament_venue_id,court_id',
            ignoreDuplicates: true
          });

        if (tvcError) {
          results.errors.push({ venue_id, error: `Error agregando canchas: ${tvcError.message}` });
        } else {
          results.courts_added.push(...court_ids.map(id => ({ court_id: id, venue_id })));
        }
      }
    }

    console.log(`✅ Sedes agregadas al torneo ${tournament.name}:`, results.venues_added.length);

    res.status(201).json({
      message: 'Sedes y canchas configuradas exitosamente',
      tournament: {
        id: tournamentId,
        name: tournament.name
      },
      results
    });
  } catch (error) {
    console.error('Error in addVenuesToTournament:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener sedes y canchas de un torneo
 */
export async function getTournamentVenues(req, res) {
  try {
    const { tournamentId } = req.params;

    // Verificar que el torneo existe
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', tournamentId)
      .single();

    if (tError || !tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    // Obtener sedes del torneo
    const { data: tournamentVenues, error: tvError } = await supabase
      .from('tournament_venues')
      .select(`
        id,
        is_primary,
        courts_count,
        notes,
        venue:venue_id (
          id,
          name,
          address,
          city,
          phone,
          photo_url
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('is_primary', { ascending: false });

    if (tvError) {
      return res.status(500).json({ message: tvError.message });
    }

    // Obtener canchas de cada sede
    const venuesWithCourts = await Promise.all(
      tournamentVenues.map(async (tv) => {
        const { data: courts } = await supabase
          .from('tournament_venue_courts')
          .select(`
            id,
            is_available,
            priority,
            court:court_id (
              id,
              name,
              photo_url
            )
          `)
          .eq('tournament_venue_id', tv.id)
          .order('priority', { ascending: false });

        return {
          ...tv,
          courts: courts?.map(c => ({
            ...c.court,
            is_available: c.is_available,
            priority: c.priority
          })) || []
        };
      })
    );

    // Calcular totales
    const totalCourts = venuesWithCourts.reduce((sum, v) => sum + (v.courts?.length || 0), 0);

    res.status(200).json({
      tournament: {
        id: tournament.id,
        name: tournament.name
      },
      venues: venuesWithCourts,
      summary: {
        total_venues: venuesWithCourts.length,
        total_courts: totalCourts,
        primary_venue: venuesWithCourts.find(v => v.is_primary)?.venue?.name || null
      }
    });
  } catch (error) {
    console.error('Error in getTournamentVenues:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Eliminar una sede de un torneo
 */
export async function removeVenueFromTournament(req, res) {
  try {
    const { tournamentId, venueId } = req.params;

    // Verificar que la relación existe
    const { data: tv, error: findError } = await supabase
      .from('tournament_venues')
      .select('id, is_primary')
      .eq('tournament_id', tournamentId)
      .eq('venue_id', venueId)
      .single();

    if (findError || !tv) {
      return res.status(404).json({ message: 'La sede no está asociada a este torneo' });
    }

    // Verificar si hay partidos programados en esta sede
    const { count: matchesCount } = await supabase
      .from('tournament_matches')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .eq('venue_id', venueId);

    if (matchesCount > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar la sede porque tiene partidos programados',
        matches_count: matchesCount
      });
    }

    // Eliminar (cascade eliminará las canchas automáticamente)
    const { error: deleteError } = await supabase
      .from('tournament_venues')
      .delete()
      .eq('id', tv.id);

    if (deleteError) {
      return res.status(500).json({ message: deleteError.message });
    }

    res.status(200).json({
      message: 'Sede eliminada del torneo exitosamente',
      tournament_id: tournamentId,
      venue_id: venueId
    });
  } catch (error) {
    console.error('Error in removeVenueFromTournament:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ========================================
// 🏅 GESTIÓN DE SEDES EN LIGAS
// ========================================

/**
 * Agregar sedes a una liga con sus canchas
 */
export async function addVenuesToLeague(req, res) {
  try {
    const { leagueId } = req.params;
    const { venues } = req.body;

    if (!Array.isArray(venues) || venues.length === 0) {
      return res.status(400).json({ 
        message: 'Se requiere al menos una sede con sus canchas',
        example: {
          venues: [
            { venue_id: 'uuid', court_ids: ['court1', 'court2'], is_primary: true }
          ]
        }
      });
    }

    // Verificar que la liga existe
    const { data: league, error: lError } = await supabase
      .from('leagues')
      .select('id, name, status')
      .eq('id', leagueId)
      .single();

    if (lError || !league) {
      return res.status(404).json({ message: 'Liga no encontrada' });
    }

    const results = {
      venues_added: [],
      courts_added: [],
      errors: []
    };

    // Asegurar que solo haya una sede primaria
    const primaryCount = venues.filter(v => v.is_primary).length;
    if (primaryCount > 1) {
      return res.status(400).json({ message: 'Solo puede haber una sede primaria' });
    }

    // Procesar cada sede
    for (const venueData of venues) {
      const { venue_id, court_ids = [], is_primary = false, notes = '' } = venueData;

      // Verificar que la sede existe
      const { data: venue, error: vError } = await supabase
        .from('venues')
        .select('id, name, is_active')
        .eq('id', venue_id)
        .single();

      if (vError || !venue) {
        results.errors.push({ venue_id, error: 'Sede no encontrada' });
        continue;
      }

      if (!venue.is_active) {
        results.errors.push({ venue_id, error: 'Sede no está activa' });
        continue;
      }

      // Verificar que las canchas pertenecen a esta sede
      if (court_ids.length > 0) {
        const { data: validCourts } = await supabase
          .from('courts')
          .select('id, name')
          .in('id', court_ids)
          .eq('venue_id', venue_id);

        if (validCourts.length !== court_ids.length) {
          results.errors.push({ venue_id, error: 'Algunas canchas no pertenecen a esta sede' });
          continue;
        }
      }

      // Insertar la relación liga-sede
      const { data: leagueVenue, error: lvError } = await supabase
        .from('league_venues')
        .upsert({
          league_id: leagueId,
          venue_id,
          is_primary,
          notes
        }, {
          onConflict: 'league_id,venue_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (lvError) {
        results.errors.push({ venue_id, error: lvError.message });
        continue;
      }

      results.venues_added.push({
        venue_id,
        venue_name: venue.name,
        is_primary,
        league_venue_id: leagueVenue.id
      });

      // Insertar las canchas
      if (court_ids.length > 0) {
        const courtsToInsert = court_ids.map(court_id => ({
          league_venue_id: leagueVenue.id,
          court_id,
          is_available: true
        }));

        const { error: lvcError } = await supabase
          .from('league_venue_courts')
          .upsert(courtsToInsert, {
            onConflict: 'league_venue_id,court_id',
            ignoreDuplicates: true
          });

        if (!lvcError) {
          results.courts_added.push(...court_ids.map(id => ({ court_id: id, venue_id })));
        }
      }
    }

    console.log(`✅ Sedes agregadas a la liga ${league.name}:`, results.venues_added.length);

    res.status(201).json({
      message: 'Sedes y canchas configuradas exitosamente',
      league: {
        id: leagueId,
        name: league.name
      },
      results
    });
  } catch (error) {
    console.error('Error in addVenuesToLeague:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener sedes y canchas de una liga
 */
export async function getLeagueVenues(req, res) {
  try {
    const { leagueId } = req.params;

    const { data: league, error: lError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single();

    if (lError || !league) {
      return res.status(404).json({ message: 'Liga no encontrada' });
    }

    const { data: leagueVenues, error: lvError } = await supabase
      .from('league_venues')
      .select(`
        id,
        is_primary,
        courts_count,
        notes,
        venue:venue_id (
          id,
          name,
          address,
          city,
          phone,
          photo_url
        )
      `)
      .eq('league_id', leagueId)
      .order('is_primary', { ascending: false });

    if (lvError) {
      return res.status(500).json({ message: lvError.message });
    }

    const venuesWithCourts = await Promise.all(
      leagueVenues.map(async (lv) => {
        const { data: courts } = await supabase
          .from('league_venue_courts')
          .select(`
            id,
            is_available,
            priority,
            court:court_id (
              id,
              name,
              photo_url
            )
          `)
          .eq('league_venue_id', lv.id);

        return {
          ...lv,
          courts: courts?.map(c => ({
            ...c.court,
            is_available: c.is_available,
            priority: c.priority
          })) || []
        };
      })
    );

    const totalCourts = venuesWithCourts.reduce((sum, v) => sum + (v.courts?.length || 0), 0);

    res.status(200).json({
      league: {
        id: league.id,
        name: league.name
      },
      venues: venuesWithCourts,
      summary: {
        total_venues: venuesWithCourts.length,
        total_courts: totalCourts,
        primary_venue: venuesWithCourts.find(v => v.is_primary)?.venue?.name || null
      }
    });
  } catch (error) {
    console.error('Error in getLeagueVenues:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Eliminar una sede de una liga
 */
export async function removeVenueFromLeague(req, res) {
  try {
    const { leagueId, venueId } = req.params;

    const { data: lv, error: findError } = await supabase
      .from('league_venues')
      .select('id, is_primary')
      .eq('league_id', leagueId)
      .eq('venue_id', venueId)
      .single();

    if (findError || !lv) {
      return res.status(404).json({ message: 'La sede no está asociada a esta liga' });
    }

    // Verificar partidos programados
    const { count: matchesCount } = await supabase
      .from('league_matches')
      .select('id', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('venue_id', venueId);

    if (matchesCount > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar la sede porque tiene partidos programados',
        matches_count: matchesCount
      });
    }

    const { error: deleteError } = await supabase
      .from('league_venues')
      .delete()
      .eq('id', lv.id);

    if (deleteError) {
      return res.status(500).json({ message: deleteError.message });
    }

    res.status(200).json({
      message: 'Sede eliminada de la liga exitosamente',
      league_id: leagueId,
      venue_id: venueId
    });
  } catch (error) {
    console.error('Error in removeVenueFromLeague:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

