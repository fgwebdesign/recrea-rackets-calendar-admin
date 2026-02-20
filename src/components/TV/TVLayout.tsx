'use client';

import Image from 'next/image';
import { TVClock } from './TVClock';

interface TVLayoutProps {
  title: string;
  children: React.ReactNode;
  showExit?: boolean;
  onExit?: () => void;
}

export function TVLayout({ title, children, showExit = false, onExit }: TVLayoutProps) {
  return (
    <div className="min-h-screen min-w-full bg-slate-50 text-slate-800 flex flex-col">
      <header className="flex-shrink-0 px-8 py-5 flex items-center justify-between bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 shadow-lg">
        <div className="flex items-center gap-5">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 shadow-inner">
            <Image
              src="/assets/Matchlylogo.png"
              alt="Matchly"
              fill
              className="object-contain p-1.5"
            />
          </div>
          <h1 className="font-orbitron text-xl sm:text-2xl font-bold tracking-wide text-white drop-shadow-sm truncate max-w-[55vw]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <TVClock />
          {showExit && onExit && (
            <button
              onClick={onExit}
              className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors font-medium"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 text-slate-900 [color-scheme:light]">{children}</main>
    </div>
  );
}
