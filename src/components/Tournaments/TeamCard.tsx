'use client';

import { UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Shirt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';

interface Team {
  team_id: string;
  payment_status: 'pending' | 'paid' | 'failed';
  unavailable_times?: string | string[]; // Puede ser string o array de strings
  shirt_sizes?: string[];
  slot_id?: string; // Campo para el slot seleccionado
  selected_slot?: string; // Otro posible campo
  time_slot?: string; // Otro posible campo
  teams?: {
    player1?: {
      first_name: string;
      last_name: string;
    };
    player2?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface TeamCardProps {
  team: Team;
  index: number;
  tournamentStartDate?: string; // Fecha de inicio del torneo (YYYY-MM-DD)
  /** Si true, torneo americano: se muestra como "Jugador N" y solo el jugador inscrito (sin pareja) */
  isAmericano?: boolean;
}

export function TeamCard({ team, index, tournamentStartDate, isAmericano = false }: TeamCardProps) {
  const t = useTranslations('tournaments');
  
  // Función para obtener la fecha del calendario para un día del torneo
  const getCalendarDateForTournamentDay = (tournamentDay: number): string | null => {
    if (!tournamentStartDate) return null;
    
    try {
      // Parsear fecha sin problemas de zona horaria
      const dateParts = tournamentStartDate.split('T')[0].split('-');
      if (dateParts.length !== 3) return null;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      
      // Crear fecha en zona horaria local
      const startDate = new Date(year, month, day);
      
      // Día 1 = start_date, Día 2 = start_date + 1 día, Día 3 = start_date + 2 días
      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + (tournamentDay - 1));
      
      // Formatear como "6 feb" (día y mes abreviado)
      return matchDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch (error) {
      console.error('Error calculando fecha:', error);
      return null;
    }
  };
  
  const getPlayerInitials = (player: { first_name?: string; last_name?: string } | undefined) => {
    if (!player?.first_name) return '?';
    return `${player.first_name[0]}${player.last_name?.[0] || ''}`.toUpperCase();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          icon: <CheckCircleIcon className="h-3 w-3 mr-1" />,
          text: t('teamsPage.paymentStatus.paid')
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
          icon: <ClockIcon className="h-3 w-3 mr-1" />,
          text: t('teamsPage.paymentStatus.pending')
        };
      case 'failed':
        return {
          className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
          icon: <XCircleIcon className="h-3 w-3 mr-1" />,
          text: t('teamsPage.paymentStatus.failed')
        };
      default:
        // Si no hay status o es undefined, mostrar como pendiente por defecto
        return {
          className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
          icon: <ClockIcon className="h-3 w-3 mr-1" />,
          text: t('teamsPage.paymentStatus.pending')
        };
    }
  };

  const formatUnavailableTimes = (unavailableTimes?: string | string[]) => {
    // Buscar el slot en diferentes campos posibles
    const slotValue = unavailableTimes || team.slot_id || team.selected_slot || team.time_slot;
    
    if (!slotValue) return t('teamsPage.noRestrictions');
    
    // Mapeo franja del backend (ej. franja_day2_manana) -> etiqueta amigable
    const franjaPeriodToLabel: Record<string, string> = {
      manana: t('teamsPage.timeSlots.morning'),
      mediodia: 'Mediodía',
      tarde: t('teamsPage.timeSlots.afternoon'),
      noche: t('teamsPage.timeSlots.night'),
    };

    // Función para formatear un slot individual
    const formatSingleSlot = (slotId: string): string => {
      // Formato backend: franja_day1_manana, franja_day2_mediodia, franja_day2_tarde, franja_day2_noche
      const franjaMatch = slotId.match(/franja_day(\d+)_(manana|mediodia|tarde|noche)/);
      if (franjaMatch) {
        const dayNum = franjaMatch[1];
        const period = franjaMatch[2];
        const periodLabel = franjaPeriodToLabel[period] ?? period;
        return `Día ${dayNum} - ${periodLabel}`;
      }
      
      // Extraer día y hora del formato "slot_day1_1700" o "slot_day1_1745"
      const slotMatch = slotId.match(/slot_day(\d+)_(\d+)/);
      if (slotMatch) {
        const day = slotMatch[1];
        const dayNumber = parseInt(day, 10);
        const time = slotMatch[2];
        
        // Formatear la hora (1700 -> 17:00, 1745 -> 17:45)
        const formattedTime = `${time.slice(0, 2)}:${time.slice(2, 4)}`;
        
        const dayText = day === '1' ? 'Día 1' : day === '2' ? 'Día 2' : `Día ${day}`;
        const calendarDate = getCalendarDateForTournamentDay(dayNumber);
        
        if (calendarDate) {
          return `${dayText} (${calendarDate}) - ${formattedTime}`;
        }
        return `${dayText} - ${formattedTime}`;
      }
      
      // Mapeo por clave (day1_morning, etc.)
      const timeSlotMap: Record<string, string> = {
        'day1_morning': t('teamsPage.timeSlots.day1Morning'),
        'day1_afternoon': t('teamsPage.timeSlots.day1Afternoon'),
        'day1_evening': t('teamsPage.timeSlots.day1Evening'),
        'day1_night': t('teamsPage.timeSlots.day1Night'),
        'dayl_night': t('teamsPage.timeSlots.day1Night'),
        'day2_morning': t('teamsPage.timeSlots.day2Morning'),
        'day2_afternoon': t('teamsPage.timeSlots.day2Afternoon'),
        'day2_evening': t('teamsPage.timeSlots.day2Evening'),
        'day2_night': t('teamsPage.timeSlots.day2Night'),
        'day3_morning': t('teamsPage.timeSlots.day3Morning'),
        'day3_afternoon': t('teamsPage.timeSlots.day3Afternoon'),
        'day3_evening': t('teamsPage.timeSlots.day3Evening'),
        'day3_night': t('teamsPage.timeSlots.day3Night'),
        'morning': t('teamsPage.timeSlots.morning'),
        'afternoon': t('teamsPage.timeSlots.afternoon'),
        'evening': t('teamsPage.timeSlots.evening'),
        'night': t('teamsPage.timeSlots.night'),
      };

      return timeSlotMap[slotId] || slotId;
    };

    // Si es un array, formatear cada slot y unirlos
    if (Array.isArray(slotValue)) {
      if (slotValue.length === 0) return t('teamsPage.noRestrictions');
      return slotValue.map(formatSingleSlot).join(', ');
    }
    
    // Si es un string, formatearlo directamente
    if (typeof slotValue === 'string') {
      return formatSingleSlot(slotValue);
    }
    
    // Fallback
    return String(slotValue) || t('teamsPage.noRestrictions');
  };

  const paymentStatus = getPaymentStatusBadge(team.payment_status);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        {/* Header con número de equipo/jugador y badges de estado */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {index + 1}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {isAmericano ? t('teamsPage.player') : t('teamsPage.team')} {index + 1}
              </h3>
            </div>
          </div>
          
          {/* Badges de estado */}
          <div className="flex flex-col gap-2">
            <Badge className={`${paymentStatus.className} text-xs px-3 py-1`}>
              {paymentStatus.icon}
              {paymentStatus.text}
            </Badge>
            <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs px-3 py-1">
              <ClockIcon className="h-3 w-3 mr-1" />
              {formatUnavailableTimes(team.unavailable_times)}
            </Badge>
          </div>
        </div>

        {/* Jugadores (americano: solo uno, sin etiqueta "Jugador 1"; equipos: ambos con etiquetas) */}
        <div className="mb-6">
          {!isAmericano && (
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              {t('teamsPage.players')}
            </h4>
          )}
          
          <div className="grid grid-cols-1 gap-3">
            {team.teams?.player1 && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {getPlayerInitials(team.teams.player1)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {team.teams.player1.first_name} {team.teams.player1.last_name || ''}
                  </div>
                </div>
                {!isAmericano && (
                  <Badge className="bg-blue-500 text-white text-xs px-2 py-1 font-medium">
                    {t('teamsPage.player1')}
                  </Badge>
                )}
              </div>
            )}

            {team.teams?.player2 && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {getPlayerInitials(team.teams.player2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {team.teams.player2.first_name} {team.teams.player2.last_name || ''}
                  </div>
                </div>
                <Badge className="bg-purple-500 text-white text-xs px-2 py-1 font-medium">
                  {t('teamsPage.player2')}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Talles de Remera */}
        {team.shirt_sizes && team.shirt_sizes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-blue-500" />
              {t('teamsPage.shirtSizes')}
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {team.shirt_sizes.map((size, sizeIndex) => (
                <Badge 
                  key={sizeIndex}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 font-medium"
                >
                  {size}
                </Badge>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {team.shirt_sizes.length === 1 
                ? t('teamsPage.oneSizeSelected') 
                : t('teamsPage.multipleSizesSelected').replace('{count}', `${team.shirt_sizes.length}`)
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
