import { useState, useEffect } from 'react';
import { Trophy, Swords, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TournamentMatch, Team, TournamentTeam } from '@/types/tournament';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SetScore {
  team1: number | null;
  team2: number | null;
  tiebreak: { team1: number | null; team2: number | null } | null;
}

interface TournamentMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TournamentMatch;
  teams: TournamentTeam[];
  onSubmit: (matchId: string, result: Record<string, unknown>) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}


export function TournamentMatchModal({
  isOpen,
  onClose,
  match,
  teams,
  onSubmit,
  isLoading = false,
  error = null,
  success = null,
}: TournamentMatchModalProps) {
  const [set1, setSet1] = useState<SetScore>({ team1: null, team2: null, tiebreak: null });
  const [set2, setSet2] = useState<SetScore>({ team1: null, team2: null, tiebreak: null });
  const [superTiebreak, setSuperTiebreak] = useState<{ team1: number; team2: number } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const getTeamById = (teamId: string): TournamentTeam | null => {
    if (!Array.isArray(teams)) return null;
    return teams.find((t) => t.team_id === teamId) ?? null;
  };

  const formatEmbeddedTeam = (team: Team | null | undefined): string => {
    if (!team || (!team.player1 && !team.player2)) return 'Equipo no encontrado';
    const name1 = team.player1 ? `${team.player1.first_name ?? ''} ${team.player1.last_name ?? ''}`.trim() : '';
    const name2 = team.player2 ? `${team.player2.first_name ?? ''} ${team.player2.last_name ?? ''}`.trim() : '';
    if (!name1 && !name2) return 'Jugadores no disponibles';
    return name2 ? `${name1} / ${name2}` : name1;
  };

  const formatPlayerNames = (team: TournamentTeam | null): string => {
    if (!team) return 'Equipo no encontrado';
    const player1 = team.teams?.player1;
    const player2 = team.teams?.player2;
    if (!player1 && !player2) return 'Jugadores no disponibles';
    const name1 = player1 ? `${player1.first_name ?? ''} ${player1.last_name ?? ''}`.trim() : '';
    const name2 = player2 ? `${player2.first_name ?? ''} ${player2.last_name ?? ''}`.trim() : '';
    if (!name2) return name1 || 'Jugadores no disponibles';
    return `${name1} / ${name2}`;
  };

  const homeTeamName = match.home_team ? formatEmbeddedTeam(match.home_team) : formatPlayerNames(getTeamById(match.home_team_id));
  const awayTeamName = match.away_team ? formatEmbeddedTeam(match.away_team) : formatPlayerNames(getTeamById(match.away_team_id));

  useEffect(() => {
    setLocalError(null);

    // Inicializar con datos existentes del partido
    const set1Data = {
      team1: match.team1_sets1_won || null,
      team2: match.team2_sets1_won || null,
      tiebreak: match.team1_tie1_won || match.team2_tie1_won ? {
        team1: match.team1_tie1_won || null,
        team2: match.team2_tie1_won || null
      } : null
    };
    
    const set2Data = {
      team1: match.team1_sets2_won || null,
      team2: match.team2_sets2_won || null,
      tiebreak: match.team1_tie2_won || match.team2_tie2_won ? {
        team1: match.team1_tie2_won || null,
        team2: match.team2_tie2_won || null
      } : null
    };
    
    const superTiebreakData = match.team1_tie3_won || match.team2_tie3_won ? {
      team1: match.team1_tie3_won || 0,
      team2: match.team2_tie3_won || 0
    } : null;

    setSet1(set1Data);
    setSet2(set2Data);
    setSuperTiebreak(superTiebreakData);
  }, [match]);

  const showSet1Tiebreak = (set1.team1 === 6 && set1.team2 === 6) || 
                          (set1.team1 === 5 && set1.team2 === 5);
  
  const showSet2Tiebreak = (set2.team1 === 6 && set2.team2 === 6) || 
                          (set2.team1 === 5 && set2.team2 === 5);

  const validateSetScore = (score: number | null): boolean => {
    if (score === null) return false;
    return score >= 0 && score <= 7;
  };

  const validateTiebreakScore = (score: number | null): boolean => {
    if (score === null) return false;
    return score >= 0;
  };

  const getSetWinner = (set: SetScore): number => {
    if (!set.team1 || !set.team2) return 0;

    if (set.tiebreak && set.tiebreak.team1 !== null && set.tiebreak.team2 !== null) {
      if (!validateTiebreakScore(set.tiebreak.team1) || !validateTiebreakScore(set.tiebreak.team2)) {
        return 0;
      }
      return set.tiebreak.team1 > set.tiebreak.team2 ? 1 : 2;
    }
    
    if (set.team1 > set.team2 && set.team1 >= 6 && (set.team1 - set.team2 >= 2)) return 1;
    if (set.team2 > set.team1 && set.team2 >= 6 && (set.team2 - set.team1 >= 2)) return 2;
    return 0;
  };

  const showSuperTiebreak = getSetWinner(set1) && getSetWinner(set2) && getSetWinner(set1) !== getSetWinner(set2);

  const isSetValid = (set: SetScore): boolean => {
    if (!set.team1 || !set.team2) return false;

    if (set.tiebreak && set.tiebreak.team1 !== null && set.tiebreak.team2 !== null) {
      if (!validateTiebreakScore(set.tiebreak.team1) || !validateTiebreakScore(set.tiebreak.team2)) {
        return false;
      }
      return true;
    }
    
    if (set.team1 > set.team2 && set.team1 >= 6 && (set.team1 - set.team2 >= 2)) return true;
    if (set.team2 > set.team1 && set.team2 >= 6 && (set.team2 - set.team1 >= 2)) return true;
    return false;
  };

  const handleSubmitResult = () => {
    setLocalError(null);

    // Validar que los sets sean números válidos
    if (!validateSetScore(set1.team1) || !validateSetScore(set1.team2) ||
        !validateSetScore(set2.team1) || !validateSetScore(set2.team2)) {
      setLocalError("Los sets deben ser números entre 0 y 7");
      return;
    }

    // Validar que haya un ganador en cada set
    if (!getSetWinner(set1)) {
      setLocalError("El primer set debe tener un ganador claro (diferencia de 2 juegos o ganar el tiebreak)");
      return;
    }
    if (!getSetWinner(set2)) {
      setLocalError("El segundo set debe tener un ganador claro (diferencia de 2 juegos o ganar el tiebreak)");
      return;
    }

    // Validar super tiebreak si es necesario
    if (showSuperTiebreak) {
      if (!superTiebreak || !validateTiebreakScore(superTiebreak.team1) || !validateTiebreakScore(superTiebreak.team2)) {
        setLocalError("El super tiebreak debe tener valores válidos");
        return;
      }
      if (superTiebreak.team1 === superTiebreak.team2) {
        setLocalError("El super tiebreak debe tener un ganador");
        return;
      }
    }

    const result = {
      set1: {
        team1: set1.team1 || 0,
        team2: set1.team2 || 0,
        tiebreak: set1.tiebreak ? {
          team1: set1.tiebreak.team1 || 0,
          team2: set1.tiebreak.team2 || 0
        } : undefined
      },
      set2: {
        team1: set2.team1 || 0,
        team2: set2.team2 || 0,
        tiebreak: set2.tiebreak ? {
          team1: set2.tiebreak.team1 || 0,
          team2: set2.tiebreak.team2 || 0
        } : undefined
      },
      superTiebreak: superTiebreak ? {
        team1: superTiebreak.team1 || 0,
        team2: superTiebreak.team2 || 0
      } : undefined
    };

    onSubmit(match.id, result);
  };

  const renderCompletedMatchView = () => {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center p-8 rounded-xl">
          {/* Content */}
          <div className="w-full">
            {/* Teams and Score */}
            <div className="grid grid-cols-3 gap-8 items-center w-full">
              {/* Team 1 */}
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">{homeTeamName}</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="p-4 rounded-lg">
                      <div className="font-orbitron text-6xl font-bold text-green-600 dark:text-[#4ade80]">
                        {match.team1_sets1_won}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="p-4 rounded-lg">
                      <div className="font-orbitron text-6xl font-bold text-green-600 dark:text-[#4ade80]">
                        {match.team1_sets2_won}
                      </div>
                    </div>
                  </div>
                  {(match.team1_tie3_won ?? 0) > 0 && (
                    <div className="relative">
                      <div className="p-4 rounded-lg">
                        <div className="font-orbitron text-6xl font-bold text-yellow-600 dark:text-[#fbbf24]">
                          {match.team1_tie3_won}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Center - VS and Date */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="font-orbitron text-4xl font-bold text-purple-600 dark:text-purple-400">
                  VS
                </div>
                <div className="relative">
                  <Badge className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/50 text-sm px-4 py-1.5 rounded-full">
                    {match.match_day || 'Sin fecha'} {match.start_time || ''}
                  </Badge>
                </div>
              </div>

              {/* Team 2 */}
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">{awayTeamName}</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="p-4 rounded-lg">
                      <div className="font-orbitron text-6xl font-bold text-green-600 dark:text-[#4ade80]">
                        {match.team2_sets1_won}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="p-4 rounded-lg">
                      <div className="font-orbitron text-6xl font-bold text-green-600 dark:text-[#4ade80]">
                        {match.team2_sets2_won}
                      </div>
                    </div>
                  </div>
                  {(match.team2_tie3_won ?? 0) > 0 && (
                    <div className="relative">
                      <div className="p-4 rounded-lg">
                        <div className="font-orbitron text-6xl font-bold text-yellow-600 dark:text-[#fbbf24]">
                          {match.team2_tie3_won}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <DialogHeader>
              <div className="flex items-center">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-purple-500" />
                  <div>
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {match.status === 'completed' ? 'Resultado del Partido' : 'Gestionar Partido'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 mt-1">
                      {homeTeamName} vs {awayTeamName}
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
          
            {match.status === 'completed' ? (
              renderCompletedMatchView()
            ) : (
              <div className="p-8">
                {/* Match Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {homeTeamName} vs {awayTeamName}
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{match.match_day || 'Sin fecha'}</span>
                    <span>•</span>
                    <span>{match.start_time || 'Sin hora'}</span>
                    <span>•</span>
                    <span>{match.court_name || 'Sin cancha'}</span>
                  </div>
                </div>

                {/* Score Input Sections */}
                <div className="space-y-8">
                  {/* Set 1 */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Swords className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set 1</h3>
                      {getSetWinner(set1) > 0 && (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ml-auto">
                          Ganador: {getSetWinner(set1) === 1 ? homeTeamName : awayTeamName}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Team 1 */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {homeTeamName}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="7"
                            value={set1.team1 ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Math.min(7, parseInt(e.target.value));
                              setSet1(prev => ({ ...prev, team1: value }));
                            }}
                            placeholder="0"
                            disabled={isLoading}
                            className="text-center text-2xl font-bold bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 h-12"
                          />
                        </div>
                      </div>
                      
                      {/* Team 2 */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {awayTeamName}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="7"
                            value={set1.team2 ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Math.min(7, parseInt(e.target.value));
                              setSet1(prev => ({ ...prev, team2: value }));
                            }}
                            placeholder="0"
                            disabled={isLoading}
                            className="text-center text-2xl font-bold bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 h-12"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tiebreak for Set 1 */}
                    {showSet1Tiebreak && (
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          Tiebreak
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-purple-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>El tiebreak se juega cuando el set está 6-6</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600 dark:text-gray-300 truncate">{homeTeamName}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={set1.tiebreak?.team1 ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                setSet1(prev => ({
                                  ...prev,
                                  tiebreak: { 
                                    team1: value,
                                    team2: prev.tiebreak?.team2 ?? null
                                  }
                                }));
                              }}
                              className="text-center font-semibold bg-white dark:bg-gray-700 border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600 dark:text-gray-300 truncate">{awayTeamName}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={set1.tiebreak?.team2 ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                setSet1(prev => ({
                                  ...prev,
                                  tiebreak: { 
                                    team1: prev.tiebreak?.team1 ?? null,
                                    team2: value
                                  }
                                }));
                              }}
                              className="text-center font-semibold bg-white dark:bg-gray-700 border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Set 2 */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Swords className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set 2</h3>
                      {getSetWinner(set2) > 0 && (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ml-auto">
                          Ganador: {getSetWinner(set2) === 1 ? homeTeamName : awayTeamName}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Team 1 */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {homeTeamName}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="7"
                            value={set2.team1 ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Math.min(7, parseInt(e.target.value));
                              setSet2(prev => ({ ...prev, team1: value }));
                            }}
                            placeholder="0"
                            disabled={isLoading}
                            className="text-center text-2xl font-bold bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 h-12"
                          />
                        </div>
                      </div>
                      
                      {/* Team 2 */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {awayTeamName}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="7"
                            value={set2.team2 ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Math.min(7, parseInt(e.target.value));
                              setSet2(prev => ({ ...prev, team2: value }));
                            }}
                            placeholder="0"
                            disabled={isLoading}
                            className="text-center text-2xl font-bold bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 h-12"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tiebreak for Set 2 */}
                    {showSet2Tiebreak && (
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          Tiebreak
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-purple-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>El tiebreak se juega cuando el set está 6-6</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600 dark:text-gray-300 truncate">{homeTeamName}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={set2.tiebreak?.team1 ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                setSet2(prev => ({
                                  ...prev,
                                  tiebreak: { 
                                    team1: value,
                                    team2: prev.tiebreak?.team2 ?? null
                                  }
                                }));
                              }}
                              className="text-center font-semibold bg-white dark:bg-gray-700 border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600 dark:text-gray-300 truncate">{awayTeamName}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={set2.tiebreak?.team2 ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                setSet2(prev => ({
                                  ...prev,
                                  tiebreak: { 
                                    team1: prev.tiebreak?.team1 ?? null,
                                    team2: value
                                  }
                                }));
                              }}
                              className="text-center font-semibold bg-white dark:bg-gray-700 border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Super Tiebreak */}
                  {showSuperTiebreak && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3 mb-6">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          Super Tiebreak
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>El super tiebreak se juega cuando cada equipo ha ganado un set</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        {/* Team 1 */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {homeTeamName}
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              value={superTiebreak?.team1 ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                setSuperTiebreak(prev => ({
                                  team1: value ?? 0,
                                  team2: prev?.team2 ?? 0
                                }));
                              }}
                              placeholder="0"
                              disabled={isLoading}
                              className="text-center text-2xl font-bold bg-white dark:bg-gray-700 border-yellow-200 dark:border-yellow-800 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 h-12"
                            />
                          </div>
                        </div>
                        
                        {/* Team 2 */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {awayTeamName}
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              value={superTiebreak?.team2 ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                setSuperTiebreak(prev => ({
                                  team1: prev?.team1 ?? 0,
                                  team2: value ?? 0
                                }));
                              }}
                              placeholder="0"
                              disabled={isLoading}
                              className="text-center text-2xl font-bold bg-white dark:bg-gray-700 border-yellow-200 dark:border-yellow-800 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 h-12"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alertas de error */}
                {(localError || error) && (
                  <Alert variant="destructive" className="mt-6 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{localError || error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Alertas de éxito */}
                {success && (
                  <Alert className="mt-6 animate-in fade-in slide-in-from-top-1 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitResult}
                disabled={Boolean(
                  isLoading || 
                  !validateSetScore(set1.team1) || 
                  !validateSetScore(set1.team2) ||
                  !validateSetScore(set2.team1) || 
                  !validateSetScore(set2.team2) ||
                  !isSetValid(set1) || 
                  !isSetValid(set2) ||
                  (showSuperTiebreak && (!superTiebreak || !validateTiebreakScore(superTiebreak.team1) || !validateTiebreakScore(superTiebreak.team2)))
                )}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {isLoading ? "Guardando..." : "Guardar Resultado"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
