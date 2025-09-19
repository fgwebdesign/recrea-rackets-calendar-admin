'use client';

import { useState } from 'react';
import { UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/contexts/TranslationContext';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_registered: boolean;
  status: 'Ya inscrito' | 'Disponible';
}

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayer: string;
  onPlayerSelect: (playerId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  excludePlayer?: string; // Para excluir el jugador ya seleccionado
}

export function PlayerSelector({ 
  players, 
  selectedPlayer, 
  onPlayerSelect, 
  disabled = false, 
  placeholder = "Seleccionar jugador...",
  excludePlayer 
}: PlayerSelectorProps) {
  const t = useTranslations('tournaments');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar jugadores según búsqueda y exclusión
  const filteredPlayers = players.filter(player => {
    const matchesSearch = 
      player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const notExcluded = excludePlayer ? player.id !== excludePlayer : true;
    
    return matchesSearch && notExcluded;
  });

  const selectedPlayerData = players.find(player => player.id === selectedPlayer);

  const getPlayerInitials = (player: Player) => {
    return `${player.first_name[0]}${player.last_name[0]}`.toUpperCase();
  };

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-5 border rounded-xl text-left transition-all duration-200 ${
          disabled 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600'
            : selectedPlayerData
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 border-2 hover:shadow-lg'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedPlayerData ? (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getPlayerInitials(selectedPlayerData)}
                </div>
                <div>
                  <div className="font-medium">
                    {selectedPlayerData.first_name} {selectedPlayerData.last_name}
                  </div>
                  <div className="text-sm opacity-75">
                    {selectedPlayerData.email}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedPlayerData && (
              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <CheckIcon className="h-3 w-3 mr-1" />
                {t('adminRegister.playerSelector.selected')}
              </Badge>
            )}
            <svg
              className={`h-5 w-5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              } ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder={t('adminRegister.playerSelector.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Players List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    if (!player.is_registered) {
                      onPlayerSelect(player.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }
                  }}
                  disabled={player.is_registered}
                  className={`w-full p-5 text-left transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    player.is_registered
                      ? 'bg-red-50 dark:bg-red-900/20 cursor-not-allowed opacity-60'
                      : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      player.is_registered
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {getPlayerInitials(player)}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        player.is_registered
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {player.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        player.is_registered
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }>
                        <XMarkIcon className="h-3 w-3 mr-1" />
                        {player.status}
                      </Badge>
                      {player.id === selectedPlayer && !player.is_registered && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('adminRegister.playerSelector.noPlayersFound')}</p>
                {searchTerm && (
                  <p className="text-sm mt-1">
                    {t('adminRegister.playerSelector.tryDifferentSearch')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
