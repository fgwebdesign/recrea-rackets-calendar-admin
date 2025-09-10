# 🚀 Configuración de Ambientes - Frontend Admin

## 📋 Descripción
Este proyecto tiene configuraciones separadas para desarrollo y producción. Los archivos están organizados para facilitar el cambio entre ambientes.

## 📁 Archivos de Configuración

### Frontend (Admin Panel)
- `.env.development` - Configuración completa para desarrollo (incluye variables del backend + frontend)
- `.env.production` - Configuración completa para producción (incluye variables del backend + frontend)

### Backend (API) - Archivos de referencia
- `env de dev.txt` - Configuración del backend para desarrollo
- `env de prod.txt` - Configuración del backend para producción

### Variables Incluidas en los .env del Frontend:

#### Variables del Backend (para referencia):
- `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_PUBLIC_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`
- `DB_PASSWORD`, `RESEND_API_KEY`, `WEB_URL`
- `SUPABASE_STORAGE_URL`, `SUPABASE_BUCKET_ID`
- `TZ`, `ALLOWED_ORIGINS`

#### Variables del Frontend (con prefijo NEXT_PUBLIC_):
- `NEXT_PUBLIC_SUPABASE_URL` - URL de Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `NEXT_PUBLIC_API_URL` - URL del backend API
- `NEXT_PUBLIC_OPENWEATHER_API_KEY` - API key para el clima

## 🛠️ Scripts Disponibles

### Desarrollo (Recomendado)
```bash
# Ejecutar en modo desarrollo (conecta con Supabase DEV)
npm run dev
```

### Desarrollo con Producción
```bash
# Ejecutar en modo desarrollo pero conectado a producción
npm run dev:prod
```

### Build
```bash
# Build para desarrollo
npm run build:dev

# Build para producción
npm run build:prod
```

## 🔧 Configuración Actual

### Desarrollo
- **Frontend**: `localhost:3000`
- **Backend**: `localhost:9999`
- **Supabase**: DEV (lohsoxizoliuhirlxypf.supabase.co)
- **CORS**: `http://localhost:3000,http://localhost:3001`

### Producción
- **Frontend**: `https://recrea-rackets-calendar-admin.vercel.app`
- **Backend**: `https://www.recreapadel.com`
- **Supabase**: PROD (goipmracccjxjmhpizib.supabase.co)
- **CORS**: `https://recrea-rackets-calendar-admin.vercel.app,https://www.recreapadel.com`

## 🔐 Credenciales de Prueba

Para desarrollo, puedes usar:
- **Email**: `yegoelvigote15@gmail.com`
- **Password**: `Test1234!`

## ⚠️ Notas Importantes

1. **Los scripts automáticamente copian el archivo de configuración correcto a `.env.local`**
2. **Asegúrate de que el backend esté corriendo en el puerto correcto según el ambiente**
3. **Las credenciales deben existir en la base de datos correspondiente al ambiente**
4. **El backend debe tener configurado CORS para permitir el frontend**

## 🚀 Pasos para Iniciar

### Para Desarrollo:
1. Asegúrate de que el backend esté corriendo en `localhost:9999` con la configuración de desarrollo
2. Ejecuta `npm run dev` en el frontend
3. Ve a `http://localhost:3000`
4. Usa las credenciales de prueba

### Para Producción:
1. Asegúrate de que el backend esté corriendo con la configuración de producción
2. Ejecuta `npm run dev:prod` en el frontend
3. Ve a `http://localhost:3000`
4. Usa las credenciales de producción

## 🔍 Troubleshooting

Si tienes problemas de login:
1. Verifica que el backend esté corriendo
2. Verifica que las URLs de Supabase coincidan entre frontend y backend
3. Verifica que CORS esté configurado correctamente en el backend
4. Revisa la consola del navegador para errores
