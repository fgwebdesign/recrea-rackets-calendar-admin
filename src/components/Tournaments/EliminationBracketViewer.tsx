'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SingleEliminationBracket, Match as TournamentMatch, MatchComponentProps, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy, Calendar, Clock, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { TournamentMatchModal } from './TournamentMatchModal';

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
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0.9); // Zoom inicial al 90%
  const svgViewerRef = useRef<any>(null);
  
  // Estados para el modal de resultados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [savingResult, setSavingResult] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEliminationMatches();
  }, [tournamentId]);

  // ===== OPTIMIZADO: Solo refrescar cuando sea necesario =====
  // Removido el intervalo de 5 segundos para mejor rendimiento

  // ===== NUEVA FUNCIÓN: Forzar actualización completa =====
  const forceRefresh = async () => {
    console.log('🔄 FORZANDO ACTUALIZACIÓN COMPLETA...');
    setLoading(true);
    setMatches([]); // Limpiar estado
    await fetchEliminationMatches();
    setLoading(false);
  };

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
        
        console.log('🔍 Debug - Todos los partidos:', matchesData.matches.length);
        console.log('🔍 Debug - Partidos eliminatorios:', eliminationMatches.length);
        console.log('🔍 Debug - Partidos por round:', eliminationMatches.map((m: any) => `${m.round} (${m.match_number})`));
        
        // Crear mapa de equipos para acceso rápido
        const teamsMap = new Map();
        if (teamsData.teams) {
          console.log('🔍 Equipos cargados:', teamsData.teams.length);
          teamsData.teams.forEach((team: any) => {
            console.log(`   - Equipo ${team.team_id}:`, team);
            teamsMap.set(team.team_id, team);
          });
          // Guardar equipos para el modal
          setTeams(teamsData.teams);
        } else {
          console.log('❌ No se cargaron equipos');
        }
        
        // Crear mapa de canchas para acceso rápido
        const courtsMap = new Map();
        if (courtsData.courts) {
          courtsData.courts.forEach((court: any) => {
            courtsMap.set(court.id, court);
          });
        }
        
        // Función para obtener el nombre del equipo
        const getTeamName = (teamId: string | null): string => {
          if (!teamId) {
            console.log(`❌ teamId es null o undefined`);
            return 'Por asignar';
          }
          
          const team = teamsMap.get(teamId);
          console.log(`🔍 Buscando equipo ${teamId}:`, team);
          
          if (!team) {
            console.log(`❌ Equipo ${teamId} no encontrado en teamsMap`);
            return `Equipo ${teamId.slice(-4)}`;
          }
          
          const player1 = team.teams?.player1;
          const player2 = team.teams?.player2;
          
          if (!player1 || !player2) {
            console.log(`❌ Jugadores faltantes para equipo ${teamId}:`, { player1, player2 });
            return `Equipo ${teamId.slice(-4)}`;
          }
          
          const name1 = `${player1.first_name || ''} ${player1.last_name || ''}`.trim();
          const name2 = `${player2.first_name || ''} ${player2.last_name || ''}`.trim();
          
          const teamName = `${name1} / ${name2}`;
          console.log(`✅ Nombre del equipo ${teamId}: ${teamName}`);
          return teamName;
        };
        
        // Función para obtener el nombre de la cancha
        const getCourtName = (courtId: string): string => {
          const court = courtsMap.get(courtId);
          return court ? court.name : `Cancha ${courtId.slice(-4)}`;
        };
        
        // Crear estructura de bracket basada en los datos reales
        const createBracketStructure = (matches: any[]) => {
          // ===== DEBUG: Ver todos los valores de elimination_round =====
          console.log('🔍 Debug elimination_round values:');
          matches.forEach((match, index) => {
            console.log(`  Match ${index}: round="${match.round}", elimination_round="${match.elimination_round}", stage="${match.stage}"`);
          });
          
          // Agrupar partidos por ronda
          const quarterFinals = matches.filter(m => m.elimination_round === 'quarterfinals');
          const semiFinals = matches.filter(m => m.elimination_round === 'semifinals');
          const finals = matches.filter(m => m.elimination_round === 'final');
          
          // ===== NUEVA LÓGICA: También filtrar por round y stage =====
          const semiFinalsByRound = matches.filter(m => m.round === 'semi_final');
          const finalsByRound = matches.filter(m => m.round === 'final');
          
          console.log(`🔍 Filtros aplicados:`);
          console.log(`  - quarterFinals (elimination_round='quarterfinals'): ${quarterFinals.length}`);
          console.log(`  - semiFinals (elimination_round='semifinals'): ${semiFinals.length}`);
          console.log(`  - finals (elimination_round='final'): ${finals.length}`);
          console.log(`  - semiFinalsByRound (round='semi_final'): ${semiFinalsByRound.length}`);
          console.log(`  - finalsByRound (round='final'): ${finalsByRound.length}`);
          
          // Usar la lógica que funcione
          const finalSemiFinals = semiFinals.length > 0 ? semiFinals : semiFinalsByRound;
          const finalFinals = finals.length > 0 ? finals : finalsByRound;
          
          console.log(`🔍 FinalSemiFinals: ${finalSemiFinals.length} semifinales encontradas`);
          console.log(`🔍 FinalFinals: ${finalFinals.length} finales encontradas`);
          
          const formattedMatches: any[] = [];
          
          // Función para formatear un partido
          const formatMatch = (match: any, nextMatchId: string | null = null) => {
            let matchState: 'DONE' | 'SCHEDULED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'SCORE_DONE' = 'SCHEDULED';
            if (match.status === 'completed') {
              matchState = 'DONE';
            } else if (match.status === 'scheduled') {
              matchState = 'SCHEDULED';
            }

            const formatScore = (match: any) => {
              let score = '';
              
              // Set 1
              if (match.team1_sets1_won !== null && match.team2_sets1_won !== null) {
                score += `${match.team1_sets1_won}-${match.team2_sets1_won}`;
                
                // Tiebreak del Set 1
                if (match.team1_tie1_won && match.team2_tie1_won) {
                  score += ` (${match.team1_tie1_won}-${match.team2_tie1_won})`;
                }
              }
              
              // Set 2
              if (match.team1_sets2_won !== null && match.team2_sets2_won !== null) {
                if (score) score += ', ';
                score += `${match.team1_sets2_won}-${match.team2_sets2_won}`;
                
                // Tiebreak del Set 2
                if (match.team1_tie2_won && match.team2_tie2_won) {
                  score += ` (${match.team1_tie2_won}-${match.team2_tie2_won})`;
                }
              }
              
              // Super Tiebreak
              if (match.team1_tie3_won && match.team2_tie3_won) {
                if (score) score += ', ';
                score += `ST: ${match.team1_tie3_won}-${match.team2_tie3_won}`;
              }
              
              return score || 'Sin resultado';
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
                  resultText: match.status === 'completed' ? formatScore(match) : null,
                  isWinner: match.winner_team_id === match.home_team_id,
                  status: match.status === 'completed' ? 'PLAYED' as const : null,
                  name: getTeamName(match.home_team_id)
                },
                {
                  id: match.away_team_id ? String(match.away_team_id) : 'pending',
                  resultText: match.status === 'completed' ? formatScore(match) : null,
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
            // CORRECCIÓN: Lógica de cruces correcta
            // QF1,QF2 → SF1 | QF3,QF4 → SF2
            const semiIndex = index < 2 ? 0 : 1; // QF1,QF2 → SF1 (index 0) | QF3,QF4 → SF2 (index 1)
            
            // CORRECCIÓN: Asignar nextMatchId basado en el orden de creación de semifinales
            let nextMatchId: string;
            if (finalSemiFinals.length >= 2) {
              // Si hay 2 semifinales reales, usar la correspondiente
              nextMatchId = finalSemiFinals[semiIndex]?.id || `ghost-semi-${semiIndex + 1}`;
            } else if (finalSemiFinals.length === 1) {
              // Si hay 1 semifinal real, QF1 va a SF1 real, QF2 va a SF2 fantasma
              nextMatchId = semiIndex === 0 ? finalSemiFinals[0]?.id : `ghost-semi-2`;
            } else {
              // Si no hay semifinales reales, usar fantasma
              nextMatchId = `ghost-semi-${semiIndex + 1}`;
            }
            
            formattedMatches.push(formatMatch(match, nextMatchId));
          });
          
          // CORRECCIÓN: Siempre crear 2 semifinales para bracket completo
          console.log(`🔍 Debug semifinales: finalSemiFinals.length = ${finalSemiFinals.length}, quarterFinals.length = ${quarterFinals.length}`);
          
          // Procesar semifinales reales existentes
          console.log('✅ Procesando semifinales reales...');
          finalSemiFinals.forEach((match, index) => {
            console.log(`🔍 Semifinal ${index + 1}:`, match);
            const nextMatchId = finalFinals.length > 0 ? finalFinals[0]?.id : 'ghost-final-1';
            formattedMatches.push(formatMatch(match, nextMatchId));
          });
          
          // Si faltan semifinales, crear las que faltan como fantasma
          const semifinalsNeeded = 2;
          const semifinalsToCreate = semifinalsNeeded - finalSemiFinals.length;
          
          if (semifinalsToCreate > 0) {
            console.log(`🔮 Creando ${semifinalsToCreate} semifinales fantasma...`);
            for (let i = finalSemiFinals.length; i < semifinalsNeeded; i++) {
              const semiNumber = i + 1;
              const semi = createGhostMatch(
                `ghost-semi-${semiNumber}`, 
                `Match SF${semiNumber}`, 
                'Semifinales', 
                finalFinals.length > 0 ? finalFinals[0]?.id : 'ghost-final-1',
                `2025-10-12 ${15 + i}:00:00`
              );
              formattedMatches.push(semi);
            }
          }
          
          // Si no hay final real, crearla como fantasma
          if (finalFinals.length === 0 && (finalSemiFinals.length > 0 || quarterFinals.length >= 4)) {
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
            finalFinals.forEach(match => {
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
        
        // DEBUG: Verificar qué está pasando con el conteo
        console.log('🔍 DEBUG - Conteo de partidos:');
        console.log('  - Total formattedMatches:', formattedMatches.length);
        console.log('  - Cuartos:', formattedMatches.filter(m => m.tournamentRoundText === 'Cuartos de Final').length);
        console.log('  - Semifinales:', formattedMatches.filter(m => m.tournamentRoundText === 'Semifinales').length);
        console.log('  - Final:', formattedMatches.filter(m => m.tournamentRoundText === 'Final').length);
        console.log('  - Todos los tournamentRoundText:', formattedMatches.map(m => m.tournamentRoundText));
        
        // DEBUG: Verificar cada partido individualmente
        console.log('🔍 DEBUG - Partidos individuales:');
        formattedMatches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.tournamentRoundText}:`, {
            id: match.id,
            name: match.name,
            participants: match.participants?.length,
            participantNames: match.participants?.map((p: { id: string; resultText: string | null; isWinner: boolean; status: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null; name: string; }) => p.name)
          });
        });
        
        // Verificar si tenemos suficientes partidos para un bracket completo
        // Para torneos NINE_PLAYERS necesitamos mínimo 3 partidos (2 semifinales + 1 final)
        if (formattedMatches.length < 3) {
          console.warn('⚠️ No hay suficientes partidos para mostrar un bracket completo');
          console.warn('⚠️ formattedMatches.length:', formattedMatches.length);
          setError('No hay suficientes partidos para mostrar el bracket');
          return;
        }
        
        // Verificar si los datos tienen la estructura correcta
        // Para torneos NINE_PLAYERS puede empezar con semifinales (singular o plural)
        const hasCorrectStructure = formattedMatches.some(match => 
          (match.tournamentRoundText === 'Cuartos de Final' || 
           match.tournamentRoundText === 'Semifinales') && 
          match.participants.length === 2
        );
        
        console.log('🔍 DEBUG - Validación de estructura:');
        console.log('  - hasCorrectStructure:', hasCorrectStructure);
        console.log('  - Partidos que pasan la validación:', formattedMatches.filter(match => 
          (match.tournamentRoundText === 'Cuartos de Final' || 
           match.tournamentRoundText === 'Semifinales') && 
          match.participants.length === 2
        ).length);
        
        if (!hasCorrectStructure) {
          console.warn('⚠️ Los datos reales no tienen la estructura correcta');
          setError('Los datos del torneo no tienen la estructura correcta');
          return;
        }
        
        console.log('✅ Estructura de bracket completa generada:', formattedMatches.length, 'partidos');
        console.log('✅ Cuartos:', formattedMatches.filter(m => m.tournamentRoundText === 'Cuartos de Final').length);
        console.log('✅ Semifinales:', formattedMatches.filter(m => m.tournamentRoundText === 'Semifinales').length);
        console.log('✅ Final:', formattedMatches.filter(m => m.tournamentRoundText === 'Final').length);
        
        // DEBUG: Verificar estructura de datos para la librería
        console.log('🔍 DEBUG - Estructura para SingleEliminationBracket:');
        formattedMatches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.tournamentRoundText}:`, {
            id: match.id,
            name: match.name,
            nextMatchId: match.nextMatchId,
            participants: match.participants?.length,
            participantIds: match.participants?.map((p: { id: string; resultText: string | null; isWinner: boolean; status: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null; name: string; }) => p.id)
          });
        });
        
        // DEBUG: Verificar conexiones entre partidos
        console.log('🔍 DEBUG - Conexiones entre partidos:');
        formattedMatches.forEach((match) => {
          if (match.nextMatchId) {
            const nextMatch = formattedMatches.find(m => m.id === match.nextMatchId);
            console.log(`  ${match.name} -> ${nextMatch?.name || 'NO ENCONTRADO'}`);
          }
        });
        
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

  const handleMatchUpdate = async (matchId: string, result: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${matchId}/result`,
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
        setMatches((prevMatches: any[]) => 
          prevMatches.map((match: any) => 
            match.id === matchId ? { ...match, ...result } : match
          )
        );
        
        // ===== NUEVO: Refrescar datos inmediatamente después de actualizar =====
        console.log('🔄 Refrescando bracket después de actualizar resultado...');
        await fetchEliminationMatches();
        
        // ===== NUEVO: Refrescar múltiples veces para asegurar actualización =====
        setTimeout(async () => {
          console.log('🔄 Refrescando bracket para capturar progresión automática...');
          await fetchEliminationMatches();
        }, 1000);
        
        setTimeout(async () => {
          console.log('🔄 Refrescando bracket final...');
          await fetchEliminationMatches();
        }, 3000);
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

  // Manejar clic en partido para abrir modal de resultados
  const handleMatchClick = (match: any) => {
    console.log('🎯 Partido clickeado:', match);
    
    // ===== NUEVA LÓGICA: Extraer resultados del resultText del bracket =====
    const resultText = match.participants[0]?.resultText || '';
    console.log('🔍 ResultText del bracket:', resultText);
    
    // Parsear el resultado "2-6, 2-6" -> team1_sets1_won: 2, team2_sets1_won: 6, etc.
    let team1_sets1_won = 0, team2_sets1_won = 0;
    let team1_sets2_won = 0, team2_sets2_won = 0;
    
    if (resultText) {
      const sets = resultText.split(', ');
      if (sets.length >= 2) {
        const set1 = sets[0].split('-');
        const set2 = sets[1].split('-');
        
        if (set1.length === 2) {
          team1_sets1_won = parseInt(set1[1]) || 0;  // CORRECCIÓN: El segundo valor es del equipo local
          team2_sets1_won = parseInt(set1[0]) || 0;  // CORRECCIÓN: El primer valor es del equipo visitante
        }
        if (set2.length === 2) {
          team1_sets2_won = parseInt(set2[1]) || 0;  // CORRECCIÓN: El segundo valor es del equipo local
          team2_sets2_won = parseInt(set2[0]) || 0;  // CORRECCIÓN: El primer valor es del equipo visitante
        }
      }
    }
    
    console.log('🔍 Resultados parseados:', {
      team1_sets1_won,
      team2_sets1_won,
      team1_sets2_won,
      team2_sets2_won
    });
    
    // Crear objeto match para el modal con los datos reales del partido original
    const modalMatch = {
      id: match.id,
      tournament_id: tournamentId,
      home_team_id: match.participants[0]?.id,
      away_team_id: match.participants[1]?.id,
      match_day: match.startTime.split(' ')[0],
      start_time: match.startTime.split(' ')[1],
      status: match.state === 'DONE' ? 'completed' : 'scheduled',
      // ===== USAR RESULTADOS PARSEADOS DEL BRACKET =====
      team1_sets1_won: team1_sets1_won,
      team2_sets1_won: team2_sets1_won,
      team1_sets2_won: team1_sets2_won,
      team2_sets2_won: team2_sets2_won,
      team1_tie1_won: null,
      team2_tie1_won: null,
      team1_tie2_won: null,
      team2_tie2_won: null,
      team1_tie3_won: null,
      team2_tie3_won: null,
      winner_team_id: match.participants.find((p: any) => p.isWinner)?.id || null
    };
    
    console.log('✅ Modal match creado con datos reales:', modalMatch);
    
    setSelectedMatch(modalMatch);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setModalError(null);
    setModalSuccess(null);
  };

  // Guardar resultado desde el modal
  const handleSaveResult = async (matchId: string, result: any) => {
    setSavingResult(true);
    setModalError(null);
    setModalSuccess(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token obtenido:', token ? 'Token presente' : 'Token ausente');
      
      if (!token) {
        setModalError('No hay token de autenticación disponible');
        return;
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/matches/${matchId}/result`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el resultado');
      }

      setModalSuccess('¡Resultado guardado exitosamente!');
      
      // Cerrar modal después de 1.5 segundos y recargar datos
      setTimeout(async () => {
        await fetchEliminationMatches();
        handleCloseModal();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving match result:', error);
      setModalError(error.message || 'Error al guardar el resultado');
    } finally {
      setSavingResult(false);
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
              marginBottom: participant.resultText ? '2px' : '2px',
              minHeight: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
              <div className="participant-score" style={{
                fontSize: '7px',
                fontWeight: '500',
                color: '#333',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '2px',
                padding: '1px 2px',
                margin: '1px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                wordBreak: 'break-all',
                border: '1px solid rgba(0,0,0,0.1)',
                minHeight: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1.2'
              }}>
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

      {/* Botones de acción */}
      <div className="mb-4 flex justify-center gap-4">
        <Button 
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar PDF del Bracket
        </Button>
        
        <Button 
          onClick={fetchEliminationMatches}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Refrescar Bracket
        </Button>
        
        <Button 
          onClick={forceRefresh}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Forzar Actualización
        </Button>
      </div>
      
      {/* Layout Horizontal: Bracket (70%) + Gestión de Resultados (30%) */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          
          {/* Columna Izquierda: Bracket (70%) */}
          <div className="lg:col-span-7 bracket-container bg-white rounded-xl shadow-lg w-full min-h-[800px]">
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

          {/* Columna Derecha: Gestión de Resultados (30%) */}
          <div className="lg:col-span-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🏆 Partidos
              </h3>
            </div>
            
            {/* Scroll vertical para las cards */}
            <div className="max-h-[800px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {matches
                .sort((a, b) => {
                  // Ordenar por fecha y hora
                  const dateA = new Date(a.startTime);
                  const dateB = new Date(b.startTime);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((match, index) => {
                const isCompleted = match.state === 'DONE';
                const isScheduled = match.state === 'SCHEDULED';
                
                return (
                  <div
                    key={match.id}
                    onClick={() => handleMatchClick(match)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                        : isScheduled 
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {/* Header con estado */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        isCompleted 
                          ? 'bg-green-200 text-green-800' 
                          : isScheduled 
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {isCompleted ? '✅ Completado' : isScheduled ? '⏰ Programado' : '📅 Pendiente'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {match.tournamentRoundText}
                      </span>
                    </div>
                    
                    {/* Participantes */}
                    <div className="space-y-1">
                      {match.participants.map((participant: any, pIndex: number) => (
                        <div key={pIndex} className="flex items-center justify-between">
                          <span className={`text-sm font-medium truncate ${
                            participant.isWinner ? 'text-green-700 font-bold' : 'text-gray-700'
                          }`}>
                            {participant.name}
                          </span>
                          {participant.isWinner && (
                            <span className="text-xs bg-green-200 text-green-800 px-1 py-0.5 rounded">
                              🏆
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Resultado si está completado */}
                    {isCompleted && match.participants[0]?.resultText && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-sm font-bold text-green-700">
                          {match.participants[0].resultText}
                        </span>
                      </div>
                    )}
                    
                    {/* Fecha y hora */}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        📅 {match.startTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        🏟️ {match.courtName || 'Por asignar'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
      
      {/* Modal de Resultados */}
      {selectedMatch && (
        <TournamentMatchModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          match={selectedMatch}
          teams={teams}
          onSubmit={handleSaveResult}
          isLoading={savingResult}
          error={modalError}
          success={modalSuccess}
        />
      )}
    </div>
  );
};

export default EliminationBracketViewer;