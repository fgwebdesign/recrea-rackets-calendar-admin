# 🎾 GUIÓN DE DEMO - Matchly Platform

**Fecha:** Viernes 16 de Enero, 17:30hs  
**Cliente potencial:** Club de Pádel (nuevo)  
**Duración estimada:** 30-45 minutos

---

## 📋 CHECKLIST DE PREPARACIÓN (Antes de la demo)

### Base de Datos Limpia
- [ ] Borrar datos de Supabase (torneos, ligas, equipos, partidos, ventas, productos)
- [ ] Mantener: usuarios de prueba, categorías base, canchas

### Datos Mínimos a Tener
- [ ] **1 Venue creado** (ej: "Club Demo Pádel", con dirección ficticia)
- [ ] **2-3 Canchas** asociadas al venue
- [ ] **Categorías de jugadores** (Quinta, Cuarta, Tercera, etc.)
- [ ] **Categorías de productos** para kiosk (Bebidas, Cervezas, Comida, etc.)
- [ ] **2-4 Usuarios de prueba** para inscribir equipos

### Verificar que Funciona
- [ ] Backend corriendo en `localhost:9999`
- [ ] Frontend corriendo en `localhost:3001`
- [ ] Login de admin funciona
- [ ] Crear torneo funciona
- [ ] Kiosk funciona (ventas)

---

## 🎬 ESTRUCTURA DE LA DEMO (Orden sugerido)

### BLOQUE 1: INTRODUCCIÓN (3-5 min)
> "Les voy a mostrar Matchly, una plataforma completa para gestionar clubes de pádel"

**Puntos clave a mencionar:**
- Sistema diseñado específicamente para clubes de pádel/tenis
- Multi-sede: pueden tener varias sedes con todo separado
- Todo en la nube, accesible desde cualquier dispositivo
- Incluye: Torneos, Ligas, Kiosco/POS, Gestión de canchas

---

### BLOQUE 2: VENUES Y CANCHAS (5 min)

#### 2.1 Mostrar Gestión de Sedes
**Ruta:** `/venues`

**Acciones:**
1. Mostrar la lista de sedes
2. Crear una nueva sede (si no existe):
   - Nombre: "Club Demo Pádel" (o el nombre del cliente)
   - Dirección, ciudad
   - Mostrar que se puede subir logo

**Destacar:**
> "Cada sede tiene su propia configuración, canchas, productos del kiosco y estadísticas independientes"

#### 2.2 Mostrar Gestión de Canchas
**Ruta:** `/courts`

**Acciones:**
1. Crear 2-3 canchas para el venue:
   - "Cancha 1 - Principal"
   - "Cancha 2"
   - "Cancha 3" (opcional)
2. Mostrar configuración: tipo de cancha, si está activa

**Destacar:**
> "Las canchas se asignan a torneos y ligas para programar los partidos automáticamente"

---

### BLOQUE 3: TORNEOS (10-15 min) ⭐ FEATURE PRINCIPAL

#### 3.1 Crear un Torneo
**Ruta:** `/tournaments/create`

**Datos del torneo demo:**
```
Nombre: "Torneo Inauguración 2026"
Categoría: Quinta (o la que prefieran)
Fecha inicio: (próximo fin de semana)
Fecha fin: (2-3 días después)
Tipo: 12 jugadores (4 grupos de 3)
Costo inscripción: $1500
Canchas disponibles: 2-3
Premios: "Trofeo + Pack de productos"
```

**Destacar:**
> "El sistema soporta torneos de 9, 12 o 16 equipos con diferentes formatos de eliminatorias"

#### 3.2 Inscribir Equipos (Admin)
**Ruta:** `/tournaments/[id]/admin-register-team`

**Acciones:**
1. Inscribir 3-4 equipos manualmente
2. Mostrar selección de restricciones horarias
3. Mostrar que se actualiza el contador de cupos

**Destacar:**
> "Los jugadores pueden inscribirse desde su celular, pero el admin también puede hacerlo por ellos"

> "Los jugadores indican en qué horario NO pueden jugar, y el sistema lo respeta al programar"

#### 3.3 Generar Grupos
**Ruta:** `/tournaments/[id]/groups`

**Acciones:**
1. Click en "Generar Grupos Automáticamente"
2. Mostrar cómo se distribuyen los equipos
3. Mencionar que respeta restricciones horarias

**Destacar:**
> "El algoritmo distribuye los equipos intentando evitar conflictos. Si alguien no puede viernes tarde, no lo pone en ese grupo"

#### 3.4 Programar Partidos
**Ruta:** `/tournaments/[id]/matches`

**Acciones:**
1. Click en "Programar Partidos"
2. Mostrar el calendario de partidos generado
3. Mostrar asignación automática de canchas y horarios

**Destacar:**
> "Programación 100% automática: asigna canchas, horarios, y evita que un equipo juegue dos partidos seguidos"

#### 3.5 Cargar Resultados
**Ruta:** `/tournaments/[id]/matches` (click en un partido)

**Acciones:**
1. Seleccionar un partido
2. Cargar resultado: Set 1 (7-5), Set 2 (4-7), Super Tiebreak (11-8)
3. Mostrar que se actualiza automáticamente

**Destacar:**
> "Sistema de puntuación uruguayo: 2 sets a 7, super tiebreak a 11 si empatan. Pueden personalizarlo"

#### 3.6 Tabla de Posiciones
**Ruta:** `/tournaments/[id]/standings`

**Acciones:**
1. Mostrar standings por grupo
2. Mostrar criterios de desempate (sets, games)

**Destacar:**
> "Se actualiza en tiempo real. Los jugadores pueden verlo desde su celular"

#### 3.7 Bracket Eliminatorio
**Ruta:** `/tournaments/[id]/bracket`

**Acciones:**
1. Mostrar estructura del bracket (si hay resultados suficientes)
2. Explicar clasificación: Top 2 de cada grupo a cuartos

**Destacar:**
> "Los equipos clasificados se asignan automáticamente al bracket. Pueden programar semifinales y final con un click"

---

### BLOQUE 4: LIGAS (5-7 min)

#### 4.1 Crear una Liga
**Ruta:** `/leagues/create`

**Datos de la liga demo:**
```
Nombre: "Liga Primavera 2026"
Categoría: Quinta
Fecha inicio: (próxima semana)
Fecha fin: (en 2 meses)
Descripción: "Liga semanal todos contra todos"
```

**Destacar:**
> "Las ligas son diferentes a los torneos: se juegan semana a semana, con tabla de posiciones acumulativa"

#### 4.2 Mostrar Partidos de Liga
**Ruta:** `/leagues/[id]/matches`

**Destacar:**
> "Pueden programar partidos semanales, cargar resultados, y la tabla se actualiza sola"

---

### BLOQUE 5: KIOSCO / PUNTO DE VENTA (7-10 min) ⭐ FEATURE DESTACADO

#### 5.1 Gestión de Productos
**Ruta:** `/kiosk/products`

**Acciones:**
1. Crear 3-4 productos de ejemplo:
   - Cerveza Pilsen 1L - $120
   - Agua mineral - $50
   - Hamburguesa - $180
   - Grip Wilson - $80
2. Mostrar categorías, stock, alertas de inventario

**Destacar:**
> "Cada sede tiene su propio inventario. Pueden controlar stock, ver alertas cuando hay poco, y registrar compras"

#### 5.2 Punto de Venta (POS)
**Ruta:** `/kiosk`

**Acciones:**
1. Agregar productos al carrito
2. Mostrar métodos de pago: Efectivo, Transferencia, Tarjeta, MercadoPago
3. Ingresar nombre de cliente
4. Confirmar venta
5. Mostrar que el stock se actualizó

**Destacar:**
> "Interfaz super simple, pensada para que cualquier empleado pueda vender sin capacitación"

> "Pueden marcar ventas durante torneos o ligas para tener estadísticas de consumo por evento"

#### 5.3 Reportes de Kiosco
**Ruta:** `/kiosk/reports`

**Acciones:**
1. Mostrar dashboard con ventas del día
2. Mostrar productos más vendidos
3. Mostrar ventas por método de pago

**Destacar:**
> "Dashboard completo: ventas diarias, semanales, mensuales. Productos más vendidos. Todo filtrable por sede"

---

### BLOQUE 6: DASHBOARD PRINCIPAL (3 min)

**Ruta:** `/dashboard`

**Mostrar:**
1. Torneos activos
2. Próximos partidos
3. Estadísticas generales
4. Widget del clima (para pádel outdoor)

**Destacar:**
> "Vista general de todo lo que pasa en el club de un vistazo"

---

### BLOQUE 7: OTRAS FEATURES (Mencionar rápido, 2 min)

- **Gestión de usuarios:** Ver jugadores registrados
- **Categorías:** Quinta, Cuarta, Tercera, etc.
- **Pagos:** Control de pagos de inscripciones (quién pagó, quién debe)
- **Sponsors:** Agregar sponsors a torneos
- **Profesores:** (si aplica) Gestión de clases
- **Multi-idioma:** Español e Inglés

---

## 💡 PUNTOS CLAVE A DESTACAR

### Automatización
> "Lo que antes tomaba horas (armar grupos, programar partidos), ahora es un click"

### Multi-sede
> "Perfecto para clubes que crecen y abren nuevas sedes"

### Experiencia del Jugador
> "Los jugadores pueden ver partidos, resultados y standings desde su celular"

### Kiosko Integrado
> "No necesitan otro sistema para el bar/kiosko. Todo integrado"

### Reportes y Estadísticas
> "Saben exactamente cuánto facturan en torneos, ligas, y kiosco"

---

## ❓ PREGUNTAS FRECUENTES Y RESPUESTAS

### "¿Cuánto cuesta?"
> "Tenemos diferentes planes según el tamaño del club. Podemos armar una propuesta personalizada después de entender mejor sus necesidades"

### "¿Los jugadores necesitan app?"
> "No, todo es web responsive. Funciona desde cualquier navegador en celular"

### "¿Pueden inscribirse solos los jugadores?"
> "Sí, pueden auto-inscribirse con sus restricciones horarias. El admin solo valida"

### "¿Funciona offline?"
> "Necesita conexión para la mayoría de funciones, pero el kiosco puede funcionar offline y sincronizar después" (verificar si esto está implementado)

### "¿Podemos personalizar los formatos de torneo?"
> "Sí, soportamos diferentes formatos. Si tienen algo específico, podemos adaptarlo"

### "¿Se integra con MercadoPago?"
> "Sí, pueden recibir pagos directamente y queda registrado en el sistema"

---

## 📝 DATOS DE EJEMPLO PARA CREAR

### Venue
```
Nombre: [Nombre del club del cliente]
Dirección: Av. Principal 1234
Ciudad: San Francisco / Montevideo
Email: contacto@[club].com
```

### Canchas
```
- Cancha 1 - Principal (Techada)
- Cancha 2 (Exterior)
- Cancha 3 (Exterior)
```

### Productos Kiosko
```
| Producto | Precio | Stock | Categoría |
|----------|--------|-------|-----------|
| Cerveza Pilsen 1L | $120 | 50 | Cervezas |
| Agua mineral 500ml | $50 | 100 | Bebidas |
| Gatorade | $80 | 30 | Bebidas |
| Hamburguesa | $200 | 20 | Comida |
| Grip Wilson | $150 | 15 | Accesorios |
```

### Usuarios Demo (para inscribir equipos)
```
- Juan Demo / juan@demo.com
- Pedro Demo / pedro@demo.com
- María Demo / maria@demo.com
- Ana Demo / ana@demo.com
```

---

## 🚀 DESPUÉS DE LA DEMO

1. **Preguntar:** "¿Qué les pareció? ¿Qué funcionalidad les interesa más?"
2. **Identificar necesidades específicas** del cliente
3. **Agendar seguimiento** para propuesta formal
4. **Enviar resumen** por email con links de acceso demo (si aplica)

---

## ⚠️ POSIBLES PROBLEMAS Y SOLUCIONES

### Error al crear venta en kiosk
**Solución:** Se corrigió el trigger `validate_product_venue`. Verificar que la migración se ejecutó.

### Error de autenticación
**Solución:** Verificar que el backend está corriendo y el token es válido.

### Grupos no se generan
**Solución:** Necesitan al menos 3 equipos inscritos para generar grupos.

### No aparecen productos
**Solución:** Verificar que los productos tienen `venue_id` y están activos.

---

**¡Éxito con la demo! 🎾🚀**
