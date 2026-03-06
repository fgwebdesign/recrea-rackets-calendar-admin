import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FaWhatsapp, FaEdit } from 'react-icons/fa';
import WhatsAppConfigModal from '../Modals/WhatsAppConfigModal';
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from '@/contexts/TranslationContext';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  phoneNumber?: string;
}

interface IntegrationPanelState {
  whatsappNumber: string;
  isWhatsAppModalOpen: boolean;
}

export default function IntegrationsPanel() {
  const t = useTranslations('settings');
  
  const integrations: Integration[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: t('integrations.whatsappDescription'),
      icon: '/assets/whatsapp_logo.png',
      connected: false,
      phoneNumber: ''
    }
  ];
  const [state, setState] = useState<IntegrationPanelState>({
    whatsappNumber: '',
    isWhatsAppModalOpen: false
  });

  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/whatsapp`);
        const data = await response.json();
        if (data.whatsappNumber) {
          setState(prev => ({ ...prev, whatsappNumber: data.whatsappNumber }));
        }
      } catch {
        // Silently handle error
      }
    };

    fetchWhatsAppNumber();
  }, []);

  const handleOpenWhatsAppModal = () => {
    setState(prev => ({ ...prev, isWhatsAppModalOpen: true }));
  };

  const handleCloseWhatsAppModal = () => {
    setState(prev => ({ ...prev, isWhatsAppModalOpen: false }));
  };

  const handleSaveWhatsApp = async (phoneNumber: string) => {
    try {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error(t('integrations.noAuthToken'));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ whatsappNumber: phoneNumber })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || t('integrations.errorSavingNumber'));
      }

      setState(prev => ({ 
        ...prev, 
        whatsappNumber: phoneNumber,
        isWhatsAppModalOpen: false 
      }));

      toast({
        title: `✅ ${t('integrations.whatsappConfigured')}`,
        description: t('integrations.whatsappUpdated'),
        variant: "default",
        className: "border-l-4 border-l-green-500"
      });

    } catch (error) {
      toast({
        title: `❌ ${t('integrations.error')}`,
        description: error instanceof Error ? error.message : t('integrations.errorSavingWhatsapp'),
        variant: "destructive",
        className: "border-l-4 border-l-red-500"
      });
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        <div className="px-4 sm:px-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-1 sm:mb-2">{t('integrations.title')}</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('integrations.description')}</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {integrations.map((integration) => (
            <div 
              key={integration.id} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl 
                       shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 relative">
                    <Image
                      src={integration.icon}
                      alt={integration.name}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 48px, 56px"
                      className="object-contain"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {integration.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          {integration.description}
                        </p>
                      </div>
                      <button
                        onClick={integration.id === 'whatsapp' ? handleOpenWhatsAppModal : undefined}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full whitespace-nowrap flex-shrink-0 
                                 transition-colors font-medium ${
                          integration.id === 'whatsapp' && state.whatsappNumber
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {integration.id === 'whatsapp' && state.whatsappNumber ? t('integrations.configured') : t('integrations.connect')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {integration.id === 'whatsapp' && state.whatsappNumber && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{t('integrations.configuredNumber')}: </span>
                          <span className="break-all">+598 {state.whatsappNumber}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenWhatsAppModal}
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium
                               text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
                               hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors 
                               w-full sm:w-auto"
                    >
                      <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{t('integrations.edit')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {state.isWhatsAppModalOpen && (
        <WhatsAppConfigModal
          isOpen={state.isWhatsAppModalOpen}
          onClose={handleCloseWhatsAppModal}
          onSave={handleSaveWhatsApp}
          initialPhoneNumber={state.whatsappNumber}
        />
      )}
    </div>
  );
}
