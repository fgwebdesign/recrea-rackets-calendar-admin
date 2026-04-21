'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TableIcon, PlusCircle, SearchX, FilterX } from 'lucide-react'
import Header from '@/components/Header'
import { FootballLeagueList } from '@/components/Football/FootballLeagueList'
import { FootballLeagueFilters } from '@/components/Football/FootballLeagueFilters'
import { useFootballLeagues } from '@/hooks/useFootballLeagues'
import { FootballLeague } from '@/types/footballLeague'
import { Button } from '@/components/ui/button'

export default function FootballLeaguesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const { leagues, isLoading, error, refetch } = useFootballLeagues()

  const filteredLeagues = useMemo(() => {
    return leagues.filter((league: FootballLeague) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        if (!league.name.toLowerCase().includes(q)) return false
      }
      if (selectedStatus !== 'Todos' && league.status !== selectedStatus) return false
      return true
    })
  }, [leagues, searchQuery, selectedStatus])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedStatus('Todos')
  }

  const renderEmptyState = () => {
    const hasFilters = searchQuery.trim() || selectedStatus !== 'Todos'

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'Inscribiendo':
          return 'con inscripciones abiertas'
        case 'Activa':
          return 'en curso'
        case 'Finalizada':
          return 'finalizadas'
        default:
          return status.toLowerCase()
      }
    }

    if (hasFilters) {
      return (
        <div className="text-center py-12">
          <SearchX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No se encontraron ligas</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery.trim() && (
              <span>
                No hay ligas que coincidan con &quot;{searchQuery}&quot;
                {selectedStatus !== 'Todos' ? ` que estén ${getStatusMessage(selectedStatus)}` : ''}
              </span>
            )}
            {!searchQuery.trim() && (
              <span>No hay ligas {selectedStatus !== 'Todos' ? `que estén ${getStatusMessage(selectedStatus)}` : ''}</span>
            )}
          </p>
          <Button onClick={resetFilters} variant="outline" className="inline-flex items-center">
            <FilterX className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <TableIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay ligas creadas</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Comienza creando tu primera liga de fútbol</p>
        <Link
          href="/football/leagues/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Crear Liga
        </Link>
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-gray-100">Cargando datos...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </div>
      )
    }

    if (leagues.length === 0 || filteredLeagues.length === 0) {
      return renderEmptyState()
    }

    return <FootballLeagueList leagues={filteredLeagues} />
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <Header
          title="Ligas"
          icon={<TableIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description="Administra y visualiza todas las ligas de fútbol."
          button={
            <Link
              href="/football/leagues/create"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center"
            >
              <PlusCircle className="mr-2" size={20} />
              Crear Liga
            </Link>
          }
        />

        <div className="space-y-8 mt-8">
          <FootballLeagueFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
          />
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
