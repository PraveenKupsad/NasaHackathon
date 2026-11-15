/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#06090e',
          900: '#0a0e17',
          850: '#0f1523',
          800: '#141c2e',
          750: '#192338',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          300: '#94a3b8',
          200: '#cbd5e1',
          100: '#f1f5f9',
        },
        lunar: {
          cyan: '#00e5ff',
          dimCyan: '#06b6d4',
          blue: '#3b82f6',
          mutedBlue: '#1e40af',
          amber: '#f59e0b',
          red: '#ef4444',
          emerald: '#10b981',
          border: '#1f293d',
          card: '#0d131f',
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Consolas', 'Menlo', 'monospace'],
        sans: ['Inter', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'panel': '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
        'cyan-glow': '0 0 10px rgba(0, 229, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
