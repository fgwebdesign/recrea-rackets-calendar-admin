import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Category } from '@/hooks/useCategories';
import { CalendarDays, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DAY_MAPPING: Record<string, string> = {
  'Lunes': 'monday',
  'Martes': 'tuesday',
  'Miércoles': 'wednesday',
  'Jueves': 'thursday',
  'Viernes': 'friday',
  'Sábado': 'saturday',
  'Domingo': 'sunday'
};

const REVERSE_DAY_MAPPING: Record<string, string> = {
  'monday': 'Lunes',
  'tuesday': 'Martes',
  'wednesday': 'Miércoles',
  'thursday': 'Jueves',
  'friday': 'Viernes',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

interface CategoryDayAssignmentProps {
  selectedCategories: string[];
  categories: Category[];
  onDaysAssigned: (categoryDays: Record<string, string[]>) => void;
}

interface DayAssignments {
  [categoryId: string]: string[];
}

function DraggableDay({ 
  day, 
  isOverlay = false,
  isUsed = false 
}: { 
  day: string; 
  isOverlay?: boolean;
  isUsed?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: day,
    data: { type: 'day', value: day },
    disabled: isUsed,
  });

  const style = {
    opacity: isDragging ? 0.4 : 1,
    cursor: isUsed ? 'not-allowed' : 'grab',
    touchAction: 'none',
  };

  const className = `
    ${isOverlay 
      ? 'bg-primary text-primary-foreground shadow-lg scale-105'
      : isUsed
        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through'
        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
    }
    p-3 rounded-lg transition-all duration-200
    border ${isUsed ? 'border-red-300 dark:border-red-800' : 'border-emerald-200 dark:border-emerald-500/30'}
    ${!isUsed ? 'hover:border-primary hover:shadow-md' : ''}
    flex items-center justify-center
    font-medium text-sm
    ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
    ${isUsed ? 'opacity-70 cursor-not-allowed' : ''}
    shadow-sm
  `;

  if (isUsed) {
    return (
      <div className={className} style={style}>
        {day}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={className}
    >
      {day}
    </div>
  );
}

function DroppableCategory({
  category,
  assignments,
  onRemoveDay,
}: {
  category: Category;
  assignments: string[];
  onRemoveDay: (day: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: category.id,
    data: { type: 'category', value: category.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        p-6 rounded-xl transition-all duration-200
        ${isOver 
          ? 'bg-primary/5 dark:bg-primary/10 scale-[1.02] border-primary'
          : 'bg-white dark:bg-slate-800'
        }
        border-2 border-dashed border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-md
      `}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">{category.name}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Arrastra los días en los que se jugará esta categoría</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className={`
        min-h-[120px] p-4 rounded-lg transition-colors duration-200
        ${isOver 
          ? 'bg-blue-50 dark:bg-blue-900/20' 
          : 'bg-slate-50 dark:bg-slate-800/50'
        }
        border border-slate-200 dark:border-slate-700
      `}>
        {assignments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-5 w-5 mr-2" />
            <span>Arrastra días aquí</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignments.map((day) => (
              <div
                key={`${category.id}-${day}`}
                className="
                  flex items-center gap-3 px-4 py-2
                  bg-blue-100 dark:bg-blue-900/30 
                  text-blue-700 dark:text-blue-300
                  rounded-lg
                  group hover:bg-blue-200 dark:hover:bg-blue-900/40
                  transition-colors duration-200
                  border border-blue-200 dark:border-blue-800
                "
              >
                <span className="font-medium text-sm">{REVERSE_DAY_MAPPING[day] || day}</span>
                <button
                  onClick={() => onRemoveDay(day)}
                  className="
                    text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    text-lg font-bold
                    w-5 h-5
                    flex items-center justify-center
                    hover:bg-red-100 dark:hover:bg-red-900/30
                    rounded-full
                  "
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CategoryDayAssignment({
  selectedCategories,
  categories,
  onDaysAssigned,
}: CategoryDayAssignmentProps) {
  const [assignments, setAssignments] = useState<DayAssignments>({});
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [usedDays, setUsedDays] = useState<Set<string>>(new Set());

  // Effect to update used days when assignments change
  // Convertimos a formato español para comparar con los días draggables
  useEffect(() => {
    const newUsedDays = new Set<string>();
    Object.values(assignments).forEach(days => {
      days.forEach(day => {
        // day viene en formato backend (monday, tuesday, etc.)
        // convertimos a español para comparar con DAYS
        const spanishDay = REVERSE_DAY_MAPPING[day] || day;
        newUsedDays.add(spanishDay);
      });
    });
    setUsedDays(newUsedDays);
  }, [assignments]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDay(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      const categoryId = over.id as string;
      const day = active.id as string;
      const backendDay = DAY_MAPPING[day];

      if (backendDay) {
        setAssignments(prev => {
          const newAssignments = { ...prev };
          // Reemplazar el día existente en vez de añadir uno nuevo
          newAssignments[categoryId] = [backendDay];
          setTimeout(() => {
            onDaysAssigned(newAssignments);
          }, 0);
          return newAssignments;
        });
      }
    }

    setActiveDay(null);
  };

  const handleDragCancel = () => {
    setActiveDay(null);
  };

  const removeDay = (categoryId: string, day: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      newAssignments[categoryId] = newAssignments[categoryId].filter(d => d !== day);
      setTimeout(() => {
        onDaysAssigned(newAssignments);
      }, 0);
      return newAssignments;
    });
  };

  const selectedCategoryObjects = categories.filter(cat =>
    selectedCategories.includes(cat.id)
  );

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="p-6 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300">Días disponibles</h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Arrastra los días a las categorías para asignar horarios</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {DAYS.map((day) => (
              <DraggableDay 
                key={day} 
                day={day} 
                isUsed={usedDays.has(day)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedCategoryObjects.map((category) => (
            <DroppableCategory
              key={category.id}
              category={category}
              assignments={assignments[category.id] || []}
              onRemoveDay={(day) => removeDay(category.id, day)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDay ? <DraggableDay day={activeDay} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 