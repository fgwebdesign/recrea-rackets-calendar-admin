'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function LigasDocPage() {
  const t = useTranslations('guide');
  const cl = typeof t('createLeague') === 'object' ? t('createLeague') as Record<string, unknown> : null;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Ligas
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Creación y gestión de ligas: temporadas, categorías, días de juego, sedes, canchas y generación de partidos.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Crear una liga
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Desde <Link href="/leagues/create" className="text-indigo-600 dark:text-indigo-400 font-medium">Ligas → Crear liga</Link> se define la liga en varios pasos.
        </p>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">1. Información básica</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <ul className="list-disc pl-5 space-y-1">
                {cl && typeof cl.step1 === 'object' && cl.step1 !== null && typeof (cl.step1 as Record<string, string>).name === 'string' && (
                  <li>{(cl.step1 as Record<string, string>).name}</li>
                )}
                {cl && typeof cl.step1 === 'object' && cl.step1 !== null && typeof (cl.step1 as Record<string, string>).categories === 'string' && (
                  <li>{(cl.step1 as Record<string, string>).categories}</li>
                )}
                {cl && typeof cl.step1 === 'object' && cl.step1 !== null && typeof (cl.step1 as Record<string, string>).cost === 'string' && (
                  <li>{(cl.step1 as Record<string, string>).cost}</li>
                )}
                {cl && typeof cl.step1 === 'object' && cl.step1 !== null && typeof (cl.step1 as Record<string, string>).teams === 'string' && (
                  <li>{(cl.step1 as Record<string, string>).teams}</li>
                )}
                {!cl && (
                  <>
                    <li>Nombre y categorías de la liga</li>
                    <li>Costo de inscripción y número de equipos por categoría</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">2. Fechas y frecuencia</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Fecha de inicio y fin, frecuencia (semanal, quincenal, mensual) y día de juego por categoría.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">3. Sedes y canchas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Selección de sedes y canchas donde se jugará la liga. Opción de sede primaria.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">4. Horarios y tipo de liga</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Horarios de partidos, canchas por horario, tipo (Round Robin o grupos + playoffs) y vueltas (1 o 2).
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="pt-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              {cl && typeof cl === 'object' && 'tip' in cl && typeof cl.tip === 'string' ? cl.tip : 'Una vez creada la liga, los equipos pueden inscribirse. Después podrás generar los partidos desde la página de la liga.'}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Gestión de una liga
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          En <Link href="/leagues" className="text-indigo-600 dark:text-indigo-400">Ligas</Link> puedes abrir cada liga para ver equipos, partidos por jornada, tabla de posiciones, inscribir equipos (admin) y generar partidos.
        </p>
        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-1">
          <li><Link href="/leagues" className="text-indigo-600 dark:text-indigo-400">/leagues</Link> — Listado de ligas</li>
          <li><Link href="/leagues/create" className="text-indigo-600 dark:text-indigo-400">/leagues/create</Link> — Crear liga</li>
        </ul>
      </section>
    </article>
  );
}
