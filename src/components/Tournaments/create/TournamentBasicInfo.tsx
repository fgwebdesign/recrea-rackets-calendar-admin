import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TournamentFormData } from '@/hooks/useTournamentForm';
import { Category } from '@/types/category';
import { SponsorSelector } from './SponsorSelector';

interface Court {
  id: string;
  name: string;
}

interface TournamentBasicInfoProps {
  formData: TournamentFormData;
  setFormData: (data: TournamentFormData) => void;
  categories: Category[];
  courts: Court[];
  onSubmit: (data: TournamentFormData) => void;
  errors: Record<string, string | null | undefined>;
}

function LabelWithTooltip({
  htmlFor,
  label,
  tooltip,
}: {
  htmlFor?: string;
  label: string;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Label htmlFor={htmlFor} className="text-slate-700 dark:text-slate-300 font-medium">
        {label}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function TournamentBasicInfo({ formData, setFormData, categories = [], courts = [], onSubmit, errors }: TournamentBasicInfoProps) {
  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = Array.isArray(formData.categories) ? formData.categories : [];
    const isSelected = currentCategories.includes(categoryId);
    
    const newCategories = isSelected
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    setFormData({ ...formData, categories: newCategories });
  };

  const handleImageChange = (file: File | null) => {
    setFormData({ ...formData, tournament_thumbnail: file });
  };

  // Función para calcular fechas sugeridas para la fecha de fin
  const getSuggestedEndDates = () => {
    if (!formData.start_date) return [];
    
    const startDate = parseDateFromInput(formData.start_date);
    const suggestedDates = [];
    
    // Sugerir EXACTAMENTE 2 días después (3 días INCLUSIVO: inicio, día 2, día 3)
    const suggestedDate = new Date(startDate);
    suggestedDate.setDate(startDate.getDate() + 2);
    suggestedDates.push(suggestedDate);
    
    return suggestedDates;
  };

  // Función para calcular fechas restringidas para la fecha de fin
  const getRestrictedEndDates = () => {
    if (!formData.start_date) return [];
    
    const startDate = parseDateFromInput(formData.start_date);
    const restrictedDates = [];
    
    // Restringir fecha de 1 día después (muy corta - solo 2 días)
    const restrictedDate1 = new Date(startDate);
    restrictedDate1.setDate(startDate.getDate() + 1);
    restrictedDates.push(restrictedDate1);
    
    // Restringir fechas de más de 2 días después (muy largas - más de 3 días)
    for (let i = 3; i <= 10; i++) {
      const restrictedDate = new Date(startDate);
      restrictedDate.setDate(startDate.getDate() + i);
      restrictedDates.push(restrictedDate);
    }
    
    return restrictedDates;
  };

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 bg-background/50 rounded-lg border border-border/50">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Información Básica del Torneo
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <LabelWithTooltip
              htmlFor="name"
              label="Nombre del Torneo"
              tooltip="Nombre identificativo del torneo"
            />
            <div className="space-y-2">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Torneo de Verano 2024"
                aria-invalid={!!errors.name}
                className={cn(
                  "bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary",
                  errors.name && "border-red-500 dark:border-red-500"
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
          </div>

          <div>
            <LabelWithTooltip
              label="Categorías"
              tooltip="Selecciona las categorías que participarán en el torneo"
            />
            <div className="space-y-2">
              <div className={cn(
                "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
                errors.categories && "border-2 border-red-500 dark:border-red-500 rounded-lg p-2"
              )}>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`
                      p-3 rounded-lg transition-all duration-200
                      border-2 
                      ${
                        formData.categories.includes(category.id)
                          ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }
                      hover:scale-[1.02] hover:shadow-sm
                      flex flex-col items-center gap-1
                    `}
                  >
                    <span className="text-base font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="text-sm text-red-500">{errors.categories}</p>
              )}
            </div>
          </div>

          <div>
            <SponsorSelector
              selectedSponsors={formData.sponsors || []}
              onSponsorsChange={(sponsorIds) => setFormData({ ...formData, sponsors: sponsorIds })}
              error={errors.sponsors || undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelWithTooltip
                htmlFor="start_date"
                label="Fecha de Inicio"
                tooltip="Fecha de inicio del torneo"
              />
              <div className="space-y-2">
                <DatePicker
                  value={formData.start_date ? parseDateFromInput(formData.start_date) : undefined}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    start_date: date ? formatDateForInput(date) : '' 
                  })}
                  placeholder="Selecciona fecha de inicio"
                  error={!!errors.start_date}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="end_date"
                label="Fecha de Fin"
                tooltip="Fecha de finalización del torneo. La fecha verde es la recomendada (exactamente 3 días: inicio, día 2, día 3), las rojas están restringidas (muy cortas o muy largas)."
              />
              <div className="space-y-2">
                <DatePicker
                  value={formData.end_date ? parseDateFromInput(formData.end_date) : undefined}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    end_date: date ? formatDateForInput(date) : '' 
                  })}
                  placeholder="Selecciona fecha de fin"
                  error={!!errors.end_date}
                  suggestedDates={getSuggestedEndDates()}
                  restrictedDates={getRestrictedEndDates()}
                  startDate={formData.start_date ? parseDateFromInput(formData.start_date) : undefined}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500">{errors.end_date}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelWithTooltip
                htmlFor="courts_available"
                label="Canchas Disponibles"
                tooltip="Número de canchas disponibles para el torneo"
              />
              <div className="space-y-2">
                <Select
                  value={formData.courts_available.toString()}
                  onValueChange={(value) => setFormData({ ...formData, courts_available: parseInt(value) })}
                >
                  <SelectTrigger 
                    className={cn(
                      "bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                      errors.courts_available && "border-red-500 dark:border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Selecciona las canchas" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court, index) => (
                      <SelectItem key={court.id} value={(index + 1).toString()}>
                        {index + 1} {index === 0 ? 'cancha' : 'canchas'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.courts_available && (
                  <p className="text-sm text-red-500">{errors.courts_available}</p>
                )}
              </div>
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="tournament_type"
                label="Tipo de Torneo"
                tooltip="Formato del torneo"
              />
              <div className="space-y-2">
                <Select
                  value={formData.tournament_type}
                  onValueChange={(value: 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS') => 
                    setFormData({ ...formData, tournament_type: value })
                  }
                >
                  <SelectTrigger 
                    className={cn(
                      "bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                      errors.tournament_type && "border-red-500 dark:border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NINE_PLAYERS">9 Jugadores</SelectItem>
                    <SelectItem value="TWELVE_PLAYERS">12 Jugadores</SelectItem>
                    <SelectItem value="SIXTEEN_PLAYERS">16 Jugadores</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tournament_type && (
                  <p className="text-sm text-red-500">{errors.tournament_type}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <LabelWithTooltip
              label="Imagen del Torneo"
              tooltip="Imagen representativa del torneo"
            />
            <div className="space-y-2">
              <ImageUpload
                onImageChange={handleImageChange}
                currentImage={formData.thumbnail_url}
                maxSizeMB={5}
                recommendedSize="1080x1080px"
                aspectRatio="cuadrado"
              />
              {errors.tournament_thumbnail && (
                <p className="text-sm text-red-500">{errors.tournament_thumbnail}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={() => onSubmit(formData)} className="bg-primary hover:bg-primary/90">
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}