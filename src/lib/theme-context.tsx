'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from './supabase-browser';

type Theme = 'neon-obsidian' | 'cyberpunk-matrix' | 'crimson-glitch' | 'solar-gold';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'neon-obsidian',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('neon-obsidian');

  // Load equipped theme from Supabase on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await fetch('/api/shop');
        if (res.ok) {
          const data = await res.json();
          const equipped = data.owned?.find(
            (c: { equipped: boolean; item: { type: string } }) =>
              c.equipped && c.item.type === 'theme'
          );
          if (equipped) {
            setThemeState(equipped.item.cssClass as Theme);
          }
        }
      } catch {
        // Silently fail — default theme is fine
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('neon-obsidian', 'cyberpunk-matrix', 'crimson-glitch', 'solar-gold');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
