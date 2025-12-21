"use client";

import { MapPin, Phone, Mail, Building2, Star, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Venue } from "@/types/venue";
import { useTranslations } from '@/contexts/TranslationContext';

interface VenueCardProps {
  venue: Venue;
  onEdit: (venue: Venue) => void;
  onDelete: (venue: Venue) => void;
}

export default function VenueCard({ venue, onEdit, onDelete }: VenueCardProps) {
  const t = useTranslations('venues');
  const location = [venue.address, venue.city, venue.state]
    .filter(Boolean)
    .join(', ') || t('addressNotConfigured');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {venue.name}
            </h3>
            {venue.is_default && (
              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md text-xs font-medium">
                <Star className="h-3 w-3" />
                {t('defaultVenue')}
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
            {venue.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{venue.phone}</span>
              </div>
            )}
            {venue.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{venue.email}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(venue)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(venue)}
            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-4 w-4 text-gray-500 dark:text-gray-400 flex items-center justify-center">•</span>
          <span className="text-gray-700 dark:text-gray-300">
            {venue.courts_count || venue.courts?.length || 0} {(venue.courts_count || venue.courts?.length || 0) !== 1 ? t('courtsCountPlural') : t('courtsCount')}
          </span>
          {venue.courts && venue.courts.length > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              : {venue.courts.map(c => c.name).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

