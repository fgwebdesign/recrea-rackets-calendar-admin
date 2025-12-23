# 📊 Guía de Frontend - Reportes del Kiosco

## Nuevos Endpoints de Reportes

### 1. Dashboard Principal
```
GET /kiosk/reports/dashboard?venue_id=optional
```

**Respuesta:**
```json
{
  "success": true,
  "dashboard": {
    "today": {
      "sales_count": 5,
      "total_revenue": 2500.00,
      "average_ticket": 500.00
    },
    "week": {
      "sales_count": 25,
      "total_revenue": 12000.00,
      "average_ticket": 480.00
    },
    "month": {
      "sales_count": 120,
      "total_revenue": 55000.00,
      "average_ticket": 458.33,
      "variation_percent": 15.5,
      "previous_month_total": 47619.05
    },
    "payment_methods": {
      "cash": { "count": 60, "total": 28000 },
      "transfer": { "count": 45, "total": 20000 },
      "card": { "count": 15, "total": 7000 }
    },
    "low_stock_count": 3,
    "low_stock_products": [...]
  }
}
```

### 2. Reporte Mensual
```
GET /kiosk/reports/monthly?year=2025&month=12&venue_id=optional
```

### 3. Comparativa por Sede
```
GET /kiosk/reports/venues?start_date=2025-12-01&end_date=2025-12-31
```

### 4. Reporte por Categoría
```
GET /kiosk/reports/categories?start_date=2025-12-01&end_date=2025-12-31&venue_id=optional
```

### 5. Tendencia de Ventas
```
GET /kiosk/reports/trend?days=30&venue_id=optional
```

### 6. Alertas de Stock
```
GET /kiosk/inventory/alerts?venue_id=optional
```

---

## 🎨 Diseño del Frontend

### Estructura de Páginas Sugerida

```
/kiosk/reports
├── Dashboard (vista principal con KPIs)
├── Reporte Mensual (tabla + gráficos por día)
├── Comparativa Sedes (barras comparativas)
└── Alertas Stock (lista con urgencia)
```

---

## 📱 Componentes Sugeridos

### 1. Dashboard Principal (`ReportsDashboard.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  ShoppingCart, AlertTriangle, Calendar 
} from 'lucide-react';

interface DashboardData {
  today: { sales_count: number; total_revenue: number; average_ticket: number };
  week: { sales_count: number; total_revenue: number; average_ticket: number };
  month: { 
    sales_count: number; 
    total_revenue: number; 
    average_ticket: number;
    variation_percent: number;
    previous_month_total: number;
  };
  payment_methods: Record<string, { count: number; total: number }>;
  low_stock_count: number;
  low_stock_products: Array<{ id: string; name: string; stock_quantity: number }>;
}

const fetchDashboard = async (venueId?: string) => {
  const params = venueId ? `?venue_id=${venueId}` : '';
  const res = await fetch(`/api/kiosk/reports/dashboard${params}`);
  return res.json();
};

export function ReportsDashboard() {
  const [venueId, setVenueId] = useState<string | undefined>();
  
  const { data, isLoading } = useQuery({
    queryKey: ['kiosk-dashboard', venueId],
    queryFn: () => fetchDashboard(venueId)
  });

  if (isLoading) return <DashboardSkeleton />;
  
  const dashboard: DashboardData = data?.dashboard;

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard de Ventas</h1>
        <VenueSelector value={venueId} onChange={setVenueId} />
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ventas Hoy"
          value={dashboard.today.total_revenue}
          subtitle={`${dashboard.today.sales_count} transacciones`}
          icon={<DollarSign />}
          format="currency"
        />
        <KPICard
          title="Esta Semana"
          value={dashboard.week.total_revenue}
          subtitle={`${dashboard.week.sales_count} transacciones`}
          icon={<Calendar />}
          format="currency"
        />
        <KPICard
          title="Este Mes"
          value={dashboard.month.total_revenue}
          subtitle={
            <TrendIndicator 
              value={dashboard.month.variation_percent} 
              label="vs mes anterior"
            />
          }
          icon={<TrendingUp />}
          format="currency"
        />
        <KPICard
          title="Ticket Promedio"
          value={dashboard.month.average_ticket}
          subtitle="promedio mensual"
          icon={<ShoppingCart />}
          format="currency"
        />
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métodos de pago */}
        <PaymentMethodsChart data={dashboard.payment_methods} />
        
        {/* Alertas de stock */}
        <LowStockAlerts 
          count={dashboard.low_stock_count}
          products={dashboard.low_stock_products}
        />
        
        {/* Mini tendencia */}
        <QuickTrendChart />
      </div>
    </div>
  );
}
```

### 2. Card de KPI (`KPICard.tsx`)

```tsx
interface KPICardProps {
  title: string;
  value: number;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  format?: 'currency' | 'number' | 'percent';
}

export function KPICard({ title, value, subtitle, icon, format = 'number' }: KPICardProps) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-UY', {
          style: 'currency',
          currency: 'UYU'
        }).format(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {title}
        </span>
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {formatValue()}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
      </div>
    </div>
  );
}
```

### 3. Indicador de Tendencia (`TrendIndicator.tsx`)

```tsx
interface TrendIndicatorProps {
  value: number;
  label: string;
}

export function TrendIndicator({ value, label }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <div className={`flex items-center gap-1 text-sm ${
      isNeutral ? 'text-gray-500' :
      isPositive ? 'text-green-600' : 'text-red-600'
    }`}>
      {!isNeutral && (
        isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )
      )}
      <span>{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
      <span className="text-gray-400">{label}</span>
    </div>
  );
}
```

### 4. Gráfico de Métodos de Pago (`PaymentMethodsChart.tsx`)

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PAYMENT_COLORS = {
  cash: '#10B981',      // Verde - Efectivo
  transfer: '#3B82F6',  // Azul - Transferencia
  card: '#8B5CF6',      // Violeta - Tarjeta
  mixed: '#F59E0B',     // Naranja - Mixto
};

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  mixed: 'Mixto',
};

interface PaymentMethodsChartProps {
  data: Record<string, { count: number; total: number }>;
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const chartData = Object.entries(data).map(([method, stats]) => ({
    name: PAYMENT_LABELS[method] || method,
    value: stats.total,
    count: stats.count,
    color: PAYMENT_COLORS[method] || '#6B7280'
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 5. Alertas de Stock Bajo (`LowStockAlerts.tsx`)

```tsx
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LowStockAlertsProps {
  count: number;
  products: Array<{
    id: string;
    name: string;
    stock_quantity: number;
    min_stock_alert: number;
  }>;
}

export function LowStockAlerts({ count, products }: LowStockAlertsProps) {
  if (count === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-500" />
          Stock Saludable
        </h3>
        <p className="text-gray-500">Todos los productos tienen stock suficiente</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-orange-200 dark:border-orange-800">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        Alertas de Stock ({count})
      </h3>
      
      <ul className="space-y-3">
        {products.slice(0, 5).map((product) => (
          <li 
            key={product.id}
            className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
          >
            <span className="font-medium text-sm">{product.name}</span>
            <span className={`text-sm font-bold ${
              product.stock_quantity === 0 ? 'text-red-600' : 'text-orange-600'
            }`}>
              {product.stock_quantity} unid.
            </span>
          </li>
        ))}
      </ul>
      
      {count > 5 && (
        <Link 
          href="/kiosk/inventory/alerts"
          className="flex items-center justify-center gap-2 mt-4 text-orange-600 hover:text-orange-700 text-sm font-medium"
        >
          Ver todos ({count})
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
```

### 6. Gráfico de Tendencia (`SalesTrendChart.tsx`)

```tsx
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface TrendChartProps {
  days?: number;
  venueId?: string;
}

export function SalesTrendChart({ days = 30, venueId }: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['kiosk-trend', days, venueId],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      if (venueId) params.append('venue_id', venueId);
      const res = await fetch(`/api/kiosk/reports/trend?${params}`);
      return res.json();
    }
  });

  if (isLoading) return <ChartSkeleton />;

  const chartData = data?.trend?.data || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Tendencia de Ventas</h3>
        <div className="flex gap-2">
          <PeriodButton active={days === 7} onClick={() => {}}>7D</PeriodButton>
          <PeriodButton active={days === 30} onClick={() => {}}>30D</PeriodButton>
          <PeriodButton active={days === 90} onClick={() => {}}>90D</PeriodButton>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                  <p className="font-medium">{new Date(label).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p className="text-orange-600 font-bold">
                    ${payload[0].value?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payload[0].payload.sales_count} ventas
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#F97316"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          {/* Línea de promedio móvil */}
          <Area
            type="monotone"
            dataKey="moving_avg"
            stroke="#6B7280"
            strokeWidth={1}
            strokeDasharray="5 5"
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${data?.trend?.summary?.total_revenue?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Total período</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data?.trend?.summary?.total_sales || 0}
          </p>
          <p className="text-sm text-gray-500">Transacciones</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${data?.trend?.summary?.average_per_day?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Promedio/día</p>
        </div>
      </div>
    </div>
  );
}
```

### 7. Reporte Mensual Completo (`MonthlyReport.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [venueId, setVenueId] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-report', year, month, venueId],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        year: String(year), 
        month: String(month) 
      });
      if (venueId) params.append('venue_id', venueId);
      const res = await fetch(`/api/kiosk/reports/monthly?${params}`);
      return res.json();
    }
  });

  const report = data?.report;
  const dailyData = report?.daily_breakdown || [];

  // Navegación de meses
  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con navegación de mes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold capitalize">
            {new Date(year, month - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-3">
          <VenueSelector value={venueId} onChange={setVenueId} />
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Ventas"
          value={report?.summary?.total_sales || 0}
          format="number"
        />
        <SummaryCard
          label="Ingresos Totales"
          value={report?.summary?.total_revenue || 0}
          format="currency"
        />
        <SummaryCard
          label="Ticket Promedio"
          value={report?.summary?.average_ticket || 0}
          format="currency"
        />
        <SummaryCard
          label="Variación"
          value={report?.summary?.comparison?.variation_percent || 0}
          format="percent"
          trend={report?.summary?.comparison?.variation_percent > 0 ? 'up' : 'down'}
        />
      </div>

      {/* Gráfico de barras diario */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Ventas por Día</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => date.split('-')[2]}
              tick={{ fontSize: 11 }}
            />
            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border">
                    <p className="font-medium capitalize">{data.day_name} {label.split('-')[2]}</p>
                    <p className="text-orange-600 font-bold">${data.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{data.sales_count} ventas</p>
                    <div className="text-xs mt-1 space-y-0.5">
                      <p>💵 Efectivo: ${data.cash.toLocaleString()}</p>
                      <p>📲 Transfer: ${data.transfer.toLocaleString()}</p>
                      <p>💳 Tarjeta: ${data.card.toLocaleString()}</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="total" 
              radius={[4, 4, 0, 0]}
            >
              {dailyData.map((entry, index) => (
                <Cell 
                  key={index}
                  fill={entry.total > 0 ? '#F97316' : '#E5E7EB'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mejor día y métodos de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {report?.best_day && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">🏆 Mejor Día del Mes</h3>
            <p className="text-3xl font-bold">{report.best_day.day_name} {report.best_day.date.split('-')[2]}</p>
            <p className="text-xl">${report.best_day.total.toLocaleString()}</p>
            <p className="text-sm opacity-80">{report.best_day.sales_count} transacciones</p>
          </div>
        )}
        
        <PaymentMethodsBreakdown data={report?.by_payment_method || {}} />
      </div>
    </div>
  );
}
```

### 8. Comparativa por Sede (`VenueComparison.tsx`)

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { MapPin, TrendingUp } from 'lucide-react';

export function VenueComparison() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data, isLoading } = useQuery({
    queryKey: ['venue-comparison', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      const res = await fetch(`/api/kiosk/reports/venues?${params}`);
      return res.json();
    }
  });

  const venues = data?.report?.venues || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-orange-500" />
          Ventas por Sede
        </h2>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">
            ${data?.report?.global?.total_revenue?.toLocaleString() || 0}
          </p>
          <p className="text-gray-500 text-sm">Total todas las sedes</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{data?.report?.global?.total_sales || 0}</p>
          <p className="text-gray-500 text-sm">Transacciones</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{data?.report?.global?.total_venues || 0}</p>
          <p className="text-gray-500 text-sm">Sedes activas</p>
        </div>
      </div>

      {/* Gráfico comparativo */}
      <div className="bg-white rounded-xl p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={venues} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="venue_name" width={150} />
            <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ingresos']} />
            <Bar dataKey="total_revenue" fill="#F97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Sede</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Ventas</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Ingresos</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Ticket Prom.</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">% del Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {venues.map((venue, index) => (
              <tr key={venue.venue_id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{venue.venue_name}</td>
                <td className="px-6 py-4 text-right">{venue.sales_count}</td>
                <td className="px-6 py-4 text-right font-bold text-orange-600">
                  ${venue.total_revenue.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  ${venue.average_ticket.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500" 
                        style={{ width: `${venue.percentage_of_total}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{venue.percentage_of_total}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🎯 Hooks Personalizados

### useKioskReports.ts

```tsx
import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/kiosk';

export function useDashboard(venueId?: string) {
  return useQuery({
    queryKey: ['kiosk-dashboard', venueId],
    queryFn: async () => {
      const params = venueId ? `?venue_id=${venueId}` : '';
      const res = await fetch(`${API_BASE}/reports/dashboard${params}`);
      if (!res.ok) throw new Error('Error fetching dashboard');
      return res.json();
    },
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000 // Refrescar cada minuto
  });
}

export function useMonthlyReport(year: number, month: number, venueId?: string) {
  return useQuery({
    queryKey: ['kiosk-monthly', year, month, venueId],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year), month: String(month) });
      if (venueId) params.append('venue_id', venueId);
      const res = await fetch(`${API_BASE}/reports/monthly?${params}`);
      if (!res.ok) throw new Error('Error fetching monthly report');
      return res.json();
    },
    staleTime: 300000 // 5 minutos
  });
}

export function useSalesTrend(days: number = 30, venueId?: string) {
  return useQuery({
    queryKey: ['kiosk-trend', days, venueId],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      if (venueId) params.append('venue_id', venueId);
      const res = await fetch(`${API_BASE}/reports/trend?${params}`);
      if (!res.ok) throw new Error('Error fetching trend');
      return res.json();
    }
  });
}

export function useVenueComparison(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['kiosk-venues', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const res = await fetch(`${API_BASE}/reports/venues?${params}`);
      if (!res.ok) throw new Error('Error fetching venue comparison');
      return res.json();
    }
  });
}

export function useLowStockAlerts(venueId?: string) {
  return useQuery({
    queryKey: ['kiosk-low-stock', venueId],
    queryFn: async () => {
      const params = venueId ? `?venue_id=${venueId}` : '';
      const res = await fetch(`${API_BASE}/inventory/alerts${params}`);
      if (!res.ok) throw new Error('Error fetching alerts');
      return res.json();
    },
    refetchInterval: 300000 // Cada 5 minutos
  });
}
```

---

## 📁 Estructura de Archivos Sugerida

```
src/
├── app/
│   └── kiosk/
│       └── reports/
│           ├── page.tsx           # Dashboard principal
│           ├── monthly/
│           │   └── page.tsx       # Reporte mensual
│           ├── venues/
│           │   └── page.tsx       # Comparativa sedes
│           └── inventory/
│               └── page.tsx       # Alertas de stock
├── components/
│   └── kiosk/
│       └── reports/
│           ├── KPICard.tsx
│           ├── TrendIndicator.tsx
│           ├── PaymentMethodsChart.tsx
│           ├── LowStockAlerts.tsx
│           ├── SalesTrendChart.tsx
│           ├── MonthlyReport.tsx
│           ├── VenueComparison.tsx
│           └── DateRangePicker.tsx
└── hooks/
    └── useKioskReports.ts
```

---

## 🔧 Dependencias Necesarias

```bash
npm install recharts @tanstack/react-query lucide-react date-fns
```

---

## 💡 Tips de UX

1. **Carga inicial rápida**: Usa `staleTime` para evitar refetches innecesarios
2. **Skeleton loaders**: Muestra esqueletos mientras cargan los datos
3. **Filtros persistentes**: Guarda el venue seleccionado en localStorage
4. **Exportar datos**: Añade botón para descargar CSV/Excel
5. **Modo oscuro**: Usa clases `dark:` de Tailwind para temas

---

## 🎨 Paleta de Colores Sugerida

```css
:root {
  --kiosk-primary: #F97316;    /* Naranja */
  --kiosk-success: #10B981;    /* Verde */
  --kiosk-warning: #F59E0B;    /* Amarillo */
  --kiosk-danger: #EF4444;     /* Rojo */
  --kiosk-info: #3B82F6;       /* Azul */
  --kiosk-purple: #8B5CF6;     /* Violeta */
}
```

