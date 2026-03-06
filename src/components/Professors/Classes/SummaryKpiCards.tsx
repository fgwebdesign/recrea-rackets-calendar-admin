'use client';

import { Clock, Wallet, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SummaryKpiCardsProps {
  totalHours: number;
  totalAmountProfessor: number;
  totalAmountClub: number;
  formatCurrency: (n: number) => string;
}

const cardConfig = [
  {
    key: 'hours',
    label: 'Total horas',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  {
    key: 'professor',
    label: 'Cobro profesor',
    icon: Wallet,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  {
    key: 'club',
    label: 'Comisión club',
    icon: Building2,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
  },
];

export function SummaryKpiCards({
  totalHours,
  totalAmountProfessor,
  totalAmountClub,
  formatCurrency,
}: SummaryKpiCardsProps) {
  const values = [totalHours.toFixed(2), formatCurrency(totalAmountProfessor), formatCurrency(totalAmountClub)];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cardConfig.map((config, i) => (
        <Card key={config.key} className="border-0 shadow-sm overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{config.label}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {config.key === 'hours' ? `${values[i]} h` : values[i]}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${config.bg}`}>
                <config.icon className={`h-5 w-5 ${config.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
