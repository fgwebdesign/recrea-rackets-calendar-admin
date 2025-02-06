import Link from 'next/link';
import { UsersIcon, BuildingOfficeIcon, TrophyIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface Stats {
  totalUsers: number;
  totalSponsors: number;
  activeTournaments: number;
  monthlyIncome: number;
}

interface DashboardStatsProps {
  stats: Stats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Usuarios Totales",
      value: stats.totalUsers,
      icon: <UsersIcon className="w-5 h-5" />,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-400/30",
      href: "/users"
    },
    {
      title: "Patrocinadores Totales",
      value: stats.totalSponsors,
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconBg: "bg-purple-400/30",
      href: "/sponsors"
    },
    {
      title: "Torneos Activos",
      value: stats.activeTournaments,
      icon: <TrophyIcon className="w-5 h-5" />,
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
      iconBg: "bg-amber-400/30",
      href: "/tournaments"
    },
    {
      title: "Ingresos del Mes",
      value: `$${stats.monthlyIncome}`,
      icon: <BanknotesIcon className="w-5 h-5" />,
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-400/30",
      href: "/incomes"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Link href={stat.href} key={index}>
          <div
            className={`${stat.bgColor} rounded-2xl shadow-lg relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 rotate-45 bg-white/10" />
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-white/80">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 