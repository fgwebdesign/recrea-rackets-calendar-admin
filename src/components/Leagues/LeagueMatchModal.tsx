import { useState, useEffect } from 'react';
import { Trophy, Swords, AlertCircle, Info, CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  const isSuperTiebreakValid = (superTiebreak: { team1: number; team2: number }): boolean => {
    if (!superTiebreak || superTiebreak.team1 === 0 || superTiebreak.team2 === 0) return false;
    
    // El super tiebreak se juega hasta 10 puntos con diferencia de 2
    const team1 = superTiebreak.team1;
    const team2 = superTiebreak.team2;
    
    // Al menos uno debe llegar a 10
    if (team1 < 10 && team2 < 10) return false;
    
    // El ganador debe tener diferencia de al menos 2
    if (team1 > team2) {
      return team1 >= 10 && (team1 - team2 >= 2);
    } else if (team2 > team1) {
      return team2 >= 10 && (team2 - team1 >= 2);
    }
    
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
        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200 break-words min-w-0">
          <span className="break-words">{teamName}</span>
          {hasBothScores && isWinner && (
            <Trophy className="w-4 h-4 text-yellow-500 animate-in fade-in zoom-in flex-shrink-0" />
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
              "w-full h-14 text-2xl font-bold text-center rounded-xl transition-all duration-200",
              "bg-gray-50 dark:bg-gray-800/80 border-2 shadow-inner",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              hasBothScores && isWinner
                ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-200 dark:ring-emerald-800"
                : hasBothScores && isLeading
                ? "border-violet-300 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                : "border-gray-200 dark:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25 dark:focus:ring-violet-400/25 focus:bg-white dark:focus:bg-gray-800"
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

  const { date, time } = formatMatchDate(match.match_date);

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="bg-white dark:bg-gray-900 border-0 shadow-2xl max-w-[95vw] lg:max-w-4xl p-0 gap-0 w-full overflow-hidden rounded-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative p-6 pr-14 border-b border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 dark:from-violet-700 dark:via-purple-700 dark:to-fuchsia-700 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.25),transparent)]" aria-hidden />
            <DialogHeader className="relative">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg flex-shrink-0">
                      <Trophy className="w-7 h-7 text-amber-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-2xl font-bold text-white drop-shadow-sm">
                        {match.status === 'COMPLETED' ? 'Resultado del Partido' : 'Gestionar Partido'}
                      </DialogTitle>
                      <p className="text-white/90 font-medium text-base leading-relaxed mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white break-words">{match.team1}</span>
                        <span className="text-amber-200 font-bold flex-shrink-0">vs</span>
                        <span className="font-semibold text-white break-words">{match.team2}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {match.court_name && (
                      <Badge className="text-sm px-3 py-1.5 bg-white/20 text-white border border-white/30 backdrop-blur-sm shadow-sm font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                        {match.venue_name && match.court_name
                          ? `${match.venue_name} - ${match.court_name}`
                          : match.court_name}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-white/95 bg-white/15 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                      <Calendar className="w-4 h-4 text-amber-200" />
                      <span className="font-medium">{date}</span>
                      <span className="text-white/60">•</span>
                      <Clock className="w-4 h-4 text-amber-200" />
                      <span className="font-medium">{time}</span>
                    </div>
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
                  <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                      <div className="space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                          {/* Set 1 */}
                          <div className="group space-y-5 p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50/50 dark:from-violet-950/40 dark:to-fuchsia-950/30 border border-violet-200/80 dark:border-violet-800/50 shadow-sm hover:shadow-md transition-shadow duration-300 min-w-0">
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-violet-200 dark:border-violet-700/70">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-violet-500/10 dark:bg-violet-400/10">
                                  <Swords className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Set 1</h3>
                              </div>
                              {getSetWinner(set1) > 0 && (
                                <Badge className="bg-green-500 dark:bg-green-600 text-white shadow-sm animate-in fade-in slide-in-from-right-2 max-w-[280px]">
                                  <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="break-words line-clamp-2 text-xs leading-tight" title={getSetWinner(set1) === 1 ? match.team1 : match.team2}>
                                    {getSetWinner(set1) === 1 ? match.team1 : match.team2}
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-4">
                              {renderTeamScore(match.team1, true, set1, 1)}
                              <div className="flex items-center justify-center py-1">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-600 to-transparent" />
                                <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 rounded-full">Vs</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-600 to-transparent" />
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
                                  <div className="space-y-2 min-w-0">
                                    <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                      <span className="break-words block leading-tight" title={match.team1}>{match.team1}</span>
                                    </Label>
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
                                  <div className="space-y-2 min-w-0">
                                    <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                      <span className="break-words block leading-tight" title={match.team2}>{match.team2}</span>
                                    </Label>
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
                          <div className="group space-y-5 p-6 rounded-2xl bg-gradient-to-br from-fuchsia-50/50 to-violet-50 dark:from-fuchsia-950/30 dark:to-violet-950/40 border border-fuchsia-200/80 dark:border-fuchsia-800/50 shadow-sm hover:shadow-md transition-shadow duration-300 min-w-0">
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-fuchsia-200 dark:border-fuchsia-700/70">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-fuchsia-500/10 dark:bg-fuchsia-400/10">
                                  <Swords className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Set 2</h3>
                              </div>
                              {getSetWinner(set2) > 0 && (
                                <Badge className="bg-green-500 dark:bg-green-600 text-white shadow-sm animate-in fade-in slide-in-from-right-2 max-w-[280px]">
                                  <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="break-words line-clamp-2 text-xs leading-tight" title={getSetWinner(set2) === 1 ? match.team1 : match.team2}>
                                    {getSetWinner(set2) === 1 ? match.team1 : match.team2}
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-4">
                              {renderTeamScore(match.team1, true, set2, 2)}
                              <div className="flex items-center justify-center py-1">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-300 dark:via-fuchsia-600 to-transparent" />
                                <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/40 rounded-full">Vs</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-300 dark:via-fuchsia-600 to-transparent" />
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
                                  <div className="space-y-2 min-w-0">
                                    <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                      <span className="break-words block leading-tight" title={match.team1}>{match.team1}</span>
                                    </Label>
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
                                  <div className="space-y-2 min-w-0">
                                    <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                      <span className="break-words block leading-tight" title={match.team2}>{match.team2}</span>
                                    </Label>
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
                            <div className="space-y-5 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-300/80 dark:border-amber-700/50 shadow-sm hover:shadow-md transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-2 min-w-0">
                              <div className="flex items-center justify-between gap-2 pb-3 border-b border-amber-300 dark:border-amber-700/70">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-lg bg-amber-500/20 dark:bg-amber-400/20">
                                    <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                  </div>
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
                                <Badge className="bg-amber-500 dark:bg-amber-600 text-white font-medium shadow-sm">
                                  Decisivo
                                </Badge>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2 min-w-0">
                                  <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    <span className="break-words block leading-tight" title={match.team1}>{match.team1}</span>
                                  </Label>
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
                                      "h-14 text-2xl font-bold text-center rounded-xl bg-amber-50/50 dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/30",
                                      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    )}
                                  />
                                </div>
                                <div className="flex items-center justify-center py-1">
                                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 dark:via-amber-600 to-transparent" />
                                  <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-full">Vs</span>
                                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 dark:via-amber-600 to-transparent" />
                                </div>
                                <div className="space-y-2 min-w-0">
                                  <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    <span className="break-words block leading-tight" title={match.team2}>{match.team2}</span>
                                  </Label>
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
                                      "h-14 text-2xl font-bold text-center rounded-xl bg-amber-50/50 dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/30",
                                      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : <div />}
                        </div>

                      </div>
                  </div>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              {error && (
                <Alert variant="destructive" className="flex-1 w-full sm:max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-3 w-full sm:w-auto ml-auto">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="min-w-[100px] rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:border-gray-400 dark:hover:border-gray-500 transition-colors font-medium"
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
                    (showSet1Tiebreak && !isTiebreakValid(set1.tiebreak)) ||
                    (showSet2Tiebreak && !isTiebreakValid(set2.tiebreak)) ||
                    (showSuperTiebreak && (!superTiebreak || superTiebreak.team1 === 0 || superTiebreak.team2 === 0 || !isSuperTiebreakValid(superTiebreak)))
                  )}
                  className="min-w-[180px] rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 dark:from-violet-600 dark:to-fuchsia-600 dark:hover:from-violet-500 dark:hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Guardar Resultado
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
