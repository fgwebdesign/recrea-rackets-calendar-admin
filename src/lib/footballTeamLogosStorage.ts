import { supabase } from '@/lib/supabase'

/** Bucket dedicado en Supabase Storage (crear con migración / dashboard + policies). */
export const FOOTBALL_TEAM_LOGOS_BUCKET = 'football-team-logos'

/** Alineado a la migración del bucket (5 MB). */
export const MAX_TEAM_LOGO_BYTES = 5 * 1024 * 1024

/** Mismo límite que `MAX_TEAM_DISPLAY_NAME_LEN` en matchly-backend. */
export const MAX_TEAM_DISPLAY_NAME_LEN = 120

const ALLOWED_LOGO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
])

/** @returns mensaje de error o null si el archivo es aceptable */
export function validateTeamLogoFile(file: File): string | null {
  if (!file || !(file instanceof File)) return 'Archivo inválido'
  if (file.size <= 0) return 'Archivo vacío'
  if (file.size > MAX_TEAM_LOGO_BYTES) return `Máximo ${MAX_TEAM_LOGO_BYTES / (1024 * 1024)} MB por escudo`
  if (!ALLOWED_LOGO_MIME.has(file.type)) {
    return 'Formato no permitido (JPG, PNG, WebP, GIF o SVG)'
  }
  return null
}

export async function uploadFootballTeamLogo(file: File): Promise<string> {
  const invalid = validateTeamLogoFile(file)
  if (invalid) throw new Error(invalid)

  const fileExt = file.name.split('.').pop() || 'png'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${fileExt}`
  const { error } = await supabase.storage.from(FOOTBALL_TEAM_LOGOS_BUCKET).upload(path, file)
  if (error) throw error
  const {
    data: { publicUrl }
  } = supabase.storage.from(FOOTBALL_TEAM_LOGOS_BUCKET).getPublicUrl(path)
  return publicUrl
}
