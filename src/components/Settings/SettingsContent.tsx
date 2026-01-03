"use client";

import React, { useState } from 'react';
import ProfileSettings from '@/components/Settings/ProfileSettings';
import IntegrationsPanel from '@/components/Settings/IntegrationsPanel';
import SubscriptionPanel from '@/components/Settings/SubscriptionPanel';
import { 
  UserIcon, 
  Square3Stack3DIcon, 
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/contexts/TranslationContext';

export default function SettingsContent() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState('profile');
  
  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: UserIcon },
    { id: 'integrations', label: t('tabs.integrations'), icon: Square3Stack3DIcon },
    { id: 'subscription', label: t('tabs.subscription'), icon: CreditCardIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex overflow-x-auto md:overflow-visible bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-1 sm:p-1.5 -mx-4 sm:mx-0 px-4 sm:px-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white dark:bg-blue-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'integrations' && <IntegrationsPanel />}
          {activeTab === 'subscription' && <SubscriptionPanel />}
        </div>
      </div>
    </div>
  );
}
