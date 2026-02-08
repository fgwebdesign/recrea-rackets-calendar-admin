import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Info, Trophy, MapPin, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TournamentFormData } from '@/hooks/useTournamentForm';
import { useTranslations } from '@/contexts/TranslationContext';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import dynamic from 'next/dynamic';

// Importar MapPreview sin SSR (Leaflet requiere window)
const MapPreview = dynamic(() => import('@/components/ui/map-preview').then(mod => ({ default: mod.MapPreview })), {
  ssr: false,
  loading: () => <div className="w-full h-[200px] rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />,
});

interface TournamentDetailInfoProps {
  formData: TournamentFormData;
  setFormData: (data: TournamentFormData) => void;
  onSubmit: (data: TournamentFormData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string | null | undefined>;
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

export function TournamentDetailInfo({ formData, setFormData, onSubmit, onBack, isSubmitting = false, errors = {} }: TournamentDetailInfoProps) {
  const t = useTranslations('tournaments');
  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 bg-background/50 rounded-lg border border-border/50">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            {t('create.detailInfo.title')}
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <LabelWithTooltip
              htmlFor="description"
              label={t('create.detailInfo.description.label')}
              tooltip={t('create.detailInfo.description.tooltip')}
            />
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('create.detailInfo.description.placeholder')}
              className="min-h-[100px] bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Reglamento en PDF */}
          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="w-5 h-5 text-purple-500" />
                {t('create.detailInfo.rulesPdf.label')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {t('create.detailInfo.rulesPdf.description')}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  id="rules_pdf"
                  className="sr-only"
                  onChange={(e) => setFormData({ ...formData, rules_pdf: e.target.files?.[0] ?? null })}
                />
                <label
                  htmlFor="rules_pdf"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 cursor-pointer transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  {t('create.detailInfo.rulesPdf.selectFile')}
                </label>
                {formData.rules_pdf ? (
                  <span className="text-sm text-purple-600 dark:text-purple-400">✓ {formData.rules_pdf.name}</span>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t('create.detailInfo.rulesPdf.noFile')}</span>
                )}
              </div>
              {errors.rules_pdf && (
                <p className="mt-2 text-sm text-red-500">{errors.rules_pdf}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {t('create.detailInfo.location.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tournament_location">
                  {t('create.detailInfo.location.placeName.label')}
                </Label>
                <Input
                  id="tournament_location"
                  value={formData.tournament_location}
                  onChange={(e) => setFormData({ ...formData, tournament_location: e.target.value })}
                  placeholder={t('create.detailInfo.location.placeName.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="tournament_address">
                  {t('create.detailInfo.location.address.label')}
                </Label>
                <AddressAutocomplete
                  value={formData.tournament_address}
                  onChange={(value) => setFormData({ ...formData, tournament_address: value })}
                  onSelect={(selection) => setFormData({
                    ...formData,
                    tournament_address: selection.address,
                    latitude: selection.latitude,
                    longitude: selection.longitude,
                  })}
                  placeholder={t('create.detailInfo.location.address.placeholder')}
                />
                {formData.latitude && formData.longitude && (
                  <div className="mt-3">
                    <MapPreview
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      draggable
                      onPositionChange={(lat, lng) => setFormData({
                        ...formData,
                        latitude: lat,
                        longitude: lng,
                      })}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Podés arrastrar el marcador para ajustar la ubicación exacta
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tournament_club_name">
                  {t('create.detailInfo.location.clubName.label')}
                </Label>
                <Input
                  id="tournament_club_name"
                  value={formData.tournament_club_name}
                  onChange={(e) => setFormData({ ...formData, tournament_club_name: e.target.value })}
                  placeholder={t('create.detailInfo.location.clubName.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="signup_limit_date">
                  {t('create.detailInfo.location.signupLimit.label')}
                </Label>
                <DatePicker
                  value={formData.signup_limit_date ? parseDateFromInput(formData.signup_limit_date) : undefined}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    signup_limit_date: date ? formatDateForInput(date) : '' 
                  })}
                  placeholder={t('create.detailInfo.location.signupLimit.placeholder')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {t('create.detailInfo.prizes.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="first_place_prize" className="flex items-center gap-2">
                  <span className="text-yellow-500 font-bold">1°</span>
                  {t('create.detailInfo.prizes.firstPlace.label')}
                </Label>
                <Input
                  id="first_place_prize"
                  value={formData.first_place_prize}
                  onChange={(e) => setFormData({ ...formData, first_place_prize: e.target.value })}
                  placeholder={t('create.detailInfo.prizes.firstPlace.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="second_place_prize" className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">2°</span>
                  {t('create.detailInfo.prizes.secondPlace.label')}
                </Label>
                <Input
                  id="second_place_prize"
                  value={formData.second_place_prize}
                  onChange={(e) => setFormData({ ...formData, second_place_prize: e.target.value })}
                  placeholder={t('create.detailInfo.prizes.secondPlace.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="third_place_prize" className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold">3°</span>
                  {t('create.detailInfo.prizes.thirdPlace.label')}
                </Label>
                <Input
                  id="third_place_prize"
                  value={formData.third_place_prize}
                  onChange={(e) => setFormData({ ...formData, third_place_prize: e.target.value })}
                  placeholder={t('create.detailInfo.prizes.thirdPlace.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          <div>
            <LabelWithTooltip
              htmlFor="inscription_cost"
              label={t('create.detailInfo.inscriptionCost.label')}
              tooltip={t('create.detailInfo.inscriptionCost.tooltip')}
            />
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="inscription_cost"
                type="number"
                min="0"
                value={formData.inscription_cost}
                onChange={(e) => setFormData({ ...formData, inscription_cost: parseInt(e.target.value) })}
                className="pl-7 bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              {t('create.detailInfo.back')}
            </Button>
            <Button
              onClick={() => onSubmit(formData)}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? t('create.detailInfo.creating') : t('create.detailInfo.create')}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}