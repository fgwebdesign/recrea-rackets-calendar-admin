"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Mail, Building2, Star, Trash2, Pencil, Grid3x3 } from "lucide-react";

const MapPreview = dynamic(() => import('@/components/ui/map-preview').then(mod => ({ default: mod.MapPreview })), {
  ssr: false,
  loading: () => <div className="w-full h-32 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />,
});
import { Button } from "@/components/ui/button";
import { Venue } from "@/types/venue";
import { useTranslations } from '@/contexts/TranslationContext';

interface VenueCardProps {
  venue: Venue;
  onEdit: (venue: Venue) => void;
  onDelete: (venue: Venue) => void;
  priority?: boolean; // Para las primeras imágenes visibles
}

export default function VenueCard({ venue, onEdit, onDelete, priority = false }: VenueCardProps) {
  const router = useRouter();
  const t = useTranslations('venues');
  const location = [venue.address, venue.city, venue.state]
    .filter(Boolean)
    .join(', ') || t('addressNotConfigured');

  const courtsCount = venue.courts_count || venue.courts?.length || 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/venues/${venue.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/venues/${venue.id}`)}
      className="group bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900/50 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
    >
      {/* Imagen destacada */}
      <div className="relative h-48 w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 overflow-hidden">
        {venue.photo_url ? (
          <Image
            src={venue.photo_url}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={85}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-20 w-20 text-blue-500 dark:text-blue-400 opacity-50" />
          </div>
        )}
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Badge de sede por defecto */}
        {venue.is_default && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/95 dark:bg-yellow-500/95 text-yellow-900 dark:text-yellow-950 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-current" />
            {t('defaultVenue')}
          </div>
        )}

        {/* Botones de acción en la esquina superior */}
        <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit(venue);
            }}
            className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md backdrop-blur-sm"
          >
            <Pencil className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(venue);
            }}
            className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-md backdrop-blur-sm"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Título */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
            {venue.name}
          </h3>
        </div>

        {/* Información de contacto */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{location}</span>
          </div>
          {venue.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{venue.phone}</span>
            </div>
          )}
          {venue.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{venue.email}</span>
            </div>
          )}
        </div>

        {/* Mapa (si hay coordenadas) */}
        {venue.latitude != null && venue.longitude != null && (
          <div className="relative z-0 mb-5 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <MapPreview
              latitude={venue.latitude}
              longitude={venue.longitude}
              className="h-32 rounded-lg"
              zoom={14}
            />
          </div>
        )}

        {/* Separador */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-5" />

        {/* Información de canchas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Grid3x3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {courtsCount} {courtsCount !== 1 ? t('courtsCountPlural') : t('courtsCount')}
              </p>
              {venue.courts && venue.courts.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                  {venue.courts.map(c => c.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

