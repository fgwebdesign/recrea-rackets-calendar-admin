import { useState, useEffect } from 'react';
import { Trophy, Swords, AlertCircle, X, Info, CheckCircle2 } from 'lucide-react';
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
import { LeagueMatch } from '@/types/league';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatUruguayDateTime } from "@/lib/utils";

// Añadir estilos para el marcador digital
const digitalScoreStyle = "font-['DS-Digital'] text-5xl font-bold tracking-wider";

interface SetScore {
  team1: number | null;
  team2: number | null;
  tiebreak: { team1: number | null; team2: number | null } | null;
}

interface LeagueMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LeagueMatch;
  onSubmit: (matchId: string, result: any) => void;
  isLoading?: boolean;
}

function formatMatchDate(dateStr: string) {
  return formatUruguayDateTime(dateStr);
}

export function LeagueMatchModal({
  isOpen,
  onClose,
  match,
  onSubmit,

  isLoading = false,
}: LeagueMatchModalProps) {
  const [set1, setSet1] = useState<SetScore>({ team1: null, team2: null, tiebreak: null });
  const [set2, setSet2] = useState<SetScore>({ team1: null, team2: null, tiebreak: null });
  const [superTiebreak, setSuperTiebreak] = useState<{ team1: number; team2: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, []);

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
    if (set.team1 === null || set.team1 === undefined || set.team2 === null || set.team2 === undefined) return 0;

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

  const getMatchWinner = (): { winner: string | null; setsWon: { team1: number, team2: number } } => {
    const set1Winner = getSetWinner(set1);
    const set2Winner = getSetWinner(set2);
    
    const setsWon = {
      team1: (set1Winner === 1 ? 1 : 0) + (set2Winner === 1 ? 1 : 0),
      team2: (set1Winner === 2 ? 1 : 0) + (set2Winner === 2 ? 1 : 0)
    };

    // If super tiebreak is played and has valid scores
    if (superTiebreak && superTiebreak.team1 !== null && superTiebreak.team2 !== null) {
      if (superTiebreak.team1 > superTiebreak.team2) {
        return { winner: match.team1, setsWon };
      } else if (superTiebreak.team2 > superTiebreak.team1) {
        return { winner: match.team2, setsWon };
      }
      return { winner: null, setsWon };
    }

    // If no super tiebreak, check sets won
    if (setsWon.team1 > setsWon.team2) {
      return { winner: match.team1, setsWon };
    } else if (setsWon.team2 > setsWon.team1) {
      return { winner: match.team2, setsWon };
    }

    return { winner: null, setsWon };
  };

  const showSuperTiebreak = getSetWinner(set1) && getSetWinner(set2) && getSetWinner(set1) !== getSetWinner(set2);



  const isSetValid = (set: SetScore): boolean => {
    if (set.team1 === null || set.team1 === undefined || set.team2 === null || set.team2 === undefined) return false;

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
    setError(null);

    // Validar que los sets sean números válidos
    if (!validateSetScore(set1.team1) || !validateSetScore(set1.team2) ||
        !validateSetScore(set2.team1) || !validateSetScore(set2.team2)) {
      setError("Los sets deben ser números entre 0 y 7");
      return;
    }

    // Validar que haya un ganador en cada set
    if (!getSetWinner(set1)) {
      setError("El primer set debe tener un ganador claro (diferencia de 2 juegos o ganar el tiebreak)");
      return;
    }
    if (!getSetWinner(set2)) {
      setError("El segundo set debe tener un ganador claro (diferencia de 2 juegos o ganar el tiebreak)");
      return;
    }

    // Validar super tiebreak si es necesario
    if (showSuperTiebreak) {
      if (!superTiebreak || !validateTiebreakScore(superTiebreak.team1) || !validateTiebreakScore(superTiebreak.team2)) {
        setError("El super tiebreak debe tener valores válidos");
        return;
      }
      if (superTiebreak.team1 === superTiebreak.team2) {
        setError("El super tiebreak debe tener un ganador");
        return;
      }
    }

    const result = {
      team1_sets1_won: set1.team1 || 0,
      team2_sets1_won: set1.team2 || 0,
      team1_sets2_won: set2.team1 || 0,
      team2_sets2_won: set2.team2 || 0,
      team1_tie1_won: set1.tiebreak?.team1 || 0,
      team2_tie1_won: set1.tiebreak?.team2 || 0,
      team1_tie2_won: set2.tiebreak?.team1 || 0,
      team2_tie2_won: set2.tiebreak?.team2 || 0,
      team1_tie3_won: superTiebreak?.team1 || 0,
      team2_tie3_won: superTiebreak?.team2 || 0
    };

    onSubmit(match.id, result);
  };



  const renderTeamScore = (teamName: string, isTeam1: boolean, set: SetScore, setNumber: number) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
        {teamName}
        {set.team1 !== null && set.team2 !== null && (
          isTeam1 ? 
            (getSetWinner(set) === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : null) :
            (getSetWinner(set) === 2 ? <Trophy className="w-4 h-4 text-yellow-500" /> : null)
        )}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min="0"
          max="7"
          value={isTeam1 ? set.team1 ?? '' : set.team2 ?? ''}
          onChange={(e) => {
            const value = e.target.value === '' ? null : Math.min(7, parseInt(e.target.value));
            if (setNumber === 1) {
              setSet1(prev => ({
                ...prev,
                [isTeam1 ? 'team1' : 'team2']: value
              }));
            } else {
              setSet2(prev => ({
                ...prev,
                [isTeam1 ? 'team1' : 'team2']: value
              }));
            }
          }}
          placeholder="0"
          disabled={isLoading}
          className={cn(
            "w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Ingresa un número entre 0 y 7</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

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
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">{match.team1}</h3>
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
                    {formatMatchDate(match.match_date).date} {formatMatchDate(match.match_date).time}
                  </Badge>
                </div>
              </div>

              {/* Team 2 */}
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">{match.team2}</h3>
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
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-5xl p-0 gap-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <div className="flex items-center">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-purple-500" />
                  <div>
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {match.status === 'COMPLETED' ? 'Resultado del Partido' : 'Gestionar Partido'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 mt-1">
                      {match.team1} vs {match.team2}
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1">
          
            {match.status === 'COMPLETED' ? (
              renderCompletedMatchView()
            ) : (
              <div className="flex flex-col h-full">
                  {/* Content */}
                  <div className="flex-1 p-8">
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                          {/* Set 1 */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Swords className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                              <h3 className="font-semibold text-gray-900 dark:text-white">Set 1</h3>
                              {getSetWinner(set1) > 0 && (
                                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ml-auto">
                                  Ganador: {getSetWinner(set1) === 1 ? match.team1 : match.team2}
                                </Badge>
                              )}
                            </div>
                            {renderTeamScore(match.team1, true, set1, 1)}
                            {renderTeamScore(match.team2, false, set1, 1)}
                            {showSet1Tiebreak && (
                              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                                  Tiebreak
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-gray-400" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>El tiebreak se juega cuando el set está 6-6</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">{match.team1}</Label>
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
                                      className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">{match.team2}</Label>
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
                                      className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Set 2 */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Swords className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                              <h3 className="font-semibold text-gray-900 dark:text-white">Set 2</h3>
                              {getSetWinner(set2) > 0 && (
                                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ml-auto">
                                  Ganador: {getSetWinner(set2) === 1 ? match.team1 : match.team2}
                                </Badge>
                              )}
                            </div>
                            {renderTeamScore(match.team1, true, set2, 2)}
                            {renderTeamScore(match.team2, false, set2, 2)}
                            {showSet2Tiebreak && (
                              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                                  Tiebreak
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-gray-400" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>El tiebreak se juega cuando el set está 6-6</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">{match.team1}</Label>
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
                                      className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">{match.team2}</Label>
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
                                      className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Super Tiebreak */}
                          {showSuperTiebreak ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
                              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">{match.team1}</Label>
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
                                      className={cn(
                                        "bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-800 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm text-gray-600 dark:text-gray-300">{match.team2}</Label>
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
                                      className={cn(
                                        "bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-800 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : <div />}
                        </div>

                        {error && (
                          <Alert variant="destructive" className="mt-4 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                  </div>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
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
