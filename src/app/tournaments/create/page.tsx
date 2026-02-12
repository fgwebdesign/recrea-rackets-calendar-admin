'use client';

import { useEffect } from 'react';
import { TableIcon } from 'lucide-react';
import Header from '@/components/Header';
import { TournamentBasicInfo } from '@/components/Tournaments/create/TournamentBasicInfo';
import { TournamentDetailInfo } from '@/components/Tournaments/create/TournamentDetailInfo';
import { useCategories } from '@/hooks/useCategories';
import { Progress } from '@/components/ui/progress';
import { useTournamentForm } from '@/hooks/useTournamentForm';
import { useTranslations } from '@/contexts/TranslationContext';

export default function CreateTournamentPage() {
  const t = useTranslations('tournaments');
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategories();
  const {
    step,
    formData,
    setFormData,
    isSubmitting,
    errors,
    handleFirstStep,
    handleSecondStep,
    handleBack
  } = useTournamentForm();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('create.loadingCategories')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <Header 
          title={t('create.title')}
          icon={<TableIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('create.description')}
        />
        
        <div className="space-y-8 mt-8">
          <div>
            <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('create.stepProgress').replace('{step}', `${step}`)}</span>
              <span>{Math.round((step / 2) * 100)}%</span>
            </div>
            <Progress 
              value={(step / 2) * 100} 
              className="h-2 bg-slate-200 dark:bg-slate-800" 
              indicatorClassName="bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700"
            />
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700">
            {step === 1 ? (
              <TournamentBasicInfo
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={handleFirstStep}
                errors={errors}
              />
            ) : (
              <TournamentDetailInfo
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSecondStep}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                errors={errors}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}