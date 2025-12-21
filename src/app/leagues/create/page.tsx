'use client';

import { useEffect } from 'react';
import { TableIcon } from 'lucide-react';
import Header from '@/components/Header';
import { LeagueBasicInfo } from '@/components/Leagues/create/LeagueBasicInfo';
import { LeagueScheduleInfo } from '@/components/Leagues/create/LeagueScheduleInfo';
import { LeagueScoringInfo } from '@/components/Leagues/create/LeagueScoringInfo';
import { VenueSelector } from '@/components/Leagues/create/VenueSelector';
import { MatchTimesEditor } from '@/components/Leagues/create/MatchTimesEditor';
import { useCategories } from '@/hooks/useCategories';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLeagueForm } from '@/hooks/useLeagueForm';

export default function CreateLeaguePage() {
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategories();
  const {
    step,
    formData,
    setFormData,
    isSubmitting,
    handleFirstStep,
    handleSecondStep,
    handleThirdStep,
    handleBack,
    handleCreateLeague
  } = useLeagueForm();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (isLoadingCategories) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Header 
          title="Crear Nueva Liga"
          icon={<TableIcon className="w-6 h-6 text-foreground dark:text-foreground" />}
          description="Configure los detalles de su nueva liga."
        />
        
        <div className="mt-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Paso {step} de 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <Progress 
              value={(step / 4) * 100} 
              className="h-2 bg-slate-200 dark:bg-slate-800" 
              indicatorClassName="bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700"
            />
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700">
            {step === 1 ? (
              <LeagueBasicInfo
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={handleFirstStep}
              />
            ) : step === 2 ? (
              <LeagueScheduleInfo
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSecondStep}
                onBack={handleBack}
                categories={categories}
              />
            ) : step === 3 ? (
              <div className="p-6">
                <VenueSelector
                  selectedVenues={formData.venues || []}
                  onChange={(venues) => setFormData({ ...formData, venues })}
                />
                <div className="flex justify-between mt-6">
                  <Button onClick={handleBack} variant="outline">
                    ← Atrás
                  </Button>
                  <Button 
                    onClick={() => {
                      if (handleThirdStep()) {
                        // El step se actualiza dentro de handleThirdStep
                      }
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continuar →
                    
                  </Button>
                </div>
              </div>
            ) : step === 4 ? (
              <div className="p-6 space-y-6">
                <MatchTimesEditor
                  matchTimes={formData.match_times || ['21:30', '22:15']}
                  courtsPerSlot={formData.courts_per_time_slot || 2}
                  onTimesChange={(times) => setFormData({ ...formData, match_times: times })}
                  onCourtsChange={(courts) => setFormData({ ...formData, courts_per_time_slot: courts })}
                />
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <h3 className="font-bold mb-4">📊 Resumen de la Liga</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nombre:</strong> {formData.name}</div>
                    <div><strong>Tipo:</strong> {formData.league_type || 'round_robin'}</div>
                    <div><strong>Categorías:</strong> {formData.categories.length}</div>
                    <div><strong>Sedes:</strong> {formData.venues?.length || 0}</div>
                    <div><strong>Canchas:</strong> {formData.venues?.reduce((s, v) => s + v.court_ids.length, 0) || 0}</div>
                    <div><strong>Horarios:</strong> {formData.match_times?.join(', ') || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <Button onClick={handleBack} variant="outline">
                    ← Atrás
                  </Button>
                  <Button 
                    onClick={handleCreateLeague}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creando Liga...' : 'Crear Liga ✓'}
                  </Button>
                </div>
              </div>
            ) : (
              <LeagueScoringInfo
                formData={formData}
                onSubmit={handleCreateLeague}
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