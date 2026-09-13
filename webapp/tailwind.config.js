/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          canvas: '#f8fafc',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#e2e8f0',
          borderSubtle: '#f1f5f9',
          muted: '#64748b',
          dark: '#0f172a',
          accent: '#1e40af',
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
