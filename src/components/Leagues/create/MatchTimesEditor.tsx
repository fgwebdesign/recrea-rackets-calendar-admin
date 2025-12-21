"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Plus, Clock } from 'lucide-react';

interface MatchTimesEditorProps {
  matchTimes: string[];
  courtsPerSlot: number;
  onTimesChange: (times: string[]) => void;
  onCourtsChange: (courts: number) => void;
}

export function MatchTimesEditor({
  matchTimes,
  courtsPerSlot,
  onTimesChange,
  onCourtsChange
}: MatchTimesEditorProps) {
  const [newTime, setNewTime] = useState('');

  const commonTimes = ['20:00', '20:45', '21:30', '22:15', '23:00', '23:45'];

  const addTime = (time: string) => {
    if (time && !matchTimes.includes(time)) {
      const sorted = [...matchTimes, time].sort();
      onTimesChange(sorted);
      setNewTime('');
    }
  };

  const removeTime = (time: string) => {
    onTimesChange(matchTimes.filter(t => t !== time));
  };

  const matchesPerDate = matchTimes.length * courtsPerSlot;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-foreground dark:text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Horarios de Partidos
        </h2>
        <p className="text-muted-foreground">
          Define los horarios en los que se jugarán los partidos.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {matchTimes.map(time => (
          <div
            key={time}
            className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg"
          >
            <span className="font-mono text-foreground">{time}</span>
            <button
              onClick={() => removeTime(time)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {matchTimes.length === 0 && (
          <p className="text-muted-foreground italic">No hay horarios definidos</p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="w-32"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => addTime(newTime)}
          disabled={!newTime}
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Horarios comunes:</p>
        <div className="flex flex-wrap gap-2">
          {commonTimes
            .filter(t => !matchTimes.includes(t))
            .map(time => (
              <Button
                key={time}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addTime(time)}
                className="text-xs"
              >
                + {time}
              </Button>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Canchas simultáneas por horario
        </Label>
        <Select
          value={courtsPerSlot.toString()}
          onValueChange={(v) => onCourtsChange(parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <SelectItem key={n} value={n.toString()}>
                {n} cancha{n > 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Cuántas canchas se usan al mismo tiempo en cada horario
        </p>
      </div>

      {matchTimes.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-medium text-blue-800 dark:text-blue-300">
            📊 Capacidad: {matchTimes.length} horarios × {courtsPerSlot} canchas 
            = <strong>{matchesPerDate} partidos por fecha</strong>
          </p>
        </div>
      )}
    </div>
  );
}

