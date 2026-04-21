import { supabase } from '@/lib/supabase'

/** Bucket dedicado en Supabase Storage (crear con migración / dashboard + policies). */
export const FOOTBALL_TEAM_LOGOS_BUCKET = 'football-team-logos'

export async function uploadFootballTeamLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${fileExt}`
  const { error } = await supabase.storage.from(FOOTBALL_TEAM_LOGOS_BUCKET).upload(path, file)
  if (error) throw error
  const {
    data: { publicUrl }
  } = supabase.storage.from(FOOTBALL_TEAM_LOGOS_BUCKET).getPublicUrl(path)
  return publicUrl
}
