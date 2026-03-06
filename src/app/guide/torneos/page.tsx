'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function TorneosDocPage() {
  const t = useTranslations('guide');
  const ct = typeof t('createTournament') === 'object' ? t('createTournament') as Record<string, unknown> : null;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Torneos
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Creación, gestión y seguimiento de torneos: inscripciones, equipos, partidos, grupos, eliminación directa y pagos.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Crear un torneo
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Desde <Link href="/tournaments/create" className="text-indigo-600 dark:text-indigo-400 font-medium">Torneos → Crear torneo</Link> se configura todo el torneo en un asistente.
        </p>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">1. Información básica</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              {ct && typeof ct.step1 === 'object' && ct.step1 !== null && 'description' in ct.step1
                ? String((ct.step1 as { description: string }).description)
                : 'Nombre, categorías, fechas, descripción e imagen del torneo.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">2. Configuración</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              {ct && typeof ct.step2 === 'object' && ct.step2 !== null && 'description' in ct.step2
                ? String((ct.step2 as { description: string }).description)
                : 'Número de participantes, formato (eliminación directa, grupos + playoffs, americano, etc.) y reglas.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">3. Sedes y canchas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              {ct && typeof ct.step3 === 'object' && ct.step3 !== null && 'description' in ct.step3
                ? String((ct.step3 as { description: string }).description)
                : 'Selección de sedes y canchas donde se jugará el torneo.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">4. Patrocinadores</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              {ct && typeof ct.step4 === 'object' && ct.step4 !== null && 'description' in ct.step4
                ? String((ct.step4 as { description: string }).description)
                : 'Asociar patrocinadores al torneo (opcional).'}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Después de crear el torneo
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
          <li>
            <strong>Equipos:</strong> Inscripción pública o registro por admin en la página del torneo (<Link href="/tournaments" className="text-indigo-600 dark:text-indigo-400">Ver torneos</Link> → seleccionar torneo → Equipos).
          </li>
          <li>
            <strong>Grupos:</strong> Si el formato incluye fase de grupos, se generan grupos y se pueden asignar días/horarios.
          </li>
          <li>
            <strong>Partidos:</strong> Generación de partidos por grupo y/o bracket de eliminación. Programación de horarios y canchas.
          </li>
          <li>
            <strong>Pagos:</strong> Marcar equipos o jugadores como pagados desde la sección de equipos o pagos del torneo.
          </li>
          <li>
            <strong>Pantalla TV:</strong> Vista para mostrar en pantalla en el club desde <Link href="/tv" className="text-indigo-600 dark:text-indigo-400">Pantalla TV</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Rutas principales
        </h2>
        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-1">
          <li><Link href="/tournaments" className="text-indigo-600 dark:text-indigo-400">/tournaments</Link> — Listado de torneos</li>
          <li><Link href="/tournaments/create" className="text-indigo-600 dark:text-indigo-400">/tournaments/create</Link> — Crear torneo</li>
          <li><Link href="/tv" className="text-indigo-600 dark:text-indigo-400">/tv</Link> — Pantalla TV (selección de evento)</li>
        </ul>
      </section>
    </article>
  );
}
