'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function TipsDocPage() {
  const t = useTranslations('guide');
  const tips = typeof t('tips') === 'object' ? t('tips') as Record<string, unknown> : null;
  const planning = tips && typeof tips.planning === 'object' ? tips.planning as Record<string, string> : null;
  const schedules = tips && typeof tips.schedules === 'object' ? tips.schedules as Record<string, string> : null;
  const verification = tips && typeof tips.verification === 'object' ? tips.verification as Record<string, string> : null;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {tips && typeof tips === 'object' && 'title' in tips && typeof (tips as { title: string }).title === 'string'
            ? (tips as { title: string }).title
            : 'Tips y mejores prácticas'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Recomendaciones para sacar el máximo partido al panel y evitar errores comunes.
        </p>
      </header>

      <div className="space-y-6">
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <InformationCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-lg">
                  {planning?.title ?? 'Planificación anticipada'}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            {planning?.description ?? 'Crea las sedes, canchas y categorías antes de crear ligas o torneos para tener todo listo.'}
          </CardContent>
        </Card>

        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <InformationCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-lg">
                  {schedules?.title ?? 'Horarios equitativos'}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            {schedules?.description ?? 'El sistema distribuye automáticamente los horarios de manera equitativa entre todos los equipos cuando corresponde.'}
          </CardContent>
        </Card>

        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <InformationCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-lg">
                  {verification?.title ?? 'Verificación de datos'}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            {verification?.description ?? 'Revisa siempre la información antes de crear ligas o torneos para evitar errores.'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comisiones de profesores</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            Configura primero la comisión por defecto del club en Profesores → Clases. Si un profesor tiene comisión propia, tendrá prioridad sobre la por defecto. Deja vacía la comisión del profesor cuando quieras usar la del club.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kiosco y stock</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            Revisa los reportes de stock bajo en Kiosco → Reportes para reponer productos a tiempo. Si usas varias sedes, configura productos y stock por sede.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pantalla TV</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            Abre la Pantalla TV en un navegador en el televisor del club y selecciona el torneo o liga del día. Así los jugadores ven partidos y resultados en vivo.
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
