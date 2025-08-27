import { supabase } from '../config/supabaseClient.js'
import path from 'path'

// Función auxiliar para obtener el tipo MIME
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function uploadLeaguePhoto(req, res) {
  try {
    const { league_id, caption, file_content, file_name } = req.body;

    if (!league_id || !file_content || !file_name) {
      return res.status(400).json({ message: 'League ID and file content are required' });
    }

    // Verify league exists
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id')
      .eq('id', league_id)
      .single();

    if (leagueError || !league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(file_content, 'base64');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file_name)}`;
    const mimeType = getMimeType(file_name);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('league-gallery')
      .upload(`${league_id}/${fileName}`, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ message: uploadError.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('league-gallery')
      .getPublicUrl(`${league_id}/${fileName}`);

    // Create gallery entry
    const { data: galleryEntry, error: galleryError } = await supabase
      .from('league_gallery')
      .insert([{
        league_id,
        caption: caption || null,
        image_url: publicUrl,
        match_id: null // Optional, can be updated later if needed
      }])
      .select()
      .single();

    if (galleryError) {
      // If gallery entry fails, delete the uploaded image
      await supabase.storage
        .from('league-gallery')
        .remove([`${league_id}/${fileName}`]);
      
      return res.status(500).json({ message: galleryError.message });
    }

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: galleryEntry
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function getLeaguePhotos(req, res) {
  try {
    const { league_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    // Primero obtener el total de fotos para validar el rango
    const { count } = await supabase
      .from('league_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league_id);

    // Si no hay fotos, devolver respuesta vacía
    if (count === 0) {
      return res.status(200).json({
        photos: [],
        page: 1,
        pageSize,
        total: 0
      });
    }

    // Calcular el rango correcto
    const from = (page - 1) * pageSize;
    const to = Math.min(from + pageSize - 1, count - 1); // Asegurarnos de no exceder el total

    // Si el from es mayor que el total, significa que la página solicitada está fuera de rango
    if (from >= count) {
      return res.status(200).json({
        photos: [],
        page: Math.ceil(count / pageSize), // Devolver la última página válida
        pageSize,
        total: count
      });
    }

    const { data: photos, error } = await supabase
      .from('league_gallery')
      .select('*')
      .eq('league_id', league_id)
      .order('uploaded_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching photos:', error);
      return res.status(500).json({ message: 'Error al obtener las fotos de la galería' });
    }

    res.status(200).json({
      photos: photos || [],
      page,
      pageSize,
      total: count
    });

  } catch (error) {
    console.error('Error in getLeaguePhotos:', error);
    res.status(500).json({ 
      message: 'Error interno al procesar la solicitud de fotos',
      error: error.message 
    });
  }
}

export async function deleteLeaguePhoto(req, res) {
  try {
    const { id } = req.params;

    // Get photo details first
    const { data: photo, error: getError } = await supabase
      .from('league_gallery')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Extract file path from image_url
    const urlParts = photo.image_url.split('/');
    const filePath = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;

    // Delete from storage first
    const { error: storageError } = await supabase
      .storage
      .from('league-gallery')
      .remove([filePath]);

    if (storageError) {
      return res.status(500).json({ message: storageError.message });
    }

    // Delete database entry
    const { error: deleteError } = await supabase
      .from('league_gallery')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ message: deleteError.message });
    }

    res.status(200).json({
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 

export async function cleanOldGalleryImages() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get old photos
    const { data: oldPhotos, error: fetchError } = await supabase
      .from('league_gallery')
      .select('id, image_url')
      .lt('uploaded_at', thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching old photos:', fetchError);
      return;
    }

    if (!oldPhotos || oldPhotos.length === 0) {
      return;
    }

    // Delete files from storage and database
    for (const photo of oldPhotos) {
      const urlParts = photo.image_url.split('/');
      const filePath = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage
        .from('league-gallery')
        .remove([filePath]);

      // Delete from database
      await supabase
        .from('league_gallery')
        .delete()
        .eq('id', photo.id);
    }

    console.log(`Cleaned ${oldPhotos.length} old gallery images`);
  } catch (error) {
    console.error('Error cleaning old gallery images:', error);
  }
} 