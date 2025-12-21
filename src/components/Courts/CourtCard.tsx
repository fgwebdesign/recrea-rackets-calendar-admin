import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Pencil } from "lucide-react";
import { ImageIcon } from "lucide-react";

interface CourtCardProps {
  id: string;
  name: string;
  photo_url: string;
  venue_id?: string;
  onDelete: (court: { id: string; name: string }) => void;
  onEdit: (court: { id: string; name: string; photo_url: string; venue_id?: string }) => void;
}

const DEFAULT_COURT_IMAGE = '/assets/default-court.jpg';

function getImageUrl(photoUrl: string | null) {
  if (!photoUrl) return DEFAULT_COURT_IMAGE;
  try {
    if (photoUrl.includes('supabase.co')) return photoUrl;
    return DEFAULT_COURT_IMAGE;
  } catch {
    return DEFAULT_COURT_IMAGE;
  }
}

export default function CourtCard({ id, name, photo_url, venue_id, onDelete, onEdit }: CourtCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="relative h-48">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit({ id, name, photo_url, venue_id })}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete({ id, name })}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 