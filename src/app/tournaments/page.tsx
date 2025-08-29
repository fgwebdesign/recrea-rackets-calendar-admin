'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '@/types/tournament'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { useCategories } from '@/hooks/useCategories'
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
  const { categories, isLoading: isLoadingCategories } = useCategories()

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

  if (loading || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <Header 
          title="Torneos"
          icon={<CalendarIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description="Administra y visualiza todos los torneos."
          button={
            <Button
              onClick={() => router.push('/tournaments/create')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center"
            >
              <PlusIcon className="mr-2 w-5 h-5" />
              Crear Torneo
            </Button>
          }
        />

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-4">
              <Input
                placeholder="Buscar por categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs bg-transparent"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-[180px] bg-transparent">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('all')}
                className={`h-9 ${selectedStatus === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              >
                Todos
              </Button>
              <Button
                variant={selectedStatus === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('upcoming')}
                className={`h-9 ${selectedStatus === 'upcoming' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              >
                Inscripciones abiertas
              </Button>
              <Button
                variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('in_progress')}
                className={`h-9 ${selectedStatus === 'in_progress' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              >
                En Curso
              </Button>
              <Button
                variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('completed')}
                className={`h-9 ${selectedStatus === 'completed' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}`}
              >
                Finalizada
              </Button>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white dark:bg-slate-800/50 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                onClick={() => router.push(`/tournaments/${tournament.id}`)}
              >
                <div className="relative bg-gray-100 dark:bg-slate-700/50 p-4 flex justify-center items-center">
                  {tournament.tournament_info?.tournament_thumbnail ? (
                    <Image
                      src={tournament.tournament_info.tournament_thumbnail}
                      alt={tournament.name}
                      width={120}
                      height={120}
                      className="rounded-lg"
                    />
                  ) : (
                    <Image
                      src="/assets/recrealogo.jpeg"
                      alt="Default tournament image"
                      width={100}
                      height={100}
                      className="opacity-40"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(tournament.status)}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-foreground dark:text-foreground">{tournament.name}</h3>
                    {tournament.category && (
                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        {tournament.category.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Fecha de inicio</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">{new Date(tournament.start_date).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Fecha de fin</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{new Date(tournament.end_date).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Equipos registrados</p>
                        <p className="text-lg font-semibold text-foreground dark:text-foreground">
                          {tournament.tournament_teams?.length || 0} / {tournament.max_teams}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tournament.max_teams - (tournament.tournament_teams?.length || 0)} cupos disponibles
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Canchas</p>
                        <p className="text-lg font-semibold text-center text-foreground dark:text-foreground">{tournament.courts_available}</p>
                      </div>
                    </div>

                    {tournament.status === 'upcoming' && tournament.tournament_teams && (
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-4">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(tournament.tournament_teams.length / tournament.max_teams) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
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
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Crear Torneo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}