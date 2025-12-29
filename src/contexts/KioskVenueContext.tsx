'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useVenues } from '@/hooks/useVenues';
import { Venue } from '@/types/venue';

interface KioskVenueContextType {
  selectedVenueId: string | undefined;
  selectedVenue: Venue | undefined;
  setSelectedVenueId: (venueId: string | undefined) => void;
  venues: Venue[];
  loading: boolean;
}

const KioskVenueContext = createContext<KioskVenueContextType | undefined>(undefined);

const STORAGE_KEY = 'kiosk_selected_venue_id';

export function KioskVenueProvider({ children }: { children: ReactNode }) {
  const { venues, loading } = useVenues({ includeCourts: false, isActive: 'true' });
  const [selectedVenueId, setSelectedVenueIdState] = useState<string | undefined>(undefined);

  // Cargar venue seleccionado desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedVenueIdState(stored);
    }
  }, []);

  // Establecer venue por defecto cuando se cargan los venues
  useEffect(() => {
    if (!loading && venues.length > 0 && !selectedVenueId) {
      const defaultVenue = venues.find(v => v.is_default) || venues[0];
      if (defaultVenue) {
        setSelectedVenueIdState(defaultVenue.id);
        localStorage.setItem(STORAGE_KEY, defaultVenue.id);
      }
    }
  }, [loading, venues, selectedVenueId]);

  const setSelectedVenueId = (venueId: string | undefined) => {
    setSelectedVenueIdState(venueId);
    if (venueId) {
      localStorage.setItem(STORAGE_KEY, venueId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  return (
    <KioskVenueContext.Provider
      value={{
        selectedVenueId,
        selectedVenue,
        setSelectedVenueId,
        venues,
        loading
      }}
    >
      {children}
    </KioskVenueContext.Provider>
  );
}

export function useKioskVenue() {
  const context = useContext(KioskVenueContext);
  if (context === undefined) {
    throw new Error('useKioskVenue must be used within a KioskVenueProvider');
  }
  return context;
}

