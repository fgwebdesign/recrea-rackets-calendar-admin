'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FootballLeagueFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
}

const STATUS = ['Todos', 'Inscribiendo', 'Activa', 'Finalizada'] as const

export function FootballLeagueFilters({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus
}: FootballLeagueFiltersProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Inscribiendo':
        return 'Inscripciones abiertas'
      case 'Activa':
        return 'En Curso'
      case 'Finalizada':
        return 'Finalizada'
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center md:justify-between">
      <div className="flex-1">
        <Input
          placeholder="Buscar por nombre de liga..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS.map((statusValue) => (
          <Button
            key={statusValue}
            variant={selectedStatus === statusValue ? 'default' : 'outline'}
            onClick={() => setSelectedStatus(statusValue)}
            className={`whitespace-nowrap ${
              statusValue === 'Inscribiendo'
                ? 'text-emerald-700 dark:text-emerald-300'
                : statusValue === 'Activa'
                  ? 'text-blue-700 dark:text-blue-300'
                  : ''
            }`}
          >
            {getStatusLabel(statusValue)}
          </Button>
        ))}
      </div>
    </div>
  )
}
