import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { tournamentCreationService, TournamentCreationData } from '@/services/tournamentCreationService';

interface TournamentResponse {
  id: string;
  tournament_info?: {
    tournament_id: string;
  };
}

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

  // Paso 2: Información Detallada
  description: string;
  rules: string;
  tournament_location: string;
  tournament_address: string;
  tournament_club_name: string; // Campo requerido por el backend
  signup_limit_date: string;
  inscription_cost: number;
  sponsors: string[];
  first_place_prize: string;
  second_place_prize: string;
  third_place_prize: string;
  time_slots: number[][];
  group_time_slots: {
    id: string;
    day: string;
    start: string;
    end: string;
    label: string;
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
  description: '',
  rules: '',
  tournament_location: '',
  tournament_address: '',
  tournament_club_name: '',
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
  group_time_slots: [
    { id: 'fri_night', day: 'friday', start: '18:00', end: '23:30', label: 'Viernes noche' },
    { id: 'sat_morning', day: 'saturday', start: '09:00', end: '13:00', label: 'Sábado mañana' },
    { id: 'sat_afternoon', day: 'saturday', start: '14:00', end: '22:00', label: 'Sábado tarde' },
  ]
};

export function useTournamentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormErrors = Record<string, string | null | undefined>;

  const [errors, setErrors] = useState<FormErrors>({});

  const validateFirstStep = (data: TournamentFormData) => {
    const newErrors: FormErrors = {};

    if (!data.name.trim()) {
      newErrors.name = 'El nombre del torneo es requerido';
    }

    if (!data.categories.length) {
      newErrors.categories = 'Debes seleccionar al menos una categoría';
    }

    if (!data.start_date) {
      newErrors.start_date = 'La fecha de inicio es requerida';
    }

    if (!data.end_date) {
      newErrors.end_date = 'La fecha de fin es requerida';
    }

    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (!data.courts_available || data.courts_available < 1) {
      newErrors.courts_available = 'Debe haber al menos una cancha disponible';
    }

    if (!data.tournament_thumbnail) {
      newErrors.tournament_thumbnail = 'La imagen del torneo es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecondStep = (data: TournamentFormData) => {
    const newErrors: FormErrors = {};

    if (!data.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!data.rules.trim()) {
      newErrors.rules = 'Las reglas del torneo son requeridas';
    }

    if (!data.tournament_location.trim()) {
      newErrors.tournament_location = 'La ubicación del torneo es requerida';
    }

    if (!data.tournament_address.trim()) {
      newErrors.tournament_address = 'La dirección del torneo es requerida';
    }

    if (!data.tournament_club_name.trim()) {
      newErrors.tournament_club_name = 'El nombre del club es requerido';
    }

    if (!data.signup_limit_date) {
      newErrors.signup_limit_date = 'La fecha límite de inscripción es requerida';
    }

    if (data.inscription_cost < 0) {
      newErrors.inscription_cost = 'El costo de inscripción no puede ser negativo';
    }

    if (!data.first_place_prize.trim()) {
      newErrors.first_place_prize = 'El premio para el primer lugar es requerido';
    }

    if (!data.second_place_prize.trim()) {
      newErrors.second_place_prize = 'El premio para el segundo lugar es requerido';
    }

    if (!data.third_place_prize.trim()) {
      newErrors.third_place_prize = 'El premio para el tercer lugar es requerido';
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
          
          const { error: uploadError, data: uploadData } = await supabase.storage
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
            title: "Error",
            description: "Error al subir la imagen",
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
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No estás autenticado');

        // Formatear datos para el backend
        const tournamentData: TournamentCreationData = {
          name: data.name.trim(),
          categories: data.categories,
          start_date: data.start_date,
          end_date: data.end_date,
          courts_available: data.courts_available,
          tournament_type: data.tournament_type,
          time_slots: data.time_slots,
          group_time_slots: [], // El backend genera estos dinámicamente
          description: data.description.trim(),
          rules: data.rules.trim(),
          tournament_location: data.tournament_location.trim(),
          tournament_address: data.tournament_address.trim(),
          tournament_club_name: data.tournament_club_name.trim(),
          signup_limit_date: data.signup_limit_date,
          inscription_cost: Number(data.inscription_cost) || 0,
          sponsor_ids: data.sponsors || [],
          tournament_thumbnail: data.thumbnail_url || '',
          first_place_prize: data.first_place_prize.trim(),
          second_place_prize: data.second_place_prize.trim(),
          third_place_prize: data.third_place_prize.trim()
        };

        // Validar datos antes de enviar
        const validation = tournamentCreationService.validateTournamentData(tournamentData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Formatear datos para el backend
        const formattedData = tournamentCreationService.formatDataForBackend(tournamentData);

        console.log('Enviando datos al backend:', formattedData);

        // Crear torneo usando el servicio
        const result = await tournamentCreationService.createTournament(formattedData, token);
        
        console.log('Respuesta del backend:', result);

        if (result.torneos && result.torneos.length > 0) {
          // Verificar que cada torneo tenga su información adicional
          const allHaveInfo = result.torneos.every((torneo: TournamentResponse) => 
            torneo.tournament_info && 
            torneo.tournament_info.tournament_id === torneo.id
          );

          if (allHaveInfo) {
            toast({
              title: "¡Éxito!",
              description: `Se han creado ${result.torneos.length} torneo(s) correctamente`
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
          title: "Error",
          description: error instanceof Error ? error.message : 'Error al crear el torneo',
          variant: "destructive"
        });
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