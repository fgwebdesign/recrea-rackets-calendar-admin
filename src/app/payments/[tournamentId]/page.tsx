'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useTournaments } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { usePayments } from '@/hooks/usePayments';
import { TournamentPaymentsPanel } from '@/components/Tournaments/TournamentPaymentsPanel';
import Header from '@/components/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function TournamentPaymentsPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  
  const { tournaments, loading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { 
    payments, 
    isLoading: paymentsLoading, 
    error: paymentsError,
    fetchTournamentPayments,
    updatePaymentStatus     
  } = usePayments();

  // Encontrar el torneo actual
  const currentTournament = tournaments?.find(t => t.id === tournamentId);
  
  // Encontrar la categoría del torneo
  const tournamentCategory = categories?.find(c => c.id === currentTournament?.category_id);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentPayments(tournamentId);
    }
  }, [tournamentId, fetchTournamentPayments]);

  if (paymentsLoading || tournamentsLoading || categoriesLoading) return <LoadingSpinner />;
  if (paymentsError) return <ErrorMessage message={paymentsError} />;
  if (tournamentsError) return <ErrorMessage message={tournamentsError} />;

  const handlePaymentChange = async (teamId: string, paid: boolean) => {
    const ok = await updatePaymentStatus(tournamentId, teamId, paid ? 'paid' : 'pending');
    if (ok) fetchTournamentPayments(tournamentId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
          title={`Pagos - ${currentTournament?.name}`}
          icon={<BanknotesIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description="Gestiona los pagos de inscripción para este torneo."
        />

        {/* Resumen de pagos */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total de Equipos</div>
            <div className="text-2xl font-bold">{payments.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Pagos Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {payments.filter(p => p.payment_status === 'pending').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Pagos Completados</div>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter(p => p.payment_status === 'paid').length}
            </div>
          </div>
        </div>

        <TournamentPaymentsPanel
          teams={payments}
          inscriptionCost={currentTournament?.tournament_info?.inscription_cost ?? 0}
          category={tournamentCategory?.name}
          onPaymentChange={handlePaymentChange}
        />
      </div>
    </div>
  );
} 