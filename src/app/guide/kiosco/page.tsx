'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function KioscoDocPage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Kiosco
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestión de productos, categorías de producto, ventas y reportes del kiosco o tienda del club.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Módulos del Kiosco
        </h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar venta</CardTitle>
              <CardDescription>
                Punto de venta para registrar ventas rápidas: seleccionar productos, cantidades y talles si aplica.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <Link href="/kiosk" className="text-indigo-600 dark:text-indigo-400 font-medium">Kiosco → Registrar venta</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos</CardTitle>
              <CardDescription>
                Alta, edición y baja de productos: nombre, precio, stock, imagen, categoría, talles (opcional). Control de stock.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <Link href="/kiosk/products" className="text-indigo-600 dark:text-indigo-400 font-medium">Kiosco → Productos</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorías (kiosco)</CardTitle>
              <CardDescription>
                Categorías de productos del kiosco (bebidas, snacks, indumentaria, etc.) para organizar el catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <Link href="/kiosk/categories" className="text-indigo-600 dark:text-indigo-400 font-medium">Kiosco → Categorías</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas</CardTitle>
              <CardDescription>
                Historial de ventas: listado, detalle y anulación de ventas si corresponde.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <Link href="/kiosk/sales" className="text-indigo-600 dark:text-indigo-400 font-medium">Kiosco → Ventas</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reportes</CardTitle>
              <CardDescription>
                Estadísticas, resúmenes por período, productos más vendidos, comparación por sede, alertas de stock bajo, tendencias y rentabilidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              <Link href="/kiosk/reports" className="text-indigo-600 dark:text-indigo-400 font-medium">Kiosco → Reportes</Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Multi-sede
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Si el club tiene varias sedes, el kiosco puede operar por sede: productos y stock pueden configurarse por sede y los reportes permiten comparar ventas entre sedes.
        </p>
      </section>
    </article>
  );
}
