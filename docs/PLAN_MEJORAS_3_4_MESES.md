# 🚀 Plan de Mejoras Estratégico - 3-4 Meses
## Roadmap para Escalabilidad Multi-Tenant y Multi-Sede

---

## 🎯 Objetivo Principal

Transformar la aplicación de un sistema hardcodeado para un club específico a una **plataforma SaaS escalable** que soporte:
- ✅ Múltiples clubs/organizaciones (multi-tenancy)
- ✅ Múltiples sedes por club (San Francisco: 3 sedes)
- ✅ Configuración personalizable por organización
- ✅ Seguridad y protección empresarial
- ✅ Escalabilidad para crecimiento

---

## 📅 Timeline: 3-4 Meses

### **FASE 1: Fundación Multi-Tenant (Mes 1)**
*Prioridad: CRÍTICA - Base para todo lo demás*

### **FASE 2: Soporte Multi-Sede (Mes 2)**
*Prioridad: ALTA - Requerido para San Francisco*

### **FASE 3: Seguridad y Protección (Mes 2-3)**
*Prioridad: ALTA - Protección del negocio*

### **FASE 4: Personalización y Flexibilidad (Mes 3-4)**
*Prioridad: MEDIA - Diferenciación competitiva*

### **FASE 5: Optimización y Escalabilidad (Mes 4)**
*Prioridad: MEDIA - Preparación para crecimiento*

---

## 📋 FASE 1: Fundación Multi-Tenant (Mes 1)

### 🎯 Objetivo
Implementar arquitectura multi-tenant para soportar múltiples organizaciones/clubs en la misma instancia.

### ✅ Tareas

#### 1.1 Modelo de Datos Multi-Tenant
**Prioridad**: CRÍTICA  
**Esfuerzo**: 3-5 días  
**Dependencias**: Ninguna

**Cambios en Base de Datos**:
```sql
-- Nueva tabla organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL, -- Para URLs personalizadas
  domain text, -- Dominio personalizado opcional
  logo_url text,
  primary_color text,
  secondary_color text,
  timezone text DEFAULT 'America/Montevideo',
  currency text DEFAULT 'UYU',
  locale text DEFAULT 'es',
  settings jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Agregar organization_id a todas las tablas principales
ALTER TABLE courts ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE categories ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE leagues ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE tournaments ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE sponsors ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE professors ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Índices para performance
CREATE INDEX idx_courts_organization ON courts(organization_id);
CREATE INDEX idx_categories_organization ON categories(organization_id);
CREATE INDEX idx_leagues_organization ON leagues(organization_id);
CREATE INDEX idx_tournaments_organization ON tournaments(organization_id);
CREATE INDEX idx_users_organization ON users(organization_id);
```

**Migración de Datos**:
- Crear organización por defecto "Recrea Padel Club"
- Asignar todos los registros existentes a esta organización
- Script de migración para datos existentes

---

#### 1.2 Middleware de Organización
**Prioridad**: CRÍTICA  
**Esfuerzo**: 2-3 días  
**Dependencias**: 1.1

**Backend**:
- Middleware para detectar organización (subdomain, header, o slug)
- Filtrado automático de queries por `organization_id`
- Validación de permisos a nivel organización

**Frontend**:
- Context para organización actual
- Hook `useOrganization()` para acceder a configuración
- Detección automática de organización desde URL

---

#### 1.3 Sistema de Roles Multi-Tenant
**Prioridad**: ALTA  
**Esfuerzo**: 2-3 días  
**Dependencias**: 1.1

**Nuevos Roles**:
- `super_admin`: Acceso a todas las organizaciones (solo para soporte)
- `org_admin`: Administrador de una organización
- `org_manager`: Gestor de una organización (permisos limitados)
- `user`: Usuario normal (mantener existente)

**Tabla de Permisos**:
```sql
CREATE TABLE organization_members (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  organization_id uuid REFERENCES organizations(id),
  role text NOT NULL, -- org_admin, org_manager, user
  permissions jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);
```

---

#### 1.4 Onboarding de Nuevas Organizaciones
**Prioridad**: MEDIA  
**Esfuerzo**: 3-4 días  
**Dependencias**: 1.1, 1.2

**Funcionalidades**:
- Formulario de registro de nueva organización
- Configuración inicial (nombre, logo, colores)
- Asignación de primer administrador
- Setup wizard para configuración básica

---

### 📊 Entregables Fase 1
- ✅ Base de datos multi-tenant implementada
- ✅ Middleware de organización funcionando
- ✅ Sistema de roles multi-tenant
- ✅ Migración de datos existentes completada
- ✅ Onboarding básico de organizaciones

---

## 📋 FASE 2: Soporte Multi-Sede (Mes 2)

### 🎯 Objetivo
Permitir que cada organización tenga múltiples sedes/ubicaciones (ej: San Francisco con 3 sedes).

### ✅ Tareas

#### 2.1 Modelo de Datos para Sedes
**Prioridad**: CRÍTICA  
**Esfuerzo**: 2-3 días  
**Dependencias**: Fase 1

**Nueva Tabla**:
```sql
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  name text NOT NULL, -- "Sede Centro", "Sede Norte", etc.
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  phone text,
  email text,
  timezone text, -- Puede diferir de la organización
  coordinates point, -- Lat/Lng para mapas
  settings jsonb DEFAULT '{}', -- Configuración específica de la sede
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Actualizar tabla courts
ALTER TABLE courts ADD COLUMN location_id uuid REFERENCES locations(id);
ALTER TABLE courts DROP COLUMN IF EXISTS organization_id; -- Ahora viene de location

-- Actualizar otras tablas
ALTER TABLE tournaments ADD COLUMN location_id uuid REFERENCES locations(id);
ALTER TABLE leagues ADD COLUMN location_id uuid REFERENCES locations(id);
ALTER TABLE league_matches ADD COLUMN location_id uuid REFERENCES locations(id);
ALTER TABLE tournament_matches ADD COLUMN location_id uuid REFERENCES locations(id);
```

---

#### 2.2 Gestión de Sedes en Admin
**Prioridad**: CRÍTICA  
**Esfuerzo**: 4-5 días  
**Dependencias**: 2.1

**Frontend - Nueva Sección**:
- Página `/locations` para gestionar sedes
- CRUD completo de sedes
- Asignación de canchas a sedes
- Vista de mapa (opcional, con Google Maps)

**Componentes**:
- `LocationCard.tsx`
- `AddLocationModal.tsx`
- `EditLocationModal.tsx`
- `LocationSelector.tsx` (para usar en torneos/ligas)

---

#### 2.3 Asignación de Canchas a Sedes
**Prioridad**: CRÍTICA  
**Esfuerzo**: 2-3 días  
**Dependencias**: 2.1, 2.2

**Cambios**:
- Modificar página de canchas para incluir selector de sede
- Validar que canchas pertenezcan a una sede
- Filtrar canchas por sede en torneos/ligas
- Migración de canchas existentes a sede por defecto

---

#### 2.4 Selección de Sede en Torneos/Ligas
**Prioridad**: CRÍTICA  
**Esfuerzo**: 3-4 días  
**Dependencias**: 2.1, 2.2

**Cambios en Formularios**:
- Agregar selector de sede en creación de torneos
- Agregar selector de sede en creación de ligas
- Filtrar canchas disponibles por sede seleccionada
- Mostrar sede en listados y detalles

---

#### 2.5 Filtros y Vistas por Sede
**Prioridad**: MEDIA  
**Esfuerzo**: 2-3 días  
**Dependencias**: 2.4

**Funcionalidades**:
- Filtro por sede en listado de torneos
- Filtro por sede en listado de ligas
- Vista de dashboard por sede
- Estadísticas por sede

---

### 📊 Entregables Fase 2
- ✅ Modelo de datos para sedes implementado
- ✅ Gestión de sedes en admin panel
- ✅ Canchas asociadas a sedes
- ✅ Selección de sede en torneos/ligas
- ✅ Filtros y vistas por sede

---

## 📋 FASE 3: Seguridad y Protección (Mes 2-3)

### 🎯 Objetivo
Implementar seguridad empresarial y protección contra ataques.

### ✅ Tareas

#### 3.1 Cloudflare Integration
**Prioridad**: ALTA  
**Esfuerzo**: 2-3 días  
**Dependencias**: Ninguna

**Configuración**:
- Configurar Cloudflare para el dominio
- Activar DDoS Protection
- Configurar WAF (Web Application Firewall)
- Rate limiting por IP
- Bot protection
- SSL/TLS automático

**Configuraciones Recomendadas**:
- Rate limiting: 100 requests/minuto por IP
- DDoS protection: Automático
- WAF rules: OWASP Top 10
- Bot fight mode: Activado

---

#### 3.2 Rate Limiting en Backend
**Prioridad**: ALTA  
**Esfuerzo**: 2-3 días  
**Dependencias**: Ninguna

**Implementación**:
- Rate limiting por usuario autenticado
- Rate limiting por IP para endpoints públicos
- Diferentes límites por tipo de endpoint
- Headers de rate limit en respuestas

**Límites Sugeridos**:
- Autenticación: 5 intentos/minuto
- API general: 100 requests/minuto por usuario
- Creación de recursos: 10/minuto
- Búsquedas: 30/minuto

---

#### 3.3 Logging y Auditoría
**Prioridad**: MEDIA  
**Esfuerzo**: 3-4 días  
**Dependencias**: Ninguna

**Implementación**:
- Logging centralizado (Winston o similar)
- Auditoría de acciones críticas
- Logs de seguridad (intentos de acceso, cambios de permisos)
- Almacenamiento de logs (CloudWatch, Datadog, o similar)

**Eventos a Auditar**:
- Login/Logout
- Creación/Edición/Eliminación de recursos
- Cambios de permisos
- Cambios de configuración de organización
- Accesos a datos sensibles

---

#### 3.4 Validación y Sanitización Mejorada
**Prioridad**: ALTA  
**Esfuerzo**: 2-3 días  
**Dependencias**: Ninguna

**Mejoras**:
- Validación estricta de inputs
- Sanitización de datos
- Protección contra SQL injection (usar parámetros)
- Protección contra XSS
- Validación de tipos de archivo
- Límites de tamaño de archivo

---

#### 3.5 Monitoreo de Seguridad
**Prioridad**: MEDIA  
**Esfuerzo**: 2-3 días  
**Dependencias**: 3.3

**Implementación**:
- Alertas de seguridad (emails/Slack)
- Detección de patrones sospechosos
- Monitoreo de intentos de acceso fallidos
- Dashboard de seguridad

---

### 📊 Entregables Fase 3
- ✅ Cloudflare configurado y activo
- ✅ Rate limiting implementado
- ✅ Sistema de logging y auditoría
- ✅ Validación mejorada
- ✅ Monitoreo de seguridad básico

---

## 📋 FASE 4: Personalización y Flexibilidad (Mes 3-4)

### 🎯 Objetivo
Permitir que cada organización personalice la plataforma según sus necesidades.

### ✅ Tareas

#### 4.1 Configuración de Organización
**Prioridad**: ALTA  
**Esfuerzo**: 4-5 días  
**Dependencias**: Fase 1

**Configuraciones Personalizables**:
- Logo y branding
- Colores primarios y secundarios
- Zona horaria
- Moneda
- Idioma por defecto
- Formato de fechas
- Configuración de emails (remitente, plantillas)
- URLs personalizadas (subdomain)

**Interfaz**:
- Página `/settings/organization`
- Editor de branding
- Preview de cambios
- Guardado de configuración

---

#### 4.2 Sistema de Puntos Configurable
**Prioridad**: MEDIA  
**Esfuerzo**: 3-4 días  
**Dependencias**: Fase 1

**Funcionalidades**:
- Configurar puntos por victoria/derrota/empate
- Diferentes sistemas por liga
- Historial de cambios de sistema de puntos
- Cálculo automático con nueva configuración

**Tabla**:
```sql
ALTER TABLE leagues ADD COLUMN points_config jsonb DEFAULT '{
  "win": 2,
  "loss": 0,
  "loss_with_set": 1,
  "walkover": 2
}';
```

---

#### 4.3 Horarios Configurables
**Prioridad**: ALTA  
**Esfuerzo**: 4-5 días  
**Dependencias**: Fase 2

**Funcionalidades**:
- Configurar horarios por sede
- Diferentes horarios por día de la semana
- Horarios especiales (festivos, eventos)
- Time slots personalizables por organización

**Tabla**:
```sql
CREATE TABLE location_schedules (
  id uuid PRIMARY KEY,
  location_id uuid REFERENCES locations(id),
  day_of_week integer, -- 0-6 (domingo-sábado)
  start_time time,
  end_time time,
  is_active boolean DEFAULT true,
  exceptions jsonb DEFAULT '[]' -- Fechas específicas
);
```

---

#### 4.4 Tipos de Liga/Torneo Personalizables
**Prioridad**: MEDIA  
**Esfuerzo**: 3-4 días  
**Dependencias**: Fase 1

**Funcionalidades**:
- Crear tipos de torneo personalizados
- Configurar número de equipos
- Configurar estructura de grupos
- Plantillas de tipos comunes

---

#### 4.5 Plantillas de Email Personalizables
**Prioridad**: MEDIA  
**Esfuerzo**: 3-4 días  
**Dependencias**: Fase 1

**Funcionalidades**:
- Editor de plantillas de email
- Variables dinámicas
- Preview de emails
- Personalización por tipo de notificación

---

### 📊 Entregables Fase 4
- ✅ Configuración completa de organización
- ✅ Sistema de puntos configurable
- ✅ Horarios configurables por sede
- ✅ Tipos de liga/torneo personalizables
- ✅ Plantillas de email personalizables

---

## 📋 FASE 5: Optimización y Escalabilidad (Mes 4)

### 🎯 Objetivo
Optimizar performance y preparar para escalabilidad.

### ✅ Tareas

#### 5.1 Implementar Cache
**Prioridad**: ALTA  
**Esfuerzo**: 3-4 días  
**Dependencias**: Ninguna

**Estrategias**:
- Cache de Redis para queries frecuentes
- Cache de organizaciones y configuraciones
- Cache de listados (torneos, ligas)
- Invalidación inteligente de cache

---

#### 5.2 Paginación Completa
**Prioridad**: MEDIA  
**Esfuerzo**: 2-3 días  
**Dependencias**: Ninguna

**Implementación**:
- Paginación en todos los listados
- Cursor-based pagination para grandes datasets
- Infinite scroll opcional
- Filtros con paginación

---

#### 5.3 Optimización de Queries
**Prioridad**: ALTA  
**Esfuerzo**: 3-4 días  
**Dependencias**: Ninguna

**Mejoras**:
- Análisis de queries lentas
- Índices optimizados
- Eliminar queries N+1
- Eager loading donde sea necesario
- Query optimization en Supabase

---

#### 5.4 CDN para Assets
**Prioridad**: MEDIA  
**Esfuerzo**: 1-2 días  
**Dependencias**: Cloudflare (Fase 3)

**Configuración**:
- Cloudflare CDN para imágenes
- Optimización automática de imágenes
- Lazy loading de imágenes
- WebP format automático

---

#### 5.5 Monitoreo de Performance
**Prioridad**: MEDIA  
**Esfuerzo**: 2-3 días  
**Dependencias**: Ninguna

**Herramientas**:
- APM (Application Performance Monitoring)
- Métricas de tiempo de respuesta
- Alertas de performance
- Dashboard de métricas

---

### 📊 Entregables Fase 5
- ✅ Sistema de cache implementado
- ✅ Paginación en todos los listados
- ✅ Queries optimizadas
- ✅ CDN configurado
- ✅ Monitoreo de performance

---

## 🎯 Priorización para Entrevista de San Francisco

### **CRÍTICO (Antes de la entrevista si es posible)**:
1. ✅ Fase 1.1 - Modelo de datos multi-tenant
2. ✅ Fase 1.2 - Middleware de organización
3. ✅ Fase 2.1 - Modelo de datos para sedes
4. ✅ Fase 2.2 - Gestión de sedes en admin
5. ✅ Fase 2.3 - Asignación de canchas a sedes
6. ✅ Fase 2.4 - Selección de sede en torneos/ligas

### **IMPORTANTE (Para demostración)**:
7. ✅ Fase 1.3 - Sistema de roles multi-tenant
8. ✅ Fase 4.1 - Configuración básica de organización
9. ✅ Fase 3.1 - Cloudflare (protección básica)

### **NICE TO HAVE (Post-entrevista)**:
- Resto de las fases según roadmap

---

## 📊 Métricas de Éxito

### Fase 1 (Multi-Tenant):
- ✅ Múltiples organizaciones funcionando en la misma instancia
- ✅ Aislamiento completo de datos
- ✅ 0 regresiones en funcionalidad existente

### Fase 2 (Multi-Sede):
- ✅ Organizaciones pueden crear múltiples sedes
- ✅ Canchas asociadas correctamente a sedes
- ✅ Torneos/ligas funcionan con selección de sede

### Fase 3 (Seguridad):
- ✅ 0 ataques DDoS exitosos
- ✅ Rate limiting funcionando
- ✅ Logs de auditoría completos

### Fase 4 (Personalización):
- ✅ Cada organización puede personalizar branding
- ✅ Configuraciones guardadas y aplicadas correctamente

### Fase 5 (Optimización):
- ✅ Tiempo de respuesta < 200ms en 95% de requests
- ✅ Cache hit rate > 80%
- ✅ Queries optimizadas sin N+1

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Migración de Datos
**Mitigación**: 
- Scripts de migración probados en staging
- Backup completo antes de migración
- Rollback plan preparado

### Riesgo 2: Breaking Changes
**Mitigación**:
- Feature flags para nuevas funcionalidades
- Versionado de API
- Testing exhaustivo antes de deploy

### Riesgo 3: Performance Degradation
**Mitigación**:
- Monitoring continuo
- Load testing antes de releases
- Optimización incremental

---

## 📝 Notas Finales

- **Estimación Total**: 12-16 semanas (3-4 meses)
- **Equipo Recomendado**: 2-3 desarrolladores full-time
- **Prioridad**: Fases 1 y 2 son críticas para San Francisco
- **Flexibilidad**: Ajustar timeline según recursos disponibles

---

## 🔗 Recursos Necesarios

### Herramientas:
- Cloudflare (Pro plan recomendado)
- Redis (para cache)
- Monitoring tool (Datadog, New Relic, o similar)
- CI/CD pipeline mejorado

### Conocimientos:
- Multi-tenancy patterns
- Database migrations
- Security best practices
- Performance optimization

---

**Última actualización**: $(date)  
**Versión del Plan**: 1.0

