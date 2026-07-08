import { useState, useEffect } from 'react';

/**
 * useTheme — manages light/dark mode preference.
 *
 * Priority order:
 *  1. Value stored in localStorage ('theme' key: 'light' | 'dark')
 *  2. OS/browser prefers-color-scheme
 *  3. Defaults to 'dark' (original app style)
 *
 * Applies the .dark class to <html> for Tailwind darkMode:'class' support.
 * CSS variables in index.css respond to the .dark class automatically.
 */
export function useTheme() {
  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light'; // check prefers-color-scheme: dark, otherwise default to light
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}
