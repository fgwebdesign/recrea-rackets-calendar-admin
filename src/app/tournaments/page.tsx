'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '@/types/tournament'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline'
import { tournamentService } from '@/services/tournamentService'
import Image from 'next/image'

export default function TournamentsPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await tournamentService.getTournaments()
        setTournaments(data)
      } catch (error) {
        console.error('Error fetching tournaments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tournament.category_id === selectedCategory
    const matchesStatus = selectedStatus === 'all' || tournament.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Inscripciones abiertas</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Curso</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Finalizada</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-semibold">Torneos</h1>
            <p className="text-sm text-muted-foreground">
              Administra y visualiza todos los torneos.
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/tournaments/create')}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Crear Torneo
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <Input
          placeholder="Buscar por categoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {/* TODO: Add categories dynamically */}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center space-x-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('all')}
            className="h-8"
          >
            Todos
          </Button>
          <Button
            variant={selectedStatus === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('upcoming')}
            className="h-8"
          >
            Inscripciones abiertas
          </Button>
          <Button
            variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('in_progress')}
            className="h-8"
          >
            En Curso
          </Button>
          <Button
            variant={selectedStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('completed')}
            className="h-8"
          >
            Finalizada
          </Button>
        </div>
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
              onClick={() => router.push(`/tournaments/${tournament.id}`)}
            >
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
                {tournament.tournament_info?.tournament_thumbnail ? (
                  <Image
                    src={tournament.tournament_info.tournament_thumbnail}
                    alt={tournament.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/assets/recrealogo.jpeg"
                      alt="Default tournament image"
                      width={100}
                      height={100}
                      className="opacity-40"
                    />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(tournament.status)}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg">{tournament.name}</h3>
                {tournament.category && (
                  <Badge variant="outline" className="mt-1">
                    {tournament.category.name}
                  </Badge>
                )}
                
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Equipos:</span>
                      <span className="font-medium">
                        {tournament.tournament_teams?.length || 0} / {tournament.max_teams}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Canchas:</span>
                      <span className="font-medium">{tournament.courts_available}</span>
                    </div>
                  </div>
                </div>

                {tournament.status === 'upcoming' && tournament.tournament_teams && (
                  <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(tournament.tournament_teams.length / tournament.max_teams) * 100}%`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-full p-3 mb-4">
            <CalendarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No hay torneos</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'No se encontraron torneos con los filtros seleccionados'
              : 'Comienza creando tu primer torneo'}
          </p>
          {!searchQuery && selectedCategory === 'all' && selectedStatus === 'all' && (
            <Button
              onClick={() => router.push('/tournaments/create')}
              className="mt-4 bg-orange-500 hover:bg-orange-600"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Crear Torneo
            </Button>
          )}
        </div>
      )}
    </div>
  )
}