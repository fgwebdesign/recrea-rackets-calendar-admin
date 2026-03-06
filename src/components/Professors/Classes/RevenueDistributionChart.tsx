'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RevenueDistributionChartProps {
  totalAmountProfessor: number;
  totalAmountClub: number;
  formatCurrency: (n: number) => string;
}

export function RevenueDistributionChart({
  totalAmountProfessor,
  totalAmountClub,
  formatCurrency,
}: RevenueDistributionChartProps) {
  const total = totalAmountProfessor + totalAmountClub;
  if (total <= 0) return null;

  const chartData = useMemo(
    () => ({
      labels: ['Cobro profesor', 'Comisión club'],
      datasets: [
        {
          data: [totalAmountProfessor, totalAmountClub],
          backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(139, 92, 246, 0.85)'],
          borderColor: ['rgb(16, 185, 129)', 'rgb(139, 92, 246)'],
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    }),
    [totalAmountProfessor, totalAmountClub]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: { font: { size: 12 }, padding: 16 },
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx: { parsed: number; dataset: { data: number[] } }) => {
              const pct = ((ctx.parsed / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
              return `${formatCurrency(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    }),
    [formatCurrency]
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          Distribución cobro / comisión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '260px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
