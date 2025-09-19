import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker, formatDateForInput, parseDateFromInput } from '@/components/ui/date-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import { Info, Trophy, MapPin, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TournamentFormData } from '@/hooks/useTournamentForm';
import { SponsorsList } from '@/components/Tournaments/SponsorsList';
import { useTranslations } from '@/contexts/TranslationContext';

interface TournamentDetailInfoProps {
  formData: TournamentFormData;
  setFormData: (data: TournamentFormData) => void;
  onSubmit: (data: TournamentFormData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
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

export function TournamentDetailInfo({ formData, setFormData, onSubmit, onBack, isSubmitting = false }: TournamentDetailInfoProps) {
  const t = useTranslations('tournaments.create.detailInfo');
  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 bg-background/50 rounded-lg border border-border/50">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            {t('title')}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <LabelWithTooltip
                htmlFor="description"
                label={t('description.label')}
                tooltip={t('description.tooltip')}
              />
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('description.placeholder')}
                className="min-h-[100px] bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="rules"
                label={t('rules.label')}
                tooltip={t('rules.tooltip')}
              />
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder={t('rules.placeholder')}
                className="min-h-[100px] bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {t('location.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tournament_location">
                  {t('location.placeName.label')}
                </Label>
                <Input
                  id="tournament_location"
                  value={formData.tournament_location}
                  onChange={(e) => setFormData({ ...formData, tournament_location: e.target.value })}
                  placeholder={t('location.placeName.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="tournament_address">
                  {t('location.address.label')}
                </Label>
                <Input
                  id="tournament_address"
                  value={formData.tournament_address}
                  onChange={(e) => setFormData({ ...formData, tournament_address: e.target.value })}
                  placeholder={t('location.address.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="tournament_club_name">
                  {t('location.clubName.label')}
                </Label>
                <Input
                  id="tournament_club_name"
                  value={formData.tournament_club_name}
                  onChange={(e) => setFormData({ ...formData, tournament_club_name: e.target.value })}
                  placeholder={t('location.clubName.placeholder')}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="signup_limit_date">
                  {t('location.signupLimit.label')}
                </Label>
                <DatePicker
                  value={formData.signup_limit_date ? parseDateFromInput(formData.signup_limit_date) : undefined}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    signup_limit_date: date ? formatDateForInput(date) : '' 
                  })}
                  placeholder={t('location.signupLimit.placeholder')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {t('prizes.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="first_place_prize" className="flex items-center gap-2">
                    <span className="text-yellow-500 font-bold">1°</span>
                    {t('prizes.firstPlace.label')}
                  </Label>
                  <Input
                    id="first_place_prize"
                    value={formData.first_place_prize}
                    onChange={(e) => setFormData({ ...formData, first_place_prize: e.target.value })}
                    placeholder={t('prizes.firstPlace.placeholder')}
                    className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <Label htmlFor="second_place_prize" className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold">2°</span>
                    {t('prizes.secondPlace.label')}
                  </Label>
                  <Input
                    id="second_place_prize"
                    value={formData.second_place_prize}
                    onChange={(e) => setFormData({ ...formData, second_place_prize: e.target.value })}
                    placeholder={t('prizes.secondPlace.placeholder')}
                    className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <Label htmlFor="third_place_prize" className="flex items-center gap-2">
                    <span className="text-amber-700 font-bold">3°</span>
                    {t('prizes.thirdPlace.label')}
                  </Label>
                  <Input
                    id="third_place_prize"
                    value={formData.third_place_prize}
                    onChange={(e) => setFormData({ ...formData, third_place_prize: e.target.value })}
                    placeholder={t('prizes.thirdPlace.placeholder')}
                    className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  {t('sponsors.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Los patrocinadores se seleccionan en el paso anterior.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <LabelWithTooltip
              htmlFor="inscription_cost"
              label={t('inscriptionCost.label')}
              tooltip={t('inscriptionCost.tooltip')}
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
              {t('back')}
            </Button>
            <Button
              onClick={() => onSubmit(formData)}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? t('creating') : t('create')}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}