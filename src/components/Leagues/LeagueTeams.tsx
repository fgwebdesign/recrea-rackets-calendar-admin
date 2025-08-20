"use client"

import { Users2, Trophy, UserCircle2, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
import { ClientSideWrapper } from '@/components/ClientSideWrapper';

interface Team {
  id: string;
  league_team_id: string;
  inscription_paid: boolean;
  alternate_player: string;
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
}

interface LeagueTeamsProps {
  teams: Team[];
  maxTeams: number;
  status: string;
  leagueId: string;
  hasGeneratedMatches: boolean;
}

export function LeagueTeams({ teams: initialTeams, maxTeams, status, leagueId, hasGeneratedMatches }: LeagueTeamsProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const handleDeleteClick = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handlePaymentChange = async (team: Team, paid: boolean) => {
    if (isUpdatingPayment) return;

    setIsUpdatingPayment(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No hay sesión de administrador activa"
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/inscription-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          league_team_id: team.league_team_id,
          inscription_paid: paid
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el estado de pago');
      }

      // Actualizar el estado local
      setTeams(currentTeams => 
        currentTeams.map(t => 
          t.league_team_id === team.league_team_id 
            ? { ...t, inscription_paid: paid }
            : t
        )
      );

      toast({
        title: "Estado de pago actualizado",
        description: `El pago ha sido marcado como ${paid ? 'realizado' : 'pendiente'}`,
        className: "bg-green-500 text-white"
      });

    } catch (error) {
      console.error('Error actualizando estado de pago:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el estado de pago"
      });
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeam) return;

    setIsDeleting(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No hay sesión de administrador activa"
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/remove-team`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          league_id: leagueId,
          team_id: selectedTeam.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el equipo');
      }

      // Actualizar el estado local
      setTeams(currentTeams => currentTeams.filter(t => t.id !== selectedTeam.id));

      toast({
        title: "Equipo eliminado",
        description: "El equipo ha sido eliminado exitosamente de la liga",
        className: "bg-green-500 text-white"
      });

    } catch (error) {
      console.error('Error eliminando equipo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el equipo"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Users2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Equipos Registrados</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {teams.length} de {maxTeams}
            </span>
          </div>
          <Progress value={(teams.length / maxTeams) * 100} className="h-2" />
        </div>
      </div>

      <div className="grid gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 
                      hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 
                      dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 
                      transition-all duration-300 ease-in-out"
          >
            <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-6 items-center">
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {team.player1.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {team.player2.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Suplente</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {team.alternate_player || 'No asignado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={team.inscription_paid}
                  onCheckedChange={(checked) => handlePaymentChange(team, checked)}
                  disabled={isUpdatingPayment}
                />
                <span className={`text-sm px-2 py-1 rounded-full ${
                  team.inscription_paid 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {team.inscription_paid ? 'Inscripción pagada' : 'Inscripción pendiente'}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center"
                onClick={() => handleDeleteClick(team)}
                disabled={hasGeneratedMatches}
                title={hasGeneratedMatches ? "No se puede eliminar un equipo cuando ya hay partidos generados" : ""}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ClientSideWrapper>
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <div className="space-y-4">
                <DialogDescription>
                  ¿Estás seguro que deseas eliminar esta pareja de la liga?
                </DialogDescription>
                {selectedTeam && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTeam.player1.name} - {selectedTeam.player2.name}
                    </p>
                  </div>
                )}
                <p className="text-sm text-red-600 dark:text-red-400">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ClientSideWrapper>
    </div>
  );
} 