'use client';

import { X, Palette, RotateCcw, Pin } from 'lucide-react';
import { TV_THEMES, TVTheme } from '@/types/tvTheme';
import { TVSettings } from '@/hooks/useTVSettings';
import { TVEvent } from '@/hooks/useTVEvents';

interface TVSettingsPanelProps {
  currentTheme: TVTheme;
  settings: TVSettings;
  events: TVEvent[];
  onThemeChange: (id: string) => void;
  onSettingsChange: (patch: Partial<TVSettings>) => void;
  onClose: () => void;
}

const CATEGORY_INTERVALS = [
  { label: 'No rotar', value: 0 },
  { label: '20s', value: 20 },
  { label: '30s', value: 30 },
  { label: '40s', value: 40 },
  { label: '60s', value: 60 },
  { label: '2min', value: 120 },
];

const VIEW_INTERVALS = [
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '20s', value: 20 },
  { label: '30s', value: 30 },
];

export function TVSettingsPanel({
  currentTheme,
  settings,
  events,
  onThemeChange,
  onSettingsChange,
  onClose,
}: TVSettingsPanelProps) {
  // Usamos valores directos del tema porque el panel está fuera del árbol
  // donde se definen las CSS variables --tv-*
  const v = currentTheme.vars;
  const headerGrad = `linear-gradient(to right, ${v.from}, ${v.via}, ${v.to})`;
  const btnInactive = currentTheme.dark ? '#1e293b' : '#f1f5f9';
  const btnInactiveBorder = currentTheme.dark ? '#334155' : '#e2e8f0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: v.surface,
          color: v.text,
          border: `1px solid ${v.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: headerGrad }}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-white" />
            <h2 className="font-orbitron text-lg font-bold text-white tracking-wide">Configuración TV</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Theme selector */}
          <section>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: v.textMuted }}
            >
              <Palette className="w-3.5 h-3.5" />
              Tema / Colores
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {TV_THEMES.map((theme) => {
                const isActive = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all"
                    style={{
                      background: isActive ? v.accent : btnInactive,
                      color: isActive ? '#fff' : v.text,
                      border: `2px solid ${isActive ? v.accent : btnInactiveBorder}`,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex-shrink-0 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${theme.vars.from}, ${theme.vars.to})` }}
                    />
                    <span className="truncate">{theme.emoji} {theme.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Category rotation */}
          <section>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: v.textMuted }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rotación de categorías
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_INTERVALS.map((opt) => {
                const isActive = settings.categoryInterval === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSettingsChange({ categoryInterval: opt.value })}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: isActive ? v.accent : btnInactive,
                      color: isActive ? '#fff' : v.text,
                      border: `1px solid ${isActive ? v.accent : btnInactiveBorder}`,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* View rotation */}
          <section>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: v.textMuted }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rotación de vistas (por categoría)
            </h3>
            <div className="flex flex-wrap gap-2">
              {VIEW_INTERVALS.map((opt) => {
                const isActive = settings.viewInterval === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSettingsChange({ viewInterval: opt.value })}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: isActive ? v.accent : btnInactive,
                      color: isActive ? '#fff' : v.text,
                      border: `1px solid ${isActive ? v.accent : btnInactiveBorder}`,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Lock to category */}
          {events.length > 1 && (
            <section>
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: v.textMuted }}
              >
                <Pin className="w-3.5 h-3.5" />
                Fijar categoría
              </h3>
              <div className="flex flex-wrap gap-2">
                {[{ code: null, label: 'Todas (auto)' }, ...events.map((e) => ({ code: e.common_code, label: e.display_name }))].map(
                  ({ code, label }) => {
                    const isActive = settings.lockedCategory === code;
                    return (
                      <button
                        key={code ?? '__all__'}
                        onClick={() => onSettingsChange({ lockedCategory: code })}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: isActive ? v.accent : btnInactive,
                          color: isActive ? '#fff' : v.text,
                          border: `1px solid ${isActive ? v.accent : btnInactiveBorder}`,
                        }}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          )}

          <p className="text-xs text-center" style={{ color: v.textMuted }}>
            Presioná{' '}
            <kbd
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{ background: btnInactive, border: `1px solid ${btnInactiveBorder}` }}
            >
              ESC
            </kbd>{' '}
            para cerrar
          </p>
        </div>
      </div>
    </div>
  );
}
