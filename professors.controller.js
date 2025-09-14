import { supabase } from '../config/supabaseClient.js'

export async function getProfessors(req, res) {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) {
      return res.status(500).json({ message: error.message })
    }
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function getAllProfessors(req, res) {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      return res.status(500).json({ message: error.message })
    }
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function createProfessor(req, res) {
  try {
    const { 
      name, 
      description, 
      specializations = [], 
      experience_years = 0,
      availability_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      availability_hours,
      instagram_handle,
      whatsapp_number
    } = req.body
    
    const { file } = req.files || {}

    // Validaciones básicas
    if (!name || !description || !availability_hours) {
      return res.status(400).json({ 
        message: 'Nombre, descripción y horarios de disponibilidad son requeridos' 
      })
    }

    // Validar que specializations sea un array
    let parsedSpecializations = specializations;
    
    // Si viene como string JSON, parsearlo
    if (typeof specializations === 'string') {
      try {
        parsedSpecializations = JSON.parse(specializations);
      } catch (error) {
        return res.status(400).json({ 
          message: 'Formato inválido para las especialidades' 
        })
      }
    }
    
    if (!Array.isArray(parsedSpecializations)) {
      return res.status(400).json({ 
        message: 'Las especialidades deben ser un array' 
      })
    }

    // Validar especialidades válidas
    const validSpecializations = [
      // Pádel
      'Todos los niveles', 'Principiantes', 'Nivel Intermedio', 'Avanzado',
      'Entrenamiento personalizado', 'Clases grupales', 'Técnica básica', 
      'Técnica avanzada', 'Torneos y competencias',
      // Fútbol
      'Entrenador de fútbol', 'Preparador físico', 'Técnica de fútbol', 
      'Táctica de fútbol', 'Fútbol juvenil', 'Fútbol competitivo', 
      'Entrenamiento de porteros',
      // Salud y Bienestar
      'Fisioterapeuta', 'Masajista deportivo', 'Rehabilitación deportiva',
      'Prevención de lesiones', 'Nutrición deportiva', 'Psicología deportiva',
      // Otros Servicios
      'Coordinador deportivo', 'Árbitro de pádel', 'Árbitro de fútbol',
      'Instructor de fitness', 'Yoga para deportistas', 'Pilates terapéutico'
    ]

    for (const spec of parsedSpecializations) {
      if (!validSpecializations.includes(spec)) {
        return res.status(400).json({ 
          message: `Especialidad inválida: "${spec}". Especialidades válidas: ${validSpecializations.join(', ')}` 
        })
      }
    }

    // Validar que availability_days sea un array
    let parsedAvailabilityDays = availability_days;
    
    // Si viene como string JSON, parsearlo
    if (typeof availability_days === 'string') {
      try {
        parsedAvailabilityDays = JSON.parse(availability_days);
      } catch (error) {
        return res.status(400).json({ 
          message: 'Formato inválido para los días de disponibilidad' 
        })
      }
    }
    
    if (!Array.isArray(parsedAvailabilityDays)) {
      return res.status(400).json({ 
        message: 'Los días de disponibilidad deben ser un array' 
      })
    }

    let photo_url = null

    // Manejar subida de foto si se proporciona
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'El archivo debe ser una imagen' })
      }

      const path = `professors/${Date.now()}_${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('tournament-thumbnails')
        .upload(path, file.data)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('tournament-thumbnails')
        .getPublicUrl(path)

      photo_url = publicUrl
    }

    const { data, error } = await supabase
      .from('professors')
      .insert({ 
        name,
        description,
        specializations: parsedSpecializations,
        experience_years,
        availability_days: parsedAvailabilityDays,
        availability_hours,
        instagram_handle,
        whatsapp_number,
        photo_url
      })
      .select()

    if (error) {
      // Si hay error, limpiar archivo subido
      if (file && photo_url) {
        const fileKey = photo_url.split('/').pop()
        await supabase.storage
          .from('tournament-thumbnails')
          .remove([`professors/${fileKey}`])
      }
      throw error
    }

    res.status(201).json({
      message: 'Profesor creado exitosamente',
      professor: data[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function getProfessor(req, res) {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      return res.status(500).json({ message: error.message })
    }
    
    if (!data) {
      return res.status(404).json({ message: 'Profesor no encontrado' })
    }
    
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function updateProfessor(req, res) {
  try {
    const { id } = req.params
    const { 
      name, 
      description, 
      specializations, 
      experience_years,
      availability_days,
      availability_hours,
      instagram_handle,
      whatsapp_number,
      is_active
    } = req.body
    
    const file = req.files?.file

    // Verificar que el profesor existe
    const { data: currentProfessor, error: fetchError } = await supabase
      .from('professors')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!currentProfessor) {
      return res.status(404).json({ message: 'Profesor no encontrado' })
    }

    const updates = {}
    
    // Actualizar campos si se proporcionan
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (specializations !== undefined) {
      let parsedSpecializations = specializations;
      
      // Si viene como string JSON, parsearlo
      if (typeof specializations === 'string') {
        try {
          parsedSpecializations = JSON.parse(specializations);
        } catch (error) {
          return res.status(400).json({ 
            message: 'Formato inválido para las especialidades' 
          })
        }
      }
      
      if (!Array.isArray(parsedSpecializations)) {
        return res.status(400).json({ 
          message: 'Las especialidades deben ser un array' 
        })
      }
      updates.specializations = parsedSpecializations
    }
    if (experience_years !== undefined) updates.experience_years = experience_years
    if (availability_days !== undefined) {
      let parsedAvailabilityDays = availability_days;
      
      // Si viene como string JSON, parsearlo
      if (typeof availability_days === 'string') {
        try {
          parsedAvailabilityDays = JSON.parse(availability_days);
        } catch (error) {
          return res.status(400).json({ 
            message: 'Formato inválido para los días de disponibilidad' 
          })
        }
      }
      
      if (!Array.isArray(parsedAvailabilityDays)) {
        return res.status(400).json({ 
          message: 'Los días de disponibilidad deben ser un array' 
        })
      }
      updates.availability_days = parsedAvailabilityDays
    }
    if (availability_hours !== undefined) updates.availability_hours = availability_hours
    if (instagram_handle !== undefined) updates.instagram_handle = instagram_handle
    if (whatsapp_number !== undefined) updates.whatsapp_number = whatsapp_number
    if (is_active !== undefined) updates.is_active = is_active

    // Manejar actualización de foto
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'El archivo debe ser una imagen' })
      }

      // Eliminar foto anterior si existe
      if (currentProfessor.photo_url) {
        const oldFileKey = currentProfessor.photo_url.split('/').pop()
        await supabase.storage
          .from('tournament-thumbnails')
          .remove([`professors/${oldFileKey}`])
      }

      // Subir nueva foto
      const path = `professors/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('tournament-thumbnails')
        .upload(path, file.data)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('tournament-thumbnails')
        .getPublicUrl(path)

      updates.photo_url = publicUrl
    }

    // Actualizar timestamp
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('professors')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    if (!data.length) {
      return res.status(404).json({ message: 'Profesor no encontrado' })
    }

    res.json({
      message: 'Profesor actualizado exitosamente',
      professor: data[0]
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function deleteProfessor(req, res) {
  try {
    const { id } = req.params

    // Verificar que el profesor existe
    const { data: professor, error: fetchError } = await supabase
      .from('professors')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!professor) {
      return res.status(404).json({ message: 'Profesor no encontrado' })
    }

    // Eliminar foto del storage si existe
    if (professor.photo_url) {
      const fileKey = professor.photo_url.split('/').pop()
      const { error: storageError } = await supabase.storage
        .from('tournament-thumbnails')
        .remove([`professors/${fileKey}`])

      if (storageError) {
        console.warn('Error eliminando foto del storage:', storageError)
      }
    }

    // Eliminar profesor de la base de datos
    const { error: deleteError } = await supabase
      .from('professors')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    res.json({ message: 'Profesor eliminado exitosamente' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
