import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Pencil, ImageIcon } from "lucide-react";

interface SponsorCardProps {
  id: string;
  name: string;
  logo_url: string;
  onDelete: (sponsor: { id: string; name: string }) => void;
  onEdit: (sponsor: { id: string; name: string; logo_url: string }) => void;
}

const DEFAULT_SPONSOR_IMAGE = '/assets/default-sponsor.jpg';

function getImageUrl(logoUrl: string | null) {
  if (!logoUrl) return DEFAULT_SPONSOR_IMAGE;
  try {
    if (logoUrl.includes('supabase.co')) return logoUrl;
    return DEFAULT_SPONSOR_IMAGE;
  } catch {
    return DEFAULT_SPONSOR_IMAGE;
  }
}

export default function SponsorCard({ id, name, logo_url, onDelete, onEdit }: SponsorCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="relative h-48">
        {logo_url ? (
          <Image
            src={logo_url}
            alt={name}
            fill
            className="object-contain p-4"
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              onClick={() => onEdit({ id, name, logo_url })}
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
