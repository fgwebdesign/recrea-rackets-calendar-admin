'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
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
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/contexts/TranslationContext';

const DOC_SECTIONS = [
  { href: '/guide', icon: HomeIcon, key: 'intro' },
  { href: '/guide/requisitos-previos', icon: ClipboardDocumentListIcon, key: 'prerequisites' },
  { href: '/guide/dashboard', icon: HomeIcon, key: 'dashboard' },
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

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations('guideDocs');

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-4 sm:px-6 py-6 flex gap-6">
        {/* Sidebar - Índice de documentación */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-24 rounded-xl border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {t('title')}
                </span>
              </div>
            </div>
            <ul className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {DOC_SECTIONS.map(({ href, icon: Icon, key }) => {
                const isActive =
                  href === '/guide'
                    ? pathname === '/guide'
                    : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0">
          {/* Índice móvil */}
          <div className="lg:hidden mb-6">
            <details className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none font-medium text-slate-700 dark:text-gray-200">
                <Bars3Icon className="w-5 h-5" />
                {t('title')}
              </summary>
              <ul className="p-2 border-t border-slate-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                {DOC_SECTIONS.map(({ href, icon: Icon, key }) => {
                  const isActive = href === '/guide' ? pathname === '/guide' : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/40 font-medium' : ''}`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
