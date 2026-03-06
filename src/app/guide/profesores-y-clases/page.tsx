'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ProfesoresYClasesDocPage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Profesores y clases
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestión de profesores, clases particulares o grupales, tarifas por hora y comisión del club (global y por profesor).
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Profesores
        </h2>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Alta y edición de profesores</CardTitle>
            <CardDescription>
              Cada profesor tiene nombre, foto, tarifa por hora (hourly_rate), especialidades, días de disponibilidad y comisión del club opcional.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Comisión por defecto:</strong> Se configura en la sección de clases (Registro de clases) y aplica a todos los profesores que no tengan comisión propia.</li>
              <li><strong>Comisión por profesor:</strong> Opcional. Si se define un % para un profesor, las clases de ese profesor usan ese % en lugar de la comisión por defecto del club.</li>
            </ul>
            <p>
              Acceso: <Link href="/professors" className="text-indigo-600 dark:text-indigo-400 font-medium">Profesores</Link> — Crear o editar profesor.
            </p>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 mt-8">
          Clases
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registro y listado de clases</CardTitle>
            <CardDescription>
              Cada clase se asocia a un profesor, sede, cancha, fecha y franja horaria. El sistema calcula el monto para el profesor y la comisión del club según la tarifa del profesor y su comisión (o la por defecto).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear clase: profesor, sede, cancha, fecha, hora inicio/fin. Vista previa del cobro y comisión antes de guardar.</li>
              <li>Editar o eliminar clases desde el listado.</li>
              <li>Resúmenes y reportes de cobros por profesor y por período en la pestaña correspondiente.</li>
            </ul>
            <p>
              Acceso: <Link href="/professors/classes" className="text-indigo-600 dark:text-indigo-400 font-medium">Profesores → Clases</Link>. Ahí se configura también la comisión por defecto del club.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Resumen
        </h2>
        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-1">
          <li><Link href="/professors" className="text-indigo-600 dark:text-indigo-400">/professors</Link> — Listado y gestión de profesores</li>
          <li><Link href="/professors/classes" className="text-indigo-600 dark:text-indigo-400">/professors/classes</Link> — Clases, comisión por defecto y reportes</li>
        </ul>
      </section>
    </article>
  );
}
