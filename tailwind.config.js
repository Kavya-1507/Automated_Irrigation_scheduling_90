/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        zinc: {
          950: '#09090b',
        }
      },
      boxShadow: {
        'glow-emerald': '0 0 50px -10px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 50px -10px rgba(244, 63, 94, 0.3)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
}
