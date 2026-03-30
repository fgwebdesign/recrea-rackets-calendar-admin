'use client';

import Image from 'next/image';
import { TVClock } from './TVClock';
import { TVTheme, themeToCSS } from '@/types/tvTheme';
import { Settings } from 'lucide-react';

const VIEW_LABELS: Record<string, string> = {
  standings: 'Tabla',
  matches: 'Partidos',
  bracket: 'Llaves',
  teams: 'Equipos',
};

interface TVLayoutProps {
  title: string;
  children: React.ReactNode;
  theme?: TVTheme;
  showExit?: boolean;
  onExit?: () => void;
  onOpenSettings?: () => void;
  currentView?: string;
  viewOrder?: string[];
  categoryIndex?: number;
  categoryTotal?: number;
  categoryLabel?: string;
  viewProgress?: number;
}

export function TVLayout({
  title,
  children,
  theme,
  showExit = false,
  onExit,
  onOpenSettings,
  currentView,
  viewOrder = [],
  categoryIndex = 0,
  categoryTotal = 1,
  categoryLabel,
  viewProgress = 0,
}: TVLayoutProps) {
  const cssVars = theme ? themeToCSS(theme) : {};

  return (
    <div
      className="flex flex-col"
      style={{
        ...cssVars,
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        background: 'var(--tv-bg)',
        color: 'var(--tv-text)',
        colorScheme: theme?.dark ? 'dark' : 'light',
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6"
        style={{
          height: '4rem',
          background: `linear-gradient(to right, var(--tv-from), var(--tv-via), var(--tv-to))`,
          boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        }}
      >
        {/* Left: logo + title + settings */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 shadow">
            <Image
              src="/assets/Matchlylogo.png"
              alt="Matchly"
              fill
              className="object-contain p-1"
              priority
              sizes="36px"
            />
          </div>
          <h1 className="font-orbitron text-lg font-bold tracking-wide text-white drop-shadow truncate" style={{ maxWidth: '50vw' }}>
            {title}
          </h1>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex-shrink-0 ml-1 text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/20"
              title="Configuración (ESC)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: clock + exit */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <TVClock />
          {showExit && onExit && (
            <button
              onClick={onExit}
              className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors font-medium"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {/* ── Main content — fills remaining height, NO scroll ── */}
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ padding: '1rem 1.5rem', minHeight: 0 }}
      >
        {children}
      </main>

      {/* ── Footer progress bar ─────────────────────────── */}
      <footer
        className="flex-shrink-0 relative flex items-center justify-between px-5"
        style={{
          height: '2.5rem',
          background: `linear-gradient(to right, var(--tv-from), var(--tv-via), var(--tv-to))`,
        }}
      >
        {/* Category dots */}
        {categoryTotal > 1 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: categoryTotal }).map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === categoryIndex ? '1.25rem' : '0.4rem',
                  height: '0.4rem',
                  background: i === categoryIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        )}

        {/* Category label — center */}
        {categoryLabel && (
          <span className="absolute left-1/2 -translate-x-1/2 text-white/95 text-xs font-semibold font-orbitron truncate max-w-[50vw]">
            {categoryLabel}
          </span>
        )}

        {/* View tabs — right */}
        {viewOrder.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            {viewOrder.map((v) => (
              <span
                key={v}
                className="px-2 py-0.5 rounded-md text-xs font-semibold font-orbitron transition-all"
                style={{
                  background: v === currentView ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
                  color: v === currentView ? 'var(--tv-from)' : 'rgba(255,255,255,0.8)',
                }}
              >
                {VIEW_LABELS[v] ?? v}
              </span>
            ))}
          </div>
        )}

        {/* Progress line at bottom */}
        <div
          className="absolute bottom-0 left-0 h-[3px] transition-all duration-300"
          style={{ width: `${viewProgress}%`, background: 'rgba(255,255,255,0.6)' }}
        />
      </footer>
    </div>
  );
}
