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
import { ShirtSizesSelector } from '@/components/Tournaments/ShirtSizesSelector';
import { useTranslations } from '@/contexts/TranslationContext';

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
  const t = useTranslations('tournaments');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedShirtSizes, setSelectedShirtSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{
    player1?: string;
    player2?: string;
    slot?: string;
    shirtSizes?: string;
  }>({});

  const { tournament, loading: tournamentLoading } = useTournament(tournamentId);
  const { categories } = useCategories();

  // Función para obtener si el torneo requiere remeras
  const getRequiresShirts = () => {
    if (!tournament) return false;
    
    // Primero verificar si está directamente en el torneo
    if (tournament.requires_shirts !== undefined) {
      return tournament.requires_shirts;
    }
    
    // Si no, verificar en tournament_info (que es un array)
    if (tournament.tournament_info && Array.isArray(tournament.tournament_info) && tournament.tournament_info.length > 0) {
      return tournament.tournament_info[0].requires_shirts || false;
    }
    
    return false;
  };

  // Debug: verificar datos del torneo
  useEffect(() => {
    if (tournament) {
      console.log('🔍 Tournament data:', tournament);
      console.log('🔍 Tournament requires_shirts:', tournament.requires_shirts);
      console.log('🔍 Tournament tournament_info:', tournament.tournament_info);
      
      // Verificar si requires_shirts está en tournament_info (array)
      if (tournament.tournament_info && Array.isArray(tournament.tournament_info)) {
        console.log('🔍 Tournament info is array, length:', tournament.tournament_info.length);
        if (tournament.tournament_info.length > 0) {
          console.log('🔍 Tournament info[0]:', tournament.tournament_info[0]);
          console.log('🔍 Tournament info[0] requires_shirts:', tournament.tournament_info[0].requires_shirts);
        }
      }
      
      console.log('🔍 Final requires_shirts value:', getRequiresShirts());
    }
  }, [tournament]);

  // Función para validar formulario completo
  const validateForm = () => {
    const errors: { player1?: string; player2?: string; slot?: string; shirtSizes?: string } = {};

    // Validar jugador 1
    if (!selectedPlayer1) {
      errors.player1 = t('adminRegister.validation.player1Required');
    }

    // Validar jugador 2
    if (!selectedPlayer2) {
      errors.player2 = t('adminRegister.validation.player2Required');
    } else if (selectedPlayer1 && selectedPlayer1 === selectedPlayer2) {
      errors.player2 = t('adminRegister.validation.playersMustBeDifferent');
    }

    // Validar time slot
    if (!selectedSlot) {
      errors.slot = t('adminRegister.validation.slotRequired');
    } else {
      const slot = availableSlots.find(s => s.slot_id === selectedSlot);
      if (slot && !slot.is_available) {
        errors.slot = t('adminRegister.validation.slotFull');
      }
    }

    // Validar talles de remera si el torneo los requiere
    if (getRequiresShirts()) {
      if (selectedShirtSizes.length === 0) {
        errors.shirtSizes = t('adminRegister.validation.shirtSizesRequired');
      } else if (selectedShirtSizes.length > 2) {
        errors.shirtSizes = t('adminRegister.validation.shirtSizesMax');
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
    if (selectedPlayer1 || selectedPlayer2 || selectedSlot || selectedShirtSizes.length > 0) {
      clearValidationErrors();
    }
  }, [selectedPlayer1, selectedPlayer2, selectedSlot, selectedShirtSizes]);

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
        throw new Error(t('adminRegister.errors.loadPlayers'));
      }
      
      const data = await response.json();
      setPlayers(data || []);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
      toast({
        title: t('adminRegister.errors.title'),
        description: t('adminRegister.errors.loadPlayersDescription'),
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
        throw new Error(t('adminRegister.errors.loadSlots'));
      }
      
      const data = await response.json();
      setAvailableSlots(data.available_slots || []);
    } catch (err) {
      console.error('Error cargando slots:', err);
      toast({
        title: t('adminRegister.errors.title'),
        description: t('adminRegister.errors.loadSlotsDescription'),
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
      const requestBody = {
        userId1: selectedPlayer1,
        userId2: selectedPlayer2,
        unavailable_time_slot: selectedSlot,
        ...(getRequiresShirts() && selectedShirtSizes.length > 0 && {
          shirt_sizes: selectedShirtSizes
        })
      };

      console.log('🔍 Enviando datos al backend:', requestBody);
      console.log('🔍 getRequiresShirts():', getRequiresShirts());
      console.log('🔍 selectedShirtSizes:', selectedShirtSizes);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/admin-register-team`, {
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
              title: t('adminRegister.errors.registrationError'),
              description: t('adminRegister.errors.playersAlreadyRegistered'),
              variant: "destructive",
            });
          } else if (data.message.includes('está completo')) {
            toast({
              title: t('adminRegister.errors.tournamentFull'),
              description: t('adminRegister.errors.tournamentFullDescription'),
              variant: "destructive",
            });
          } else if (data.message.includes('distintos')) {
            toast({
              title: t('adminRegister.errors.invalidPlayers'),
              description: t('adminRegister.errors.playersMustBeDifferent'),
              variant: "destructive",
            });
          } else {
            toast({
              title: t('adminRegister.errors.validationError'),
              description: data.message || t('adminRegister.errors.validationErrorDescription'),
              variant: "destructive",
            });
          }
        } else if (response.status === 404) {
          toast({
            title: t('adminRegister.errors.tournamentNotFound'),
            description: t('adminRegister.errors.tournamentNotFoundDescription'),
            variant: "destructive",
          });
        } else if (response.status === 500) {
          toast({
            title: t('adminRegister.errors.serverError'),
            description: t('adminRegister.errors.serverErrorDescription'),
            variant: "destructive",
          });
        } else {
          toast({
            title: t('adminRegister.errors.title'),
            description: data.message || t('adminRegister.errors.registerTeamError'),
            variant: "destructive",
          });
        }
        return;
      }

      // Éxito - mostrar toast y limpiar formulario
      const player1Name = players.find(p => p.id === selectedPlayer1);
      const player2Name = players.find(p => p.id === selectedPlayer2);
      const slotInfo = availableSlots.find(s => s.slot_id === selectedSlot);
      
      console.log('✅ Mostrando toast de éxito:', {
        player1: player1Name?.first_name,
        player2: player2Name?.first_name,
        slot: slotInfo?.label
      });
      
      toast({
        title: t('adminRegister.success.title'),
        description: `${player1Name?.first_name} ${player1Name?.last_name} & ${player2Name?.first_name} ${player2Name?.last_name} ${t('adminRegister.success.registeredIn')} ${slotInfo?.label}`,
        variant: "default",
      });
      
      // Limpiar formulario
      setSelectedPlayer1('');
      setSelectedPlayer2('');
      setSelectedSlot('');
      setSelectedShirtSizes([]);
      
      // Recargar slots disponibles
      await loadAvailableSlots();

    } catch (err: any) {
      console.error('Error en registro:', err);
      toast({
        title: t('adminRegister.errors.connectionError'),
        description: t('adminRegister.errors.connectionErrorDescription'),
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
              {t('detail.tournamentNotFound')}
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
            {t('adminRegister.backToTeams')}
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('adminRegister.title')} - {tournament.name}
          </h1>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              {getCategoryName(tournament.category_id, categories)}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('adminRegister.description')}
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
              {t('adminRegister.formTitle')}
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
                  placeholder={t('adminRegister.placeholders.selectFirstPlayer')}
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
                  placeholder={t('adminRegister.placeholders.selectSecondPlayer')}
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

              {/* Selección de Talles de Remera - Solo si el torneo los requiere */}
              {getRequiresShirts() && (
                <div>
                  <ShirtSizesSelector
                    selectedSizes={selectedShirtSizes}
                    onSizesChange={setSelectedShirtSizes}
                    error={validationErrors.shirtSizes}
                    disabled={!selectedPlayer1 || !selectedPlayer2}
                  />
                </div>
              )}

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
                  disabled={
                    loading || 
                    !selectedPlayer1 || 
                    !selectedPlayer2 || 
                    !selectedSlot ||
                    (getRequiresShirts() && selectedShirtSizes.length === 0)
                  }
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      {t('adminRegister.registering')}
                    </>
                  ) : (
                    <>
                      <UsersIcon className="h-5 w-5 mr-3" />
                      {t('adminRegister.registerTeam')}
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
