'use client';

import { useEffect } from 'react';
import { TableIcon, CalendarDays, Users, Clock, Trophy, Coins, Building2, CheckCircle2 } from 'lucide-react';
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
import { useTranslations } from '@/contexts/TranslationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CreateLeaguePage() {
  const t = useTranslations('leagues');
  const tCommon = useTranslations('common');
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingCategories')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Header 
          title={t('createNewLeague')}
          icon={<TableIcon className="w-6 h-6 text-foreground dark:text-foreground" />}
          description={t('createNewLeagueDescription')}
        />
        
        <div className="mt-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('step')} {step} {t('of')} 4</span>
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
                  <Button onClick={handleBack} variant="outline" className="font-bold">
                    ← {t('back')}
                  </Button>
                  <Button 
                    onClick={() => {
                      if (handleThirdStep()) {
                        // El step se actualiza dentro de handleThirdStep
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 font-bold"
                  >
                    {tCommon('next')} →
                    
                  </Button>
                </div>
              </div>
            ) : step === 4 ? (
              <div className="p-6 space-y-6">
                <MatchTimesEditor
                  matchTimes={formData.match_times || ['21:00', '22:00']}
                  courtsPerSlot={formData.courts_per_time_slot || 2}
                  maxCourts={formData.venues?.reduce((s, v) => s + (v.court_ids?.length || 0), 0) || formData.courts_available || 1}
                  onTimesChange={(times) => setFormData({ ...formData, match_times: times })}
                  onCourtsChange={(courts) => setFormData({ ...formData, courts_per_time_slot: courts })}
                />
                
                {/* Resumen Completo de la Liga */}
                <div className="mt-8 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{formData.name || 'Nueva Liga'}</h3>
                        <p className="text-emerald-100 text-sm">{formData.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="p-6 bg-white dark:bg-slate-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Información General */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <TableIcon className="w-4 h-4 text-emerald-500" />
                          Información General
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Tipo</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formData.league_type === 'round_robin' ? 'Round Robin' : formData.league_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Formato</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formData.rounds === 2 ? 'Ida y Vuelta' : 'Solo Ida'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Equipos/categoría</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{formData.team_size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Jornadas</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {(formData.team_size - 1) * (formData.rounds || 1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Categorías */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          Categorías ({formData.categories.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {categories
                            .filter(cat => formData.categories.includes(cat.id))
                            .map(cat => (
                              <span 
                                key={cat.id}
                                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                              >
                                {cat.name}
                              </span>
                            ))
                          }
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Días asignados: {Object.keys(formData.category_days || {}).length} de {formData.categories.length}
                        </div>
                      </div>

                      {/* Fechas */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <CalendarDays className="w-4 h-4 text-purple-500" />
                          Calendario
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Inicio</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formData.start_date ? format(new Date(formData.start_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Fin</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formData.end_date ? format(new Date(formData.end_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Frecuencia</span>
                            <span className="font-medium capitalize text-slate-800 dark:text-slate-200">{formData.frequency}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sedes y Canchas */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <Building2 className="w-4 h-4 text-orange-500" />
                          Sedes y Canchas
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Sedes</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{formData.venues?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Total canchas</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formData.venues?.reduce((s, v) => s + (v.court_ids?.length || 0), 0) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Canchas/horario</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formData.courts_per_time_slot || 2}</span>
                          </div>
                        </div>
                      </div>

                      {/* Horarios */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          Horarios de Partidos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(formData.match_times || []).length > 0 ? (
                            formData.match_times?.map((time, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-mono font-bold"
                              >
                                {time}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">Sin horarios definidos</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {(formData.match_times?.length || 0) * (formData.courts_per_time_slot || 2)} partidos simultáneos máximo
                        </div>
                      </div>

                      {/* Sistema de Puntos */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <Coins className="w-4 h-4 text-amber-500" />
                          Sistema de Puntos
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">Victoria</span>
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                              +{formData.points_for_win} pts
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">Derrota c/set</span>
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-bold">
                              +{formData.points_for_loss_with_set} pt
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">Derrota</span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold">
                              +{formData.points_for_loss} pts
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">Walkover</span>
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-bold">
                              +{formData.points_for_walkover} pts
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Inscripción */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Coins className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                          <div>
                            <p className="text-sm text-amber-700 dark:text-amber-300">Costo de inscripción</p>
                            <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                              ${formData.inscription_cost?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-amber-700 dark:text-amber-300">Estado inicial</p>
                          <span className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full text-sm font-semibold">
                            {formData.status || 'Inscribiendo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${formData.name ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        Nombre
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${formData.categories.length >= 3 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        Categorías (mín. 3)
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${formData.venues && formData.venues.length > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        Sedes
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${formData.match_times && formData.match_times.length > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        Horarios
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${Object.keys(formData.category_days || {}).length === formData.categories.length ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        Días asignados
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button onClick={handleBack} variant="outline" className="font-bold">
                    ← {t('back')}
                  </Button>
                  <Button 
                    onClick={handleCreateLeague}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-8 shadow-lg shadow-emerald-500/25"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando Liga...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Crear Liga
                      </>
                    )}
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