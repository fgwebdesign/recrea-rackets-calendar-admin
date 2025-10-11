'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Clock, 
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getCategoryName } from '@/utils/category';
import EliminationBracketViewer from '@/components/Tournaments/EliminationBracketViewer';

export default function TournamentBracketPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  
  const { tournament, matches, loading, error, refetch } = useTournament(tournamentId);
  const { categories } = useCategories();
  const [bracketData, setBracketData] = useState<any>(null);

  // Detectar si existen partidos eliminatorios
  const hasEliminationMatches = Array.isArray(matches) ? 
    matches.some(match => match.round !== 'group') : false;

  // Función para manejar cuando se genera el bracket
  const handleBracketGenerated = (data: any) => {
    setBracketData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando bracket del torneo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Error al cargar el torneo: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Profesional */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => router.push(`/tournaments/${tournamentId}/matches`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Partidos
              </Button>
              
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tournament?.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Cuadro Eliminatorio
                  </span>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {getCategoryName(tournament?.category_id || '', categories)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refetch}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-hidden">
        {!hasEliminationMatches ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <Trophy className="h-16 w-16 text-yellow-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    No hay bracket eliminatorio generado
                  </h3>
                  
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Este torneo aún no tiene partidos eliminatorios generados. 
                    Ve a la página de partidos para generar el bracket.
                  </p>
                  
                  <Button
                    onClick={() => router.push(`/tournaments/${tournamentId}/matches`)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    Ir a Generar Bracket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Bracket en Pantalla Completa */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
              <div className="p-6 w-full overflow-hidden">
                <EliminationBracketViewer 
                  tournamentId={tournamentId}
                  bracketData={bracketData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
