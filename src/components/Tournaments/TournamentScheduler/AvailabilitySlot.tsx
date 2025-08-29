import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface AvailabilitySlotProps {
  hour: number
  data: {
    total_capacity: number
    selected_count: number
    remaining_slots: number
    percentage_full: number
    teams: Array<{
      team_id: string
      player1_id: string
      player2_id: string
    }>
  }
}

export function AvailabilitySlot({ hour, data }: AvailabilitySlotProps) {
  return (
    <div className="mb-4 p-3 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">
          {String(hour).padStart(2, '0')}:00
        </span>
        <Badge variant={data.remaining_slots > 0 ? "outline" : "destructive"}>
          {data.remaining_slots > 0 ? 'Disponible' : 'Completo'}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        {data.selected_count} de {data.total_capacity} equipos
      </div>

      <Progress value={data.percentage_full} className="h-1" />

      {data.teams.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Equipos en este horario:</div>
          <div className="space-y-1">
            {data.teams.map(team => (
              <div key={team.team_id} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                ID: {team.team_id}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}