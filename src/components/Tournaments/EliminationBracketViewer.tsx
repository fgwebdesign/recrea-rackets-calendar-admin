'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SingleEliminationBracket, Match as TournamentMatch, MatchComponentProps, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy, Calendar, Clock, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

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
  courtName: string;
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
  const [zoomLevel, setZoomLevel] = useState(0.9); // Zoom inicial al 90%
  const svgViewerRef = useRef<any>(null);

  useEffect(() => {
    fetchEliminationMatches();
  }, [tournamentId]);

  // Zoom implementado directamente en el JSX con CSS transforms

  const fetchEliminationMatches = async () => {
    try {
      setLoading(true);
      
      // Obtener partidos, equipos y canchas en paralelo
      const [matchesResponse, teamsResponse, courtsResponse] = await Promise.all([
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
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courts`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        )
      ]);

      if (matchesResponse.ok && teamsResponse.ok && courtsResponse.ok) {
        const matchesData = await matchesResponse.json();
        const teamsData = await teamsResponse.json();
        const courtsData = await courtsResponse.json();
        
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
        
        // Crear mapa de canchas para acceso rápido
        const courtsMap = new Map();
        if (courtsData.courts) {
          courtsData.courts.forEach((court: any) => {
            courtsMap.set(court.id, court);
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
        
        // Función para obtener el nombre de la cancha
        const getCourtName = (courtId: string): string => {
          const court = courtsMap.get(courtId);
          return court ? court.name : `Cancha ${courtId.slice(-4)}`;
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
              courtName: getCourtName(match.court_id),
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
              courtName: 'Por asignar',
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
          setError('No hay suficientes partidos para mostrar el bracket');
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
          setError('Los datos del torneo no tienen la estructura correcta');
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
    setZoomLevel(prev => Math.min(prev + 0.1, 1.2)); // Máximo 120%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.6)); // Mínimo 60%
  };

  const handleResetZoom = () => {
    setZoomLevel(0.9);
  };

  // Función para generar PDF del bracket
  const handleDownloadPDF = async () => {
    try {
      // Importar html2pdf dinámicamente
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Seleccionar el elemento del bracket
      const element = document.querySelector('.bracket-container') as HTMLElement;
      
      if (!element) {
        console.error('No se encontró el elemento del bracket');
        return;
      }

      // Configuración del PDF
      const options = {
        margin: 0.5,
        filename: `bracket-torneo-${tournamentId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'landscape' 
        }
      };

      // Generar y descargar el PDF
      await html2pdf().set(options).from(element).save();
      
      console.log('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
    }
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

  // Componente Match personalizado - estilos por defecto de la librería
  const CustomMatchComponent = ({ match, onMatchClick, onPartyClick }: any) => (
    <div 
      className="match-component"
      onClick={() => onMatchClick && onMatchClick(match)}
    >
      <div className="match-header">
        <div className="match-time" style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          borderRadius: '6px',
          color: 'white',
          fontWeight: '600',
          fontSize: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '4px'
        }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            padding: '2px 6px',
            margin: '2px',
            fontSize: '8px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            {match.startTime}
          </span>
        </div>
        <div className="match-court" style={{
          background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
          borderRadius: '6px',
          color: 'white',
          fontWeight: '600',
          fontSize: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            padding: '2px 6px',
            margin: '2px',
            fontSize: '8px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            🏟️ {match.courtName}
          </span>
        </div>
      </div>
      
      <div className="participants">
        {match.participants.map((participant: any, index: number) => (
          <div 
            key={participant.id}
            className={`participant ${participant.isWinner ? 'winner' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onPartyClick && onPartyClick(participant, match);
            }}
          >
            <div className="participant-name" style={{
              background: index === 0 
                ? 'linear-gradient(135deg, #ffb3ba 0%, #ff9a9e 100%)' // Rosa pastel para LOCAL
                : 'linear-gradient(135deg, #a8d8ea 0%, #87ceeb 100%)', // Azul cielo pastel para VISITANTE
              borderRadius: '6px',
              color: '#333',
              fontWeight: '600',
              fontSize: '10px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: participant.resultText ? '4px' : '0'
            }}>
              <span style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '4px',
                padding: '2px 6px',
                margin: '2px',
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                wordBreak: 'break-word'
              }}>
                {index === 0 ? '🏠 ' : '✈️ '}{participant.name}
              </span>
            </div>
            {participant.resultText && (
              <div className="participant-score">
                {participant.resultText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );


  return (
    <div className="elimination-bracket-viewer">

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

      {/* Botón de descarga PDF */}
      <div className="mb-4 flex justify-center">
        <Button 
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar PDF del Bracket
        </Button>
      </div>
      
      {matches.length > 0 ? (
        <div className="bracket-container bg-white rounded-xl shadow-lg w-full min-h-[800px]">
          <div 
            className="bracket-wrapper w-full h-full"
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
                  width={2560}
                  height={1440}
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