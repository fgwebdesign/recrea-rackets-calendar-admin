'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
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
  id: string;
  label: string;
  day: number;
  tournament_day?: number; // Día del torneo (1, 2, 3)
  start: string;
  end?: string;
  date?: string;
  capacity: number;
  current_restrictions: number;
  is_heavily_restricted: boolean;
  available: boolean;
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
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [slotsByDay, setSlotsByDay] = useState<{day1: TimeSlot[], day2: TimeSlot[]}>({day1: [], day2: []});
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

  // Calcular nombres de días dinámicamente desde los slots
  const day1Name = slotsByDay.day1.length > 0 
    ? slotsByDay.day1[0]?.label?.split(' ')[0] || 'Día 1'
    : 'Día 1';
  const day2Name = slotsByDay.day2.length > 0 
    ? slotsByDay.day2[0]?.label?.split(' ')[0] || 'Día 2'
    : 'Día 2';

  // Función para obtener si el torneo requiere remeras
  const getRequiresShirts = useCallback(() => {
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
  }, [tournament]);

  const loadPlayers = useCallback(async () => {
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
  }, [tournamentId, t]);

  const loadAvailableSlots = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/available-group-hours`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(t('adminRegister.errors.loadSlots'));
      }
      
      const data = await response.json();
      const slots = data.available_hours || [];
      console.log('🔍 Slots recibidos del backend:', slots);
      console.log('🔍 Primer slot:', slots[0]);
      setAvailableSlots(slots);
      
      // Organizar por días según la guía
      const organizedSlots = {
        day1: slots.filter((slot: TimeSlot) => slot.day === 1 || slot.tournament_day === 1),
        day2: slots.filter((slot: TimeSlot) => slot.day === 2 || slot.tournament_day === 2)
      };
      setSlotsByDay(organizedSlots);
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
  }, [tournamentId, t]);

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
  }, [tournament, getRequiresShirts]);

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

    // Validar time slots (máximo 2 según la guía)
    if (selectedSlots.length === 0) {
      errors.slot = t('adminRegister.validation.slotRequired');
    } else if (selectedSlots.length > 2) {
      errors.slot = 'Máximo 2 slots por equipo';
    } else {
      // Validar que todos los slots seleccionados existan y tengan disponibilidad
      for (const slotId of selectedSlots) {
        const slot = availableSlots.find(s => s.id === slotId);
        if (!slot) {
          errors.slot = `Slot ${slotId} no encontrado`;
          break;
        }
        // Validar que el slot tenga disponibilidad
        const availableSlotsCount = slot.capacity - slot.current_restrictions;
        if (availableSlotsCount <= 0) {
          errors.slot = `El horario ${slot.start} no tiene disponibilidad`;
          break;
        }
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
    if (selectedPlayer1 || selectedPlayer2 || selectedSlots.length > 0 || selectedShirtSizes.length > 0) {
      clearValidationErrors();
    }
  }, [selectedPlayer1, selectedPlayer2, selectedSlots, selectedShirtSizes]);

  // Cargar datos iniciales
  useEffect(() => {
    if (tournamentId) {
      loadPlayers();
      loadAvailableSlots();
    }
  }, [tournamentId, loadPlayers, loadAvailableSlots]);

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
        unavailable_times: selectedSlots, // Array de IDs según la guía
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
      const selectedSlotsInfo = selectedSlots.map(slotId => 
        availableSlots.find(s => s.id === slotId)?.label
      ).join(', ');
      
      console.log('✅ Mostrando toast de éxito:', {
        player1: player1Name?.first_name,
        player2: player2Name?.first_name,
        slots: selectedSlotsInfo
      });

      toast({
        title: t('adminRegister.success.title'),
        description: `${player1Name?.first_name} ${player1Name?.last_name} & ${player2Name?.first_name} ${player2Name?.last_name} registrados con horarios: ${selectedSlotsInfo}`,
        variant: "default",
      });
      
      setSelectedPlayer1('');
      setSelectedPlayer2('');
      setSelectedSlots([]);
      setSelectedShirtSizes([]);
      
      // Recargar slots disponibles y lista de jugadores para actualizar estados
      await Promise.all([
        loadAvailableSlots(),
        loadPlayers()
      ]);

    } catch (err: unknown) {
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

              {/* Selección de Time Slots - Máximo 2 slots por equipo */}
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Horarios Disponibles (Máximo 2)
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedSlots.length}/2 seleccionados
                    </span>
                  </div>
                  
                  {(!selectedPlayer1 || !selectedPlayer2) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 Selecciona ambos jugadores para habilitar los horarios
                      </p>
                    </div>
                  )}
                  
                  {/* Día 1 - Dinámico */}
                  {slotsByDay.day1.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                        Día 1 - {day1Name}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {slotsByDay.day1.map((slot) => {
                          const availableSlots = slot.capacity - slot.current_restrictions;
                          const isAvailable = availableSlots > 0;
                          const isDisabled = !selectedPlayer1 || !selectedPlayer2 || !isAvailable;
                          
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                if (!isAvailable) return; // Prevenir selección si no hay disponibilidad
                                if (selectedSlots.includes(slot.id)) {
                                  setSelectedSlots(selectedSlots.filter(id => id !== slot.id));
                                } else if (selectedSlots.length < 2) {
                                  setSelectedSlots([...selectedSlots, slot.id]);
                                }
                              }}
                              disabled={isDisabled}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                !isAvailable
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 cursor-not-allowed opacity-60'
                                  : selectedSlots.includes(slot.id)
                                    ? 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-medium">{slot.start}</div>
                                <div className={`text-xs mt-1 ${
                                  !isAvailable 
                                    ? 'text-red-500 dark:text-red-400 font-semibold' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {availableSlots > 0 ? `${availableSlots} disponibles` : 'Sin disponibilidad'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Día 2 - Dinámico */}
                  {slotsByDay.day2.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                        Día 2 - {day2Name}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {slotsByDay.day2.map((slot) => {
                          const availableSlots = slot.capacity - slot.current_restrictions;
                          const isAvailable = availableSlots > 0;
                          const isDisabled = !selectedPlayer1 || !selectedPlayer2 || !isAvailable;
                          
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                if (!isAvailable) return; // Prevenir selección si no hay disponibilidad
                                if (selectedSlots.includes(slot.id)) {
                                  setSelectedSlots(selectedSlots.filter(id => id !== slot.id));
                                } else if (selectedSlots.length < 2) {
                                  setSelectedSlots([...selectedSlots, slot.id]);
                                }
                              }}
                              disabled={isDisabled}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                !isAvailable
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 cursor-not-allowed opacity-60'
                                  : selectedSlots.includes(slot.id)
                                    ? 'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-100'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-medium">{slot.start}</div>
                                <div className={`text-xs mt-1 ${
                                  !isAvailable 
                                    ? 'text-red-500 dark:text-red-400 font-semibold' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {availableSlots > 0 ? `${availableSlots} disponibles` : 'Sin disponibilidad'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
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
                slot={selectedSlots.length > 0 ? selectedSlots[0] : ''}
                validationErrors={validationErrors}
              />

              {/* Resumen del Equipo */}
              {selectedPlayer1 && selectedPlayer2 && selectedSlots.length > 0 && (
                <TeamSummary
                  player1={players.find(p => p.id === selectedPlayer1) || null}
                  player2={players.find(p => p.id === selectedPlayer2) || null}
                  slotLabel={selectedSlots.map(slotId => 
                    availableSlots.find(s => s.id === slotId)?.label
                  ).join(', ')}
                  slotInfo={availableSlots.find(s => s.id === selectedSlots[0]) ? {
                    remaining_slots: availableSlots.find(s => s.id === selectedSlots[0])!.capacity - availableSlots.find(s => s.id === selectedSlots[0])!.current_restrictions,
                    percentage_full: Math.round((availableSlots.find(s => s.id === selectedSlots[0])!.current_restrictions / availableSlots.find(s => s.id === selectedSlots[0])!.capacity) * 100),
                    total_capacity: availableSlots.find(s => s.id === selectedSlots[0])!.capacity
                  } : undefined}
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
                    selectedSlots.length === 0 ||
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
