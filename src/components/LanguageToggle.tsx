'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/TranslationContext';

export function LanguageToggle() {
  const { locale, changeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
    );
  }

  const toggleLanguage = () => {  
    const newLocale = locale === 'es' ? 'en' : 'es';
    changeLanguage(newLocale);
  };

  return (
    <div className="relative group">
      {/* Switch Container */}
      <div className="relative flex flex-col items-center space-y-2">
        {/* Spanish Flag */}
        <div className={`
          w-8 h-8 rounded-full transition-all duration-300 ease-in-out
          ${locale === 'es' 
            ? 'opacity-100 scale-100 shadow-lg shadow-red-500/30' 
            : 'opacity-60 scale-95'
          }
        `}>
          <Image
            src="/assets/spain.png"
            alt="Español"
            width={32}
            height={32}
            className="w-full h-full object-cover rounded-full"
            priority
          />
        </div>

        {/* ES Label */}
        <span className={`
          text-sm font-bold transition-colors duration-300
          ${locale === 'es' 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-400 dark:text-gray-500'
          }
        `}>
          ES
        </span>

        {/* Switch Track */}
        <button
          onClick={toggleLanguage}
          className={`
            relative w-6 h-12 rounded-full transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-blue-500/20
            ${locale === 'es' 
              ? 'bg-gradient-to-b from-red-500 to-red-600 shadow-lg shadow-red-500/30' 
              : 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
            }
            hover:scale-105 active:scale-95
          `}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          </div>

          {/* Sliding Indicator */}
          <div className={`
            absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-lg
            transition-all duration-300 ease-in-out
            ${locale === 'es' ? 'top-0.5' : 'top-6.5'}
          `}>
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-100"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/50"></div>
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </button>

        {/* US Label */}
        <span className={`
          text-sm font-bold transition-colors duration-300
          ${locale === 'en' 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-400 dark:text-gray-500'
          }
        `}>
          US
        </span>

        {/* USA Flag */}
        <div className={`
          w-8 h-8 rounded-full transition-all duration-300 ease-in-out
          ${locale === 'en' 
            ? 'opacity-100 scale-100 shadow-lg shadow-blue-500/30' 
            : 'opacity-60 scale-95'
          }
        `}>
          <Image
            src="/assets/usa.png"
            alt="English"
            width={32}
            height={32}
            className="w-full h-full object-cover rounded-full"
            priority
          />
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {locale === 'es' ? 'Cambiar a English' : 'Switch to Español'}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
      </div>
    </div>
  );
}