# 📋 Documentación del Estado Actual - Recrea Rackets Calendar Admin

## 🎯 Contexto del Proyecto

Sistema administrativo para gestión de ligas y torneos de pádel, diseñado inicialmente para un club específico en Uruguay con:
- **1 sede única**
- **2 canchas**
- **Configuración hardcodeada** para este caso específico

---

## 🏗️ Arquitectura Actual

### Stack Tecnológico
- **Frontend**: Next.js 15.0.1 + React 18.2.0
- **Backend**: Node.js + Express (repositorio separado)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT tokens + Supabase Auth
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Query + Custom Hooks

### Estructura de Repositorios
1. **Admin Panel** (este repositorio): Panel de administración
2. **Cliente Panel** (repositorio separado): Portal para jugadores
3. **Backend API** (repositorio separado): API REST

---

## ⚠️ Limitaciones y Hardcodeo Identificados

### 1. **Configuración de Club Hardcodeada**

#### Ubicaciones del hardcodeo:
- `src/hooks/useTournamentForm.ts:638` - `tournament_club_name: 'Recrea Padel Club'`
- `src/hooks/useTournaments.ts:638` - `tournament_club_name: 'Recrea Padel Club'`
- `src/contexts/TranslationContext.tsx:118` - `clubName: 'Recrea Padel Club'`
- `tournament.controller.js:790` - Valor por defecto `'Recrea Padel Club'`
- `tournament.controller.js:1253, 1333, 1341, 1465, 1553` - Emails con remitente hardcodeado

**Impacto**: No permite múltiples clubs en la misma instancia.

---

### 2. **Sin Soporte para Múltiples Sedes**

#### Problemas identificados:
- **Tabla `courts`** no tiene campo `location_id` o `venue_id`
- Las canchas no están asociadas a ninguna sede/ubicación
- No existe tabla `locations` o `venues` en el esquema
- Los torneos/ligas no especifican en qué sede se juegan

**Estructura actual de `courts`**:
```sql
CREATE TABLE public.courts (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  photo_url text,
  created_at timestamp,
  updated_at timestamp
  -- ❌ Falta: location_id, venue_id, address, etc.
);
```

**Impacto**: Imposible gestionar un club con múltiples sedes (ej: San Francisco con 3 sedes).

---

### 3. **Límites Hardcodeados**

#### Límites encontrados:
- **Máximo 8 canchas**: `tournament.controller.js:408` - `canchas_maximas: 8`
- **Time slots fijos**: Horarios hardcodeados en `useTournamentForm.ts:69-77`
- **Tipos de torneo limitados**: Solo 6, 9, 12, 16 jugadores
- **Duración de partidos**: 90 minutos fijo para ligas
- **Sistema de puntos fijo**: 2-1-0 para win-loss-loss_with_set

**Impacto**: No permite flexibilidad para diferentes tipos de competencias.

---

### 4. **Sin Multi-Tenancy**

#### Problemas:
- No existe tabla `organizations` o `clubs`
- No hay aislamiento de datos entre diferentes clubs
- Todos los usuarios comparten el mismo espacio de datos
- No hay roles a nivel de organización

**Impacto**: No se puede ofrecer como SaaS multi-tenant.

---

### 5. **Configuración de Horarios Fija**

#### Hardcodeo encontrado:
```typescript
// src/hooks/useTournamentForm.ts
time_slots: [
  [9, 13],   // mañana - hardcodeado
  [14, 22],  // tarde/noche - hardcodeado
],
group_time_slots: [
  { id: 'fri_night', day: 'friday', start: '18:00', end: '23:30' },
  { id: 'sat_morning', day: 'saturday', start: '09:00', end: '13:00' },
  { id: 'sat_afternoon', day: 'saturday', start: '14:00', end: '22:00' },
]
```

**Impacto**: No permite configurar horarios personalizados por club o por sede.

---

### 6. **URLs y Emails Hardcodeados**

#### Ubicaciones:
- `tournament.controller.js:1234` - `WEB_URL || 'https://recreapadel.com'`
- `tournament.controller.js:1253` - `from: 'Recrea Padel Club <noreply@recreapadel.com>'`
- Variables de entorno con valores por defecto específicos del club

**Impacto**: No permite personalización por cliente.

---

### 7. **Configuración Regional Fija**

#### Problemas:
- Zona horaria fija (probablemente Uruguay)
- Formato de fechas/horas hardcodeado
- Moneda no configurable (asume pesos uruguayos)
- Idioma principal: español (aunque tiene soporte para inglés)

**Impacto**: Dificulta expansión internacional.

---

## 📊 Estructura de Datos Actual

### Tablas Principales

#### `courts` (Canchas)
```sql
- id, name, photo_url
- ❌ Falta: location_id, address, capacity, features, status
```

#### `leagues` (Ligas)
```sql
- id, name, category_id, courts_available (número, no IDs)
- ❌ Falta: location_id, organization_id, configurable_points_system
```

#### `tournaments` (Torneos)
```sql
- id, name, category_id, courts_available (número)
- tournament_info con tournament_club_name hardcodeado
- ❌ Falta: location_id, organization_id, venue_selection
```

#### `categories` (Categorías)
```sql
- id, name, max_teams, min_teams
- play_day, play_time (hardcodeado)
- ❌ Falta: organization_id, location_id
```

---

## 🔒 Seguridad Actual

### Implementado:
- ✅ Autenticación JWT
- ✅ Protección de rutas en frontend
- ✅ Validación de roles (admin/user)
- ✅ Tokens en localStorage

### Faltante:
- ❌ Rate limiting
- ❌ Protección DDoS (Cloudflare)
- ❌ WAF (Web Application Firewall)
- ❌ Monitoreo de seguridad
- ❌ Logging de auditoría
- ❌ Encriptación de datos sensibles
- ❌ CORS configurado pero puede mejorarse

---

## 🌍 Internacionalización

### Estado Actual:
- ✅ Soporte para español e inglés
- ✅ Sistema de traducciones con Context API
- ⚠️ Traducciones hardcodeadas en algunos componentes
- ❌ Zona horaria no configurable
- ❌ Formato de moneda no configurable
- ❌ Formato de fechas limitado

---

## 📈 Escalabilidad

### Limitaciones:
- ❌ Sin cache de queries
- ❌ Sin paginación en algunos listados
- ❌ Queries N+1 potenciales
- ❌ Sin índices optimizados documentados
- ❌ Sin CDN para assets estáticos
- ❌ Sin load balancing configurado

---

## 🎨 Personalización

### Estado Actual:
- ✅ Temas dark/light
- ✅ Logo configurable (pero hardcodeado en algunos lugares)
- ❌ Colores de marca no configurables
- ❌ Branding por organización no implementado
- ❌ Dominios personalizados no soportados

---

## 📝 Resumen de Limitaciones Críticas

### Para soportar múltiples sedes (San Francisco):
1. ❌ Falta tabla `locations` o `venues`
2. ❌ Canchas no asociadas a sedes
3. ❌ Torneos/ligas no especifican sede
4. ❌ No se puede filtrar por sede

### Para multi-tenancy (múltiples clubs):
1. ❌ Falta tabla `organizations` o `clubs`
2. ❌ No hay aislamiento de datos
3. ❌ Configuración compartida entre todos
4. ❌ No hay roles a nivel organización

### Para escalabilidad:
1. ❌ Sin cache implementado
2. ❌ Sin paginación completa
3. ❌ Sin optimización de queries
4. ❌ Sin protección DDoS

### Para personalización:
1. ❌ Branding hardcodeado
2. ❌ URLs hardcodeadas
3. ❌ Emails con remitente fijo
4. ❌ Configuración no por organización

---

## 🎯 Casos de Uso No Soportados Actualmente

1. **Club con múltiples sedes**: ❌ No soportado
2. **Múltiples clubs en la misma instancia**: ❌ No soportado
3. **Configuración personalizada por club**: ❌ No soportado
4. **Horarios flexibles por sede**: ❌ No soportado
5. **Tipos de liga personalizados**: ⚠️ Limitado
6. **Sistema de puntos personalizado**: ⚠️ Limitado
7. **Moneda configurable**: ❌ No soportado
8. **Zona horaria por organización**: ❌ No soportado

---

## 📅 Fecha de Documentación
**Generado**: $(date)
**Versión del Sistema**: Basado en análisis del código actual

---

## 🔗 Referencias

- Schema de base de datos: `schemasupabase.sql`
- Configuración: `README_CONFIGURACION.md`
- Código fuente: `src/`

