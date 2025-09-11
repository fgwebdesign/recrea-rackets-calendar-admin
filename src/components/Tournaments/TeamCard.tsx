'use client';

import { UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Team {
  team_id: string;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_amount?: number;
  created_at?: string;
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
        return {
          className: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
          icon: <ClockIcon className="h-3 w-3 mr-1" />,
          text: 'Desconocido'
        };
    }
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Equipo #{index + 1}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {team.team_id?.slice(-8) || 'N/A'}
              </p>
            </div>
          </div>
          <Badge className={paymentStatus.className}>
            {paymentStatus.icon}
            {paymentStatus.text}
          </Badge>
        </div>

        {/* Jugadores */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Jugadores:</h4>
          
          <div className="space-y-2">
            {team.teams?.player1 && (
              <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {getPlayerInitials(team.teams.player1)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {team.teams.player1.first_name} {team.teams.player1.last_name || ''}
                  </div>
                </div>
                <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                  Jugador 1
                </Badge>
              </div>
            )}

            {team.teams?.player2 && (
              <div className="flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {getPlayerInitials(team.teams.player2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {team.teams.player2.first_name} {team.teams.player2.last_name || ''}
                  </div>
                </div>
                <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs">
                  Jugador 2
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Monto</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              ${team.payment_amount || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Fecha de Inscripción</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
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
      </CardContent>
    </Card>
  );
}
