import Image from 'next/image';
import { Trash2, Pencil, Building2 } from "lucide-react";
import { ImageIcon } from "lucide-react";
import { useVenues } from "@/hooks/useVenues";

interface CourtCardProps {
  id: string;
  name: string;
  photo_url: string;
  venue_id?: string;
  onDelete: (court: { id: string; name: string }) => void;
  onEdit: (court: { id: string; name: string; photo_url: string; venue_id?: string }) => void;
}

export default function CourtCard({ id, name, photo_url, venue_id, onDelete, onEdit }: CourtCardProps) {
  const { venues } = useVenues({ includeCourts: false });
  const venue = venue_id ? venues.find(v => v.id === venue_id) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="relative h-48">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit({ id, name, photo_url, venue_id })}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete({ id, name })}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        {venue && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span>{venue.name}</span>
          </div>
        )}
      </div>
    </div>
  );
} 