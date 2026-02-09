import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { tournamentCreationService, TournamentCreationData } from '@/services/tournamentCreationService';
import { tournamentService } from '@/services/tournamentService';
import { useTranslations } from '@/contexts/TranslationContext';

interface TournamentResponse {
  id: string;
  tournament_info?: {
    tournament_id: string;
  };
}

import { VenueConfig } from '@/types/venue';

export interface TournamentFormData {
  // Paso 1: Información Básica
  name: string;
  categories: string[];
  start_date: string;
  end_date: string;
  courts_available: number;
  tournament_type: 'SIX_PLAYERS' | 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS';
  tournament_thumbnail: File | null;
  thumbnail_url?: string | null;
  requires_shirts: boolean;
  // ✨ NUEVO: Multi-sede support
  venues?: VenueConfig[];

  // Paso 2: Información Detallada
  description: string;
  rules: string;
  rules_pdf?: File | null;
  tournament_location: string;
  tournament_address: string;
  tournament_club_name: string; // Campo requerido por el backend
  latitude?: number | null;
  longitude?: number | null;
  signup_limit_date: string;
  inscription_cost: number;
  sponsors: string[];
  first_place_prize: string;
  second_place_prize: string;
  third_place_prize: string;
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
}

const INITIAL_FORM_DATA: TournamentFormData = {
  name: '',
  categories: [],
  start_date: '',
  end_date: '',
  courts_available: 1,
  tournament_type: 'NINE_PLAYERS',
  tournament_thumbnail: null,
  requires_shirts: false,
  venues: [], // ✨ NUEVO: Multi-sede support
  description: '',
  rules: '',
  rules_pdf: null,
  tournament_location: '',
  tournament_address: '',
  tournament_club_name: '',
  latitude: null,
  longitude: null,
  signup_limit_date: '',
  inscription_cost: 0,
  sponsors: [],
  first_place_prize: '',
  second_place_prize: '',
  third_place_prize: '',
  time_slots: [
    [9, 13],   // mañana
    [14, 22],  // tarde/noche
  ],
  group_time_slots: []
};

/**
 * Genera las franjas horarias estándar a partir de las fechas del torneo.
 * Día 1 (viernes): Tarde 18-21, Noche 21-00
 * Día 2 (sábado): Mañana 09-13, Tarde 14-22
 *
 * IMPORTANTE: Solo se generan 2 días de torneo (patrón estándar Viernes + Sábado).
 * Si el rango de fechas incluye más días (ej. hasta Domingo), se ignoran.
 */
export function generateDefaultFranjas(startDate: string, endDate: string): TournamentFormData['group_time_slots'] {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const franjas: TournamentFormData['group_time_slots'] = [];
  let tournamentDay = 1;

  const current = new Date(start);
  // Solo 2 días de torneo (Día 1 y Día 2), aunque end_date sea más lejana
  while (current <= end && tournamentDay <= 2) {
    const dateStr = current.toISOString().split('T')[0];
    const dayName = dayNames[current.getDay()];
    const dayId = dateStr.replace(/-/g, '');

    if (tournamentDay === 1) {
      // Primer día: Tarde y Noche (típico viernes)
      franjas.push(
        {
          id: `franja_${dayId}_tarde`,
          label: `${dayName} Tarde`,
          day: tournamentDay,
          tournament_day: tournamentDay,
          date: dateStr,
          start_time: '18:00',
          end_time: '21:00',
        },
        {
          id: `franja_${dayId}_noche`,
          label: `${dayName} Noche`,
          day: tournamentDay,
          tournament_day: tournamentDay,
          date: dateStr,
          start_time: '21:00',
          end_time: '00:00',
        }
      );
    } else {
      // Demás días: Mañana y Tarde (típico sábado)
      franjas.push(
        {
          id: `franja_${dayId}_manana`,
          label: `${dayName} Mañana`,
          day: tournamentDay,
          tournament_day: tournamentDay,
          date: dateStr,
          start_time: '09:00',
          end_time: '13:00',
        },
        {
          id: `franja_${dayId}_tarde`,
          label: `${dayName} Tarde`,
          day: tournamentDay,
          tournament_day: tournamentDay,
          date: dateStr,
          start_time: '14:00',
          end_time: '22:00',
        }
      );
    }

    tournamentDay++;
    current.setDate(current.getDate() + 1);
  }

  return franjas;
}

export function useTournamentForm() {
  const router = useRouter();
  const t = useTranslations('tournaments');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormErrors = Record<string, string | null | undefined>;

  const [errors, setErrors] = useState<FormErrors>({});

  const validateFirstStep = (data: TournamentFormData) => {
    const newErrors: FormErrors = {};

    if (!data.name.trim()) {
      newErrors.name = t('create.validation.nameRequired');
    }

    if (!data.categories.length) {
      newErrors.categories = t('create.validation.categoriesRequired');
    }

    if (!data.start_date) {
      newErrors.start_date = t('create.validation.startDateRequired');
    }

    if (!data.end_date) {
      newErrors.end_date = t('create.validation.endDateRequired');
    }

    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      newErrors.end_date = t('create.validation.endDateAfterStart');
    }

    // ✨ NUEVO: Validar venues o courts_available
    if (!data.venues || data.venues.length === 0) {
      // Si no hay venues, validar courts_available como fallback
    if (!data.courts_available || data.courts_available < 1) {
      newErrors.courts_available = t('create.validation.courtsRequired');
      }
    } else {
      // Si hay venues, validar que cada venue tenga al menos una cancha
      const venuesWithoutCourts = data.venues.filter(v => !v.court_ids || v.court_ids.length === 0);
      if (venuesWithoutCourts.length > 0) {
        newErrors.venues = 'Cada sede debe tener al menos una cancha seleccionada';
      }
      // Calcular courts_available automáticamente desde venues
      const totalCourts = data.venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0);
      if (totalCourts === 0) {
        newErrors.venues = 'Debe seleccionar al menos una cancha en total';
      }
    }

    if (!data.tournament_thumbnail) {
      newErrors.tournament_thumbnail = t('create.validation.imageRequired');
    }

    // Validar franjas horarias
    if (!data.group_time_slots || data.group_time_slots.length === 0) {
      newErrors.group_time_slots = 'Debe configurar al menos una franja horaria';
    } else {
      const invalidFranjas = data.group_time_slots.filter(
        f => !f.id || !f.label || !f.start_time || !f.end_time || !f.date || !f.tournament_day
      );
      if (invalidFranjas.length > 0) {
        newErrors.group_time_slots = 'Todas las franjas deben tener ID, label, horarios, fecha y día de torneo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecondStep = (data: TournamentFormData) => {
    const newErrors: FormErrors = {};

    if (!data.description.trim()) {
      newErrors.description = t('create.validation.descriptionRequired');
    }

    if (!data.rules_pdf) {
      newErrors.rules_pdf = t('create.validation.rulesPdfRequired');
    }

    if (!data.tournament_location.trim()) {
      newErrors.tournament_location = t('create.validation.locationRequired');
    }

    if (!data.tournament_address.trim()) {
      newErrors.tournament_address = t('create.validation.addressRequired');
    }

    if (!data.tournament_club_name.trim()) {
      newErrors.tournament_club_name = t('create.validation.clubNameRequired');
    }

    if (!data.signup_limit_date) {
      newErrors.signup_limit_date = t('create.validation.signupLimitRequired');
    }

    if (data.inscription_cost < 0) {
      newErrors.inscription_cost = t('create.validation.costNegative');
    }

    if (!data.first_place_prize.trim()) {
      newErrors.first_place_prize = t('create.validation.firstPlaceRequired');
    }

    if (!data.second_place_prize.trim()) {
      newErrors.second_place_prize = t('create.validation.secondPlaceRequired');
    }

    if (!data.third_place_prize.trim()) {
      newErrors.third_place_prize = t('create.validation.thirdPlaceRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFirstStep = async (data: TournamentFormData) => {
    if (validateFirstStep(data)) {
      // Si hay una imagen, subirla primero
      let thumbnail_url = null;
      if (data.tournament_thumbnail) {
        try {
          const file = data.tournament_thumbnail;
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('tournament-thumbnails')
            .upload(fileName, file);

          if (uploadError) {
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('tournament-thumbnails')
            .getPublicUrl(fileName);

          thumbnail_url = publicUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: t('create.error.title'),
            description: t('create.error.uploadImage'),
            variant: "destructive"
          });
          return;
        }
      }

      setFormData({ ...data, thumbnail_url: thumbnail_url || undefined });
      setStep(2);
    }
  };

  const handleSecondStep = async (data: TournamentFormData) => {
    if (validateSecondStep(data)) {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error(t('create.error.notAuthenticated'));

        // ✨ Calcular courts_available desde venues si están disponibles
        let courtsAvailable = data.courts_available;
        if (data.venues && data.venues.length > 0) {
          courtsAvailable = data.venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0);
        }

        // Formatear datos para el backend
        const tournamentData: TournamentCreationData = {
          name: data.name.trim(),
          categories: data.categories,
          start_date: data.start_date,
          end_date: data.end_date,
          courts_available: courtsAvailable,
          tournament_type: data.tournament_type,
          time_slots: data.time_slots,
          group_time_slots: data.group_time_slots,
          requires_shirts: data.requires_shirts,
          description: data.description.trim(),
          rules: data.rules?.trim() || (data.rules_pdf ? 'Ver reglamento en PDF' : ''),
          tournament_location: data.tournament_location.trim(),
          tournament_address: data.tournament_address.trim(),
          tournament_club_name: data.tournament_club_name.trim(),
          signup_limit_date: data.signup_limit_date,
          inscription_cost: Number(data.inscription_cost) || 0,
          sponsor_ids: data.sponsors || [],
          tournament_thumbnail: data.thumbnail_url || '',
          first_place_prize: data.first_place_prize.trim(),
          second_place_prize: data.second_place_prize.trim(),
          third_place_prize: data.third_place_prize.trim(),
          venues: data.venues || [],
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        };

        // Validar datos antes de enviar
        const validation = tournamentCreationService.validateTournamentData(tournamentData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Formatear datos para el backend
        const formattedData = tournamentCreationService.formatDataForBackend(tournamentData);

        // Crear torneo usando el servicio
        const result = await tournamentCreationService.createTournament(formattedData, token);

        if (result.torneos && result.torneos.length > 0) {
          // Verificar que cada torneo tenga su información adicional
          const allHaveInfo = result.torneos.every((torneo: TournamentResponse) => 
            torneo.tournament_info && 
            torneo.tournament_info.tournament_id === torneo.id
          );

          if (allHaveInfo) {
            // Subir PDF del reglamento si se seleccionó uno
            let pdfOk = true;
            if (data.rules_pdf) {
              try {
                await Promise.all(
                  result.torneos.map((torneo: TournamentResponse) => 
                    tournamentService.uploadRulesPdf(torneo.id, data.rules_pdf!, token)
                  )
                );
              } catch (pdfError) {
                console.warn('Torneos creados pero error al subir PDF:', pdfError);
                pdfOk = false;
              }
            }
            toast({
              title: t('create.success.title'),
              description: pdfOk
                ? t('create.success.description').replace('{count}', result.torneos.length.toString())
                : t('create.success.description').replace('{count}', result.torneos.length.toString()) + '. El PDF no pudo subirse; puedes subirlo desde el detalle del torneo.'
            });
            router.push('/tournaments');
          } else {
            throw new Error('Algunos torneos se crearon pero falta su información adicional');
          }
        } else {
          throw new Error('No se recibió confirmación de la creación del torneo');
        }
      } catch (error) {
        console.error('Error creating tournament:', error);
        toast({
          title: t('create.error.title'),
          description: error instanceof Error ? error.message : t('create.error.createTournament'),
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return {
    step,
    formData,
    setFormData,
    isSubmitting,
    errors,
    handleFirstStep,
    handleSecondStep,
    handleBack
  };
}