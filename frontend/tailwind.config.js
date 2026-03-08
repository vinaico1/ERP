/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f4fe',
          100: '#c6e4fc',
          200: '#9ecef9',
          300: '#71b5f6',
          400: '#4fa1f3',
          500: '#2d8ef0',
          600: '#0070F2', // SAP Fiori Blue
          700: '#0059c1',
          800: '#004494',
          900: '#003070',
        },
        sidebar: '#2c3e50',
        'sidebar-hover': '#34495e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
