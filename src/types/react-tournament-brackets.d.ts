declare module '@g-loot/react-tournament-brackets' {
  export interface Match {
    id: string;
    name: string;
    nextMatchId: string | null;
    tournamentRoundText?: string;
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

  export interface MatchComponentProps {
    match: Match;
    onMatchClick: (match: Match) => void;
    topParty: Match['participants'][0];
    bottomParty: Match['participants'][1];
    topWon: boolean;
    bottomWon: boolean;
    topText: string;
    bottomText: string;
  }

  export interface SingleEliminationBracketProps {
    matches: Match[];
    matchComponent?: React.ComponentType<MatchComponentProps>;
    onMatchClick?: (match: Match) => void;
    onMatchUpdate?: (matchId: string, result: any) => void;
    theme?: any;
    options?: any;
    svgWrapper?: React.ComponentType<any>;
  }

  export const SingleEliminationBracket: React.FC<SingleEliminationBracketProps>;
  export const DoubleEliminationBracket: React.FC<any>;
  export const Match: React.FC<MatchComponentProps>;
  export const SVGViewer: React.FC<any>;
  export const createTheme: (theme: any) => any;
  export const MATCH_STATES: {
    PLAYED: 'PLAYED';
    NO_SHOW: 'NO_SHOW';
    WALK_OVER: 'WALK_OVER';
    NO_PARTY: 'NO_PARTY';
    DONE: 'DONE';
    SCORE_DONE: 'SCORE_DONE';
  };
}
