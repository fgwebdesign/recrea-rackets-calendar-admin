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

  const fetchImages = async (pageToFetch = page) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gallery/league/${leagueId}?page=${pageToFetch}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar las imágenes');
      }

      const data: GalleryResponse = await response.json();
      
      // Si es la primera página, reemplazar imágenes, si no, agregar a las existentes
      setImages(prev => pageToFetch === 1 ? data.photos : [...prev, ...data.photos]);
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
    const data = await fetchImages(nextPage);
    if (data) {
      setPage(nextPage);
    }
  };

  useEffect(() => {
    if (leagueId) {
      fetchImages();
    }
  }, [leagueId, page]);

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

      toast({
        title: "¡Éxito!",
        description: "Imagen eliminada correctamente",
        className: "bg-green-500 text-white"
      });

      // Recargar imágenes
      fetchImages();
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
      return fetchImages(1);
    }
  };
}