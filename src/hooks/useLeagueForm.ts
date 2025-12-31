import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { VenueConfig } from '@/types/venue';

export interface LeagueFormData {
  name: string;
  categories: string[];
  description: string;
  inscription_cost: number;
  start_date: string;
  end_date: string;
  frequency: 'semanal' | 'quincenal' | 'mensual';
  days_of_week: string[];
  category_days: Record<string, string>;
  courts_available: number;
  points_for_win: number;
  points_for_loss_with_set: number;
  points_for_loss: number;
  points_for_walkover: number;
  status: string;
  team_size: number;
  image?: File | null;
  image_url?: string | null;
  // Nuevos campos
  league_type?: 'round_robin' | 'knockout' | 'groups' | 'custom';
  rounds?: 1 | 2;
  match_times?: string[];
  courts_per_time_slot?: number;
  venues?: VenueConfig[];
}

const INITIAL_FORM_DATA: LeagueFormData = {
  name: '',
  categories: [],
  description: '',
  inscription_cost: 0,
  start_date: '',
  end_date: '',
  frequency: 'quincenal',
  days_of_week: [],
  category_days: {},
  courts_available: 2,
  points_for_win: 2,
  points_for_loss_with_set: 1,
  points_for_loss: 0,
  points_for_walkover: 2,
  status: 'Inscribiendo',
  team_size: 8,
  image: null,
  image_url: null,
  // Nuevos campos
  league_type: 'round_robin',
  rounds: 1,
  match_times: ['21:30', '22:15'],
  courts_per_time_slot: 2,
  venues: []
};

export function useLeagueForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<LeagueFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFirstStep = (data: LeagueFormData) => {
    if (!Array.isArray(data.categories)) {
      toast({
        title: "Error de validación",
        description: "Las categorías deben ser un array",
        variant: "destructive"
      });
      return false;
    }

    if (data.categories.length < 3) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar al menos 3 categorías",
        variant: "destructive"
      });
      return false;
    }

    if (!data.name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre de la liga es requerido",
        variant: "destructive"
      });
      return false;
    }

    if (data.inscription_cost <= 0) {
      toast({
        title: "Error de validación",
        description: "El costo de inscripción debe ser mayor a 0",
        variant: "destructive"
      });
      return false;
    }

    if (data.team_size < 4 || data.team_size > 16) {
      toast({
        title: "Error de validación",
        description: "El número de equipos debe estar entre 4 y 16",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateSecondStep = (data: LeagueFormData) => {
    if (!data.start_date || !data.end_date) {
      toast({
        title: "Error de validación",
        description: "Las fechas de inicio y fin son requeridas",
        variant: "destructive"
      });
      return false;
    }

    // Verificar que todas las categorías tengan un día asignado
    const unassignedCategories = data.categories.filter(
      categoryId => !data.category_days[categoryId]
    );

    if (unassignedCategories.length > 0) {
      toast({
        title: "Error de validación",
        description: "Debes asignar un día de juego a todas las categorías seleccionadas",
        variant: "destructive"
      });
      return false;
    }

    if (!data.courts_available || data.courts_available < 1) {
      toast({
        title: "Error de validación",
        description: "Debe haber al menos una cancha disponible",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFirstStep = async (data: LeagueFormData) => {
    if (validateFirstStep(data)) {
      // Si hay una imagen, subirla primero
      let image_url = null;
      if (data.image) {
        try {
          const file = data.image;
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

          image_url = publicUrl;
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

      setFormData({ ...data, image_url });
      setStep(2);
    }
  };

  const handleSecondStep = (data: LeagueFormData) => {
    if (validateSecondStep(data)) {
      setFormData(data);
      setStep(3);
    }
  };

  const handleThirdStep = () => {
    // Validar que haya al menos una sede con canchas
    if (!formData.venues || formData.venues.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar al menos una sede",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.venues.every(v => v.court_ids.length > 0)) {
      toast({
        title: "Error de validación",
        description: "Cada sede seleccionada debe tener al menos una cancha",
        variant: "destructive"
      });
      return false;
    }

    setStep(4);
    return true;
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreateLeague = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      // Generar time_slots para cada categoría (mantener compatibilidad)
      const time_slots = formData.categories.map(() => [21, 24]);

      // Calcular courts_available desde venues si están definidos
      const courts_available = formData.venues && formData.venues.length > 0
        ? formData.venues.reduce((sum, v) => sum + v.court_ids.length, 0)
        : formData.courts_available;

      interface CreateLeaguePayload {
        name: string;
        categories: string[];
        description: string;
        inscription_cost: number;
        start_date: string;
        end_date: string;
        frequency: 'semanal' | 'quincenal' | 'mensual';
        time_slots: number[][];
        courts_available: number;
        team_size: number;
        image_url?: string | null;
        category_days: Record<string, string>;
        league_type?: 'round_robin' | 'knockout' | 'groups' | 'custom';
        rounds?: 1 | 2;
        match_times?: string[];
        courts_per_time_slot?: number;
        venues?: VenueConfig[];
      }

      // Normalizar frequency a minúsculas y validar tipo
      const frequencyValue = formData.frequency ? formData.frequency.toLowerCase() : 'quincenal';
      const normalizedFrequency: 'semanal' | 'quincenal' | 'mensual' = 
        (frequencyValue === 'semanal' || frequencyValue === 'quincenal' || frequencyValue === 'mensual')
          ? frequencyValue
          : 'quincenal';
      
      const payload: CreateLeaguePayload = {
        name: formData.name,
        categories: formData.categories,
        description: formData.description,
        inscription_cost: formData.inscription_cost,
        start_date: formData.start_date,
        end_date: formData.end_date,
        frequency: normalizedFrequency,
        time_slots,
        courts_available,
        team_size: formData.team_size,
        image_url: formData.image_url,
        category_days: formData.category_days,
        ...(formData.league_type && { league_type: formData.league_type }),
        ...(formData.rounds && { rounds: formData.rounds }),
        ...(formData.match_times && formData.match_times.length > 0 && { match_times: formData.match_times }),
        ...(formData.courts_per_time_slot && { courts_per_time_slot: formData.courts_per_time_slot }),
        ...(formData.venues && formData.venues.length > 0 && { venues: formData.venues })
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/createLeague`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la liga');
      }

      toast({
        title: "Éxito",
        description: "Liga creada exitosamente"
      });

      router.push('/leagues');
    } catch (error) {
      console.error('Error creating league:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la liga",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    formData,
    setFormData,
    isSubmitting,
    handleFirstStep,
    handleSecondStep,
    handleThirdStep,
    handleBack,
    handleCreateLeague
  };
} 