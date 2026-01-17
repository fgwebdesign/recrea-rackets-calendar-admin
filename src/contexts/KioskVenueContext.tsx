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
  const [initialized, setInitialized] = useState(false);

  // Inicializar venue cuando se cargan los venues
  useEffect(() => {
    if (loading || initialized) return;
    
    // Intentar cargar desde localStorage
    const storedVenueId = localStorage.getItem(STORAGE_KEY);
    
    // Verificar que el venue almacenado existe en la lista de venues activos
    const storedVenueExists = storedVenueId && venues.some(v => v.id === storedVenueId);
    
    if (storedVenueExists) {
      console.log('📍 Using stored venue:', storedVenueId);
      setSelectedVenueIdState(storedVenueId);
    } else {
      // Si no existe o no está en la lista, usar el venue por defecto o el primero
      const defaultVenue = venues.find(v => v.is_default) || venues[0];
      if (defaultVenue) {
        console.log('📍 Using default venue:', defaultVenue.id, defaultVenue.name);
        setSelectedVenueIdState(defaultVenue.id);
        localStorage.setItem(STORAGE_KEY, defaultVenue.id);
      } else if (storedVenueId) {
        // Limpiar localStorage si el venue no existe
        console.log('⚠️ Stored venue not found, clearing localStorage');
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    setInitialized(true);
  }, [loading, venues, initialized]);

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

