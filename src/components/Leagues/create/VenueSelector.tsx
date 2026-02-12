"use client";

import { VenueConfig } from '@/types/venue';
import { useVenues } from '@/hooks/useVenues';
import { MapPin, Star, Check, Building2, ImageIcon } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface VenueSelectorProps {
  selectedVenues: VenueConfig[];
  onChange: (venues: VenueConfig[]) => void;
}

export function VenueSelector({ selectedVenues, onChange }: VenueSelectorProps) {
  const t = useTranslations('venues');
  const { venues, loading } = useVenues({ includeCourts: true });

  const isVenueSelected = (venueId: string) => 
    selectedVenues.some(v => v.venue_id === venueId);

  const isCourtSelected = (venueId: string, courtId: string) => {
    const venue = selectedVenues.find(v => v.venue_id === venueId);
    return venue?.court_ids.includes(courtId) || false;
  };

  const getPrimaryVenueId = () => 
    selectedVenues.find(v => v.is_primary)?.venue_id || '';

  const toggleVenue = (venueId: string) => {
    if (isVenueSelected(venueId)) {
      const newVenues = selectedVenues.filter(v => v.venue_id !== venueId);
      if (getPrimaryVenueId() === venueId && newVenues.length > 0) {
        newVenues[0].is_primary = true;
      }
      onChange(newVenues);
    } else {
      // Al seleccionar un venue, auto-seleccionar todas sus canchas
      const venue = venues.find(v => v.id === venueId);
      const allCourtIds = venue?.courts?.map(c => c.id) || [];
      onChange([...selectedVenues, {
        venue_id: venueId,
        court_ids: allCourtIds,
        is_primary: selectedVenues.length === 0
      }]);
    }
  };

  const toggleCourt = (venueId: string, courtId: string) => {
    const venueIndex = selectedVenues.findIndex(v => v.venue_id === venueId);
    if (venueIndex === -1) return;

    const newVenues = [...selectedVenues];
    const venue = { ...newVenues[venueIndex] };
    
    if (venue.court_ids.includes(courtId)) {
      venue.court_ids = venue.court_ids.filter(id => id !== courtId);
    } else {
      venue.court_ids = [...venue.court_ids, courtId];
    }
    
    newVenues[venueIndex] = venue;
    onChange(newVenues);
  };

  const setPrimaryVenue = (venueId: string) => {
    const newVenues = selectedVenues.map(v => ({
      ...v,
      is_primary: v.venue_id === venueId
    }));
    onChange(newVenues);
  };

  const totalCourts = selectedVenues.reduce((sum, v) => sum + v.court_ids.length, 0);

  const getCourtImageUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null;
    try {
      if (photoUrl.includes('supabase.co')) return photoUrl;
      return null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header - tamaño reducido para no competir con el label de la sección */}
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {t('selectVenuesAndCourts')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('selectVenuesDescription')}
        </p>
      </div>

      {/* Venues Grid */}
      <div className="space-y-4">
        {venues.map(venue => {
          const isSelected = isVenueSelected(venue.id);
          const isPrimary = getPrimaryVenueId() === venue.id;
          const selectedCourtCount = selectedVenues.find(v => v.venue_id === venue.id)?.court_ids.length || 0;
          const totalCourtCount = venue.courts?.length || 0;

          return (
            <div 
              key={venue.id} 
              className={cn(
                "rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                isSelected 
                  ? 'border-emerald-400 dark:border-emerald-500 shadow-lg shadow-emerald-500/10' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              {/* Venue Header - Clickable */}
              <button
                type="button"
                onClick={() => toggleVenue(venue.id)}
                className={cn(
                  "w-full p-5 flex items-center justify-between transition-colors",
                  isSelected 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Selection Indicator */}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    isSelected 
                      ? 'bg-emerald-500 text-white' 
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  )}>
                    {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                  </div>

                  {/* Venue Info */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                        {venue.name}
                      </span>
                    </div>
                    {venue.address && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{venue.address}{venue.city ? `, ${venue.city}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Primary Badge or Court Count */}
                <div className="flex items-center gap-3">
                  {isSelected && isPrimary && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Sede Principal
                    </span>
                  )}
                  {isSelected && !isPrimary && selectedVenues.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimaryVenue(venue.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Hacer principal
                    </button>
                  )}
                  <span className={cn(
                    "text-sm font-medium px-3 py-1.5 rounded-full",
                    isSelected 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}>
                    {totalCourtCount} canchas
                  </span>
                </div>
              </button>

              {/* Courts Section - Always visible when selected */}
              {isSelected && venue.courts && venue.courts.length > 0 && (
                <div className="px-5 pb-5 pt-2 bg-white dark:bg-slate-800/30">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Selecciona las canchas disponibles
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {selectedCourtCount} de {totalCourtCount} seleccionadas
                    </p>
                  </div>
                  
                  {/* Courts Grid with Images */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {venue.courts.map(court => {
                      const courtSelected = isCourtSelected(venue.id, court.id);
                      const imageUrl = getCourtImageUrl(court.photo_url);
                      
                      return (
                        <button
                          key={court.id}
                          type="button"
                          onClick={() => toggleCourt(venue.id, court.id)}
                          className={cn(
                            "relative group rounded-xl overflow-hidden transition-all duration-200",
                            courtSelected 
                              ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-800 shadow-lg' 
                              : 'hover:shadow-md'
                          )}
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] w-full">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={court.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                              </div>
                            )}
                            
                            {/* Overlay */}
                            <div className={cn(
                              "absolute inset-0 transition-all duration-200",
                              courtSelected 
                                ? "bg-emerald-500/30" 
                                : "bg-black/0 group-hover:bg-black/10"
                            )} />

                            {/* Check Badge */}
                            <div className={cn(
                              "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                              courtSelected 
                                ? "bg-emerald-500 text-white scale-100" 
                                : "bg-white/80 dark:bg-slate-800/80 scale-0 group-hover:scale-100"
                            )}>
                              {courtSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                            </div>
                          </div>

                          {/* Court Name */}
                          <div className={cn(
                            "px-3 py-2 text-center transition-colors",
                            courtSelected 
                              ? "bg-emerald-500 text-white" 
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}>
                            <span className="text-sm font-medium">{court.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {venues.length === 0 && (
        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
          <p className="text-amber-700 dark:text-amber-300 font-medium">
            {t('noVenuesAvailable')}
          </p>
        </div>
      )}

      {/* Summary Footer */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Resumen de selección
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedVenues.length} sede{selectedVenues.length !== 1 ? 's' : ''} • {totalCourts} cancha{totalCourts !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {totalCourts > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalCourts}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                canchas disponibles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
