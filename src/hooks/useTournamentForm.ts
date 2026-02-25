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

/** Configuración específica para torneo Americano (solo cuando tournament_type === 'AMERICANO') */
export interface AmericanoConfig {
  scoring_mode: 'points' | 'sets';
  max_players: 4 | 8 | 12 | 16;
  points_per_match?: 16 | 24 | 32 | 40;
  sets_per_match?: 1 | 2 | 3;
  games_to_win_set?: number;
  tie_break_at?: number;
}

export interface TournamentFormData {
  // Paso 1: Información Básica
  name: string;
  categories: string[];
  start_date: string;
  end_date: string;
  courts_available: number;
  tournament_type: 'SIX_PLAYERS' | 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS' | 'AMERICANO';
  tournament_thumbnail: File | null;
  thumbnail_url?: string | null;
  requires_shirts: boolean;
  /** Solo cuando tournament_type === 'AMERICANO' */
  americano_config?: AmericanoConfig;
  // ✨ Multi-sede support
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
  group_time_slots: [],
  americano_config: undefined
};

/**
 * Genera franjas horarias estándar (fallback local cuando el backend no está disponible).
 * Días 1..(N-1) = fase de grupos; Día N = eliminatorias.
 * - Día 1: 2 franjas (Tarde, Noche)
 * - Días 2..N-1: 4 franjas cada uno (Mañana, Mediodía, Tarde, Noche)
 * - Día N: 2 franjas (eliminatorias)
 * Mínimo 3 días para coincidir con validación del backend.
 */
export function generateDefaultFranjas(startDate: string, endDate: string): TournamentFormData['group_time_slots'] {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (durationDays < 3) return [];

  const dayDates: string[] = [];
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dayDates.push(d.toISOString().split('T')[0]);
  }

  const franjas: TournamentFormData['group_time_slots'] = [];
  franjas.push(
    { id: 'franja_day1_tarde', label: 'Día 1 Tarde', day: 1, tournament_day: 1, date: dayDates[0], start_time: '17:00', end_time: '21:00' },
    { id: 'franja_day1_noche', label: 'Día 1 Noche', day: 1, tournament_day: 1, date: dayDates[0], start_time: '21:00', end_time: '00:00' }
  );

  const groupLabels = ['Mañana', 'Mediodía', 'Tarde', 'Noche'];
  const groupSlots = [
    { start_time: '08:00', end_time: '13:00' },
    { start_time: '13:00', end_time: '18:00' },
    { start_time: '18:00', end_time: '22:00' },
    { start_time: '22:00', end_time: '01:00' },
  ];
  for (let dayNum = 2; dayNum < durationDays; dayNum++) {
    const date = dayDates[dayNum - 1];
    groupLabels.forEach((label, idx) => {
      const slot = groupSlots[idx];
      franjas.push({
        id: `franja_day${dayNum}_${label.toLowerCase()}`,
        label: `Día ${dayNum} ${label}`,
        day: dayNum,
        tournament_day: dayNum,
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      });
    });
  }

  const lastDate = dayDates[durationDays - 1];
  franjas.push(
    { id: `franja_day${durationDays}_manana`, label: `Día ${durationDays} Mañana`, day: durationDays, tournament_day: durationDays, date: lastDate, start_time: '08:00', end_time: '13:00' },
    { id: `franja_day${durationDays}_tarde`, label: `Día ${durationDays} Tarde`, day: durationDays, tournament_day: durationDays, date: lastDate, start_time: '14:00', end_time: '19:00' }
  );

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

    const isAmericano = data.tournament_type === 'AMERICANO';
    if (isAmericano) {
      // Americano: validar config
      const ac = data.americano_config;
      if (!ac) {
        newErrors.americano_config = 'Configuración del torneo americano requerida';
      } else {
        if (![4, 8, 12, 16].includes(ac.max_players)) {
          newErrors.americano_config = 'Cantidad de jugadores debe ser 4, 8, 12 o 16';
        }
        if (!ac.scoring_mode || !['points', 'sets'].includes(ac.scoring_mode)) {
          newErrors.americano_config = (newErrors.americano_config as string) || 'Seleccione puntuación: a puntos o a sets';
        }
        if (ac.scoring_mode === 'points' && ![16, 24, 32, 40].includes(ac.points_per_match ?? 0)) {
          newErrors.americano_config = (newErrors.americano_config as string) || 'Puntos por partido: 16, 24, 32 o 40';
        }
        if (ac.scoring_mode === 'sets' && ![1, 2, 3].includes(ac.sets_per_match ?? 0)) {
          newErrors.americano_config = (newErrors.americano_config as string) || 'Sets por partido: 1, 2 o 3';
        }
      }
      // Americano no requiere franjas ni imagen obligatoria ni sedes (se usa 1 cancha por defecto)
    } else {
      // Formato clásico: validar venues
      if (!data.venues || data.venues.length === 0) {
        newErrors.venues = 'Debe seleccionar al menos una sede con canchas';
      } else {
        const venuesWithoutCourts = data.venues.filter(v => !v.court_ids || v.court_ids.length === 0);
        if (venuesWithoutCourts.length > 0) {
          newErrors.venues = 'Cada sede debe tener al menos una cancha seleccionada';
        }
        const totalCourts = data.venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0);
        if (totalCourts === 0) {
          newErrors.venues = 'Debe seleccionar al menos una cancha en total';
        }
      }

      if (!data.tournament_thumbnail) {
        newErrors.tournament_thumbnail = t('create.validation.imageRequired');
      }

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

        // ✨ Calcular courts_available desde venues (formato clásico) o 1 para Americano sin sedes
        let courtsAvailable = data.courts_available;
        if (data.tournament_type === 'AMERICANO') {
          courtsAvailable = (data.venues && data.venues.length > 0)
            ? data.venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0)
            : 1;
        } else if (data.venues && data.venues.length > 0) {
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
          americano_config: data.tournament_type === 'AMERICANO' ? data.americano_config : undefined,
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