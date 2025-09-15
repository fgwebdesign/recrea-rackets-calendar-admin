'use client';

import Image from 'next/image';
import { useTranslations } from '@/contexts/TranslationContext';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const t = useTranslations('loading');
  const tAuth = useTranslations('auth');
  const displayMessage = message || t('defaultMessage');

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-400 dark:from-blue-900 dark:to-blue-700 flex items-center justify-center z-50">
      {/* Contenido principal */}
      <div className="text-center">
        {/* Logo con efectos mejorados */}
        <div className="relative w-36 h-36 mx-auto mb-8">
          {/* Anillo exterior */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-500 rounded-full p-1">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-800 dark:to-blue-900 rounded-full p-2 shadow-2xl">
              {/* Anillo interior */}
              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full p-3 shadow-inner">
                <div className="relative w-full h-full">
                  <Image
                    src="/assets/Matchlylogo.png"
                    alt={tAuth('appTitle')}
                    fill
                    className="object-contain rounded-full"
                    priority
                    sizes="144px"
                    style={{ 
                      objectFit: 'contain',
                      background: 'white',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animación de carga */}
        <div className="space-y-4">
          {/* Puntos de carga con colores azules */}
          <div className="flex justify-center space-x-2">
            <div 
              className="w-4 h-4 bg-blue-300 rounded-full animate-bounce shadow-lg" 
              style={{ animationDelay: '0s' }}
            ></div>
            <div 
              className="w-4 h-4 bg-blue-400 rounded-full animate-bounce shadow-lg" 
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div 
              className="w-4 h-4 bg-blue-500 rounded-full animate-bounce shadow-lg" 
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
          
          {/* Mensaje */}
          <div className="relative">
            <p className="text-white dark:text-gray-200 text-lg font-semibold drop-shadow-lg">
              {displayMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 