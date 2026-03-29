'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { RescheduleRequestsPanel } from '@/components/Tournaments/admin/RescheduleRequestsPanel'
import type { Franja } from '@/services/tournamentSchedulingService'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function RescheduleRequestsPage({ params }: PageProps) {
  const { id: tournamentId } = use(params)
  const router = useRouter()

  const [tournamentName, setTournamentName] = useState<string>('')
  const [franjas, setFranjas] = useState<Franja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

        const res = await fetch(`${API_BASE}/tournaments/${tournamentId}`, { headers })
        if (!res.ok) throw new Error('No se pudo cargar el torneo')
        const data = await res.json()

        setTournamentName(data.name || 'Torneo')
        // Franjas de la fase de grupos (excluir eliminatorias)
        const allFranjas: Franja[] = data.group_time_slots || []
        const maxDay = allFranjas.length > 0 ? Math.max(...allFranjas.map((f: Franja) => f.tournament_day)) : 0
        setFranjas(allFranjas.filter((f: Franja) => f.tournament_day < maxDay))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tournamentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mb-3 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al torneo
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tournamentName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gestión de solicitudes de cambio de franja
          </p>
        </div>

        {/* Panel principal */}
        <RescheduleRequestsPanel tournamentId={tournamentId} franjas={franjas} />
      </div>
    </div>
  )
}
