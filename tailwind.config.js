/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-base)',
        zincBg: 'var(--bg-base)',
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          variant: 'var(--surface-variant)',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#6366f1',
          cyan: '#0ea5e9',
          pink: '#ec4899',
        }
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(to right, #2563eb, #3b82f6, #93c5fd)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'slide-in-new': 'slideInNew 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'new-entry-glow': 'newEntryGlow 2s ease-out forwards',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        slideInNew: {
          '0%': { opacity: 0, transform: 'translateY(-10px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        newEntryGlow: {
          '0%': { backgroundColor: 'rgba(251, 191, 36, 0.18)', boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.35)' },
          '60%': { backgroundColor: 'rgba(251, 191, 36, 0.08)', boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.15)' },
          '100%': { backgroundColor: 'transparent', boxShadow: 'none' },
        },
      }
    },
  },
  plugins: [],
}
