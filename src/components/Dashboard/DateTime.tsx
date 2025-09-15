import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeatherWidget } from './WeatherWidget';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';

function getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function getGradientByTime(timeOfDay: ReturnType<typeof getTimeOfDay>) {
  const gradients = {
    morning: 'from-amber-100 via-sky-100 to-sky-200',
    day: 'from-sky-200 via-blue-100 to-blue-200',
    evening: 'from-orange-200 via-pink-100 to-purple-200',
    night: 'from-gray-800 via-gray-900 to-slate-900',
  };
  return gradients[timeOfDay];
}

export function DateTime() {
  const t = useTranslations('dashboard');
  const tDateTime = useTranslations('datetime');
  const [date, setDate] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());

  // Función para obtener el día de la semana traducido
  const getTranslatedDay = (date: Date) => {
    const dayIndex = date.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return tDateTime(days[dayIndex]);
  };

  // Función para obtener el mes traducido
  const getTranslatedMonth = (date: Date) => {
    const monthIndex = date.getMonth();
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    return tDateTime(months[monthIndex]);
  };

  useEffect(() => {
    // Actualizar cada minuto
    const timer = setInterval(() => {
      const now = new Date();
      setDate(now);
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const gradient = getGradientByTime(timeOfDay);
  const isNight = timeOfDay === 'night';
  const textColor = isNight ? 'text-gray-100' : 'text-gray-700';
  const subTextColor = isNight ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="bg-white/0 dark:bg-gray-800/0 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
        {/* Fecha */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`h-[160px] rounded-2xl bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}
        >
          {/* Overlay circular gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${subTextColor}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${subTextColor}`}>
                  {t('date')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${subTextColor}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${subTextColor}`}>
                  {t('time')}
                </span>
                <span className={`text-lg font-medium ${textColor}`}>
                  {format(date, 'HH:mm')}
                </span>
              </div>
            </div>

            <div>
              <div className={`text-sm font-medium capitalize ${textColor} mb-2`}>
                {getTranslatedDay(date)}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-5xl font-bold tracking-tight ${textColor}`}>
                  {format(date, 'd')}
                </span>
                <span className={`text-2xl font-medium ${textColor}`}>
                  {getTranslatedMonth(date)}
                </span>
                <span className={`text-xl ${subTextColor}`}>
                  {format(date, "yyyy")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clima */}
        <div className="h-[160px]">
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
} 