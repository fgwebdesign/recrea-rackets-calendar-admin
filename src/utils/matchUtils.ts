interface SetScore {
    team1: number;
    team2: number;
  }
  
  interface TiebreakScore {
    team1: number;
    team2: number;
  }
  
  export const isValidSetScore = (set: SetScore) => {
    if (set.team1 > 7 || set.team2 > 7) return false;
    if (set.team1 === 7 && set.team2 >= 6) return false;
    if (set.team2 === 7 && set.team1 >= 6) return false;
    if (set.team1 === 6 && set.team2 === 6) return true;
    if (set.team1 === 6 && set.team2 <= 4) return true;  // ✅ Permite 6-0, 6-1, 6-2, 6-3, 6-4
    if (set.team2 === 6 && set.team1 <= 4) return true;  // ✅ Permite 0-6, 1-6, 2-6, 3-6, 4-6
    if (set.team1 === 7 && set.team2 === 5) return true;
    if (set.team2 === 7 && set.team1 === 5) return true;
    return false;
  };
  
  export const needsSetTiebreak = (set: SetScore) => {
    return set.team1 === 6 && set.team2 === 6;
  };
  
  export const isSetComplete = (set: SetScore, tiebreak: TiebreakScore | null) => {
    if (set.team1 === 6 && set.team2 === 6) {
      return tiebreak && tiebreak.team1 !== tiebreak.team2;
    }
    return (
      (set.team1 === 7) ||
      (set.team2 === 7) ||
      (set.team1 === 6 && set.team2 <= 4) ||
      (set.team2 === 6 && set.team1 <= 4)
    );
  };
  
  export const getSetWinner = (set: SetScore, tiebreak: TiebreakScore | null) => {
    if (!isSetComplete(set, tiebreak)) return 0;
    
    if (needsSetTiebreak(set)) {
      return tiebreak ? (tiebreak.team1 > tiebreak.team2 ? 1 : 2) : 0;
    }
    return set.team1 > set.team2 ? 1 : 2;
  };