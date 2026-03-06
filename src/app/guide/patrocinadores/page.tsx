'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PatrocinadoresDocPage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Patrocinadores
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestión de patrocinadores del club y su asociación a torneos (logos, enlaces, orden).
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Qué son los patrocinadores
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catálogo de patrocinadores</CardTitle>
            <CardDescription>
              Creas patrocinadores con nombre, logo e información. Luego los asocias a torneos concretos para mostrarlos en la ficha del torneo y en la pantalla TV.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-2">
              Acceso: <Link href="/sponsors" className="text-indigo-600 dark:text-indigo-400 font-medium">Patrocinadores</Link>. Desde ahí se crean, editan y eliminan patrocinadores. Al crear o editar un torneo se puede elegir qué patrocinadores mostrar para ese torneo.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Uso en torneos
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          En el paso de patrocinadores del asistente de creación de torneo (o en la edición del torneo) se seleccionan los patrocinadores que se mostrarán en ese evento. Opcional; si no asocias ninguno, el torneo se muestra sin patrocinadores.
        </p>
      </section>
    </article>
  );
}
