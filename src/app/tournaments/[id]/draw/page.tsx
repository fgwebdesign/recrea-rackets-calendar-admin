'use client';

import { useParams } from 'next/navigation';
import { useTournament } from '@/hooks/useTournaments';
import { useCategories } from '@/hooks/useCategories';
import Header from '@/components/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getCategoryName } from '@/utils/category';
import Link from 'next/link';
import { CheckCircle2, Users, AlertCircle, UsersIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TournamentDrawPage() {
  const params = useParams();
  const { tournament, teams, loading } = useTournament(params.id as string);
  const { categories } = useCategories();

  if (loading) return <LoadingSpinner />;
  if (!tournament) return null;

  const isRegistrationComplete = teams.length === 12;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header 
          title="Parejas Inscriptas"
          description="Gestiona las parejas inscriptas en el torneo"
          icon={<UsersIcon className="w-6 h-6" />}
        />

        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Estado del Torneo */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Estado del Torneo</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                      {getCategoryName(tournament.category_id, categories)}
                    </Badge>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  isRegistrationComplete 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isRegistrationComplete ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Inscripciones Completas</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Inscripciones Abiertas</span>
                    </>
                  )}
                </div>
              </div>

              {/* Contador de Equipos */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Equipos Inscriptos</h3>
                    <p className="flex items-baseline mt-1">
                      <span className="text-3xl font-bold text-blue-600">{teams.length}</span>
                      <span className="text-gray-500 ml-1">/ 12 equipos</span>
                    </p>
                  </div>
                </div>
                {!isRegistrationComplete && (
                  <p className="mt-4 text-sm text-gray-600">
                    Faltan {12 - teams.length} equipos para completar las inscripciones
                  </p>
                )}
              </div>

              {/* Botón de Acción */}
              {isRegistrationComplete && (
                <div className="mt-6">
                  <Link
                    href={`/tournaments/${params.id}/groups`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Generar Fase de Grupos
                  </Link>
                </div>
              )}
            </div>

            {/* Lista de Equipos Participantes */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Equipos Participantes</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {teams.map((team, index) => team && (
                    <div 
                      key={team?.id || `team-${index}`} 
                      className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Equipo {index + 1}</span>
                      </div>
                      <div className="space-y-3">
                        {team?.player1 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{team.player1.first_name[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{team.player1.first_name}</p>
                              <p className="text-sm text-gray-500">{team.player1.last_name}</p>
                            </div>
                          </div>
                        )}
                        {team?.player2 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{team.player2.first_name[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{team.player2.first_name}</p>
                              <p className="text-sm text-gray-500">{team.player2.last_name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}