import { Trophy, Users, Calendar, CheckCircle } from 'lucide-react';

interface LeagueStatsCardProps {
  title: string;
  value: number;
  type: 'active' | 'teams' | 'matches' | 'completed';
}

export function LeagueStatsCard({ title, value, type }: LeagueStatsCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'active':
        return <Trophy className="w-7 h-7 text-blue-500" />;
      case 'teams':
        return <Users className="w-7 h-7 text-emerald-500" />;
      case 'matches':
        return <Calendar className="w-7 h-7 text-violet-500" />;
      case 'completed':
        return <CheckCircle className="w-7 h-7 text-orange-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'active':
        return 'bg-blue-500/10 dark:bg-blue-500/20';
      case 'teams':
        return 'bg-emerald-500/10 dark:bg-emerald-500/20';
      case 'matches':
        return 'bg-violet-500/10 dark:bg-violet-500/20';
      case 'completed':
        return 'bg-orange-500/10 dark:bg-orange-500/20';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'active':
        return 'text-blue-700 dark:text-blue-300';
      case 'teams':
        return 'text-emerald-700 dark:text-emerald-300';
      case 'matches':
        return 'text-violet-700 dark:text-violet-300';
      case 'completed':
        return 'text-orange-700 dark:text-orange-300';
    }
  };

  return (
    <div className={`${getBgColor()} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300 break-words">{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getTextColor()} mt-0.5 font-mono`}>{value}</p>
        </div>
        <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg ${getBgColor()} flex-shrink-0`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7">
            {getIcon()}
          </div>
        </div>
      </div>
    </div>
  );
} 