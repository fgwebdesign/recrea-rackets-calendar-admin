// Sistema simplificado de carga de traducciones
export type Locale = 'es' | 'en';

export interface TranslationModule {
  [key: string]: any;
}

// Cache para las traducciones cargadas
const translationCache = new Map<string, TranslationModule>();

// Función para cargar traducciones de un módulo específico
export async function loadTranslations(
  locale: Locale, 
  module: string
): Promise<TranslationModule> {
  const cacheKey = `${locale}-${module}`;
  
  // Verificar si ya está en caché
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Cargar dinámicamente el archivo de traducción
    const translations = await import(`../translations/${locale}/${module}.json`);
    const moduleTranslations = translations.default;
    
    // Guardar en caché
    translationCache.set(cacheKey, moduleTranslations);
    
    console.log(`✅ Traducciones cargadas: ${locale}/${module}`, moduleTranslations);
    return moduleTranslations;
  } catch (error) {
    console.error(`❌ Error cargando traducciones para ${locale}/${module}:`, error);
    return {};
  }
}

// Función para precargar traducciones comunes
export async function preloadCommonTranslations(locale: Locale): Promise<void> {
  const commonModules = ['common', 'auth'];
  
  console.log(`🔄 Precargando traducciones comunes para ${locale}...`);
  
  await Promise.all(
    commonModules.map(async (module) => {
      try {
        await loadTranslations(locale, module);
        console.log(`✅ Módulo ${module} precargado correctamente`);
      } catch (error) {
        console.error(`❌ Error precargando módulo ${module}:`, error);
      }
    })
  );
}

// Función para limpiar caché (útil para testing)
export function clearTranslationCache(): void {
  translationCache.clear();
  console.log('🧹 Caché de traducciones limpiado');
}

// Función para obtener todas las traducciones cargadas
export function getLoadedTranslations(): Map<string, TranslationModule> {
  return new Map(translationCache);
}