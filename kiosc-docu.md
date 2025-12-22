# Sistema de Kiosco / Punto de Venta

## Descripción General

El sistema de kiosco permite gestionar productos y ventas del club de pádel. Incluye:

- **Categorías de productos**: Bebidas, cervezas, comida, paletas, pelotas, indumentaria, accesorios
- **Gestión de productos**: CRUD completo con control de inventario
- **Registro de ventas**: Con múltiples métodos de pago y contextos
- **Reportes**: Resumen de ventas, productos más vendidos, movimientos de inventario

## Tablas de Base de Datos

### `product_categories`
Categorías para organizar los productos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | ID único |
| name | text | Nombre de la categoría |
| slug | text | Slug URL-friendly |
| description | text | Descripción |
| icon | text | Icono para el frontend |
| color | text | Color hex para UI |
| sort_order | integer | Orden de visualización |
| is_active | boolean | Si está activa |

**Categorías por defecto**:
- 🥤 Bebidas
- 🍺 Cervezas
- 🍔 Comida
- 🎾 Paletas
- ⚪ Pelotas
- 👕 Indumentaria
- 🎒 Accesorios
- 📦 Otros

### `products`
Productos disponibles para la venta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | ID único |
| category_id | uuid | FK a categoría |
| name | text | Nombre del producto |
| description | text | Descripción |
| sku | text | Código del producto |
| barcode | text | Código de barras |
| price | numeric | Precio de venta |
| cost_price | numeric | Precio de costo |
| stock_quantity | integer | Cantidad en stock |
| min_stock_alert | integer | Alerta de stock bajo |
| track_inventory | boolean | Si rastrea inventario |
| image_url | text | URL de imagen |
| is_active | boolean | Si está activo |
| is_featured | boolean | Si es destacado |
| venue_id | uuid | FK a sede (opcional) |

### `sales`
Cabecera de las ventas realizadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | ID único |
| sale_number | serial | Número de venta |
| venue_id | uuid | FK a sede |
| user_id | uuid | FK a vendedor |
| customer_id | uuid | FK a cliente (si está registrado) |
| customer_name | text | Nombre del cliente |
| subtotal | numeric | Subtotal |
| discount_amount | numeric | Descuento en dinero |
| discount_percent | numeric | Descuento en porcentaje |
| total | numeric | Total final |
| payment_method | text | Método de pago |
| payment_status | text | Estado del pago |
| payment_reference | text | Referencia de pago |
| sale_context | text | Contexto de la venta |
| tournament_id | uuid | FK a torneo (opcional) |
| league_id | uuid | FK a liga (opcional) |
| notes | text | Notas |
| sale_date | timestamp | Fecha de venta |

**Métodos de pago** (`payment_method`):
- `cash` - Efectivo
- `transfer` - Transferencia
- `card` - Tarjeta
- `mixed` - Combinado
- `pending` - Pendiente

**Estados de pago** (`payment_status`):
- `pending` - Pendiente
- `completed` - Completado
- `refunded` - Reembolsado
- `cancelled` - Cancelado

**Contextos de venta** (`sale_context`):
- `general` - Venta general
- `tournament` - Durante un torneo
- `league` - Durante una liga
- `class` - Durante una clase
- `booking` - Durante una reserva

### `sale_items`
Detalle de productos en cada venta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | ID único |
| sale_id | uuid | FK a venta |
| product_id | uuid | FK a producto |
| quantity | integer | Cantidad vendida |
| unit_price | numeric | Precio unitario |
| discount_amount | numeric | Descuento aplicado |
| total | numeric | Total del item |
| product_name | text | Nombre (snapshot) |
| product_sku | text | SKU (snapshot) |

### `inventory_movements`
Historial de movimientos de inventario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | ID único |
| product_id | uuid | FK a producto |
| movement_type | text | Tipo de movimiento |
| quantity | integer | Cantidad (+/-) |
| previous_stock | integer | Stock anterior |
| new_stock | integer | Stock nuevo |
| reference_type | text | Tipo de referencia |
| reference_id | uuid | ID de referencia |
| notes | text | Notas |
| user_id | uuid | FK a usuario |
| venue_id | uuid | FK a sede |

**Tipos de movimiento** (`movement_type`):
- `sale` - Venta
- `purchase` - Compra
- `adjustment` - Ajuste manual
- `return` - Devolución
- `loss` - Pérdida
- `transfer` - Transferencia entre sedes

---

## API Endpoints

### Categorías

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/kiosk/categories` | Listar categorías | No |
| POST | `/kiosk/categories` | Crear categoría | Admin |
| PUT | `/kiosk/categories/:id` | Actualizar categoría | Admin |
| DELETE | `/kiosk/categories/:id` | Eliminar categoría | Admin |

### Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/kiosk/products` | Listar productos | No |
| GET | `/kiosk/products/:id` | Obtener producto | No |
| POST | `/kiosk/products` | Crear producto | Admin |
| PUT | `/kiosk/products/:id` | Actualizar producto | Admin |
| DELETE | `/kiosk/products/:id` | Eliminar producto | Admin |
| PATCH | `/kiosk/products/:id/stock` | Actualizar stock | Admin |

**Query params para GET /products**:
- `category_id` - Filtrar por categoría
- `venue_id` - Filtrar por sede
- `is_active` - Filtrar por estado
- `search` - Buscar por nombre
- `low_stock` - Solo productos con stock bajo

### Ventas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/kiosk/sales` | Listar ventas | Admin |
| GET | `/kiosk/sales/:id` | Obtener venta | Admin |
| POST | `/kiosk/sales` | Crear venta | Admin |
| POST | `/kiosk/sales/:id/cancel` | Cancelar venta | Admin |

**Query params para GET /sales**:
- `venue_id` - Filtrar por sede
- `payment_method` - Filtrar por método de pago
- `payment_status` - Filtrar por estado
- `sale_context` - Filtrar por contexto
- `start_date` / `end_date` - Rango de fechas
- `limit` / `offset` - Paginación

### Reportes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/kiosk/reports/summary` | Resumen de ventas | Admin |
| GET | `/kiosk/reports/top-products` | Productos más vendidos | Admin |
| GET | `/kiosk/inventory/movements` | Movimientos de inventario | Admin |

---

## Ejemplos de Uso

### Crear un producto

```json
POST /kiosk/products
{
  "category_id": "uuid-de-categoria",
  "name": "Cerveza Pilsen 1L",
  "description": "Cerveza Pilsen de litro bien fría",
  "sku": "CERV-PILS-1L",
  "price": 120,
  "cost_price": 80,
  "stock_quantity": 48,
  "min_stock_alert": 12,
  "track_inventory": true,
  "is_active": true,
  "is_featured": true
}
```

### Registrar una venta

```json
POST /kiosk/sales
{
  "items": [
    { "product_id": "uuid-producto-1", "quantity": 3 },
    { "product_id": "uuid-producto-2", "quantity": 2 }
  ],
  "payment_method": "cash",
  "customer_name": "Juan Pérez",
  "sale_context": "tournament",
  "notes": "Venta durante partido de cuartos de final"
}
```

### Actualizar stock (compra de inventario)

```json
PATCH /kiosk/products/:id/stock
{
  "quantity": 24,
  "movement_type": "purchase",
  "notes": "Compra de stock - Proveedor XYZ"
}
```

---

## Características Automáticas

### Actualización automática de stock
Cuando se registra una venta, el sistema automáticamente:
1. Reduce el stock de cada producto vendido
2. Registra el movimiento en `inventory_movements`

### Protección de productos con ventas
Si intentas eliminar un producto que ya tiene ventas asociadas, el sistema lo **desactiva** en lugar de eliminarlo, preservando el historial.

### Cancelación de ventas
Al cancelar una venta, opcionalmente puedes restaurar el stock de los productos.

---

## Frontend Sugerido

### Panel de Kiosco
```
┌─────────────────────────────────────────────────────────────┐
│  🛒 KIOSCO                                         💰 $5,420 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ 🥤     │ │ 🍺     │ │ 🍔     │ │ 🎾     │ │ 👕     │    │
│  │Bebidas │ │Cervezas│ │ Comida │ │Paletas │ │ Ropa   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Productos disponibles                              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  🍺 Cerveza Pilsen 1L        $120    [48 uds]  [+]  │   │
│  │  🍺 Cerveza Patricia 1L      $140    [36 uds]  [+]  │   │
│  │  🥤 Agua mineral 500ml       $50     [100 uds] [+]  │   │
│  │  🍔 Hamburguesa              $180    [15 uds]  [+]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🛒 Carrito                                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Cerveza Pilsen 1L    x3              $360          │   │
│  │  Agua mineral 500ml   x2              $100          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  TOTAL:                               $460          │   │
│  │                                                     │   │
│  │  [💵 Efectivo] [💳 Transferencia] [💳 Tarjeta]     │   │
│  │                                                     │   │
│  │              [ CONFIRMAR VENTA ]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Menú de navegación sugerido
Agregar en la sidebar del admin:
- **KIOSCO** (sección nueva)
  - Punto de Venta
  - Productos
  - Categorías
  - Ventas
  - Reportes
  - Inventario

