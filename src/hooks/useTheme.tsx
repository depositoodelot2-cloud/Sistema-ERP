import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = safeGetItem('odelot_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to dark mode for modern PDV look if not specified
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark');
    }
    root.style.colorScheme = theme;
    safeSetItem('odelot_theme', theme);
    window.dispatchEvent(new Event('odelot_theme_changed'));
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
