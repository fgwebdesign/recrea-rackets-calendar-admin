/**
 * El `start_date` guardado en una liga es una fecha técnica de referencia (a propósito puede
 * caer antes del primer día de juego real — ver LANZAMIENTO-LIGA-NOCTURNA-VERANO-2026.md, la
 * generación de partidos necesita que sea así). Para mostrarle al usuario algo que tenga
 * sentido ("¿cuándo arranca de verdad esta liga?"), esta función calcula el primer partido
 * real: la próxima ocurrencia del día de juego de la categoría a partir de start_date
 * (inclusive — si start_date ya es ese día, devuelve start_date mismo).
 *
 * Puramente para mostrar en pantalla: no cambia ni reemplaza el start_date guardado, y no se
 * usa en la generación de partidos (esa lógica vive en el backend, matchly-backend
 * src/helpers/fixtureScheduling.js, con su propio ajuste de timezone — no tocar ese archivo
 * para "simplificar" esto, ya se intentó y rompió el cálculo real).
 */
export function getFirstMatchDate(startDate: string, playDay?: string | null): Date | null {
  if (!playDay) return null;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetIndex = dayNames.indexOf(playDay.toLowerCase());
  if (targetIndex === -1) return null;

  const [year, month, day] = startDate.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const currentDay = date.getDay();
  let daysUntilTarget = targetIndex - currentDay;
  if (daysUntilTarget < 0) daysUntilTarget += 7;
  date.setDate(date.getDate() + daysUntilTarget);
  return date;
}
