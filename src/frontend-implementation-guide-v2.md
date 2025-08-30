# 🎯 Guía de Implementación Frontend v2.0 - Pendientes

## 📋 Índice
1. [Resultados y Standings](#resultados-y-standings)
2. [Fase Eliminatoria](#fase-eliminatoria)
3. [Componentes Compartidos](#componentes-compartidos)

## 📊 Resultados y Standings

### `MatchResult`
```tsx
interface MatchResultProps {
  match: Match;
  onSave: (result: MatchResult) => void;
}

const MatchResult: React.FC<MatchResultProps> = ({ match, onSave }) => {
  const [set1Home, setSet1Home] = useState(match.team1_sets1_won || 0);
  const [set1Away, setSet1Away] = useState(match.team2_sets1_won || 0);
  const [set2Home, setSet2Home] = useState(match.team1_sets2_won || 0);
  const [set2Away, setSet2Away] = useState(match.team2_sets2_won || 0);
  const [tiebreak1Home, setTiebreak1Home] = useState(match.team1_tie1_won || 0);
  const [tiebreak1Away, setTiebreak1Away] = useState(match.team2_tie1_won || 0);
  const [supertiebreakHome, setSupertiebreakHome] = useState(match.team1_tie3_won || 0);
  const [supertiebreakAway, setSupertiebreakAway] = useState(match.team2_tie3_won || 0);

  return (
    <Form onSubmit={handleSubmit}>
      <SetInput 
        label="Set 1" 
        homeScore={set1Home} 
        awayScore={set1Away}
        onHomeChange={setSet1Home}
        onAwayChange={setSet1Away}
      />
      
      {set1Home === 6 && set1Away === 6 && (
        <TiebreakInput
          label="Tie-break Set 1"
          homeScore={tiebreak1Home}
          awayScore={tiebreak1Away}
          onHomeChange={setTiebreak1Home}
          onAwayChange={setTiebreak1Away}
        />
      )}
      
      <SetInput 
        label="Set 2"
        homeScore={set2Home}
        awayScore={set2Away}
        onHomeChange={setSet2Home}
        onAwayChange={setSet2Away}
      />
      
      {set2Home === 6 && set2Away === 6 && (
        <TiebreakInput
          label="Tie-break Set 2"
          homeScore={tiebreak1Home}
          awayScore={tiebreak1Away}
          onHomeChange={setTiebreak1Home}
          onAwayChange={setTiebreak1Away}
        />
      )}
      
      {needsSupertiebreak() && (
        <TiebreakInput
          label="Super Tie-break"
          homeScore={supertiebreakHome}
          awayScore={supertiebreakAway}
          onHomeChange={setSupertiebreakHome}
          onAwayChange={setSupertiebreakAway}
          maxScore={11}
        />
      )}
      
      <Button type="submit">Guardar Resultado</Button>
    </Form>
  );
};
```

### `StandingsTable`
```tsx
interface StandingRow {
  position: number;
  team_id: string;
  team_info: {
    player1: string;
    player2: string;
  };
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  sets_difference: number;
  games_won: number;
  games_lost: number;
  games_difference: number;
  points: number;
}

interface StandingsTableProps {
  groupNumber: number;
  standings: StandingRow[];
  highlightQualified?: boolean;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ groupNumber, standings, highlightQualified }) => {
  return (
    <Table>
      <TableHeader>
        <Th>Pos</Th>
        <Th>Equipo</Th>
        <Th>PJ</Th>
        <Th>PG</Th>
        <Th>PP</Th>
        <Th>Sets</Th>
        <Th>Games</Th>
        <Th>Pts</Th>
      </TableHeader>
      
      <TableBody>
        {standings.map(row => (
          <Tr key={row.team_id} className={getRowClassName(row, highlightQualified)}>
            <Td>{row.position}</Td>
            <Td>{row.team_info.player1} / {row.team_info.player2}</Td>
            <Td>{row.matches_played}</Td>
            <Td>{row.matches_won}</Td>
            <Td>{row.matches_lost}</Td>
            <Td>{row.sets_won}-{row.sets_lost} ({row.sets_difference})</Td>
            <Td>{row.games_won}-{row.games_lost} ({row.games_difference})</Td>
            <Td>{row.points}</Td>
          </Tr>
        ))}
      </TableBody>
    </Table>
  );
};
```

## 🏆 Fase Eliminatoria

### `EliminationBracket`
```tsx
interface BracketMatch {
  match_id: string;
  round: string;
  match_number: number;
  team1: TeamInfo | null;
  team2: TeamInfo | null;
  winner: string | null;
  status: string;
  depends_on?: string[];
}

interface BracketStructure {
  quarterfinals?: BracketMatch[];
  semifinals: BracketMatch[];
  final: BracketMatch[];
}

interface EliminationBracketProps {
  structure: BracketStructure;
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

const EliminationBracket: React.FC<EliminationBracketProps> = ({ structure, matches, onMatchClick }) => {
  return (
    <div className="bracket-container">
      {structure.quarterfinals && (
        <BracketRound
          title="Cuartos de Final"
          matches={structure.quarterfinals}
          scheduledMatches={matches.filter(m => m.elimination_round === 'quarterfinals')}
          onMatchClick={onMatchClick}
        />
      )}
      
      <BracketRound
        title="Semifinales"
        matches={structure.semifinals}
        scheduledMatches={matches.filter(m => m.elimination_round === 'semifinals')}
        onMatchClick={onMatchClick}
      />
      
      <BracketRound
        title="Final"
        matches={structure.final}
        scheduledMatches={matches.filter(m => m.elimination_round === 'final')}
        onMatchClick={onMatchClick}
      />
    </div>
  );
};
```

### `BracketMatch`
```tsx
interface BracketMatchProps {
  match: BracketMatch;
  scheduledMatch?: Match;
  onClick?: () => void;
}

const BracketMatch: React.FC<BracketMatchProps> = ({ match, scheduledMatch, onClick }) => {
  return (
    <div className="bracket-match" onClick={onClick}>
      <div className="teams">
        <TeamSlot
          team={match.team1}
          isWinner={scheduledMatch?.winner_team_id === match.team1?.id}
        />
        <TeamSlot
          team={match.team2}
          isWinner={scheduledMatch?.winner_team_id === match.team2?.id}
        />
      </div>
      
      {scheduledMatch && (
        <div className="match-info">
          <Text>{format(scheduledMatch.match_day, 'dd/MM')}</Text>
          <Text>{scheduledMatch.start_time}</Text>
          <Text>Cancha {scheduledMatch.court_id}</Text>
        </div>
      )}
      
      {match.depends_on && match.depends_on.length > 0 && (
        <div className="dependencies">
          Ganadores de: {match.depends_on.join(', ')}
        </div>
      )}
    </div>
  );
};
```

## 🔄 Componentes Compartidos

### `TeamDisplay`
```tsx
interface TeamDisplayProps {
  team: TeamInfo;
  isWinner?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ team, isWinner, size = 'md' }) => {
  return (
    <div className={`team-display ${size} ${isWinner ? 'winner' : ''}`}>
      <div className="players">
        <Text>{team.player1.first_name} {team.player1.last_name}</Text>
        <Text>{team.player2.first_name} {team.player2.last_name}</Text>
      </div>
      {isWinner && <Icon name="trophy" />}
    </div>
  );
};
```

### `SetInput` y `TiebreakInput`
```tsx
interface ScoreInputProps {
  label: string;
  homeScore: number;
  awayScore: number;
  onHomeChange: (value: number) => void;
  onAwayChange: (value: number) => void;
  maxScore?: number;
}

const SetInput: React.FC<ScoreInputProps> = (props) => {
  return (
    <div className="score-input">
      <Label>{props.label}</Label>
      <NumberInput
        value={props.homeScore}
        onChange={props.onHomeChange}
        max={6}
      />
      <Text>-</Text>
      <NumberInput
        value={props.awayScore}
        onChange={props.onAwayChange}
        max={6}
      />
    </div>
  );
};

const TiebreakInput: React.FC<ScoreInputProps> = (props) => {
  return (
    <div className="score-input tiebreak">
      <Label>{props.label}</Label>
      <NumberInput
        value={props.homeScore}
        onChange={props.onHomeChange}
        max={props.maxScore || 7}
      />
      <Text>-</Text>
      <NumberInput
        value={props.awayScore}
        onChange={props.onAwayChange}
        max={props.maxScore || 7}
      />
    </div>
  );
};
```

## 🎨 Estilos Sugeridos

```scss
// Bracket
.bracket-container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  overflow-x: auto;
}

.bracket-round {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 300px;
}

.bracket-match {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
  &:hover {
    border-color: #4299e1;
  }
  
  &.winner {
    border-color: #48bb78;
  }
}

// Match Card
.match-card {
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .match-header {
    padding: 1rem;
    background: #f7fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .match-body {
    padding: 1.5rem;
  }
}

// Standings Table
.standings-table {
  th {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }
  
  .qualified {
    background: #f0fff4;
  }
  
  .best-second {
    background: #fffff0;
  }
}
```

## 🚀 Próximos Pasos

1. Implementar la vista de partidos y resultados
2. Crear el componente de bracket eliminatorio
3. Integrar el sistema de standings
4. Agregar animaciones y transiciones
5. Implementar modo oscuro
6. Agregar tests unitarios y de integración

## 📝 Notas Importantes

1. Usar TypeScript para mejor mantenibilidad
2. Implementar manejo de errores robusto
3. Agregar loading states y skeletons
4. Optimizar renders con useMemo y useCallback
5. Implementar virtualization para listas largas
6. Usar React Query para caching y manejo de estado