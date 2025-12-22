#!/bin/bash

# Script para verificar que los torneos tienen los registros correctos en las tablas de venues
# Uso: ./verify_tournament_venues.sh <TOKEN> [API_URL]
# Ejemplo: ./verify_tournament_venues.sh "tu_token_aqui" "http://localhost:9999"

TOKEN=${1:-""}
API_URL=${2:-"http://localhost:9999"}

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Debes proporcionar un token de autenticación"
  echo "Uso: ./verify_tournament_venues.sh <TOKEN> [API_URL]"
  exit 1
fi

# IDs de los torneos creados
TOURNAMENT_IDS=(
  "692293d4-08b7-447a-91ab-13e928e98148"
  "715c9c16-6d81-4f08-a2ba-9ba1351ce3a2"
  "8b96f0d3-d088-460b-8f24-52e46bef0df9"
  "ba2c365f-23c8-43c6-9a24-5c8363178555"
)

echo "🔍 Verificando registros de venues para ${#TOURNAMENT_IDS[@]} torneos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for TOURNAMENT_ID in "${TOURNAMENT_IDS[@]}"; do
  echo "📋 Verificando Torneo: $TOURNAMENT_ID"
  echo "──────────────────────────────────────────────────────────────────────────────"
  
  # 1. Obtener el torneo completo con sus relaciones (incluye tournament_venues)
  echo "1️⃣ Obteniendo información completa del torneo..."
  TOURNAMENT_RESPONSE=$(curl -s -X GET \
    "${API_URL}/tournaments/${TOURNAMENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  TOURNAMENT_NAME=$(echo "$TOURNAMENT_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "   Nombre: $TOURNAMENT_NAME"
  
  # Verificar si tiene tournament_venues
  VENUES_COUNT=$(echo "$TOURNAMENT_RESPONSE" | grep -o '"tournament_venues"' | wc -l)
  if [ "$VENUES_COUNT" -gt 0 ]; then
    echo "   ✅ tournament_venues encontrado en la respuesta"
    
    # Extraer información de venues
    echo "$TOURNAMENT_RESPONSE" | grep -A 50 '"tournament_venues"' | head -20
  else
    echo "   ⚠️  No se encontró tournament_venues en la respuesta"
  fi
  
  echo ""
  
  # 2. Verificar directamente en tournament_venues (si el endpoint existe)
  echo "2️⃣ Verificando registros en tournament_venues..."
  VENUES_RESPONSE=$(curl -s -X GET \
    "${API_URL}/tournaments/${TOURNAMENT_ID}/venues" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  if echo "$VENUES_RESPONSE" | grep -q "error\|Error\|not found"; then
    echo "   ⚠️  Endpoint /venues no disponible o error:"
    echo "$VENUES_RESPONSE" | head -5
  else
    VENUES_COUNT=$(echo "$VENUES_RESPONSE" | grep -o '"id"' | wc -l)
    echo "   ✅ Encontradas $VENUES_COUNT sedes"
    
    # Mostrar resumen de venues
    if [ "$VENUES_COUNT" -gt 0 ]; then
      echo "$VENUES_RESPONSE" | grep -E '"venue":|"name":|"is_primary":|"courts":' | head -20
    fi
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
done

echo "✅ Verificación completada"
echo ""
echo "💡 Para verificar directamente en la base de datos, puedes ejecutar:"
echo "   SELECT * FROM tournament_venues WHERE tournament_id IN ("
for TOURNAMENT_ID in "${TOURNAMENT_IDS[@]}"; do
  echo "     '${TOURNAMENT_ID}',"
done
echo "   );"
echo ""
echo "   SELECT tvc.*, tv.tournament_id"
echo "   FROM tournament_venue_courts tvc"
echo "   JOIN tournament_venues tv ON tvc.tournament_venue_id = tv.id"
echo "   WHERE tv.tournament_id IN ("
for TOURNAMENT_ID in "${TOURNAMENT_IDS[@]}"; do
  echo "     '${TOURNAMENT_ID}',"
done
echo "   );"

