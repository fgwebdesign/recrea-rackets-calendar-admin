'use client';

import Link from 'next/link';
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  TableCellsIcon,
  BuildingOfficeIcon,
  ShoppingCartIcon,
  AcademicCapIcon,
  TagIcon,
  UsersIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';

const SECTIONS = [
  { href: '/guide/requisitos-previos', icon: ClipboardDocumentListIcon, key: 'prerequisites' },
  { href: '/guide/dashboard', icon: BookOpenIcon, key: 'dashboard' },
  { href: '/guide/torneos', icon: TrophyIcon, key: 'tournaments' },
  { href: '/guide/ligas', icon: TableCellsIcon, key: 'leagues' },
  { href: '/guide/sedes-y-canchas', icon: BuildingOfficeIcon, key: 'venues' },
  { href: '/guide/kiosco', icon: ShoppingCartIcon, key: 'kiosk' },
  { href: '/guide/profesores-y-clases', icon: AcademicCapIcon, key: 'professors' },
  { href: '/guide/categorias', icon: TagIcon, key: 'categories' },
  { href: '/guide/usuarios', icon: UsersIcon, key: 'users' },
  { href: '/guide/patrocinadores', icon: PhotoIcon, key: 'sponsors' },
  { href: '/guide/pagos-e-ingresos', icon: CurrencyDollarIcon, key: 'payments' },
  { href: '/guide/configuracion', icon: Cog6ToothIcon, key: 'settings' },
  { href: '/guide/tips', icon: LightBulbIcon, key: 'tips' },
] as const;

export default function GuideIntroPage() {
  const t = useTranslations('guide');
  const tDocs = useTranslations('guideDocs');

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <div className="mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
          <BookOpenIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {t('subtitle')}
        </p>
      </div>

      <Card className="mb-10 border border-slate-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Contenido de la documentación</CardTitle>
          <CardDescription>
            Navega por cada sección desde el índice a la izquierda o desde los enlaces siguientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
            {SECTIONS.map(({ href, icon: Icon, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                >
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {tDocs(key)}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          ¿Qué es este panel?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          El panel de administración de Matchly te permite gestionar de forma centralizada ligas, torneos,
          sedes, canchas, profesores, clases, kiosco, usuarios y configuraciones del club. Esta documentación
          describe cada módulo y cómo utilizarlo correctamente.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Recomendamos empezar por <Link href="/guide/requisitos-previos" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Requisitos previos</Link> para
          tener sedes, canchas y categorías listas antes de crear ligas o torneos.
        </p>
      </section>
    </article>
  );
}
