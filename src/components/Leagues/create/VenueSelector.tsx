"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VenueConfig } from '@/types/venue';
import { useVenues } from '@/hooks/useVenues';
import { Building2, MapPin, Star, ImageIcon } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
      onChange([...selectedVenues, {
        venue_id: venueId,
        court_ids: [],
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  const getCourtImageUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null;
    try {
      if (photoUrl.includes('supabase.co')) return photoUrl;
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-foreground dark:text-foreground">
          {t('selectVenuesAndCourts')}
        </h2>
        <p className="text-muted-foreground">
          {t('selectVenuesDescription')}
        </p>
      </div>

      <div className="space-y-4">
        {venues.map(venue => (
          <div 
            key={venue.id} 
            className={cn(
              "border-2 rounded-xl p-5 transition-all duration-200",
              isVenueSelected(venue.id) 
                ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <Checkbox
                  checked={isVenueSelected(venue.id)}
                  onCheckedChange={() => toggleVenue(venue.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    <span className="font-semibold text-lg text-foreground">{venue.name}</span>
                  </div>
                  {venue.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{venue.address}{venue.city ? `, ${venue.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {isVenueSelected(venue.id) && (
                <div className="flex items-center gap-2">
                  <RadioGroup 
                    value={getPrimaryVenueId()}
                    onValueChange={setPrimaryVenue}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={venue.id} id={`primary-${venue.id}`} />
                      <Label htmlFor={`primary-${venue.id}`} className="text-sm cursor-pointer flex items-center gap-1.5 font-medium">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {t('primaryVenue')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {isVenueSelected(venue.id) && venue.courts && venue.courts.length > 0 && (
              <div className="mt-6 ml-12 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{t('courtsLabel')}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedVenues.find(v => v.venue_id === venue.id)?.court_ids.length || 0} 
                    {' '}{t('courtsSelected').replace('{total}', venue.courts.length.toString())}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {venue.courts.map(court => {
                    const isSelected = isCourtSelected(venue.id, court.id);
                    const imageUrl = getCourtImageUrl(court.photo_url);
                    
                    return (
                      <label
                        key={court.id}
                        className={cn(
                          "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200",
                          isSelected 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md ring-2 ring-green-200 dark:ring-green-800' 
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="relative h-32 w-full">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={court.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <div className={cn(
                            "absolute top-2 right-2 transition-opacity",
                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}>
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center",
                              isSelected 
                                ? "bg-green-500" 
                                : "bg-white/90 dark:bg-gray-800/90"
                            )}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            "absolute inset-0 transition-opacity",
                            isSelected 
                              ? "bg-green-500/20" 
                              : "bg-black/0 group-hover:bg-black/10"
                          )} />
                        </div>
                        <div className="p-3 flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCourt(venue.id, court.id)}
                            className="flex-shrink-0"
                          />
                          <span className={cn(
                            "text-sm font-medium flex-1",
                            isSelected 
                              ? "text-green-700 dark:text-green-300" 
                              : "text-foreground"
                          )}>
                            {court.name}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {venues.length === 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            {t('noVenuesAvailable')}
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="font-semibold text-foreground">
          {t('summary')} {selectedVenues.length} {t('venuesSelected')}, {totalCourts} {t('courtsSelectedSummary')}
        </p>
      </div>
    </div>
  );
}

