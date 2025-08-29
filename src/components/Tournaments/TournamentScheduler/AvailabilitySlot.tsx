import { TeamWithPlayers } from '@/types/tournament'
import { Progress } from '@/components/ui/progress'
import { UsersIcon } from '@heroicons/react/24/outline'

interface AvailabilitySlotProps {
  hour: number
  data: {
    total_capacity: number
    selected_count: number
    remaining_slots: number
    percentage_full: number
    available: boolean
    teams: TeamWithPlayers[]
  }
}

export function AvailabilitySlot({ hour, data }: AvailabilitySlotProps) {
  const formatHour = (hour: number) => {
    return `${hour}:00`
  }

  return (
    <div className="mb-4 border rounded-md overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <div className="font-medium">{formatHour(hour)}</div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
          data.available 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {data.available ? 'Disponible' : 'Completo'}
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between text-sm mb-1">
          <span>{data.selected_count} de {data.total_capacity} equipos</span>
          <span>{data.remaining_slots} plazas libres</span>
        </div>
        <Progress 
          value={data.percentage_full}
          className={`h-2 ${data.percentage_full > 80 ? 'bg-red-100' : 'bg-blue-100'}`} 
        />
        
        {data.teams.length > 0 && (
          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Equipos en este horario:</div>
            <div className="space-y-2">
              {data.teams.map((team, index) => (
                <div key={team.team_id} className="text-xs p-2 bg-gray-50 rounded-md">
                  <div className="font-medium mb-1">Equipo {index + 1}</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      <span>{team.player1.first_name} {team.player1.last_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      <span>{team.player2.first_name} {team.player2.last_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}