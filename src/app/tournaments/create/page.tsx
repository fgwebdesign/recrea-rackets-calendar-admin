'use client';

import { useEffect } from 'react';
import { TableIcon } from 'lucide-react';
import Header from '@/components/Header';
import { TournamentBasicInfo } from '@/components/Tournaments/create/TournamentBasicInfo';
import { TournamentDetailInfo } from '@/components/Tournaments/create/TournamentDetailInfo';
import { useCategories } from '@/hooks/useCategories';
import { useCourts } from '@/hooks/useCourts';
import { Progress } from '@/components/ui/progress';
import { useTournamentForm } from '@/hooks/useTournamentForm';

export default function CreateTournamentPage() {
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategories();
  const { courts, isLoading: isLoadingCourts, fetchCourts } = useCourts();
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
    const loadInitialData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchCourts()
      ]);
    };
    
    loadInitialData();
  }, []);

  if (isLoadingCategories || isLoadingCourts) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <Header 
          title="Crear Nuevo Torneo"
          icon={<TableIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description="Configure los detalles de su nuevo torneo."
        />
        
        <div className="space-y-8 mt-8">
          <div>
            <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Paso {step} de 2</span>
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
                courts={courts}
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}