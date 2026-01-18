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

  // Inicializar venue cuando se cargan los venues
  useEffect(() => {
    // Esperar a que terminen de cargar los venues
    if (loading) return;
    
    // Si no hay venues, no hacer nada
    if (venues.length === 0) return;
    
    // Si ya hay un venue seleccionado y existe en la lista, mantenerlo
    if (selectedVenueId && venues.some(v => v.id === selectedVenueId)) {
      return;
    }
    
    // Intentar cargar desde localStorage
    const storedVenueId = localStorage.getItem(STORAGE_KEY);
    
    // Verificar que el venue almacenado existe en la lista de venues activos
    if (storedVenueId && venues.some(v => v.id === storedVenueId)) {
      console.log('📍 Using stored venue:', storedVenueId);
      setSelectedVenueIdState(storedVenueId);
      return;
    }
    
    // Si no hay venue válido almacenado, usar el venue por defecto o el primero
    const defaultVenue = venues.find(v => v.is_default) || venues[0];
    if (defaultVenue) {
      console.log('📍 Using default venue:', defaultVenue.id, defaultVenue.name);
      setSelectedVenueIdState(defaultVenue.id);
      localStorage.setItem(STORAGE_KEY, defaultVenue.id);
    }
  }, [loading, venues, selectedVenueId]);

  const setSelectedVenueId = (venueId: string | undefined) => {
    console.log('📍 Setting venue:', venueId);
    setSelectedVenueIdState(venueId);
    if (venueId) {
      localStorage.setItem(STORAGE_KEY, venueId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // Debug
  useEffect(() => {
    console.log('🏢 KioskVenueContext state:', {
      loading,
      venuesCount: venues.length,
      selectedVenueId,
      selectedVenueName: selectedVenue?.name
    });
  }, [loading, venues.length, selectedVenueId, selectedVenue?.name]);

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
