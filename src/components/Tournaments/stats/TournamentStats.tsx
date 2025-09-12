'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-500">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-gray-400 dark:text-gray-500">{icon}</div>
          )}
        </div>
        {trend && (
          <div className="mt-4">
            <span className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-500 ml-1">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TournamentOverviewChartProps {
  data: {
    total_tournaments: number;
    active_tournaments: number;
    completed_tournaments: number;
    upcoming_tournaments: number;
    total_teams: number;
  };
}

export function TournamentOverviewChart({ data }: TournamentOverviewChartProps) {
  const chartData = {
    labels: ['Total', 'Activos', 'Completados', 'Próximos'],
    datasets: [
      {
        label: 'Torneos',
        data: [
          data.total_tournaments,
          data.active_tournaments,
          data.completed_tournaments,
          data.upcoming_tournaments
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.y} torneos`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Torneos</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.total_teams} equipos registrados
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}

interface TournamentTypesChartProps {
  tournamentTypes: Record<string, number>;
}

export function TournamentTypesChart({ tournamentTypes }: TournamentTypesChartProps) {
  const chartData = {
    labels: Object.entries(tournamentTypes).map(([type]) => 
      type === 'NINE_PLAYERS' ? '9 Jugadores' : 
      type === 'TWELVE_PLAYERS' ? '12 Jugadores' : 
      '16 Jugadores'
    ),
    datasets: [
      {
        data: Object.values(tournamentTypes),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} torneos (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Tipo</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Tipos de torneos</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Pie data={chartData} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}

interface TournamentPaymentChartProps {
  categoriesBreakdown: Array<{
    category_name: string;
    paid_teams: number;
    pending_teams: number;
    failed_teams: number;
  }>;
}

export function TournamentPaymentChart({ categoriesBreakdown }: TournamentPaymentChartProps) {
  const chartData = {
    labels: categoriesBreakdown.map(category => category.category_name),
    datasets: [
      {
        label: 'Pagados',
        data: categoriesBreakdown.map(category => category.paid_teams),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Pendientes',
        data: categoriesBreakdown.map(category => category.pending_teams),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Fallidos',
        data: categoriesBreakdown.map(category => category.failed_teams),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          },
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} equipos`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Pagos por Categoría</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Equipos pagados vs pendientes</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}

interface PaymentRateChartProps {
  paymentRate: number;
  totalTeams: number;
  paidTeams: number;
}

export function PaymentRateChart({ paymentRate, totalTeams, paidTeams }: PaymentRateChartProps) {
  const pendingTeams = totalTeams - paidTeams;
  
  const chartData = {
    labels: ['Pagados', 'Pendientes'],
    datasets: [
      {
        data: [paidTeams, pendingTeams],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 3,
        hoverOffset: 8,
        cutout: '60%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const percentage = ((context.parsed / totalTeams) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} equipos (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de Pago: {paymentRate.toFixed(1)}%</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {paidTeams}/{totalTeams} equipos pagados
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Pie data={chartData} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}

interface RevenueChartProps {
  monthlyData: Array<{
    month: string;
    revenue: number;
    teams: number;
  }>;
}

export function RevenueChart({ monthlyData }: RevenueChartProps) {
  const chartData = {
    labels: monthlyData.map(month => month.month),
    datasets: [
      {
        label: 'Ingresos ($)',
        data: monthlyData.map(month => month.revenue),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          },
          usePointStyle: true,
          pointStyle: 'line'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const monthData = monthlyData[context.dataIndex];
            return [
              `Ingresos: $${context.parsed.y.toLocaleString()}`,
              `Equipos: ${monthData.teams}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por Mes</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Revenue generado por torneos</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}
