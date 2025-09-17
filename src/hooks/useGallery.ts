import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  uploaded_at: string;
}

interface GalleryResponse {
  photos: GalleryImage[];
  page: number;
  pageSize: number;
  total: number;
}

export function useGallery(leagueId: string) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchImages = async (pageToFetch = page, reset = false) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gallery/league/${leagueId}?page=${pageToFetch}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar las imágenes');
      }

      const data: GalleryResponse = await response.json();
      
      // Evitar duplicados usando un Set para IDs únicos
      setImages(prev => {
        if (reset || pageToFetch === 1) {
          return data.photos;
        }
        
        // Filtrar duplicados basándose en el ID
        const existingIds = new Set(prev.map(img => img.id));
        const newPhotos = data.photos.filter(img => !existingIds.has(img.id));
        return [...prev, ...newPhotos];
      });
      
      setTotal(data.total);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las imágenes"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoading || images.length >= total) return;
    
    const nextPage = page + 1;
    const data = await fetchImages(nextPage, false);
    if (data) {
      setPage(nextPage);
    }
  };

  useEffect(() => {
    if (leagueId) {
      setPage(1);
      fetchImages(1, true);
    }
  }, [leagueId]);

  const deleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gallery/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la imagen');
      }

      // Eliminar imagen del estado local sin recargar todo
      setImages(prev => prev.filter(img => img.id !== imageId));
      setTotal(prev => prev - 1);

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
    }
  };

  return {
    images,
    isLoading,
    error,
    page,
    pageSize,
    total,
    hasMore: images.length < total,
    loadMore,
    deleteImage,
    refetch: () => {
      setPage(1);
      return fetchImages(1, true);
    }
  };
}