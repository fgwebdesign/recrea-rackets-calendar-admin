'use client';

import { useEffect, useState } from 'react';
import { TableIcon, PlusCircle, SearchX, FilterX } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { LeagueList } from '@/components/Leagues/LeagueList';
import { LeagueFilters } from '@/components/Leagues/LeagueFilters';
import { League } from '@/types/league';
import { useCategories } from '@/hooks/useCategories';
import { useLeagues } from '@/hooks/useLeagues';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/contexts/TranslationContext';

export default function LeaguesPage() {
  const t = useTranslations('leagues');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { leagues, isLoading: isLoadingLeagues } = useLeagues();
  
  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Inscribiendo': t('status.inscribiendo'),
      'Activa': t('status.activa'),
      'Finalizada': t('status.finalizada')
    };
    return statusMap[status] || status;
  };

  const filteredLeagues = leagues
    .filter(league => {
      // Filter by search query (now searching by category)
      if (searchQuery.trim()) {
        const categoryName = categories.find(cat => cat.id === league.category_id)?.name || '';
        return categoryName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    })
    .filter(league => {
      // Filter by category dropdown
      if (selectedCategory && selectedCategory !== 'all') {
        return league.category_id === selectedCategory;
      }
      return true;
    })
    .filter(league => {
      // Filter by status
      if (selectedStatus !== 'Todos') {
        return league.status === selectedStatus;
      }
      return true;
    });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('Todos');
  };

  const renderEmptyState = () => {
    const hasFilters = searchQuery.trim() || selectedCategory !== 'all' || selectedStatus !== 'Todos';
    const selectedCategoryName = categories?.find(cat => cat.id === selectedCategory)?.name;

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'Inscribiendo':
          return t('withOpenRegistrations');
        case 'Activa':
          return t('inProgress');
        case 'Finalizada':
          return t('finished');
        default:
          return status.toLowerCase();
      }
    };

    if (hasFilters) {
      return (
        <div className="text-center py-12">
          <SearchX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('noLeaguesFound')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery.trim() && (
              <span>{t('noLeaguesInCategory')} "{searchQuery}"{selectedCategoryName ? ` ${t('inCategory')} ${selectedCategoryName}` : ''}{selectedStatus !== 'Todos' ? ` ${t('withStatus')} ${getStatusMessage(selectedStatus)}` : ''}</span>
            )}
            {!searchQuery.trim() && (
              <span>
                {t('noLeaguesFoundDescription')} {selectedCategoryName ? `${t('inCategory')} ${selectedCategoryName}` : ''}{selectedStatus !== 'Todos' ? ` ${t('withStatus')} ${getStatusMessage(selectedStatus)}` : ''}
              </span>
            )}
          </p>
          <Button
            onClick={resetFilters}
            variant="outline"
            className="inline-flex items-center font-bold"
          >
            <FilterX className="w-4 h-4 mr-2" />
            {t('clearFilters')}
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <TableIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('noLeagues')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t('noLeaguesDescription')}
        </p>
        <Link 
          href="/leagues/create" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('createLeague')}
        </Link>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoadingLeagues || isLoadingCategories) {
      return (
          <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">{t('loadingData')}</p>
        </div>
      );
    }

    if (leagues.length === 0 || filteredLeagues.length === 0) {
      return renderEmptyState();
    }

    return <LeagueList leagues={filteredLeagues} categories={categories} />;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <Header 
          title={t('title')}
          icon={<TableIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('description')}
          button={
            <Link 
              href="/leagues/create" 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center font-bold"
            >
              <PlusCircle className="mr-2" size={20} />
              {t('createLeague')}
            </Link>
          }
        />
        
        <div className="space-y-8 mt-8">
          <LeagueFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            categories={categories}
          />
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 