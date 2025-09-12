'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SingleEliminationBracket, Match as TournamentMatch, MatchComponentProps, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy, Calendar, Clock, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface EliminationBracketViewerProps {
  tournamentId: string;
  bracketData?: any;
}

// Usar el tipo Match de la librería con el formato correcto
interface Match {
  id: string;
  name: string;
  nextMatchId: string | null;
  tournamentRoundText: string;
  startTime: string;
  state: 'DONE' | 'SCHEDULED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'SCORE_DONE';
  participants: Array<{
    id: string;
    resultText: string | null;
    isWinner: boolean;
    status: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
    name: string;
  }>;
}

// Crear tema personalizado para el bracket
const customTheme = createTheme({
  textColor: { main: '#1f2937', highlighted: '#111827', dark: '#374151' },
  matchBackground: { wonColor: '#dcfce7', lostColor: '#fef3c7' },
  score: {
    background: { wonColor: '#10b981', lostColor: '#f59e0b' },
    text: { highlightedWonColor: '#ffffff', highlightedLostColor: '#ffffff' },
  },
  border: {
    color: '#e5e7eb',
    highlightedColor: '#10b981',
  },
  roundHeader: { backgroundColor: '#3b82f6', fontColor: '#ffffff' },
  connectorColor: '#e5e7eb',
  connectorColorHighlight: '#10b981',
  svgBackground: '#ffffff',
});

const EliminationBracketViewer: React.FC<EliminationBracketViewerProps> = ({ 
  tournamentId, 
  bracketData 
}) => {
  // Estados del componente
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.2); // Zoom inicial alejado
  const svgViewerRef = useRef<any>(null);

  useEffect(() => {
    fetchEliminationMatches();
  }, [tournamentId]);

  // Zoom implementado directamente en el JSX con CSS transforms

  const fetchEliminationMatches = async () => {
    try {
      setLoading(true);
      
      // Obtener partidos y equipos en paralelo
      const [matchesResponse, teamsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              
            }
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/teams`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        )
      ]);

      if (matchesResponse.ok && teamsResponse.ok) {
        const matchesData = await matchesResponse.json();
        const teamsData = await teamsResponse.json();
        
        // Filtrar solo partidos eliminatorios
        const eliminationMatches = matchesData.matches.filter((match: any) => 
          match.round !== 'group'
        );
        
        // Crear mapa de equipos para acceso rápido
        const teamsMap = new Map();
        if (teamsData.teams) {
          teamsData.teams.forEach((team: any) => {
            teamsMap.set(team.team_id, team);
          });
        }
        
        // Función para obtener el nombre del equipo
        const getTeamName = (teamId: string): string => {
          const team = teamsMap.get(teamId);
          if (!team) return `Equipo ${teamId.slice(-4)}`;
          
          const player1 = team.teams?.player1;
          const player2 = team.teams?.player2;
          
          if (!player1 || !player2) return `Equipo ${teamId.slice(-4)}`;
          
          const name1 = `${player1.first_name || ''} ${player1.last_name || ''}`.trim();
          const name2 = `${player2.first_name || ''} ${player2.last_name || ''}`.trim();
          
          return `${name1} / ${name2}`;
        };
        
        // Crear estructura de bracket basada en los datos reales
        const createBracketStructure = (matches: any[]) => {
          // Agrupar partidos por ronda
          const quarterFinals = matches.filter(m => m.elimination_round === 'quarterfinals');
          const semiFinals = matches.filter(m => m.elimination_round === 'semifinals');
          const finals = matches.filter(m => m.elimination_round === 'final');
          
          const formattedMatches: Match[] = [];
          
          // Función para formatear un partido
          const formatMatch = (match: any, nextMatchId: string | null = null) => {
            let matchState: 'DONE' | 'SCHEDULED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'SCORE_DONE' = 'SCHEDULED';
            if (match.status === 'completed') {
              matchState = 'DONE';
            } else if (match.status === 'scheduled') {
              matchState = 'SCHEDULED';
            }

            const formatScore = (sets1: number, sets2: number) => {
              return `${sets1}-${sets2}`;
            };

            return {
              id: match.id,
              name: `Match ${match.bracket_match_id || match.id.slice(-4)}`,
              nextMatchId: nextMatchId,
              tournamentRoundText: getRoundText(match.elimination_round),
              startTime: `${match.match_day} ${match.start_time}`,
              state: matchState,
              participants: [
                {
                  id: String(match.home_team_id),
                  resultText: match.status === 'completed' ? 
                    `${formatScore(match.team1_sets1_won, match.team2_sets1_won)}, ${formatScore(match.team1_sets2_won, match.team2_sets2_won)}` : 
                    null,
                  isWinner: match.winner_team_id === match.home_team_id,
                  status: match.status === 'completed' ? 'PLAYED' as const : null,
                  name: getTeamName(match.home_team_id)
                },
                {
                  id: String(match.away_team_id),
                  resultText: match.status === 'completed' ? 
                    `${formatScore(match.team1_sets1_won, match.team2_sets1_won)}, ${formatScore(match.team1_sets2_won, match.team2_sets2_won)}` : 
                    null,
                  isWinner: match.winner_team_id === match.away_team_id,
                  status: match.status === 'completed' ? 'PLAYED' as const : null,
                  name: getTeamName(match.away_team_id)
                }
              ]
            };
          };
          
          // Función para crear partidos fantasma (semifinales y finales)
          const createGhostMatch = (id: string, name: string, roundText: string, nextMatchId: string | null, startTime: string) => {
            return {
              id: id,
              name: name,
              nextMatchId: nextMatchId,
              tournamentRoundText: roundText,
              startTime: startTime,
              state: 'SCHEDULED' as const,
              participants: [
                {
                  id: `ghost-${id}-1`,
                  resultText: null,
                  isWinner: false,
                  status: null,
                  name: `Ganador ${roundText === 'Semifinales' ? 'Cuartos' : 'Semifinal'} ${roundText === 'Semifinales' ? '1' : '1'}`
                },
                {
                  id: `ghost-${id}-2`,
                  resultText: null,
                  isWinner: false,
                  status: null,
                  name: `Ganador ${roundText === 'Semifinales' ? 'Cuartos' : 'Semifinal'} ${roundText === 'Semifinales' ? '2' : '2'}`
                }
              ]
            };
          };
          
          // Agregar cuartos de final
          quarterFinals.forEach((match, index) => {
            // Si no hay semifinales reales, crear IDs fantasma
            const nextMatchId = semiFinals.length > 0 
              ? semiFinals[Math.floor(index / 2)]?.id 
              : `ghost-semi-${Math.floor(index / 2) + 1}`;
            formattedMatches.push(formatMatch(match, nextMatchId));
          });
          
          // Si no hay semifinales reales, crearlas como fantasma
          if (semiFinals.length === 0 && quarterFinals.length >= 4) {
            console.log('🔮 Creando semifinales fantasma...');
            const semi1 = createGhostMatch(
              'ghost-semi-1', 
              'Match SF1', 
              'Semifinales', 
              finals.length > 0 ? finals[0]?.id : 'ghost-final-1',
              '2025-10-12 15:00:00'
            );
            const semi2 = createGhostMatch(
              'ghost-semi-2', 
              'Match SF2', 
              'Semifinales', 
              finals.length > 0 ? finals[0]?.id : 'ghost-final-1',
              '2025-10-12 16:00:00'
            );
            formattedMatches.push(semi1, semi2);
          } else {
            // Agregar semifinales reales
            semiFinals.forEach((match, index) => {
              const nextMatchId = finals.length > 0 ? finals[0]?.id : 'ghost-final-1';
              formattedMatches.push(formatMatch(match, nextMatchId));
            });
          }
          
          // Si no hay final real, crearla como fantasma
          if (finals.length === 0 && (semiFinals.length > 0 || quarterFinals.length >= 4)) {
            console.log('🔮 Creando final fantasma...');
            const final = createGhostMatch(
              'ghost-final-1', 
              'Match Final', 
              'Final', 
              null,
              '2025-10-12 17:00:00'
            );
            formattedMatches.push(final);
          } else {
            // Agregar final real
            finals.forEach(match => {
              formattedMatches.push(formatMatch(match, null));
            });
          }
          
          return formattedMatches;
        };
        
        const formattedMatches = createBracketStructure(eliminationMatches);
        
        // Debug: verificar el formato de datos
        console.log('🔍 Raw elimination matches:', eliminationMatches);
        console.log('🔍 Teams map:', teamsMap);
        console.log('🔍 Quarter finals:', eliminationMatches.filter((m: any) => m.elimination_round === 'quarterfinals'));
        console.log('🔍 Semi finals:', eliminationMatches.filter((m: any) => m.elimination_round === 'semifinals'));
        console.log('🔍 Finals:', eliminationMatches.filter((m: any) => m.elimination_round === 'final'));
        console.log('🔍 All elimination rounds:', eliminationMatches.map((m: any) => m.elimination_round));
        console.log('🔍 Formatted matches for bracket:', formattedMatches);
        console.log('🔍 Sample match:', formattedMatches[0]);
        console.log('🔍 Total matches count:', formattedMatches.length);
        
        // Comparar con datos de prueba
        console.log('🧪 Comparing with test data structure...');
        console.log('🧪 Test data has 7 matches, real data has:', formattedMatches.length);
        
        // Verificar si tenemos suficientes partidos para un bracket completo
        if (formattedMatches.length < 4) {
          console.warn('⚠️ No hay suficientes partidos para mostrar un bracket completo');
          console.warn('⚠️ Usando datos de prueba automáticamente...');
          createTestData();
          return;
        }
        
        // Verificar si los datos tienen la estructura correcta
        const hasCorrectStructure = formattedMatches.some(match => 
          match.tournamentRoundText === 'Cuartos de Final' && 
          match.participants.length === 2 &&
          match.participants[0].name && 
          match.participants[1].name
        );
        
        if (!hasCorrectStructure) {
          console.warn('⚠️ Los datos reales no tienen la estructura correcta');
          console.warn('⚠️ Usando datos de prueba automáticamente...');
          createTestData();
          return;
        }
        
        console.log('✅ Estructura de bracket completa generada:', formattedMatches.length, 'partidos');
        console.log('✅ Cuartos:', formattedMatches.filter(m => m.tournamentRoundText === 'Cuartos de Final').length);
        console.log('✅ Semifinales:', formattedMatches.filter(m => m.tournamentRoundText === 'Semifinales').length);
        console.log('✅ Final:', formattedMatches.filter(m => m.tournamentRoundText === 'Final').length);
        
        setMatches(formattedMatches);
      } else {
        throw new Error('Error obteniendo datos del torneo');
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoundText = (eliminationRound: string) => {
    const roundTexts: { [key: string]: string } = {
      'octavos': 'Octavos de Final',
      'quarterfinals': 'Cuartos de Final',
      'semifinals': 'Semifinales',
      'final': 'Final'
    };
    return roundTexts[eliminationRound] || eliminationRound;
  };

  const handleMatchClick = (match: Match) => {
    console.log('Match clicked:', match);
    // Aquí puedes abrir un modal para editar el resultado
    // o navegar a una página de edición
  };

  const handleMatchUpdate = async (matchId: string, result: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/result`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );

      if (response.ok) {
        // Actualizar estado local
        setMatches((prevMatches: Match[]) => 
          prevMatches.map((match: Match) => 
            match.id === matchId ? { ...match, ...result } : match
          )
        );
        
        // Refrescar datos
        fetchEliminationMatches();
      }
    } catch (error) {
      console.error('Error updating match result:', error);
    }
  };

  // Funciones para controlar el zoom - ahora solo cambian el estado
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleResetZoom = () => {
    setZoomLevel(0.6);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
        <p className="text-gray-600">Cargando bracket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertDescription>
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Componente Match personalizado para mejor visualización
  const CustomMatchComponent = ({ match, onMatchClick, onPartyClick }: any) => (
    <div 
      className="match-component bg-white border-2 border-gray-300 rounded-lg p-8 cursor-pointer hover:border-green-500 hover:shadow-lg transition-all duration-200 min-w-[480px] max-w-[520px]"
      onClick={() => onMatchClick && onMatchClick(match)}
    >
      <div className="match-header mb-6">
        <div className="text-lg font-bold text-gray-800 bg-blue-100 px-6 py-4 rounded-lg mb-4 text-center">
          {match.tournamentRoundText}
        </div>
        <div className="text-base text-gray-600 flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="text-center font-semibold">{match.startTime}</span>
        </div>
      </div>
      
      <div className="match-participants space-y-5">
        {match.participants.map((participant: any, index: number) => (
          <div 
            key={participant.id}
            className={`participant flex flex-col items-center p-5 rounded-lg text-lg transition-all duration-200 ${
              participant.isWinner 
                ? 'bg-green-100 border-2 border-green-300 text-green-800 font-bold shadow-md' 
                : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onPartyClick && onPartyClick(participant, match);
            }}
          >
            <span className="participant-name text-center font-bold leading-tight break-words w-full text-xl">
              {participant.name}
            </span>
            {participant.resultText && (
              <span className="participant-score font-bold text-gray-800 mt-4 bg-white px-5 py-3 rounded-lg shadow-sm text-lg">
                {participant.resultText}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="match-status mt-6 text-center">
        <span className={`px-5 py-4 rounded-full text-base font-semibold ${
          match.state === 'DONE' 
            ? 'bg-green-200 text-green-800 border border-green-300' 
            : 'bg-yellow-200 text-yellow-800 border border-yellow-300'
        }`}>
          {match.state === 'DONE' ? '✅ Completado' : '⏰ Programado'}
        </span>
      </div>
    </div>
  );

  // Función para crear datos de prueba
  const createTestData = () => {
    const testMatches: Match[] = [
      {
        id: 'test1',
        name: 'Match 1',
        nextMatchId: 'test5',
        tournamentRoundText: 'Cuartos de Final',
        startTime: '2025-10-12 11:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'team1',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Arturo Tapia / Marcelo Tapia'
          },
          {
            id: 'team2',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Martin Cepero / Richard Cepero'
          }
        ]
      },
      {
        id: 'test2',
        name: 'Match 2',
        nextMatchId: 'test5',
        tournamentRoundText: 'Cuartos de Final',
        startTime: '2025-10-12 12:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'team3',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Carlos Cepero / Felipe Cepero'
          },
          {
            id: 'team4',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'MARCELO Cepero / Carlitos Cepero'
          }
        ]
      },
      {
        id: 'test3',
        name: 'Match 3',
        nextMatchId: 'test6',
        tournamentRoundText: 'Cuartos de Final',
        startTime: '2025-10-12 13:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'team5',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Maxi Cepero / Travol Cepero'
          },
          {
            id: 'team6',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Josep Cepero / Deibis Cepero'
          }
        ]
      },
      {
        id: 'test4',
        name: 'Match 4',
        nextMatchId: 'test6',
        tournamentRoundText: 'Cuartos de Final',
        startTime: '2025-10-12 14:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'team7',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Alvaro Cepero / Mateo Cepero'
          },
          {
            id: 'team8',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Runate Cepero / Runa Cepero'
          }
        ]
      },
      {
        id: 'test5',
        name: 'Match 5',
        nextMatchId: 'test7',
        tournamentRoundText: 'Semifinales',
        startTime: '2025-10-12 15:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'winner1',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Ganador Match 1'
          },
          {
            id: 'winner2',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Ganador Match 2'
          }
        ]
      },
      {
        id: 'test6',
        name: 'Match 6',
        nextMatchId: 'test7',
        tournamentRoundText: 'Semifinales',
        startTime: '2025-10-12 16:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'winner3',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Ganador Match 3'
          },
          {
            id: 'winner4',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Ganador Match 4'
          }
        ]
      },
      {
        id: 'test7',
        name: 'Match 7',
        nextMatchId: null,
        tournamentRoundText: 'Final',
        startTime: '2025-10-12 17:00:00',
        state: 'SCHEDULED',
        participants: [
          {
            id: 'finalist1',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Ganador Semifinal 1'
          },
          {
            id: 'finalist2',
            resultText: null,
            isWinner: false,
            status: null,
            name: 'Ganador Semifinal 2'
          }
        ]
      }
    ];
    
    console.log('🧪 Test data created:', testMatches);
    setMatches(testMatches);
  };

  return (
    <div className="elimination-bracket-viewer">
      {/* Botones de debug */}
      <div className="mb-4 text-center space-x-4">
        <Button 
          onClick={createTestData}
          variant="outline"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          🧪 Usar Datos de Prueba
        </Button>
        <Button 
          onClick={() => {
            setUseTestData(false);
            fetchEliminationMatches();
          }}
          variant="outline"
          className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
        >
          🔄 Usar Datos Reales
        </Button>
      </div>

      {/* Controles de zoom */}
      <div className="mb-4 flex justify-center items-center space-x-2">
        <Button 
          onClick={handleZoomOut}
          variant="outline"
          size="sm"
          className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-gray-600 min-w-[60px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button 
          onClick={handleZoomIn}
          variant="outline"
          size="sm"
          className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          onClick={handleResetZoom}
          variant="outline"
          size="sm"
          className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {matches.length > 0 ? (
        <div className="bracket-container bg-white rounded-xl p-8 shadow-lg overflow-hidden min-h-[900px] w-full">
          <div 
            className="bracket-wrapper w-full h-full min-w-[2400px]"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease'
            }}
          >
            <SingleEliminationBracket
              matches={matches}
              matchComponent={CustomMatchComponent}
              theme={customTheme}
              options={{
                style: {
                  roundHeader: {
                    backgroundColor: customTheme.roundHeader.backgroundColor,
                    fontColor: customTheme.roundHeader.fontColor,
                  },
                  connectorColor: customTheme.connectorColor,
                  connectorColorHighlight: customTheme.connectorColorHighlight,
                },
              }}
              svgWrapper={({ children, ...props }) => (
                <SVGViewer
                  background={customTheme.svgBackground}
                  SVGBackground={customTheme.svgBackground}
                  width={3200}
                  height={1600}
                  {...props}
                >
                  {children}
                </SVGViewer>
              )}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h5 className="text-lg font-semibold text-blue-900 mb-2">No hay partidos eliminatorios generados aún</h5>
            <p className="text-blue-700">Haz clic en "Generar Fase Eliminatoria" para comenzar.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EliminationBracketViewer;
