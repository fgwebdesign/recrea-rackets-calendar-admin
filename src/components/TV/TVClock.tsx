'use client';

import { useState, useEffect } from 'react';

export function TVClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = new Intl.DateTimeFormat('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(time);

  return (
    <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white drop-shadow-sm">
      {formatted}
    </span>
  );
}
