'use client';

import { UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/contexts/TranslationContext';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TeamSummaryProps {
  player1: Player | null;
  player2: Player | null;
  slotLabel?: string;
  slotInfo?: {
    remaining_slots: number;
    percentage_full: number;
    total_capacity: number;
  };
}

export function TeamSummary({ player1, player2, slotLabel, slotInfo }: TeamSummaryProps) {
  const t = useTranslations('tournaments');
  const singlePlayer = !player2;

  if (!player1) return null;

  const getPlayerInitials = (player: Player) => {
    return `${player.first_name[0]}${player.last_name[0]}`.toUpperCase();
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
          <UsersIcon className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {singlePlayer ? t('adminRegister.teamSummary.titlePlayer') : t('adminRegister.teamSummary.title')}
        </h3>
        <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          {t('adminRegister.teamSummary.complete')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jugadores */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">{singlePlayer ? t('adminRegister.teamSummary.player') : t('adminRegister.teamSummary.players')}:</h4>
          
          {/* Jugador 1 */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getPlayerInitials(player1)}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {player1.first_name} {player1.last_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {player1.email}
              </div>
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {t('adminRegister.teamSummary.player1')}
            </Badge>
          </div>

          {!singlePlayer && player2 && (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getPlayerInitials(player2)}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {player2.first_name} {player2.last_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {player2.email}
              </div>
            </div>
            <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              {t('adminRegister.teamSummary.player2')}
            </Badge>
          </div>
          )}
        </div>

        {/* Información del Horario */}
        {slotLabel && slotInfo && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('adminRegister.teamSummary.schedule')}:</h4>
            
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  🕒
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {slotLabel}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('adminRegister.teamSummary.availableSlots')}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {slotInfo.remaining_slots}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('adminRegister.teamSummary.occupation')}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {slotInfo.percentage_full}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('adminRegister.teamSummary.totalCapacity')}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {slotInfo.total_capacity} {t('adminRegister.teamSummary.teams')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
