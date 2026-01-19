'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useLeague } from '@/hooks/useLeague';
import { useCategories } from '@/hooks/useCategories';
import { Badge } from '@/components/ui/badge';
import { getCategoryName } from '@/utils/category';
import { PlayerSelector } from '@/components/Tournaments/PlayerSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/contexts/TranslationContext';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_registered: boolean;
  status: 'Ya inscrito' | 'Disponible';
}

export default function AdminRegisterTeamPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;
  const t = useTranslations('leagues');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');
  const [alternatePlayer, setAlternatePlayer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{
    player1?: string;
    player2?: string;
    alternatePlayer?: string;
  }>({});

  const { league, isLoading: leagueLoading } = useLeague(leagueId);
  const { categories } = useCategories();

  const loadPlayers = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/available-players`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar jugadores');
      }
      
      const data = await response.json();
      setPlayers(data || []);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los jugadores disponibles',
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }, [leagueId]);

  // Función para validar formulario completo
  const validateForm = () => {
    const errors: { player1?: string; player2?: string; alternatePlayer?: string } = {};

    // Validar jugador 1
    if (!selectedPlayer1) {
      errors.player1 = 'Selecciona el primer jugador';
    }

    // Validar jugador 2
    if (!selectedPlayer2) {
      errors.player2 = 'Selecciona el segundo jugador';
    } else if (selectedPlayer1 && selectedPlayer1 === selectedPlayer2) {
      errors.player2 = 'Los jugadores deben ser diferentes';
    }

    // Validar jugador suplente
    if (!alternatePlayer || alternatePlayer.trim() === '') {
      errors.alternatePlayer = 'El nombre del jugador suplente es obligatorio';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para limpiar errores de validación
  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  // Validar cuando cambian las selecciones
  useEffect(() => {
    if (selectedPlayer1 || selectedPlayer2 || alternatePlayer) {
      clearValidationErrors();
    }
  }, [selectedPlayer1, selectedPlayer2, alternatePlayer]);

  // Cargar datos iniciales
  useEffect(() => {
    if (leagueId) {
      loadPlayers();
    }
  }, [leagueId, loadPlayers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario antes de enviar
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    clearValidationErrors();

    try {
      const requestBody = {
        userId1: selectedPlayer1,
        userId2: selectedPlayer2,
        alternate_player: alternatePlayer.trim()
      };

      console.log('🔍 Enviando datos al backend:', requestBody);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/admin-register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos del backend
        if (response.status === 400) {
          if (data.message.includes('ya están registrados')) {
            toast({
              title: 'Error de registro',
              description: 'Uno o ambos jugadores ya están registrados en esta liga',
              variant: "destructive",
            });
          } else if (data.message.includes('está completa') || data.message.includes('completo')) {
            toast({
              title: 'Liga completa',
              description: 'La liga ha alcanzado su capacidad máxima',
              variant: "destructive",
            });
          } else if (data.message.includes('distintos')) {
            toast({
              title: 'Jugadores inválidos',
              description: 'Los jugadores deben ser diferentes',
              variant: "destructive",
            });
          } else {
            toast({
              title: 'Error de validación',
              description: data.message || 'Error al validar los datos',
              variant: "destructive",
            });
          }
        } else if (response.status === 404) {
          toast({
            title: 'Liga no encontrada',
            description: 'La liga especificada no existe',
            variant: "destructive",
          });
        } else if (response.status === 500) {
          toast({
            title: 'Error del servidor',
            description: 'Ocurrió un error interno. Por favor, intenta nuevamente',
            variant: "destructive",
          });
        } else {
          toast({
            title: 'Error',
            description: data.message || 'Error al registrar el equipo',
            variant: "destructive",
          });
        }
        return;
      }

      // Éxito - mostrar toast y limpiar formulario
      const player1Name = players.find(p => p.id === selectedPlayer1);
      const player2Name = players.find(p => p.id === selectedPlayer2);
      
      console.log('✅ Mostrando toast de éxito:', {
        player1: player1Name?.first_name,
        player2: player2Name?.first_name,
        alternate: alternatePlayer
      });

      toast({
        title: 'Equipo registrado exitosamente',
        description: `${player1Name?.first_name} ${player1Name?.last_name} & ${player2Name?.first_name} ${player2Name?.last_name} registrados con suplente: ${alternatePlayer}`,
        variant: "default",
      });
      
      setSelectedPlayer1('');
      setSelectedPlayer2('');
      setAlternatePlayer('');
      
      // Recargar lista de jugadores para actualizar estados
      await loadPlayers();

      // Redirigir a la página de detalles de la liga
      setTimeout(() => {
        router.push(`/leagues/${leagueId}`);
      }, 1500);

    } catch (err: unknown) {
      console.error('Error en registro:', err);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (leagueLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-4" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Liga no encontrada
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isLeagueFull = (league.teams?.length || 0) >= league.team_size;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/leagues/${leagueId}`)}
            className="mb-6 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver a la liga
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Registrar Equipo - {league.name}
          </h1>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              {getCategoryName(league.category_id, categories)}
            </Badge>
            {isLeagueFull && (
              <Badge variant="destructive">
                Liga Completa ({league.teams?.length || 0}/{league.team_size})
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Inscribe un equipo en esta liga seleccionando dos jugadores y un jugador suplente.
          </p>
        </div>

        {isLeagueFull ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La liga está completa. No se pueden registrar más equipos.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
                Formulario de Registro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Selección de Jugador 1 */}
                <div>
                  <Label htmlFor="player1" className="mb-2 block">
                    Primer Jugador
                  </Label>
                  <PlayerSelector
                    players={players}
                    selectedPlayer={selectedPlayer1}
                    onPlayerSelect={setSelectedPlayer1}
                    placeholder="Selecciona el primer jugador"
                  />
                  {validationErrors.player1 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.player1}
                    </p>
                  )}
                </div>

                {/* Selección de Jugador 2 */}
                <div>
                  <Label htmlFor="player2" className="mb-2 block">
                    Segundo Jugador
                  </Label>
                  <PlayerSelector
                    players={players}
                    selectedPlayer={selectedPlayer2}
                    onPlayerSelect={setSelectedPlayer2}
                    disabled={!selectedPlayer1}
                    placeholder="Selecciona el segundo jugador"
                    excludePlayer={selectedPlayer1}
                  />
                  {validationErrors.player2 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.player2}
                    </p>
                  )}
                </div>

                {/* Campo de Jugador Suplente */}
                <div>
                  <Label htmlFor="alternatePlayer" className="mb-2 block">
                    Jugador Suplente <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="alternatePlayer"
                    type="text"
                    value={alternatePlayer}
                    onChange={(e) => setAlternatePlayer(e.target.value)}
                    placeholder="Ingresa el nombre del jugador suplente"
                    disabled={!selectedPlayer1 || !selectedPlayer2}
                    className="w-full"
                  />
                  {validationErrors.alternatePlayer && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.alternatePlayer}
                    </p>
                  )}
                  {!selectedPlayer1 || !selectedPlayer2 ? (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      💡 Selecciona ambos jugadores para habilitar este campo
                    </p>
                  ) : null}
                </div>

                {/* Resumen del Equipo */}
                {selectedPlayer1 && selectedPlayer2 && alternatePlayer && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Resumen del Equipo
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Jugador 1:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {players.find(p => p.id === selectedPlayer1)?.first_name} {players.find(p => p.id === selectedPlayer1)?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Jugador 2:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {players.find(p => p.id === selectedPlayer2)?.first_name} {players.find(p => p.id === selectedPlayer2)?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Suplente:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {alternatePlayer}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de Envío */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={
                      loading || 
                      !selectedPlayer1 || 
                      !selectedPlayer2 || 
                      !alternatePlayer.trim()
                    }
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <UsersIcon className="h-5 w-5 mr-3" />
                        Registrar Equipo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
