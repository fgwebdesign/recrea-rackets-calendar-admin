'use client';

import { UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Shirt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Team {
  team_id: string;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_amount?: number;
  created_at?: string;
  unavailable_times?: string;
  shirt_sizes?: string[];
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
}

export function TeamCard({ team, index }: TeamCardProps) {
  const getPlayerInitials = (player: any) => {
    if (!player?.first_name) return '?';
    return `${player.first_name[0]}${player.last_name?.[0] || ''}`.toUpperCase();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          icon: <CheckCircleIcon className="h-3 w-3 mr-1" />,
          text: 'Pagado'
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
          icon: <ClockIcon className="h-3 w-3 mr-1" />,
          text: 'Pendiente'
        };
      case 'failed':
        return {
          className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
          icon: <XCircleIcon className="h-3 w-3 mr-1" />,
          text: 'Fallido'
        };
      default:
        // Si no hay status o es undefined, mostrar como pendiente por defecto
        return {
          className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
          icon: <ClockIcon className="h-3 w-3 mr-1" />,
          text: 'Pendiente'
        };
    }
  };

  const formatUnavailableTimes = (unavailableTimes?: string) => {
    if (!unavailableTimes) return 'Sin restricciones';
    
    // Mapear los valores del backend a texto legible
    const timeSlotMap: Record<string, string> = {
      // Día 1
      'day1_morning': 'Día 1 - Mañana',
      'day1_afternoon': 'Día 1 - Tarde', 
      'day1_evening': 'Día 1 - Noche',
      'day1_night': 'Día 1 - Noche',
      'dayl_night': 'Día 1 - Noche', // Manejo de posible error tipográfico
      
      // Día 2
      'day2_morning': 'Día 2 - Mañana',
      'day2_afternoon': 'Día 2 - Tarde',
      'day2_evening': 'Día 2 - Noche',
      'day2_night': 'Día 2 - Noche',
      
      // Día 3
      'day3_morning': 'Día 3 - Mañana',
      'day3_afternoon': 'Día 3 - Tarde',
      'day3_evening': 'Día 3 - Noche',
      'day3_night': 'Día 3 - Noche',
      
      // Posibles variaciones adicionales
      'morning': 'Mañana',
      'afternoon': 'Tarde',
      'evening': 'Noche',
      'night': 'Noche'
    };

    return timeSlotMap[unavailableTimes] || unavailableTimes;
  };

  const formatPlayerNames = (team: Team) => {
    if (!team?.teams) return 'Equipo desconocido';
    
    const player1 = team.teams.player1;
    const player2 = team.teams.player2;
    
    if (player1?.first_name && player2?.first_name) {
      return `${player1.first_name} ${player1.last_name || ''} / ${player2.first_name} ${player2.last_name || ''}`;
    } else if (player1?.first_name) {
      return `${player1.first_name} ${player1.last_name || ''}`;
    } else if (player2?.first_name) {
      return `${player2.first_name} ${player2.last_name || ''}`;
    }
    
    return `Equipo #${team.team_id?.slice(-4) || 'N/A'}`;
  };

  const paymentStatus = getPaymentStatusBadge(team.payment_status);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        {/* Header con número de equipo y badges de estado */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {index + 1}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Equipo #{index + 1}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                ID: {team.team_id?.slice(-8) || 'N/A'}
              </p>
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

        {/* Jugadores */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Jugadores
          </h4>
          
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
                <Badge className="bg-blue-500 text-white text-xs px-2 py-1 font-medium">
                  Jugador 1
                </Badge>
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
                  Jugador 2
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Talles de Remera */}
        {team.shirt_sizes && team.shirt_sizes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-blue-500" />
              Talles de Remera
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
                ? 'Un talle seleccionado' 
                : `${team.shirt_sizes.length} talles seleccionados`
              }
            </p>
          </div>
        )}

        {/* Información adicional */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Monto</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                ${team.payment_amount || 0}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Fecha de Inscripción</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {team.created_at 
                  ? new Date(team.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Sin fecha'
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
