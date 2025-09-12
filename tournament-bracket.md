# 🏆 PROMPT: Implementación Frontend - Fase Eliminatoria

## 📋 **CONTEXTO DEL PROYECTO**
Soy el desarrollador de **Recrea Padel Club**, una plataforma de gestión de torneos de pádel. Necesito implementar la funcionalidad de **fase eliminatoria** en el frontend del admin con las siguientes características:

### 🎯 **REQUERIMIENTOS ESPECÍFICOS:**

1. **Botón "Generar Fase Eliminatoria"** que:
   - Valide que hay equipos clasificados
   - Ejecute el endpoint `POST /tournaments/:id/generate-elimination-bracket`
   - Maneje errores y éxito
   - Muestre feedback de emails enviados (30 seg delay)

2. **Visualización de Brackets Interactiva** que:
   - Use la librería `@g-loot/react-tournament-brackets`
   - Soporte formatos: 6, 8, 9, 12, 16 jugadores
   - Sea responsive y profesional
   - Permita editar resultados de partidos

3. **Gestión de Resultados** que:
   - Actualice resultados en tiempo real
   - Use el endpoint `PUT /matches/:id/result`
   - Valide datos del frontend
   - Actualice el bracket automáticamente

## 🚀 **IMPLEMENTACIÓN PASO A PASO**

### **PASO 1: Instalar Librería de Brackets**

```bash
# Librería recomendada (con demo oficial)
npm install @g-loot/react-tournament-brackets

# Demo: https://sleepy-kare-d8538d.netlify.app/
# NPM: https://www.npmjs.com/package/@g-loot/react-tournament-brackets
```

### **PASO 2: Componente de Generación de Bracket**

```jsx
// components/admin/EliminationBracketGenerator.jsx
import React, { useState } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';

const EliminationBracketGenerator = ({ tournamentId, onBracketGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleGenerateBracket = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar que hay equipos clasificados antes de generar
      const standingsResponse = await fetch(
        `http://localhost:9999/tournaments/${tournamentId}/standings`,
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
        `http://localhost:9999/tournaments/${tournamentId}/generate-elimination-bracket`,
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

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="elimination-bracket-generator">
      <h3>🏆 Fase Eliminatoria</h3>
      <p className="text-muted">
        Genera el cuadro eliminatorio y envía notificaciones a los equipos clasificados.
      </p>
      
      {error && (
        <Alert variant="danger" className="mt-3">
          <strong>Error:</strong> {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mt-3">
          <strong>Éxito:</strong> {success}
        </Alert>
      )}

      <Button 
        variant="primary" 
        size="lg"
        onClick={handleGenerateBracket}
        disabled={isGenerating}
        className="mt-3"
      >
        {isGenerating ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Generando Bracket...
          </>
        ) : (
          '🎾 Generar Fase Eliminatoria'
        )}
      </Button>
    </div>
  );
};

export default EliminationBracketGenerator;
```

### **PASO 3: Componente de Visualización de Bracket**

```jsx
// components/admin/EliminationBracketViewer.jsx
import React, { useState, useEffect } from 'react';
import { Bracket } from '@g-loot/react-tournament-brackets';

const EliminationBracketViewer = ({ tournamentId, bracketData }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEliminationMatches();
  }, [tournamentId]);

  const fetchEliminationMatches = async () => {
    try {
      const response = await fetch(
        `http://localhost:9999/tournaments/${tournamentId}/matches`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filtrar solo partidos eliminatorios
        const eliminationMatches = data.matches.filter(match => 
          match.round !== 'group'
        );
        
        // Transformar datos para la librería
        const formattedMatches = eliminationMatches.map(match => ({
          id: match.id,
          nextMatchId: match.next_match_id,
          tournamentRoundText: getRoundText(match.elimination_round),
          startTime: `${match.match_day} ${match.start_time}`,
          state: match.status === 'completed' ? 'DONE' : 'SCHEDULED',
          participants: [
            {
              id: match.home_team_id,
              resultText: match.status === 'completed' ? 
                `${match.team1_sets1_won}-${match.team2_sets1_won}, ${match.team1_sets2_won}-${match.team2_sets2_won}` : 
                null,
              isWinner: match.winner_team_id === match.home_team_id,
              name: match.home_team_name || 'Equipo Local'
            },
            {
              id: match.away_team_id,
              resultText: match.status === 'completed' ? 
                `${match.team1_sets1_won}-${match.team2_sets1_won}, ${match.team1_sets2_won}-${match.team2_sets2_won}` : 
                null,
              isWinner: match.winner_team_id === match.away_team_id,
              name: match.away_team_name || 'Equipo Visitante'
            }
          ]
        }));
        
        setMatches(formattedMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoundText = (eliminationRound) => {
    const roundTexts = {
      'octavos': 'Octavos de Final',
      'quarterfinals': 'Cuartos de Final',
      'semifinals': 'Semifinales',
      'final': 'Final'
    };
    return roundTexts[eliminationRound] || eliminationRound;
  };

  const handleMatchClick = (match) => {
    console.log('Match clicked:', match);
    // Aquí puedes abrir un modal para editar el resultado
    // o navegar a una página de edición
  };

  const handleMatchUpdate = async (matchId, result) => {
    try {
      const response = await fetch(
        `http://localhost:9999/matches/${matchId}/result`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );

      if (response.ok) {
        // Actualizar estado local
        setMatches(prevMatches => 
          prevMatches.map(match => 
            match.id === matchId ? { ...match, ...result } : match
          )
        );
        
        // Refrescar datos
        fetchEliminationMatches();
      }
    } catch (error) {
      console.error('Error updating match result:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando bracket...</p>
      </div>
    );
  }

  return (
    <div className="elimination-bracket-viewer">
      <h3>🏆 Bracket Eliminatorio</h3>
      
      {matches.length > 0 ? (
        <div className="bracket-container">
          <Bracket
            matches={matches}
            onMatchClick={handleMatchClick}
            onMatchUpdate={handleMatchUpdate}
            matchComponent={({ match }) => (
              <div className="match-card">
                <div className="match-teams">
                  {match.participants.map((participant, index) => (
                    <div 
                      key={index}
                      className={`team ${participant.isWinner ? 'winner' : ''}`}
                    >
                      <span className="team-name">{participant.name}</span>
                      {participant.resultText && (
                        <span className="team-score">{participant.resultText}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="match-info">
                  <span className="match-round">{match.tournamentRoundText}</span>
                  <span className="match-time">{match.startTime}</span>
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="alert alert-info">
            <h5>No hay partidos eliminatorios generados aún</h5>
            <p>Haz clic en "Generar Fase Eliminatoria" para comenzar.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EliminationBracketViewer;
```

### **PASO 4: Integración en el Admin**

```jsx
// pages/admin/TournamentDetails.jsx
import React, { useState } from 'react';
import EliminationBracketGenerator from '../components/admin/EliminationBracketGenerator';
import EliminationBracketViewer from '../components/admin/EliminationBracketViewer';

const TournamentDetails = ({ tournamentId }) => {
  const [bracketData, setBracketData] = useState(null);
  const [showBracket, setShowBracket] = useState(false);

  const handleBracketGenerated = (data) => {
    setBracketData(data);
    setShowBracket(true);
  };

  return (
    <div className="tournament-details">
      {/* Otras secciones del torneo */}
      
      <div className="elimination-section">
        <EliminationBracketGenerator 
          tournamentId={tournamentId}
          onBracketGenerated={handleBracketGenerated}
        />
        
        {showBracket && (
          <EliminationBracketViewer 
            tournamentId={tournamentId}
            bracketData={bracketData}
          />
        )}
      </div>
    </div>
  );
};

export default TournamentDetails;
```

## 🔧 **FORMATOS DE TORNEO SOPORTADOS**

### **Formatos Actuales:**
- **NINE_PLAYERS** (9 equipos) → 3 grupos de 3, 6 clasifican → Semifinales + Final
- **TWELVE_PLAYERS** (12 equipos) → 4 grupos de 3, 8 clasifican → Cuartos + Semifinales + Final
- **SIXTEEN_PLAYERS** (16 equipos) → 4 grupos de 4, 8 clasifican → Octavos + Cuartos + Semifinales + Final

### **Formatos Futuros (Fácilmente Adaptables):**
- **SIX_PLAYERS** (6 equipos) → 2 grupos de 3, 4 clasifican → Semifinales + Final
- **EIGHT_PLAYERS** (8 equipos) → 2 grupos de 4, 4 clasifican → Semifinales + Final

### **Adaptabilidad:**
La librería `@g-loot/react-tournament-brackets` se adapta automáticamente a cualquier cantidad de equipos y estructura de bracket. Solo necesitas pasar los matches en el formato correcto.

## 🔧 **VALIDACIONES DEL FRONTEND**

### **Antes de Generar Bracket:**
```jsx
const validateBeforeGeneration = async (tournamentId) => {
  try {
    // Verificar que todos los partidos de grupos estén completados
    const response = await fetch(
      `http://localhost:9999/tournaments/${tournamentId}/standings`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // Verificar que hay equipos clasificados
      if (!data.classification_summary?.qualified_teams?.length) {
        throw new Error('No hay equipos clasificados. Complete la fase de grupos primero.');
      }
      
      return true;
    }
  } catch (error) {
    throw error;
  }
};
```

## 🎨 **ESTILOS CSS RECOMENDADOS**

```css
/* styles/elimination-bracket.css */
.elimination-bracket-generator {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin: 2rem 0;
  border: 1px solid #e9ecef;
}

.elimination-bracket-viewer {
  margin-top: 2rem;
}

.bracket-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.match-card {
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.match-card:hover {
  border-color: #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  transform: translateY(-2px);
}

.match-card.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.match-card.scheduled {
  border-color: #f59e0b;
  background: #fffbeb;
}

.team {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.team:last-child {
  border-bottom: none;
}

.team.winner {
  font-weight: bold;
  color: #10b981;
}

.team-name {
  flex: 1;
}

.team-score {
  font-weight: bold;
  color: #6c757d;
}

.match-info {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.match-round {
  font-weight: 600;
}

.match-time {
  font-style: italic;
}
```

## 📱 **RESPONSIVE DESIGN**

```css
@media (max-width: 768px) {
  .elimination-bracket-generator {
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .bracket-container {
    padding: 1rem;
  }
  
  .match-card {
    margin: 0.25rem;
    padding: 0.75rem;
  }
  
  .team {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .team-score {
    margin-top: 0.25rem;
  }
}

@media (max-width: 576px) {
  .match-info {
    flex-direction: column;
    gap: 0.25rem;
  }
}
```

## 🚀 **ENDPOINTS NECESARIOS**

### **Backend (Ya implementados):**
- `POST /tournaments/:id/generate-elimination-bracket` - Genera bracket y envía emails
- `GET /tournaments/:id/matches` - Obtiene todos los partidos
- `PUT /matches/:id/result` - Actualiza resultado de partido
- `GET /tournaments/:id/standings` - Obtiene standings y equipos clasificados

### **Frontend:**
- Componente de generación con validaciones
- Componente de visualización interactiva
- Manejo de estados y errores
- Validaciones del frontend

## 🎯 **FLUJO COMPLETO**

1. **Admin hace clic** en "Generar Fase Eliminatoria"
2. **Frontend valida** que hay equipos clasificados
3. **Backend genera** bracket y partidos eliminatorios
4. **Backend envía** emails a clasificados (30 seg delay)
5. **Frontend muestra** bracket interactivo y profesional
6. **Admin puede editar** resultados de partidos
7. **Bracket se actualiza** en tiempo real

## 🏆 **RESULTADO FINAL**

- ✅ **Botón de generación** con validaciones completas
- ✅ **Bracket interactivo** y visualmente atractivo
- ✅ **Edición de resultados** en tiempo real
- ✅ **Responsive design** para móviles
- ✅ **Manejo de errores** robusto
- ✅ **Feedback visual** completo
- ✅ **Soporte para múltiples formatos** de torneo
- ✅ **Integración con emails** automáticos

## 📋 **INSTRUCCIONES PARA EL DESARROLLADOR**

1. **Instala la librería:** `npm install @g-loot/react-tournament-brackets`
2. **Revisa el demo:** https://sleepy-kare-d8538d.netlify.app/
3. **Implementa los componentes** paso a paso
4. **Personaliza los estilos** según tu diseño
5. **Prueba con diferentes formatos** de torneo
6. **Integra con tu sistema** de autenticación

¡Esta implementación te dará un sistema completo y profesional para la fase eliminatoria! 🎾✨
