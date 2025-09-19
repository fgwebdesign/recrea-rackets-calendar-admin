'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/contexts/TranslationContext';

interface ShirtSizesSelectorProps {
  selectedSizes: string[];
  onSizesChange: (sizes: string[]) => void;
  error?: string;
  disabled?: boolean;
}

const SHIRT_SIZES = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' }
];

export function ShirtSizesSelector({ 
  selectedSizes, 
  onSizesChange, 
  error, 
  disabled = false 
}: ShirtSizesSelectorProps) {
  const t = useTranslations('tournaments');
  
  const handleSizeToggle = (size: string) => {
    if (disabled) return;
    
    const isSelected = selectedSizes.includes(size);
    
    if (isSelected) {
      // Remover el talle
      onSizesChange(selectedSizes.filter(s => s !== size));
    } else {
      // Agregar el talle (máximo 2)
      if (selectedSizes.length < 2) {
        onSizesChange([...selectedSizes, size]);
      }
    }
  };

  return (
    <Card className={cn(
      "border-2 transition-all duration-200",
      error 
        ? "border-red-500 dark:border-red-500" 
        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
            <Shirt className="h-5 w-5 text-emerald-600" />
          </div>
          {t('adminRegister.shirtSizesSelector.title')}
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('adminRegister.shirtSizesSelector.description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {SHIRT_SIZES.map((size) => {
            const isSelected = selectedSizes.includes(size.value);
            const isDisabled = disabled || (!isSelected && selectedSizes.length >= 2);
            
            return (
              <button
                key={size.value}
                type="button"
                onClick={() => handleSizeToggle(size.value)}
                disabled={isDisabled}
                className={cn(
                  "p-3 rounded-lg transition-all duration-200 border-2 font-medium",
                  isSelected
                    ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600",
                  isDisabled && !isSelected && "opacity-50 cursor-not-allowed hover:border-slate-200 dark:hover:border-slate-700"
                )}
              >
                {size.label}
              </button>
            );
          })}
        </div>
        
        {/* Información de selección */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {t('adminRegister.shirtSizesSelector.selected')}: {selectedSizes.length}/2
          </span>
          {selectedSizes.length > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {selectedSizes.join(', ')}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>{t('adminRegister.shirtSizesSelector.note')}:</strong> {t('adminRegister.shirtSizesSelector.noteDescription')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
