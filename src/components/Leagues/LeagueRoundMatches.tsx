"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, AlertCircle } from "lucide-react"
import type { LeagueMatch } from "@/types/league"
import { LeagueMatchModal } from "./LeagueMatchModal"
import { updateMatchResult } from "@/services/leagueService"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useTranslations } from '@/contexts/TranslationContext';

interface LeagueRoundMatchesProps {
  matches: LeagueMatch[]
  roundNumber: number
  totalRounds: number
  onMatchUpdate: (updatedMatch: LeagueMatch) => void
}

export function LeagueRoundMatches({ matches, roundNumber, totalRounds, onMatchUpdate }: LeagueRoundMatchesProps) {
  const t = useTranslations('emptyStates');
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

  const handleSaveResult = async (matchId: string, result: any) => {
    try {
      setIsLoading(true)
      
      const backendResult = {
        home_sets: result.score.set1.team1 + (result.score.set2.team1 === result.score.set1.team1 ? 1 : 0),
        away_sets: result.score.set1.team2 + (result.score.set2.team2 === result.score.set1.team2 ? 1 : 0)
      }

      await updateMatchResult(matchId, backendResult)

      const updatedMatch = {
        ...selectedMatch!,
        score: result.score,
        status: "COMPLETED" as const,
        winner_league_team_id: result.winner_id,
        team1_sets_won: backendResult.home_sets,
        team2_sets_won: backendResult.away_sets
      }

      onMatchUpdate(updatedMatch)
      toast({
        title: "Éxito",
        description: "El resultado se ha guardado correctamente",
      })
      handleModalClose()
    } catch (error) {
      console.error("Error al guardar el resultado:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el resultado. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMatchStatusBadge = (match: LeagueMatch) => {
    switch (match.status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 shadow-[0_2px_10px] shadow-green-100 dark:shadow-green-500/20">
            Completado
          </Badge>
        )
      case "WALKOVER":
        return (
          <Badge variant="default" className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 shadow-[0_2px_10px] shadow-red-100 dark:shadow-red-500/20">
            W.O.
          </Badge>
        )
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 shadow-[0_2px_10px] shadow-yellow-100 dark:shadow-yellow-500/20">
            Pendiente
          </Badge>
        )
      default:
        return null
    }
  }

  if (matches.length === 0) {
    return (
      <Card className="border-gray-200 dark:border-[#1D283A] bg-white dark:bg-[#1D283A]/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 dark:bg-[#0E1629] p-4 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noMatches')}</h3>
            <p className="text-gray-600 dark:text-gray-400">No se encontraron partidos para esta fecha.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="border-purple-200 dark:border-purple-500/20 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-[0_2px_10px] shadow-purple-100 dark:shadow-purple-500/20">
          {matches.filter(m => m.status === "COMPLETED").length} de {matches.length} completados
        </Badge>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => (
          <Card key={match.id} className={cn(
            "border-gray-200 dark:border-[#1D283A] transition-all duration-200",
            match.status === "COMPLETED" 
              ? "bg-white dark:bg-[#1D283A]/30" 
              : "bg-white dark:bg-[#1D283A]/30 hover:bg-gray-50 dark:hover:bg-[#1D283A]/50"
          )}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-4 items-center">
                <div className="col-span-3">
                  <div className="flex flex-col items-end md:items-start">
                    <p className="font-medium text-gray-900 dark:text-white">{match.team1}</p>
                  </div>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center">
                  {match.status === "COMPLETED" ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 bg-[#0B1120] rounded-xl p-3 min-w-[120px] justify-center shadow-lg">
                        <div className="flex gap-2">
                          {[6, 6].map((score, idx) => (
                            <div 
                              key={idx}
                              className="w-10 h-12 flex items-center justify-center bg-[#1D283A] rounded-lg text-emerald-400 font-mono text-3xl font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-emerald-500/20"
                              style={{ 
                                fontFamily: 'JetBrains Mono, monospace',
                                textShadow: '0 0 10px rgba(52,211,153,0.3)'
                              }}
                            >
                              {score}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-emerald-500/80 dark:text-emerald-400/80 font-mono uppercase tracking-widest">
                        Sets
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMatchClick(match)}
                      disabled={isLoading || match.status === "WALKOVER"}
                      className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border border-purple-400/20 shadow-[0_4px_10px] shadow-purple-200 dark:shadow-purple-500/30 hover:shadow-[0_8px_15px] hover:shadow-purple-300 dark:hover:shadow-purple-500/30 hover:translate-y-[-2px] transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Cargar resultado
                    </Button>
                  )}
                </div>

                <div className="col-span-3">
                  <div className="flex flex-col items-start md:items-end">
                    <p className="font-medium text-gray-900 dark:text-white">{match.team2}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#1D283A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {getMatchStatusBadge(match)}

                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(match.match_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMatch && (
        <LeagueMatchModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          match={selectedMatch}
          onSubmit={handleSaveResult}
          isLoading={isLoading}
        />
      )}
    </div>
  )
} 