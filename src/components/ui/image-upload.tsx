import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
  currentImage?: string | null;
  className?: string;
  maxSizeMB?: number;
  recommendedSize?: string;
  aspectRatio?: string;
  label?: string;
}

export function ImageUpload({
  onImageChange,
  currentImage = null,
  className,
  maxSizeMB = 5,
  recommendedSize = '1080x1080px',
  aspectRatio = 'cuadrado',
  label = 'Click para subir o arrastrar imagen'
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        // TODO: Usar el sistema de toast para mostrar errores
        alert(`La imagen no debe superar los ${maxSizeMB}MB`);
        return;
      }
      onImageChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setPreviewUrl(null);
  };

  return (
    <div className={cn("mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4", className)}>
      <div className="flex flex-col items-center">
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-40 w-40 object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-white hover:text-red-400"
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <label className="w-full cursor-pointer">
            <div className="flex flex-col items-center">
              <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                PNG, JPG (max. {maxSizeMB}MB)
              </p>
              <p className="text-xs text-purple-500 dark:text-purple-400 mt-2 text-center">
                Recomendado: {recommendedSize} (formato {aspectRatio})<br/>
                Esto asegurará que la imagen se vea perfecta.
              </p>
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
