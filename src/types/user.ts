export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  profile_photo?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
  onboarding_completed: boolean
}