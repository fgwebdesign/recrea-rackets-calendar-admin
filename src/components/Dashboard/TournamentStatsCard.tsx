import { Trophy, Users, Calendar, CheckCircle, DollarSign } from 'lucide-react';

interface TournamentStatsCardProps {
  title: string;
  value: number;
  type: 'total' | 'active' | 'teams' | 'revenue' | 'completed';
}

export function TournamentStatsCard({ title, value, type }: TournamentStatsCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'total':
        return <Trophy className="w-7 h-7 text-blue-500" />;
      case 'active':
        return <Calendar className="w-7 h-7 text-emerald-500" />;
      case 'teams':
        return <Users className="w-7 h-7 text-purple-500" />;
      case 'revenue':
        return <DollarSign className="w-7 h-7 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-7 h-7 text-green-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'total':
        return 'bg-blue-500/10 dark:bg-blue-500/20';
      case 'active':
        return 'bg-emerald-500/10 dark:bg-emerald-500/20';
      case 'teams':
        return 'bg-purple-500/10 dark:bg-purple-500/20';
      case 'revenue':
        return 'bg-orange-500/10 dark:bg-orange-500/20';
      case 'completed':
        return 'bg-green-500/10 dark:bg-green-500/20';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'total':
        return 'text-blue-700 dark:text-blue-300';
      case 'active':
        return 'text-emerald-700 dark:text-emerald-300';
      case 'teams':
        return 'text-purple-700 dark:text-purple-300';
      case 'revenue':
        return 'text-orange-700 dark:text-orange-300';
      case 'completed':
        return 'text-green-700 dark:text-green-300';
    }
  };

  const formatValue = () => {
    if (type === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    return value.toString();
  };

  return (
    <div className={`${getBgColor()} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300 break-words">{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getTextColor()} mt-0.5 font-mono`}>{formatValue()}</p>
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
