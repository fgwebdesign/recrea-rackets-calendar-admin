import { useEffect, useState } from 'react';
import { format } from 'date-fns';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-2">
        {/* Fecha */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`h-[140px] sm:h-[160px] rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} p-4 sm:p-6 relative overflow-hidden`}
        >
          {/* Overlay circular gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${subTextColor}`} />
                <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${subTextColor}`}>
                  {t('date')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${subTextColor}`} />
                <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${subTextColor} hidden xs:inline`}>
                  {t('time')}
                </span>
                <span className={`text-base sm:text-lg font-medium ${textColor}`}>
                  {format(date, 'HH:mm')}
                </span>
              </div>
            </div>

            <div>
              <div className={`text-xs sm:text-sm font-medium capitalize ${textColor} mb-1.5 sm:mb-2`}>
                {getTranslatedDay(date)}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${textColor}`}>
                  {format(date, 'd')}
                </span>
                <span className={`text-lg sm:text-xl lg:text-2xl font-medium ${textColor}`}>
                  {getTranslatedMonth(date)}
                </span>
                <span className={`text-base sm:text-lg lg:text-xl ${subTextColor}`}>
                  {format(date, "yyyy")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clima */}
        <div className="h-[140px] sm:h-[160px]">
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
} 