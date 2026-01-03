import { useEffect, useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from '@/contexts/TranslationContext';

interface AdminData {
  first_name: string;
  last_name: string;
  email: string;
}

export default function ProfileSettings() {
  const t = useTranslations('settings');
  const [profile, setProfile] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error(t('profile.tokenNotFound'));

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error(t('profile.errorLoadingProfile'));
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('profile.errorLoadingProfile');
        setError(errorMessage);
        toast({
          title: `❌ ${t('profile.error')}`,
          description: errorMessage,
          variant: "destructive",
        });
      }
    }

    loadProfile();
  }, []);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {t('profile.title')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {t('profile.personalInfo')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {t('profile.firstName')}
          </label>
          <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       text-sm sm:text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 break-words">
            {profile.first_name}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {t('profile.lastName')}
          </label>
          <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       text-sm sm:text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 break-words">
            {profile.last_name}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {t('profile.email')}
          </label>
          <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       text-sm sm:text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 break-words">
            {profile.email}
          </div>
        </div>
      </div>
    </div>
  );
}
