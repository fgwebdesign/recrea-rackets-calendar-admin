"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLeague } from "@/hooks/useLeague"
import { useCategories } from "@/hooks/useCategories"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Clock, Filter, ListFilter, CheckCircle, XCircle, Calendar, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LeagueMatchModal } from "@/components/Leagues/LeagueMatchModal"
import { updateMatchResult } from "@/services/leagueService"
import { TeamLabel } from "@/utils/teamLabel"
import { toast } from "@/components/ui/use-toast"
import { formatUruguayDateTime } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { LeagueMatch } from "@/types/league"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function formatMatchDate(dateStr: string, timeSlot?: string) {
  const { date } = formatUruguayDateTime(dateStr);
  return { 
    date, 
    time: timeSlot || formatUruguayDateTime(dateStr).time 
  };
}

export default function LeagueMatchesPage() {
  const params = useParams()
  const router = useRouter()
  const leagueId = params.id as string
  const [matches, setMatches] = useState<LeagueMatch[]>([])
  const [filteredMatches, setFilteredMatches] = useState<LeagueMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<LeagueMatch | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [selectedRound, setSelectedRound] = useState<string>("all")
  const [isGroupACollapsed, setIsGroupACollapsed] = useState(false)
  const [isGroupBCollapsed, setIsGroupBCollapsed] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const matchesPerPage = 5

  const { league, isLoading: isLoadingLeague, error: leagueError } = useLeague(leagueId)
  const { categories, isLoading: isLoadingCategories } = useCategories()

  const fetchMatches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/leagues/matches/league/${leagueId}`
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar los partidos')
      }

      const data = await response.json()
      const allMatches = [...data.completed, ...data.pending].sort((a, b) => 
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      )
      setMatches(allMatches)
      setFilteredMatches(allMatches)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId])

  useEffect(() => {
    let filtered = matches;
    
    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter(match => match.status === statusFilter);
    }
    
    // Filtrar por grupo
    if (groupFilter !== "all") {
      filtered = filtered.filter(match => match.group_name === groupFilter);
    }
    
    setFilteredMatches(filtered);
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  }, [statusFilter, groupFilter, matches])

  const handleMatchClick = (match: LeagueMatch) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedMatch(null)
  }

  const handleSaveResult = async (matchId: string, result: {
    team1_sets1_won: number;
    team2_sets1_won: number;
    team1_sets2_won: number;
    team2_sets2_won: number;
    team1_tie1_won: number;
    team2_tie1_won: number;
    team1_tie2_won: number;
    team2_tie2_won: number;
    team1_tie3_won: number;
    team2_tie3_won: number;
  }) => {
    try {
      setIsUpdating(true)
      await updateMatchResult(matchId, result)
      
      // Actualizar el estado local
      const updatedMatches = matches.map(match =>
        match.id === matchId
          ? {
              ...match,
              ...result,
              status: 'COMPLETED' as const,
            }
          : match
      )
      
      setMatches(updatedMatches)
      toast({
        title: 'Éxito',
        description: 'Resultado guardado correctamente',
        variant: 'default',
        className: 'dark:bg-green-900 dark:text-green-100 dark:border-green-800',
      })
      handleModalClose()
      await fetchMatches() 
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar el resultado',
        variant: 'destructive',
        className: 'dark:bg-red-900 dark:text-red-100 dark:border-red-800',
      })
    } finally {
      setIsUpdating(false)
    }
  }


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Completado</Badge>
      case 'WALKOVER':
        return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">W.O.</Badge>
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Programado</Badge>
      default:
        return null
    }
  }

  const getGroupBadge = (groupName: string | null | undefined) => {
    if (!groupName) return null;
    
    return (
      <Badge className={`${
        groupName === 'A' 
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      } border`}>
        Grupo {groupName}
      </Badge>
    );
  }

  const hasGroups = matches.some(m => m.group_name !== null);

  const getMatchesSummary = () => {
    const completed = matches.filter(match => match.status === 'COMPLETED').length
    const scheduled = matches.filter(match => match.status === 'SCHEDULED').length
    const walkover = matches.filter(match => match.status === 'WALKOVER').length
    return { completed, scheduled, walkover }
  }

  // Pagination handlers
  const startIndex = (currentPage - 1) * matchesPerPage
  const endIndex = startIndex + matchesPerPage
  const currentMatches = filteredMatches.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center">
        <Card className="w-[300px] bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando partidos de la liga...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xl text-center text-gray-900 dark:text-white">{error}</p>
              <button
                onClick={() => router.push("/leagues")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Volver a Ligas
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingLeague || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center">
        <Card className="w-[300px] bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando información de la liga...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (leagueError || !league) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex justify-center items-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-[#0E1629] border-gray-200 dark:border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xl text-center text-gray-900 dark:text-white">
                No se pudo cargar la información de la liga
              </p>
              <button
                onClick={() => router.push("/leagues")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Volver a Ligas
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { completed, scheduled, walkover } = getMatchesSummary()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-6">
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 p-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/leagues/${params.id}`)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a la liga
                </Button>
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {league.name}
                    </h1>
                    <Badge variant="secondary" className="text-sm font-medium bg-primary/10 text-primary hover:bg-primary/15">
                      {categories.find(category => category.id === league.category_id)?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gestión de partidos y resultados
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">{completed} Completados</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Partidos finalizados</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">{scheduled} Programados</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Partidos pendientes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Fecha {matches[0]?.match_number || '-'}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Ronda actual</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Lista de Partidos</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gestiona los resultados de cada partido
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Stats and Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">{completed} Completados</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{scheduled} Programados</span>
                    </div>
                    {walkover > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">{walkover} W.O.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {hasGroups && (
                      <Select
                        value={groupFilter}
                        onValueChange={setGroupFilter}
                      >
                        <SelectTrigger className="w-[150px] bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border-purple-200 dark:border-purple-800/30">
                          <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4" />
                            <SelectValue placeholder="Filtrar por grupo" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grupos</SelectItem>
                          <SelectItem value="A">Grupo A</SelectItem>
                          <SelectItem value="B">Grupo B</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[180px] bg-primary/10 hover:bg-primary/20 transition-colors border-primary/20">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          <SelectValue placeholder="Filtrar por estado" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="COMPLETED">Completados</SelectItem>
                        <SelectItem value="SCHEDULED">Programados</SelectItem>
                        <SelectItem value="WALKOVER">W.O.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" className="w-full" value={selectedRound} onValueChange={setSelectedRound}>
                  <TabsList className="w-full h-auto p-1 bg-background/50 dark:bg-background/10 border-b border-border">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-2 transition-colors"
                    >
                      Todas las fechas
                    </TabsTrigger>
                    {Array.from(new Set(matches.map(match => match.match_number))).sort((a, b) => a - b).map((round) => (
                      <TabsTrigger 
                        key={round} 
                        value={round.toString()}
                        className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none px-6 py-2 transition-colors"
                      >
                        Fecha {round}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    {hasGroups && groupFilter === "all" ? (
                      <div className="space-y-8">
                        {/* Grupo A */}
                        {currentMatches.filter(m => m.group_name === 'A').length > 0 && (
                          <div className="space-y-4">
                            <button 
                              onClick={() => setIsGroupACollapsed(!isGroupACollapsed)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 dark:bg-blue-600">
                                <span className="text-white font-bold text-lg">A</span>
                              </div>
                              <div className="flex-1 text-left">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Grupo A</h3>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  {currentMatches.filter(m => m.group_name === 'A' && m.status === 'COMPLETED').length} de {currentMatches.filter(m => m.group_name === 'A').length} completados
                                </p>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${isGroupACollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {!isGroupACollapsed && (
                              <div className="grid gap-4">
                              {currentMatches.filter(m => m.group_name === 'A').map((match) => {
                                const { date, time } = formatMatchDate(match.match_date, match.time_slot);
                                return (
                                  <Card key={match.id} className="overflow-hidden bg-white dark:bg-gray-800/50 border-blue-200 dark:border-blue-800/50">
                                    <div className="p-6">
                                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {getStatusBadge(match.status)}
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                              <span className="text-sm text-gray-500 dark:text-gray-400">{match.court_name || 'Sin asignar'}</span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                            <div className="text-right md:text-left">
                                              <TeamLabel label={match.team1} />
                                              {match.status === 'COMPLETED' && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{match.team1_sets1_won + match.team1_sets2_won} sets</p>
                                              )}
                                            </div>
                                            <div className="flex justify-center">
                                              <Button
                                                variant={match.status === 'COMPLETED' ? 'outline' : 'default'}
                                                onClick={() => handleMatchClick(match)}
                                                disabled={isUpdating}
                                                className={match.status === 'COMPLETED' 
                                                  ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0' 
                                                  : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'}
                                              >
                                                {match.status === 'COMPLETED' ? 'Ver resultado' : 'Gestionar partido'}
                                              </Button>
                                            </div>
                                            <div className="text-left md:text-right">
                                              <TeamLabel label={match.team2} />
                                              {match.status === 'COMPLETED' && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{match.team2_sets1_won + match.team2_sets2_won} sets</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grupo B */}
                        {currentMatches.filter(m => m.group_name === 'B').length > 0 && (
                          <div className="space-y-4">
                            <button 
                              onClick={() => setIsGroupBCollapsed(!isGroupBCollapsed)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 dark:bg-purple-600">
                                <span className="text-white font-bold text-lg">B</span>
                              </div>
                              <div className="flex-1 text-left">
                                <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-lg">Grupo B</h3>
                                <p className="text-sm text-purple-600 dark:text-purple-400">
                                  {currentMatches.filter(m => m.group_name === 'B' && m.status === 'COMPLETED').length} de {currentMatches.filter(m => m.group_name === 'B').length} completados
                                </p>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${isGroupBCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {!isGroupBCollapsed && (
                              <div className="grid gap-4">
                              {currentMatches.filter(m => m.group_name === 'B').map((match) => {
                                const { date, time } = formatMatchDate(match.match_date, match.time_slot);
                                return (
                                  <Card key={match.id} className="overflow-hidden bg-white dark:bg-gray-800/50 border-purple-200 dark:border-purple-800/50">
                                    <div className="p-6">
                                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {getStatusBadge(match.status)}
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                              <span className="text-sm text-gray-500 dark:text-gray-400">{match.court_name || 'Sin asignar'}</span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                            <div className="text-right md:text-left">
                                              <TeamLabel label={match.team1} />
                                              {match.status === 'COMPLETED' && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{match.team1_sets1_won + match.team1_sets2_won} sets</p>
                                              )}
                                            </div>
                                            <div className="flex justify-center">
                                              <Button
                                                variant={match.status === 'COMPLETED' ? 'outline' : 'default'}
                                                onClick={() => handleMatchClick(match)}
                                                disabled={isUpdating}
                                                className={match.status === 'COMPLETED' 
                                                  ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0' 
                                                  : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'}
                                              >
                                                {match.status === 'COMPLETED' ? 'Ver resultado' : 'Gestionar partido'}
                                              </Button>
                                            </div>
                                            <div className="text-left md:text-right">
                                              <TeamLabel label={match.team2} />
                                              {match.status === 'COMPLETED' && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{match.team2_sets1_won + match.team2_sets2_won} sets</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {currentMatches.map((match) => {
                          const { date, time } = formatMatchDate(match.match_date, match.time_slot);
                          return (
                            <Card key={match.id} className="overflow-hidden bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                              <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      {getStatusBadge(match.status)}
                                      {getGroupBadge(match.group_name)}
                                      <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{match.court_name || 'Sin asignar'}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                      <div className="text-right md:text-left">
                                        <TeamLabel label={match.team1} />
                                        {match.status === 'COMPLETED' && (
                                          <p className="text-sm text-gray-500 dark:text-gray-400">{match.team1_sets1_won + match.team1_sets2_won} sets</p>
                                        )}
                                      </div>
                                      <div className="flex justify-center">
                                        <Button
                                          variant={match.status === 'COMPLETED' ? 'outline' : 'default'}
                                          onClick={() => handleMatchClick(match)}
                                          disabled={isUpdating}
                                          className={match.status === 'COMPLETED' 
                                            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0' 
                                            : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'}
                                        >
                                          {match.status === 'COMPLETED' ? 'Ver resultado' : 'Gestionar partido'}
                                        </Button>
                                      </div>
                                      <div className="text-left md:text-right">
                                        <TeamLabel label={match.team2} />
                                        {match.status === 'COMPLETED' && (
                                          <p className="text-sm text-gray-500 dark:text-gray-400">{match.team2_sets1_won + match.team2_sets2_won} sets</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {Array.from(new Set(matches.map(match => match.match_number))).sort((a, b) => a - b).map((round) => {
                    const roundMatches = matches.filter(match => 
                      match.match_number === round && 
                      (statusFilter === 'all' || match.status === statusFilter) &&
                      (groupFilter === 'all' || match.group_name === groupFilter)
                    );
                    
                    return (
                      <TabsContent key={round} value={round.toString()} className="mt-6">
                        {hasGroups && groupFilter === "all" ? (
                          <div className="space-y-8">
                            {/* Grupo A */}
                            {roundMatches.filter(m => m.group_name === 'A').length > 0 && (
                              <div className="space-y-4">
                                <button 
                                  onClick={() => setIsGroupACollapsed(!isGroupACollapsed)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                >
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 dark:bg-blue-600">
                                    <span className="text-white font-bold text-lg">A</span>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Grupo A</h3>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                      {roundMatches.filter(m => m.group_name === 'A' && m.status === 'COMPLETED').length} de {roundMatches.filter(m => m.group_name === 'A').length} completados
                                    </p>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${isGroupACollapsed ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {!isGroupACollapsed && (
                                  <div className="grid gap-4">
                                  {roundMatches.filter(m => m.group_name === 'A').map((match) => {
                                    const { date, time } = formatMatchDate(match.match_date, match.time_slot);
                                    return (
                                      <Card key={match.id} className="overflow-hidden bg-white dark:bg-gray-800/50 border-blue-200 dark:border-blue-800/50">
                                        <div className="p-6">
                                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {getStatusBadge(match.status)}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                  <span className="text-sm text-gray-500 dark:text-gray-400">{match.court_name || 'Sin asignar'}</span>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div className="text-right md:text-left">
                                                  <TeamLabel label={match.team1} />
                                                  {match.status === 'COMPLETED' && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{match.team1_sets1_won + match.team1_sets2_won} sets</p>
                                                  )}
                                                </div>
                                                <div className="flex justify-center">
                                                  <Button
                                                    variant={match.status === 'COMPLETED' ? 'outline' : 'default'}
                                                    onClick={() => handleMatchClick(match)}
                                                    disabled={isUpdating}
                                                    className={match.status === 'COMPLETED' 
                                                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0' 
                                                      : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'}
                                                  >
                                                    {match.status === 'COMPLETED' ? 'Ver resultado' : 'Gestionar partido'}
                                                  </Button>
                                                </div>
                                                <div className="text-left md:text-right">
                                                  <TeamLabel label={match.team2} />
                                                  {match.status === 'COMPLETED' && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{match.team2_sets1_won + match.team2_sets2_won} sets</p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    );
                                  })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Grupo B */}
                            {roundMatches.filter(m => m.group_name === 'B').length > 0 && (
                              <div className="space-y-4">
                                <button 
                                  onClick={() => setIsGroupBCollapsed(!isGroupBCollapsed)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                                >
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 dark:bg-purple-600">
                                    <span className="text-white font-bold text-lg">B</span>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-lg">Grupo B</h3>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                      {roundMatches.filter(m => m.group_name === 'B' && m.status === 'COMPLETED').length} de {roundMatches.filter(m => m.group_name === 'B').length} completados
                                    </p>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${isGroupBCollapsed ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {!isGroupBCollapsed && (
                                  <div className="grid gap-4">
                                  {roundMatches.filter(m => m.group_name === 'B').map((match) => {
                                    const { date, time } = formatMatchDate(match.match_date, match.time_slot);
                                    return (
                                      <Card key={match.id} className="overflow-hidden bg-white dark:bg-gray-800/50 border-purple-200 dark:border-purple-800/50">
                                        <div className="p-6">
                                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {getStatusBadge(match.status)}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                  <span className="text-sm text-gray-500 dark:text-gray-400">{match.court_name || 'Sin asignar'}</span>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div className="text-right md:text-left">
                                                  <TeamLabel label={match.team1} />
                                                  {match.status === 'COMPLETED' && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{match.team1_sets1_won + match.team1_sets2_won} sets</p>
                                                  )}
                                                </div>
                                                <div className="flex justify-center">
                                                  <Button
                                                    variant={match.status === 'COMPLETED' ? 'outline' : 'default'}
                                                    onClick={() => handleMatchClick(match)}
                                                    disabled={isUpdating}
                                                    className={match.status === 'COMPLETED' 
                                                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0' 
                                                      : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'}
                                                  >
                                                    {match.status === 'COMPLETED' ? 'Ver resultado' : 'Gestionar partido'}
                                                  </Button>
                                                </div>
                                                <div className="text-left md:text-right">
                                                  <TeamLabel label={match.team2} />
                                                  {match.status === 'COMPLETED' && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{match.team2_sets1_won + match.team2_sets2_won} sets</p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    );
                                  })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {roundMatches.map((match) => {
                              const { date, time } = formatMatchDate(match.match_date, match.time_slot);
                              return (
                                <Card key={match.id} className="overflow-hidden bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                  <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                          {getStatusBadge(match.status)}
                                          {getGroupBadge(match.group_name)}
                                          <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
                                          <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{match.court_name || 'Sin asignar'}</span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                          <div className="text-right md:text-left">
                                            <TeamLabel label={match.team1} />
                                            {match.status === 'COMPLETED' && (
                                              <p className="text-sm text-gray-500 dark:text-gray-400">{match.team1_sets1_won + match.team1_sets2_won} sets</p>
                                            )}
                                          </div>
                                          <div className="flex justify-center">
                                            <Button
                                              variant={match.status === 'COMPLETED' ? 'outline' : 'default'}
                                              onClick={() => handleMatchClick(match)}
                                              disabled={isUpdating}
                                              className={match.status === 'COMPLETED' 
                                                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0' 
                                                : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'}
                                            >
                                              {match.status === 'COMPLETED' ? 'Ver resultado' : 'Gestionar partido'}
                                            </Button>
                                          </div>
                                          <div className="text-left md:text-right">
                                            <TeamLabel label={match.team2} />
                                            {match.status === 'COMPLETED' && (
                                              <p className="text-sm text-gray-500 dark:text-gray-400">{match.team2_sets1_won + match.team2_sets2_won} sets</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedMatch && (
          <LeagueMatchModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            match={selectedMatch}
            onSubmit={handleSaveResult}
            isLoading={isUpdating}
          />
        )}
      </div>
    </div>
  )
} 