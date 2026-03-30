'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TVSettings {
  /** Segundos entre rotación de categorías (0 = manual / no rotar) */
  categoryInterval: number;
  /** Segundos entre rotación de vistas dentro de cada categoría */
  viewInterval: number;
  /** common_code fijo; null = rotar automáticamente entre todos */
  lockedCategory: string | null;
}

const DEFAULT_SETTINGS: TVSettings = {
  categoryInterval: 40,
  viewInterval: 15,
  lockedCategory: null,
};

const STORAGE_KEY = 'tv_settings';

export function useTVSettings() {
  const [settings, setSettings] = useState<TVSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TVSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // invalid JSON, use defaults
    }
  }, []);

  const updateSettings = useCallback((patch: Partial<TVSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
