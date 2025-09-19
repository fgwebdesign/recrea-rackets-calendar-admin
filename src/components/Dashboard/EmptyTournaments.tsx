import { Trophy } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';

export function EmptyTournaments() {
  const t = useTranslations('dashboard');
  
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <Trophy className="w-12 h-12 text-blue-500 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {t('noTournaments')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm">
        {t('noTournamentsDescription')}
      </p>
    </div>
  );
}
