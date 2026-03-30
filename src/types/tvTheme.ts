export interface TVThemeVars {
  /** Header gradient */
  from: string;
  via: string;
  to: string;
  /** Group header colors (standings) */
  g1: string;
  g2: string;
  g3: string;
  g4: string;
  /** General accent (badges, highlights) */
  accent: string;
  /** Page background */
  bg: string;
  /** Card/surface background */
  surface: string;
  /** Primary text */
  text: string;
  /** Text on colored (inverted) backgrounds */
  textInv: string;
  /** Default border */
  border: string;
  /** Subtle muted text */
  textMuted: string;
}

export interface TVTheme {
  id: string;
  name: string;
  emoji: string;
  dark: boolean;
  vars: TVThemeVars;
}

export const TV_THEMES: TVTheme[] = [
  {
    id: 'default',
    name: 'Matchly',
    emoji: '🎾',
    dark: false,
    vars: {
      from: '#4f46e5', via: '#7c3aed', to: '#a21caf',
      g1: '#3b82f6', g2: '#10b981', g3: '#f59e0b', g4: '#8b5cf6',
      accent: '#6366f1',
      bg: '#f8fafc', surface: '#ffffff',
      text: '#0f172a', textInv: '#ffffff', border: '#e2e8f0', textMuted: '#64748b',
    },
  },
  {
    id: 'dark',
    name: 'Oscuro',
    emoji: '🌙',
    dark: true,
    vars: {
      from: '#020617', via: '#0f172a', to: '#0e7490',
      g1: '#0891b2', g2: '#0d9488', g3: '#7c3aed', g4: '#059669',
      accent: '#06b6d4',
      bg: '#020617', surface: '#0f172a',
      text: '#e2e8f0', textInv: '#ffffff', border: '#1e293b', textMuted: '#94a3b8',
    },
  },
  {
    id: 'red',
    name: 'Rojo',
    emoji: '🔴',
    dark: false,
    vars: {
      from: '#991b1b', via: '#dc2626', to: '#ea580c',
      g1: '#dc2626', g2: '#db2777', g3: '#ea580c', g4: '#9f1239',
      accent: '#dc2626',
      bg: '#fff1f2', surface: '#ffffff',
      text: '#1c0b0b', textInv: '#ffffff', border: '#fecdd3', textMuted: '#6b7280',
    },
  },
  {
    id: 'green',
    name: 'Verde',
    emoji: '🟢',
    dark: false,
    vars: {
      from: '#064e3b', via: '#059669', to: '#0d9488',
      g1: '#059669', g2: '#0d9488', g3: '#65a30d', g4: '#16a34a',
      accent: '#059669',
      bg: '#f0fdf4', surface: '#ffffff',
      text: '#052e16', textInv: '#ffffff', border: '#bbf7d0', textMuted: '#4b5563',
    },
  },
  {
    id: 'blue',
    name: 'Azul',
    emoji: '🔵',
    dark: false,
    vars: {
      from: '#1e3a8a', via: '#2563eb', to: '#0284c7',
      g1: '#2563eb', g2: '#0284c7', g3: '#0891b2', g4: '#4f46e5',
      accent: '#2563eb',
      bg: '#eff6ff', surface: '#ffffff',
      text: '#0c1a4a', textInv: '#ffffff', border: '#bfdbfe', textMuted: '#4b5563',
    },
  },
  {
    id: 'gold',
    name: 'Dorado',
    emoji: '🏆',
    dark: false,
    vars: {
      from: '#78350f', via: '#b45309', to: '#d97706',
      g1: '#b45309', g2: '#92400e', g3: '#854d0e', g4: '#a16207',
      accent: '#d97706',
      bg: '#fffbeb', surface: '#ffffff',
      text: '#1c0a00', textInv: '#ffffff', border: '#fde68a', textMuted: '#6b7280',
    },
  },
];

export const DEFAULT_THEME_ID = 'default';

/** Convierte un TVTheme en un objeto de CSS custom properties */
export function themeToCSS(theme: TVTheme): React.CSSProperties {
  const v = theme.vars;
  return {
    '--tv-from': v.from,
    '--tv-via': v.via,
    '--tv-to': v.to,
    '--tv-g1': v.g1,
    '--tv-g2': v.g2,
    '--tv-g3': v.g3,
    '--tv-g4': v.g4,
    '--tv-accent': v.accent,
    '--tv-bg': v.bg,
    '--tv-surface': v.surface,
    '--tv-text': v.text,
    '--tv-text-inv': v.textInv,
    '--tv-border': v.border,
    '--tv-text-muted': v.textMuted,
  } as React.CSSProperties;
}
