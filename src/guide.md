# 🎯 GUÍA COMPLETA PARA IMPLEMENTAR FRONTEND DEL SISTEMA DE TORNEOS

## 📋 RESUMEN DEL SISTEMA BACKEND

### ✅ **FUNCIONALIDADES IMPLEMENTADAS:**
- **Time slots dinámicos** basados en fechas del torneo
- **Cupos compartidos** entre todas las categorías del evento
- **Algoritmo inteligente** de distribución de grupos
- **Formatos múltiples**: NINE_PLAYERS (9 equipos) y TWELVE_PLAYERS (12 equipos)
- **Validación automática** de conflictos horarios

---

## 🔧 API ENDPOINTS DISPONIBLES

### 1. **CREAR TORNEO CON MÚLTIPLES CATEGORÍAS**
```http
POST /tournaments
```

**Body ejemplo:**
```json
{
  "name": "Torneo Test 4 Categorías",
  "categories": [
    "670a4087-9565-4e37-8714-3525acdb808b",
    "c4f7f573-6375-47dc-8e94-e21339058ba7",
    "5f759999-52c8-44e9-a71a-ffeac4b9671c",
    "70b8637d-1257-4610-9489-2cec6ff761ac"
  ],
  "start_date": "2025-10-10",
  "end_date": "2025-10-12",
  "courts_available": 2,
  "tournament_type": "TWELVE_PLAYERS",
  "description": "Torneo de prueba con 4 categorías × 12 equipos = 48 parejas totales",
  "rules": "Partidos de 45 minutos con tie-break en todos los sets",
  "tournament_location": "Club Real Uruguay",
  "tournament_address": "Av. Montevideo 1234",
  "tournament_club_name": "Club Real Uruguay",
  "signup_limit_date": "2024-03-14",
  "inscription_cost": 1500,
  "first_place_prize": "Trofeo + $5000",
  "second_place_prize": "Trofeo + $3000",
  "third_place_prize": "Medallas + $1500"
}
```

**Respuesta:**
- Crea **UN TORNEO POR CATEGORÍA** automáticamente
- Genera **time slots dinámicos** basados en las fechas
- Retorna array con todos los torneos creados

### 2. **OBTENER TIME SLOTS DISPONIBLES PARA INSCRIPCIÓN**
```http
GET /tournaments/{tournament_id}/available-time-slots
```

**Respuesta ejemplo:**
```json
{
  "available_slots": [
    {
      "slot_id": "day1_evening",
      "label": "Viernes Tarde (18-21hs)",
      "total_capacity": 8,
      "current_usage": 4,
      "remaining_slots": 4,
      "is_available": true,
      "percentage_full": 50,
      "duration_hours": 3
    }
  ],
  "tournament_info": {
    "total_categories": 4,
    "total_teams_across_categories": 48,
    "group_phase_days": "Viernes y Sábado"
  },
  "note": "🔄 CUPOS COMPARTIDOS: Los time slots son compartidos entre TODAS las categorías del evento."
}
```

### 3. **INSCRIBIR EQUIPO EN TORNEO**
```http
POST /tournaments/{tournament_id}/join
```

**Body:**
```json
{
  "userId1": "user-uuid-1",
  "userId2": "user-uuid-2",
  "unavailable_time_slot": "day1_evening",
  "payment_status": "mercadopago"
}
```

**Respuesta:**
```json
{
  "message": "Inscripción realizada correctamente",
  "tournament_info": {
    "id": "tournament-uuid",
    "name": "Torneo Test",
    "category": "Sexta",
    "current_teams": 5
  },
  "time_slot": {
    "slot_info": {
      "slot_id": "day1_evening",
      "selected_count": 5,
      "total_capacity": 8,
      "remaining_slots": 3,
      "percentage_full": 63
    }
  },
  "team_id": "team-uuid"
}
```

### 4. **GENERAR GRUPOS AUTOMÁTICAMENTE**
```http
POST /tournaments/{tournament_id}/generate-groups
```

**Respuesta:**
```json
{
  "message": "Grupos generados correctamente",
  "tournament_id": "tournament-uuid",
  "groups_created": [
    {
      "id": "group-uuid",
      "group_number": 1,
      "teams": ["team-uuid-1", "team-uuid-2", "team-uuid-3"]
    }
  ]
}
```

### 5. **VALIDAR CONFLICTOS HORARIOS**
```http
POST /tournaments/{tournament_id}/validate-group-conflicts
```

**Body:**
```json
{
  "groups": [
    {
      "group_number": 1,
      "teams": ["team-uuid-1", "team-uuid-2", "team-uuid-3"]
    }
  ]
}
```

### 6. **OBTENER EQUIPOS DEL TORNEO**
```http
GET /tournaments/{tournament_id}/teams
```

### 7. **OBTENER GRUPOS GENERADOS**
```http
GET /tournaments/{tournament_id}/groups
```

---

## 🎨 COMPONENTES DE FRONTEND RECOMENDADOS

### 1. **TournamentCreationForm**
**Propósito:** Crear torneo con múltiples categorías

**Props necesarias:**
- `categories: Category[]` - Lista de categorías disponibles
- `onSubmit: (data: TournamentData) => void`

**Estados internos:**
- `selectedCategories: string[]`
- `startDate: Date`
- `endDate: Date`
- `courtsAvailable: number`
- `tournamentType: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'`

**Validaciones:**
- Al menos 1 categoría seleccionada
- Fecha inicio < fecha fin
- Canchas disponibles >= 1

### 2. **TimeSlotSelector**
**Propósito:** Mostrar slots disponibles para inscripción

**Props necesarias:**
- `tournamentId: string`
- `onSlotSelect: (slotId: string) => void`

**Estados internos:**
- `availableSlots: TimeSlot[]`
- `loading: boolean`
- `selectedSlot: string | null`

**Funcionalidades:**
- Actualización en tiempo real de disponibilidad
- Indicadores visuales de ocupación (🔴🟡🟢🔵)
- Información de cupos compartidos

### 3. **TeamRegistrationForm**
**Propósito:** Inscribir equipo en torneo

**Props necesarias:**
- `tournamentId: string`
- `availableUsers: User[]`
- `onSuccess: (result: RegistrationResult) => void`

**Estados internos:**
- `player1: User | null`
- `player2: User | null`
- `selectedTimeSlot: string | null`
- `paymentMethod: 'mercadopago' | 'cash'`

**Validaciones:**
- Jugadores diferentes
- Time slot seleccionado
- Método de pago válido

### 4. **GroupGenerationPanel**
**Propósito:** Generar y visualizar grupos

**Props necesarias:**
- `tournamentId: string`
- `tournamentType: 'NINE_PLAYERS' | 'TWELVE_PLAYERS'`

**Estados internos:**
- `teams: Team[]`
- `groups: Group[]`
- `generationStatus: 'idle' | 'generating' | 'completed'`

**Funcionalidades:**
- Botón "Generar grupos automáticamente"
- Visualización de grupos con restricciones horarias
- Indicadores de conflictos

### 5. **AvailabilityDashboard**
**Propósito:** Dashboard de disponibilidad de cupos

**Props necesarias:**
- `tournamentIds: string[]` - IDs de todas las categorías del evento

**Estados internos:**
- `globalAvailability: SlotAvailability[]`
- `totalRegistered: number`
- `totalCapacity: number`

**Funcionalidades:**
- Tabla de disponibilidad por slot
- Gráficos de ocupación
- Estadísticas en tiempo real

---

## 📊 TIPOS DE DATOS TYPESCRIPT

```typescript
interface Tournament {
  id: string;
  name: string;
  category_id: string;
  start_date: string;
  end_date: string;
  courts_available: number;
  tournament_type: 'NINE_PLAYERS' | 'TWELVE_PLAYERS';
  max_teams: number;
  group_time_slots: TimeSlot[];
  status: 'upcoming' | 'in_progress' | 'completed';
}

interface TimeSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  label: string;
  tournament_day: number;
  date: string;
}

interface SlotAvailability {
  slot_id: string;
  label: string;
  total_capacity: number;
  current_usage: number;
  remaining_slots: number;
  is_available: boolean;
  percentage_full: number;
  duration_hours: number;
}

interface Team {
  team_id: string;
  unavailable_times: string;
  teams: {
    id: string;
    player1: User;
    player2: User;
  };
}

interface Group {
  id: string;
  group_number: number;
  teams: string[];
  status: 'IN_PROGRESS' | 'COMPLETED';
}

interface RegistrationData {
  userId1: string;
  userId2: string;
  unavailable_time_slot: string;
  payment_status: 'mercadopago' | 'cash';
}
```

---

## 🎯 FLUJO DE USUARIO RECOMENDADO

### 1. **CREACIÓN DE TORNEO (Admin)**
1. Seleccionar categorías participantes
2. Configurar fechas y detalles
3. El sistema genera automáticamente:
   - Un torneo por categoría
   - Time slots dinámicos
   - Capacidades compartidas

### 2. **INSCRIPCIÓN DE EQUIPOS (Jugadores)**
1. Ver torneos disponibles por categoría
2. Seleccionar torneo específico
3. Ver disponibilidad de time slots EN TIEMPO REAL
4. Seleccionar jugadores (pareja)
5. Elegir time slot (restricción horaria)
6. Confirmar método de pago
7. Recibir confirmación con estado de cupos

### 3. **GESTIÓN DE GRUPOS (Admin)**
1. Ver equipos inscritos por torneo
2. Generar grupos automáticamente
3. Revisar distribución inteligente
4. Validar conflictos horarios
5. Ajustar manualmente si necesario

### 4. **MONITOREO (Admin)**
1. Dashboard de disponibilidad global
2. Estadísticas por categoría
3. Ocupación de time slots
4. Alertas de cupos críticos

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **CUPOS COMPARTIDOS:**
- Los time slots son **GLOBALES** para todo el evento
- Si un slot se llena en una categoría, afecta a TODAS
- Mostrar siempre información de cupos compartidos
- Actualizar disponibilidad en tiempo real

### **FORMATOS DE TORNEO:**
- **NINE_PLAYERS**: 3 grupos de 3 equipos
- **TWELVE_PLAYERS**: 4 grupos de 3 equipos
- El algoritmo se adapta automáticamente

### **TIME SLOTS DINÁMICOS:**
- Se generan automáticamente basados en fechas
- Solo días 1-2 para fase de grupos
- Día 3 para eliminatorias
- Formato: "Día Horario (HH-HHhs)"

### **ALGORITMO INTELIGENTE:**
- Minimiza conflictos horarios automáticamente
- Distribuye equipos por restricciones
- Maximiza flexibilidad de programación

---

## 🚀 FUNCIONALIDADES AVANZADAS

### **TIEMPO REAL:**
- WebSockets para actualización de cupos
- Notificaciones de cambios de disponibilidad
- Sincronización entre categorías

### **VALIDACIONES:**
- Verificación de conflictos antes de inscripción
- Validación de capacidades en tiempo real
- Alertas de cupos críticos

### **REPORTES:**
- Estadísticas de ocupación
- Análisis de distribución por slots
- Reportes de flexibilidad de grupos

---

## 📱 RESPONSIVE DESIGN

### **MOBILE FIRST:**
- Selector de time slots optimizado para móvil
- Formularios de inscripción simplificados
- Dashboard adaptativo

### **DESKTOP:**
- Vista completa de disponibilidad
- Gestión avanzada de grupos
- Múltiples categorías simultáneas

---

## 🔧 CONFIGURACIÓN TÉCNICA

### **ENDPOINTS BASE:**
```javascript
const API_BASE = 'http://localhost:9999';

// Ejemplo de servicio
class TournamentService {
  async getAvailableSlots(tournamentId) {
    return fetch(`${API_BASE}/tournaments/${tournamentId}/available-time-slots`);
  }
  
  async registerTeam(tournamentId, data) {
    return fetch(`${API_BASE}/tournaments/${tournamentId}/join`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async generateGroups(tournamentId) {
    return fetch(`${API_BASE}/tournaments/${tournamentId}/generate-groups`, {
      method: 'POST'
    });
  }
}
```

### **ESTADO GLOBAL RECOMENDADO:**
```javascript
// Context/Store para manejar estado global
const TournamentContext = {
  tournaments: Tournament[],
  selectedTournament: Tournament | null,
  availableSlots: SlotAvailability[],
  registeredTeams: Team[],
  groups: Group[],
  loading: boolean,
  error: string | null
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **FASE 1: BÁSICO**
- [ ] Crear torneo con múltiples categorías
- [ ] Mostrar time slots disponibles
- [ ] Inscribir equipos con restricciones
- [ ] Ver cupos compartidos en tiempo real

### **FASE 2: GRUPOS**
- [ ] Generar grupos automáticamente
- [ ] Visualizar distribución inteligente
- [ ] Validar conflictos horarios
- [ ] Editar grupos manualmente

### **FASE 3: AVANZADO**
- [ ] Dashboard de disponibilidad
- [ ] Notificaciones en tiempo real
- [ ] Reportes y estadísticas
- [ ] Optimización móvil

---

## 🎯 VISTA ADMIN: GESTIÓN DE GRUPOS DE TORNEO

### **CONTEXTO DE LA FUNCIONALIDAD:**
El admin necesita una interfaz para gestionar la **generación de grupos** una vez que las inscripciones están completas. Esta vista debe mostrar:

1. **Estado de inscripciones** por categoría
2. **Equipos registrados** con sus restricciones horarias
3. **Generación automática** de grupos inteligentes
4. **Visualización de la distribución** y conflictos
5. **Validación y ajustes** manuales si es necesario

### **COMPONENTES PRINCIPALES PARA LA VISTA ADMIN:**

#### 1. **TournamentGroupsManager** (Componente Principal)
```typescript
interface TournamentGroupsManagerProps {
  eventName: string; // "Torneo Test 4 Categorías"
  tournamentsByCategory: Tournament[]; // Array con los 4 torneos (una por categoría)
  onGroupsGenerated: (results: GroupGenerationResult[]) => void;
}
```

#### 2. **CategoryStatusCard** (Estado por Categoría)
```typescript
interface CategoryStatusCardProps {
  tournament: Tournament;
  teamsCount: number;
  maxTeams: number;
  canGenerateGroups: boolean;
  onGenerateGroups: (tournamentId: string) => void;
  onViewTeams: (tournamentId: string) => void;
}
```

#### 3. **TeamsListWithConstraints** (Lista de Equipos)
```typescript
interface TeamsListWithConstraintsProps {
  tournamentId: string;
  teams: TeamWithConstraints[];
  groupTimeSlots: TimeSlot[];
}

interface TeamWithConstraints {
  team_id: string;
  player1: User;
  player2: User;
  unavailable_time_slot: string;
  slot_label: string;
}
```

#### 4. **GroupsVisualization** (Visualización de Grupos)
```typescript
interface GroupsVisualizationProps {
  tournament: Tournament;
  groups: GeneratedGroup[];
  onValidateConflicts: () => void;
  onRegenerateGroups: () => void;
}

interface GeneratedGroup {
  group_number: number;
  teams: TeamWithConstraints[];
  conflicts: ConflictInfo[];
  available_slots: string[];
  flexibility_percentage: number;
}
```

### **FLUJO DE LA VISTA ADMIN:**

#### **PASO 1: Dashboard de Estado**
```
┌─────────────────────────────────────────────────────────┐
│                GESTIÓN DE GRUPOS - TORNEO               │
│                  "Torneo Test 4 Categorías"            │
├─────────────────────────────────────────────────────────┤
│  📊 ESTADO DE INSCRIPCIONES POR CATEGORÍA              │
│                                                         │
│  🏆 SEXTA      │ 9/9 equipos   │ ✅ Listo    │ [GENERAR] │
│  🏆 QUINTA     │ 12/12 equipos │ ✅ Listo    │ [GENERAR] │
│  🏆 CUARTA     │ 8/12 equipos  │ ⏳ Pendiente│ [ESPERAR] │
│  🏆 SÉPTIMA    │ 0/9 equipos   │ ❌ Vacío    │ [ESPERAR] │
│                                                         │
│  🔄 Cupos Globales: 18/44 utilizados (41%)            │
└─────────────────────────────────────────────────────────┘
```

#### **PASO 2: Detalle de Equipos por Categoría**
```
┌─────────────────────────────────────────────────────────┐
│            EQUIPOS INSCRITOS - SEXTA (9/9)             │
├─────────────────────────────────────────────────────────┤
│  👥 Alvaro-Juan        │ ❌ day1_evening (Viernes Tarde) │
│  👥 Milton-Enzo        │ ❌ day1_night (Viernes Noche)   │
│  👥 Santiago-Maxi      │ ❌ day2_morning (Sábado Mañana) │
│  👥 Carlos-Felipe      │ ❌ day2_afternoon (Sábado Tarde)│
│  👥 Runate-Runa        │ ❌ day2_evening (Sábado Noche)  │
│  👥 Marcelo-Carlitos   │ ❌ day2_late_night (Sáb. Tardía)│
│  👥 Josep-Lucas        │ ❌ day3_morning (Domingo Mañana) │
│  👥 Richard-Martin     │ ❌ day3_afternoon (Dom. Tarde)   │
│  👥 Mateo-Deibis       │ ❌ day1_evening (Viernes Tarde) │
│                                                         │
│  📋 Formato: NINE_PLAYERS (3 grupos de 3 equipos)     │
│  🎯 [GENERAR GRUPOS AUTOMÁTICAMENTE]                   │
└─────────────────────────────────────────────────────────┘
```

#### **PASO 3: Grupos Generados**
```
┌─────────────────────────────────────────────────────────┐
│              GRUPOS GENERADOS - SEXTA                   │
├─────────────────────────────────────────────────────────┤
│  🏆 GRUPO 1 (Flexibilidad: 67%)                       │
│    • Alvaro-Juan (❌ day1_evening)                      │
│    • Mateo-Deibis (❌ day1_evening) ⚠️ CONFLICTO       │
│    • Milton-Enzo (❌ day1_night)                        │
│    ✅ Disponible: day2_morning, day2_afternoon...      │
│                                                         │
│  🏆 GRUPO 2 (Flexibilidad: 50%)                       │
│    • Santiago-Maxi (❌ day2_morning)                    │
│    • Carlos-Felipe (❌ day2_afternoon)                  │
│    • Runate-Runa (❌ day2_evening)                      │
│    ✅ Disponible: day1_evening, day1_night...          │
│                                                         │
│  🏆 GRUPO 3 (Flexibilidad: 83%)                       │
│    • Marcelo-Carlitos (❌ day2_late_night)             │
│    • Josep-Lucas (❌ day3_morning)                      │
│    • Richard-Martin (❌ day3_afternoon)                 │
│    ✅ Disponible: day1_evening, day1_night...          │
│                                                         │
│  📊 Resumen: 1 conflicto total, 67% flexibilidad prom. │
│  🔄 [REGENERAR] 🔍 [VALIDAR CONFLICTOS] ✅ [APROBAR]   │
└─────────────────────────────────────────────────────────┘
```

### **ENDPOINTS ESPECÍFICOS PARA LA VISTA ADMIN:**

#### **1. Dashboard de Estado**
```http
GET /tournaments/event/{event_name}/status
```
**Respuesta:**
```json
{
  "event_name": "Torneo Test 4 Categorías",
  "categories": [
    {
      "tournament_id": "uuid",
      "category_name": "Sexta",
      "tournament_type": "NINE_PLAYERS",
      "teams_registered": 9,
      "max_teams": 9,
      "status": "ready_for_groups",
      "groups_generated": true
    }
  ],
  "global_slots_usage": {
    "total_capacity": 44,
    "current_usage": 18,
    "percentage_full": 41
  }
}
```

#### **2. Equipos con Restricciones**
```http
GET /tournaments/{tournament_id}/teams-with-constraints
```
**Respuesta:**
```json
{
  "teams": [
    {
      "team_id": "uuid",
      "player1": {"first_name": "Alvaro", "last_name": "Cepero"},
      "player2": {"first_name": "Juan", "last_name": "Pérez"},
      "unavailable_time_slot": "day1_evening",
      "slot_label": "Viernes Tarde (18-21hs)"
    }
  ],
  "tournament_info": {
    "tournament_type": "NINE_PLAYERS",
    "expected_groups": 3,
    "teams_per_group": 3
  }
}
```

#### **3. Análisis de Grupos Generados**
```http
GET /tournaments/{tournament_id}/groups-analysis
```
**Respuesta:**
```json
{
  "groups": [
    {
      "group_number": 1,
      "teams": [...],
      "conflicts": [
        {
          "type": "same_unavailable_slot",
          "teams": ["team1", "team2"],
          "slot": "day1_evening"
        }
      ],
      "available_slots": ["day2_morning", "day2_afternoon"],
      "flexibility_percentage": 67
    }
  ],
  "summary": {
    "total_conflicts": 1,
    "average_flexibility": 67,
    "groups_without_conflicts": 2
  }
}
```

### **PROMPT ESPECÍFICO PARA LA VISTA ADMIN:**

```
"Necesito implementar la VISTA DE ADMINISTRADOR para gestión de grupos de torneos de pádel.

CONTEXTO:
- Las inscripciones ya están completas
- Necesito una interfaz para que el admin genere grupos automáticamente
- El sistema tiene CUPOS COMPARTIDOS entre categorías
- Algoritmo INTELIGENTE que minimiza conflictos horarios
- Formatos NINE_PLAYERS (3 grupos) y TWELVE_PLAYERS (4 grupos)

FUNCIONALIDADES REQUERIDAS:
1. 📊 Dashboard con estado de inscripciones por categoría
2. 👥 Lista de equipos con sus restricciones horarias
3. 🎯 Botón para generar grupos automáticamente
4. 📋 Visualización de grupos con análisis de conflictos
5. 🔄 Opciones para regenerar o ajustar manualmente
6. ✅ Validación y aprobación de grupos

COMPONENTES PRINCIPALES:
- TournamentGroupsManager (componente principal)
- CategoryStatusCard (estado por categoría)  
- TeamsListWithConstraints (equipos con restricciones)
- GroupsVisualization (grupos generados)
- ConflictAnalysis (análisis de conflictos)

ENDPOINTS DISPONIBLES:
[INCLUIR TODOS LOS ENDPOINTS DE LA GUÍA]

¿Puedes ayudarme a implementar esta vista de administrador completa, empezando por [COMPONENTE ESPECÍFICO]?"
```

---

**🎯 ¡GUÍA ACTUALIZADA PARA VISTA DE ADMINISTRADOR DE GRUPOS!**

---

**🎉 ¡SISTEMA COMPLETAMENTE DOCUMENTADO Y LISTO PARA FRONTEND!**
