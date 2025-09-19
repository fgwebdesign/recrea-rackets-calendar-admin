import { useStandings } from '@/hooks/useStandings';
import { Standing } from '@/hooks/useStandings';

interface LeagueStandingsProps {
  leagueId: string;
  categoryId?: string;
}

export function LeagueStandings({ leagueId, categoryId }: LeagueStandingsProps) {
  const { standings, isLoading, error } = useStandings(categoryId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tabla de Posiciones</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tabla de Posiciones</h2>
        <div className="text-center p-8 text-red-600 dark:text-red-400">
          Error al cargar la tabla de posiciones: {error.message}
        </div>
      </div>
    );
  }

  if (!standings.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tabla de Posiciones</h2>
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          No hay datos disponibles para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tabla de Posiciones</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#1D283A]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1D283A]">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1D283A]">
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Pos
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Equipo
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                PJ
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                PG
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                PP
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                JG
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                JP
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                SG
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                SP
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                DG
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Pts
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-[#1D283A]">
            {standings.map((standing, index) => (
              <tr key={standing.id} 
                  className="hover:bg-gray-50 dark:hover:bg-[#1D283A]/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {standing.team?.player1?.first_name} {standing.team?.player1?.last_name} / {standing.team?.player2?.first_name} {standing.team?.player2?.last_name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                  {standing.games_played}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-green-600 dark:text-green-400">
                  {standing.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-red-600 dark:text-red-400">
                  {standing.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-green-600 dark:text-green-400">
                  {standing.games_won}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-red-600 dark:text-red-400">
                  {standing.games_lost}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-green-600 dark:text-green-400">
                  {standing.sets_won}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-red-600 dark:text-red-400">
                  {standing.sets_lost}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 dark:text-gray-300">
                  {standing.sets_difference > 0 ? `+${standing.sets_difference}` : standing.sets_difference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600 dark:text-blue-400">
                  {standing.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
