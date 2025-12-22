'use client';

import { 
  BookOpenIcon,
  TrophyIcon,
  TableCellsIcon,
  MapPinIcon,
  TagIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/contexts/TranslationContext';

export default function GuidePage() {
  const t = useTranslations('guide');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <BookOpenIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Requisitos Previos */}
        <section className="mb-12">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                    {t('prerequisites.title')}
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    {t('prerequisites.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                  <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('prerequisites.venues.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('prerequisites.venues.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                  <MapPinIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('prerequisites.courts.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('prerequisites.courts.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                  <TagIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('prerequisites.categories.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('prerequisites.categories.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                  <UsersIcon className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('prerequisites.users.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('prerequisites.users.description')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Crear Liga */}
        <section className="mb-12">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TableCellsIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                    {t('createLeague.title')}
                  </CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-300">
                    {t('createLeague.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('createLeague.step1.title')}</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step1.name')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step1.categories')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step1.description')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step1.image')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step1.cost')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step1.teams')}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="my-6 h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('createLeague.step2.title')}</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step2.startDate')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step2.endDate')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step2.frequency')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step2.playDay')}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="my-6 h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('createLeague.step3.title')}</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <Building2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step3.selectVenues')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <MapPinIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step3.selectCourts')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step3.primaryVenue')}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="my-6 h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('createLeague.step4.title')}</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step4.matchTimes')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <MapPinIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step4.courtsPerTime')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrophyIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step4.leagueType')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRightIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t('createLeague.step4.rounds')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {t('createLeague.tip')}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Crear Torneo */}
        <section className="mb-12">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <TrophyIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-orange-900 dark:text-orange-100">
                    {t('createTournament.title')}
                  </CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    {t('createTournament.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                    {t('createTournament.step1.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('createTournament.step1.description')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                    {t('createTournament.step2.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('createTournament.step2.description')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                    {t('createTournament.step3.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('createTournament.step3.description')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                    {t('createTournament.step4.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('createTournament.step4.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Gestión de Recursos */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('resources.title')}</CardTitle>
              <CardDescription>
                {t('resources.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('resources.venues.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('resources.venues.description')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.venues.contact')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.venues.default')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.venues.status')}</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPinIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('resources.courts.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('resources.courts.description')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.courts.assign')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.courts.photo')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.courts.status')}</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <TagIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('resources.categories.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('resources.categories.description')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.categories.define')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.categories.associate')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.categories.manage')}</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <UsersIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('resources.users.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('resources.users.description')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.users.view')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.users.roles')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{t('resources.users.status')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tips y Mejores Prácticas */}
        <section>
          <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
            <CardHeader>
              <CardTitle className="text-2xl text-indigo-900 dark:text-indigo-100">
                {t('tips.title')}
              </CardTitle>
            </CardHeader>   
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800">
                  <InformationCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tips.planning.title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('tips.planning.description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800">
                  <InformationCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tips.schedules.title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('tips.schedules.description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800">
                  <InformationCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tips.verification.title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('tips.verification.description')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

