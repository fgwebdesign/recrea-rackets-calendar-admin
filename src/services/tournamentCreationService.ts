import { API_BASE_URL } from './tournamentService';
import { VenueConfig } from '@/types/venue';
import type { AmericanoConfig } from '@/hooks/useTournamentForm';

export interface TournamentCreationData {
  // Información básica del torneo
  name: string;
  categories: string[];
  start_date: string;
  end_date: string;
  courts_available: number;
  tournament_type: 'SIX_PLAYERS' | 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS' | 'AMERICANO';
  americano_config?: AmericanoConfig;
  time_slots: number[][];
  group_time_slots: {
    id: string;
    label: string;
    day?: number;
    tournament_day: number;
    date: string;
    start_time: string;
    end_time: string;
  }[];
  requires_shirts: boolean;
  // ✨ NUEVO: Multi-sede support
  venues?: VenueConfig[];
  /** Código compartido con otras categorías del mismo evento */
  common_code?: string;
  
  // Información detallada (tournament_info)
  description: string;
  rules: string;
  tournament_location: string;
  tournament_address: string;
  tournament_club_name: string;
  latitude?: number | null;
  longitude?: number | null;
  signup_limit_date: string;
  inscription_cost: number;
  sponsor_ids: string[];
  tournament_thumbnail: string;
  first_place_prize: string;
  second_place_prize: string;
  third_place_prize: string;
}

export interface TournamentCreationResponse {
  message: string;
  torneos: Array<{
    id: string;
    name: string;
    tournament_info: {
      tournament_id: string;
      description: string;
      rules: string;
      tournament_location: string;
      tournament_address: string;
      tournament_club_name: string;
      signup_limit_date: string;
      inscription_cost: number;
      sponsors: string;
      tournament_thumbnail: string;
      first_place_prize: string;
      second_place_prize: string;
      third_place_prize: string;
    };
  }>;
  notifications: {
    status: string;
    message: string;
  };
}

export interface DefaultFranjasResponse {
  message: string;
  franjas: TournamentCreationData['group_time_slots'];
  franjas_para_jugadores: TournamentCreationData['group_time_slots'];
}

export class TournamentCreationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/tournaments`;
  }

  /**
   * Obtener franjas estándar desde el backend (Día 1: 2, Día 2: 4, Día 3: 2).
   * GET /tournaments/default-franjas?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async getDefaultFranjas(startDate: string, endDate: string): Promise<DefaultFranjasResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    const response = await fetch(`${this.baseUrl}/default-franjas?${params}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al obtener franjas estándar');
    }
    return response.json();
  }

  /**
   * Feature #8: Verificar torneos solapados en el mismo rango de fechas + sedes
   */
  async checkOverlapping(
    startDate: string,
    endDate: string,
    venueIds: string[] = []
  ): Promise<{
    overlapping: Array<{ id: string; name: string; start_date: string; end_date: string; common_code: string | null; category: string | null; has_common_code: boolean }>;
    warning: boolean;
    without_common_code_count: number;
    without_common_code: Array<{ id: string; name: string; category: string | null }>;
    existing_codes: string[];
  }> {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    venueIds.forEach(id => params.append('venue_ids[]', id));
    const res = await fetch(`${this.baseUrl}/check-overlapping?${params}`);
    if (!res.ok) return { overlapping: [], warning: false, without_common_code_count: 0, without_common_code: [], existing_codes: [] };
    return res.json();
  }

  /**
   * Crear un nuevo torneo con toda su información
   */
  async createTournament(data: TournamentCreationData, token: string): Promise<TournamentCreationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(this.handleBackendError(error));
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  /**
   * Validar datos del torneo antes de enviar
   */
  validateTournamentData(data: TournamentCreationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const isAmericano = data.tournament_type === 'AMERICANO';

    if (!data.name?.trim()) {
      errors.push('El nombre del torneo es requerido');
    }

    if (!Array.isArray(data.categories) || data.categories.length === 0) {
      errors.push('Debe seleccionar al menos una categoría');
    }

    if (!data.start_date) {
      errors.push('La fecha de inicio es requerida');
    }

    if (!data.end_date) {
      errors.push('La fecha de fin es requerida');
    }

    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    if (!['SIX_PLAYERS', 'NINE_PLAYERS', 'TWELVE_PLAYERS', 'SIXTEEN_PLAYERS', 'AMERICANO'].includes(data.tournament_type)) {
      errors.push('Tipo de torneo inválido');
    }

    if (isAmericano) {
      const ac = data.americano_config;
      if (!ac) {
        errors.push('Configuración del torneo americano es requerida');
      } else {
        if (![4, 8, 12, 16].includes(ac.max_players)) {
          errors.push('Americano: cantidad de jugadores debe ser 4, 8, 12 o 16');
        }
        if (ac.scoring_mode === 'points' && ![16, 24, 32, 40].includes(ac.points_per_match ?? 0)) {
          errors.push('Americano: puntos por partido debe ser 16, 24, 32 o 40');
        }
        if (ac.scoring_mode === 'sets' && ![1, 2, 3].includes(ac.sets_per_match ?? 0)) {
          errors.push('Americano: sets por partido debe ser 1, 2 o 3');
        }
      }
    } else {
      if (!data.venues || data.venues.length === 0) {
        errors.push('Debe seleccionar al menos una sede con canchas');
      } else {
        const venuesWithoutCourts = data.venues.filter(v => !v.court_ids || v.court_ids.length === 0);
        if (venuesWithoutCourts.length > 0) {
          errors.push('Cada sede debe tener al menos una cancha seleccionada');
        }
        const totalCourts = data.venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0);
        if (totalCourts === 0) {
          errors.push('Debe seleccionar al menos una cancha en total');
        }
      }

      if (!Array.isArray(data.group_time_slots) || data.group_time_slots.length === 0) {
        errors.push('Debe configurar al menos una franja horaria');
      } else {
        const invalidFranjas = data.group_time_slots.filter(
          f => !f.id || !f.label || !f.start_time || !f.end_time || !f.date || !f.tournament_day
        );
        if (invalidFranjas.length > 0) {
          errors.push('Todas las franjas deben tener campos completos (id, label, start_time, end_time, date, tournament_day)');
        }
      }
    }

    // Validaciones de información detallada
    if (!data.description?.trim()) {
      errors.push('La descripción es requerida');
    }

    if (!data.rules?.trim()) {
      errors.push('Las reglas del torneo son requeridas');
    }

    if (!data.tournament_location?.trim()) {
      errors.push('La ubicación del torneo es requerida');
    }

    if (!data.tournament_address?.trim()) {
      errors.push('La dirección del torneo es requerida');
    }

    if (!data.tournament_club_name?.trim()) {
      errors.push('El nombre del club es requerido');
    }

    if (!data.signup_limit_date) {
      errors.push('La fecha límite de inscripción es requerida');
    }

    if (data.inscription_cost < 0) {
      errors.push('El costo de inscripción no puede ser negativo');
    }

    if (!data.first_place_prize?.trim()) {
      errors.push('El premio para el primer lugar es requerido');
    }

    if (!data.second_place_prize?.trim()) {
      errors.push('El premio para el segundo lugar es requerido');
    }

    if (!data.third_place_prize?.trim()) {
      errors.push('El premio para el tercer lugar es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Manejar errores específicos del backend
   */
  private handleBackendError(error: unknown): string {
    const err = error as { message?: string; error?: string; errors?: string[] };
    if (err.message) {
      return err.message;
    } else if (err.error) {
      return err.error;
    } else if (Array.isArray(err.errors)) {
      return err.errors.join(', ');
    } else {
      return 'Error al crear el torneo';
    }
  }

  /**
   * Formatear datos para envío al backend
   */
  formatDataForBackend(data: TournamentCreationData): TournamentCreationData {
    return {
      ...data,
      name: data.name.trim(),
      description: data.description.trim(),
      rules: data.rules.trim(),
      tournament_location: data.tournament_location.trim(),
      tournament_address: data.tournament_address.trim(),
      tournament_club_name: data.tournament_club_name.trim(),
      first_place_prize: data.first_place_prize.trim(),
      second_place_prize: data.second_place_prize.trim(),
      third_place_prize: data.third_place_prize.trim(),
      inscription_cost: Number(data.inscription_cost) || 0,
      sponsor_ids: data.sponsor_ids || [],
      group_time_slots: data.group_time_slots
    };
  }
}

// Instancia singleton del servicio
export const tournamentCreationService = new TournamentCreationService();
