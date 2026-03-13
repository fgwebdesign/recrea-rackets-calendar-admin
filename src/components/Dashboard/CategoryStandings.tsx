import { Standing, GroupedStandings } from '@/hooks/useStandings';
import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Spinner } from '@/components/ui/Spinner';
import { CategoryFilterTabs } from './CategoryFilterTabs';
import { Category } from '@/types/category';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryStandingsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  standings: Standing[] | GroupedStandings;
  hasGroups: boolean;
  isLoading: boolean;
}

const HeaderWithTooltip = ({ short, full }: { short: string; full: string }) => (
  <Tooltip.Provider delayDuration={100}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-help">
          {short}
        </th>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white shadow-md animate-in fade-in duration-200"
          sideOffset={5}
        >
          {full}
          <Tooltip.Arrow className="fill-gray-100 dark:fill-gray-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export function CategoryStandings({ 
  categories,
  selectedCategory,
  onCategoryChange,
  standings,
  hasGroups,
  isLoading 
}: CategoryStandingsProps) {
  const [selectedGroup, setSelectedGroup] = useState<'A' | 'B'>('A');
  const currentCategory = categories?.find(cat => cat.id === selectedCategory)?.name || '';
  
  // Determinar qué standings mostrar según si hay grupos o no
  const displayStandings: Standing[] = hasGroups 
    ? (standings as GroupedStandings)[selectedGroup === 'A' ? 'groupA' : 'groupB']
    : (standings as Standing[]);

  if (isLoading || !categories) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Cargando tabla de posiciones...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CategoryFilterTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        showAllOption={false}
        className="px-0"
      />

      {/* Tabs de grupos si la categoría tiene grupos */}
      {hasGroups && (
        <Tabs value={selectedGroup} onValueChange={(value) => setSelectedGroup(value as 'A' | 'B')}>
          <TabsList>
            <TabsTrigger value="A" className="text-sm">
              Grupo A
            </TabsTrigger>
            <TabsTrigger value="B" className="text-sm">
              Grupo B
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {!displayStandings.length ? (
        <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sin posiciones disponibles
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay datos disponibles para la categoría {currentCategory}.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <HeaderWithTooltip short="Pos" full="Posición" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Equipo
                </th>
                <HeaderWithTooltip short="PJ" full="Partidos Jugados" />
                <HeaderWithTooltip short="PG" full="Partidos Ganados" />
                <HeaderWithTooltip short="PP" full="Partidos Perdidos" />
                <HeaderWithTooltip short="JG" full="Juegos Ganados" />
                <HeaderWithTooltip short="JP" full="Juegos Perdidos" />
                <HeaderWithTooltip short="DJ" full="Diferencia de Juegos" />
                <HeaderWithTooltip short="Pts" full="Puntos Totales" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayStandings.map((standing, index) => (
                <tr 
                  key={standing.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-2xl font-bold font-orbitron text-green-600 dark:text-green-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                    {standing.team ? 
                      `${standing.team.player1.first_name} ${standing.team.player1.last_name} - 
                       ${standing.team.player2.first_name} ${standing.team.player2.last_name}` : 
                      'Equipo no disponible'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                    {standing.games_played}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                    {standing.wins}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-red-600 dark:text-red-500">
                    {standing.losses}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                    {standing.games_won}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-red-600 dark:text-red-500">
                    {standing.games_lost}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-2xl text-center font-orbitron text-green-600 dark:text-green-400">
                    {(() => {
                      const gamesDifference = standing.games_won - standing.games_lost;
                      return gamesDifference > 0 ? `+${gamesDifference}` : gamesDifference;
                    })()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-3xl text-center font-orbitron font-bold text-green-600 dark:text-green-400">
                    {standing.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 