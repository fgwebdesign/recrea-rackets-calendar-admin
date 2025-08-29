import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import { Info, Trophy, MapPin, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TournamentFormData } from '@/hooks/useTournamentForm';
import { SponsorsList } from '@/components/Tournaments/SponsorsList';

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
  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 bg-background/50 rounded-lg border border-border/50">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Información Detallada del Torneo
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <LabelWithTooltip
                htmlFor="description"
                label="Descripción"
                tooltip="Descripción general del torneo"
              />
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles importantes del torneo..."
                className="min-h-[100px] bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="rules"
                label="Reglas del Torneo"
                tooltip="Reglas y normativas específicas"
              />
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Especifica las reglas y normativas del torneo..."
                className="min-h-[100px] bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Ubicación del Torneo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tournament_location">
                  Nombre del Lugar
                </Label>
                <Input
                  id="tournament_location"
                  value={formData.tournament_location}
                  onChange={(e) => setFormData({ ...formData, tournament_location: e.target.value })}
                  placeholder="Ej: Club Deportivo Central"
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="tournament_address">
                  Dirección
                </Label>
                <Input
                  id="tournament_address"
                  value={formData.tournament_address}
                  onChange={(e) => setFormData({ ...formData, tournament_address: e.target.value })}
                  placeholder="Ej: Av. Principal 123, Ciudad"
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label htmlFor="signup_limit_date">
                  Fecha Límite de Inscripción
                </Label>
                <Input
                  id="signup_limit_date"
                  type="date"
                  value={formData.signup_limit_date}
                  onChange={(e) => setFormData({ ...formData, signup_limit_date: e.target.value })}
                  className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Premios del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="first_place_prize" className="flex items-center gap-2">
                    <span className="text-yellow-500 font-bold">1°</span>
                    Primer Lugar
                  </Label>
                  <Input
                    id="first_place_prize"
                    value={formData.first_place_prize}
                    onChange={(e) => setFormData({ ...formData, first_place_prize: e.target.value })}
                    placeholder="Ej: Trofeo + $50,000"
                    className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <Label htmlFor="second_place_prize" className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold">2°</span>
                    Segundo Lugar
                  </Label>
                  <Input
                    id="second_place_prize"
                    value={formData.second_place_prize}
                    onChange={(e) => setFormData({ ...formData, second_place_prize: e.target.value })}
                    placeholder="Ej: Medalla + $30,000"
                    className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <Label htmlFor="third_place_prize" className="flex items-center gap-2">
                    <span className="text-amber-700 font-bold">3°</span>
                    Tercer Lugar
                  </Label>
                  <Input
                    id="third_place_prize"
                    value={formData.third_place_prize}
                    onChange={(e) => setFormData({ ...formData, third_place_prize: e.target.value })}
                    placeholder="Ej: Medalla + $20,000"
                    className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Patrocinadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SponsorsList
                  sponsors={formData.sponsors}
                  onSponsorsChange={(sponsors) => setFormData({ ...formData, sponsors })}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <LabelWithTooltip
              htmlFor="inscription_cost"
              label="Costo de Inscripción"
              tooltip="Costo por equipo para participar en el torneo"
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
              Atrás
            </Button>
            <Button
              onClick={() => onSubmit(formData)}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Creando...' : 'Crear Torneo'}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}