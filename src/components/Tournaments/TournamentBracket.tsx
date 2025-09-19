'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Space } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';

interface Match {
  id: string;
  round: number;
  position: number;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  winner?: { id: string; name: string };
}

interface TournamentBracketProps {
  matches: any[];
  format: 'single_elimination' | 'round_robin';
  tournamentId: string;
}

export function TournamentBracket({ matches, format, tournamentId }: TournamentBracketProps) {
  const t = useTranslations('emptyStates');
  const [matchesByRound, setMatchesByRound] = useState<{[key: number]: any[]}>({});

  useEffect(() => {
    if (matches && matches.length > 0) {
      // Solo agrupar si tenemos matches
      const grouped = matches.reduce((acc: any, match: any) => {
        if (!acc[match.round]) acc[match.round] = [];
        acc[match.round].push(match);
        return acc;
      }, {});
      
      setMatchesByRound(grouped);
    }
  }, [matches]);

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('noMatches')}
        </h2>
        <p className="text-gray-500">
          Aún no se han generado los partidos para este torneo.
        </p>
      </div>
    );
  }

  const renderSingleElimination = () => (
    <div className="tournament-bracket">
      {Object.entries(matchesByRound).map(([round, roundMatches]) => (
        <div key={round} className="round">
          <h3>Round {round}</h3>
          {roundMatches.map((match: Match) => (
            <Card key={match.id} className="match">
              <div className={`team ${match.winner?.id === match.team1.id ? 'winner' : ''}`}>
                {match.team1?.name || 'TBD'}
              </div>
              <div className={`team ${match.winner?.id === match.team2.id ? 'winner' : ''}`}>
                {match.team2?.name || 'TBD'}
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );

  const renderRoundRobin = () => (
    <div className="round-robin">
      {Object.entries(matchesByRound).map(([round, roundMatches]) => (
        <div key={round} className="round">
          <h3>Round {round}</h3>
          {roundMatches.map((match: Match) => (
            <Card key={match.id} className="match">
              <Space direction="vertical">
                <div>{match.team1?.name} vs {match.team2?.name}</div>
                {match.winner && (
                  <div className="winner">Winner: {match.winner.name}</div>
                )}
              </Space>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Bracket del Torneo</h2>
        
        <div className="min-h-[400px] bg-gray-50 rounded-lg p-4">
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Ronda {round}</h3>
              <div className="grid gap-4">
                {roundMatches.map((match: any) => (
                  <Card key={match.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <p className="font-medium">{match.team1?.name || 'TBD'}</p>
                        <p className="font-medium">{match.team2?.name || 'TBD'}</p>
                      </div>
                      {match.winner && (
                        <div className="text-green-600 font-medium">
                          Ganador: {match.winner.name}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TournamentBracket; 