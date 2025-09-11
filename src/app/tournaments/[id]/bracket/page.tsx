'use client';

import { useParams } from 'next/navigation';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { DrawBracket } from "@/components/Tournaments/DrawBracket";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { MatchResultBracketModal } from "@/components/Tournaments/MatchResultBracketModal";
import { Badge } from '@/components/ui/badge';
import { getCategoryName } from '@/utils/category';

interface Match {
  id: string;
  round: number;
  position: number;
  team1?: {
    id: string;
    player1: {
      first_name: string;
      last_name: string;
    };
    player2: {
      first_name: string;
      last_name: string;
    };
  };
  team2?: {
    id: string;
    player1: {
      first_name: string;
      last_name: string;
    };
    player2: {
      first_name: string;
      last_name: string;
    };
  };
  winner?: {
    id: string;
  };
  nextMatchId?: string;
}

export default function TournamentBracketFullPage() {
  const params = useParams();
  const { tournament, matches, teams, loading } = useTournament(params.id as string);
  const { categories } = useCategories();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (!tournament || !teams) return null;

  const handleGenerateBracket = async () => {
    console.log("Generando cruces de fase final con los 8 equipos clasificados");
  };

  // Función para manejar el click en un partido
  const handleUpdateMatch = (match: any) => {
    console.log("Match seleccionado:", match);
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  // Función para manejar el submit del resultado
  const handleSubmitResult = async (matchId: string, result: any) => {
    console.log('Actualizando resultado:', { matchId, result });
    setIsModalOpen(false);
  };

  // Datos de ejemplo para probar el modal
  const sampleMatch = {
    id: "1",
    round: 1,
    team1: {
      id: "team1",
      player1: { first_name: "Jugador 1A" },
      player2: { first_name: "Jugador 1B" }
    },
    team2: {
      id: "team2",
      player1: { first_name: "Jugador 2A" },
      player2: { first_name: "Jugador 2B" }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={`/tournaments/${params.id}`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al torneo
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {tournament.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              {getCategoryName(tournament.category_id, categories)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-2">Fase Final - Eliminación Directa</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Panel Superior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card de Equipos Clasificados */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Equipos Clasificados</h3>
                <p className="text-sm text-gray-500">Fase Final</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {teams.map((team, index) => (
                <div 
                  key={team.team_id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {team.player1.first_name} {team.player1.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {team.player2.first_name} {team.player2.last_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card de Información modificada */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-amber-100 rounded-full p-3">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Fase Final</h3>
                <p className="text-sm text-gray-500">Eliminación Directa</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Cuartos de Final</h4>
                <p className="text-sm text-gray-600">8 equipos clasificados se enfrentan en 4 partidos</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Semifinal</h4>
                <p className="text-sm text-gray-600">4 equipos ganadores avanzan a 2 partidos</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Final</h4>
                <p className="text-sm text-gray-600">2 equipos finalistas se enfrentan por el título</p>
              </div>
            </div>

            {/* Estado y Botón de Generación */}
            {teams.length > 8 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">Esperando a que finalice la fase de grupos</p>
                </div>
              </div>
            ) : teams.length < 8 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">Faltan {8 - teams.length} equipos por clasificar</p>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateBracket}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Generar Fase Final
              </Button>
            )}
          </div>
        </div>

        {/* Botón temporal para probar el modal */}
        <div className="mb-6">
          <Button
            onClick={() => {
              setSelectedMatch(sampleMatch);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Probar Modal de Resultado
          </Button>
        </div>

        {/* Bracket */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <DrawBracket 
            matches={matches || []} 
            onUpdateMatch={handleUpdateMatch}
          />
        </div>

        {/* Modal de Resultados */}
        {selectedMatch && (
          <MatchResultBracketModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            match={selectedMatch}
            onSubmit={handleSubmitResult}
          />
        )}
      </div>
    </div>
  );
} 