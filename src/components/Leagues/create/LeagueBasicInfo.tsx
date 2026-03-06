import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Category } from '@/hooks/useCategories';
import { cn } from "@/lib/utils";
import { Info, ImageIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { LeagueFormData } from '@/hooks/useLeagueForm';

interface LeagueBasicInfoProps {
  formData: LeagueFormData;
  setFormData: (data: LeagueFormData) => void;
  categories: Category[];
  onSubmit: (data: LeagueFormData) => void;
  /** Si true, no se muestra el botón Continuar (se usa cuando el paso incluye VenueSelector debajo) */
  hideSubmitButton?: boolean;
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

export function LeagueBasicInfo({ formData, setFormData, categories = [], onSubmit, hideSubmitButton }: LeagueBasicInfoProps) {
  const [errors, setErrors] = useState({
    name: false,
    description: false,
    cost: false,
    categories: false,
    team_size: false
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = () => {
    const newErrors = {
      name: !formData.name.trim(),
      description: !formData.description.trim(),
      cost: formData.inscription_cost <= 0,
      categories: !Array.isArray(formData.categories) || formData.categories.length < 3,
      team_size: formData.team_size < 4 || formData.team_size > 16
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    onSubmit(formData);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = Array.isArray(formData.categories) ? formData.categories : [];
    const isSelected = currentCategories.includes(categoryId);
    
    const newCategories = isSelected
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    setFormData({ ...formData, categories: newCategories });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Show error toast or message
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6 text-foreground dark:text-foreground">Información Básica de la Liga</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 bg-background/50 rounded-lg border border-border/50">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Información Básica de la Liga
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <LabelWithTooltip
              htmlFor="name"
              label="Nombre de la Liga"
              tooltip="Nombre identificativo de la liga"
            />
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Liga de Verano 2024"
              className="bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">El nombre es requerido</p>
            )}
          </div>

          <div>
            <LabelWithTooltip
              label="Categorías"
              tooltip="Selecciona las categorías que participarán en la liga"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
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
              <p className="text-sm text-red-500 mt-2">Debes seleccionar al menos 3 categorías</p>
            )}
            {Array.isArray(formData.categories) && formData.categories.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Categorías seleccionadas: {formData.categories.length}
                {formData.categories.length < 3 && (
                  <span className="text-destructive"> (mínimo 3)</span>
                )}
              </p>
            )}
          </div>

          <div>
            <LabelWithTooltip
              htmlFor="description"
              label="Descripción"
              tooltip="Información adicional sobre la liga"
            />
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los detalles importantes de la liga..."
              className="min-h-[100px] bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">La descripción es requerida</p>
            )}
          </div>

          <div>
            <LabelWithTooltip
              label="Imagen de la Liga"
              tooltip="Imagen representativa de la liga"
            />
            <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex flex-col items-center">
                {previewUrl ? (
                  <div className="relative group">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={160}
                      height={160}
                      className="h-40 w-40 object-contain rounded-lg"
                      unoptimized
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: null });
                          setPreviewUrl(null);
                        }}
                        className="text-white hover:text-red-400"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full cursor-pointer">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Click para subir o arrastrar imagen
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        PNG, JPG (max. 5MB)
                      </p>
                      <p className="text-xs text-purple-500 dark:text-purple-400 mt-2 text-center">
                        Recomendado: 1080x1080px (formato cuadrado)<br/>
                        Esto asegurará que la imagen se vea perfecta.
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <LabelWithTooltip
                htmlFor="inscription_cost"
                label="Costo de Inscripción"
                tooltip="Costo por equipo para participar en la liga"
              />
              <Input
                id="inscription_cost"
                type="number"
                min="0"
                value={formData.inscription_cost}
                onChange={(e) => setFormData({ ...formData, inscription_cost: Number(e.target.value) })}
                placeholder="Ej: 50000"
                className={cn(
                  "bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary",
                  errors.cost && "border-red-500"
                )}
              />
              {errors.cost && (
                <p className="text-sm text-red-500 mt-1">El costo debe ser mayor a 0</p>
              )}
            </div>

            <div>
              <LabelWithTooltip
                htmlFor="team_size"
                label="Número de equipos por categoría"
                tooltip="Cantidad máxima de equipos que pueden participar en cada categoría (Recomendado: 8)"
              />
              <Input
                id="team_size"
                type="number"
                min="4"
                max="16"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: Number(e.target.value) })}
                placeholder="Ingrese el numero de parejas por categoria"
                className={cn(
                  "bg-transparent dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary",
                  errors.team_size && "border-red-500"
                )}
              />
              {errors.team_size && (
                <p className="text-sm text-red-500 mt-1">El número de equipos debe estar entre 4 y 16</p>
              )}
            </div>
          </div>

          {/* Nuevos campos: Tipo de liga y vueltas */}
          <div className="space-y-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <LabelWithTooltip
                label="Tipo de Competencia"
                tooltip="Selecciona el formato de competencia para la liga"
              />
              <div className="grid grid-cols-1 gap-3 mt-2">
                {[
                  { value: 'round_robin', label: 'Todos contra todos (Round Robin)', desc: 'Cada equipo juega contra todos los demás' },
                  { value: 'groups', label: 'Fase de grupos + Playoffs', desc: 'Grupos clasificatorios y luego eliminatorias' }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, league_type: type.value as 'round_robin' | 'groups' })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.league_type === type.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-700 dark:text-slate-300">{type.label}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {formData.league_type === 'round_robin' && (
              <div>
                <LabelWithTooltip
                  label="Vueltas"
                  tooltip="Define si se juega solo ida o ida y vuelta"
                />
                <div className="flex gap-4 mt-2">
                  {[1, 2].map(rounds => (
                    <button
                      key={rounds}
                      type="button"
                      onClick={() => setFormData({ ...formData, rounds: rounds as 1 | 2 })}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        formData.rounds === rounds
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {rounds === 1 ? 'Solo Ida' : 'Ida y Vuelta'}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ℹ️ Con {formData.team_size} equipos: {formData.rounds === 1 
                    ? `${formData.team_size - 1} fechas` 
                    : `${(formData.team_size - 1) * 2} fechas`}
                </p>
              </div>
            )}
          </div>

          {!hideSubmitButton && (
            <div className="pt-4 flex justify-end">
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                Continuar
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 