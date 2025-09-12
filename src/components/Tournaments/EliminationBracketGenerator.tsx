'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy } from 'lucide-react';

interface EliminationBracketGeneratorProps {
  tournamentId: string;
  onBracketGenerated: (data: any) => void;
  hasEliminationMatches?: boolean;
}

const EliminationBracketGenerator: React.FC<EliminationBracketGeneratorProps> = ({ 
  tournamentId, 
  onBracketGenerated,
  hasEliminationMatches = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerateBracket = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar que hay equipos clasificados antes de generar
      const standingsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/standings`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        
        if (!standingsData.classification_summary?.qualified_teams?.length) {
          throw new Error('No hay equipos clasificados. Complete la fase de grupos primero.');
        }
      }

      // Generar bracket eliminatorio
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentId}/generate-elimination-bracket`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error generando bracket');
      }

      const data = await response.json();
      
      setSuccess('¡Bracket generado exitosamente!');
      onBracketGenerated(data);
      
      // Mostrar mensaje de emails enviados después del delay
      setTimeout(() => {
        setSuccess('¡Bracket generado y emails enviados a clasificados!');
      }, 35000); // 35 segundos para que lleguen los emails

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="elimination-bracket-generator bg-gray-50 p-8 rounded-xl border border-gray-200 my-8">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="h-8 w-8 text-yellow-600" />
        <h3 className="text-2xl font-bold text-gray-900">🏆 Fase Eliminatoria</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Genera el cuadro eliminatorio y envía notificaciones a los equipos clasificados.
      </p>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <strong>Éxito:</strong> {success}
          </AlertDescription>
        </Alert>
      )}

      {hasEliminationMatches ? (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>✅ Fase Eliminatoria Generada:</strong> El bracket eliminatorio ya ha sido creado para este torneo.
            </AlertDescription>
          </Alert>
          <Button 
            disabled
            size="lg"
            className="bg-gray-400 text-white px-8 py-3 text-lg font-semibold cursor-not-allowed"
          >
            <Trophy className="mr-2 h-5 w-5" />
            🎾 Bracket Ya Generado
          </Button>
        </div>
      ) : (
        <Button 
          onClick={handleGenerateBracket}
          disabled={isGenerating}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando Bracket...
            </>
          ) : (
            <>
              <Trophy className="mr-2 h-5 w-5" />
              🎾 Generar Fase Eliminatoria
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default EliminationBracketGenerator;
