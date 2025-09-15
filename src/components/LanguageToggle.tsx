'use client';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/TranslationContext';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export function LanguageToggle() {
  const { locale, changeLanguage } = useLanguage();

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <div className="relative">
      <Select value={locale} onValueChange={changeLanguage}>
        <SelectTrigger className="w-auto h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentLanguage?.flag} {currentLanguage?.name}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}