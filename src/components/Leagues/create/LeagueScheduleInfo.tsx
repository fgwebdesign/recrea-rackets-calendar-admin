import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryDayAssignment } from './CategoryDayAssignment';
import { Category } from '@/hooks/useCategories';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useCourts } from '@/hooks/useCourts';

const FREQUENCIES = ['Semanal', 'Quincenal', 'Mensual'];

interface LeagueScheduleInfoProps {
  formData: {
    start_date: string;
    end_date: string;
    frequency: string;
    days_of_week: string[];
    categories: string[];
    team_size: number;
    category_days: Record<string, string>;
  };
  setFormData: (data: any) => void;
  onSubmit: (data: any) => void;
  onBack: () => void;
  categories: Category[];
}

function LabelWithTooltip({ htmlFor, label, tooltip }: { htmlFor?: string; label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Label htmlFor={htmlFor} className="text-foreground dark:text-foreground">
        {label}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function calculateMinimumDays(teamSize: number, frequency: string): number {
  const numberOfRounds = teamSize - 1;
  
  // Restamos 1 ronda porque la primera fecha se juega en la semana inicial
  const remainingRounds = numberOfRounds - 1;
  
  switch(frequency.toLowerCase()) {
    case 'semanal':
      return remainingRounds * 7;
    case 'quincenal':
      return remainingRounds * 14;
    case 'mensual':
      return remainingRounds * 30;
    default:
      return remainingRounds * 14; // Por defecto quincenal
  }
}

// Agregar función helper para manejar fechas
function adjustDateToUruguay(date: Date): Date {
  // Crear fecha en timezone Uruguay (UTC-3)
  const uruguayOffset = -3 * 60; // offset en minutos
  const userOffset = date.getTimezoneOffset();
  const offsetDiff = userOffset - uruguayOffset;
  
  const adjustedDate = new Date(date.getTime() + offsetDiff * 60 * 1000);
  return adjustedDate;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function LeagueScheduleInfo({
  formData,
  setFormData,
  onSubmit,
  onBack,
  categories,
}: LeagueScheduleInfoProps) {
  const { courts, isLoading: isLoadingCourts, fetchCourts } = useCourts();
  const [errors, setErrors] = useState<string[]>([]);
  const [suggestedEndDate, setSuggestedEndDate] = useState<string>('');

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleDaysAssigned = (categoryDays: Record<string, string[]>) => {
    // Convertir el objeto de días por categoría a un formato más simple
    const categoryPlayDays = Object.entries(categoryDays).reduce((acc, [categoryId, days]) => {
      if (days && days.length > 0) {
        acc[categoryId] = days[0];
      }
      return acc;
    }, {} as Record<string, string>);

    console.log('🎯 Category days before update:', categoryDays);
    console.log('🎯 Category play days after conversion:', categoryPlayDays);

    // Actualizar el formData con los días asignados
    setFormData({
      ...formData,
      category_days: categoryPlayDays
    });

    console.log('🎯 Updated formData:', formData);

    // Limpiar errores relacionados con días de juego
    setErrors(errors.filter(error => !error.includes('día de juego')));
  };

  // Calcular fecha de fin sugerida cuando cambie la fecha de inicio o la frecuencia
  useEffect(() => {
    if (formData.start_date && formData.team_size) {
      const startDate = new Date(formData.start_date);
      const minimumDays = calculateMinimumDays(formData.team_size, formData.frequency);
      
      // Agregar un 5% más de días para flexibilidad
      const recommendedDays = Math.ceil(minimumDays * 1.05);
      
      const suggestedDate = adjustDateToUruguay(new Date(startDate));
      suggestedDate.setDate(startDate.getDate() + recommendedDays);
      
      const suggestedDateStr = formatDateForInput(suggestedDate);
      setSuggestedEndDate(suggestedDateStr);

      if (!formData.end_date) {
        setFormData({
          ...formData,
          end_date: suggestedDateStr
        });
      }
    }
  }, [formData.start_date, formData.team_size, formData.frequency]);

  // Validar el formulario antes de enviar
  const handleSubmit = () => {
    console.log('🚀 Submitting form with data:', formData);
    const newErrors: string[] = [];

    // Validar que todas las categorías tengan un día asignado
    const unassignedCategories = formData.categories.filter(
      categoryId => !formData.category_days[categoryId]
    );

    if (unassignedCategories.length > 0) {
      console.warn('⚠️ Found unassigned categories:', unassignedCategories);
      newErrors.push('Debes asignar un día de juego a todas las categorías');
      setErrors(newErrors);
      return;
    }

    // Validar fechas
    if (formData.start_date && formData.end_date) {
      const start = adjustDateToUruguay(new Date(formData.start_date));
      const end = adjustDateToUruguay(new Date(formData.end_date));
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const minimumDays = calculateMinimumDays(formData.team_size, formData.frequency);

      if (diffDays < minimumDays) {
        console.warn('⚠️ Date range insufficient:', { diffDays, minimumDays });
        newErrors.push(
          `El rango de fechas es insuficiente. Para ${formData.team_size} equipos con frecuencia ${
            formData.frequency.toLowerCase()
          }, necesitas al menos ${minimumDays} días (${Math.ceil(minimumDays/7)} semanas)`
        );
      }
    }

    setErrors(newErrors);
    
    if (newErrors.length === 0) {
      console.log('✅ Form validation passed, submitting with data:', formData);
      onSubmit(formData);
    } else {
      console.warn('❌ Form validation failed:', newErrors);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-foreground dark:text-foreground">
            Configuración de Horarios
          </h2>
          <p className="text-muted-foreground">
            Define los días y horarios en los que se jugarán los partidos de la liga.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <ul className="list-disc list-inside text-sm text-destructive">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Asignación de Días por Categoría - Ahora primero */}
          <div>
            <LabelWithTooltip
              label="Asignación de Días por Categoría"
              tooltip="Arrastra los días a cada categoría para definir cuándo se jugarán los partidos"
            />
            <CategoryDayAssignment
              selectedCategories={formData.categories}
              categories={categories}
              onDaysAssigned={handleDaysAssigned}
            />
          </div>

          {/* Frecuencia */}
          <div>
            <LabelWithTooltip
              htmlFor="frequency"
              label="Frecuencia"
              tooltip="Con qué frecuencia se jugarán los partidos"
            />
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger
                id="frequency"
                className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary"
              >
                <SelectValue placeholder="Selecciona la frecuencia" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq} className="dark:hover:bg-slate-700">
                    {freq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <LabelWithTooltip
                htmlFor="start_date"
                label="Fecha de Inicio"
                tooltip="Selecciona la fecha de inicio de la liga"
              />
              <Input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary"
              />
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="end_date"
                label="Fecha de Fin"
                tooltip={suggestedEndDate ? 
                  `Fecha sugerida: ${formatDisplayDate(suggestedEndDate)} (${Math.ceil(calculateMinimumDays(formData.team_size, formData.frequency)/7)} semanas)` : 
                  'Selecciona primero la fecha de inicio'
                }
              />
              <div className="relative">
                <Input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={`
                    bg-transparent dark:bg-slate-800/50 
                    border-slate-200 dark:border-slate-700 
                    hover:border-slate-300 dark:hover:border-slate-600 
                    focus:border-primary
                    ${suggestedEndDate && formData.end_date !== suggestedEndDate ? 'border-yellow-400' : ''}
                  `}
                />
                {suggestedEndDate && formData.end_date !== suggestedEndDate && (
                  <div className="absolute -bottom-6 left-0 text-xs text-yellow-600 dark:text-yellow-400">
                    Fecha sugerida: {formatDisplayDate(suggestedEndDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Canchas Disponibles */}
          <div>
            <LabelWithTooltip
              label="Canchas Disponibles"
              tooltip="Cantidad de canchas disponibles para jugar simultáneamente"
            />
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {isLoadingCourts ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Cargando canchas...</p>
                </div>
              ) : courts && courts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total de canchas disponibles:</span>
                    <span className="text-sm text-foreground">{courts.length}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {courts.map(court => court.name).join(', ')}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive">No hay canchas disponibles</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-between">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center border-border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-primary hover:bg-primary/90"
            disabled={errors.length > 0}
          >
            Continuar
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
} 