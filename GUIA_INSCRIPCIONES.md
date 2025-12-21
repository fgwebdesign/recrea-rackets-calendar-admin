# 📋 Guía para Completar Inscripciones - Liga de Recrea

## 📊 Configuración de la Liga
- **Nombre**: Liga de Recrea
- **Categorías**: 4
- **Equipos por categoría**: 8
- **Total de inscripciones**: 32 (8 × 4)
- **Sedes**: 1
- **Canchas**: 2
- **Horarios**: 22:30, 23:15

## 🆔 IDs de las Ligas (Categorías)

### Categoría 1
- **League ID**: `77ae5f73-27b2-4f34-bb39-8735cf795a3a`
- **Category ID**: `70b8637d-1257-4610-9489-2cec6ff761ac`

### Categoría 2
- **League ID**: `9e88cbcd-c062-4567-9a52-8a9a3133a501`
- **Category ID**: `c4f7f573-6375-47dc-8e94-e21339058ba7`

### Categoría 3
- **League ID**: `cd24aa35-80b4-4d10-8e80-2746b2c1b8af`
- **Category ID**: `670a4087-9565-4e37-8714-3525acdb808b`

### Categoría 4
- **League ID**: `cda5f202-3f71-49ce-8474-f1611d04614e`
- **Category ID**: `5f759999-52c8-44e9-a71a-ffeac4b9671c`

## 👥 Equipos a Inscribir (8 equipos × 4 categorías)

### Equipo 1
- Player 1: `0101c3f3-a44c-481f-9c31-722440eac839` (Lucas Martinez)
- Player 2: `043a05b9-0744-45b1-987a-67859e93c152` (Gianni Baccino)
- Suplente: "Suplente Equipo 1"

### Equipo 2
- Player 1: `23e2841e-d697-4a77-a4f5-3aa7f42fd064` (Juan Diaz)
- Player 2: `27d3a303-4c60-47b1-86e5-cab0429a2c52` (Agustin Tapia)
- Suplente: "Suplente Equipo 2"

### Equipo 3
- Player 1: `2e98d103-85f2-4d16-8cb9-2fa557724d73` (Milton Navarro)
- Player 2: `3929b30b-958b-44d8-ace8-230224ed833b` (Enzo Pelizzari)
- Suplente: "Suplente Equipo 3"

### Equipo 4
- Player 1: `3ab2f81d-cbb9-4d59-8615-bf7c5521d446` (Santiago Rizzo)
- Player 2: `5a6f97a9-6c38-44a1-8eaa-1b3e00204489` (Agustin Rizzo)
- Suplente: "Suplente Equipo 4"

### Equipo 5
- Player 1: `615a8571-63f6-4533-8617-31ad934e0331` (Enzo Morales)
- Player 2: `657d6048-396b-4d4d-9219-418f53c89174` (Santiago Gutierrez)
- Suplente: "Suplente Equipo 5"

### Equipo 6
- Player 1: `679fa9a5-6152-46c2-a6dd-51b5c75868e6` (Maxi Salvo)
- Player 2: `6d87c72d-74f4-49a3-b37e-1e287a80a16f` (Richard Nuñez)
- Suplente: "Suplente Equipo 6"

### Equipo 7
- Player 1: `6f103b3d-ff0f-4279-ae3d-19e06c44d5d4` (Facundo Costa)
- Player 2: `77d996b5-08db-4cd1-be66-e9e0b97a78db` (Francisco Erramuspe)
- Suplente: "Suplente Equipo 7"

### Equipo 8
- Player 1: `780f7850-682f-41f2-ab17-5b8a72506ff4` (Runate Goncalves)
- Player 2: `7dc78fbc-ec65-4ee2-be78-d0f65df38539` (Carlos Pereira)
- Suplente: "Suplente Equipo 8"

## 🚀 Opción 1: Ejecutar Script Automático

```bash
# Asegúrate de tener Node.js instalado
node inscripciones-liga.js
```

El script inscribirá automáticamente los 8 equipos en las 4 categorías (32 inscripciones totales).

## 📝 Opción 2: Inscripciones Manuales con Bruno/Postman

### Endpoint
```
POST http://localhost:9999/leagues/join
```

### Headers
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6Imd2c1pmT0NCR29sMCtVNUsiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xvaHNveGl6b2xpdWhpcmx4eXBmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMzE4ZWEzNC1hNTFkLTRhOTEtOGE4OC1lM2NiMmEwZDJiNGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2MzYzMDQwLCJpYXQiOjE3NjYzNTk0NDAsImVtYWlsIjoieWVnb2Vsdmlnb3RlMTVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InllZ29lbHZpZ290ZTE1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdF9uYW1lIjoiRmVsaXBlIiwibGFzdF9uYW1lIjoiR3V0aWVycmV6IiwicGhvbmUiOiIxMjMtNDU2NyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZjMxOGVhMzQtYTUxZC00YTkxLThhODgtZTNjYjJhMGQyYjRkIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjYzNTk0NDB9XSwic2Vzc2lvbl9pZCI6IjRkZjY3MjI5LWI4ZjEtNDZkNC1hZWY0LWJmODQ0OWVkNDdkZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.kq1MOQfr894t8EtZTRqP7D8LdwytxJ7iWAjSPKp4pB0
```

### Body Template (para cada inscripción)
```json
{
  "league_id": "LEAGUE_ID_AQUI",
  "player1_id": "PLAYER1_ID_AQUI",
  "player2_id": "PLAYER2_ID_AQUI",
  "alternate_player": "Suplente Equipo X"
}
```

### Ejemplo: Inscribir Equipo 1 en Categoría 1
```json
{
  "league_id": "77ae5f73-27b2-4f34-bb39-8735cf795a3a",
  "player1_id": "0101c3f3-a44c-481f-9c31-722440eac839",
  "player2_id": "043a05b9-0744-45b1-987a-67859e93c152",
  "alternate_player": "Suplente Equipo 1"
}
```

## ✅ Verificación Post-Inscripción

Después de completar las inscripciones, verifica:

1. **Estado de las ligas**: Todas deben cambiar a "Activa" cuando se completen 8 equipos
2. **Equipos registrados**: Verificar que cada liga tenga exactamente 8 equipos
3. **Preparación para generar partidos**: Una vez completas, podremos generar los partidos

## 🎯 Siguiente Paso

Una vez completadas las 32 inscripciones, ejecutaremos la generación de partidos para verificar:
- ✅ Rotación de horarios entre categorías
- ✅ Asignación correcta de canchas
- ✅ Respeto de días por categoría
- ✅ Sin conflictos de horarios/canchas

