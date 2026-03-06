'use client';

import { Building2, MapPinIcon, TagIcon, UsersIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function RequisitosPreviosPage() {
  const t = useTranslations('guide');
  const pr = t('prerequisites');

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {typeof pr === 'object' && pr !== null && 'title' in pr ? (pr as { title: string }).title : 'Requisitos previos'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {typeof pr === 'object' && pr !== null && 'description' in pr
            ? (pr as { description: string }).description
            : 'Antes de crear ligas o torneos, configura estos recursos.'}
        </p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>
                  {typeof pr === 'object' && pr !== null && 'venues' in pr && typeof (pr as { venues: { title: string } }).venues === 'object'
                    ? (pr as { venues: { title: string } }).venues.title
                    : 'Sedes'}
                </CardTitle>
                <CardDescription>
                  {typeof pr === 'object' && pr !== null && 'venues' in pr && typeof (pr as { venues: { description: string } }).venues === 'object'
                    ? (pr as { venues: { description: string } }).venues.description
                    : 'Debes tener al menos una sede creada.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Crea y edita sedes desde <Link href="/venues" className="text-indigo-600 dark:text-indigo-400 font-medium">Sedes</Link> en el menú.
              Cada sede puede tener dirección, teléfono y estado activo/inactivo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MapPinIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>
                  {typeof pr === 'object' && pr !== null && 'courts' in pr && typeof (pr as { courts: { title: string } }).courts === 'object'
                    ? (pr as { courts: { title: string } }).courts.title
                    : 'Canchas'}
                </CardTitle>
                <CardDescription>
                  {typeof pr === 'object' && pr !== null && 'courts' in pr && typeof (pr as { courts: { description: string } }).courts === 'object'
                    ? (pr as { courts: { description: string } }).courts.description
                    : 'Cada sede debe tener al menos una cancha.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Las canchas se gestionan desde cada sede en <Link href="/venues" className="text-indigo-600 dark:text-indigo-400 font-medium">Sedes</Link> o desde
              la sección <Link href="/courts" className="text-indigo-600 dark:text-indigo-400 font-medium">Canchas</Link>. Asigna nombre y foto a cada cancha.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TagIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>
                  {typeof pr === 'object' && pr !== null && 'categories' in pr && typeof (pr as { categories: { title: string } }).categories === 'object'
                    ? (pr as { categories: { title: string } }).categories.title
                    : 'Categorías'}
                </CardTitle>
                <CardDescription>
                  {typeof pr === 'object' && pr !== null && 'categories' in pr && typeof (pr as { categories: { description: string } }).categories === 'object'
                    ? (pr as { categories: { description: string } }).categories.description
                    : 'Necesitas categorías para organizar equipos por nivel o tipo.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Crea categorías desde <Link href="/categories" className="text-indigo-600 dark:text-indigo-400 font-medium">Categorías</Link>. Se usan en ligas y torneos para agrupar equipos (por ejemplo: Principiantes, Avanzados, Mixto).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <UsersIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle>
                  {typeof pr === 'object' && pr !== null && 'users' in pr && typeof (pr as { users: { title: string } }).users === 'object'
                    ? (pr as { users: { title: string } }).users.title
                    : 'Usuarios'}
                </CardTitle>
                <CardDescription>
                  {typeof pr === 'object' && pr !== null && 'users' in pr && typeof (pr as { users: { description: string } }).users === 'object'
                    ? (pr as { users: { description: string } }).users.description
                    : 'Los usuarios deben estar registrados para inscribirse.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Los jugadores se registran desde el portal público o se gestionan en <Link href="/users" className="text-indigo-600 dark:text-indigo-400 font-medium">Usuarios</Link>.
              Puedes asignar roles (Jugador, Administrador) y estado activo/inactivo.
            </p>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
