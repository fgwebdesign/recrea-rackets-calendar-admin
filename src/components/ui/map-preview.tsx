'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { cn } from '@/lib/utils';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  /** Permitir arrastrar el marcador para ajustar la ubicación */
  draggable?: boolean;
  /** Callback cuando el usuario mueve el marcador */
  onPositionChange?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

/**
 * Mapa embebido con OpenStreetMap + Leaflet.
 * Se importa dinámicamente para evitar SSR issues con Leaflet.
 */
export function MapPreview({
  latitude,
  longitude,
  draggable = false,
  onPositionChange,
  className,
  zoom = 15,
}: MapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Import Leaflet dinámicamente (no funciona en SSR)
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      // @ts-expect-error - leaflet CSS no tiene declaración de tipos
      await import('leaflet/dist/leaflet.css');

      // Fix para el ícono default de Leaflet en bundlers
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (mapRef.current) {
        // Mapa ya existe, actualizar posición
        mapRef.current.setView([latitude, longitude], zoom);
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        return;
      }

      // Crear mapa
      const map = L.map(mapContainerRef.current!, {
        center: [latitude, longitude],
        zoom,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      // CartoDB Voyager: estilo moderno, colores suaves (sin el gris antiguo de OSM estándar)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], {
        icon: DefaultIcon,
        draggable,
      }).addTo(map);

      if (draggable && onPositionChange) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        });
      }

      mapRef.current = map;
      markerRef.current = marker;

      // Forzar recálculo del tamaño (necesario en containers dinámicos)
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Solo recrear si cambian las coordenadas significativamente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainerRef}
      className={cn(
        'w-full h-[200px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700',
        className,
      )}
    />
  );
}
