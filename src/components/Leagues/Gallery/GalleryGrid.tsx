import { useState, useEffect, memo, useMemo } from 'react';
import Image from 'next/image';
import { Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useInView } from 'react-intersection-observer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  uploaded_at: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  isAdmin?: boolean;
  onImageDelete?: (imageId: string) => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  total?: number;
}

export const GalleryGrid = memo(function GalleryGrid({ 
  images, 
  isAdmin = false, 
  onImageDelete,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  total = 0
}: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Función para cargar más imágenes manualmente
  const handleLoadMore = () => {
    if (hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    try {
      setIsDeleting(true);
      await onImageDelete?.(imageToDelete);
      setImageToDelete(null);
      toast({
        title: "¡Éxito!",
        description: "Imagen eliminada correctamente",
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la imagen"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const slides = useMemo(() => images.map(img => ({
    src: img.image_url,
    alt: img.caption
  })), [images]);

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
          <div key={`${image.id}-${index}`} className="relative group">
            <div 
              className="aspect-square relative overflow-hidden rounded-lg cursor-pointer"
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image.image_url}
                alt={image.caption || `Imagen de la liga ${image.id}`}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                quality={75}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLi44QjxAOEA4Njo0PkJBREVMTFZBVVxVQz9HVVVMV0z/2wBDAR0XFx0aHR4eHUw4ODhMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <p className="text-white text-sm text-center px-2">
                  {image.caption || 'Sin descripción'}
                </p>
              </div>
            </div>
            
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageToDelete(image.id);
                }}
                disabled={isDeleting}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        ))}
        </div>

        {/* Botón Cargar Más */}
        {hasMore && (
          <div className="flex flex-col items-center py-8 space-y-4">
            {/* Contador de imágenes */}
            <div className="text-sm text-muted-foreground">
              Mostrando {images.length} de {total} imágenes
            </div>
            
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando más imágenes...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Cargar más imágenes ({total - images.length} restantes)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={imageToDelete !== null} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Lightbox
        open={selectedImage !== null}
        close={() => setSelectedImage(null)}
        index={selectedImage || 0}
        slides={slides}
      />
    </>
  );
}); 