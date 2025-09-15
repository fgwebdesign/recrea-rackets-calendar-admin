# 🌍 Sistema de Traducciones Modular

## 📁 Estructura de Archivos

```
src/
├── contexts/
│   └── TranslationContext.tsx    # Contexto principal con carga lazy
├── lib/
│   └── translationLoader.ts      # Sistema de carga de traducciones
└── translations/
    ├── es/                       # Traducciones en español
    │   ├── common.json          # Elementos comunes (botones, estados, etc.)
    │   ├── auth.json            # Autenticación y login
    │   ├── dashboard.json       # Panel de control
    │   ├── tournaments.json     # Torneos
    │   ├── leagues.json         # Ligas
    │   └── users.json           # Usuarios
    └── en/                      # Traducciones en inglés
        ├── common.json
        ├── auth.json
        ├── dashboard.json
        ├── tournaments.json
        ├── leagues.json
        └── users.json
```

## 🚀 Uso del Sistema

### 1. Hook Básico para Traducciones

```tsx
import { useTranslations } from '@/contexts/TranslationContext';

function MyComponent() {
  const t = useTranslations('auth');
  
  return (
    <div>
      <h1>{t('loginTitle')}</h1>
      <button>{t('loginButton')}</button>
    </div>
  );
}
```

### 2. Hook para Cambiar Idioma

```tsx
import { useLanguage } from '@/contexts/TranslationContext';

function LanguageSelector() {
  const { locale, changeLanguage, isLoading } = useLanguage();
  
  return (
    <select 
      value={locale} 
      onChange={(e) => changeLanguage(e.target.value as Locale)}
      disabled={isLoading}
    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
}
```

### 3. Carga Lazy de Módulos

```tsx
import { useTranslationModule } from '@/contexts/TranslationContext';

function TournamentPage() {
  const { t, isLoading } = useTranslationModule('tournaments');
  
  if (isLoading) {
    return <div>Cargando traducciones...</div>;
  }
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## 🔧 Agregar Nuevas Traducciones

### 1. Crear Archivo de Traducción

```json
// src/translations/es/tournaments.json
{
  "tournaments": {
    "title": "Torneos",
    "create": "Crear Torneo",
    "edit": "Editar Torneo",
    "delete": "Eliminar Torneo",
    "status": {
      "active": "Activo",
      "finished": "Finalizado",
      "upcoming": "Próximo"
    }
  }
}
```

### 2. Usar en el Componente

```tsx
function TournamentComponent() {
  const t = useTranslations('tournaments');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('create')}</button>
      <span>{t('status.active')}</span>
    </div>
  );
}
```

## ⚡ Características del Sistema

### ✅ Ventajas

1. **Carga Lazy**: Solo carga traducciones cuando se necesitan
2. **Caché Inteligente**: Evita recargar traducciones ya cargadas
3. **Modular**: Cada página/módulo tiene sus propias traducciones
4. **TypeScript**: Tipado fuerte para mejor desarrollo
5. **Performance**: Mejor rendimiento con aplicaciones grandes
6. **Escalable**: Fácil agregar nuevos idiomas y módulos

### 🎯 Mejores Prácticas

1. **Nombres Consistentes**: Usa nombres descriptivos para las claves
2. **Estructura Jerárquica**: Organiza traducciones por módulos
3. **Reutilización**: Usa `common.json` para elementos compartidos
4. **Validación**: Siempre proporciona fallbacks para traducciones faltantes
5. **Testing**: Prueba ambos idiomas durante el desarrollo

## 🔄 Migración de Páginas Existentes

### Antes (Sistema Monolítico)
```tsx
const t = useTranslations('auth');
const email = t('email');
```

### Después (Sistema Modular)
```tsx
const t = useTranslations('auth');
const email = t('email'); // Mismo uso, mejor arquitectura
```

## 🚨 Consideraciones Importantes

1. **Carga Inicial**: Los módulos `common` y `auth` se cargan automáticamente
2. **Módulos Adicionales**: Se cargan bajo demanda cuando se usan
3. **Cambio de Idioma**: Limpia el caché y recarga todos los módulos
4. **Errores**: Si falta una traducción, retorna la clave como fallback
5. **Performance**: El caché mejora significativamente el rendimiento

## 📈 Próximos Pasos

1. Migrar página por página al nuevo sistema
2. Agregar traducciones para todos los módulos existentes
3. Implementar validación de traducciones faltantes
4. Agregar soporte para más idiomas si es necesario
5. Crear herramientas de desarrollo para gestión de traducciones
