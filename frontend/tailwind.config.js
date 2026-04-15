/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0a0e1a',
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
          600: '#4b5563',
          500: '#6b7280',  // ← ОБЯЗАТЕЛЬНО добавь эту строку!
        },
        yandex: {
          blue: '#005bff',
          cyan: '#00d4ff',
          purple: '#7c3aed',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        }
      },
    },
  },
  plugins: [],
}