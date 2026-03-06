import { X } from 'lucide-react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';

interface PreviewImage {
  file: File;
  preview: string;
  caption?: string;
}

interface GalleryPreviewProps {
  images: PreviewImage[];
  onRemove: (index: number) => void;
  onCaptionChange: (index: number, caption: string) => void;
}

export function GalleryPreview({ images, onRemove, onCaptionChange }: GalleryPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const slides = images.map(img => ({
    src: img.preview,
    alt: img.caption || img.file.name
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={image.preview} className="relative group">
            <div 
              className="aspect-square relative overflow-hidden rounded-lg cursor-pointer"
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image.preview}
                alt={image.caption || image.file.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <input
              type="text"
              placeholder="Descripción..."
              value={image.caption || ''}
              onChange={(e) => onCaptionChange(index, e.target.value)}
              className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/50 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 placeholder-white/70"
            />
          </div>
        ))}
      </div>

      <Lightbox
        open={selectedImage !== null}
        close={() => setSelectedImage(null)}
        index={selectedImage || 0}
        slides={slides}
      />
    </div>
  );
} 