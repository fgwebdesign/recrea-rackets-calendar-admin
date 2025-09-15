# 🌍 Sistema de Internacionalización (i18n)

## 📋 Descripción

Sistema completo de traducción implementado con **next-intl** para soportar español e inglés en toda la aplicación.

## 🚀 Características

- ✅ **Español e Inglés** completamente soportados
- ✅ **Cambio dinámico** de idioma sin recargar la página
- ✅ **Persistencia** de preferencia en localStorage
- ✅ **Detección automática** del idioma del navegador
- ✅ **TypeScript** completamente tipado
- ✅ **Integración perfecta** con Next.js 15 App Router

## 🎯 Componentes Principales

### 1. **LanguageToggle**
```tsx
import { LanguageToggle } from '@/components/LanguageToggle';

// Uso en cualquier componente
<LanguageToggle />
```

### 2. **Hook useLanguage**
```tsx
import { useLanguage } from '@/hooks/useLanguage';

function MyComponent() {
  const { locale, changeLanguage, mounted } = useLanguage();
  
  return (
    <div>
      <p>Idioma actual: {locale}</p>
      <button onClick={() => changeLanguage('en')}>
        Cambiar a Inglés
      </button>
    </div>
  );
}
```

### 3. **Hook useTranslations**
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('auth');
  
  return (
    <div>
      <h1>{t('login')}</h1>
      <p>{t('email')}</p>
    </div>
  );
}
```

## 📁 Estructura de Archivos

```
src/
├── i18n.ts                    # Configuración principal
├── messages/
│   ├── es.json               # Traducciones en español
│   └── en.json               # Traducciones en inglés
├── components/
│   └── LanguageToggle.tsx    # Componente selector de idioma
├── hooks/
│   └── useLanguage.ts        # Hook personalizado
└── app/
    ├── [locale]/
    │   └── layout.tsx        # Layout con i18n
    ├── layout.tsx            # Layout principal actualizado
    └── providers.tsx         # Providers con next-intl
```

## 🔧 Configuración

### Idiomas Soportados
```typescript
// src/i18n.ts
export const locales = ['es', 'en'] as const;
export const defaultLocale: Locale = 'es';
```

### Middleware
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localeDetection: true
});
```

## 📝 Uso en Componentes

### Traducciones Simples
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <button>{t('save')}</button>
  );
}
```

### Traducciones Anidadas
```tsx
import { useTranslations } from 'next-intl';

function TournamentCard() {
  const t = useTranslations('tournaments');
  
  return (
    <div>
      <h2>{t('title')}</h2>
      <p>{t('details.teams')}</p>
      <span>{t('status.upcoming')}</span>
    </div>
  );
}
```

### Traducciones con Parámetros
```tsx
// En el archivo de traducción
{
  "welcome": "Bienvenido, {name}!"
}

// En el componente
const t = useTranslations('common');
<p>{t('welcome', { name: 'Juan' })}</p>
```

## 🎨 Personalización del Selector

### Estilos Personalizados
```tsx
<SelectTrigger className="w-auto h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
  <div className="flex items-center gap-2">
    <GlobeAltIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {currentLanguage?.flag} {currentLanguage?.name}
    </span>
  </div>
</SelectTrigger>
```

## 🔄 Flujo de Cambio de Idioma

1. **Usuario selecciona** nuevo idioma en el selector
2. **Se guarda** la preferencia en localStorage
3. **Se recarga** la página con el nuevo idioma
4. **Se aplican** todas las traducciones automáticamente

## 📊 Archivos de Traducción

### Estructura Recomendada
```json
{
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito"
  },
  "navigation": {
    "dashboard": "Panel de Control",
    "tournaments": "Torneos"
  },
  "auth": {
    "login": "Iniciar sesión",
    "email": "Correo electrónico"
  }
}
```

## 🚀 Próximos Pasos

1. **Agregar más traducciones** a los archivos JSON
2. **Implementar** en todas las páginas existentes
3. **Agregar más idiomas** si es necesario
4. **Optimizar** la carga de traducciones

## 💡 Tips de Uso

- **Usa nombres descriptivos** para las claves de traducción
- **Agrupa las traducciones** por funcionalidad
- **Mantén consistencia** en la estructura
- **Usa parámetros** para textos dinámicos
- **Testa ambos idiomas** regularmente

---

¡El sistema está listo para usar! 🎉
