import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CategoryDayAssignment } from './CategoryDayAssignment';
import { Category } from '@/hooks/useCategories';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useCourts } from '@/hooks/useCourts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LeagueFormData } from '@/hooks/useLeagueForm';

const FREQUENCIES = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' }
];

interface LeagueScheduleInfoProps {
  formData: LeagueFormData;
  setFormData: (data: LeagueFormData) => void;
  onSubmit: (data: LeagueFormData) => void;
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

function calculateMinimumDays(teamSize: number, frequency: string, rounds: number = 1): number {
  // En round-robin, cada equipo juega contra todos los demás
  // Con 8 equipos = 7 jornadas (por ronda)
  const matchdaysPerRound = teamSize - 1;
  
  // Si es ida y vuelta (rounds = 2), duplicamos las jornadas
  const totalMatchdays = matchdaysPerRound * rounds;
  
  // Los intervalos entre jornadas (la primera jornada es día 0)
  const intervals = totalMatchdays - 1;
  
  // Días entre cada jornada según frecuencia
  const daysPerInterval = {
    'semanal': 7,
    'quincenal': 14,
    'mensual': 30
  }[frequency.toLowerCase()] || 14;
  
  return intervals * daysPerInterval;
}

// Funciones helper para manejar fechas sin problemas de zona horaria
function parseDateString(dateStr: string): Date {
  // Parsear fecha en formato YYYY-MM-DD sin problemas de zona horaria
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateToString(date: Date): string {
  // Formatear fecha a YYYY-MM-DD sin problemas de zona horaria
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function adjustDateToUruguay(date: Date): Date {
  // Crear fecha en timezone Uruguay (UTC-3)
  const uruguayOffset = -3 * 60; // offset en minutos
  const userOffset = date.getTimezoneOffset();
  const offsetDiff = userOffset - uruguayOffset;
  
  const adjustedDate = new Date(date.getTime() + offsetDiff * 60 * 1000);
  return adjustedDate;
}

function formatDateForInput(date: Date): string {
  return formatDateToString(date);
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
  }, [fetchCourts]);

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
      const startDate = parseDateString(formData.start_date);
      const teamSize = formData.team_size;
      const rounds = formData.rounds || 1;
      const frequency = formData.frequency;
      
      const minimumDays = calculateMinimumDays(teamSize, frequency, rounds);
      
      // Agregar un 5% más de días para flexibilidad
      const recommendedDays = Math.ceil(minimumDays * 1.05);
      
      console.log('📅 Cálculo de fecha:', {
        teamSize,
        rounds,
        frequency,
        matchdays: (teamSize - 1) * rounds,
        minimumDays,
        recommendedDays,
        startDate: formData.start_date
      });
      
      const suggestedDate = new Date(startDate);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.start_date, formData.team_size, formData.frequency, formData.rounds]);

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
      const minimumDays = calculateMinimumDays(formData.team_size, formData.frequency, formData.rounds || 1);
      const totalMatchdays = (formData.team_size - 1) * (formData.rounds || 1);

      if (diffDays < minimumDays) {
        console.warn('⚠️ Date range insufficient:', { diffDays, minimumDays });
        newErrors.push(
          `El rango de fechas es insuficiente. Para ${formData.team_size} equipos ${
            formData.rounds === 2 ? '(ida y vuelta)' : '(solo ida)'
          } con frecuencia ${formData.frequency.toLowerCase()}, necesitas al menos ${minimumDays} días (${totalMatchdays} jornadas = ${Math.ceil(minimumDays/7)} semanas)`
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
              onValueChange={(value) => {
                const validFrequency: 'semanal' | 'quincenal' | 'mensual' = 
                  (value === 'semanal' || value === 'quincenal' || value === 'mensual')
                    ? value
                    : 'quincenal';
                setFormData({ ...formData, frequency: validFrequency });
              }}
            >
              <SelectTrigger
                id="frequency"
                className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary"
              >
                <SelectValue placeholder="Selecciona la frecuencia" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value} className="dark:hover:bg-slate-700">
                    {freq.label}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? (
                        format(parseDateString(formData.start_date), "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? parseDateString(formData.start_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const dateStr = formatDateToString(date);
                        setFormData({ ...formData, start_date: dateStr });
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="end_date"
                label="Fecha de Fin"
                tooltip={suggestedEndDate ? 
                  `Fecha sugerida: ${formatDisplayDate(suggestedEndDate)} (${(formData.team_size - 1) * (formData.rounds || 1)} jornadas, ${Math.ceil(calculateMinimumDays(formData.team_size, formData.frequency, formData.rounds || 1)/7)} semanas)` : 
                  'Selecciona primero la fecha de inicio'
                }
              />
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                        !formData.end_date && "text-muted-foreground"
                      )}
                      disabled={!formData.start_date}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? (
                        format(parseDateString(formData.end_date), "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date ? parseDateString(formData.end_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = formatDateToString(date);
                          setFormData({ ...formData, end_date: dateStr });
                        }
                      }}
                      disabled={(date) => {
                        if (!formData.start_date) return true;
                        const startDate = parseDateString(formData.start_date);
                        startDate.setHours(0, 0, 0, 0);
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0);
                        return compareDate < startDate;
                      }}
                      modifiers={suggestedEndDate ? {
                        suggested: parseDateString(suggestedEndDate),
                      } : undefined}
                      modifiersStyles={suggestedEndDate ? {
                        suggested: {
                          backgroundColor: 'rgb(16, 185, 129)',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: '9999px',
                        }
                      } : undefined}
                      initialFocus
                      locale={es}
                    />
                    {suggestedEndDate && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span>Fecha sugerida: {formatDisplayDate(suggestedEndDate)}</span>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Resumen del Cálculo de la Liga */}
          {formData.start_date && formData.team_size && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-300">Resumen del Cálculo</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Equipos/categoría</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{formData.team_size}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Formato</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{formData.rounds === 2 ? 'Ida y Vuelta' : 'Solo Ida'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Jornadas totales</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{(formData.team_size - 1) * (formData.rounds || 1)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Duración estimada</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.ceil(calculateMinimumDays(formData.team_size, formData.frequency, formData.rounds || 1) / 7)} semanas
                  </p>
                </div>
              </div>
            </div>
          )}

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