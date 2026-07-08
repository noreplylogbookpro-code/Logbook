/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // Slate 950 deep midnight
        zincBg: '#09090b', // Zinc 950 alternate midnight
        accent: {
          blue: '#60a5fa',
          purple: '#c084fc',
          cyan: '#22d3ee',
          pink: '#f472b6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(0.5deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.5, filter: 'drop-shadow(0 0 15px rgba(96, 165, 250, 0.2))' },
          '50%': { opacity: 0.8, filter: 'drop-shadow(0 0 25px rgba(192, 132, 252, 0.4))' },
        }
      }
    },
  },
  plugins: [],
}
