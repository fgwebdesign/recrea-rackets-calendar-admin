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
import { getCategoryName } from '@/utils/category';

export default function TournamentPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { tournament, teams, loading, refetch } = useTournament(params.id as string);
  const { categories } = useCategories();

  if (loading) return <LoadingSpinner />;
  if (!tournament) return null;

  const handleMarkAsPaid = async (teamId: string, paymentMethod: string) => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/teams/${teamId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          payment_reference: paymentMethod,
          payment_status: 'completed'
        }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar el pago');
      }

      await refetch();

      toast({
        title: "Pago registrado",
        description: `El pago ha sido marcado como completado exitosamente mediante ${
          paymentMethod === 'en_persona' ? 'pago en persona' : 'Mercado Pago'
        }.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el pago. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentMethodChange = async (teamId: string, paymentMethod: string) => {
    try {
      await handleMarkAsPaid(teamId, paymentMethod);
    } catch (error) {
      console.error('Error al cambiar el método de pago:', error);
    }
  };

  const getCategoryName = (categoryId: string, categories: any[]) => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name || 'N/A';
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
          teams={teams}
          inscriptionCost={tournament.tournament_info?.[0]?.inscription_cost || 0}
          category={getCategoryName(tournament.category_id, categories)}
          onMarkAsPaid={handleMarkAsPaid}
          handlePaymentMethodChange={handlePaymentMethodChange}
        />
      </div>
    </div>
  );
} 