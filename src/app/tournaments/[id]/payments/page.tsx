'use client';

import { useParams, useRouter } from 'next/navigation';
import { TournamentPaymentsPanel } from '@/components/Tournaments/TournamentPaymentsPanel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { ChevronLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/category';

export default function TournamentPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { tournament, tournamentInfo, teams, loading, refetch } = useTournament(params.id as string);
  const actualTeams = teams || [];
  const { categories } = useCategories();

  if (loading) return <LoadingSpinner />;
  if (!tournament) return null;

  const handlePaymentChange = async (teamId: string, paid: boolean) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${params.id}/teams/${teamId}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: paid ? 'paid' : 'pending' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al actualizar pago:', errorText);
        throw new Error('Error al actualizar el estado de pago');
      }

      await refetch();
      toast({
        title: "Estado de pago actualizado",
        description: paid ? "El pago ha sido marcado como realizado." : "El pago ha sido marcado como pendiente.",
      });
    } catch (error) {
      console.error('Error al actualizar pago:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de pago. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string, categoriesList: Category[] | undefined) => {
    const category = categoriesList?.find(cat => cat.id === categoryId);
    return category?.name ?? 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => router.push(`/payments`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a Inscripciones
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Pagos</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {getCategoryName(tournament.category_id, categories)}
                </Badge>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Administra los pagos de inscripción para {tournament.name}
              </p>
            </div>
          </div>
        </div>

        <TournamentPaymentsPanel
          teams={actualTeams.map(team => ({
            team_id: team.team_id,
            payment_status: (team.payment_status === 'paid' ? 'paid' : 'pending') as 'pending' | 'paid' | 'completed',
            payment_date: team.payment_date,
            payment_reference: team.payment_reference,
            created_at: team.created_at,
            teams: {
              id: team.team_id,
              player1_id: team.teams?.player1_id || '',
              player2_id: team.teams?.player2_id || '',
              player1: team.teams?.player1,
              player2: team.teams?.player2
            }
          }))}
          inscriptionCost={tournamentInfo?.inscription_cost ?? tournament?.tournament_info?.inscription_cost ?? 0}
          category={getCategoryName(tournament.category_id, categories)}
          onPaymentChange={handlePaymentChange}
        />
      </div>
    </div>
  );
} 