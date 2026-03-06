'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { getCategoryName } from '@/utils/category';
import { TeamCard } from '@/components/Tournaments/TeamCard';
import { TournamentStats } from '@/components/Tournaments/TournamentStats';
import { useTranslations } from '@/contexts/TranslationContext';

export default function TournamentTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const [isAdmin, setIsAdmin] = useState(false);
  const t = useTranslations('tournaments');

  const { 
    tournament, 
    teams,
    loading, 
    error, 
    refetch 
  } = useTournament(tournamentId);
  
  const { categories } = useCategories();

  // Verificar si el usuario es admin
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    setIsAdmin(adminStatus === 'true');
  }, []);

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
              <span>{t('teamsPage.errorLoading')}: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('detail.retry')}
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
              {t('detail.tournamentNotFound')}
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

  // Calcular cupo según tipo de torneo (Americano usa max_teams = jugadores)
  const getTournamentCapacity = (tournamentType: string) => {
    switch (tournamentType) {
      case 'SIX_PLAYERS': return 6;
      case 'NINE_PLAYERS': return 9;
      case 'TWELVE_PLAYERS': return 12;
      case 'SIXTEEN_PLAYERS': return 16;
      case 'AMERICANO': return tournament?.max_teams ?? 8;
      default: return tournament?.max_teams ?? 9;
    }
  };

  const tournamentCapacity = tournament?.tournament_type ? getTournamentCapacity(tournament.tournament_type) : (tournament?.max_teams ?? 9);
  const isAmericano = tournament?.tournament_type === 'AMERICANO';
  const isTournamentFull = totalTeams >= tournamentCapacity;

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
            {t('teamsPage.backToTournament')}
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {isAmericano ? t('teamsPage.playersTitle') : t('teamsPage.title')} - {tournament.name}
              </h1>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {getCategoryName(tournament.category_id, categories)}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {isAmericano ? t('teamsPage.playersDescription') : t('teamsPage.description')}
              </p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => router.push(`/tournaments/${tournamentId}/admin-register-team`)}
                disabled={isTournamentFull}
                className={`${
                  isTournamentFull 
                    ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                } text-white transition-all duration-200`}
                title={isTournamentFull ? `Cupo completo (${totalTeams}/${tournamentCapacity})` : (isAmericano ? 'Registrar jugador' : 'Registrar nuevo equipo')}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {isTournamentFull ? 'Cupo Completo' : (isAmericano ? t('teamsPage.registerPlayer') : t('teamsPage.registerTeam'))}
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <TournamentStats
          totalTeams={totalTeams}
          maxTeams={tournament.max_teams}
          paidTeams={paidTeams}
          pendingTeams={pendingTeams}
          totalRevenue={totalRevenue}
          tournamentType={tournament.tournament_type}
          translations={{
            registeredTeams: isAmericano ? t('teamsPage.registeredPlayers') : t('teamsPage.registeredTeams'),
            fullCapacity: t('teamsPage.fullCapacity'),
            teamsRemaining: isAmericano ? t('teamsPage.playersRemaining') : t('teamsPage.teamsRemaining'),
            paidTeamsTitle: isAmericano ? t('teamsPage.paidPlayersTitle') : t('teamsPage.paidTeamsTitle'),
            ofTotal: t('teamsPage.ofTotal'),
            noTeams: isAmericano ? t('teamsPage.noPlayers') : t('teamsPage.noTeams'),
            pending: t('teamsPage.pending'),
            toPay: t('teamsPage.toPay'),
            revenue: t('teamsPage.revenue'),
            collected: t('teamsPage.collected')
          }}
        />

        {/* Lista de equipos */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <UsersIcon className="h-5 w-5 text-white" />
              </div>
              {isAmericano ? t('teamsPage.registeredPlayers') : t('teamsPage.registeredTeams')}
              <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                {totalTeams} {isAmericano ? t('teamsPage.players') : t('teams')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {Array.isArray(teams) && teams.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team, index) => (
                    <TeamCard 
                      key={team.team_id || team.id || index} 
                      team={team} 
                      index={index}
                      tournamentStartDate={tournament?.start_date}
                      isAmericano={isAmericano}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <UsersIcon className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {isAmericano ? t('teamsPage.noPlayersRegistered') : t('teamsPage.noTeamsRegistered')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {isAmericano ? t('teamsPage.noPlayersDescription') : t('teamsPage.noTeamsDescription')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/tournaments/${tournamentId}`)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    {t('teamsPage.backToTournament')}
                  </Button>
                  {isAdmin && (
                    <Button 
                      onClick={() => router.push(`/tournaments/${tournamentId}/admin-register-team`)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {isAmericano ? t('teamsPage.registerPlayer') : t('teamsPage.registerTeam')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}