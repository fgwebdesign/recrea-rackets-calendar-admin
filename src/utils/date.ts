import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMM yyyy', { locale: es });
};

export const formatDateWithWeekday = (date: string) => {
  return format(new Date(date), "EEEE, d 'de' MMMM", { locale: es });
};

export const getDateRangeArray = (startDateStr: string, endDateStr: string): string[] => {
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  const dates: string[] = []

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
};