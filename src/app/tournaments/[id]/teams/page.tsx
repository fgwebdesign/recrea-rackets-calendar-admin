'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useTournament } from '@/hooks/useTournaments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function TournamentTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const { 
    tournament, 
    teams,
    loading, 
    error, 
    refetch 
  } = useTournament(tournamentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Error al cargar los equipos: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontró el torneo solicitado.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const totalTeams = Array.isArray(teams) ? teams.length : 0;
  const paidTeams = Array.isArray(teams) ? teams.filter(team => team.payment_status === 'paid').length : 0;
  const pendingTeams = Array.isArray(teams) ? teams.filter(team => team.payment_status === 'pending').length : 0;
  const totalRevenue = Array.isArray(teams) ? teams.reduce((sum, team) => sum + (team.payment_amount || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mb-4 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver al torneo
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Equipos - {tournament.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Lista de equipos inscritos en el torneo
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 text-green-500" />
                Equipos Registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalTeams}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                de {tournament.max_teams} equipos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 text-yellow-500" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pendingTeams}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                por pagar
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 text-blue-500" />
                Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${totalRevenue}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                recaudado
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de equipos */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
              Equipos Inscritos
              <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                {totalTeams} equipos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {Array.isArray(teams) && teams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Equipo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Estado de Pago
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Fecha de Inscripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {teams.map((team, index) => {
                      return (
                      <tr key={team.team_id || team.id || index} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 transition-all duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {(team as any).teams?.player1?.first_name?.[0] || (team as any).teams?.player2?.first_name?.[0] || '?'}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {(team as any).teams?.player1?.first_name && (team as any).teams?.player2?.first_name ? (
                                  `${(team as any).teams.player1.first_name} ${(team as any).teams.player1.last_name || ''} / ${(team as any).teams.player2.first_name} ${(team as any).teams.player2.last_name || ''}`
                                ) : (team as any).teams?.player1?.first_name ? (
                                  `${(team as any).teams.player1.first_name} ${(team as any).teams.player1.last_name || ''}`
                                ) : (team as any).teams?.player2?.first_name ? (
                                  `${(team as any).teams.player2.first_name} ${(team as any).teams.player2.last_name || ''}`
                                ) : (
                                  `Equipo #${team.team_id?.slice(-4) || 'N/A'}`
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {team.team_id?.slice(-8) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            team.payment_status === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : team.payment_status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {team.payment_status === 'paid' ? 'Pagado' : 
                             team.payment_status === 'pending' ? 'Pendiente' : 'Fallido'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ${team.payment_amount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.created_at ? new Date(team.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Sin fecha'}
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <UsersIcon className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  No hay equipos inscritos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Este torneo aún no tiene equipos registrados. Los equipos aparecerán aquí una vez que se inscriban.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/tournaments/${tournamentId}`)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    Volver al torneo
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Invitar equipos
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}