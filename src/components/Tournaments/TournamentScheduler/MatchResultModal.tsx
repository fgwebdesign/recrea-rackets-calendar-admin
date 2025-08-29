import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TournamentMatch } from '@/types/tournament'

interface MatchResultModalProps {
  match: TournamentMatch
  onClose: () => void
  onSave: (
    team1Sets1: number,
    team2Sets1: number,
    team1Sets2: number,
    team2Sets2: number,
    team1Tie1: number,
    team2Tie1: number,
    team1Tie2: number,
    team2Tie2: number,
    team1Tie3: number,
    team2Tie3: number
  ) => Promise<void>
}

export function MatchResultModal({ match, onClose, onSave }: MatchResultModalProps) {
  const [team1Sets1, setTeam1Sets1] = useState(match.team1_sets1_won?.toString() || '')
  const [team2Sets1, setTeam2Sets1] = useState(match.team2_sets1_won?.toString() || '')
  const [team1Sets2, setTeam1Sets2] = useState(match.team1_sets2_won?.toString() || '')
  const [team2Sets2, setTeam2Sets2] = useState(match.team2_sets2_won?.toString() || '')
  const [team1Tie1, setTeam1Tie1] = useState(match.team1_tie1_won?.toString() || '')
  const [team2Tie1, setTeam2Tie1] = useState(match.team2_tie1_won?.toString() || '')
  const [team1Tie2, setTeam1Tie2] = useState(match.team1_tie2_won?.toString() || '')
  const [team2Tie2, setTeam2Tie2] = useState(match.team2_tie2_won?.toString() || '')
  const [team1Tie3, setTeam1Tie3] = useState(match.team1_tie3_won?.toString() || '')
  const [team2Tie3, setTeam2Tie3] = useState(match.team2_tie3_won?.toString() || '')
  const [loading, setLoading] = useState(false)

  const hasResult = match.status === 'completed'

  const handleSave = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onSave(
        parseInt(team1Sets1),
        parseInt(team2Sets1),
        parseInt(team1Sets2),
        parseInt(team2Sets2),
        parseInt(team1Tie1),
        parseInt(team2Tie1),
        parseInt(team1Tie2),
        parseInt(team2Tie2),
        parseInt(team1Tie3),
        parseInt(team2Tie3)
      )
    } finally {
      setLoading(false)
    }
  }

  const isValidScore = () => {
    return (
      team1Sets1 && team2Sets1 && 
      team1Sets2 && team2Sets2 && 
      team1Tie1 && team2Tie1
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {hasResult ? 'Resultado del Partido' : 'Ingresar Resultado'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Set 1 */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>{match.home_team?.name || 'Local'}</Label>
            <div className="text-center font-bold">Set 1</div>
            <Label>{match.away_team?.name || 'Visitante'}</Label>

            {hasResult ? (
              <div className="col-span-3 text-center font-bold">
                {match.team1_sets1_won} - {match.team2_sets1_won}
                {match.team1_tie1_won && ` (${match.team1_tie1_won}-${match.team2_tie1_won})`}
              </div>
            ) : (
              <>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={team1Sets1}
                  onChange={(e) => setTeam1Sets1(e.target.value)}
                  className="text-center"
                />
                <div className="text-center">-</div>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={team2Sets1}
                  onChange={(e) => setTeam2Sets1(e.target.value)}
                  className="text-center"
                />
                {/* Tie Break 1 */}
                <Input
                  type="number"
                  min="0"
                  placeholder="Tie Break"
                  value={team1Tie1}
                  onChange={(e) => setTeam1Tie1(e.target.value)}
                  className="text-center"
                />
                <div className="text-center">-</div>
                <Input
                  type="number"
                  min="0"
                  placeholder="Tie Break"
                  value={team2Tie1}
                  onChange={(e) => setTeam2Tie1(e.target.value)}
                  className="text-center"
                />
              </>
            )}
          </div>

          {/* Set 2 */}
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-center font-bold col-span-3">Set 2</div>
            {hasResult ? (
              <div className="col-span-3 text-center font-bold">
                {match.team1_sets2_won} - {match.team2_sets2_won}
                {match.team1_tie2_won && ` (${match.team1_tie2_won}-${match.team2_tie2_won})`}
              </div>
            ) : (
              <>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={team1Sets2}
                  onChange={(e) => setTeam1Sets2(e.target.value)}
                  className="text-center"
                />
                <div className="text-center">-</div>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={team2Sets2}
                  onChange={(e) => setTeam2Sets2(e.target.value)}
                  className="text-center"
                />
                {/* Tie Break 2 */}
                <Input
                  type="number"
                  min="0"
                  placeholder="Tie Break"
                  value={team1Tie2}
                  onChange={(e) => setTeam1Tie2(e.target.value)}
                  className="text-center"
                />
                <div className="text-center">-</div>
                <Input
                  type="number"
                  min="0"
                  placeholder="Tie Break"
                  value={team2Tie2}
                  onChange={(e) => setTeam2Tie2(e.target.value)}
                  className="text-center"
                />
              </>
            )}
          </div>

          {/* Super Tie Break (opcional) */}
          {(hasResult ? 
            (match.team1_tie3_won !== undefined && match.team2_tie3_won !== undefined) : 
            (team1Sets1 !== team2Sets1 && team1Sets2 !== team2Sets2)
          ) && (
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center font-bold col-span-3">Super Tie Break</div>
              {hasResult ? (
                <div className="col-span-3 text-center font-bold">
                  {match.team1_tie3_won} - {match.team2_tie3_won}
                </div>
              ) : (
                <>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Super Tie Break"
                    value={team1Tie3}
                    onChange={(e) => setTeam1Tie3(e.target.value)}
                    className="text-center"
                  />
                  <div className="text-center">-</div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Super Tie Break"
                    value={team2Tie3}
                    onChange={(e) => setTeam2Tie3(e.target.value)}
                    className="text-center"
                  />
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {hasResult ? (
            <Button onClick={onClose}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading || !isValidScore()}
              >
                {loading ? 'Guardando...' : 'Guardar Resultado'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}