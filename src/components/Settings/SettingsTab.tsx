import React from 'react';
import { FaUser, FaKey, FaPlug } from 'react-icons/fa';
import { useTranslations } from '@/contexts/TranslationContext';

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const t = useTranslations('settings');
  
  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: FaUser },
    { id: 'integrations', label: t('tabs.integrations'), icon: FaPlug },
    { id: 'password', label: t('tabs.password'), icon: FaKey },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-0 mb-6 md:mb-0">
      <div className="flex md:flex-col space-x-4 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-visible">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md flex-1 md:flex-none justify-center md:justify-start ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}