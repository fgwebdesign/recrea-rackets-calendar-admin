'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Match as MatchType } from '@/types/tournament';
import { HookTournamentTeam } from '@/types/hooks';

// Helper to get team display name
const getTeamDisplay = (teamIdToFind: string | null, allHookTeams: HookTournamentTeam[]): string => {
  if (!teamIdToFind) return 'Equipo no definido';
  const hookTeamEntry = allHookTeams.find(entry => entry.team_id === teamIdToFind || entry.teams?.id === teamIdToFind);
  if (hookTeamEntry && hookTeamEntry.teams) {
    const teamDetails = hookTeamEntry.teams;
    const p1Name = teamDetails.player1?.name || 'Jugador 1';
    const p2Name = teamDetails.player2?.name || 'Jugador 2';
    return teamDetails.name || `${p1Name} / ${p2Name}`;
  }
  return `Equipo ID: ${teamIdToFind.substring(0, 6)}`;
};

interface SetScore {
  home: string;
  away: string;
}

export interface ScoreInput { 
  score: string; 
}

interface SetMatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (matchId: string, scoreData: ScoreInput) => void;
  match: MatchType | null;
  teams: HookTournamentTeam[];
}

const initialSetScore = (): SetScore => ({ home: '', away: '' });

// Parses "6-4,3-6,10-8" into [[{home:6,away:4},{home:3,away:6}], {home:10,away:8}]
const parseScoreString = (scoreStr: string | null | undefined): { gameSets: [SetScore, SetScore], superTiebreak: SetScore } => {
  let gameSets: [SetScore, SetScore] = [initialSetScore(), initialSetScore()];
  let superTiebreak: SetScore = initialSetScore();

  if (scoreStr) {
    const parts = scoreStr.split(',').map(s => s.trim());
    parts.forEach((part, index) => {
      const scores = part.split('-').map(s => s.trim());
      if (scores.length === 2) {
        if (index < 2) { // Sets 1 and 2
          gameSets[index] = { home: scores[0], away: scores[1] };
        } else if (index === 2) { // Set 3 (Super Tiebreak)
          superTiebreak = { home: scores[0], away: scores[1] };
        }
      }
    });
  }
  return { gameSets, superTiebreak };
};

const formatScoresToString = (gameSets: [SetScore, SetScore], superTiebreak: SetScore, firstTwoSetsSplit: boolean): string => {
  const resultParts: string[] = [];
  for (let i = 0; i < gameSets.length; i++) {
    const set = gameSets[i];
    if (set.home !== '' && set.away !== '') {
      resultParts.push(`${set.home}-${set.away}`);
    } else {
      // If a set is partially filled, decide if it should break or be omitted.
      // For now, if one part is empty, the set string isn't added.
      if (set.home !== '' || set.away !== '') { /* console.warn(`Set ${i+1} is incomplete`); */ }
    }
  }
  if (firstTwoSetsSplit && superTiebreak.home !== '' && superTiebreak.away !== '') {
    resultParts.push(`${superTiebreak.home}-${superTiebreak.away}`);
  }
  return resultParts.join(',');
};

// Helper to determine set winner based on games (for sets 1 & 2)
const getGameSetWinner = (set: SetScore): 'home' | 'away' | null => {
  const homeGames = parseInt(set.home);
  const awayGames = parseInt(set.away);
  if (isNaN(homeGames) || isNaN(awayGames)) return null;

  if ((homeGames === 6 && awayGames <= 4) || homeGames === 7 && (awayGames === 5 || awayGames === 6)) return 'home';
  if ((awayGames === 6 && homeGames <= 4) || awayGames === 7 && (homeGames === 5 || homeGames === 6)) return 'away';
  return null;
};

export function SetMatchResultModal({
  isOpen,
  onClose,
  onSave,
  match,
  teams,
}: SetMatchResultModalProps) {
  const [gameSets, setGameSets] = useState<[SetScore, SetScore]>([initialSetScore(), initialSetScore()]);
  const [superTiebreak, setSuperTiebreak] = useState<SetScore>(initialSetScore());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      const { gameSets: parsedGameSets, superTiebreak: parsedSuperTiebreak } = parseScoreString(match.score);
      setGameSets(parsedGameSets);
      setSuperTiebreak(parsedSuperTiebreak);
    } else {
      setGameSets([initialSetScore(), initialSetScore()]);
      setSuperTiebreak(initialSetScore());
    }
    setValidationError(null); // Clear error when match changes
  }, [match]);

  if (!match) return null;

  const homeTeamName = getTeamDisplay(match.home_team_id, teams);
  const awayTeamName = getTeamDisplay(match.away_team_id, teams);

  const handleGameSetChange = (setIndex: 0 | 1, team: 'home' | 'away', value: string) => {
    const updatedGameSets = [...gameSets] as [SetScore, SetScore];
    if (/^\d*$/.test(value)) { // Allow only digits or empty string
      updatedGameSets[setIndex] = { ...updatedGameSets[setIndex], [team]: value };
      setGameSets(updatedGameSets);
    }
  };

  const handleSuperTiebreakChange = (team: 'home' | 'away', value: string) => {
    if (/^\d*$/.test(value)) {
      setSuperTiebreak(prev => ({ ...prev, [team]: value }));
    }
  };
  
  const set1Winner = getGameSetWinner(gameSets[0]);
  const set2Winner = getGameSetWinner(gameSets[1]);
  const firstTwoSetsSplit = set1Winner !== null && set2Winner !== null && set1Winner !== set2Winner;
  const matchOverBeforeThirdSet = (set1Winner && set1Winner === set2Winner);

  const validateScores = (): boolean => {
    setValidationError(null);
    // Validate Set 1
    const s1h = parseInt(gameSets[0].home); const s1a = parseInt(gameSets[0].away);
    if (isNaN(s1h) || isNaN(s1a) || s1h < 0 || s1a < 0) { setValidationError("Puntuación inválida en Set 1."); return false; }
    if (!((s1h === 6 && s1a <= 4) || (s1a === 6 && s1h <= 4) || (s1h === 7 && (s1a === 5 || s1a === 6)) || (s1a === 7 && (s1h === 5 || s1h === 6)))) {
      setValidationError("Resultado inválido para Set 1 (ej: 6-4, 7-5, 7-6)."); return false;
    }

    // Validate Set 2
    const s2h = parseInt(gameSets[1].home); const s2a = parseInt(gameSets[1].away);
    if (isNaN(s2h) || isNaN(s2a) || s2h < 0 || s2a < 0) { setValidationError("Puntuación inválida en Set 2."); return false; }
    if (!((s2h === 6 && s2a <= 4) || (s2a === 6 && s2h <= 4) || (s2h === 7 && (s2a === 5 || s2a === 6)) || (s2a === 7 && (s2h === 5 || s2h === 6)))) {
       setValidationError("Resultado inválido para Set 2 (ej: 6-4, 7-5, 7-6)."); return false;
    }

    if (matchOverBeforeThirdSet && (superTiebreak.home !== '' || superTiebreak.away !== '')) {
        setValidationError("El partido terminó en 2 sets. No ingrese resultado para el 3er set."); return false;
    }
    
    if (firstTwoSetsSplit) {
      const stbh = parseInt(superTiebreak.home); const stba = parseInt(superTiebreak.away);
      if (isNaN(stbh) || isNaN(stba) || stbh < 0 || stba < 0) { setValidationError("Puntuación inválida en Super Tie-break."); return false; }
      if (!((stbh >= 10 && stbh - stba >= 2) || (stba >= 10 && stba - stbh >= 2))) {
        setValidationError("Super Tie-break: se gana con 10+ puntos y diferencia de 2 (ej: 10-8, 11-9)."); return false;
      }
       if (stbh < 10 && stba < 10) { // Neither reached 10
        setValidationError("Super Tie-break: al menos un jugador debe alcanzar 10 puntos."); return false;
      }
    } else if (!matchOverBeforeThirdSet && (superTiebreak.home !== '' || superTiebreak.away !== '')) {
        // If sets are not split and match is not over, STB shouldn't be filled
        setValidationError("No se requiere Super Tie-break si los primeros dos sets no están divididos (1-1)."); return false;
    }
    
    return true;
  };

  const handleSave = () => {
    if (!validateScores()) {
      return;
    }
    if (match) {
      const formattedScore = formatScoresToString(gameSets, superTiebreak, firstTwoSetsSplit);
      onSave(match.id, { score: formattedScore });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg"> 
        <DialogHeader>
          <DialogTitle>Setear Resultado del Partido</DialogTitle>
          <DialogDescription className="text-sm">
            <span className="font-semibold">{homeTeamName}</span>
            <span className="text-xs text-gray-500 mx-2">vs</span> 
            <span className="font-semibold">{awayTeamName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {[0, 1].map((setIndex) => (
            <div key={`game-set-${setIndex}`} className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Set {setIndex + 1}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0" max="7" // Max 7 for regular games
                  value={gameSets[setIndex].home}
                  onChange={(e) => handleGameSetChange(setIndex as 0 | 1, 'home', e.target.value)}
                  className="w-full text-center"
                  aria-label={`${homeTeamName} score for set ${setIndex + 1}`}
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  min="0" max="7"
                  value={gameSets[setIndex].away}
                  onChange={(e) => handleGameSetChange(setIndex as 0 | 1, 'away', e.target.value)}
                  className="w-full text-center"
                  aria-label={`${awayTeamName} score for set ${setIndex + 1}`}
                />
              </div>
            </div>
          ))}

          {firstTwoSetsSplit && (
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Set 3 (Super Tie-break)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  value={superTiebreak.home}
                  onChange={(e) => handleSuperTiebreakChange('home', e.target.value)}
                  className="w-full text-center"
                  aria-label={`${homeTeamName} score for super tie-break`}
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  min="0"
                  value={superTiebreak.away}
                  onChange={(e) => handleSuperTiebreakChange('away', e.target.value)}
                  className="w-full text-center"
                  aria-label={`${awayTeamName} score for super tie-break`}
                />
              </div>
            </div>
          )}
        </div>
        
        {validationError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center py-2">{validationError}</p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Guardar Resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 