'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Clock, Loader2 } from 'lucide-react';
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

interface Franja {
  franja_id: string;
  label: string;
  day?: number;
  tournament_day: number;
  date: string;
  start_time: string;
  end_time: string;
  total_capacity: number;
  used_slots: number;
  available_slots: number;
  utilization_percent: number;
  teams_available: number;
}

export default function AdminRegisterTeamPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const t = useTranslations('tournaments');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');
  const [selectedFranjas, setSelectedFranjas] = useState<string[]>([]);
  const [franjasByDay, setFranjasByDay] = useState<Record<number, Franja[]>>({});
  const [selectedShirtSizes, setSelectedShirtSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshingSlots, setRefreshingSlots] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    player1?: string;
    player2?: string;
    slot?: string;
    shirtSizes?: string;
  }>({});

  const { tournament, loading: tournamentLoading } = useTournament(tournamentId);
  const { categories } = useCategories();

  // Calcular nombres de días dinámicamente desde las franjas
  const getDayName = (dayNum: number) => {
    const list = franjasByDay[dayNum] || [];
    return list.length > 0 ? (list[0]?.label?.split(' ')[0] || `Día ${dayNum}`) : `Día ${dayNum}`;
  };

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
      const list = data.franjas || [];
      setFranjas(list);
      
      const byDay: Record<number, Franja[]> = {};
      for (const f of list) {
        const d = f.tournament_day ?? f.day ?? 1;
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(f);
      }
      setFranjasByDay(byDay);
    } catch (err) {
      console.error('Error cargando franjas:', err);
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

    // Franjas bloqueadas (donde NO puede jugar): debe quedar al menos 2 disponibles
    const availableCount = franjas.length - selectedFranjas.length;
    if (availableCount < 2) {
      errors.slot = `Dejá al menos 2 horarios sin marcar (donde sí puede jugar). Máximo ${Math.max(0, franjas.length - 2)} bloqueados.`;
    } else {
      for (const franjaId of selectedFranjas) {
        const franja = franjas.find(f => f.franja_id === franjaId);
        if (!franja) {
          errors.slot = `Franja ${franjaId} no encontrada`;
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
    if (selectedPlayer1 || selectedPlayer2 || selectedFranjas.length > 0 || selectedShirtSizes.length > 0) {
      clearValidationErrors();
    }
  }, [selectedPlayer1, selectedPlayer2, selectedFranjas, selectedShirtSizes]);

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
        unavailable_times: selectedFranjas, // Franja IDs donde el equipo NO puede jugar
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
      const blockedLabels = selectedFranjas.map(id => franjas.find(f => f.franja_id === id)?.label).filter(Boolean).join(', ');
      const availableCount = franjas.length - selectedFranjas.length;

      toast({
        title: t('adminRegister.success.title'),
        description: `${player1Name?.first_name} ${player1Name?.last_name} & ${player2Name?.first_name} ${player2Name?.last_name} registrados.${blockedLabels ? ` No puede en: ${blockedLabels}.` : ''} ${availableCount} horario${availableCount !== 1 ? 's' : ''} disponible${availableCount !== 1 ? 's' : ''}.`,
        variant: "default",
      });
      
      setSelectedPlayer1('');
      setSelectedPlayer2('');
      setSelectedFranjas([]);
      setSelectedShirtSizes([]);
      
      // Refrescar disponibilidad de franjas y jugadores para que se vea el consumo de cupos
      setRefreshingSlots(true);
      try {
        await Promise.all([
          loadAvailableSlots(),
          loadPlayers()
        ]);
      } finally {
        setRefreshingSlots(false);
      }

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

              {/* Horarios en los que NO puede jugar (debe quedar al menos 2 disponibles) */}
              <div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Horarios en los que NO puede jugar
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${franjas.length - selectedFranjas.length >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {selectedFranjas.length} bloqueado{selectedFranjas.length !== 1 ? 's' : ''} · {franjas.length - selectedFranjas.length} disponible{(franjas.length - selectedFranjas.length) !== 1 ? 's' : ''}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={refreshingSlots}
                        onClick={async () => {
                          setRefreshingSlots(true);
                          try {
                            await loadAvailableSlots();
                            toast({ title: 'Disponibilidad actualizada', description: 'Los números reflejan el uso de todas las categorías del evento.', variant: 'default' });
                          } finally {
                            setRefreshingSlots(false);
                          }
                        }}
                        className="text-xs"
                      >
                        {refreshingSlots ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
                            Recargando...
                          </>
                        ) : (
                          'Recargar disponibilidad'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {(!selectedPlayer1 || !selectedPlayer2) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 Selecciona ambos jugadores para habilitar los horarios
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Marcá los horarios en los que el equipo <strong>no</strong> puede jugar. Dejá al menos 2 sin marcar (donde sí puede).
                  </p>
                  
                  {/* Franjas agrupadas por día del torneo */}
                  {Object.entries(franjasByDay)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([dayNum, dayFranjas]) => {
                      const dayIndex = (Number(dayNum) - 1) % 3;
                      const iconClass = dayIndex === 0 ? 'text-blue-600' : dayIndex === 1 ? 'text-green-600' : 'text-purple-600';
                      return (
                        <div key={dayNum} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <CalendarIcon className={`h-4 w-4 ${iconClass}`} />
                            Día {dayNum} - {getDayName(Number(dayNum))}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {dayFranjas.map((franja) => {
                              const isAvailable = franja.available_slots > 0;
                              const maxBlocked = Math.max(0, franjas.length - 2);
                              const isDisabled = !selectedPlayer1 || !selectedPlayer2 || !isAvailable;
                              const isBlocked = selectedFranjas.includes(franja.franja_id);
                              const buttonClass = !isAvailable
                                ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 cursor-not-allowed opacity-60'
                                : isBlocked
                                  ? 'bg-amber-100 border-2 border-amber-500 text-amber-900 dark:bg-amber-900/40 dark:border-amber-400 dark:text-amber-100 ring-2 ring-amber-400'
                                  : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/25 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-900/40';
                              
                              return (
                                <button
                                  key={franja.franja_id}
                                  type="button"
                                  onClick={() => {
                                    if (!isAvailable) return;
                                    if (isBlocked) {
                                      setSelectedFranjas(selectedFranjas.filter(id => id !== franja.franja_id));
                                    } else if (selectedFranjas.length < maxBlocked) {
                                      setSelectedFranjas([...selectedFranjas, franja.franja_id]);
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-between gap-2 ${buttonClass}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      isBlocked ? 'border-amber-500 bg-amber-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                      {isBlocked && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <div className="text-left min-w-0">
                                      <div className="font-medium truncate">{franja.label || franja.start_time}</div>
                                      {franja.start_time != null && franja.end_time != null && (
                                        <div className="text-xs opacity-70">
                                          {franja.start_time} - {franja.end_time}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`text-xs shrink-0 ${
                                    !isAvailable 
                                      ? 'text-red-500 dark:text-red-400 font-semibold' 
                                      : isBlocked 
                                        ? 'text-amber-700 dark:text-amber-200' 
                                        : 'text-green-600 dark:text-green-300'
                                  }`}>
                                    {franja.available_slots > 0 ? `${franja.available_slots} disp.` : 'Sin cupo'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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
                slot={selectedFranjas.length > 0 ? selectedFranjas[0] : ''}
                validationErrors={validationErrors}
              />

              {/* Resumen del Equipo */}
              {selectedPlayer1 && selectedPlayer2 && (selectedFranjas.length > 0 || franjas.length - selectedFranjas.length >= 2) && (
                <TeamSummary
                  player1={players.find(p => p.id === selectedPlayer1) || null}
                  player2={players.find(p => p.id === selectedPlayer2) || null}
                  slotLabel={selectedFranjas.length > 0 
                    ? `No puede: ${selectedFranjas.map(id => franjas.find(f => f.franja_id === id)?.label).filter(Boolean).join(', ')} · ${franjas.length - selectedFranjas.length} disponible${(franjas.length - selectedFranjas.length) !== 1 ? 's' : ''}`
                    : `${franjas.length} horarios disponibles`
                  }
                  slotInfo={(() => {
                    const firstAvailable = franjas.find(f => !selectedFranjas.includes(f.franja_id));
                    return firstAvailable ? {
                      remaining_slots: firstAvailable.available_slots,
                      percentage_full: firstAvailable.utilization_percent,
                      total_capacity: firstAvailable.total_capacity
                    } : undefined;
                  })()}
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
                    (franjas.length - selectedFranjas.length) < 2 ||
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
