export interface Professor {
  id: string;
  name: string;
  description: string;
  specializations: string[];
  experience_years: number;
  availability_days: string[];
  availability_hours: string;
  instagram_handle?: string;
  whatsapp_number?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfessorData {
  name: string;
  description: string;
  specializations: string[];
  experience_years: number;
  availability_days: string[];
  availability_hours: string;
  instagram_handle?: string;
  whatsapp_number?: string;
  photo: File | null;
}

export interface UpdateProfessorData {
  name?: string;
  description?: string;
  specializations?: string[];
  experience_years?: number;
  availability_days?: string[];
  availability_hours?: string;
  instagram_handle?: string;
  whatsapp_number?: string;
  photo?: File | null;
  is_active?: boolean;
}
