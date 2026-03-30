'use client';

import { useState, useEffect, useCallback } from 'react';
import { TVTheme, TV_THEMES, DEFAULT_THEME_ID } from '@/types/tvTheme';

const STORAGE_KEY = 'tv_theme_id';

export function useTVTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TV_THEMES.find((t) => t.id === stored)) {
      setThemeId(stored);
    }
  }, []);

  const currentTheme: TVTheme = TV_THEMES.find((t) => t.id === themeId) ?? TV_THEMES[0];

  const applyTheme = useCallback((id: string) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return { currentTheme, themeId, applyTheme, themes: TV_THEMES };
}
