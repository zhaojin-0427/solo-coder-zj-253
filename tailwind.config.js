/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'racing': {
          red: '#DC2626',
          'red-light': '#EF4444',
          dark: '#1F2937',
          'dark-light': '#374151',
          silver: '#D1D5DB',
          gold: '#FBBF24',
          'tire-soft': '#EF4444',
          'tire-medium': '#FBBF24',
          'tire-hard': '#F9FAFB',
          'tire-wet': '#3B82F6',
        }
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(220, 38, 38, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.8)' },
        }
      }
    },
  },
  plugins: [],
};
