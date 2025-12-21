export interface Venue {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  description?: string;
  logo_url?: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  opening_hours?: OpeningHours;
  amenities?: string[];
  social_links?: Record<string, string>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  courts?: Court[];
  courts_count?: number;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;  // "08:00"
  close: string; // "23:00"
}

export interface VenueConfig {
  venue_id: string;
  court_ids: string[];
  is_primary: boolean;
}

export interface VenueWithCourts extends Venue {
  courts: Court[];
}

export interface Court {
  id: string;
  name: string;
  photo_url?: string;
  venue_id?: string;
}

