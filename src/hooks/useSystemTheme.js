import { useState, useEffect } from 'react';

export function useSystemTheme() {
  const getSystemTheme = () => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  // Read the actual system theme immediately
  const [theme, setTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event) => {
      console.log('🚨 CHROME MEDIA QUERY CHANGED', {
        oldTheme: theme,
        newTheme: event.matches ? 'dark' : 'light',
        matches: event.matches,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devToolsOpen: true,
        time: new Date().toISOString()
      });

      setTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };

    console.log(
      'INITIAL THEME:',
      mediaQuery.matches,
      'SIZE:',
      window.innerWidth,
      window.innerHeight
    );
  }, []);

  return theme;
}