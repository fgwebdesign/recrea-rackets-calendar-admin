'use client';

import { UsersIcon, TrophyIcon, CalendarIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';

interface TournamentStatsProps {
  totalTeams: number;
  maxTeams: number;
  paidTeams: number;
  pendingTeams: number;
  totalRevenue: number;
  tournamentType: string;
}

export function TournamentStats({ 
  totalTeams, 
  maxTeams, 
  paidTeams, 
  pendingTeams, 
  totalRevenue, 
  tournamentType 
}: TournamentStatsProps) {
  const formatTournamentType = (type: string) => {
    const typeConfig = {
      NINE_PLAYERS: '9 Jugadores',
      TWELVE_PLAYERS: '12 Jugadores', 
      SIXTEEN_PLAYERS: '16 Jugadores'
    }
    return typeConfig[type as keyof typeof typeConfig] || type
  };

  const progressPercentage = Math.min((totalTeams / maxTeams) * 100, 100);
  const isComplete = totalTeams >= maxTeams;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Equipos Registrados */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Equipos Registrados</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalTeams} / {maxTeams}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {isComplete ? 'Cupo completo' : `Faltan ${maxTeams - totalTeams} equipos`}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isComplete
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>0</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
              <span>{maxTeams}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipos Pagados */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Equipos Pagados</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{paidTeams}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {totalTeams > 0 ? `${Math.round((paidTeams / totalTeams) * 100)}% del total` : 'Sin equipos'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipos Pendientes */}
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingTeams}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                por pagar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingresos */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ingresos</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ${totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                recaudado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}