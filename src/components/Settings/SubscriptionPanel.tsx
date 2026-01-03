import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CreditCardIcon, CalendarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '@/contexts/TranslationContext';

export default function SubscriptionPanel() {
  const t = useTranslations('settings');
  
  const subscriptionData = {
    status: 'active',
    plan: 'Premium',
    amount: 90,
    features: [
      t('subscription.fullPlatformAccess'),
      t('subscription.prioritySupport'),
      t('subscription.autoBackup'),
      t('subscription.premiumUpdates')
    ]
  };
  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 px-4 sm:px-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {t('subscription.title')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('subscription.membershipStatus')}</p>
          </div>
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full self-start md:self-auto">
            <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">{t('subscription.active')}</span>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 lg:mt-6 bg-blue-50 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <InformationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">{t('subscription.annualContract')}</h3>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 break-words">
                {t('subscription.annualContractDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 lg:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('subscription.premiumPlan')}</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">$90 USD</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('subscription.perMonth')}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('subscription.billing')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-900 dark:text-white">{t('subscription.monthly')}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('subscription.autoCharge')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          {t('subscription.includedFeatures')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {subscriptionData.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="break-words">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}