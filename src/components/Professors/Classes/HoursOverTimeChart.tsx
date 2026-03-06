'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ByDayRow {
  date: string;
  total_hours: number;
  total_amount_professor: number;
  total_amount_club: number;
}

interface HoursOverTimeChartProps {
  data: ByDayRow[];
  formatCurrency: (n: number) => string;
}

export function HoursOverTimeChart({ data, formatCurrency }: HoursOverTimeChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    return {
      labels: sorted.map((r) => format(new Date(r.date), 'dd MMM', { locale: es })),
      datasets: [
        {
          label: 'Horas',
          data: sorted.map((r) => Math.round(r.total_hours * 100) / 100),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 24,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx: { dataIndex: number; parsed: { y: number } }) => {
              const row = [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)[ctx.dataIndex];
              if (!row) return '';
              return [
                `Horas: ${ctx.parsed.y} h`,
                `Cobro: ${formatCurrency(row.total_amount_professor)}`,
                `Comisión: ${formatCurrency(row.total_amount_club)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 45 },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { font: { size: 11 } },
        },
      },
    }),
    [data, formatCurrency]
  );

  if (data.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Horas por día
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '260px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
