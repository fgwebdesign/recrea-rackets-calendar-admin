import { API_BASE_URL } from './tournamentService';

export interface TournamentCreationData {
  // Información básica del torneo
  name: string;
  categories: string[];
  start_date: string;
  end_date: string;
  courts_available: number;
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS';
  time_slots: number[][];
  group_time_slots: any[]; // El backend genera estos dinámicamente
  
  // Información detallada (tournament_info)
  description: string;
  rules: string;
  tournament_location: string;
  tournament_address: string;
  tournament_club_name: string;
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

export class TournamentCreationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/tournaments`;
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

    // Validaciones básicas
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

    if (!data.courts_available || data.courts_available < 1) {
      errors.push('Debe haber al menos una cancha disponible');
    }

    if (!['NINE_PLAYERS', 'TWELVE_PLAYERS', 'SIXTEEN_PLAYERS'].includes(data.tournament_type)) {
      errors.push('Tipo de torneo inválido');
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
  private handleBackendError(error: any): string {
    if (error.message) {
      return error.message;
    } else if (error.error) {
      return error.error;
    } else if (Array.isArray(error.errors)) {
      return error.errors.join(', ');
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
      group_time_slots: [] // El backend genera estos dinámicamente
    };
  }
}

// Instancia singleton del servicio
export const tournamentCreationService = new TournamentCreationService();
