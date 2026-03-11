#!/bin/bash
# Script para arrancar el admin apuntando a backend local con datos de prod

echo "🚀 Arrancando admin con backend local (datos de producción)..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutá este script desde la carpeta recrea-rackets-calendar-admin"
    exit 1
fi

# Verificar que existe .env.prod-local
if [ ! -f ".env.prod-local" ]; then
    echo "❌ Error: No existe .env.prod-local"
    exit 1
fi

# Matar procesos en puerto 3000
echo "🔄 Liberando puerto 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Arrancar admin
echo "✅ Iniciando admin..."
npm run dev:prod-local
