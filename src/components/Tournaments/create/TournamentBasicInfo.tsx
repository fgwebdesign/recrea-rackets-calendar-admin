import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Info, Shirt, Clock, Wand2, Trash2, Plus, AlertTriangle, Link2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from 'react';
import { TournamentFormData, generateDefaultFranjas } from '@/hooks/useTournamentForm';
import { tournamentCreationService } from '@/services/tournamentCreationService';
import { Category } from '@/types/category';
import { SponsorSelector } from './SponsorSelector';
import { useTranslations } from '@/contexts/TranslationContext';
import { VenueSelector } from '@/components/Leagues/create/VenueSelector';
import { FranjasHorariasModal } from './FranjasHorariasModal';

interface TournamentBasicInfoProps {
  formData: TournamentFormData;
  setFormData: (data: TournamentFormData) => void;
  categories: Category[];
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

export function TournamentBasicInfo({ formData, setFormData, categories = [], onSubmit, errors }: TournamentBasicInfoProps) {
  const t = useTranslations('tournaments');
  const [loadingFranjas, setLoadingFranjas] = useState(false);
  const [franjasError, setFranjasError] = useState<string | null>(null);
  const [showFranjasModal, setShowFranjasModal] = useState(false);

  // Feature #8: check de solapamiento de torneos sin common_code
  const [overlapWarning, setOverlapWarning] = useState<{
    count: number;
    names: string[];
    existing_codes: string[];
  } | null>(null);
  const overlapCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!formData.start_date || !formData.end_date) {
      setOverlapWarning(null);
      return;
    }
    // Debounce 600ms para no llamar en cada keypress
    if (overlapCheckTimer.current) clearTimeout(overlapCheckTimer.current);
    overlapCheckTimer.current = setTimeout(async () => {
      try {
        const venueIds = (formData.venues || []).flatMap(v => v.venue_id ? [v.venue_id] : []);
        const result = await tournamentCreationService.checkOverlapping(
          formData.start_date,
          formData.end_date,
          venueIds
        );
        if (result.warning) {
          setOverlapWarning({
            count: result.without_common_code_count,
            names: result.without_common_code.map(t => t.name),
            existing_codes: result.existing_codes
          });
        } else {
          setOverlapWarning(null);
        }
      } catch {
        setOverlapWarning(null);
      }
    }, 600);
    return () => { if (overlapCheckTimer.current) clearTimeout(overlapCheckTimer.current); };
  }, [formData.start_date, formData.end_date, formData.venues]);

  // 1. Generar franjas estándar: llama al backend y popula directamente (sin modal)
  const handleGenerateDefaultFranjas = async () => {
    if (!formData.start_date || !formData.end_date) return;
    setFranjasError(null);
    setLoadingFranjas(true);
    try {
      const res = await tournamentCreationService.getDefaultFranjas(formData.start_date, formData.end_date);
      setFormData({ ...formData, group_time_slots: res.franjas_para_jugadores || [] });
    } catch (err) {
      setFranjasError(err instanceof Error ? err.message : 'Error al cargar franjas');
      const fallback = generateDefaultFranjas(formData.start_date, formData.end_date);
      setFormData({ ...formData, group_time_slots: fallback });
    } finally {
      setLoadingFranjas(false);
    }
  };

  // 2. Abrir modal para crear/editar franjas manualmente
  const handleOpenFranjasModal = () => {
    setShowFranjasModal(true);
  };

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
  const getSuggestedEndDates = (): Date[] => {
    if (!formData.start_date) return [];

    const startDate = parseDateFromInput(formData.start_date);

    // Americano: sugerencia según cantidad de jugadores (sin restricción de 3 días)
    if (formData.tournament_type === 'AMERICANO' && formData.americano_config) {
      const players = formData.americano_config.max_players ?? 8;
      // 4 jugadores → mismo día (1 día); 8 → +1 día (2 días); 12/16 → +2 días (3 días)
      const daysAfterStart = players <= 4 ? 0 : players <= 8 ? 1 : 2;
      const suggested = new Date(startDate);
      suggested.setDate(startDate.getDate() + daysAfterStart);
      return [suggested];
    }

    // Formato clásico: sugerir 3, 4 y 5 días (mínimo 3; 4 y 5 son habituales para más categorías)
    return [2, 3, 4].map((daysAfterStart) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + daysAfterStart);
      return d;
    });
  };

  // Función para calcular fechas restringidas para la fecha de fin
  const getRestrictedEndDates = (): Date[] => {
    if (!formData.start_date) return [];

    // Americano: sin restricciones de mínimo/máximo de días
    if (formData.tournament_type === 'AMERICANO') return [];

    // Formato clásico: solo restringir menos de 3 días (mismo día o 2 días). 3+ días permitidos.
    const startDate = parseDateFromInput(formData.start_date);
    const restrictedDates: Date[] = [];
    for (let i = 0; i <= 1; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      restrictedDates.push(d);
    }
    return restrictedDates;
  };

  const getEndDateTooltip = (): string => {
    if (formData.tournament_type === 'AMERICANO') {
      const base = t('create.basicInfo.dates.endDate.tooltipAmericano');
      if (formData.americano_config?.max_players) {
        const players = formData.americano_config.max_players;
        const days = players <= 4 ? 1 : players <= 8 ? 2 : 3;
        const recommended = t('create.basicInfo.dates.endDate.americanoRecommended')
          .replace('{{days}}', String(days))
          .replace('{{players}}', String(players));
        return `${base} ${recommended}`;
      }
      return base;
    }
    return t('create.basicInfo.dates.endDate.tooltip');
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
            <div className="flex justify-end mb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const allSelected = categories.length === formData.categories.length;
                  const newCategories = allSelected ? [] : categories.map(cat => cat.id);
                  setFormData({ ...formData, categories: newCategories });
                }}
                className="text-sm"
              >
                {categories.length === formData.categories.length ? 'Desmarcar todas' : 'Seleccionar todas'}
              </Button>
            </div>
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
              {Array.isArray(formData.categories) && formData.categories.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Categorías seleccionadas: {formData.categories.length}
                </p>
              )}
            </div>
          </div>

          {/* Formato de torneo: clásico (6/9/12/16 equipos) o Americano */}
          <div>
            <LabelWithTooltip
              htmlFor="tournament_type"
              label={t('create.basicInfo.tournamentType.label')}
              tooltip={t('create.basicInfo.tournamentType.tooltip')}
            />
            <div className="space-y-2">
              <Select
                value={formData.tournament_type}
                onValueChange={(value: TournamentFormData['tournament_type']) => {
                  const next = { ...formData, tournament_type: value };
                  if (value === 'AMERICANO' && !next.americano_config) {
                    next.americano_config = {
                      scoring_mode: 'points',
                      max_players: 8,
                      points_per_match: 24,
                      games_to_win_set: 6,
                      tie_break_at: 6
                    };
                  }
                  setFormData(next);
                }}
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
                  <SelectItem value="AMERICANO">Americano</SelectItem>
                </SelectContent>
              </Select>
              {errors.tournament_type && (
                <p className="text-sm text-red-500">{errors.tournament_type}</p>
              )}
              {formData.tournament_type !== 'AMERICANO' && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>Este es el número de equipos que se jugarán por categoría. Podés modificarlo una vez creado el torneo.</span>
                </p>
              )}
            </div>
          </div>

          {/* Campos solo para Americano */}
          {formData.tournament_type === 'AMERICANO' && formData.americano_config && (
            <div className="space-y-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Configuración Americano</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Cantidad de jugadores</Label>
                  <Select
                    value={String(formData.americano_config.max_players)}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      americano_config: { ...formData.americano_config!, max_players: Number(v) as 4 | 8 | 12 | 16 }
                    })}
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Puntuación</Label>
                  <Select
                    value={formData.americano_config.scoring_mode}
                    onValueChange={(v: 'points' | 'sets') => setFormData({
                      ...formData,
                      americano_config: {
                        ...formData.americano_config!,
                        scoring_mode: v,
                        points_per_match: v === 'points' ? 24 : undefined,
                        sets_per_match: v === 'sets' ? 1 : undefined
                      }
                    })}
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">A puntos</SelectItem>
                      <SelectItem value="sets">A sets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.americano_config.scoring_mode === 'points' && (
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Puntos por partido</Label>
                  <Select
                    value={String(formData.americano_config.points_per_match ?? 24)}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      americano_config: { ...formData.americano_config!, points_per_match: Number(v) as 16 | 24 | 32 | 40 }
                    })}
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {formData.americano_config.scoring_mode === 'sets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Sets por partido</Label>
                    <Select
                      value={String(formData.americano_config.sets_per_match ?? 1)}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        americano_config: { ...formData.americano_config!, sets_per_match: Number(v) as 1 | 2 | 3 }
                      })}
                    >
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-800/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 set</SelectItem>
                        <SelectItem value="2">2 sets</SelectItem>
                        <SelectItem value="3">Al mejor de 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Juegos para ganar set</Label>
                    <Select
                      value={String(formData.americano_config.games_to_win_set ?? 6)}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        americano_config: { ...formData.americano_config!, games_to_win_set: Number(v) }
                      })}
                    >
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-800/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {errors.americano_config && (
                <p className="text-sm text-red-500">{errors.americano_config}</p>
              )}
            </div>
          )}

          {/* Sedes y Canchas (solo formato clásico; Americano puede usar 1 cancha por defecto) */}
          {formData.tournament_type !== 'AMERICANO' && (
            <div>
              <LabelWithTooltip
                label="Sedes y Canchas"
                tooltip="Selecciona las sedes donde se realizará el torneo y las canchas disponibles en cada una. Si no seleccionas sedes, se usará el método tradicional."
              />
              <div className="space-y-2">
                <VenueSelector
                  selectedVenues={formData.venues || []}
                  onChange={(venues) => {
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
              </div>
            </div>
          )}

          {/* Americano: sede opcional */}
          {formData.tournament_type === 'AMERICANO' && (
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Sede (opcional)</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Si no elegís sede, se usará 1 cancha por defecto.</p>
              <VenueSelector
                selectedVenues={formData.venues || []}
                onChange={(venues) => {
                  setFormData({ ...formData, venues, courts_available: venues.reduce((s, v) => s + (v.court_ids?.length || 0), 0) || 1 });
                }}
              />
            </div>
          )}

          {/* Fechas inicio y fin */}
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
                tooltip={getEndDateTooltip()}
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

          {/* Feature #8: Alerta de solapamiento + campo common_code */}
          {overlapWarning && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-300 text-sm font-semibold">
                ⚠️ Hay {overlapWarning.count} torneo{overlapWarning.count !== 1 ? 's' : ''} en esas fechas sin código común
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm space-y-2 mt-1">
                <p>
                  Los torneos <strong>{overlapWarning.names.join(', ')}</strong> comparten las mismas sedes en ese período.
                  Sin un <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">common_code</code> compartido,
                  el sistema no considera sus partidos al generar el scheduling y pueden producirse colisiones de canchas.
                </p>
                {overlapWarning.existing_codes.length > 0 && (
                  <p className="flex items-center gap-2 flex-wrap">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    Códigos ya usados en esas fechas:
                    {overlapWarning.existing_codes.map(code => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="cursor-pointer border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs"
                        onClick={() => setFormData({ ...formData, common_code: code })}
                      >
                        {code} (usar este)
                      </Badge>
                    ))}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Campo common_code (visible siempre para torneos no-americanos, pero resaltado si hay warning) */}
          {formData.tournament_type !== 'AMERICANO' && (
            <div>
              <LabelWithTooltip
                htmlFor="common_code"
                label="Código de evento (common_code)"
                tooltip="Si este torneo comparte canchas con otras categorías del mismo evento (ej. Masculino 3ra, Femenino 3ra), asigná el mismo código en todos. Esto evita colisiones de horarios al generar el scheduling automático."
              />
              <Input
                id="common_code"
                placeholder="Ej: VERANO_2026, OPEN_MAYO"
                value={formData.common_code || ''}
                onChange={e => setFormData({ ...formData, common_code: e.target.value.toUpperCase() })}
                className={cn(
                  'mt-1 bg-white dark:bg-slate-800/50 font-mono text-sm',
                  overlapWarning && !formData.common_code && 'border-amber-400 ring-1 ring-amber-400'
                )}
              />
              {overlapWarning && !formData.common_code && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Recomendado: completá este campo para evitar colisiones de scheduling
                </p>
              )}
            </div>
          )}

          {/* Franjas Horarias (solo formato clásico) */}
          {formData.tournament_type !== 'AMERICANO' && (
          <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Franjas Horarias
                </div>
                {formData.start_date && formData.end_date && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loadingFranjas || formData.group_time_slots.length > 0}
                      onClick={handleGenerateDefaultFranjas}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      {loadingFranjas ? 'Cargando...' : 'Generar franjas estándar'}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleOpenFranjasModal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar manualmente
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {franjasError && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Se usaron franjas locales: {franjasError}
                </p>
              )}
              {!formData.start_date || !formData.end_date ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Seleccioná las fechas de inicio y fin del torneo para configurar las franjas horarias.
                </p>
              ) : formData.group_time_slots.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No hay franjas configuradas. Usá &quot;Generar franjas estándar&quot; para cargar las del backend, o &quot;Agregar manualmente&quot; para crearlas en el configurador.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.group_time_slots.map((franja, idx) => (
                    <div
                      key={franja.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-bold">
                          D{franja.tournament_day}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {franja.label}
                          </p>
                          <p className="text-xs text-blue-500 dark:text-blue-400">
                            {franja.date} &middot; {franja.start_time} - {franja.end_time}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = formData.group_time_slots.filter((_, i) => i !== idx);
                          setFormData({ ...formData, group_time_slots: updated });
                        }}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {errors.group_time_slots && (
                <p className="text-sm text-red-500">{errors.group_time_slots}</p>
              )}
            </CardContent>
          </Card>
          )}

          <FranjasHorariasModal
            open={showFranjasModal}
            onOpenChange={setShowFranjasModal}
            startDate={formData.start_date}
            endDate={formData.end_date}
            initialFranjas={formData.group_time_slots}
            onConfirm={(franjas) => {
              setFormData({ ...formData, group_time_slots: franjas });
              setFranjasError(null);
            }}
          />

          {/* Remeras y Patrocinadores (solo formato clásico) */}
          {formData.tournament_type !== 'AMERICANO' && (
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
          )}

          {formData.tournament_type !== 'AMERICANO' && (
          <div>
            <SponsorSelector
              selectedSponsors={formData.sponsors || []}
              onSponsorsChange={(sponsorIds) => setFormData({ ...formData, sponsors: sponsorIds })}
              error={errors.sponsors || undefined}
            />
          </div>
          )}

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