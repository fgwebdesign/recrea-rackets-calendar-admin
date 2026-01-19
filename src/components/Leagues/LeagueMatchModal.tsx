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

interface SetScore {
  team1: number | null;
  team2: number | null;
  tiebreak: { team1: number | null; team2: number | null } | null;
}

interface MatchResult {
  team1_sets1_won: number;
  team2_sets1_won: number;
  team1_sets2_won: number;
  team2_sets2_won: number;
  team1_tie1_won: number;
  team2_tie1_won: number;
  team1_tie2_won: number;
  team2_tie2_won: number;
  team1_tie3_won: number;
  team2_tie3_won: number;
}

interface LeagueMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LeagueMatch;
  onSubmit: (matchId: string, result: MatchResult) => void;
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
    if (isOpen) {
      // Resetear estados cuando se abre el modal
      setSet1({ team1: null, team2: null, tiebreak: null });
      setSet2({ team1: null, team2: null, tiebreak: null });
      setSuperTiebreak(null);
      setError(null);
    }
  }, [isOpen, match.id]);

  const showSet1Tiebreak = (set1.team1 === 5 && set1.team2 === 5);
  
  const showSet2Tiebreak = (set2.team1 === 5 && set2.team2 === 5);

  const validateSetScore = (score: number | null): boolean => {
    if (score === null) return false;
    return score >= 0 && score <= 6; // Máximo 6 games en sets
  };

  const validateTiebreakScore = (score: number | null): boolean => {
    if (score === null) return false;
    return score >= 0;
  };

  const isTiebreakValid = (tiebreak: { team1: number | null; team2: number | null } | null): boolean => {
    if (!tiebreak || tiebreak.team1 === null || tiebreak.team2 === null) return false;
    
    // El tiebreak se juega hasta 7 puntos con diferencia de 2
    const team1 = tiebreak.team1;
    const team2 = tiebreak.team2;
    
    // Al menos uno debe llegar a 7
    if (team1 < 7 && team2 < 7) return false;
    
    // El ganador debe tener diferencia de al menos 2
    if (team1 > team2) {
      return team1 >= 7 && (team1 - team2 >= 2);
    } else if (team2 > team1) {
      return team2 >= 7 && (team2 - team1 >= 2);
    }
    
    return false;
  };

  const getSetWinner = (set: SetScore): number => {
    if (set.team1 === null || set.team1 === undefined || set.team2 === null || set.team2 === undefined) return 0;

    // Si hay tiebreak (empate 5-5), el ganador del tiebreak gana el set
    if (set.tiebreak && set.tiebreak.team1 !== null && set.tiebreak.team2 !== null) {
      if (!isTiebreakValid(set.tiebreak)) {
        return 0;
      }
      return set.tiebreak.team1 > set.tiebreak.team2 ? 1 : 2;
    }
    
    // Validación para sets normales (sin tiebreak)
    // Se gana con 6 games y diferencia de al menos 2
    if (set.team1 > set.team2 && set.team1 >= 6 && (set.team1 - set.team2 >= 2)) return 1; // 6-1, 6-2, 6-3, 6-4
    if (set.team2 > set.team1 && set.team2 >= 6 && (set.team2 - set.team1 >= 2)) return 2; // 6-1, 6-2, 6-3, 6-4
    
    return 0;
  };


  const showSuperTiebreak = getSetWinner(set1) && getSetWinner(set2) && getSetWinner(set1) !== getSetWinner(set2);



  const isSetValid = (set: SetScore): boolean => {
    if (set.team1 === null || set.team1 === undefined || set.team2 === null || set.team2 === undefined) return false;

    // Si hay tiebreak (empate 5-5), es válido si el tiebreak es válido
    if (set.tiebreak && set.tiebreak.team1 !== null && set.tiebreak.team2 !== null) {
      return isTiebreakValid(set.tiebreak);
    }
    
    // Validación para sets normales (sin tiebreak)
    // Se gana con 6 games y diferencia de al menos 2
    if (set.team1 > set.team2 && set.team1 >= 6 && (set.team1 - set.team2 >= 2)) return true; // 6-1, 6-2, 6-3, 6-4
    if (set.team2 > set.team1 && set.team2 >= 6 && (set.team2 - set.team1 >= 2)) return true; // 6-1, 6-2, 6-3, 6-4
    
    return false;
  };

  const handleSubmitResult = () => {
    setError(null);

    // Validar que los sets sean números válidos
    if (!validateSetScore(set1.team1) || !validateSetScore(set1.team2) ||
        !validateSetScore(set2.team1) || !validateSetScore(set2.team2)) {
      setError("Los sets deben ser números entre 0 y 6");
      return;
    }

    // Validar tiebreaks si existen
    if (set1.tiebreak && set1.tiebreak.team1 !== null && set1.tiebreak.team2 !== null) {
      if (!isTiebreakValid(set1.tiebreak)) {
        setError("El tiebreak del primer set debe ser válido (hasta 7 puntos con diferencia de 2)");
        return;
      }
    }
    if (set2.tiebreak && set2.tiebreak.team1 !== null && set2.tiebreak.team2 !== null) {
      if (!isTiebreakValid(set2.tiebreak)) {
        setError("El tiebreak del segundo set debe ser válido (hasta 7 puntos con diferencia de 2)");
        return;
      }
    }

    // Validar que haya un ganador en cada set
    if (!getSetWinner(set1)) {
      setError("El primer set debe tener un ganador claro (6-1, 6-2, 6-3, 6-4 o ganar el tiebreak en 5-5)");
      return;
    }
    if (!getSetWinner(set2)) {
      setError("El segundo set debe tener un ganador claro (6-1, 6-2, 6-3, 6-4 o ganar el tiebreak en 5-5)");
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



  const renderTeamScore = (teamName: string, isTeam1: boolean, set: SetScore, setNumber: number) => {
    const score = isTeam1 ? set.team1 : set.team2;
    const opponentScore = isTeam1 ? set.team2 : set.team1;
    const isWinner = getSetWinner(set) === (isTeam1 ? 1 : 2);
    const hasBothScores = set.team1 !== null && set.team2 !== null;
    const isLeading = hasBothScores && score !== null && opponentScore !== null && score > opponentScore;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
          {teamName}
          {hasBothScores && isWinner && (
            <Trophy className="w-4 h-4 text-yellow-500 animate-in fade-in zoom-in" />
          )}
        </Label>
        <div className="relative">
          <Input
            type="number"
            min="0"
            max="7"
            value={score ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                const value = null;
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
              } else {
                const numValue = parseInt(inputValue, 10);
                if (!isNaN(numValue)) {
                  const value = Math.min(7, Math.max(0, numValue));
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
                }
              }
            }}
            placeholder="0"
            disabled={isLoading}
            className={cn(
              "w-full h-14 text-2xl font-bold text-center bg-white dark:bg-gray-800 border-2 transition-all duration-200",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              hasBothScores && isWinner
                ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : hasBothScores && isLeading
                ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20"
            )}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 absolute right-3 top-1/2 -translate-y-1/2 cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ingresa un número entre 0 y 7</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
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
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {match.status === 'COMPLETED' ? 'Resultado del Partido' : 'Gestionar Partido'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1.5 font-medium">
                      {match.team1} <span className="text-purple-600 dark:text-purple-400 mx-2">vs</span> {match.team2}
                    </DialogDescription>
                  </div>
                </div>
                {match.court_name && (
                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                    {match.court_name}
                  </Badge>
                )}
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
                      <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-8">
                          {/* Set 1 */}
                          <div className="space-y-5 p-5 rounded-xl bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-100 dark:border-purple-800/50">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-200 dark:border-purple-700">
                              <div className="flex items-center gap-2">
                                <Swords className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Set 1</h3>
                              </div>
                              {getSetWinner(set1) > 0 && (
                                <Badge className="bg-green-500 dark:bg-green-600 text-white shadow-sm animate-in fade-in slide-in-from-right-2">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {getSetWinner(set1) === 1 ? match.team1.split(' - ')[0] : match.team2.split(' - ')[0]}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-4">
                              {renderTeamScore(match.team1, true, set1, 1)}
                              <div className="flex items-center justify-center py-2">
                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                                <span className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500">VS</span>
                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                              </div>
                              {renderTeamScore(match.team2, false, set1, 1)}
                            </div>
                            {showSet1Tiebreak && (
                              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  Tiebreak (5-5)
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>El tiebreak se juega hasta 7 puntos con diferencia de 2</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">{match.team1.split(' - ')[0]}</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={set1.tiebreak?.team1 ?? ''}
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        const value = inputValue === '' ? null : (isNaN(parseInt(inputValue, 10)) ? null : parseInt(inputValue, 10));
                                        setSet1(prev => ({
                                          ...prev,
                                          tiebreak: { 
                                            team1: value,
                                            team2: prev.tiebreak?.team2 ?? null
                                          }
                                        }));
                                      }}
                                      className={cn(
                                        "h-12 text-xl font-bold text-center bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">{match.team2.split(' - ')[0]}</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={set1.tiebreak?.team2 ?? ''}
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        const value = inputValue === '' ? null : (isNaN(parseInt(inputValue, 10)) ? null : parseInt(inputValue, 10));
                                        setSet1(prev => ({
                                          ...prev,
                                          tiebreak: { 
                                            team1: prev.tiebreak?.team1 ?? null,
                                            team2: value
                                          }
                                        }));
                                      }}
                                      className={cn(
                                        "h-12 text-xl font-bold text-center bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Set 2 */}
                          <div className="space-y-5 p-5 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100 dark:border-blue-800/50">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-blue-200 dark:border-blue-700">
                              <div className="flex items-center gap-2">
                                <Swords className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Set 2</h3>
                              </div>
                              {getSetWinner(set2) > 0 && (
                                <Badge className="bg-green-500 dark:bg-green-600 text-white shadow-sm animate-in fade-in slide-in-from-right-2">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {getSetWinner(set2) === 1 ? match.team1.split(' - ')[0] : match.team2.split(' - ')[0]}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-4">
                              {renderTeamScore(match.team1, true, set2, 2)}
                              <div className="flex items-center justify-center py-2">
                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                                <span className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500">VS</span>
                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                              </div>
                              {renderTeamScore(match.team2, false, set2, 2)}
                            </div>
                            {showSet2Tiebreak && (
                              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  Tiebreak (5-5)
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>El tiebreak se juega hasta 7 puntos con diferencia de 2</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">{match.team1.split(' - ')[0]}</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={set2.tiebreak?.team1 ?? ''}
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        const value = inputValue === '' ? null : (isNaN(parseInt(inputValue, 10)) ? null : parseInt(inputValue, 10));
                                        setSet2(prev => ({
                                          ...prev,
                                          tiebreak: { 
                                            team1: value,
                                            team2: prev.tiebreak?.team2 ?? null
                                          }
                                        }));
                                      }}
                                      className={cn(
                                        "h-12 text-xl font-bold text-center bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400",
                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">{match.team2.split(' - ')[0]}</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={set2.tiebreak?.team2 ?? ''}
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        const value = inputValue === '' ? null : (isNaN(parseInt(inputValue, 10)) ? null : parseInt(inputValue, 10));
                                        setSet2(prev => ({
                                          ...prev,
                                          tiebreak: { 
                                            team1: prev.tiebreak?.team1 ?? null,
                                            team2: value
                                          }
                                        }));
                                      }}
                                      className={cn(
                                        "h-12 text-xl font-bold text-center bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400",
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
                            <div className="space-y-5 p-5 rounded-xl bg-gradient-to-br from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 animate-in fade-in slide-in-from-bottom-2">
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-yellow-300 dark:border-yellow-700">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    Super Tiebreak
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>El super tiebreak se juega cuando cada equipo ha ganado un set</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </h3>
                                </div>
                                <Badge className="bg-yellow-500 dark:bg-yellow-600 text-white">
                                  Decisivo
                                </Badge>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">{match.team1.split(' - ')[0]}</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={superTiebreak?.team1 ?? ''}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      const value = inputValue === '' ? 0 : (isNaN(parseInt(inputValue, 10)) ? 0 : parseInt(inputValue, 10));
                                      setSuperTiebreak(prev => ({
                                        team1: value,
                                        team2: prev?.team2 ?? 0
                                      }));
                                    }}
                                    className={cn(
                                      "h-14 text-2xl font-bold text-center bg-white dark:bg-gray-800 border-2 border-yellow-300 dark:border-yellow-700 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400",
                                      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    )}
                                  />
                                </div>
                                <div className="flex items-center justify-center py-2">
                                  <div className="h-px w-full bg-yellow-200 dark:bg-yellow-800"></div>
                                  <span className="px-3 text-xs font-semibold text-yellow-600 dark:text-yellow-400">VS</span>
                                  <div className="h-px w-full bg-yellow-200 dark:bg-yellow-800"></div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">{match.team2.split(' - ')[0]}</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={superTiebreak?.team2 ?? ''}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      const value = inputValue === '' ? 0 : (isNaN(parseInt(inputValue, 10)) ? 0 : parseInt(inputValue, 10));
                                      setSuperTiebreak(prev => ({
                                        team1: prev?.team1 ?? 0,
                                        team2: value
                                      }));
                                    }}
                                    className={cn(
                                      "h-14 text-2xl font-bold text-center bg-white dark:bg-gray-800 border-2 border-yellow-300 dark:border-yellow-700 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400",
                                      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    )}
                                  />
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
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[100px]"
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
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[150px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Guardar Resultado
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
