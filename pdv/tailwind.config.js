/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pdv: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#3b82f6',
          success: '#22c55e',
          danger: '#ef4444',
          warning: '#f59e0b'
        }
      }
    }
  },
  plugins: []
}
