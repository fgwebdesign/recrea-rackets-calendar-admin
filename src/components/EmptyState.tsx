import Image from 'next/image';

export default function EmptyState() {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Canchas
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="relative w-48 h-48 mb-4">
          <Image
            src="/assets/nomatches.png"
            alt="No hay canchas disponibles"
            fill
            className="object-contain"
            loading="lazy"
            sizes="192px"
          />
        </div>
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300 text-center mb-1">
          No hay canchas creadas aún.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Agrega tu primera cancha para gestionar las canchas en la liga.
        </p>
      </div>
    </div>
  );
}