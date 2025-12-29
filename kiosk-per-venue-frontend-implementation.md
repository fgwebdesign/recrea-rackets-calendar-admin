# Resumen de Cambios: Kiosk por Venue - Guía para Frontend

## Contexto del Cambio

**ANTES:** El sistema tenía un kiosk único para todos los venues (sedes).

**AHORA:** Cada venue tiene su propio kiosk independiente con:
- Inventario separado por venue
- Ventas registradas por venue
- Reportes y estadísticas por venue

---

## Cambios en el Backend (Ya Implementados)

### 1. Validaciones Nuevas
- **Crear Producto:** El campo `venue_id` ahora es **OBLIGATORIO**
- **Crear Venta:** El campo `venue_id` ahora es **OBLIGATORIO** y se valida que los productos pertenezcan a ese venue

### 2. Nuevos Endpoints Disponibles
- `GET /kiosk/venue/:venue_id/summary` - Resumen completo del kiosk de un venue específico (inventario, ventas, alertas)
- `GET /kiosk/venues/comparison` - Comparativa de todos los kiosks (útil para dashboard de admin)
- `POST /kiosk/venues/copy-products` - Copiar productos de un venue a otro (útil para inicializar nuevo kiosk)

### 3. Endpoints Modificados
- `GET /kiosk/categories` - Ahora acepta parámetros opcionales `venue_id` e `include_product_count` para contar productos por venue

---

## Cambios Necesarios en el Frontend

### 1. Selección de Venue en el Kiosk

**ANTES:** El kiosk mostraba todos los productos de todos los venues.

**AHORA:** El usuario debe seleccionar un venue antes de poder usar el kiosk.

**Implementación Sugerida:**
- Mostrar un selector de venue al entrar a la sección de kiosk
- Guardar el venue seleccionado en el estado/contexto de la aplicación
- Filtrar todos los productos, ventas y reportes por el venue seleccionado
- Si el usuario solo tiene acceso a un venue, seleccionarlo automáticamente

---

### 2. Crear Producto

**ANTES:** El campo `venue_id` era opcional al crear un producto.

**AHORA:** El campo `venue_id` es **OBLIGATORIO**.

**Cambios Necesarios:**
- En el formulario de crear producto, agregar un selector de venue
- Si el usuario ya tiene un venue seleccionado en el contexto, usarlo por defecto
- Validar que el `venue_id` esté presente antes de enviar la petición
- Mostrar error si se intenta crear un producto sin venue

---

### 3. Registrar Venta

**ANTES:** El campo `venue_id` era opcional al crear una venta.

**AHORA:** El campo `venue_id` es **OBLIGATORIO** y se valida que los productos pertenezcan a ese venue.

**Cambios Necesarios:**
- Usar el venue seleccionado en el contexto para todas las ventas
- Al agregar productos al carrito, validar que pertenezcan al venue seleccionado
- Mostrar error si se intenta agregar un producto de otro venue al carrito
- Enviar el `venue_id` en el body de la petición de crear venta
- Si no hay venue seleccionado, mostrar mensaje de error antes de permitir crear venta

---

### 4. Listar Productos

**ANTES:** Se mostraban todos los productos de todos los venues.

**AHORA:** Solo se deben mostrar productos del venue seleccionado.

**Cambios Necesarios:**
- Agregar el parámetro `venue_id` a la query: `GET /kiosk/products?venue_id=xxx`
- Si hay un venue seleccionado, filtrar automáticamente los productos
- Mostrar solo productos que pertenezcan al venue activo
- Actualizar la lista cuando se cambie de venue

---

### 5. Listar Ventas

**ANTES:** Se mostraban todas las ventas de todos los venues.

**AHORA:** Solo se deben mostrar ventas del venue seleccionado.

**Cambios Necesarios:**
- Agregar el parámetro `venue_id` a la query: `GET /kiosk/sales?venue_id=xxx`
- Filtrar las ventas por el venue seleccionado
- En los reportes, también filtrar por venue
- Actualizar la lista cuando se cambie de venue

---

### 6. Dashboard del Kiosk

**ANTES:** Mostraba estadísticas globales de todos los venues.

**AHORA:** Debe mostrar estadísticas específicas del venue seleccionado.

**Cambios Necesarios:**
- Usar el nuevo endpoint `GET /kiosk/venue/:venue_id/summary` para obtener el resumen
- Mostrar métricas específicas del venue (inventario, ventas del día/mes, alertas de stock)
- Si el usuario es admin, mostrar opción de ver comparativa de todos los venues usando `GET /kiosk/venues/comparison`

---

### 7. Reportes

**ANTES:** Los reportes mostraban datos de todos los venues.

**AHORA:** Los reportes deben filtrarse por venue.

**Cambios Necesarios:**
- Agregar `venue_id` a todos los endpoints de reportes como parámetro de query
- Filtrar todos los reportes por el venue seleccionado
- Si el usuario es admin, permitir ver reportes de todos los venues o comparativas

---

### 8. Alertas de Stock Bajo

**ANTES:** Las alertas mostraban productos de todos los venues.

**AHORA:** Las alertas deben ser específicas del venue.

**Cambios Necesarios:**
- Agregar `venue_id` al endpoint: `GET /kiosk/inventory/alerts?venue_id=xxx`
- Mostrar solo alertas del venue seleccionado
- Actualizar alertas cuando se cambie de venue

---

## Flujo de Usuario Sugerido

### Escenario 1: Usuario con un Solo Venue
1. Al entrar al kiosk, detectar automáticamente el venue del usuario (si está asociado a uno)
2. Seleccionar ese venue automáticamente
3. Ocultar el selector de venue (no es necesario si solo tiene uno)

### Escenario 2: Usuario Admin con Múltiples Venues
1. Mostrar selector de venue al entrar al kiosk
2. Permitir cambiar de venue en cualquier momento
3. Al cambiar de venue, actualizar automáticamente:
   - Lista de productos
   - Lista de ventas
   - Reportes
   - Alertas de stock
4. Mostrar comparativa de todos los venues en el dashboard

### Escenario 3: Inicializar Nuevo Kiosk
1. Si un venue no tiene productos, mostrar opción de copiar desde otro venue
2. Usar el endpoint `POST /kiosk/venues/copy-products` con `source_venue_id` y `target_venue_id`
3. Opcionalmente, permitir copiar con o sin stock inicial

---

## Consideraciones de UX

1. **Persistencia:** Guardar el venue seleccionado en localStorage o en el estado de la app para que persista entre sesiones
2. **Feedback Visual:** Mostrar claramente qué venue está activo (badge, indicador, etc.)
3. **Validaciones:** Mostrar errores claros si se intenta usar productos de otro venue
4. **Transiciones:** Al cambiar de venue, mostrar loading mientras se cargan los datos
5. **Permisos:** Usuarios no-admin solo deberían ver su venue asignado

---

## Resumen de Endpoints Afectados

| Endpoint | Cambio | Acción Frontend |
|----------|--------|-----------------|
| `POST /kiosk/products` | `venue_id` requerido | Agregar selector de venue |
| `GET /kiosk/products` | Filtrar por `venue_id` | Enviar `venue_id` en query |
| `POST /kiosk/sales` | `venue_id` requerido | Usar venue del contexto |
| `GET /kiosk/sales` | Filtrar por `venue_id` | Enviar `venue_id` en query |
| `GET /kiosk/categories` | Opcional `venue_id` | Opcional: enviar para conteo |
| `GET /kiosk/reports/*` | Filtrar por `venue_id` | Enviar `venue_id` en query |
| `GET /kiosk/inventory/alerts` | Filtrar por `venue_id` | Enviar `venue_id` en query |

---

## Nuevos Endpoints Disponibles

| Endpoint | Uso |
|----------|-----|
| `GET /kiosk/venue/:venue_id/summary` | Dashboard del kiosk de un venue específico |
| `GET /kiosk/venues/comparison` | Comparativa de todos los kiosks (solo admin) |
| `POST /kiosk/venues/copy-products` | Copiar productos entre venues (solo admin) |

---

## Checklist de Implementación Frontend

- [ ] Agregar selector de venue en la vista del kiosk
- [ ] Guardar venue seleccionado en estado/contexto
- [ ] Actualizar formulario de crear producto (agregar `venue_id`)
- [ ] Actualizar formulario de crear venta (agregar `venue_id`)
- [ ] Filtrar productos por `venue_id` en todas las listas
- [ ] Filtrar ventas por `venue_id` en todas las listas
- [ ] Actualizar dashboard para usar el nuevo endpoint de resumen
- [ ] Actualizar reportes para filtrar por `venue_id`
- [ ] Actualizar alertas de stock para filtrar por `venue_id`
- [ ] Agregar validación para evitar mezclar productos de diferentes venues
- [ ] Implementar vista de comparativa de venues (admin)
- [ ] Implementar funcionalidad de copiar productos entre venues (admin)
- [ ] Agregar persistencia del venue seleccionado (localStorage)
- [ ] Agregar indicadores visuales del venue activo
- [ ] Manejar casos de error cuando no hay venue seleccionado

---

## Notas Adicionales

- Las categorías de productos siguen siendo globales (compartidas entre todos los venues)
- Cada producto debe pertenecer a un venue específico
- Cada venta debe estar asociada a un venue específico
- Los movimientos de inventario ya están rastreados por venue
- El trigger de validación en la base de datos previene ventas con productos de diferentes venues

---

**Fecha de Creación:** Diciembre 2024
**Versión:** 1.0

