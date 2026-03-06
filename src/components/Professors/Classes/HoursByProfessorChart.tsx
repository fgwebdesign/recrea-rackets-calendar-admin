'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
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

interface ByProfessorRow {
  professor_id: string;
  professor_name: string | null;
  total_hours: number;
  total_amount_professor: number;
  total_amount_club: number;
}

interface HoursByProfessorChartProps {
  data: ByProfessorRow[];
  formatCurrency: (n: number) => string;
}

const COLORS = [
  'rgba(16, 185, 129, 0.85)',
  'rgba(59, 130, 246, 0.85)',
  'rgba(139, 92, 246, 0.85)',
  'rgba(236, 72, 153, 0.85)',
  'rgba(249, 115, 22, 0.85)',
  'rgba(234, 179, 8, 0.85)',
];

export function HoursByProfessorChart({ data, formatCurrency }: HoursByProfessorChartProps) {
  const chartData = useMemo(() => {
    const top = data.slice(0, 10);
    return {
      labels: top.map((r) => r.professor_name ?? 'Sin nombre'),
      datasets: [
        {
          label: 'Horas',
          data: top.map((r) => Math.round(r.total_hours * 100) / 100),
          backgroundColor: top.map((_, i) => COLORS[i % COLORS.length]),
          borderColor: top.map((_, i) => COLORS[i % COLORS.length].replace('0.85', '1')),
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 28,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx: { dataIndex: number; parsed: { x: number } }) => {
              const row = data[ctx.dataIndex];
              if (!row) return '';
              return [
                `Horas: ${ctx.parsed.x} h`,
                `Cobro: ${formatCurrency(row.total_amount_professor)}`,
                `Comisión club: ${formatCurrency(row.total_amount_club)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { font: { size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
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
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          Horas por profesor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${Math.max(220, data.slice(0, 10).length * 36)}px` }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
