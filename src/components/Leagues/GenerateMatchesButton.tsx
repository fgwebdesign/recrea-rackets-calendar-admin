import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface GenerateMatchesButtonProps {
  leagueId: string;
  status: string;
  registeredTeams: number;
  maxTeams: number;
  /** 1 = solo ida, 2 = ida y vuelta (usa el de la liga si no se pasa) */
  rounds?: 1 | 2;
}

export function GenerateMatchesButton({ 
  leagueId, 
  status, 
  registeredTeams,
  maxTeams,
  rounds = 1
}: GenerateMatchesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingMatches, setHasExistingMatches] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkExistingMatches = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/matches/league/${leagueId}`);
        if (!response.ok) {
          throw new Error('Error al verificar partidos existentes');
        }
        const data = await response.json();
        setHasExistingMatches(data.total > 0);
      } catch (error) {
        console.error('Error checking existing matches:', error);
        setHasExistingMatches(false);
      }
    };

    if (leagueId) {
      checkExistingMatches();
    }
  }, [leagueId]);

  const handleGenerateMatches = async () => {
    try {
      setIsLoading(true);

      // Validaciones del lado del cliente
      if (status !== 'Inscribiendo' && !hasExistingMatches) {
        toast({
          title: "No se pueden generar partidos",
          description: "La liga ya no está en periodo de inscripción.",
          variant: "destructive",
        });
        return;
      }

      if (registeredTeams < 2) {
        toast({
          title: "No hay suficientes equipos",
          description: "Se necesitan al menos 2 equipos para generar partidos.",
          variant: "destructive",
        });
        return;
      }

      if (registeredTeams < maxTeams) {
        const confirmGenerate = window.confirm(
          'La liga aún no tiene todos los equipos registrados. ¿Deseas generar los partidos de igual manera?'
        );
        if (!confirmGenerate) {
          return;
        }
      }

      // Llamada al backend para generar los partidos
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/generateStandings/${leagueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ rounds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: "Partidos ya generados",
            description: errorData.message,
            variant: "destructive",
          });
          setHasExistingMatches(true);
          return;
        }
        throw new Error(errorData.message || 'Error al generar los partidos');
      }

      const data = await response.json();

      if (!data.matches || data.matches.length === 0) {
        throw new Error('No se generaron partidos');
      }

      toast({
        title: "¡Partidos generados!",
        description: "Los partidos han sido generados exitosamente.",
      });

      // Actualizar el estado local
      setHasExistingMatches(true);

      // Redireccionar a la misma página para forzar una recarga completa
      router.refresh();
      router.push(`/leagues/${leagueId}`);

    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar los partidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modificar la lógica del botón deshabilitado
  const isDisabled = (registeredTeams < 2 || isLoading || hasExistingMatches);

  return (
    <Button
      onClick={handleGenerateMatches}
      disabled={isDisabled}
      className="w-full md:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Trophy className="h-5 w-5" />
      )}
      {isLoading ? 'Generando partidos...' : hasExistingMatches ? 'Partidos ya generados' : 'Generar Partidos'}
    </Button>
  );
} 