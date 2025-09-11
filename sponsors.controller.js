import { supabase } from '../config/supabaseClient.js'
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_STORAGE_URL = process.env.SUPABASE_STORAGE_URL

export async function getAllSponsors(req, res) {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('name')

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function createSponsor(req, res) {
  try {
    const { name } = req.body
    const { file } = req.files

    // DEBUG: Log de información del archivo
    console.log('🔍 DEBUG - Información del archivo:')
    console.log('req.files:', req.files)
    console.log('file:', file)
    if (file) {
      console.log('file.name:', file.name)
      console.log('file.mimetype:', file.mimetype)
      console.log('file.size:', file.size)
      console.log('file.data type:', typeof file.data)
    }

    // Validaciones básicas
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        message: 'El nombre del sponsor es requerido' 
      })
    }

    if (!file) {
      return res.status(400).json({ 
        message: 'El logo del sponsor es requerido' 
      })
    }

    // Validar tipo de archivo (TEMPORALMENTE DESHABILITADO PARA DEBUG)
    if (!file.mimetype.startsWith('image/')) {
      console.log('❌ MIME type inválido:', file.mimetype)
      console.log('⚠️ CONTINUANDO SIN VALIDACIÓN DE MIME TYPE PARA DEBUG')
      // return res.status(400).json({ 
      //   message: `El archivo debe ser una imagen válida. MIME type recibido: ${file.mimetype}` 
      // })
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: 'El archivo no puede ser mayor a 5MB' 
      })
    }

    // Verificar si ya existe un sponsor con ese nombre
    const { data: existingSponsor, error: checkError } = await supabase
      .from('sponsors')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingSponsor) {
      return res.status(400).json({ 
        message: 'Ya existe un sponsor con ese nombre' 
      })
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop()
    const path = `sponsors/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
    
    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('sponsors-logos')
      .upload(path, file.data, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype  // Agregar content type explícito
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return res.status(500).json({ 
        message: 'Error al subir el logo del sponsor' 
      })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('sponsors-logos')
      .getPublicUrl(path)

    // Crear sponsor en la base de datos
    const { data, error } = await supabase
      .from('sponsors')
      .insert({ 
        name: name.trim(), 
        logo_url: publicUrl 
      })
      .select()

    if (error) {
      // Si falla la inserción, eliminar el archivo subido
      await supabase.storage
        .from('sponsors-logos')
        .remove([path])
      throw error
    }

    console.log(`✅ Sponsor creado: ${name} - Logo: ${publicUrl}`)

    res.status(201).json({
      message: 'Sponsor creado exitosamente',
      sponsor: data[0]
    })
  } catch (err) {
    console.error('Error creating sponsor:', err)
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor' 
    })
  }
}

export async function updateSponsor(req, res) {
  try {
    const { id } = req.params
    const { name } = req.body
    const file = req.files?.file

    // DEBUG: Log de información del archivo
    console.log('🔍 DEBUG UPDATE - Información del archivo:')
    console.log('req.files:', req.files)
    console.log('file:', file)
    if (file) {
      console.log('file.name:', file.name)
      console.log('file.mimetype:', file.mimetype)
      console.log('file.size:', file.size)
      console.log('file.data type:', typeof file.data)
    }

    // Validar que el ID sea un UUID válido
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de sponsor inválido' 
      })
    }

    // Obtener sponsor actual
    const { data: currentSponsor, error: fetchError } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!currentSponsor) {
      return res.status(404).json({ 
        message: 'Sponsor no encontrado' 
      })
    }

    const updates = {}

    // Validar y actualizar nombre si se proporciona
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ 
          message: 'El nombre del sponsor no puede estar vacío' 
        })
      }

      // Verificar si ya existe otro sponsor con ese nombre
      const { data: existingSponsor, error: checkError } = await supabase
        .from('sponsors')
        .select('id')
        .eq('name', name.trim())
        .neq('id', id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingSponsor) {
        return res.status(400).json({ 
          message: 'Ya existe otro sponsor con ese nombre' 
        })
      }

      updates.name = name.trim()
    }

    // Manejar actualización de logo si se proporciona
    if (file) {
      // Validar tipo de archivo
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ 
          message: 'El archivo debe ser una imagen válida (JPG, PNG, GIF, etc.)' 
        })
      }

      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return res.status(400).json({ 
          message: 'El archivo no puede ser mayor a 5MB' 
        })
      }

      // Eliminar archivo anterior
      try {
        // Extraer la ruta completa del archivo desde la URL
        const urlParts = currentSponsor.logo_url.split('/storage/v1/object/public/sponsors-logos/')
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1]
          console.log('🗑️ Eliminando archivo anterior:', oldFilePath)
          console.log('🔗 URL completa:', currentSponsor.logo_url)
          
          const { error: removeError } = await supabase.storage
            .from('sponsors-logos')
            .remove([oldFilePath])
          
          if (removeError) {
            console.warn('❌ Error eliminando archivo anterior:', removeError)
          } else {
            console.log('✅ Archivo anterior eliminado exitosamente')
          }
        } else {
          console.warn('❌ No se pudo extraer la ruta del archivo de la URL:', currentSponsor.logo_url)
        }
      } catch (removeError) {
        console.warn('❌ Error al procesar eliminación del archivo anterior:', removeError)
      }

      // Generar nombre único para el nuevo archivo
      const fileExtension = file.name.split('.').pop()
      const path = `sponsors/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`

      // Subir nuevo archivo
      const { error: uploadError } = await supabase.storage
        .from('sponsors-logos')
        .upload(path, file.data, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype  // Agregar content type explícito
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        return res.status(500).json({ 
          message: 'Error al subir el nuevo logo del sponsor' 
        })
      }

      // Obtener URL pública del nuevo archivo
      const { data: { publicUrl } } = supabase.storage
        .from('sponsors-logos')
        .getPublicUrl(path)

      updates.logo_url = publicUrl
    }

    // Si no hay actualizaciones, retornar error
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        message: 'No se proporcionaron datos para actualizar' 
      })
    }

    // Actualizar sponsor en la base de datos
    const { data, error } = await supabase
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    if (!data.length) {
      return res.status(404).json({ 
        message: 'Sponsor no encontrado' 
      })
    }

    console.log(`✅ Sponsor actualizado: ${data[0].name}`)

    res.json({
      message: 'Sponsor actualizado exitosamente',
      sponsor: data[0]
    })
  } catch (err) {
    console.error('Error updating sponsor:', err)
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor' 
    })
  }
}

export async function uploadSponsorLogo(req, res) {
    try {
      const { file } = req.files
      
      // Add file type validation
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'File must be an image' })
      }
  
      const path = `${Date.now()}_${file.name}`
      
      const { data, error } = await supabase.storage
        .from('sponsors-logos')
        .upload(path, file.data)
  
      if (error) throw error
  
      // Get the public URL using Supabase's getPublicUrl method
      const { data: { publicUrl } } = supabase.storage
        .from('sponsors-logos')
        .getPublicUrl(path)
  
      res.json({ url: publicUrl })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

export async function deleteSponsor(req, res) {
  try {
    const { id } = req.params

    // Validar que el ID sea un UUID válido
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de sponsor inválido' 
      })
    }

    // Obtener sponsor para verificar que existe y obtener la URL del logo
    const { data: sponsor, error: fetchError } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!sponsor) {
      return res.status(404).json({ 
        message: 'Sponsor no encontrado' 
      })
    }

    // Verificar si el sponsor está siendo usado en algún torneo
    const { data: tournamentSponsors, error: checkError } = await supabase
      .from('tournament_sponsors')
      .select('tournament_id')
      .eq('sponsor_id', id)

    if (checkError) throw checkError

    if (tournamentSponsors && tournamentSponsors.length > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el sponsor "${sponsor.name}" porque está siendo usado en ${tournamentSponsors.length} torneo(s). Primero debe desasignarlo de todos los torneos.` 
      })
    }

    // Eliminar archivo del storage
    try {
      // Extraer la ruta completa del archivo desde la URL
      const urlParts = sponsor.logo_url.split('/storage/v1/object/public/sponsors-logos/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        console.log('🗑️ Eliminando archivo del storage:', filePath)
        console.log('🔗 URL completa:', sponsor.logo_url)
        
        const { error: storageError } = await supabase.storage
          .from('sponsors-logos')
          .remove([filePath])

        if (storageError) {
          console.warn('❌ Error eliminando archivo del storage:', storageError)
        } else {
          console.log('✅ Archivo del storage eliminado exitosamente')
        }
      } else {
        console.warn('❌ No se pudo extraer la ruta del archivo de la URL:', sponsor.logo_url)
      }
    } catch (removeError) {
      console.warn('❌ Error al procesar URL del archivo:', removeError)
    }

    // Eliminar sponsor de la base de datos
    const { error: deleteError } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    console.log(`✅ Sponsor eliminado: ${sponsor.name}`)

    res.json({ 
      message: `Sponsor "${sponsor.name}" eliminado exitosamente` 
    })
  } catch (err) {
    console.error('Error deleting sponsor:', err)
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor' 
    })
  }
}

// ===== FUNCIONES PARA GESTIONAR SPONSORS DE TORNEOS =====

export async function getTournamentSponsors(req, res) {
  try {
    const { tournamentId } = req.params

    // Validar que el ID sea un UUID válido
    if (!tournamentId || !tournamentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de torneo inválido' 
      })
    }

    // Verificar que el torneo existe
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', tournamentId)
      .single()

    if (tournamentError) throw tournamentError
    if (!tournament) {
      return res.status(404).json({ 
        message: 'Torneo no encontrado' 
      })
    }

    // Obtener sponsors del torneo
    const { data: sponsors, error } = await supabase
      .from('tournament_sponsors')
      .select(`
        sponsor_id,
        sponsors (
          id,
          name,
          logo_url,
          created_at
        )
      `)
      .eq('tournament_id', tournamentId)

    if (error) throw error

    // Formatear respuesta
    const formattedSponsors = (sponsors || []).map(item => ({
      id: item.sponsors.id,
      name: item.sponsors.name,
      logo_url: item.sponsors.logo_url,
      created_at: item.sponsors.created_at
    }))

    res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name
      },
      sponsors: formattedSponsors,
      total_sponsors: formattedSponsors.length
    })
  } catch (err) {
    console.error('Error getting tournament sponsors:', err)
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor' 
    })
  }
}

export async function assignSponsorToTournament(req, res) {
  try {
    const { tournamentId } = req.params
    const { sponsorId } = req.body

    // Validaciones básicas
    if (!sponsorId) {
      return res.status(400).json({ 
        message: 'ID del sponsor es requerido' 
      })
    }

    // Validar UUIDs
    if (!tournamentId || !tournamentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de torneo inválido' 
      })
    }

    if (!sponsorId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de sponsor inválido' 
      })
    }

    // Verificar que el torneo existe
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', tournamentId)
      .single()

    if (tournamentError) throw tournamentError
    if (!tournament) {
      return res.status(404).json({ 
        message: 'Torneo no encontrado' 
      })
    }

    // Verificar que el sponsor existe
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .select('id, name')
      .eq('id', sponsorId)
      .single()

    if (sponsorError) throw sponsorError
    if (!sponsor) {
      return res.status(404).json({ 
        message: 'Sponsor no encontrado' 
      })
    }

    // Verificar si ya está asignado
    const { data: existingAssignment, error: checkError } = await supabase
      .from('tournament_sponsors')
      .select('tournament_id, sponsor_id')
      .eq('tournament_id', tournamentId)
      .eq('sponsor_id', sponsorId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingAssignment) {
      return res.status(400).json({ 
        message: `El sponsor "${sponsor.name}" ya está asignado al torneo "${tournament.name}"` 
      })
    }

    // Asignar sponsor al torneo
    const { data, error } = await supabase
      .from('tournament_sponsors')
      .insert({
        tournament_id: tournamentId,
        sponsor_id: sponsorId
      })
      .select()

    if (error) throw error

    console.log(`✅ Sponsor "${sponsor.name}" asignado al torneo "${tournament.name}"`)

    res.status(201).json({
      message: `Sponsor "${sponsor.name}" asignado exitosamente al torneo "${tournament.name}"`,
      assignment: data[0]
    })
  } catch (err) {
    console.error('Error assigning sponsor to tournament:', err)
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor' 
    })
  }
}

export async function removeSponsorFromTournament(req, res) {
  try {
    const { tournamentId, sponsorId } = req.params

    // Validar UUIDs
    if (!tournamentId || !tournamentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de torneo inválido' 
      })
    }

    if (!sponsorId || !sponsorId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ 
        message: 'ID de sponsor inválido' 
      })
    }

    // Verificar que la asignación existe
    const { data: assignment, error: fetchError } = await supabase
      .from('tournament_sponsors')
      .select(`
        tournament_id,
        sponsor_id,
        tournaments (name),
        sponsors (name)
      `)
      .eq('tournament_id', tournamentId)
      .eq('sponsor_id', sponsorId)
      .single()

    if (fetchError) throw fetchError
    if (!assignment) {
      return res.status(404).json({ 
        message: 'Asignación de sponsor no encontrada' 
      })
    }

    // Eliminar asignación
    const { error: deleteError } = await supabase
      .from('tournament_sponsors')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('sponsor_id', sponsorId)

    if (deleteError) throw deleteError

    console.log(`✅ Sponsor "${assignment.sponsors.name}" removido del torneo "${assignment.tournaments.name}"`)

    res.json({
      message: `Sponsor "${assignment.sponsors.name}" removido exitosamente del torneo "${assignment.tournaments.name}"`
    })
  } catch (err) {
    console.error('Error removing sponsor from tournament:', err)
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor' 
    })
  }
}  