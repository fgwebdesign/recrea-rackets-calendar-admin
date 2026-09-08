"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { LeagueMatch } from "@/types/league"
import { LeagueMatchModal } from "./LeagueMatchModal"
import { updateMatchResult, updateMatchSchedule } from "@/services/leagueService"
import { toast } from "@/components/ui/use-toast"
import { Trophy, Calendar, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatUruguayDateTime } from "@/lib/utils";
import { TeamLabel } from "@/utils/teamLabel";

interface MatchResult {
  team1_sets1_won: number;
  team2_sets1_won: number;
  team1_sets2_won: number;
  team2_sets2_won: number;
  team1_tie1_won?: number;
  team2_tie1_won?: number;
  team1_tie2_won?: number;
  team2_tie2_won?: number;
  team1_tie3_won?: number;
  team2_tie3_won?: number;
}

interface MatchSchedule {
  date: string;
  time: string;
  court_id?: string;
}

interface LeagueMatchResultsProps {
  matches: LeagueMatch[]
  onSaveResults: (results: LeagueMatch[]) => void
}

export function LeagueMatchResults({ matches, onSaveResults }: LeagueMatchResultsProps) {
  const [selectedMatch, setSelectedMatch] = useState<LeagueMatch | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMatchClick = (match: LeagueMatch) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedMatch(null)
  }

  const handleSaveResult = async (matchId: string, result: MatchResult) => {
    try {
      console.log('Enviando resultado al backend:', {
        matchId,
        result,
        url: `${process.env.NEXT_PUBLIC_API_URL}/leagues/match/result/${matchId}`
      });
      
      setIsLoading(true)
      await updateMatchResult(matchId, result)

      // Actualizar la UI
      const updatedMatches = matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              team1_sets1_won: result.team1_sets1_won,
              team2_sets1_won: result.team2_sets1_won,
              team1_sets2_won: result.team1_sets2_won,
              team2_sets2_won: result.team2_sets2_won,
              status: "COMPLETED" as const,
            }
          : match,
      )
      
      onSaveResults(updatedMatches)
      toast({
        title: "✅ Éxito",
        description: "El resultado se ha guardado correctamente",
        className: "border-l-4 border-green-500",
      })
      handleModalClose()
    } catch (error) {
      console.error("Error al guardar el resultado:", error)
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el resultado. Por favor, intente nuevamente.",
        variant: "destructive",
        className: "border-l-4 border-red-500",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSchedule = async (matchId: string, schedule: MatchSchedule) => {
    try {
      setIsLoading(true)
      await updateMatchSchedule(matchId, schedule)

      // Actualizar la UI
      const updatedMatches = matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              match_date: `${schedule.date}T${schedule.time}`,
            }
          : match,
      )
      
      onSaveResults(updatedMatches)
      toast({
        title: "✅ Éxito",
        description: "El horario se ha actualizado correctamente",
        className: "border-l-4 border-green-500",
      })
      handleModalClose()
    } catch (error) {
      console.error("Error al actualizar el horario:", error)
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar el horario. Por favor, intente nuevamente.",
        variant: "destructive",
        className: "border-l-4 border-red-500",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMatchStatusText = (match: LeagueMatch) => {
    switch (match.status) {
      case "COMPLETED":
        return "Ver Resultado"
      case "WALKOVER":
        return "W.O."
      case "SCHEDULED":
      default:
        return "Gestionar Partido"
    }
  }

  const getMatchStatusBadge = (match: LeagueMatch) => {
    switch (match.status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Completado
          </Badge>
        )
      case "WALKOVER":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            W.O.
          </Badge>
        )
      case "SCHEDULED":
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Programado
          </Badge>
        )
    }
  }

  const isMatchEditable = (match: LeagueMatch) => {
    return match.status === "SCHEDULED"
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Partidos y Resultados</h3>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    {matches.filter(m => m.status === "COMPLETED").length} completados
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Partidos con resultado registrado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {matches.filter(m => m.status === "SCHEDULED").length} pendientes
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Partidos programados sin resultado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    {matches.filter(m => m.status === "WALKOVER").length} W.O.
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Partidos con W.O. (Walk Over)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">No hay partidos programados para esta fecha</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Los partidos aparecerán aquí cuando estén programados</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => {
            const { date, time } = formatUruguayDateTime(match.match_date);
            return (
              <div
                key={match.id}
                className={cn(
                  "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border transition-all duration-200",
                  match.status === "COMPLETED" 
                    ? "border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700" 
                    : match.status === "WALKOVER" 
                    ? "border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                )}
              >
                <div className="grid grid-cols-7 gap-4 items-center">
                  <div className="col-span-3 min-w-0 text-right md:text-left">
                    <TeamLabel label={match.team1} />
                    {match.status === "COMPLETED" && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {match.team1_sets1_won + match.team1_sets2_won} sets
                      </p>
                    )}
                    {match.status === "WALKOVER" && match.walkover_team_id === match.league_team1_id && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-1">W.O.</p>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {match.status === "COMPLETED" || match.status === "WALKOVER" ? (
                      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 w-full">
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200">VS</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMatchClick(match)}
                        disabled={isLoading || !isMatchEditable(match)}
                        className={cn(
                          "w-full transition-all duration-200 dark:text-white",
                          isMatchEditable(match)
                            ? "bg-purple-500 hover:bg-purple-600 text-white border-none shadow hover:shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                        )}
                      >
                        {isLoading ? "Guardando..." : getMatchStatusText(match)}
                      </Button>
                    )}
                  </div>

                  <div className="col-span-3 min-w-0 text-left md:text-right">
                    <TeamLabel label={match.team2} />
                    {match.status === "COMPLETED" && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {match.team2_sets1_won + match.team2_sets2_won} sets
                      </p>
                    )}
                    {match.status === "WALKOVER" && match.walkover_team_id === match.league_team2_id && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-1">W.O.</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {getMatchStatusBadge(match)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {date} {time}
                    </span>
                    {match.court && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        {match.court.name}
                      </Badge>
                    )}
                    {match.court && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        {match.court.name}
                      </Badge>
                    )}
                    {(match.status === "COMPLETED" || match.status === "WALKOVER") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMatchClick(match)}
                        disabled={isLoading}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
                      >
                        Ver detalles
                      </Button>
                    )}
                  </div>

                  
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedMatch && (
        <LeagueMatchModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          match={selectedMatch}
          onSubmit={handleSaveResult}
          onScheduleUpdate={handleSaveSchedule}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
