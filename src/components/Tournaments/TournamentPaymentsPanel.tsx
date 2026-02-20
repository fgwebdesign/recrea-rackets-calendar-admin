'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { TeamPayment } from '@/hooks/usePayments';
import { Check, Clock, Users } from 'lucide-react';

export interface TournamentPaymentsPanelProps {
  teams: TeamPayment[];
  inscriptionCost: number;
  category?: string;
  /** Actualizar pago por equipo (legacy). */
  onPaymentChange?: (teamId: string, paid: boolean) => Promise<void>;
  /** Actualizar pago por jugador (recomendado). */
  onPlayerPaymentChange?: (teamId: string, player: 1 | 2, paid: boolean) => Promise<void>;
}

function PlayerRow({
  name,
  paid,
  updating,
  onToggle,
}: {
  name: string;
  paid: boolean;
  updating: boolean;
  onToggle: (paid: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/80">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</span>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            paid
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          {updating ? '…' : paid ? 'Pagado' : 'Pendiente'}
        </span>
        <Switch
          checked={paid}
          onCheckedChange={onToggle}
          disabled={updating}
          className="data-[state=checked]:bg-emerald-600"
        />
      </div>
    </div>
  );
}

export function TournamentPaymentsPanel({
  teams,
  inscriptionCost,
  category,
  onPaymentChange,
  onPlayerPaymentChange,
}: TournamentPaymentsPanelProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const byPlayer = (teamId: string, player: 1 | 2) => `${teamId}-${player}`;

  const handleTeamToggle = async (teamId: string, paid: boolean) => {
    if (isUpdating || !onPaymentChange) return;
    setIsUpdating(teamId);
    try {
      await onPaymentChange(teamId, paid);
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePlayerToggle = async (teamId: string, player: 1 | 2, paid: boolean) => {
    if (isUpdating || !onPlayerPaymentChange) return;
    setIsUpdating(byPlayer(teamId, player));
    try {
      await onPlayerPaymentChange(teamId, player, paid);
    } finally {
      setIsUpdating(null);
    }
  };

  const usePerPlayer = Boolean(onPlayerPaymentChange);
  const paidCount = teams.filter((t) => t.payment_status === 'paid').length;
  const pendingCount = teams.length - paidCount;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header compacto */}
      <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estado de pagos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Marca quién ya pagó la inscripción. Cada jugador por separado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {category && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Categoría</span>{' '}
                <span className="font-medium">{category}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-gray-100">${inscriptionCost}</span>
              <span>inscripción</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span className="font-medium">{paidCount}</span> pagados
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{pendingCount}</span> pendientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de parejas en cards */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {teams.map((teamEntry) => {
          const p1 = teamEntry.player1_payment_status ?? (teamEntry.payment_status === 'paid' ? 'paid' : 'pending');
          const p2 = teamEntry.player2_payment_status ?? (teamEntry.payment_status === 'paid' ? 'paid' : 'pending');
          const name1 =
            `${teamEntry.teams.player1?.first_name || ''} ${teamEntry.teams.player1?.last_name || ''}`.trim() ||
            'Jugador 1';
          const name2 =
            `${teamEntry.teams.player2?.first_name || ''} ${teamEntry.teams.player2?.last_name || ''}`.trim() ||
            'Jugador 2';
          const teamPaid = teamEntry.payment_status === 'paid';

          return (
            <div
              key={teamEntry.team_id}
              className="p-4 sm:p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {name1} · {name2}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full w-fit ${
                    teamPaid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  {teamPaid ? 'Pareja al día' : 'Falta pago'}
                </span>
              </div>

              {usePerPlayer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PlayerRow
                    name={name1}
                    paid={p1 === 'paid'}
                    updating={isUpdating === byPlayer(teamEntry.team_id, 1)}
                    onToggle={(paid) => handlePlayerToggle(teamEntry.team_id, 1, paid)}
                  />
                  <PlayerRow
                    name={name2}
                    paid={p2 === 'paid'}
                    updating={isUpdating === byPlayer(teamEntry.team_id, 2)}
                    onToggle={(paid) => handlePlayerToggle(teamEntry.team_id, 2, paid)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/80">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pago de la pareja</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        teamPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {isUpdating === teamEntry.team_id ? '…' : teamPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                    <Switch
                      checked={teamPaid}
                      onCheckedChange={(paid) => handleTeamToggle(teamEntry.team_id, paid)}
                      disabled={isUpdating === teamEntry.team_id}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}