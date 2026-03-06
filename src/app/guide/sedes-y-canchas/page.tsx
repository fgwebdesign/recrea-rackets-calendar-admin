'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function SedesYCanchasDocPage() {
  const t = useTranslations('guide');
  const res = typeof t('resources') === 'object' ? t('resources') as Record<string, unknown> : null;
  const venues = res && typeof res.venues === 'object' ? res.venues as Record<string, string> : null;
  const courts = res && typeof res.courts === 'object' ? res.courts as Record<string, string> : null;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Sedes y canchas
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestión de los lugares físicos del club (sedes) y de las canchas en cada sede.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Sedes
        </h2>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{venues?.title ?? 'Sedes'}</CardTitle>
            <CardDescription>{venues?.description ?? 'Lugares físicos donde se realizan las competencias.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <ul className="list-disc pl-5 space-y-1">
              <li>{venues?.contact ?? 'Información de contacto: dirección, teléfono, email'}</li>
              <li>{venues?.default ?? 'Marcar una sede como predeterminada'}</li>
              <li>{venues?.status ?? 'Estado activo/inactivo'}</li>
            </ul>
            <p className="pt-2">
              Acceso: <Link href="/venues" className="text-indigo-600 dark:text-indigo-400 font-medium">Sedes</Link>. Desde ahí se crean y editan sedes y se asignan canchas a cada una.
            </p>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 mt-8">
          Canchas
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{courts?.title ?? 'Canchas'}</CardTitle>
            <CardDescription>{courts?.description ?? 'Espacios específicos dentro de una sede.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <ul className="list-disc pl-5 space-y-1">
              <li>{courts?.assign ?? 'Asignar cada cancha a una sede'}</li>
              <li>{courts?.photo ?? 'Subir foto de la cancha'}</li>
              <li>{courts?.status ?? 'Estado activo/inactivo'}</li>
            </ul>
            <p className="pt-2">
              Las canchas se gestionan desde cada sede en <Link href="/venues" className="text-indigo-600 dark:text-indigo-400">Sedes</Link> o desde <Link href="/courts" className="text-indigo-600 dark:text-indigo-400">Canchas</Link> para una vista global.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Uso en ligas y torneos
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Al crear una liga o un torneo se seleccionan una o más sedes y, por cada sede, las canchas disponibles. Es necesario tener al menos una sede con al menos una cancha antes de crear competiciones.
        </p>
      </section>
    </article>
  );
}
