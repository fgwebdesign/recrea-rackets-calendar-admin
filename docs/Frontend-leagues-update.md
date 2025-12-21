# 🎾 Mejoras Frontend - Ligas Multi-Sede y Horarios Flexibles

## 📋 Resumen de Cambios en el Backend

El backend ahora soporta:
- **Multi-sede**: Una liga puede tener múltiples sedes con canchas específicas
- **Horarios flexibles**: El admin puede definir los horarios disponibles (ya no hardcodeados)
- **Configuración avanzada**: Tipo de liga, vueltas, frecuencia, etc.

---

## 🖼️ Análisis del Frontend Actual

### Paso 1 de 3 - Información Básica (ACTUAL):
```
✅ Nombre de la Liga
✅ Categorías (Cuarta, Quinta, Sexta, Tercera) - toggle buttons
✅ Descripción
✅ Imagen de la Liga (drag & drop)
✅ Costo de Inscripción  
✅ Número de equipos por categoría
```

### Paso 2 de 3 - Configuración (ACTUAL):
```
✅ Días disponibles (Lunes-Domingo) - botones
✅ Asignación de días por categoría (drag & drop)
✅ Frecuencia (dropdown: Quincenal)
✅ Fecha de Inicio / Fecha de Fin
⚠️ Canchas Disponibles (muestra canchas sueltas, SIN sedes)
```

### ❌ Lo que FALTA agregar:
```
🆕 Selector de SEDES (no solo canchas)
🆕 Horarios específicos (match_times: ["21:30", "22:15"])
🆕 Canchas por horario (courts_per_time_slot)
🆕 Tipo de liga (round_robin, knockout, groups)
🆕 Vueltas (1 = ida, 2 = ida/vuelta)
🆕 CRUD completo de SEDES
```

---

## 🏢 NUEVO: CRUD de Sedes (Venues)

### Página: `/admin/venues` o `/configuraciones/sedes`

Antes de crear ligas, el admin debe poder gestionar las sedes del club.

### API Endpoints Disponibles:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/venues` | Listar todas las sedes |
| GET | `/venues/:id` | Obtener sede por ID |
| POST | `/venues` | Crear nueva sede |
| PUT | `/venues/:id` | Actualizar sede |
| DELETE | `/venues/:id` | Soft delete sede |
| GET | `/venues/:venueId/courts` | Canchas de una sede |

### Componente: `VenuesPage` (Nueva página)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏢 Gestión de Sedes                              [+ Nueva Sede]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🏟️ Sede Principal                           ⭐ Por defecto   │  │
│  │ 📍 Dirección por configurar                                  │  │
│  │ 🎾 2 canchas: Monster, Redbull                               │  │
│  │                                                              │  │
│  │                               [Ver Canchas] [Editar] [🗑️]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🏟️ Sede Centro                                              │  │
│  │ 📍 Av. Principal 1234, Montevideo                           │  │
│  │ 🎾 2 canchas: Gatorade, Powerade                             │  │
│  │                                                              │  │
│  │                               [Ver Canchas] [Editar] [🗑️]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Componente: `CreateVenueModal` o `VenueForm`

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏢 Nueva Sede                                              [✕]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Nombre de la Sede *                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Ej: Sede Centro                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Dirección *                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Av. Principal 1234                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Ciudad *                     Estado/Departamento                   │
│  ┌────────────────────────┐   ┌────────────────────────┐           │
│  │ Montevideo             │   │ Montevideo             │           │
│  └────────────────────────┘   └────────────────────────┘           │
│                                                                     │
│  Teléfono                     Email                                 │
│  ┌────────────────────────┐   ┌────────────────────────┐           │
│  │ +598 99 123 456        │   │ sede@club.com          │           │
│  └────────────────────────┘   └────────────────────────┘           │
│                                                                     │
│  Descripción                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Nuestra sede ubicada en el centro de la ciudad...          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ☐ Establecer como sede por defecto                                │
│                                                                     │
│  ───────────────────────────────────────────────────────────────   │
│                                                                     │
│  🎾 Canchas de esta sede                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ (Las canchas se asignan desde la sección Canchas)           │  │
│  │ Ir a Canchas →                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                        [Cancelar]  [Guardar Sede]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Payload para crear sede:

```json
{
  "name": "Sede Centro",
  "address": "Av. Principal 1234",
  "city": "Montevideo",
  "state": "Montevideo",
  "country": "Uruguay",
  "phone": "+598 99 123 456",
  "email": "centro@recreapadelclub.com",
  "description": "Nuestra sede principal...",
  "is_default": false,
  "opening_hours": {
    "monday": { "open": "08:00", "close": "23:00" },
    "tuesday": { "open": "08:00", "close": "23:00" },
    "wednesday": { "open": "08:00", "close": "23:00" },
    "thursday": { "open": "08:00", "close": "23:00" },
    "friday": { "open": "08:00", "close": "23:00" },
    "saturday": { "open": "09:00", "close": "22:00" },
    "sunday": { "open": "10:00", "close": "20:00" }
  },
  "amenities": ["estacionamiento", "vestuarios", "cafeteria"]
}
```

---

## 🎾 MODIFICAR: Página de Canchas

### Cambio principal: Agregar selector de SEDE al crear/editar cancha

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎾 Nueva Cancha                                            [✕]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Nombre de la Cancha *                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Cancha Monster                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🆕 Sede *                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Sede Principal                                          ▼   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Imagen de la Cancha                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              [Drag & Drop o Click]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                      [Cancelar]  [Guardar Cancha]   │
└─────────────────────────────────────────────────────────────────────┘
```

### API para crear cancha:

```json
{
  "name": "Cancha Monster",
  "venue_id": "uuid-de-la-sede"  // 🆕 NUEVO CAMPO
}
```

---

## 🔄 Nuevos Campos del API

### Endpoint: `POST /leagues/createLeague`

```typescript
interface CreateLeaguePayload {
  // Campos existentes
  name: string;
  categories: string[];           // Array de category_ids
  start_date: string;             // "2025-03-01"
  end_date: string;               // "2025-06-30"
  courts_available: number;       // Total de canchas
  time_slots: number[][];         // [[21, 24]] - Rango horario
  team_size: number;              // Cupos máximos (ej: 8)
  inscription_cost: number;       // Costo en pesos
  description: string;
  image_url?: string;
  
  // Días de juego por categoría
  category_days: Record<string, string>;  // { "uuid": "monday" }
  
  // ====== NUEVOS CAMPOS ======
  
  // Horarios específicos de partidos
  match_times: string[];          // ["21:30", "22:15", "23:00"]
  
  // Canchas que se usan en paralelo por horario
  courts_per_time_slot: number;   // 2
  
  // Tipo de competencia
  league_type: 'round_robin' | 'knockout' | 'groups' | 'custom';
  
  // Vueltas (1 = solo ida, 2 = ida y vuelta)
  rounds: 1 | 2;
  
  // Frecuencia de partidos
  frequency: 'semanal' | 'quincenal' | 'mensual';
  
  // Multi-sede
  venues: VenueConfig[];
}

interface VenueConfig {
  venue_id: string;
  court_ids: string[];
  is_primary: boolean;
}
```

---

## 📝 MODIFICAR: Formulario Crear Liga

### Estructura ACTUAL (3 pasos):
```
Paso 1: Información Básica ✅
Paso 2: Días y Canchas ⚠️ (necesita cambios)
Paso 3: ??? (no visible en capturas)
```

### Estructura NUEVA propuesta (4 pasos):

```
Paso 1: Información Básica (MANTENER + agregar campos)
Paso 2: Días y Frecuencia (MANTENER)
Paso 3: 🆕 Sedes y Canchas (NUEVO - reemplaza "Canchas Disponibles")
Paso 4: 🆕 Horarios y Configuración Avanzada (NUEVO)
```

---

## 📄 PASO 1: Información Básica (MODIFICAR)

### Campos actuales ✅:
- Nombre de la Liga
- Categorías (toggle buttons)
- Descripción
- Imagen
- Costo de Inscripción
- Número de equipos por categoría

### 🆕 Agregar estos campos:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Paso 1 de 4 ═══════════════════════════════░░░░░░░░░░░░░░  25%    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ... campos existentes ...                                          │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  🆕 Tipo de Competencia ⓘ                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ● Todos contra todos (Round Robin)                           │  │
│  │ ○ Eliminación directa                                        │  │
│  │ ○ Fase de grupos + Playoffs                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  🆕 Vueltas ⓘ                                                      │
│  ┌───────────────────┐  ┌───────────────────┐                      │
│  │   ● Solo Ida      │  │   ○ Ida y Vuelta  │                      │
│  └───────────────────┘  └───────────────────┘                      │
│  ℹ️ Con 8 equipos: Ida = 7 fechas, Ida/Vuelta = 14 fechas          │
│                                                                     │
│                                                      [Continuar →]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 PASO 2: Días y Frecuencia (MANTENER)

Este paso está bien como está:
- Días disponibles
- Asignación de días por categoría (drag & drop)
- Frecuencia
- Fechas inicio/fin

### 🆕 Pequeña mejora - Mover el selector de frecuencia ARRIBA:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Paso 2 de 4 ═══════════════════════════════════════════░░░░  50%  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Fechas de la Liga                                                  │
│  ┌────────────────────────┐   ┌────────────────────────┐           │
│  │ Fecha Inicio           │   │ Fecha Fin              │           │
│  │ 01/03/2025         📅  │   │ 30/06/2025         📅  │           │
│  └────────────────────────┘   └────────────────────────┘           │
│                                                                     │
│  Frecuencia de Partidos ⓘ                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Quincenal (cada 14 días)                                ▼   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ... resto del paso 2 actual (días por categoría) ...              │
│                                                                     │
│                                          [← Atrás]  [Continuar →]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 PASO 3: 🆕 Sedes y Canchas (NUEVO)

### Este paso REEMPLAZA "Canchas Disponibles" del paso 2 actual

```
┌─────────────────────────────────────────────────────────────────────┐
│  Paso 3 de 4 ═══════════════════════════════════════════════░░ 75% │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🏢 Seleccionar Sedes y Canchas                                     │
│                                                                     │
│  Selecciona las sedes donde se jugará la liga y las canchas        │
│  disponibles de cada sede.                                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☑️ Sede Principal                           ⭐ Sede Primaria │  │
│  │    📍 Montevideo                                             │  │
│  │                                                              │  │
│  │    Canchas:                                                  │  │
│  │    ☑️ Cancha Monster                                         │  │
│  │    ☑️ Cancha Redbull                                         │  │
│  │                                                              │  │
│  │    ────────────────────────────────────────────────────────  │  │
│  │    2 canchas seleccionadas                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☑️ Sede Centro                              ○ Sede Primaria  │  │
│  │    📍 Av. Principal 1234, Montevideo                        │  │
│  │                                                              │  │
│  │    Canchas:                                                  │  │
│  │    ☑️ Cancha Gatorade                                        │  │
│  │    ☑️ Cancha Powerade                                        │  │
│  │                                                              │  │
│  │    ────────────────────────────────────────────────────────  │  │
│  │    2 canchas seleccionadas                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☐ Sede Sur                                  ○ Sede Primaria  │  │
│  │    📍 Ruta 5 km 12                                           │  │
│  │    (click para expandir)                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  📊 Resumen: 2 sedes, 4 canchas seleccionadas                      │
│                                                                     │
│  ⚠️ ¿No encuentras tu sede? [Crear nueva sede →]                   │
│                                                                     │
│                                          [← Atrás]  [Continuar →]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 PASO 4: 🆕 Horarios y Resumen (NUEVO)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Paso 4 de 4 ══════════════════════════════════════════════════ 99%│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ⏰ Horarios de Partidos                                            │
│                                                                     │
│  Define los horarios en los que se jugarán los partidos:            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │  │
│  │  │  21:30  │  │  22:15  │  │  23:00  │  [+ Agregar horario] │  │
│  │  │    ✕    │  │    ✕    │  │    ✕    │                      │  │
│  │  └─────────┘  └─────────┘  └─────────┘                      │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Canchas simultáneas por horario ⓘ                                 │
│  ┌──────────────────────────────────┐                              │
│  │  2                           ▼   │                              │
│  └──────────────────────────────────┘                              │
│  ℹ️ Cuántas canchas se usan al mismo tiempo en cada horario        │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📊 RESUMEN DE LA LIGA                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  📛 Liga Verano 2025                                         │  │
│  │  📅 01/03/2025 - 30/06/2025                                  │  │
│  │  🔄 Frecuencia: Quincenal                                    │  │
│  │  🏆 Tipo: Todos contra todos (Ida)                           │  │
│  │                                                              │  │
│  │  📋 4 categorías: Cuarta (Lun), Quinta (Mar),                │  │
│  │                   Sexta (Mié), Tercera (Jue)                 │  │
│  │                                                              │  │
│  │  🏢 2 sedes: Sede Principal ⭐, Sede Centro                  │  │
│  │  🎾 4 canchas totales                                        │  │
│  │                                                              │  │
│  │  ⏰ 3 horarios: 21:30, 22:15, 23:00                          │  │
│  │  📊 Capacidad: 6 partidos por fecha                          │  │
│  │     (3 horarios × 2 canchas)                                 │  │
│  │                                                              │
│  │  💰 Inscripción: $800                                        │  │
│  │  👥 8 equipos por categoría                                  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                          [← Atrás]  [Crear Liga ✓]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Componentes a Modificar/Crear

### 1. `CreateLeagueForm` (Principal)

#### Estructura sugerida en pasos/wizard:

```
Paso 1: Información Básica
├── Nombre de la liga
├── Descripción  
├── Fechas (inicio/fin)
├── Imagen (opcional)
└── Costo de inscripción

Paso 2: Configuración de Competencia
├── Tipo de liga (dropdown)
├── Cantidad de equipos
├── Vueltas (1 o 2)
└── Frecuencia (semanal/quincenal/mensual)

Paso 3: Categorías y Días de Juego
├── Selector de categorías (checkboxes/multiselect)
└── Para cada categoría seleccionada:
    └── Selector de día de juego (lunes-viernes)

Paso 4: Horarios de Partidos
├── Lista de horarios disponibles
├── Botón "Agregar horario" (TimePicker)
├── Canchas por horario (input number)
└── Preview: "Con 3 horarios × 2 canchas = 6 partidos por fecha"

Paso 5: Sedes y Canchas
├── Lista de sedes disponibles
├── Para cada sede seleccionada:
│   ├── Checkbox de canchas de esa sede
│   └── Radio "Sede Principal"
└── Resumen de canchas seleccionadas
```

---

### 2. `VenueSelector` (Nuevo Componente)

```tsx
interface VenueSelectorProps {
  selectedVenues: VenueConfig[];
  onChange: (venues: VenueConfig[]) => void;
}

// Funcionalidades:
// - Listar todas las sedes activas (GET /venues)
// - Al seleccionar sede, cargar sus canchas (GET /venues/:id/courts)
// - Permitir seleccionar canchas individuales
// - Solo una sede puede ser "primaria"
// - Mostrar resumen de canchas totales
```

#### UI Sugerida:

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Sedes Disponibles                                    │
├─────────────────────────────────────────────────────────┤
│ ☑️ Sede Principal                      ⭐ Primaria      │
│    ├── ☑️ Cancha Monster                                │
│    └── ☑️ Cancha Redbull                                │
│                                                         │
│ ☑️ Sede Centro                         ○ Primaria      │
│    ├── ☑️ Cancha Gatorade                               │
│    └── ☐ Cancha Powerade                                │
├─────────────────────────────────────────────────────────┤
│ 📊 Total: 3 canchas seleccionadas en 2 sedes           │
└─────────────────────────────────────────────────────────┘
```

---

### 3. `MatchTimesEditor` (Nuevo Componente)

```tsx
interface MatchTimesEditorProps {
  matchTimes: string[];
  courtsPerSlot: number;
  onChange: (times: string[], courtsPerSlot: number) => void;
}

// Funcionalidades:
// - Agregar/eliminar horarios (formato HH:MM)
// - Input para canchas por horario
// - Mostrar cálculo de capacidad
```

#### UI Sugerida:

```
┌─────────────────────────────────────────────────────────┐
│ ⏰ Horarios de Partidos                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Horarios disponibles:                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │  21:30   │ │  22:15   │ │  23:00   │  [+ Agregar]    │
│ │    ✕     │ │    ✕     │ │    ✕     │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│                                                         │
│ Canchas por horario: [  2  ] ▼                         │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ 📊 Capacidad: 3 horarios × 2 canchas = 6 partidos/fecha│
└─────────────────────────────────────────────────────────┘
```

---

### 4. `LeagueTypeSelector` (Nuevo Componente)

```tsx
interface LeagueTypeSelectorProps {
  leagueType: string;
  rounds: number;
  frequency: string;
  onChange: (config: LeagueTypeConfig) => void;
}
```

#### UI Sugerida:

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Configuración de Competencia                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tipo de liga:                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ● Todos contra todos (Round Robin)                  │ │
│ │ ○ Eliminación directa (Knockout)                    │ │
│ │ ○ Fase de grupos + Playoffs                         │ │
│ │ ○ Personalizado                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Vueltas:           Frecuencia:                          │
│ ┌───────────────┐  ┌───────────────┐                   │
│ │ ● Solo ida   │  │ ○ Semanal     │                   │
│ │ ○ Ida/vuelta │  │ ● Quincenal   │                   │
│ └───────────────┘  │ ○ Mensual     │                   │
│                    └───────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

### 5. `CategoryDayAssigner` (Mejorar existente)

```tsx
interface CategoryDayAssignerProps {
  categories: Category[];
  selectedCategories: string[];
  categoryDays: Record<string, string>;
  onChange: (categoryDays: Record<string, string>) => void;
}
```

#### UI Sugerida:

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Asignar días de juego                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑️ Cuarta         ───────────►  [Lunes      ▼]         │
│ ☑️ Quinta         ───────────►  [Martes     ▼]         │
│ ☑️ Sexta          ───────────►  [Miércoles  ▼]         │
│ ☑️ Tercera        ───────────►  [Jueves     ▼]         │
│                                                         │
│ ⚠️ Cada categoría jugará en su día asignado            │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Validaciones Frontend

### Paso 1 - Información Básica:
```typescript
const step1Validation = {
  name: { required: true, minLength: 3, maxLength: 100 },
  description: { required: true, minLength: 10 },
  start_date: { required: true, futureDate: true },
  end_date: { required: true, afterStartDate: true },
  inscription_cost: { required: true, min: 0 }
};
```

### Paso 2 - Configuración:
```typescript
const step2Validation = {
  league_type: { required: true, oneOf: ['round_robin', 'knockout', 'groups', 'custom'] },
  team_size: { required: true, min: 4, max: 32 },
  rounds: { required: true, oneOf: [1, 2] },
  frequency: { required: true, oneOf: ['semanal', 'quincenal', 'mensual'] }
};
```

### Paso 3 - Categorías:
```typescript
const step3Validation = {
  categories: { required: true, minItems: 1 },
  category_days: { 
    required: true,
    // Cada categoría seleccionada debe tener un día asignado
    allCategoriesHaveDay: (categories, days) => 
      categories.every(cat => days[cat] !== undefined)
  }
};
```

### Paso 4 - Horarios:
```typescript
const step4Validation = {
  match_times: { 
    required: true, 
    minItems: 1,
    format: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/ // HH:MM
  },
  courts_per_time_slot: { required: true, min: 1, max: 10 }
};
```

### Paso 5 - Sedes:
```typescript
const step5Validation = {
  venues: { 
    required: true, 
    minItems: 1,
    // Validar que cada sede tenga al menos una cancha
    allVenuesHaveCourts: (venues) => 
      venues.every(v => v.court_ids.length > 0),
    // Validar que solo haya una sede primaria
    onlyOnePrimary: (venues) => 
      venues.filter(v => v.is_primary).length === 1
  }
};
```

---

## 📡 Llamadas al API

### Obtener Sedes:
```typescript
// GET /venues
const fetchVenues = async () => {
  const response = await api.get('/venues');
  return response.data; // Array de venues
};
```

### Obtener Canchas de una Sede:
```typescript
// GET /venues/:venueId/courts
const fetchCourtsByVenue = async (venueId: string) => {
  const response = await api.get(`/venues/${venueId}/courts`);
  return response.data; // Array de courts
};
```

### Obtener Categorías:
```typescript
// GET /categories
const fetchCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};
```

### Crear Liga:
```typescript
// POST /leagues/createLeague
const createLeague = async (payload: CreateLeaguePayload) => {
  const response = await api.post('/leagues/createLeague', payload);
  return response.data;
};
```

---

## 🎨 Estados del Formulario

```typescript
interface CreateLeagueFormState {
  // Paso 1
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  inscription_cost: number;
  image_url: string;
  
  // Paso 2
  league_type: 'round_robin' | 'knockout' | 'groups' | 'custom';
  team_size: number;
  rounds: 1 | 2;
  frequency: 'semanal' | 'quincenal' | 'mensual';
  
  // Paso 3
  selectedCategories: string[];
  category_days: Record<string, string>;
  
  // Paso 4
  match_times: string[];
  courts_per_time_slot: number;
  
  // Paso 5
  venues: VenueConfig[];
  
  // UI State
  currentStep: number;
  isSubmitting: boolean;
  errors: Record<string, string>;
}
```

---

## 🔌 Hooks Sugeridos

### `useVenues`
```typescript
const useVenues = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchVenues().then(setVenues).finally(() => setLoading(false));
  }, []);
  
  return { venues, loading };
};
```

### `useCourtsByVenue`
```typescript
const useCourtsByVenue = (venueId: string | null) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (venueId) {
      setLoading(true);
      fetchCourtsByVenue(venueId).then(setCourts).finally(() => setLoading(false));
    }
  }, [venueId]);
  
  return { courts, loading };
};
```

### `useCreateLeague`
```typescript
const useCreateLeague = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const create = async (payload: CreateLeaguePayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createLeague(payload);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { create, loading, error };
};
```

---

## 📦 Payload de Ejemplo Completo

```json
{
  "name": "Liga Verano 2025",
  "categories": [
    "5f759999-52c8-44e9-a71a-ffeac4b9671c",
    "c4f7f573-6375-47dc-8e94-e21339058ba7"
  ],
  "start_date": "2025-03-01",
  "end_date": "2025-06-30",
  "courts_available": 4,
  "time_slots": [[21, 24]],
  "team_size": 8,
  "inscription_cost": 800,
  "description": "Liga de verano multi-sede",
  "category_days": {
    "5f759999-52c8-44e9-a71a-ffeac4b9671c": "monday",
    "c4f7f573-6375-47dc-8e94-e21339058ba7": "tuesday"
  },
  "match_times": ["21:30", "22:15", "23:00"],
  "courts_per_time_slot": 2,
  "league_type": "round_robin",
  "rounds": 1,
  "frequency": "quincenal",
  "venues": [
    {
      "venue_id": "0ceef497-8ae9-4639-8e81-82af6d41b8ac",
      "court_ids": [
        "6365e64d-83aa-4b4f-a895-b98f52e3c862",
        "6b62b85c-3890-470d-9d60-1aa9225cfb16"
      ],
      "is_primary": true
    },
    {
      "venue_id": "ce89bae8-b572-4e05-af52-4c263b9d76df",
      "court_ids": [
        "b5de25eb-560e-439f-b36a-3d565c20f05a",
        "fe4aca80-c451-4ba5-b020-e7dd5f1a697e"
      ],
      "is_primary": false
    }
  ]
}
```

---

## 🎯 Respuesta del API

```json
{
  "message": "Ligas creadas exitosamente",
  "ligas": [
    {
      "id": "uuid-liga-1",
      "name": "Liga Verano 2025",
      "category_id": "uuid-categoria",
      "match_times": ["21:30", "22:15", "23:00"],
      "courts_per_time_slot": 2,
      "league_type": "round_robin",
      "rounds": 1,
      "frequency": "quincenal",
      "status": "Inscribiendo",
      // ... otros campos
    }
  ],
  "venues": [
    {
      "venue_id": "uuid-sede",
      "venue_name": "Sede Principal",
      "court_ids": ["uuid-cancha-1", "uuid-cancha-2"],
      "courts_count": 2,
      "is_primary": true
    }
  ]
}
```

---

## 📝 Notas Adicionales

### Cálculo de Capacidad
```typescript
const calculateCapacity = (matchTimes: string[], courtsPerSlot: number) => {
  const matchesPerDate = matchTimes.length * courtsPerSlot;
  return {
    matchesPerDate,
    description: `${matchTimes.length} horarios × ${courtsPerSlot} canchas = ${matchesPerDate} partidos por fecha`
  };
};
```

### Frecuencia de Partidos
| Frecuencia | Días entre fechas |
|------------|-------------------|
| semanal    | 7 días           |
| quincenal  | 14 días          |
| mensual    | 28 días          |

### Tipos de Liga
| Tipo | Descripción |
|------|-------------|
| round_robin | Todos contra todos (actual) |
| knockout | Eliminación directa |
| groups | Fase de grupos + playoffs |
| custom | Configuración manual |

---

## 🚀 Orden de Implementación Sugerido

1. **Fase 1**: Componente `VenueSelector` (multi-sede)
2. **Fase 2**: Componente `MatchTimesEditor` (horarios flexibles)
3. **Fase 3**: Componente `LeagueTypeSelector` (tipo de liga)
4. **Fase 4**: Integrar todo en `CreateLeagueForm` con wizard
5. **Fase 5**: Validaciones y manejo de errores
6. **Fase 6**: Tests y polish de UX

---

## 🗂️ Menú de Navegación (Actualizar Sidebar)

### Actual:
```
├── INICIO
├── TORNEOS
├── LIGAS
│   ├── Ver Ligas
│   └── Crear Liga
├── CATEGORÍAS
├── CANCHAS          ← Modificar
├── PROFESORES
├── PATROCINADORES
├── USUARIOS
└── CONFIGURACIONES
```

### Nuevo (agregar SEDES):
```
├── INICIO
├── TORNEOS
├── LIGAS
│   ├── Ver Ligas
│   └── Crear Liga
├── CATEGORÍAS
├── 🆕 SEDES          ← NUEVO
│   ├── Ver Sedes
│   └── Crear Sede
├── CANCHAS          ← Agregar selector de sede
├── PROFESORES
├── PATROCINADORES
├── USUARIOS
└── CONFIGURACIONES
```

---

## 📁 Estructura de Archivos a Crear/Modificar

### 🆕 Archivos NUEVOS:

```
src/
├── pages/
│   └── admin/
│       └── venues/
│           ├── index.tsx           # Lista de sedes
│           ├── create.tsx          # Crear sede
│           └── [id]/
│               └── edit.tsx        # Editar sede
│
├── components/
│   └── leagues/
│       ├── VenueSelector.tsx       # 🆕 Selector multi-sede
│       ├── MatchTimesEditor.tsx    # 🆕 Editor de horarios
│       ├── LeagueTypeSelector.tsx  # 🆕 Tipo de liga
│       └── LeagueSummary.tsx       # 🆕 Resumen antes de crear
│
│   └── venues/
│       ├── VenueCard.tsx           # 🆕 Tarjeta de sede
│       ├── VenueForm.tsx           # 🆕 Formulario sede
│       └── VenueCourtsList.tsx     # 🆕 Lista canchas de sede
│
├── hooks/
│   ├── useVenues.ts                # 🆕 Hook para sedes
│   ├── useVenueCourts.ts           # 🆕 Canchas por sede
│   └── useCreateLeague.ts          # Actualizar con nuevos campos
│
└── types/
    └── venue.ts                    # 🆕 Tipos para sedes
```

### ⚠️ Archivos a MODIFICAR:

```
src/
├── pages/
│   └── admin/
│       ├── courts/
│       │   └── create.tsx          # Agregar selector de sede
│       └── leagues/
│           └── create.tsx          # Agregar pasos 3 y 4
│
├── components/
│   └── courts/
│       └── CourtForm.tsx           # Agregar venue_id
│
└── navigation/
    └── sidebar.tsx                 # Agregar item "Sedes"
```

---

## 🎨 Tipos TypeScript

### `types/venue.ts` (NUEVO):

```typescript
export interface Venue {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  phone?: string;
  email?: string;
  description?: string;
  logo_url?: string;
  photo_url?: string;
  opening_hours?: OpeningHours;
  amenities?: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;  // "08:00"
  close: string; // "23:00"
}

export interface VenueConfig {
  venue_id: string;
  court_ids: string[];
  is_primary: boolean;
}

export interface VenueWithCourts extends Venue {
  courts: Court[];
}
```

### Actualizar `types/league.ts`:

```typescript
export interface CreateLeaguePayload {
  // Campos existentes...
  name: string;
  categories: string[];
  description: string;
  // ...
  
  // 🆕 Nuevos campos
  match_times: string[];           // ["21:30", "22:15", "23:00"]
  courts_per_time_slot: number;    // 2
  league_type: LeagueType;         // 'round_robin'
  rounds: 1 | 2;                   // 1
  frequency: LeagueFrequency;      // 'quincenal'
  venues: VenueConfig[];           // Multi-sede
}

export type LeagueType = 'round_robin' | 'knockout' | 'groups' | 'custom';
export type LeagueFrequency = 'semanal' | 'quincenal' | 'mensual';
```

---

## ✅ Checklist de Implementación

### Fase 1: CRUD de Sedes
- [ ] Crear página `/admin/venues`
- [ ] Crear componente `VenueForm`
- [ ] Crear componente `VenueCard`
- [ ] Agregar "Sedes" al menú
- [ ] Hook `useVenues`

### Fase 2: Modificar Canchas
- [ ] Agregar selector de sede en `CourtForm`
- [ ] Mostrar sede en lista de canchas
- [ ] Filtrar canchas por sede

### Fase 3: Modificar Crear Liga
- [ ] Agregar campos al Paso 1 (tipo, vueltas)
- [ ] Crear Paso 3: `VenueSelector`
- [ ] Crear Paso 4: `MatchTimesEditor` + Resumen
- [ ] Actualizar lógica de submit con nuevos campos
- [ ] Validaciones

### Fase 4: Testing
- [ ] Probar crear sede
- [ ] Probar crear cancha con sede
- [ ] Probar crear liga con multi-sede y horarios
- [ ] Verificar que partidos se generen correctamente

---

## 🔗 URLs del API

| Recurso | Método | URL | Descripción |
|---------|--------|-----|-------------|
| Sedes | GET | `/venues` | Listar sedes |
| Sedes | POST | `/venues` | Crear sede |
| Sedes | PUT | `/venues/:id` | Actualizar sede |
| Sedes | DELETE | `/venues/:id` | Eliminar sede |
| Canchas de sede | GET | `/venues/:id/courts` | Canchas de una sede |
| Ligas | POST | `/leagues/createLeague` | Crear liga (con nuevos campos) |
| Categorías | GET | `/categories` | Listar categorías |

---

*Documento generado para Recrea Padel - Backend v2.0 con Multi-Sede*
*Última actualización: Diciembre 2024*

