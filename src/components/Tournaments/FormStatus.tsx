'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/contexts/TranslationContext';

interface FormStatusProps {
  player1: string;
  player2: string;
  slot: string;
  validationErrors: {
    player1?: string;
    player2?: string;
    slot?: string;
  };
}

export function FormStatus({ player1, player2, slot, validationErrors }: FormStatusProps) {
  const t = useTranslations('tournaments');
  
  const getStatusIcon = (hasValue: boolean, hasError: boolean) => {
    if (hasError) {
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    }
    if (hasValue) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    return <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = (hasValue: boolean, hasError: boolean, fieldName: string) => {
    if (hasError) {
      return t('adminRegister.formStatus.error');
    }
    if (hasValue) {
      return t('adminRegister.formStatus.completed');
    }
    return t('adminRegister.formStatus.pending');
  };

  const getStatusColor = (hasValue: boolean, hasError: boolean) => {
    if (hasError) {
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    }
    if (hasValue) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
    return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
  };

  const fields = [
    {
      name: t('adminRegister.formStatus.firstPlayer'),
      value: player1,
      error: validationErrors.player1
    },
    {
      name: t('adminRegister.formStatus.secondPlayer'),
      value: player2,
      error: validationErrors.player2
    },
    {
      name: t('adminRegister.formStatus.schedule'),
      value: slot,
      error: validationErrors.slot
    }
  ];

  const completedFields = fields.filter(field => field.value && !field.error).length;
  const totalFields = fields.length;
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('adminRegister.formStatus.title')}
        </h3>
        <Badge className={`${hasErrors ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : completedFields === totalFields ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
          {completedFields}/{totalFields} {t('adminRegister.formStatus.completedCount')}
        </Badge>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const hasValue = !!field.value;
          const hasError = !!field.error;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {getStatusIcon(hasValue, hasError)}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {field.name}
                </span>
              </div>
              <Badge className={getStatusColor(hasValue, hasError)}>
                {getStatusText(hasValue, hasError, field.name)}
              </Badge>
            </div>
          );
        })}
      </div>

      {hasErrors && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            ⚠️ {t('adminRegister.formStatus.fixErrors')}
          </p>
        </div>
      )}

      {completedFields === totalFields && !hasErrors && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            ✅ {t('adminRegister.formStatus.readyToSubmit')}
          </p>
        </div>
      )}
    </div>
  );
}
