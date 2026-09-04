# Lanzamiento Liga Nocturna Verano 2026 — guía de carga

Referencia para cargar la liga real en el admin de producción y compartir el link de
inscripción. Basado en el flyer de WhatsApp y verificado con `tools/prod-test-lifecycle.js`
(matchly-backend) contra la Supabase de producción real, con usuarios de prueba.

## 1. Categorías y días (ya cargado en producción, verificar antes de arrancar)

| Categoría | `play_day` | Grupos A/B | Cupo |
|---|---|---|---|
| Sexta | monday | No | 8 |
| Quinta | tuesday | No | 8 |
| Tercera | wednesday | **Sí** | 8 por grupo (16 total) |
| Cuarta | thursday | **Sí** | 8 por grupo (16 total) |
| Segunda | tuesday | No | 8 |

Verificar con `GET /categories` que las 5 existan con estos `play_day`. Si falta alguna o el
día está mal, corregirlo ANTES de crear la liga (el wizard de creación también permite
reasignar el día por categoría, vía el paso "Asignar días").

## 2. Por qué Segunda se crea aparte

Segunda y Quinta juegan el mismo día de la semana (martes), pero en semanas alternadas
(según el flyer: semana 1 = Quinta, semana 2 = Segunda). El sistema no tiene un concepto de
"semana par/impar" a nivel categoría — se logra dándole a cada liga una `start_date` distinta:

- Quinta arranca la semana 1.
- Segunda arranca la semana 2 (7 días después de Quinta).

Por eso **Segunda tiene que crearse en un wizard aparte**, no junto con las demás.

## 3. `start_date` a usar — ⚠️ el detalle que rompe todo si se hace mal

`getNextDayOccurrence` busca la PRÓXIMA ocurrencia del día de juego a partir de `start_date`.
Si `start_date` cae justo el mismo día de la semana que el día de juego, salta a la semana
siguiente sin avisar (el primer partido se corre 7 días). **`start_date` tiene que ser un día
ANTES del primer día de juego real, nunca el mismo día de la semana.**

Arrancando el lunes 7/9/2026:

| Tanda | Categorías | `start_date` a cargar | Primer partido real |
|---|---|---|---|
| 1 | Sexta, Quinta, Tercera, Cuarta | **04/09 al 06/09** (cualquier día antes del lunes 7) | Lunes 7/9 (Sexta), Martes 8/9 (Quinta), Miércoles 9/9 (Tercera, Grupo A), Jueves 10/9 (Cuarta, Grupo A) |
| 2 | Segunda | **09/09 al 14/09** (después del martes 8, antes del martes 15) | Martes 15/9 |

## 4. Orden de carga en el admin

1. **Tanda 1**: un solo wizard de "Crear liga", seleccionando las 4 categorías juntas
   (Sexta, Quinta, Tercera, Cuarta), `start_date` de la Tanda 1, activar "Sistema de Grupos"
   (el checkbox aplica solo a Tercera/Cuarta automáticamente — Sexta/Quinta lo ignoran).
   - Cupo a cargar: **8** (el campo dice "equipos por grupo" cuando hay grupos activado — el
     sistema ya duplica automáticamente a 16 para Tercera/Cuarta; para Sexta/Quinta queda en 8).
2. **Tanda 2**: wizard aparte, solo Segunda, `start_date` de la Tanda 2, sin grupos, cupo 8.

## 5. Generar los partidos — cuándo y cómo

- **Sexta, Quinta, Segunda** (sin grupos): apenas se llenen los 8 cupos, el botón
  "Generar partidos de la liga" en el admin alcanza. Genera las 7 fechas de la temporada de una.
- **Tercera y Cuarta** (con grupos): dos escenarios reales, según lo que está pasando hoy
  (Grupo A ya lleno, Grupo B recién abriendo):
  - Si **ambos grupos ya están llenos** (16/16) al momento de generar: un solo click en
    "Generar partidos de la liga" alcanza, arma las 14 fechas completas (A y B alternando).
  - Si **solo el Grupo A está lleno** (como Tercera hoy) y el Grupo B se va a completar
    después: generar igual con "Generar partidos de la liga" — el sistema arma solo las
    fechas del Grupo A, dejando las semanas alternadas libres para el Grupo B. **Cuando el
    Grupo B se complete, hay que generarle el fixture aparte.**

### ⚠️ Pendiente: no hay botón en el admin para generar el Grupo B después

El backend sí tiene el endpoint (`POST /leagues/:leagueId/generate-group-fixture` con
`{ "groupName": "B" }`), pero **el admin no tiene ninguna pantalla conectada a él todavía**.
Hasta que se agregue esa pantalla, cuando el Grupo B de Tercera o Cuarta se complete hay que
llamarlo a mano (con el token de admin real, no el de prueba):

```
curl -X POST "https://recrea-backend-itrk.onrender.com/leagues/<leagueId>/generate-group-fixture" \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"groupName": "B", "rounds": 1}'
```

## 6. Cuándo termina la temporada (arrancando el 7/9)

Verificado generando la temporada completa de prueba (7 rondas por grupo, cada 15 días):

| Categoría | Arranca | Termina |
|---|---|---|
| Sexta | 7/9 | 30/11 |
| Quinta | 8/9 | 1/12 |
| Tercera | 9/9 (A) / 16/9 (B) | 9/12 (cierra B) |
| Cuarta | 10/9 (A) / 17/9 (B) | 10/12 |
| Segunda | 15/9 | 8/12 |

Toda la Liga Nocturna: **7/9 → 10/12/2026** (~13 semanas).

## 7. Precio de inscripción

El flyer dice: **equipos nuevos $4.000 / equipos que jugaron la Liga Nocturna anterior $3.200**.

⚠️ El sistema **no soporta precios distintos por equipo** — `inscription_cost` es un valor único
por liga, y `inscription_paid` es solo un booleano (pagado/no pagado), no guarda el monto.

**Cargar la liga con `inscription_cost = 4000`** (el precio "de lista" que se muestra en la
app a todos por igual). El descuento a $3.200 para equipos que jugaron la temporada anterior
hay que seguir manejándolo **fuera de la app**, como ya se venía haciendo (WhatsApp/efectivo/
transferencia) — no queda registrado el monto real cobrado, solo si se marcó "pagado" o no.

Si más adelante quieren que la app soporte esto (precio distinto por equipo o descuento por
"jugó la temporada anterior"), es un cambio de modelo de datos — avisar para planificarlo,
no es parte de este lanzamiento.

## 8. Suplentes — cómo funciona hoy

- Al inscribirse (paso 1 del registro), hay un bloque **opcional, máximo 2 suplentes**, que se
  buscan entre usuarios ya registrados en la app (no texto libre) — se excluyen los titulares.
- Se pueden agregar o cambiar **en cualquier momento después**, desde "Mi equipo" en el client,
  sin importar el estado de la liga (inscribiendo, activa, etc.) — solo un titular del equipo
  puede editarlos.
- **Los suplentes no tienen campo de talle de remera** en ningún lado del sistema. El
  formulario de Google preguntaba esto como texto libre — si algún suplente pide remera, hay
  que anotarlo aparte (no queda en la base ni se ve en el admin/client).

## 9. Antes de compartir el link a los socios

1. Confirmar en el admin que las 5 ligas quedaron creadas con el `start_date` correcto de
   cada tanda (punto 3).
2. Si alguna categoría ya tiene equipos reales anotados por WhatsApp/formulario antes de
   crear la liga, cargarlos manualmente o guiarlos para que se re-inscriban desde el link —
   confirmar cupos reales contra lo que se venía informando por WhatsApp antes de cerrar
   inscripciones.
3. Una vez llena cada categoría, generar el fixture (punto 5) y revisar en el admin
   (`/leagues/[id]/matches`) que no haya fechas ni horarios repetidos antes de avisar a los
   socios cuándo juegan.
4. Recién ahí compartir el link de inscripción / avisar por WhatsApp que ya están los
   partidos programados.

## 10. Herramientas de verificación (matchly-backend)

- `tools/simulate-league-lifecycle.js` — simulación pura, sin tocar ninguna base de datos.
  Corre en segundos, útil para probar cambios de lógica antes de tocar producción.
- `tools/prod-test-lifecycle.js run|cleanup` — prueba real contra producción con usuarios y
  ligas de prueba aisladas (nombre `"⚠️ TEST BORRAR - ..."`), nunca toca las ligas reales.
  Requiere el backend corriendo local contra producción (`./ARRANCAR.sh`, puerto 9999).
