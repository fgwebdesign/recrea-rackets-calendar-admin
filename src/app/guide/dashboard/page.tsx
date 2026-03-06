'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function DashboardDocPage() {
  const t = useTranslations('dashboard');

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t('description')}
        </p>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vista general</CardTitle>
          <CardDescription>
            El dashboard es la pantalla principal tras iniciar sesión. Muestra resúmenes y accesos rápidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Estadísticas de ligas</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total de ligas, categorías activas, partidos totales y completados, ingresos. Permite ver el estado general de las ligas del club.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Estadísticas de torneos</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total de torneos, en curso, equipos, ingresos. Resumen de la actividad de torneos.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Próximos partidos</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Listado de partidos próximos tanto de ligas como de torneos, con enlace a cada competición.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Progreso de inscripciones</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Progreso de inscripciones en ligas y torneos (equipos inscritos vs. cupos).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Tablas de posiciones</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Acceso rápido a tablas de posiciones de ligas y torneos con fase de grupos.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Accede al dashboard desde <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 font-medium">Inicio</Link> en el menú lateral.
      </p>
    </article>
  );
}
