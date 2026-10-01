/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
        },
        carbon: {
          950: '#09090b',
          900: '#121214',
          850: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
        },
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        }
      },
      boxShadow: {
        'neon-yellow': '0 0 20px rgba(234, 179, 8, 0.45)',
        'neon-yellow-sm': '0 0 10px rgba(234, 179, 8, 0.3)',
      }
    },
  },
  plugins: [],
}
