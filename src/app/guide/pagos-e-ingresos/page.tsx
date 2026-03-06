'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PagosEIngresosDocPage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Pagos e ingresos
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Seguimiento de pagos de torneos/ligas e ingresos del club (torneos, ligas, canchas, etc.).
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Pagos de torneos y ligas
        </h2>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Estado de pago por equipo / jugador</CardTitle>
            <CardDescription>
              En cada torneo o liga puedes marcar equipos o jugadores como pagados o pendientes. Esto se usa para control de inscripciones y reportes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            <p>
              Desde la página del torneo: sección Equipos o Pagos. Desde la liga: gestión de equipos e inscripciones. También hay estadísticas de pagos por torneo en el backend.
            </p>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 mt-8">
          Ingresos del club
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vista de ingresos</CardTitle>
            <CardDescription>
              Resúmenes de ingresos por período, por torneo o por cancha/sede según lo que exponga el panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            <p>
              <Link href="/payments" className="text-indigo-600 dark:text-indigo-400 font-medium">Pagos</Link> y <Link href="/incomes" className="text-indigo-600 dark:text-indigo-400 font-medium">Ingresos</Link> (y subsecciones como ingresos mensuales o por canchas) permiten ver el flujo de caja asociado a competiciones y uso de instalaciones.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Rutas
        </h2>
        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-1">
          <li><Link href="/payments" className="text-indigo-600 dark:text-indigo-400">/payments</Link> — Pagos</li>
          <li><Link href="/incomes" className="text-indigo-600 dark:text-indigo-400">/incomes</Link> — Ingresos</li>
          <li><Link href="/incomes/monthly" className="text-indigo-600 dark:text-indigo-400">/incomes/monthly</Link> — Ingresos mensuales (si existe)</li>
          <li><Link href="/incomes/courts" className="text-indigo-600 dark:text-indigo-400">/incomes/courts</Link> — Ingresos por canchas (si existe)</li>
        </ul>
      </section>
    </article>
  );
}
