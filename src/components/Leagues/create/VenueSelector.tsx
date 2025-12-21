"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VenueConfig } from '@/types/venue';
import { useVenues } from '@/hooks/useVenues';
import { Building2, MapPin, Star } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';

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

      <div className="space-y-3">
        {venues.map(venue => (
          <div 
            key={venue.id} 
            className={`border rounded-lg p-4 transition-colors ${
              isVenueSelected(venue.id) 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={isVenueSelected(venue.id)}
                  onCheckedChange={() => toggleVenue(venue.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-foreground">{venue.name}</span>
                  </div>
                  {venue.address && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
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
                      <Label htmlFor={`primary-${venue.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {t('primaryVenue')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {isVenueSelected(venue.id) && venue.courts && venue.courts.length > 0 && (
              <div className="mt-4 ml-8 space-y-2">
                <p className="text-sm font-medium text-foreground">{t('courtsLabel')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {venue.courts.map(court => (
                    <label
                      key={court.id}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        isCourtSelected(venue.id, court.id) 
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Checkbox
                        checked={isCourtSelected(venue.id, court.id)}
                        onCheckedChange={() => toggleCourt(venue.id, court.id)}
                      />
                      <span className="text-sm">{court.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedVenues.find(v => v.venue_id === venue.id)?.court_ids.length || 0} 
                  {' '}{t('courtsSelected').replace('{total}', venue.courts.length.toString())}
                </p>
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

      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="font-medium text-foreground">
          {t('summary')} {selectedVenues.length} {t('venuesSelected')}, {totalCourts} {t('courtsSelectedSummary')}
        </p>
      </div>
    </div>
  );
}

