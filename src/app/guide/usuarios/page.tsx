'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function UsuariosDocPage() {
  const t = useTranslations('guide');
  const res = typeof t('resources') === 'object' ? t('resources') as Record<string, unknown> : null;
  const users = res && typeof res.users === 'object' ? res.users as Record<string, string> : null;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Usuarios
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {users?.description ?? 'Gestión de jugadores y administradores del sistema.'}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Funcionalidades
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Listado y gestión</CardTitle>
            <CardDescription>
              Ver todos los usuarios registrados, filtrar y gestionar roles y estado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>{users?.view ?? 'Visualizar y gestionar usuarios registrados'}</li>
              <li>{users?.roles ?? 'Asignar roles: Jugador, Administrador'}</li>
              <li>{users?.status ?? 'Estado activo/inactivo'}</li>
            </ul>
            <p className="pt-2">
              Los jugadores suelen registrarse desde el portal público. Los administradores pueden inscribir equipos por otros usuarios en torneos y ligas. Acceso: <Link href="/users" className="text-indigo-600 dark:text-indigo-400 font-medium">Usuarios</Link>.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Roles
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          <strong>Jugador:</strong> puede inscribirse en torneos/ligas y ver sus partidos. <strong>Administrador:</strong> acceso al panel de administración (este panel) para gestionar torneos, ligas, kiosco, profesores, etc.
        </p>
      </section>
    </article>
  );
}
