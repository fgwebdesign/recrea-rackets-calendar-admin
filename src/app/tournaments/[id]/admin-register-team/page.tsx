'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { Badge } from '@/components/ui/badge';
import { getCategoryName } from '@/utils/category';
import { PlayerSelector } from '@/components/Tournaments/PlayerSelector';
import { TimeSlotSelector } from '@/components/Tournaments/TimeSlotSelector';
import { TeamSummary } from '@/components/Tournaments/TeamSummary';
import { FormStatus } from '@/components/Tournaments/FormStatus';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_registered: boolean;
  status: 'Ya inscrito' | 'Disponible';
}

interface TimeSlot {
  slot_id: string;
  label: string;
  is_available: boolean;
  remaining_slots: number;
  percentage_full: number;
  total_capacity: number;
  current_usage: number;
}

export default function AdminRegisterTeamPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{
    player1?: string;
    player2?: string;
    slot?: string;
  }>({});

  const { tournament, loading: tournamentLoading } = useTournament(tournamentId);
  const { categories } = useCategories();

  // Función para validar formulario completo
  const validateForm = () => {
    const errors: { player1?: string; player2?: string; slot?: string } = {};

    // Validar jugador 1
    if (!selectedPlayer1) {
      errors.player1 = 'Debe seleccionar el primer jugador';
    }

    // Validar jugador 2
    if (!selectedPlayer2) {
      errors.player2 = 'Debe seleccionar el segundo jugador';
    } else if (selectedPlayer1 && selectedPlayer1 === selectedPlayer2) {
      errors.player2 = 'Los dos jugadores deben ser distintos';
    }

    // Validar time slot
    if (!selectedSlot) {
      errors.slot = 'Debe seleccionar un horario';
    } else {
      const slot = availableSlots.find(s => s.slot_id === selectedSlot);
      if (slot && !slot.is_available) {
        errors.slot = 'Este horario está completo';
      }
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
    if (selectedPlayer1 || selectedPlayer2 || selectedSlot) {
      clearValidationErrors();
    }
  }, [selectedPlayer1, selectedPlayer2, selectedSlot]);

  // Cargar datos iniciales
  useEffect(() => {
    if (tournamentId) {
      loadPlayers();
      loadAvailableSlots();
    }
  }, [tournamentId]);

  const loadPlayers = async () => {
    try {
      // Usar el nuevo endpoint que filtra jugadores ya registrados en el torneo
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/available-players`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar jugadores disponibles');
      }
      
      const data = await response.json();
      setPlayers(data || []);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
      toast({
        title: "Error",
        description: "Error al cargar la lista de jugadores disponibles",
        variant: "destructive",
      });
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/available-time-slots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar slots disponibles');
      }
      
      const data = await response.json();
      setAvailableSlots(data.available_slots || []);
    } catch (err) {
      console.error('Error cargando slots:', err);
      toast({
        title: "Error",
        description: "Error al cargar los horarios disponibles",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario antes de enviar
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    clearValidationErrors();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/admin-register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          userId1: selectedPlayer1,
          userId2: selectedPlayer2,
          unavailable_time_slot: selectedSlot
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos del backend
        if (response.status === 400) {
          if (data.message.includes('ya están registrados')) {
            toast({
              title: "Error de Registro",
              description: "Uno o ambos jugadores ya están registrados en este torneo",
              variant: "destructive",
            });
          } else if (data.message.includes('está completo')) {
            toast({
              title: "Torneo Completo",
              description: "El torneo está completo o el horario seleccionado no tiene cupos disponibles",
              variant: "destructive",
            });
          } else if (data.message.includes('distintos')) {
            toast({
              title: "Jugadores Inválidos",
              description: "Los dos jugadores deben ser distintos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error de Validación",
              description: data.message || 'Error en los datos enviados',
              variant: "destructive",
            });
          }
        } else if (response.status === 404) {
          toast({
            title: "Torneo No Encontrado",
            description: "El torneo solicitado no existe",
            variant: "destructive",
          });
        } else if (response.status === 500) {
          toast({
            title: "Error del Servidor",
            description: "Error interno del servidor. Intenta nuevamente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || 'Error al registrar el equipo',
            variant: "destructive",
          });
        }
        return;
      }

      // Éxito - mostrar toast y limpiar formulario
      const player1Name = players.find(p => p.id === selectedPlayer1);
      const player2Name = players.find(p => p.id === selectedPlayer2);
      const slotInfo = availableSlots.find(s => s.slot_id === selectedSlot);
      
      console.log('🎉 Mostrando toast de éxito:', {
        player1: player1Name?.first_name,
        player2: player2Name?.first_name,
        slot: slotInfo?.label
      });
      
      toast({
        title: "¡Equipo Registrado Exitosamente! 🎉",
        description: `${player1Name?.first_name} ${player1Name?.last_name} & ${player2Name?.first_name} ${player2Name?.last_name} registrados en ${slotInfo?.label}`,
        variant: "default",
      });
      
      // Limpiar formulario
      setSelectedPlayer1('');
      setSelectedPlayer2('');
      setSelectedSlot('');
      
      // Recargar slots disponibles
      await loadAvailableSlots();

    } catch (err: any) {
      console.error('Error en registro:', err);
      toast({
        title: "Error de Conexión",
        description: "Verifica tu conexión a internet e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (tournamentLoading || loadingData) {
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

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontró el torneo solicitado.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}/teams`)}
            className="mb-6 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver a equipos
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Registrar Equipo - {tournament.name}
          </h1>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              {getCategoryName(tournament.category_id, categories)}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Inscribe un equipo en el torneo desde el panel de administración
          </p>
        </div>

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
                <PlayerSelector
                  players={players}
                  selectedPlayer={selectedPlayer1}
                  onPlayerSelect={setSelectedPlayer1}
                  placeholder="Seleccionar primer jugador..."
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
                <PlayerSelector
                  players={players}
                  selectedPlayer={selectedPlayer2}
                  onPlayerSelect={setSelectedPlayer2}
                  disabled={!selectedPlayer1}
                  placeholder="Seleccionar segundo jugador..."
                  excludePlayer={selectedPlayer1}
                />
                {validationErrors.player2 && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.player2}
                  </p>
                )}
              </div>

              {/* Selección de Time Slot */}
              <div>
                <TimeSlotSelector
                  slots={availableSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                  disabled={!selectedPlayer1 || !selectedPlayer2}
                />
                {validationErrors.slot && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.slot}
                  </p>
                )}
              </div>

              {/* Estado del Formulario */}
              <FormStatus
                player1={selectedPlayer1}
                player2={selectedPlayer2}
                slot={selectedSlot}
                validationErrors={validationErrors}
              />

              {/* Resumen del Equipo */}
              {selectedPlayer1 && selectedPlayer2 && selectedSlot && (
                <TeamSummary
                  player1={players.find(p => p.id === selectedPlayer1) || null}
                  player2={players.find(p => p.id === selectedPlayer2) || null}
                  slotLabel={availableSlots.find(s => s.slot_id === selectedSlot)?.label}
                  slotInfo={availableSlots.find(s => s.slot_id === selectedSlot)}
                />
              )}


              {/* Botón de Envío */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={loading || !selectedPlayer1 || !selectedPlayer2 || !selectedSlot}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Registrando Equipo...
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
      </div>
    </div>
  );
}
