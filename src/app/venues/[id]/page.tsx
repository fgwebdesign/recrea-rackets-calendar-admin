'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Building2, MapPin, Phone, Mail, Star, ArrowLeft, Grid3x3, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVenues } from '@/hooks/useVenues';
import { Venue, Court } from '@/types/venue';
import { useTranslations } from '@/contexts/TranslationContext';

const MapPreview = dynamic(() => import('@/components/ui/map-preview').then(mod => ({ default: mod.MapPreview })), {
  ssr: false,
  loading: () => <div className="w-full h-[280px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />,
});

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('venues');
  const id = params.id as string;
  const { getVenueById } = useVenues({ includeCourts: false });
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const v = await getVenueById(id);
        setVenue(v);
      } catch {
        setVenue(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-white" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingVenues')}</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Sede no encontrada</p>
          <Button variant="outline" onClick={() => router.push('/venues')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Sedes
          </Button>
        </div>
      </div>
    );
  }

  const location = [venue.address, venue.city, venue.state]
    .filter(Boolean)
    .join(', ') || 'Dirección no configurada';
  const courts = venue.courts || [];
  const hasCoords = venue.latitude != null && venue.longitude != null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/venues')}
          className="mb-6 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Sedes
        </Button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Imagen y badge */}
          <div className="relative h-56 sm:h-64 w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40">
            {venue.photo_url ? (
              <Image
                src={venue.photo_url}
                alt={venue.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-24 w-24 text-blue-500 dark:text-blue-400 opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {venue.is_default && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/95 text-yellow-900 rounded-full text-xs font-semibold shadow-lg">
                <Star className="h-3.5 w-3.5 fill-current" />
                {t('defaultVenue')}
              </div>
            )}
            <h1 className="absolute bottom-4 left-4 right-4 text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              {venue.name}
            </h1>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Información de contacto */}
            <div className="space-y-4">
              {location !== 'Dirección no configurada' && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{location}</span>
                </div>
              )}
              {venue.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{venue.phone}</span>
                </div>
              )}
              {venue.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{venue.email}</span>
                </div>
              )}
            </div>

            {venue.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Descripción</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{venue.description}</p>
              </div>
            )}

            {/* Mapa */}
            {hasCoords && (
              <div className="relative z-0">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Ubicación</h3>
                <MapPreview
                  latitude={venue.latitude!}
                  longitude={venue.longitude!}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 h-[280px]"
                />
              </div>
            )}

            {/* Canchas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                {courts.length} {courts.length !== 1 ? t('courtsCountPlural') : t('courtsCount')}
              </h3>
              {courts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courts.map((court: Court, index: number) => (
                    <div
                      key={court.id}
                      className="bg-gray-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700"
                    >
                      <div className="relative h-40">
                        {court.photo_url ? (
                          <Image
                            src={court.photo_url}
                            alt={court.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority={index < 3}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{court.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Las canchas se asignan desde la sección Canchas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
