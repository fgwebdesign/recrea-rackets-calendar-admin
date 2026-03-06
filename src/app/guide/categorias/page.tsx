'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function CategoriasDocPage() {
  const t = useTranslations('guide');
  const res = typeof t('resources') === 'object' ? t('resources') as Record<string, unknown> : null;
  const categories = res && typeof res.categories === 'object' ? res.categories as Record<string, string> : null;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Categorías
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {categories?.description ?? 'Organización de equipos por nivel, edad o tipo de competencia en ligas y torneos.'}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Qué son las categorías
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorías de competición</CardTitle>
            <CardDescription>
              No confundir con las categorías del kiosco (productos). Aquí son categorías deportivas: Principiantes, Avanzados, Mixto, +35, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>{categories?.define ?? 'Definir nombre (y descripción) de cada categoría'}</li>
              <li>{categories?.associate ?? 'Asociar categorías a ligas y torneos'}</li>
              <li>{categories?.manage ?? 'Gestionar múltiples categorías'}</li>
            </ul>
            <p className="pt-2">
              Acceso: <Link href="/categories" className="text-indigo-600 dark:text-indigo-400 font-medium">Categorías</Link>. Necesitas al menos una categoría creada antes de crear una liga o torneo.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Uso
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Al crear una liga o un torneo se eligen una o más categorías. Los equipos se inscriben en una categoría concreta y los partidos/tablas se organizan por categoría.
        </p>
      </section>
    </article>
  );
}
