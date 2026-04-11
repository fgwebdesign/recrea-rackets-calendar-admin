export interface Professor {
  id: string;
  name: string;
  description: string;
  specializations: string[];
  experience_years: number;
  availability_days: string[];
  availability_hours: string;
  hourly_rate?: number;
  commission_percent?: number | null;
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
  hourly_rate?: number;
  commission_percent?: number | null;
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
  hourly_rate?: number;
  commission_percent?: number | null;
  instagram_handle?: string;
  whatsapp_number?: string;
  photo?: File | null;
  is_active?: boolean;
}

// Professor class (registro de clase/hora)
export interface ProfessorClass {
  id: string;
  professor_id: string;
  venue_id: string;
  court_id: string | null;
  class_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  amount_professor: number;
  amount_club: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  professor?: { id: string; name: string; hourly_rate?: number; commission_percent?: number | null };
  venue?: { id: string; name: string };
  court?: { id: string; name: string } | null;
}

export interface CreateProfessorClassData {
  professor_id: string;
  venue_id: string;
  court_id?: string | null;
  class_date: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
}

export interface UpdateProfessorClassData {
  venue_id?: string;
  court_id?: string | null;
  class_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string | null;
}

export interface ProfessorClassesSummary {
  total_classes: number;
  total_hours: number;
  total_amount_professor: number;
  total_amount_club: number;
  by_professor: Array<{
    professor_id: string;
    professor_name: string | null;
    total_hours: number;
    total_amount_professor: number;
    total_amount_club: number;
  }>;
  by_day: Array<{
    date: string;
    total_hours: number;
    total_amount_professor: number;
    total_amount_club: number;
  }>;
}

export interface ClubSettings {
  club_commission_percent: number;
}

/** Respuesta de GET /professors/:id/profile */
export interface ProfessorProfileData {
  professor: Professor & {
    effective_commission_percent: number;
    commission_source: 'professor' | 'club';
    club_default_commission_percent: number;
  };
  all_time: {
    total_classes: number;
    total_hours: number;
    total_amount_professor: number;
    total_amount_club: number;
    best_month: {
      month: string;        // YYYY-MM
      total_hours: number;
      total_classes: number;
    } | null;
  };
  recent_classes: ProfessorClass[];
}
