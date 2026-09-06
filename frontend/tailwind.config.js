/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#ffffff',
          100: '#f5f5f7',
          200: '#e5e5ea',
          300: '#d1d1d6',
          400: '#8e8e93',
          500: '#636366',
          600: '#48484a',
          700: '#3a3a3c',
          800: '#242426',
          900: '#141416',
          950: '#000000',
        },
        emerald: {
          50: '#ffffff',
          100: '#f5f5f7',
          200: '#e5e5ea',
          300: '#d1d1d6',
          400: '#ffffff',
          500: '#ffffff',
          600: '#e5e5ea',
          700: '#d1d1d6',
          800: '#242426',
          900: '#141416',
          950: '#000000',
        },
        teal: {
          400: '#ffffff',
          500: '#f5f5f7',
          600: '#e5e5ea',
        },
        brand: {
          50: '#ffffff',
          100: '#f5f5f7',
          200: '#e5e5ea',
          300: '#d1d1d6',
          400: '#ffffff',
          500: '#ffffff',
          600: '#e5e5ea',
          700: '#d1d1d6',
          800: '#242426',
          900: '#141416',
        },
      },
    },
  },
  plugins: [],
}
