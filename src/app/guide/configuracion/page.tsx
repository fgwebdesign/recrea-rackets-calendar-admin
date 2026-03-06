'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';
import Link from 'next/link';

export default function ConfiguracionDocPage() {
  const t = useTranslations('settings');

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

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Pestañas de configuración
        </h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perfil</CardTitle>
              <CardDescription>
                Datos personales del usuario administrador: nombre, apellido, email. Edición desde el panel.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integraciones</CardTitle>
              <CardDescription>
                Configuración de WhatsApp Business: número asociado al club para notificaciones o contacto. Opcional.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              {t('integrations.whatsappDescription')}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suscripción</CardTitle>
              <CardDescription>
                Estado de la suscripción del club al servicio (plan, facturación, características incluidas).
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contraseña</CardTitle>
              <CardDescription>
                Cambio de contraseña del usuario administrador.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Configuración del club
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          La configuración global del club (nombre del club, comisión por defecto para profesores, etc.) se gestiona desde el backend y se refleja en el panel donde corresponda (por ejemplo, la comisión por defecto en <Link href="/professors/classes" className="text-indigo-600 dark:text-indigo-400">Profesores → Clases</Link>). Los ajustes de WhatsApp y perfil están en <Link href="/settings" className="text-indigo-600 dark:text-indigo-400 font-medium">Configuraciones</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Acceso
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          <Link href="/settings" className="text-indigo-600 dark:text-indigo-400 font-medium">/settings</Link> — Configuraciones del panel y del usuario.
        </p>
      </section>
    </article>
  );
}
