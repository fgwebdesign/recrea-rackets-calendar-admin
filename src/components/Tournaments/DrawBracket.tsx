'use client';

import ReactFlow, { 
  Background, 
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface Match {
  id: string;
  round: number; // 1: cuartos, 2: semifinal, 3: final
  position: number;
  team1?: any;
  team2?: any;
  winner?: any;
  nextMatchId?: string;
  score?: string;
}

export default function DrawBracket({ matches, onUpdateMatch }: { 
  matches: Match[];
  onUpdateMatch: (match: Match) => void;
}) {
  // Función para crear un nodo de partido
  const createMatchNode = (match: Match, x: number, y: number): Node => ({
    id: match.id,
    position: { x, y },
    type: 'default',
    data: {
      label: (
        <div 
          className={`
            border bg-white rounded-lg shadow-sm w-[280px] transition-all
            ${match.team1 && match.team2 && !match.winner 
              ? 'cursor-pointer hover:border-blue-400 hover:shadow-md border-blue-200' 
              : 'border-gray-200'
            }
          `}
          onClick={() => {
            if (match.team1 && match.team2 && !match.winner && onUpdateMatch) {
              onUpdateMatch(match);
            }
          }}
        >
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              {match.round === 1 ? 'Cuartos de Final' :
               match.round === 2 ? 'Semifinal' : 'Final'}
            </span>
            {match.team1 && match.team2 && !match.winner && (
              <span className="text-xs text-blue-600 flex items-center">
                <button className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-100">
                  Actualizar resultado
                </button>
              </span>
            )}
          </div>
          <div className="p-3">
            <div className="space-y-3">
              <div className={`p-3 rounded-lg transition-colors ${
                match.winner?.id === match.team1?.id 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className="font-medium text-gray-900">
                  {match.team1?.player1?.first_name 
                    ? `${match.team1.player1.first_name} / ${match.team1.player2.first_name}`
                    : 'Por definir'}
                </p>
                {match.score && (
                  <span className="text-sm font-semibold text-gray-600">
                    {match.score.split('-')[0]}
                  </span>
                )}
              </div>
              
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-sm text-gray-400">vs</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className={`p-3 rounded-lg transition-colors ${
                match.winner?.id === match.team2?.id 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className="font-medium text-gray-900">
                  {match.team2?.player1?.first_name 
                    ? `${match.team2.player1.first_name} / ${match.team2.player2.first_name}`
                    : 'Por definir'}
                </p>
                {match.score && (
                  <span className="text-sm font-semibold text-gray-600">
                    {match.score.split('-')[1]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  const createFlowElements = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const roundSpacing = 450;  
    const matchSpacing = 250;  
    
    // Cuartos de final (4 partidos)
    const quarterFinals = matches.filter(m => m.round === 1).slice(0, 4);
    quarterFinals.forEach((match, index) => {
      const y = -375 + (index * matchSpacing); // Aumentado el espaciado vertical
      nodes.push(createMatchNode(match, 0, y));
    });

    // Semifinales (2 partidos)
    const semiFinals = matches.filter(m => m.round === 2).slice(0, 2);
    semiFinals.forEach((match, index) => {
      const y = -200 + (index * matchSpacing * 2); // Más espacio entre semifinales
      nodes.push(createMatchNode(match, roundSpacing, y));
    });

    // Final (1 partido)
    const final = matches.find(m => m.round === 3);
    if (final) {
      nodes.push(createMatchNode(final, roundSpacing * 2, -100));
    }

    // Crear conexiones solo para los partidos que necesitamos
    const validMatches = [...quarterFinals, ...semiFinals, final].filter(Boolean);
    validMatches.forEach(match => {
      if (match?.nextMatchId) {
        edges.push({
          id: `${match.id}-${match.nextMatchId}`,
          source: match.id,
          target: match.nextMatchId,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
            stroke: '#94a3b8',
          },
        });
      }
    });

    return { nodes, edges };
  };

  const { nodes, edges } = createFlowElements();

  return (
    <div className="h-[800px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.65 }}
        attributionPosition="bottom-left"
        className="bg-gray-50"
      >
        <Background color="#e2e8f0" gap={16} size={1} />
        <Controls 
          showInteractive={false}
          className="bg-white shadow-md"
        />
      </ReactFlow>
    </div>
  );
}

export { DrawBracket };