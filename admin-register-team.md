# Guía Frontend: Formulario de Inscripción de Equipos por Administrador

## 📋 Resumen Ejecutivo

Esta guía proporciona toda la información necesaria para implementar el formulario de inscripción de equipos desde el panel de administración. El endpoint `adminRegisterTeam` funciona de manera **idéntica** a `joinTournament`, pero es ejecutado por un administrador en lugar de un jugador.

## 🎯 Endpoint Principal

```http
POST /tournaments/{tournamentId}/admin-register-team
```

### Autenticación
- **Bearer Token**: Requerido (token de administrador)
- **Headers**: `Authorization: Bearer {admin_token}`

## 📝 Estructura del Formulario

### Campos Requeridos

```typescript
interface AdminRegisterTeamForm {
  userId1: string;           // UUID del primer jugador
  userId2: string;           // UUID del segundo jugador
  unavailable_time_slot: string; // ID del slot no disponible
}
```

### Campos Opcionales
- Ninguno (todos los campos son requeridos)

## 🔍 Validaciones del Backend

### 1. Validaciones Básicas
- ✅ `userId1` y `userId2` son requeridos
- ✅ Los dos jugadores deben ser distintos
- ✅ `unavailable_time_slot` es requerido y debe ser string válido

### 2. Validaciones de Existencia
- ✅ El torneo debe existir
- ✅ Ambos usuarios deben existir en la base de datos
- ✅ El time slot debe ser válido para el torneo

### 3. Validaciones de Disponibilidad
- ✅ Ninguno de los jugadores puede estar ya registrado en el torneo
- ✅ El torneo no puede estar completo (máximo equipos alcanzado)
- ✅ El time slot no puede estar completo

## 🎨 Componente React/Next.js

### Estructura Recomendada

```tsx
import { useState, useEffect } from 'react';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TimeSlot {
  slot_id: string;
  label: string;
  is_available: boolean;
  remaining_slots: number;
  percentage_full: number;
}

export default function AdminRegisterTeamForm({ tournamentId }: { tournamentId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    loadPlayers();
    loadAvailableSlots();
  }, [tournamentId]);

  const loadPlayers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setPlayers(data.users);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/available-time-slots`);
      const data = await response.json();
      setAvailableSlots(data.available_slots);
    } catch (err) {
      console.error('Error cargando slots:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/admin-register-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          userId1: selectedPlayer1,
          userId2: selectedPlayer2,
          unavailable_time_slot: selectedSlot
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Éxito - mostrar mensaje y limpiar formulario
      alert(`Equipo registrado exitosamente!\nJugadores: ${data.tournament_team.players.player1} & ${data.tournament_team.players.player2}\nSlot: ${data.slot_info.slot_label}\nCapacidad: ${data.slot_info.current_usage}/${data.slot_info.max_capacity}`);
      
      // Limpiar formulario
      setSelectedPlayer1('');
      setSelectedPlayer2('');
      setSelectedSlot('');
      
      // Recargar slots disponibles
      loadAvailableSlots();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Registrar Equipo en Torneo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Jugador 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer Jugador *
          </label>
          <select
            value={selectedPlayer1}
            onChange={(e) => setSelectedPlayer1(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar jugador...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.first_name} {player.last_name} ({player.email})
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Jugador 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Segundo Jugador *
          </label>
          <select
            value={selectedPlayer2}
            onChange={(e) => setSelectedPlayer2(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={!selectedPlayer1}
          >
            <option value="">Seleccionar jugador...</option>
            {players
              .filter(player => player.id !== selectedPlayer1)
              .map(player => (
                <option key={player.id} value={player.id}>
                  {player.first_name} {player.last_name} ({player.email})
                </option>
              ))}
          </select>
        </div>

        {/* Selección de Time Slot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horario No Disponible *
          </label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={!selectedPlayer1 || !selectedPlayer2}
          >
            <option value="">Seleccionar horario...</option>
            {availableSlots.map(slot => (
              <option 
                key={slot.slot_id} 
                value={slot.slot_id}
                disabled={!slot.is_available}
              >
                {slot.label} 
                {slot.is_available 
                  ? ` (${slot.remaining_slots} cupos disponibles)` 
                  : ' (COMPLETO)'
                }
              </option>
            ))}
          </select>
        </div>

        {/* Información del Slot Seleccionado */}
        {selectedSlot && (
          <div className="bg-blue-50 p-4 rounded-md">
            {(() => {
              const slot = availableSlots.find(s => s.slot_id === selectedSlot);
              return slot ? (
                <div>
                  <h4 className="font-medium text-blue-800">Información del Horario:</h4>
                  <p className="text-sm text-blue-700">
                    <strong>{slot.label}</strong><br/>
                    Cupos disponibles: {slot.remaining_slots}<br/>
                    Ocupación: {slot.percentage_full}%
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading || !selectedPlayer1 || !selectedPlayer2 || !selectedSlot}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registrando...' : 'Registrar Equipo'}
        </button>
      </form>
    </div>
  );
}
```

## 🔄 Flujo de Datos

### 1. Carga Inicial
```typescript
// Cargar jugadores disponibles
GET /api/users

// Cargar slots disponibles
GET /api/tournaments/{tournamentId}/available-time-slots
```

### 2. Envío del Formulario
```typescript
// Registrar equipo
POST /api/tournaments/{tournamentId}/admin-register-team
```

## 📊 Respuestas del Backend

### Éxito (200 OK)
```json
{
  "message": "Equipo registrado exitosamente por administrador",
  "tournament_team": {
    "id": "uuid-del-equipo",
    "tournament_id": "uuid-del-torneo",
    "team_id": "uuid-del-team",
    "payment_status": "pending",
    "players": {
      "player1": "Nombre Apellido",
      "player2": "Nombre Apellido"
    }
  },
  "slot_info": {
    "slot_id": "day2_afternoon",
    "slot_label": "Sábado Tarde (13-17hs)",
    "current_usage": 3,
    "max_capacity": 9,
    "remaining_slots": 6
  }
}
```

### Error - Slot Completo (400 Bad Request)
```json
{
  "message": "El time slot \"Viernes Noche (22-24hs)\" está completo (5/5 equipos)"
}
```

### Error - Usuarios Duplicados (400 Bad Request)
```json
{
  "message": "Uno o ambos jugadores ya están registrados en este torneo"
}
```

### Error - Slot Inválido (400 Bad Request)
```json
{
  "message": "Time slot \"invalid_slot\" no es válido para este torneo. Slots disponibles: day1_evening, day1_night, day2_morning"
}
```

## 🎨 Consideraciones de UX/UI

### 1. Validaciones en Tiempo Real
- Deshabilitar segundo jugador hasta seleccionar el primero
- Filtrar jugadores ya seleccionados
- Mostrar información del slot seleccionado
- Deshabilitar slots completos

### 2. Feedback Visual
- Indicadores de carga durante el envío
- Mensajes de error específicos y claros
- Confirmación de éxito con detalles
- Actualización automática de slots disponibles

### 3. Accesibilidad
- Labels descriptivos para todos los campos
- Estados de disabled claramente indicados
- Mensajes de error asociados a campos
- Navegación por teclado funcional

## 🔧 Endpoints Adicionales Necesarios

### 1. Obtener Usuarios
```http
GET /api/users
```
**Respuesta:**
```json
{
  "users": [
    {
      "id": "uuid",
      "first_name": "Nombre",
      "last_name": "Apellido",
      "email": "email@ejemplo.com"
    }
  ]
}
```

### 2. Obtener Slots Disponibles
```http
GET /api/tournaments/{tournamentId}/available-time-slots
```
**Respuesta:** (Ya implementado)

## 🚨 Casos Edge a Considerar

### 1. Usuarios Sin Confirmar Email
- **Problema**: Usuarios creados pero sin confirmar email
- **Solución**: Usar endpoint `/auth/confirm-email-dev` para desarrollo

### 2. Slots que se Llenan Durante el Proceso
- **Problema**: Slot disponible al cargar, completo al enviar
- **Solución**: Recargar slots después de cada registro exitoso

### 3. Usuarios Duplicados en Diferentes Torneos
- **Problema**: Usuario registrado en otro torneo del mismo evento
- **Solución**: El backend ya maneja esto correctamente

## 📝 Notas Importantes

### 1. Similitud con joinTournament
- **Validaciones**: Idénticas
- **Lógica de capacidad**: Idéntica
- **Manejo de errores**: Idéntico
- **Diferencia**: Solo la autenticación (admin vs user)

### 2. Capacidad Compartida
- Los slots son compartidos entre todas las categorías del evento
- Un equipo en Cuarta afecta la disponibilidad para Sexta, etc.
- El cálculo es dinámico y preciso

### 3. Estados de Pago
- Todos los equipos se registran con `payment_status: 'pending'`
- El admin puede cambiar el estado después usando el endpoint de pagos

## 🎯 Checklist de Implementación

- [ ] Componente de formulario con validaciones
- [ ] Carga de jugadores disponibles
- [ ] Carga de slots disponibles
- [ ] Manejo de errores específicos
- [ ] Feedback visual de éxito/error
- [ ] Actualización automática de slots
- [ ] Validaciones en tiempo real
- [ ] Estados de loading
- [ ] Accesibilidad completa
- [ ] Testing con diferentes escenarios

## 🚀 Próximos Pasos

1. **Implementar** el componente React/Next.js
2. **Crear** endpoints adicionales si es necesario
3. **Probar** con diferentes escenarios
4. **Integrar** con el sistema de pagos existente
5. **Documentar** el flujo completo para el equipo

---

**¡Con esta guía tienes todo lo necesario para implementar el formulario de inscripción de equipos por administrador!** 🎾💰