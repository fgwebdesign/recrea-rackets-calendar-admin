# 🎯 Guía de Implementación Frontend - Sistema de Torneos

## 📋 Funcionalidades a Implementar

### 1️⃣ Gestión de Torneos
- [x] Creación de torneo con múltiples categorías
- [x] Selección de fechas y detalles
- [x] Configuración de canchas disponibles
- [x] Selección de formato (NINE_PLAYERS o TWELVE_PLAYERS)

### 2️⃣ Sistema de Inscripciones -- PORTAL DEL JUGADOR 
- [x] Selección de time slots
- [x] Registro de equipos
- [x] Visualización de cupos compartidos
- [x] Estado de pagos

### 3️⃣ Gestión de Grupos
- [x] Visualización de equipos inscritos
- [x] Generación automática de grupos
- [x] Validación de conflictos horarios
- [x] Ajustes manuales de grupos

### 4️⃣ Gestión de Partidos y Resultados ⏳
- [ ] Vista de partidos programados
- [ ] Formulario de resultados con lógica uruguaya
- [ ] Validación de puntuaciones
- [ ] Historial de partidos

### 5️⃣ Sistema de Standings ⏳
- [ ] Tabla de posiciones por grupo
- [ ] Estadísticas de equipos
- [ ] Clasificación automática
- [ ] Actualización en tiempo real

### 6️⃣ Fase Eliminatoria ⏳
- [ ] Generación de brackets
- [ ] Visualización de eliminatorias
- [ ] Programación de finales
- [ ] Seguimiento de ganadores

## 🎨 Componentes a Implementar

### 1. Vista de Partidos
```tsx
interface MatchesViewProps {
  tournamentId: string;
  category: string;
  stage: 'group' | 'elimination';
}

const MatchesView: React.FC<MatchesViewProps> = () => {
  return (
    <div className="matches-container">
      <MatchesFilter />
      <MatchesList />
      <MatchDetails />
    </div>
  );
};
```

### 2. Formulario de Resultados
```tsx
interface MatchResultFormProps {
  match: Match;
  onSave: (result: MatchResult) => void;
}

const MatchResultForm: React.FC<MatchResultFormProps> = ({ match, onSave }) => {
  return (
    <Form>
      <SetScoreInput label="Set 1" />
      <SetScoreInput label="Set 2" />
      <SuperTiebreakInput />
      <Button type="submit">Guardar Resultado</Button>
    </Form>
  );
};
```

### 3. Tabla de Posiciones
```tsx
interface StandingsViewProps {
  tournamentId: string;
  groupNumber?: number;
}

const StandingsView: React.FC<StandingsViewProps> = () => {
  return (
    <div className="standings-container">
      <StandingsTable />
      <QualificationStatus />
      <TeamStats />
    </div>
  );
};
```

### 4. Bracket Eliminatorio
```tsx
interface BracketViewProps {
  tournamentId: string;
  format: 'NINE_PLAYERS' | 'TWELVE_PLAYERS';
}

const BracketView: React.FC<BracketViewProps> = () => {
  return (
    <div className="bracket-container">
      <QuarterFinals />
      <SemiFinals />
      <Final />
    </div>
  );
};
```

## 🔄 Flujos de Usuario

### 1. Carga de Resultados
1. Admin selecciona partido
2. Ingresa resultados de sets
3. Sistema valida puntuación
4. Se actualiza standing automáticamente
5. Se determina clasificación si aplica

### 2. Visualización de Standings
1. Usuario selecciona categoría/torneo
2. Ve tabla general de posiciones
3. Puede filtrar por grupo
4. Ve estadísticas detalladas
5. Identifica clasificados

### 3. Fase Eliminatoria
1. Sistema genera brackets
2. Admin programa horarios
3. Se cargan resultados
4. Bracket se actualiza
5. Se programan siguientes fases

## 🎨 Diseño y UX

### Matches View
```
┌─────────────────────────────────────┐
│ 🏆 Torneo Octubre - Quinta         │
├─────────────────────────────────────┤
│ 📅 Filtros: Fecha | Grupo | Estado │
├─────────────────────────────────────┤
│ 🎾 PARTIDO #1                      │
│ Carlos/Felipe vs Juan/Pedro        │
│ Grupo 1 | Cancha 1 | 10:00        │
│ [Ver Detalles] [Cargar Resultado]  │
├─────────────────────────────────────┤
│ 🎾 PARTIDO #2                      │
│ ...                                │
└─────────────────────────────────────┘
```

### Standings View
```
┌─────────────────────────────────────┐
│ 📊 TABLA DE POSICIONES - GRUPO 1   │
├─────────────────────────────────────┤
│ Pos | Equipo | PJ | PG | PP | Pts  │
├─────────────────────────────────────┤
│ 1️⃣ | Team A | 3  | 3  | 0  | 9   │
│ 2️⃣ | Team B | 3  | 2  | 1  | 6   │
│ 3️⃣ | Team C | 3  | 1  | 2  | 3   │
└─────────────────────────────────────┘
```

### Bracket View
```
┌──────────┐     ┌──────────┐
│ Team A   │     │ Winner 1 │
├──────────┤     │          │
│ Team B   │ ──► │          │
├──────────┤     └──────────┘
│ Team C   │
└──────────┘
```

## 📱 Responsive Design

### Mobile
- Vista compacta de partidos
- Tablas horizontalmente scrollables
- Brackets adaptados a pantalla
- Botones grandes para input

### Tablet/Desktop
- Vista completa de información
- Múltiples columnas
- Brackets completos visibles
- Tooltips con estadísticas

## 🔧 Endpoints Disponibles

### Partidos
```http
GET /tournaments/{id}/matches
PUT /matches/{id}/result
GET /matches/{id}/details
```

### Standings
```http
GET /tournaments/{id}/standings
GET /tournaments/{id}/standings/{group}
GET /tournaments/{id}/qualification-status
```

### Eliminatorias
```http
GET /tournaments/{id}/bracket
POST /tournaments/{id}/generate-bracket
PUT /tournaments/{id}/schedule-elimination
```

## ⚡ Optimizaciones

### Performance
- Caching de standings
- Lazy loading de brackets
- Virtualización de listas largas
- Debounce en inputs

### UX
- Loading states
- Error boundaries
- Tooltips informativos
- Confirmaciones de acciones

## 📝 Notas Técnicas

### Estado Global
```typescript
interface TournamentState {
  matches: Match[];
  standings: Standing[];
  bracket: Bracket;
  loading: boolean;
  error: Error | null;
}
```

### Validaciones
```typescript
const validateResult = (result: MatchResult): boolean => {
  // Set normal: 0-6 games
  if (result.set1.team1 > 6 || result.set1.team2 > 6) return false;
  
  // Tie break: 0-7 puntos
  if (result.tiebreak && (result.tiebreak.team1 > 7 || result.tiebreak.team2 > 7)) return false;
  
  // Super tie break: 0-11 puntos
  if (result.superTiebreak && (result.superTiebreak.team1 > 11 || result.superTiebreak.team2 > 11)) return false;
  
  return true;
};
```

## 🚀 Próximos Pasos

1. Implementar vista de partidos
2. Crear formulario de resultados
3. Desarrollar sistema de standings
4. Implementar brackets
5. Agregar animaciones
6. Testing completo

## ✅ Checklist Final

### Fase 1: Partidos
- [ ] Vista de lista de partidos
- [ ] Filtros y búsqueda
- [ ] Formulario de resultados
- [ ] Validaciones
- [ ] Historial

### Fase 2: Standings
- [ ] Tabla de posiciones
- [ ] Estadísticas por equipo
- [ ] Clasificación automática
- [ ] Updates en tiempo real
- [ ] Exportar datos

### Fase 3: Eliminatorias
- [ ] Generación de brackets
- [ ] Visualización interactiva
- [ ] Programación de partidos
- [ ] Seguimiento de ganadores
- [ ] Ceremonia final
