'use client'

import { useState } from 'react'
import { TableIcon } from 'lucide-react'
import Header from '@/components/Header'
import { Progress } from '@/components/ui/progress'
import { FootballLeagueForm } from '@/components/Football/create/FootballLeagueForm'

const STEPS = 2

export default function CreateFootballLeaguePage() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Header
          title="Crear Nueva Liga"
          icon={<TableIcon className="w-6 h-6 text-foreground dark:text-foreground" />}
          description="Configure los detalles de su nueva liga."
        />

        <div className="mt-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Paso {step} de {STEPS}
              </span>
              <span>{Math.round((step / STEPS) * 100)}%</span>
            </div>
            <Progress
              value={(step / STEPS) * 100}
              className="h-2 bg-slate-200 dark:bg-slate-800"
              indicatorClassName="bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700"
            />
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700">
            <FootballLeagueForm step={step} onStepChange={setStep} />
          </div>
        </div>
      </div>
    </div>
  )
}
