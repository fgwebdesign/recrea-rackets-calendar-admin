import Image from 'next/image';
import { useTranslations } from '@/contexts/TranslationContext';

interface EmptyLeaguesProps {
  message?: string;
}

export function EmptyLeagues({ message }: EmptyLeaguesProps) {
  const t = useTranslations('dashboard');
  const defaultMessage = message || t('noLeaguesAvailable');
  
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t('registrationProgressLeagues')}
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="relative w-48 h-48 mb-4">
          <Image
            src="/assets/nonextmatches.png"
            alt={t('noLeaguesAvailable')}
            fill
            className="object-contain"
            priority
          />
        </div>
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300 text-center mb-1">
          {t('noActiveLeagues')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {defaultMessage}
        </p>
      </div>
    </div>
  );
} 