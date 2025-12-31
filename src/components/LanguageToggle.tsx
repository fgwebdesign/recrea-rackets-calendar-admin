'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/TranslationContext';
import { ChevronDown } from 'lucide-react';

export function LanguageToggle() {
  const { locale, changeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  if (!mounted) {
    return (
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
    );
  }

  const toggleLanguage = (newLocale: 'es' | 'en') => {
    changeLanguage(newLocale);
    setIsExpanded(false);
  };

  const currentFlag = locale === 'es' ? '/assets/spain.png' : '/assets/usa.png';
  const currentAlt = locale === 'es' ? 'Español' : 'English';

  return (
    <div ref={containerRef} className="relative">
      {/* Botón compacto - siempre visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Cambiar idioma"
        className={`
          relative w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
          ${locale === 'es' 
            ? 'focus:ring-red-500 shadow-lg shadow-red-500/30' 
            : 'focus:ring-blue-500 shadow-lg shadow-blue-500/30'
          }
          hover:scale-110 active:scale-95
          overflow-hidden
        `}
      >
        <Image
          src={currentFlag}
          alt={currentAlt}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          priority
        />
        {/* Indicador de expansión */}
        <div className={`
          absolute bottom-0 right-0 w-3 h-3 rounded-full bg-white dark:bg-gray-800
          border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center
          transition-transform duration-300
          ${isExpanded ? 'rotate-180' : ''}
        `}>
          <ChevronDown className="w-2 h-2 text-gray-600 dark:text-gray-400" />
        </div>
      </button>

      {/* Menú desplegable */}
      <div className={`
        absolute top-12 right-0 z-50
        bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out overflow-hidden
        ${isExpanded 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }
      `}>
        <div className="p-2 flex flex-col items-center space-y-2 min-w-[80px]">
          {/* Spanish Flag */}
          <button
            onClick={() => toggleLanguage('es')}
            className={`
              w-12 h-12 rounded-full transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              ${locale === 'es' 
                ? 'opacity-100 scale-100 shadow-lg shadow-red-500/30 ring-2 ring-red-500' 
                : 'opacity-70 scale-95 hover:opacity-100 hover:scale-100'
              }
            `}
          >
            <Image
              src="/assets/spain.png"
              alt="Español"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </button>

          {/* ES Label */}
          <span className={`
            text-xs font-semibold transition-colors duration-200
            ${locale === 'es' 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            ES
          </span>

          {/* Divider */}
          <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 my-1"></div>

          {/* Switch Track */}
          <div className={`
            relative w-6 h-12 rounded-full transition-all duration-300 ease-in-out
            ${locale === 'es' 
              ? 'bg-gradient-to-b from-red-500 to-red-600 shadow-lg shadow-red-500/30' 
              : 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
            }
          `}>
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
          </div>

          {/* US Label */}
          <span className={`
            text-xs font-semibold transition-colors duration-200
            ${locale === 'en' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            US
          </span>

          {/* USA Flag */}
          <button
            onClick={() => toggleLanguage('en')}
            className={`
              w-12 h-12 rounded-full transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${locale === 'en' 
                ? 'opacity-100 scale-100 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500' 
                : 'opacity-70 scale-95 hover:opacity-100 hover:scale-100'
              }
            `}
          >
            <Image
              src="/assets/usa.png"
              alt="English"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </button>
        </div>
      </div>
    </div>
  );
}