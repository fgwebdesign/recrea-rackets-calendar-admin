import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface UseGenerateFixtureProps {
  leagueId: string;
  onSuccess?: () => void;
}

export function useGenerateFixture({ leagueId, onSuccess }: UseGenerateFixtureProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFixture = async () => {
    try {
      setIsGenerating(true);

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No se encontró el token de administrador. Por favor, inicia sesión nuevamente."
        });
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/generate-fixture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response:', error);
        toast({
          variant: "destructive",
          title: "Error al generar el fixture",
          description: error.message || "No se pudo generar el calendario de partidos",
          className: "bg-red-500 text-white border-red-600 dark:bg-red-500 dark:text-white dark:border-red-600"
        });
        return;
      }

      const data = await response.json();
      console.log('Fixture generado:', data);

      toast({
        title: "¡Fixture generado con éxito!",
        description: `Se generaron ${data.matches?.length || 0} partidos correctamente`,
        variant: "default",
        className: "bg-green-500 text-white border-green-600 dark:bg-green-500 dark:text-white dark:border-green-600"
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error generando el fixture:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un error al generar el fixture"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateFixture,
    isGenerating
  };
}
