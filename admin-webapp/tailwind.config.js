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
        }
      }
    },
  },
  plugins: [],
}
