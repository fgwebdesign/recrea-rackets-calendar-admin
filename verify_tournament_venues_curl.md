# 🔍 Comandos curl para verificar registros de venues en torneos

## 📋 IDs de los torneos creados:
- `692293d4-08b7-447a-91ab-13e928e98148`
- `715c9c16-6d81-4f08-a2ba-9ba1351ce3a2`
- `8b96f0d3-d088-460b-8f24-52e46bef0df9`
- `ba2c365f-23c8-43c6-9a24-5c8363178555`

## 🔑 Reemplaza `<TOKEN>` con tu token de autenticación
## 🌐 Reemplaza `http://localhost:9999` con tu URL del backend si es diferente

---

## 1️⃣ Verificar torneo completo (incluye tournament_venues)

```bash
# Torneo 1
curl -X GET "http://localhost:9999/tournaments/692293d4-08b7-447a-91ab-13e928e98148" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.tournament_venues'

# Torneo 2
curl -X GET "http://localhost:9999/tournaments/715c9c16-6d81-4f08-a2ba-9ba1351ce3a2" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.tournament_venues'

# Torneo 3
curl -X GET "http://localhost:9999/tournaments/8b96f0d3-d088-460b-8f24-52e46bef0df9" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.tournament_venues'

# Torneo 4
curl -X GET "http://localhost:9999/tournaments/ba2c365f-23c8-43c6-9a24-5c8363178555" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.tournament_venues'
```

---

## 2️⃣ Verificar endpoint específico de venues (si está disponible)

```bash
# Torneo 1
curl -X GET "http://localhost:9999/tournaments/692293d4-08b7-447a-91ab-13e928e98148/venues" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.'

# Torneo 2
curl -X GET "http://localhost:9999/tournaments/715c9c16-6d81-4f08-a2ba-9ba1351ce3a2/venues" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.'

# Torneo 3
curl -X GET "http://localhost:9999/tournaments/8b96f0d3-d088-460b-8f24-52e46bef0df9/venues" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.'

# Torneo 4
curl -X GET "http://localhost:9999/tournaments/ba2c365f-23c8-43c6-9a24-5c8363178555/venues" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" | jq '.'
```

---

## 3️⃣ Verificar directamente en Supabase (SQL)

Si tienes acceso a Supabase, puedes ejecutar estas consultas:

```sql
-- Verificar tournament_venues para todos los torneos
SELECT 
  tv.id,
  tv.tournament_id,
  tv.venue_id,
  tv.is_primary,
  tv.courts_count,
  tv.notes,
  v.name as venue_name,
  t.name as tournament_name
FROM tournament_venues tv
JOIN tournaments t ON tv.tournament_id = t.id
LEFT JOIN venues v ON tv.venue_id = v.id
WHERE tv.tournament_id IN (
  '692293d4-08b7-447a-91ab-13e928e98148',
  '715c9c16-6d81-4f08-a2ba-9ba1351ce3a2',
  '8b96f0d3-d088-460b-8f24-52e46bef0df9',
  'ba2c365f-23c8-43c6-9a24-5c8363178555'
)
ORDER BY tv.tournament_id, tv.is_primary DESC;

-- Verificar tournament_venue_courts para todos los torneos
SELECT 
  tvc.id,
  tvc.tournament_venue_id,
  tvc.court_id,
  tvc.is_available,
  tvc.priority,
  tv.tournament_id,
  tv.venue_id,
  c.name as court_name,
  v.name as venue_name,
  t.name as tournament_name
FROM tournament_venue_courts tvc
JOIN tournament_venues tv ON tvc.tournament_venue_id = tv.id
JOIN tournaments t ON tv.tournament_id = t.id
LEFT JOIN courts c ON tvc.court_id = c.id
LEFT JOIN venues v ON tv.venue_id = v.id
WHERE tv.tournament_id IN (
  '692293d4-08b7-447a-91ab-13e928e98148',
  '715c9c16-6d81-4f08-a2ba-9ba1351ce3a2',
  '8b96f0d3-d088-460b-8f24-52e46bef0df9',
  'ba2c365f-23c8-43c6-9a24-5c8363178555'
)
ORDER BY tv.tournament_id, tv.venue_id, tvc.priority;

-- Resumen por torneo
SELECT 
  t.id as tournament_id,
  t.name as tournament_name,
  COUNT(DISTINCT tv.id) as total_venues,
  COUNT(DISTINCT tvc.id) as total_courts,
  SUM(CASE WHEN tv.is_primary THEN 1 ELSE 0 END) as primary_venues
FROM tournaments t
LEFT JOIN tournament_venues tv ON t.id = tv.tournament_id
LEFT JOIN tournament_venue_courts tvc ON tv.id = tvc.tournament_venue_id
WHERE t.id IN (
  '692293d4-08b7-447a-91ab-13e928e98148',
  '715c9c16-6d81-4f08-a2ba-9ba1351ce3a2',
  '8b96f0d3-d088-460b-8f24-52e46bef0df9',
  'ba2c365f-23c8-43c6-9a24-5c8363178555'
)
GROUP BY t.id, t.name
ORDER BY t.name;
```

---

## ✅ Qué verificar:

1. **tournament_venues**: Cada torneo debe tener al menos 1 registro
2. **tournament_venue_courts**: Cada `tournament_venue` debe tener al menos 1 cancha
3. **is_primary**: Al menos una sede debe tener `is_primary = true`
4. **Relaciones**: Los `venue_id` y `court_id` deben existir en las tablas `venues` y `courts`

---

## 🐛 Si no hay registros:

Si los comandos curl no muestran `tournament_venues`, significa que:
1. El backend no procesó correctamente el array `venues` en el request
2. Hay un error en la creación de las relaciones
3. El frontend no está enviando el array `venues` correctamente

Para verificar qué se envió al backend, revisa los logs del servidor cuando creaste los torneos.

