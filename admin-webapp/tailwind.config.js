/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.{ejs,html}",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
        bank: {
          canvas: '#070b14',
          surface: '#0c1322',
          card: '#111a2e',
          border: '#16223b',
          borderSubtle: '#1b2a47',
          hover: '#16233d',
          gold: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
