# 📱 Plan de Integración: WhatsApp Notifications con GREEN-API

## 📋 Descripción del Proyecto

Integración de GREEN-API para enviar recordatorios automáticos por WhatsApp a los jugadores cuando sus partidos sean programados mediante el auto-scheduling del sistema de torneos.

## 🎯 Objetivos

1. **Enviar recordatorios automáticos** a los jugadores cuando sus partidos sean programados
2. **Notificar detalles del partido**: fecha, hora, cancha, rivales
3. **Integración con el sistema de auto-scheduling** existente
4. **Mensajes personalizados** con información relevante del torneo

## 🔧 Requisitos Previos

### 1. Cuenta en GREEN-API
- Registrarse en [green-api.com](https://green-api.com/es)
- Obtener `idInstance` y `apiTokenInstance`
- Configurar webhook para recibir confirmaciones (opcional)

### 2. Dependencias del Backend
```bash
npm install axios
# o
npm install node-fetch
```

### 3. Variables de Entorno
Agregar al archivo `.env`:
```env
GREEN_API_ID_INSTANCE=tu_id_instance
GREEN_API_TOKEN=tu_api_token
GREEN_API_ENABLED=true
WHATSAPP_NOTIFICATIONS_ENABLED=true
```

## 📐 Arquitectura de la Solución

### Flujo de Integración

```
Auto-Scheduling Completo
    ↓
Partidos Programados (con fecha, hora, cancha)
    ↓
Función: sendMatchNotifications()
    ↓
Para cada partido:
    - Obtener equipos (home_team, away_team)
    - Obtener jugadores de cada equipo
    - Formatear mensaje personalizado
    - Enviar vía GREEN-API
    ↓
Registrar envío en BD (opcional)
```

## 🏗️ Estructura de Implementación

### 1. Crear Módulo de WhatsApp Service

**Archivo:** `services/whatsappService.js`

```javascript
const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.idInstance = process.env.GREEN_API_ID_INSTANCE;
    this.apiToken = process.env.GREEN_API_TOKEN;
    this.baseUrl = `https://api.green-api.com/waInstance${this.idInstance}`;
    this.enabled = process.env.GREEN_API_ENABLED === 'true';
  }

  /**
   * Envía un mensaje de WhatsApp a un número específico
   * @param {string} phoneNumber - Número de teléfono con código de país (ej: "5491123456789")
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} Respuesta de la API
   */
  async sendMessage(phoneNumber, message) {
    if (!this.enabled) {
      console.log('📱 [WHATSAPP] Servicio deshabilitado. Mensaje simulado:', message);
      return { success: true, simulated: true };
    }

    try {
      // Formatear número (debe incluir código de país sin + ni espacios)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post(
        `${this.baseUrl}/sendMessage/${this.apiToken}`,
        {
          chatId: `${formattedNumber}@c.us`,
          message: message
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ [WHATSAPP] Mensaje enviado a ${formattedNumber}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`❌ [WHATSAPP] Error enviando mensaje:`, error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Formatea el número de teléfono para GREEN-API
   * @param {string} phone - Número en cualquier formato
   * @returns {string} Número formateado (ej: "5491123456789")
   */
  formatPhoneNumber(phone) {
    // Remover espacios, guiones, paréntesis y el símbolo +
    let formatted = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Si no tiene código de país, asumir Argentina (+54)
    if (!formatted.startsWith('54') && formatted.length <= 10) {
      formatted = '54' + formatted;
    }
    
    return formatted;
  }

  /**
   * Verifica el estado de la conexión con GREEN-API
   * @returns {Promise<Object>} Estado de la conexión
   */
  async checkConnection() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/getStateInstance/${this.apiToken}`
      );
      return { success: true, state: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
```

### 2. Crear Servicio de Notificaciones de Partidos

**Archivo:** `services/matchNotificationService.js`

```javascript
const whatsappService = require('./whatsappService');
const supabase = require('../lib/supabase'); // Ajustar según tu configuración

class MatchNotificationService {
  /**
   * Envía notificaciones a todos los jugadores de un partido programado
   * @param {Object} match - Objeto del partido con toda la información
   * @returns {Promise<Object>} Resultado del envío
   */
  async notifyMatchScheduled(match) {
    try {
      // Obtener información completa del partido
      const matchDetails = await this.getMatchDetails(match.id);
      
      if (!matchDetails) {
        return { success: false, error: 'Partido no encontrado' };
      }

      // Obtener jugadores de ambos equipos
      const homeTeamPlayers = await this.getTeamPlayers(matchDetails.home_team_id);
      const awayTeamPlayers = await this.getTeamPlayers(matchDetails.away_team_id);

      const results = {
        homeTeam: [],
        awayTeam: [],
        errors: []
      };

      // Enviar notificaciones a jugadores del equipo local
      for (const player of homeTeamPlayers) {
        if (player.phone) {
          const message = this.formatMatchMessage(matchDetails, 'home', player);
          const result = await whatsappService.sendMessage(player.phone, message);
          
          results.homeTeam.push({
            player: player.name,
            phone: player.phone,
            success: result.success
          });

          if (!result.success) {
            results.errors.push({
              player: player.name,
              error: result.error
            });
          }
        }
      }

      // Enviar notificaciones a jugadores del equipo visitante
      for (const player of awayTeamPlayers) {
        if (player.phone) {
          const message = this.formatMatchMessage(matchDetails, 'away', player);
          const result = await whatsappService.sendMessage(player.phone, message);
          
          results.awayTeam.push({
            player: player.name,
            phone: player.phone,
            success: result.success
          });

          if (!result.success) {
            results.errors.push({
              player: player.name,
              error: result.error
            });
          }
        }
      }

      // Registrar envío en base de datos (opcional)
      await this.logNotification(match.id, results);

      return {
        success: true,
        sent: results.homeTeam.filter(r => r.success).length + 
              results.awayTeam.filter(r => r.success).length,
        total: results.homeTeam.length + results.awayTeam.length,
        errors: results.errors
      };
    } catch (error) {
      console.error('❌ [NOTIFICACIONES] Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene los detalles completos de un partido
   */
  async getMatchDetails(matchId) {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        tournament:tournaments(*),
        home_team:home_team_id(*),
        away_team:away_team_id(*),
        court:courts(*)
      `)
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene los jugadores de un equipo
   */
  async getTeamPlayers(teamId) {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select('players, team_name')
      .eq('id', teamId)
      .single();

    if (error) throw error;

    // Parsear jugadores (puede ser array o JSON string)
    let players = [];
    if (data.players) {
      if (typeof data.players === 'string') {
        players = JSON.parse(data.players);
      } else {
        players = data.players;
      }
    }

    // Obtener información de usuarios para cada jugador
    const playersWithPhone = [];
    for (const playerName of players) {
      // Buscar usuario por nombre (ajustar según tu esquema)
      const { data: user } = await supabase
        .from('users')
        .select('id, first_name, last_name, phone')
        .or(`first_name.ilike.%${playerName}%,last_name.ilike.%${playerName}%`)
        .single();

      if (user && user.phone) {
        playersWithPhone.push({
          name: playerName,
          phone: user.phone,
          userId: user.id
        });
      }
    }

    return playersWithPhone;
  }

  /**
   * Formatea el mensaje de WhatsApp para un partido
   */
  formatMatchMessage(matchDetails, teamSide, player) {
    const tournament = matchDetails.tournament;
    const homeTeam = matchDetails.home_team;
    const awayTeam = matchDetails.away_team;
    const court = matchDetails.court;

    // Formatear fecha y hora
    const matchDate = new Date(matchDetails.tournament_day === 1 
      ? tournament.start_date 
      : new Date(tournament.start_date).setDate(new Date(tournament.start_date).getDate() + 1)
    );
    const formattedDate = matchDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = matchDetails.start_time?.substring(0, 5) || 'Por confirmar';

    // Determinar rival
    const rival = teamSide === 'home' ? awayTeam : homeTeam;
    const rivalName = rival?.team_name || 'Por confirmar';

    const message = `🏆 *Recordatorio de Partido*

Hola ${player.name}! 👋

Tu partido ha sido programado:

📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${formattedTime}
🏟️ *Cancha:* ${court?.name || 'Por confirmar'}
🎾 *Torneo:* ${tournament?.name || 'Torneo'}

⚔️ *Rival:* ${rivalName}

¡Nos vemos en la cancha! 🎾

_Equipo ${tournament?.name || 'Matchly'}_`;

    return message;
  }

  /**
   * Registra el envío de notificaciones en la base de datos (opcional)
   */
  async logNotification(matchId, results) {
    try {
      await supabase
        .from('match_notifications')
        .insert({
          match_id: matchId,
          sent_at: new Date().toISOString(),
          total_players: results.homeTeam.length + results.awayTeam.length,
          successful_sends: results.homeTeam.filter(r => r.success).length + 
                           results.awayTeam.filter(r => r.success).length,
          errors: results.errors
        });
    } catch (error) {
      console.error('⚠️ [NOTIFICACIONES] Error registrando log:', error);
      // No fallar si el log falla
    }
  }
}

module.exports = new MatchNotificationService();
```

### 3. Integrar con Auto-Scheduling

**Archivo:** `tournament-auto-scheduling.js`

Agregar al final de la función `autoScheduleMatches`:

```javascript
// ... código existente del auto-scheduling ...

// Después de programar todos los partidos exitosamente
if (scheduledMatches.length > 0 && process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true') {
  console.log('\n📱 [WHATSAPP] Enviando notificaciones a jugadores...');
  
  const matchNotificationService = require('./services/matchNotificationService');
  
  for (const scheduledMatch of scheduledMatches) {
    try {
      const result = await matchNotificationService.notifyMatchScheduled({
        id: scheduledMatch.match_id
      });
      
      if (result.success) {
        console.log(`   ✅ Notificaciones enviadas para partido ${scheduledMatch.match_id.slice(0, 8)}: ${result.sent}/${result.total} jugadores`);
      } else {
        console.log(`   ⚠️  Error enviando notificaciones: ${result.error}`);
      }
    } catch (error) {
      console.error(`   ❌ Error en notificación:`, error);
    }
  }
}
```

### 4. Crear Endpoint para Re-enviar Notificaciones (Opcional)

**Archivo:** `tournament.controller.js`

```javascript
const matchNotificationService = require('../services/matchNotificationService');

export async function resendMatchNotificationController(req, res) {
  const { matchId } = req.params;

  try {
    const result = await matchNotificationService.notifyMatchScheduled({ id: matchId });

    if (result.success) {
      return res.status(200).json({
        message: 'Notificaciones re-enviadas exitosamente',
        sent: result.sent,
        total: result.total,
        errors: result.errors
      });
    } else {
      return res.status(500).json({
        message: 'Error al enviar notificaciones',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error en resendMatchNotificationController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}
```

**Archivo:** `tournament.routes.js`

```javascript
router.post('/:id/matches/:matchId/resend-notification', verifyToken, verifyAdmin, resendMatchNotificationController);
```

## 🗄️ Estructura de Base de Datos (Opcional)

Si quieres registrar los envíos, crear tabla:

```sql
CREATE TABLE IF NOT EXISTS match_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES tournament_matches(id) ON DELETE CASCADE,
  sent_at TIMESTAMP DEFAULT NOW(),
  total_players INTEGER,
  successful_sends INTEGER,
  errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_match_notifications_match_id ON match_notifications(match_id);
CREATE INDEX idx_match_notifications_sent_at ON match_notifications(sent_at);
```

## 🧪 Testing

### 1. Test de Conexión

```javascript
// test/whatsapp-connection.test.js
const whatsappService = require('../services/whatsappService');

async function testConnection() {
  const result = await whatsappService.checkConnection();
  console.log('Estado de conexión:', result);
}

testConnection();
```

### 2. Test de Envío

```javascript
// test/whatsapp-send.test.js
const whatsappService = require('../services/whatsappService');

async function testSend() {
  const result = await whatsappService.sendMessage(
    '5491123456789', // Tu número de prueba
    '🧪 Mensaje de prueba desde Matchly'
  );
  console.log('Resultado:', result);
}

testSend();
```

## 📝 Consideraciones Importantes

### 1. **Formato de Números**
- Los números deben incluir código de país sin `+` ni espacios
- Ejemplo: `5491123456789` (Argentina: 54 + 9 + 1123456789)

### 2. **Límites de GREEN-API**
- Plan gratuito: limitado
- Planes de pago: hasta 120 mensajes/minuto
- Verificar límites según tu plan

### 3. **Manejo de Errores**
- Implementar retry logic para mensajes fallidos
- Registrar errores en base de datos
- No bloquear el auto-scheduling si fallan las notificaciones

### 4. **Privacidad y Consentimiento**
- Asegurar que los jugadores hayan dado consentimiento para recibir mensajes
- Permitir opt-out en los mensajes
- Cumplir con regulaciones de protección de datos

### 5. **Rate Limiting**
- Implementar cola de mensajes si el volumen es alto
- Espaciar envíos para evitar bloqueos

## 🚀 Deployment

### 1. Variables de Entorno en Producción

```env
GREEN_API_ID_INSTANCE=tu_id_instance_produccion
GREEN_API_TOKEN=tu_token_produccion
GREEN_API_ENABLED=true
WHATSAPP_NOTIFICATIONS_ENABLED=true
```

### 2. Verificar Configuración

```javascript
// middleware/whatsapp-check.js
const whatsappService = require('../services/whatsappService');

async function checkWhatsAppConfig(req, res, next) {
  if (process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true') {
    const connection = await whatsappService.checkConnection();
    if (!connection.success) {
      console.warn('⚠️ [WHATSAPP] Conexión no disponible');
    }
  }
  next();
}
```

## 📊 Monitoreo y Logs

### 1. Logs Recomendados
- Mensajes enviados exitosamente
- Errores de envío
- Números inválidos
- Tasa de éxito por torneo

### 2. Métricas a Monitorear
- Total de mensajes enviados
- Tasa de éxito (%)
- Tiempo promedio de envío
- Errores más comunes

## 🔄 Mejoras Futuras

1. **Plantillas de Mensajes**: Sistema de plantillas personalizables
2. **Recordatorios Programados**: Enviar recordatorios 24h antes del partido
3. **Confirmación de Lectura**: Usar webhooks para saber si el mensaje fue leído
4. **Multi-idioma**: Mensajes en español/inglés según preferencia del usuario
5. **Notificaciones de Cambios**: Avisar si se cambia fecha/hora/cancha
6. **Estadísticas**: Dashboard con métricas de notificaciones

## 📚 Recursos

- [Documentación GREEN-API](https://green-api.com/es/docs/)
- [API Reference](https://green-api.com/es/docs/api/)
- [Ejemplos de Código](https://green-api.com/es/docs/examples/)

## ✅ Checklist de Implementación

- [ ] Crear cuenta en GREEN-API
- [ ] Obtener `idInstance` y `apiTokenInstance`
- [ ] Agregar variables de entorno
- [ ] Instalar dependencias (`axios` o `node-fetch`)
- [ ] Crear `services/whatsappService.js`
- [ ] Crear `services/matchNotificationService.js`
- [ ] Integrar con `tournament-auto-scheduling.js`
- [ ] Probar conexión con GREEN-API
- [ ] Probar envío de mensaje de prueba
- [ ] Verificar formato de números de teléfono
- [ ] Implementar manejo de errores
- [ ] Agregar logs de notificaciones
- [ ] Crear endpoint de re-envío (opcional)
- [ ] Crear tabla de logs (opcional)
- [ ] Documentar para el equipo
- [ ] Probar en ambiente de staging
- [ ] Deploy a producción

---

**Última actualización:** 2025-01-26  
**Autor:** Equipo de Desarrollo Matchly  
**Versión:** 1.0

