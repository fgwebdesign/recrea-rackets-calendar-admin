import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { cn } from "@/lib/utils";
import { Info, Shirt } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TournamentFormData } from '@/hooks/useTournamentForm';
import { Category } from '@/types/category';
import { SponsorSelector } from './SponsorSelector';
import { useTranslations } from '@/contexts/TranslationContext';
import { VenueSelector } from '@/components/Leagues/create/VenueSelector';

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
  const t = useTranslations('tournaments');
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
              {t('create.basicInfo.title')}
            </h2>
        </div>

        <div className="space-y-5">
          <div>
            <LabelWithTooltip
              htmlFor="name"
              label={t('create.basicInfo.name.label')}
              tooltip={t('create.basicInfo.name.tooltip')}
            />
            <div className="space-y-2">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('create.basicInfo.name.placeholder')}
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
              label={t('create.basicInfo.categories.label')}
              tooltip={t('create.basicInfo.categories.tooltip')}
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
            <LabelWithTooltip
              label={t('create.basicInfo.shirts.label')}
              tooltip={t('create.basicInfo.shirts.tooltip')}
            />
            <div className="space-y-3">
              <div className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
                formData.requires_shirts 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-200",
                    formData.requires_shirts 
                      ? "bg-emerald-100 dark:bg-emerald-500/20" 
                      : "bg-slate-100 dark:bg-slate-700"
                  )}>
                    <Shirt className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      formData.requires_shirts 
                        ? "text-emerald-600" 
                        : "text-slate-500 dark:text-slate-400"
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="requires_shirts" className="text-sm font-medium cursor-pointer">
                      {t('create.basicInfo.shirts.switchLabel')}
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('create.basicInfo.shirts.description')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="requires_shirts"
                  checked={formData.requires_shirts}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_shirts: !!checked })}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
              {formData.requires_shirts && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    <span className="font-medium">{t('create.basicInfo.shirts.sizesInfo')}</span>
                  </p>
                </div>
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
                label={t('create.basicInfo.dates.startDate.label')}
                tooltip={t('create.basicInfo.dates.startDate.tooltip')}
              />
              <div className="space-y-2">
                <DatePicker
                  value={formData.start_date ? parseDateFromInput(formData.start_date) : undefined}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    start_date: date ? formatDateForInput(date) : '' 
                  })}
                  placeholder={t('create.basicInfo.dates.startDate.placeholder')}
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
                label={t('create.basicInfo.dates.endDate.label')}
                tooltip={t('create.basicInfo.dates.endDate.tooltip')}
              />
              <div className="space-y-2">
                <DatePicker
                  value={formData.end_date ? parseDateFromInput(formData.end_date) : undefined}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    end_date: date ? formatDateForInput(date) : '' 
                  })}
                  placeholder={t('create.basicInfo.dates.endDate.placeholder')}
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

          {/* ✨ NUEVO: Selector de Sedes y Canchas (Multi-sede) */}
          <div>
            <LabelWithTooltip
              label="Sedes y Canchas"
              tooltip="Selecciona las sedes donde se realizará el torneo y las canchas disponibles en cada una. Si no seleccionas sedes, se usará el método tradicional."
            />
            <div className="space-y-2">
              <VenueSelector
                selectedVenues={formData.venues || []}
                onChange={(venues) => {
                  // Calcular courts_available automáticamente desde venues
                  const totalCourts = venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0);
                  setFormData({ 
                    ...formData, 
                    venues,
                    courts_available: totalCourts > 0 ? totalCourts : formData.courts_available
                  });
                }}
              />
              {errors.venues && (
                <p className="text-sm text-red-500">{errors.venues}</p>
              )}
              {/* Mostrar resumen si hay venues seleccionadas */}
              {formData.venues && formData.venues.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Resumen:</strong> {formData.venues.length} {formData.venues.length === 1 ? 'sede' : 'sedes'} seleccionada{formData.venues.length > 1 ? 's' : ''}, 
                    {' '}{formData.venues.reduce((sum, v) => sum + (v.court_ids?.length || 0), 0)} canchas en total
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fallback: Campo tradicional de canchas (solo si no hay venues) */}
          {(!formData.venues || formData.venues.length === 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelWithTooltip
                  htmlFor="courts_available"
                  label={t('create.basicInfo.courts.label')}
                  tooltip={t('create.basicInfo.courts.tooltip')}
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
                      <SelectValue placeholder={t('create.basicInfo.courts.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map((court, index) => (
                        <SelectItem key={court.id} value={(index + 1).toString()}>
                          {index + 1} {index === 0 ? t('create.basicInfo.courts.single') : t('create.basicInfo.courts.plural')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.courts_available && (
                    <p className="text-sm text-red-500">{errors.courts_available}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Tipo de Torneo (siempre visible) */}
          <div>
            <LabelWithTooltip
              htmlFor="tournament_type"
              label={t('create.basicInfo.tournamentType.label')}
              tooltip={t('create.basicInfo.tournamentType.tooltip')}
            />
            <div className="space-y-2">
              <Select
                value={formData.tournament_type}
                onValueChange={(value: 'SIX_PLAYERS' | 'NINE_PLAYERS' | 'TWELVE_PLAYERS' | 'SIXTEEN_PLAYERS') => 
                  setFormData({ ...formData, tournament_type: value })
                }
              >
                <SelectTrigger 
                  className={cn(
                    "bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                    errors.tournament_type && "border-red-500 dark:border-red-500"
                  )}
                >
                  <SelectValue placeholder={t('create.basicInfo.tournamentType.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIX_PLAYERS">{t('create.basicInfo.tournamentType.sixPlayers')}</SelectItem>
                  <SelectItem value="NINE_PLAYERS">{t('create.basicInfo.tournamentType.ninePlayers')}</SelectItem>
                  <SelectItem value="TWELVE_PLAYERS">{t('create.basicInfo.tournamentType.twelvePlayers')}</SelectItem>
                  <SelectItem value="SIXTEEN_PLAYERS">{t('create.basicInfo.tournamentType.sixteenPlayers')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.tournament_type && (
                <p className="text-sm text-red-500">{errors.tournament_type}</p>
              )}
            </div>
          </div>

          <div>
            <LabelWithTooltip
              label={t('create.basicInfo.image.label')}
              tooltip={t('create.basicInfo.image.tooltip')}
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
              {t('create.basicInfo.continue')}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}