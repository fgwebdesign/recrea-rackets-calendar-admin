"use client"

import { ArrowLeft, Users2, Trophy } from "lucide-react"
import type { League } from "@/types/league"
import type { Category } from "@/hooks/useCategories"
import { getCategoryName } from "@/utils/category"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { useTranslations } from '@/contexts/TranslationContext'

interface LeagueHeaderProps {
  league: League
  categories: Category[]
  onBack: () => void
}

export function LeagueHeader({ league, categories, onBack }: LeagueHeaderProps) {
  const t = useTranslations('leagues');
  const tCommon = useTranslations('common');
  const categoryName =
    league.category_id && categories ? getCategoryName(league.category_id, categories) : t('categoryNotSpecified')

  const registeredTeams = league.registeredTeams || 0;
  const registrationProgress = (registeredTeams / league.team_size) * 100;
  const availableSpots = league.team_size - registeredTeams;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Inscribiendo':
        return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300';
      case 'Activa':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'Finalizada':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Inscribiendo':
        return t('status.inscribiendo');
      case 'Activa':
        return t('status.activa');
      case 'Finalizada':
        return t('status.finalizada');
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0E1629] border-b border-gray-200 dark:border-[#1D283A]">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToLeagues')}
        </Button>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Información Principal */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {league.name}
              </h1>
              <Badge 
                variant="outline"
                className={cn(
                  "px-3 py-1 text-sm font-medium",
                  getStatusStyle(league.status)
                )}
              >
                {getStatusText(league.status)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 max-w-md">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('registeredTeams')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {registeredTeams} / {league.team_size}
                  </span>
                </div>
                <Progress value={registrationProgress} className="h-1.5" />
                {availableSpots > 0 && league.status === 'Inscribiendo' && (
                  <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    {availableSpots} {availableSpots === 1 ? t('spotAvailable') : t('spotsAvailable')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card de Categoría */}
          <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10 border-purple-200/70 dark:border-purple-500/20 w-full md:w-64">
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {tCommon('category')}
              </h2>
            </div>
            
            <p className="mt-2 text-xl font-semibold text-purple-700 dark:text-purple-400">
              {categoryName}
            </p>

            <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-700/20">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-purple-500/70 dark:text-purple-400/70" />
                <span className="text-xs text-purple-600/90 dark:text-purple-400/90">
                  {league.team_size} {t('maxTeams')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
