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
          50: '#f4f4f5',
          500: '#18181b',
          600: '#09090b',
          700: '#000000',
        },
        bank: {
          canvas: '#09090b',
          surface: '#121316',
          card: '#18191f',
          border: '#27272a',
          borderSubtle: '#1e1f24',
          hover: '#20222b',
          gold: '#f59e0b',
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
