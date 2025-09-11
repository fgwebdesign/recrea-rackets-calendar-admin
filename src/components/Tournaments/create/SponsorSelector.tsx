import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import Image from 'next/image';
import { Sponsor } from '@/types/sponsor';

interface SponsorSelectorProps {
  selectedSponsors: string[];
  onSponsorsChange: (sponsorIds: string[]) => void;
  error?: string;
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

export function SponsorSelector({ selectedSponsors, onSponsorsChange, error }: SponsorSelectorProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  const MAX_VISIBLE_SPONSORS = 6;

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sponsors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setSponsors(data || []);
      } catch (err) {
        console.error('Error fetching sponsors:', err);
        setFetchError(err instanceof Error ? err.message : 'Error al cargar sponsors');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  const handleSponsorToggle = (sponsorId: string) => {
    const isSelected = selectedSponsors.includes(sponsorId);
    const newSelectedSponsors = isSelected
      ? selectedSponsors.filter(id => id !== sponsorId)
      : [...selectedSponsors, sponsorId];
    
    onSponsorsChange(newSelectedSponsors);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LabelWithTooltip
          label="Patrocinadores"
          tooltip="Selecciona los patrocinadores que participarán en el torneo"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <LabelWithTooltip
          label="Patrocinadores"
          tooltip="Selecciona los patrocinadores que participarán en el torneo"
        />
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error al cargar sponsors: {fetchError}
          </p>
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="space-y-4">
        <LabelWithTooltip
          label="Patrocinadores"
          tooltip="Selecciona los patrocinadores que participarán en el torneo"
        />
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No hay sponsors disponibles. Puedes crear sponsors desde la sección "Patrocinadores".
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <LabelWithTooltip
          label="Patrocinadores"
          tooltip="Selecciona los patrocinadores que participarán en el torneo"
        />
        
        <div className={cn(
          "space-y-3",
          error && "border-2 border-red-500 dark:border-red-500 rounded-lg p-3"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAll ? sponsors : sponsors.slice(0, MAX_VISIBLE_SPONSORS)).map((sponsor) => {
              const isSelected = selectedSponsors.includes(sponsor.id);
              
              return (
                <Card 
                  key={sponsor.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    isSelected 
                      ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30" 
                      : "hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                  onClick={() => handleSponsorToggle(sponsor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      {/* Logo del Sponsor */}
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        {sponsor.logo_url ? (
                          <Image
                            src={sponsor.logo_url}
                            alt={sponsor.name}
                            fill
                            className="object-contain p-1"
                            priority={false}
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {sponsor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Información del Sponsor */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {sponsor.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Patrocinador
                        </p>
                      </div>

                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSponsorToggle(sponsor.id)}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Botón Ver Más / Ver Menos */}
          {sponsors.length > MAX_VISIBLE_SPONSORS && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver más ({sponsors.length - MAX_VISIBLE_SPONSORS} más)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Resumen de Sponsors Seleccionados */}
          {selectedSponsors.length > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300">
                  {selectedSponsors.length} {selectedSponsors.length === 1 ? 'sponsor' : 'sponsors'} seleccionado{selectedSponsors.length === 1 ? '' : 's'}
                </Badge>
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  {sponsors
                    .filter(s => selectedSponsors.includes(s.id))
                    .map(s => s.name)
                    .join(', ')
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </TooltipProvider>
  );
}
