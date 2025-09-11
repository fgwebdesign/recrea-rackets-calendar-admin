# 🎾 CONTEXTO COMPLETO PARA FRONTEND - SISTEMA DE TORNEOS

## 📋 **RESUMEN EJECUTIVO**

Este es un sistema completo de gestión de torneos de pádel con algoritmos inteligentes para:
- **Distribución automática de equipos** en grupos balanceados
- **Programación inteligente de partidos** respetando restricciones de horarios
- **Cálculo automático de standings** y clasificaciones
- **Generación automática de brackets** de eliminación
- **Gestión de cupos compartidos** entre categorías

---

## 🎯 **ALGORITMOS CLAVE**

### **1. FORMATOS DE TORNEO SOPORTADOS:**

```javascript
// Configuración de formatos
const TOURNAMENT_FORMATS = {
  'NINE_PLAYERS': {
    total_teams: 9,
    groups_count: 3,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 6 equipos clasifican
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 2,  // 2 mejores primeros → semis directas
      quarter_finals_teams: 4,  // otros 4 → cuartos
    }
  },
  'TWELVE_PLAYERS': {
    total_teams: 12,
    groups_count: 4,
    teams_per_group: 3,
    teams_to_qualify: 2,  // 8 equipos clasifican
    elimination_stages: {
      first: 'QUARTER_FINALS',
      matches: ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0,  // todos juegan cuartos
      quarter_finals_teams: 8,
    }
  },
  'SIXTEEN_PLAYERS': {
    total_teams: 16,
    groups_count: 4,
    teams_per_group: 4,
    teams_to_qualify: 2,  // 8 equipos clasifican
    elimination_stages: {
      first: 'OCTAVOS_DE_FINAL',
      matches: ['OCTAVOS_DE_FINAL', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
      direct_to_semis: 0,
      octavos_finals_teams: 8,
    }
  }
};
```

### **2. ALGORITMO DE DISPONIBILIDAD DE CANCHAS:**

```javascript
// Cálculo de capacidad por time slot
function calculateTimeSlotCapacity(tournament, totalCategoriesCount, totalTeamsAcrossCategories) {
  const totalTeams = totalTeamsAcrossCategories || (totalCategoriesCount * tournament.max_teams);
  
  // Partidos por equipo según formato
  let matchesPerTeam = tournament.tournament_type === 'SIXTEEN_PLAYERS' ? 3 : 2;
  const totalMatches = (totalTeams * matchesPerTeam) / 2;
  
  // Configuración: partidos de 45 minutos
  const matchDurationMinutes = 45;
  const turnosPerHour = 60 / matchDurationMinutes; // 1.33 turnos por hora
  
  // Calcular capacidad por slot
  const slotDetails = groupSlots.map(slot => {
    const slotDurationHours = calculateSlotDurationHours(slot.start, slot.end);
    const maxConcurrentMatches = tournament.courts_available;
    const turnosInSlot = Math.floor(slotDurationHours * turnosPerHour);
    const maxMatchesInSlot = turnosInSlot * maxConcurrentMatches;
    
    return {
      slot_id: slot.id,
      label: slot.label,
      duration_hours: slotDurationHours,
      turnos_in_slot: turnosInSlot,
      max_matches_in_slot: maxMatchesInSlot,
      courts_available: maxConcurrentMatches
    };
  });
  
  // Calcular cupos por slot basado en restricciones
  const capacityPerSlot = slotDetails.map(slot => {
    const baseCapacityPerSlot = Math.floor(totalTeams / groupSlots.length);
    const slotWeight = slot.max_matches_in_slot / totalSlotCapacity;
    const weightedCapacity = Math.floor(totalTeams * slotWeight * 1.5); // Factor 1.5 para flexibilidad
    const finalCapacity = Math.min(baseCapacityPerSlot + 2, weightedCapacity);
    
    return {
      slot_id: slot.slot_id,
      label: slot.label,
      final_capacity: finalCapacity,
      slot_weight: Math.round(slotWeight * 100)
    };
  });
  
  return capacityPerSlot;
}
```

### **3. ALGORITMO DE DISTRIBUCIÓN DE EQUIPOS:**

```javascript
// Distribución inteligente por restricciones
async function generateTournamentGroups(tournament, teams) {
  const format = TOURNAMENT_FORMATS[tournament.tournament_type];
  const groups = [];
  
  // 1. Agrupar equipos por restricciones de time slot
  const teamsByRestriction = new Map();
  teams.forEach(team => {
    const restriction = team.unavailable_times || 'no_restriction';
    if (!teamsByRestriction.has(restriction)) {
      teamsByRestriction.set(restriction, []);
    }
    teamsByRestriction.get(restriction).push(team);
  });
  
  // 2. Crear grupos vacíos
  for (let i = 1; i <= format.groups_count; i++) {
    groups.push({
      group_number: i,
      teams: [],
      restriction_slots: new Set()
    });
  }
  
  // 3. Distribución equilibrada
  const allTeams = [...teams];
  let groupIndex = 0;
  
  while (allTeams.length > 0) {
    const currentGroup = groups[groupIndex % format.groups_count];
    
    if (currentGroup.teams.length < format.teams_per_group) {
      const bestTeam = selectBestTeamForGroup(allTeams, currentGroup, teamsByRestriction);
      
      if (bestTeam) {
        currentGroup.teams.push(bestTeam);
        currentGroup.restriction_slots.add(bestTeam.unavailable_times);
        
        const teamIndex = allTeams.findIndex(t => t.team_id === bestTeam.team_id);
        allTeams.splice(teamIndex, 1);
      }
    }
    
    groupIndex++;
  }
  
  return groups;
}
```

### **4. ALGORITMO DE PROGRAMACIÓN DE PARTIDOS:**

```javascript
// Programación por grupo y día
const scheduleMatchesByGroupAndDay = async (matches, restrictionsMap, timeSlots, courts, startDate) => {
  const scheduledMatches = [];
  const courtSchedule = new Map();
  
  // 1. Agrupar partidos por grupo
  const matchesByGroup = new Map();
  matches.forEach(match => {
    const groupKey = `${match.group_number}`;
    if (!matchesByGroup.has(groupKey)) {
      matchesByGroup.set(groupKey, []);
    }
    matchesByGroup.get(groupKey).push(match);
  });
  
  // 2. Obtener restricciones por grupo
  const groupRestrictions = new Map();
  matchesByGroup.forEach((groupMatches, groupNumber) => {
    const groupTeamIds = [...new Set([
      ...groupMatches.map(m => m.home_team_id),
      ...groupMatches.map(m => m.away_team_id)
    ])];
    
    const restrictionSlots = new Set();
    const availableSlots = [];
    
    groupTeamIds.forEach(teamId => {
      const restriction = restrictionsMap.get(teamId);
      if (restriction) {
        restrictionSlots.add(restriction);
      }
    });
    
    // Filtrar time slots disponibles
    timeSlots.forEach(slot => {
      if (!restrictionSlots.has(slot.id)) {
        availableSlots.push(slot);
      }
    });
    
    groupRestrictions.set(groupNumber, {
      restrictionSlots: Array.from(restrictionSlots),
      availableSlots: availableSlots
    });
  });
  
  // 3. Programar cada grupo en su time slot disponible
  for (const [groupNumber, groupMatches] of matchesByGroup) {
    const groupInfo = groupRestrictions.get(groupNumber);
    
    // Encontrar el mejor time slot
    const sortedSlots = groupInfo.availableSlots.sort((a, b) => {
      const aDuration = calculateSlotDurationHours(a.start, a.end);
      const bDuration = calculateSlotDurationHours(b.start, b.end);
      return bDuration - aDuration; // Más horas primero
    });
    
    let bestSlot = null;
    let assignedCourt = null;
    
    for (const slot of sortedSlots) {
      const availableCourt = findAvailableCourt(slot, courtSchedule, courts);
      
      if (availableCourt) {
        bestSlot = slot;
        assignedCourt = availableCourt;
        break;
      }
    }
    
    if (!bestSlot || !assignedCourt) {
      continue;
    }
    
    // 4. Programar todos los partidos del grupo en el mismo time slot
    const groupTimeSlots = generateGroupTimeSlots(
      bestSlot.start, 
      bestSlot.end, 
      groupMatches.length, 
      45 // 45 minutos por partido
    );
    
    groupMatches.forEach((match, index) => {
      const matchTimeSlot = groupTimeSlots[index];
      
      // Marcar horario/cancha como ocupado
      const scheduleKey = `${bestSlot.date}_${matchTimeSlot.time}_${assignedCourt.id}`;
      courtSchedule.set(scheduleKey, {
        match_id: match.id,
        date: bestSlot.date,
        time: matchTimeSlot.time,
        court: assignedCourt
      });
      
      scheduledMatches.push({
        id: match.id,
        group_name: `Grupo ${match.group_number}`,
        scheduled_date: bestSlot.date,
        scheduled_time: matchTimeSlot.time,
        assigned_court: assignedCourt.id,
        assigned_court_name: assignedCourt.name
      });
    });
  }
  
  return scheduledMatches;
};
```

### **5. CÁLCULO DE STANDINGS:**

```javascript
// Sistema de puntuación y clasificación
function calculateStandingsFromMatches(matches, teams) {
  const standings = teams.map(team => ({
    team_id: team.team_id,
    team_name: team.team_name,
    player1_name: team.player1_name,
    player2_name: team.player2_name,
    matches_played: 0,
    matches_won: 0,
    matches_lost: 0,
    sets_won: 0,
    sets_lost: 0,
    games_won: 0,
    games_lost: 0,
    points: 0,
    games_diff: 0,
    sets_diff: 0
  }));
  
  // Procesar cada partido
  matches.forEach(match => {
    if (match.status === 'completed' && match.home_sets_won !== null && match.away_sets_won !== null) {
      const homeTeam = standings.find(s => s.team_id === match.home_team_id);
      const awayTeam = standings.find(s => s.team_id === match.away_team_id);
      
      if (homeTeam && awayTeam) {
        homeTeam.matches_played++;
        awayTeam.matches_played++;
        
        homeTeam.sets_won += match.home_sets_won;
        homeTeam.sets_lost += match.away_sets_won;
        awayTeam.sets_won += match.away_sets_won;
        awayTeam.sets_lost += match.home_sets_won;
        
        homeTeam.games_won += match.home_games_won;
        homeTeam.games_lost += match.away_games_won;
        awayTeam.games_won += match.away_games_won;
        awayTeam.games_lost += match.home_games_won;
        
        // Determinar ganador
        if (match.home_sets_won > match.away_sets_won) {
          homeTeam.matches_won++;
          awayTeam.matches_lost++;
          homeTeam.points += 3; // 3 puntos por victoria
        } else if (match.away_sets_won > match.home_sets_won) {
          awayTeam.matches_won++;
          homeTeam.matches_lost++;
          awayTeam.points += 3;
        }
      }
    }
  });
  
  // Calcular diferencias
  standings.forEach(team => {
    team.games_diff = team.games_won - team.games_lost;
    team.sets_diff = team.sets_won - team.sets_lost;
  });
  
  // Ordenar por criterios de clasificación
  standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.sets_diff !== b.sets_diff) return b.sets_diff - a.sets_diff;
    if (a.games_diff !== b.games_diff) return b.games_diff - a.games_diff;
    if (a.sets_won !== b.sets_won) return b.sets_won - a.sets_won;
    if (a.games_won !== b.games_won) return b.games_won - a.games_won;
    return 0;
  });
  
  return standings;
}
```

---

## 🔌 **ENDPOINTS DE API COMPLETOS**

### **BASE URL:** `http://localhost:9999`

### **AUTENTICACIÓN:**
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Admin endpoints:** Requieren `verifyAdmin` middleware

---

### **1. GESTIÓN DE TORNEOS**

#### **GET /tournaments**
```javascript
// Obtener todos los torneos
const response = await fetch('http://localhost:9999/tournaments');
const tournaments = await response.json();

// Response:
[
  {
    id: "uuid",
    name: "Torneo de Verano",
    start_date: "2024-01-15",
    end_date: "2024-01-17",
    tournament_type: "NINE_PLAYERS",
    status: "upcoming",
    courts_available: 4,
    time_slots: [...],
    group_time_slots: [...],
    tournament_teams: [...],
    tournament_info: {...}
  }
]
```

#### **GET /tournaments/:id**
```javascript
// Obtener torneo específico
const response = await fetch('http://localhost:9999/tournaments/uuid');
const tournament = await response.json();
```

#### **POST /tournaments/create** (Admin)
```javascript
// Crear nuevo torneo
const response = await fetch('http://localhost:9999/tournaments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_token>'
  },
  body: JSON.stringify({
    name: "Torneo de Verano",
    categories: ["category_uuid_1", "category_uuid_2"],
    start_date: "2024-01-15",
    end_date: "2024-01-17",
    courts_available: 4,
    time_slots: [
      { start: "18:00", end: "21:00", label: "Viernes Tarde" },
      { start: "22:00", end: "24:00", label: "Viernes Noche" }
    ],
    group_time_slots: [
      {
        id: "slot_1",
        tournament_day: 1,
        start: "18:00",
        end: "21:00",
        label: "Viernes Tarde",
        date: "2024-01-15"
      }
    ],
    tournament_type: "NINE_PLAYERS",
    description: "Torneo de verano 2024",
    rules: "Reglas del torneo...",
    tournament_location: "Club de Pádel",
    tournament_address: "Av. Principal 123",
    tournament_club_name: "Club Recrea",
    signup_limit_date: "2024-01-10",
    inscription_cost: 5000,
    sponsors: ["sponsor_1", "sponsor_2"],
    tournament_thumbnail: "image_url",
    first_place_prize: "Trofeo + $50,000",
    second_place_prize: "Medalla + $25,000",
    third_place_prize: "Medalla + $15,000"
  })
});
```

#### **PUT /tournaments/:id** (Admin)
```javascript
// Actualizar torneo
const response = await fetch('http://localhost:9999/tournaments/uuid', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_token>'
  },
  body: JSON.stringify({
    name: "Torneo Actualizado",
    courts_available: 6,
    // ... otros campos
  })
});
```

#### **DELETE /tournaments/:id** (Admin)
```javascript
// Eliminar torneo
const response = await fetch('http://localhost:9999/tournaments/uuid', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer <admin_token>'
  }
});
```

#### **PUT /tournaments/:id/change-type** (Admin)
```javascript
// Cambiar tipo de torneo
const response = await fetch('http://localhost:9999/tournaments/uuid/change-type', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin_token>'
  },
  body: JSON.stringify({
    new_tournament_type: "TWELVE_PLAYERS" // NINE_PLAYERS, TWELVE_PLAYERS, SIXTEEN_PLAYERS
  })
});

// Response:
{
  message: "Tipo de torneo cambiado exitosamente",
  tournament: {
    id: "uuid",
    name: "Torneo",
    old_type: "NINE_PLAYERS",
    new_type: "TWELVE_PLAYERS",
    old_max_teams: 9,
    new_max_teams: 12
  },
  impact: {
    message: "Cupos recalculados automáticamente",
    new_capacity: 12,
    available_for_registration: true
  }
}
```

---

### **2. REGISTRO DE EQUIPOS**

#### **POST /tournaments/:id/join**
```javascript
// Registrar equipo en torneo
const response = await fetch('http://localhost:9999/tournaments/uuid/join', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    team_id: "team_uuid",
    unavailable_times: "slot_id" // ID del time slot no disponible
  })
});

// Response:
{
  message: "Equipo registrado exitosamente",
  team: {
    team_id: "team_uuid",
    tournament_id: "tournament_uuid",
    unavailable_times: "slot_id"
  },
  availability: {
    total_capacity: 12,
    selected_count: 5,
    available: true,
    remaining_slots: 7
  }
}
```

---

### **3. GESTIÓN DE GRUPOS**

#### **POST /tournaments/:id/generate-groups-automatic** (Admin)
```javascript
// Generar grupos automáticamente
const response = await fetch('http://localhost:9999/tournaments/uuid/generate-groups-automatic', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin_token>'
  }
});

// Response:
{
  message: "Grupos generados exitosamente",
  groups: [
    {
      group_number: 1,
      teams: [
        {
          team_id: "team_1",
          team_name: "Equipo A",
          player1_name: "Juan Pérez",
          player2_name: "María García"
        }
      ],
      restriction_slots: ["slot_1"],
      matches: [
        {
          home_team_id: "team_1",
          away_team_id: "team_2",
          group_number: 1
        }
      ]
    }
  ],
  total_groups: 3,
  teams_per_group: 3
}
```

#### **GET /tournaments/:id/groups**
```javascript
// Obtener grupos del torneo
const response = await fetch('http://localhost:9999/tournaments/uuid/groups');
const groups = await response.json();
```

---

### **4. PROGRAMACIÓN DE PARTIDOS**

#### **POST /tournaments/:id/schedule-matches-by-group** (Admin)
```javascript
// Programar partidos por grupo y día
const response = await fetch('http://localhost:9999/tournaments/uuid/schedule-matches-by-group', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin_token>'
  }
});

// Response:
{
  message: "Partidos programados exitosamente",
  scheduled_matches: [
    {
      id: "match_uuid",
      group_name: "Grupo 1",
      home_team_name: "Equipo A",
      away_team_name: "Equipo B",
      scheduled_date: "2024-01-15",
      scheduled_time: "18:00",
      assigned_court: "court_uuid",
      assigned_court_name: "Cancha 1",
      slot_info: {
        id: "slot_1",
        label: "Viernes Tarde",
        start: "18:00",
        end: "21:00"
      }
    }
  ],
  total_scheduled: 9,
  conflicts_avoided: [
    "Evitado conflicto grupo 1: slot_2",
    "Evitado conflicto grupo 2: slot_3"
  ]
}
```

---

### **5. STANDINGS Y RESULTADOS**

#### **GET /tournaments/:id/group-standings/:groupNumber**
```javascript
// Obtener standings de un grupo específico
const response = await fetch('http://localhost:9999/tournaments/uuid/group-standings/1');
const standings = await response.json();

// Response:
{
  message: "Standings obtenidos exitosamente",
  group_info: {
    group_number: 1,
    tournament_id: "uuid",
    total_teams: 3
  },
  standings: [
    {
      team_id: "team_1",
      team_name: "Equipo A",
      player1_name: "Juan Pérez",
      player2_name: "María García",
      matches_played: 2,
      matches_won: 2,
      matches_lost: 0,
      sets_won: 4,
      sets_lost: 0,
      games_won: 24,
      games_lost: 12,
      points: 6,
      games_diff: 12,
      sets_diff: 4,
      position: 1,
      qualification_status: "group_winner"
    }
  ],
  qualification_rules: {
    group_winner: "Pasa directo a eliminatorias",
    group_second: "Pasa a eliminatorias si es mejor segundo"
  }
}
```

#### **GET /tournaments/:id/matches**
```javascript
// Obtener todos los partidos del torneo
const response = await fetch('http://localhost:9999/tournaments/uuid/matches');
const matches = await response.json();

// Response:
[
  {
    id: "match_uuid",
    tournament_id: "uuid",
    home_team_id: "team_1",
    away_team_id: "team_2",
    group_id: "group_uuid",
    group_number: 1,
    match_day: "2024-01-15",
    start_time: "18:00",
    court_id: "court_uuid",
    status: "scheduled", // scheduled, completed, cancelled
    home_sets_won: null,
    away_sets_won: null,
    home_games_won: null,
    away_games_won: null
  }
]
```

---

### **6. DISPONIBILIDAD DE TIME SLOTS**

#### **GET /tournaments/:id/available-time-slots**
```javascript
// Obtener time slots disponibles para registro
const response = await fetch('http://localhost:9999/tournaments/uuid/available-time-slots');
const availability = await response.json();

// Response:
{
  message: "Time slots disponibles obtenidos",
  tournament_info: {
    tournament_type: "NINE_PLAYERS",
    max_teams: 9,
    courts_available: 4,
    total_categories: 1
  },
  time_slots: [
    {
      slot_id: "slot_1",
      label: "Viernes Tarde",
      start: "18:00",
      end: "21:00",
      capacity: {
        total_capacity: 3,
        selected_count: 2,
        available: true,
        remaining_slots: 1,
        percentage_full: 67
      },
      teams: [
        {
          team_id: "team_1",
          player1_name: "Juan Pérez",
          player2_name: "María García"
        }
      ]
    }
  ],
  total_teams_across_categories: 9,
  total_capacity: 12
}
```

---

### **7. BRACKETS DE ELIMINACIÓN**

#### **POST /tournaments/:id/generate-elimination-bracket** (Admin)
```javascript
// Generar bracket de eliminación
const response = await fetch('http://localhost:9999/tournaments/uuid/generate-elimination-bracket', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin_token>'
  }
});

// Response:
{
  message: "Bracket de eliminación generado exitosamente",
  bracket: {
    format: "NINE_PLAYERS",
    total_teams: 4,
    structure: {
      semifinals: [
        {
          match_id: "SF1",
          round: "semifinals",
          match_number: 1,
          team1: {
            team_id: "team_1",
            team_name: "Equipo A",
            qualification_type: "group_winner"
          },
          team2: {
            team_id: "team_4",
            team_name: "Equipo D",
            qualification_type: "best_second"
          },
          winner: null,
          status: "pending"
        }
      ],
      final: [
        {
          match_id: "F1",
          round: "final",
          match_number: 1,
          team1: null,
          team2: null,
          winner: null,
          status: "pending",
          depends_on: ["SF1", "SF2"]
        }
      ]
    },
    advancement_rules: {
      semifinals: "Ganadores avanzan a Final",
      final: "Ganador es Campeón"
    }
  }
}
```

---

## 🎯 **EJEMPLOS DE USO EN FRONTEND**

### **1. COMPONENTE DE REGISTRO DE TORNEO:**

```tsx
// components/TournamentRegistration.tsx
import { useState, useEffect } from 'react';

interface TournamentRegistrationProps {
  tournamentId: string;
  teamId: string;
}

export function TournamentRegistration({ tournamentId, teamId }: TournamentRegistrationProps) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableTimeSlots();
  }, [tournamentId]);

  const fetchAvailableTimeSlots = async () => {
    try {
      const response = await fetch(`http://localhost:9999/tournaments/${tournamentId}/available-time-slots`);
      const data = await response.json();
      setTimeSlots(data.time_slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const handleRegistration = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:9999/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_id: teamId,
          unavailable_times: selectedSlot
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Registro exitoso!');
        fetchAvailableTimeSlots(); // Refresh availability
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Error al registrar equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Registrar en Torneo</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Seleccionar horario no disponible:</label>
        <select 
          value={selectedSlot} 
          onChange={(e) => setSelectedSlot(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Seleccionar horario...</option>
          {timeSlots.map(slot => (
            <option key={slot.slot_id} value={slot.slot_id}>
              {slot.label} - {slot.capacity.remaining_slots} cupos disponibles
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleRegistration}
        disabled={!selectedSlot || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
      >
        {loading ? 'Registrando...' : 'Registrar Equipo'}
      </button>
    </div>
  );
}
```

### **2. COMPONENTE DE STANDINGS:**

```tsx
// components/GroupStandings.tsx
import { useState, useEffect } from 'react';

interface GroupStandingsProps {
  tournamentId: string;
  groupNumber: number;
}

export function GroupStandings({ tournamentId, groupNumber }: GroupStandingsProps) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, [tournamentId, groupNumber]);

  const fetchStandings = async () => {
    try {
      const response = await fetch(`http://localhost:9999/tournaments/${tournamentId}/group-standings/${groupNumber}`);
      const data = await response.json();
      setStandings(data.standings);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando standings...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Grupo {groupNumber} - Standings</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Pos</th>
              <th className="border border-gray-300 px-4 py-2">Equipo</th>
              <th className="border border-gray-300 px-4 py-2">PJ</th>
              <th className="border border-gray-300 px-4 py-2">PG</th>
              <th className="border border-gray-300 px-4 py-2">PP</th>
              <th className="border border-gray-300 px-4 py-2">Sets</th>
              <th className="border border-gray-300 px-4 py-2">Juegos</th>
              <th className="border border-gray-300 px-4 py-2">Pts</th>
              <th className="border border-gray-300 px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.team_id} className={index < 2 ? 'bg-green-50' : ''}>
                <td className="border border-gray-300 px-4 py-2 font-semibold">
                  {team.position}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <div>
                    <div className="font-medium">{team.team_name}</div>
                    <div className="text-sm text-gray-600">
                      {team.player1_name} / {team.player2_name}
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {team.matches_played}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {team.matches_won}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {team.matches_lost}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {team.sets_won}-{team.sets_lost}
                  <div className="text-sm text-gray-600">
                    ({team.sets_diff > 0 ? '+' : ''}{team.sets_diff})
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {team.games_won}-{team.games_lost}
                  <div className="text-sm text-gray-600">
                    ({team.games_diff > 0 ? '+' : ''}{team.games_diff})
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {team.points}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    team.qualification_status === 'group_winner' 
                      ? 'bg-green-100 text-green-800' 
                      : team.qualification_status === 'group_second'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {team.qualification_status === 'group_winner' ? 'Clasificado' : 
                     team.qualification_status === 'group_second' ? 'En espera' : 'Eliminado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### **3. COMPONENTE DE ADMIN - PROGRAMACIÓN:**

```tsx
// components/AdminMatchScheduling.tsx
import { useState } from 'react';

interface AdminMatchSchedulingProps {
  tournamentId: string;
}

export function AdminMatchScheduling({ tournamentId }: AdminMatchSchedulingProps) {
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const scheduleMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:9999/tournaments/${tournamentId}/schedule-matches-by-group`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer <admin_token>'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setScheduledMatches(result.scheduled_matches);
        alert(`Partidos programados exitosamente! ${result.total_scheduled} partidos programados`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error scheduling matches:', error);
      alert('Error al programar partidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Programación de Partidos</h3>
        <button
          onClick={scheduleMatches}
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Programando...' : 'Programar Partidos'}
        </button>
      </div>

      {scheduledMatches.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Partidos Programados:</h4>
          <div className="grid gap-2">
            {scheduledMatches.map(match => (
              <div key={match.id} className="p-3 border rounded-md bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{match.group_name}</span>
                    <span className="ml-2 text-gray-600">
                      {match.home_team_name} vs {match.away_team_name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {match.scheduled_date} {match.scheduled_time} - {match.assigned_court_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 **CONSIDERACIONES IMPORTANTES**

### **1. MANEJO DE ERRORES:**
- Siempre verificar `response.ok` antes de procesar datos
- Mostrar mensajes de error claros al usuario
- Implementar retry logic para requests fallidos

### **2. ESTADO DE CARGA:**
- Mostrar indicadores de carga durante requests
- Deshabilitar botones durante operaciones
- Usar skeletons para mejor UX

### **3. VALIDACIONES:**
- Validar datos antes de enviar requests
- Verificar disponibilidad antes de registrar
- Confirmar acciones críticas (eliminar, cambiar tipo)

### **4. OPTIMIZACIONES:**
- Cachear datos que no cambian frecuentemente
- Usar React Query para data fetching
- Implementar paginación para listas grandes

### **5. SEGURIDAD:**
- Nunca exponer tokens en el frontend
- Validar permisos antes de mostrar opciones admin
- Sanitizar inputs del usuario

---

## 🚀 **PRÓXIMOS PASOS**

1. **Implementar autenticación** con JWT
2. **Crear componentes reutilizables** para torneos
3. **Implementar real-time updates** con WebSockets
4. **Agregar validaciones** de formularios
5. **Implementar testing** con Jest/React Testing Library

**¡Este contexto te dará todo lo necesario para implementar el frontend con las mejores prácticas!** 🎾✨
