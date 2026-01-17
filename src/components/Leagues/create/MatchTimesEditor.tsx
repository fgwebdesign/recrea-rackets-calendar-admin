"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Clock, Calendar, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchTimesEditorProps {
  matchTimes: string[];
  courtsPerSlot: number;
  maxCourts: number;
  onTimesChange: (times: string[]) => void;
  onCourtsChange: (courts: number) => void;
}

export function MatchTimesEditor({
  matchTimes,
  courtsPerSlot,
  maxCourts,
  onTimesChange,
  onCourtsChange
}: MatchTimesEditorProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Ajustar courtsPerSlot si es mayor que maxCourts
  useEffect(() => {
    if (courtsPerSlot > maxCourts) {
      onCourtsChange(maxCourts);
    }
  }, [maxCourts, courtsPerSlot, onCourtsChange]);

  // Horarios típicos de liga (en horas completas)
  const quickHours = [19, 20, 21, 22, 23];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const addTime = (time: string) => {
    if (time && !matchTimes.includes(time)) {
      const sorted = [...matchTimes, time].sort();
      onTimesChange(sorted);
    }
  };

  const handleAddTime = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      const time = formatTime(selectedHour, selectedMinute);
      addTime(time);
      setSelectedHour(null);
      setSelectedMinute(null);
      setIsOpen(false);
    }
  };

  const removeTime = (time: string) => {
    onTimesChange(matchTimes.filter(t => t !== time));
  };

  const matchesPerDate = matchTimes.length * courtsPerSlot;

  const displayTime = selectedHour !== null && selectedMinute !== null
    ? formatTime(selectedHour, selectedMinute)
    : '--:--';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Horarios de Partidos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Selecciona en qué horarios se jugarán los partidos de la liga
          </p>
        </div>
      </div>

      {/* Horarios Seleccionados */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Horarios activos
        </label>
        
        <div className="flex flex-wrap gap-3">
          {matchTimes.length === 0 ? (
            <div className="w-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                Selecciona al menos un horario
              </p>
            </div>
          ) : (
            matchTimes.map(time => (
              <div
                key={time}
                className="group flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 
                         border-2 border-emerald-200 dark:border-emerald-800 rounded-xl
                         hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
              >
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {time}
                </span>
                <button
                  onClick={() => removeTime(time)}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 
                           dark:hover:bg-red-900/20 transition-colors"
                  title="Eliminar horario"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agregar Horario */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Agregar horario
        </label>
        
        <div className="flex gap-3 items-center">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-center text-lg font-mono font-bold h-12 rounded-xl",
                  "border-2 border-slate-200 dark:border-slate-700",
                  "hover:border-emerald-400 dark:hover:border-emerald-600",
                  selectedHour !== null && "border-emerald-400 dark:border-emerald-600"
                )}
              >
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                {displayTime}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <div className="space-y-4">
                {/* Selector de Hora */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                    Hora
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {hours.filter(h => h >= 17 && h <= 23).map(hour => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setSelectedHour(hour)}
                        className={cn(
                          "h-9 rounded-lg text-sm font-medium transition-all",
                          selectedHour === hour
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        )}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de Minutos */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                    Minutos
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {minutes.map(minute => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => setSelectedMinute(minute)}
                        className={cn(
                          "h-9 rounded-lg text-sm font-medium transition-all",
                          selectedMinute === minute
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        )}
                      >
                        :{minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview y Agregar */}
                {selectedHour !== null && selectedMinute !== null && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      onClick={handleAddTime}
                      disabled={matchTimes.includes(displayTime)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar {displayTime}
                    </Button>
                    {matchTimes.includes(displayTime) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                        Este horario ya está agregado
                      </p>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Horarios Rápidos */}
          <div className="flex gap-2 flex-wrap">
            {quickHours
              .filter(h => !matchTimes.includes(`${h.toString().padStart(2, '0')}:00`))
              .map(hour => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => addTime(`${hour.toString().padStart(2, '0')}:00`)}
                  className="px-3 py-2 text-sm font-mono font-semibold text-slate-600 dark:text-slate-400
                           bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30
                           hover:text-emerald-700 dark:hover:text-emerald-400
                           border border-slate-200 dark:border-slate-700 hover:border-emerald-300 
                           dark:hover:border-emerald-700 rounded-lg transition-all"
                >
                  +{hour}:00
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Canchas por Horario */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Canchas simultáneas
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
            (máx. {maxCourts} disponibles)
          </span>
        </label>
        
        <div className="flex gap-2">
          {Array.from({ length: maxCourts }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onCourtsChange(n)}
              className={cn(
                "w-12 h-12 rounded-xl font-bold text-lg transition-all",
                courtsPerSlot === n
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cantidad de partidos que pueden jugarse en paralelo en cada horario
        </p>
      </div>

      {/* Resumen de Capacidad */}
      {matchTimes.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 
                      border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                Capacidad por fecha de juego
              </p>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {matchTimes.length} horario{matchTimes.length > 1 ? 's' : ''} × {courtsPerSlot} cancha{courtsPerSlot > 1 ? 's' : ''} = {' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {matchesPerDate} partidos
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
