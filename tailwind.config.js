/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'cursive', 'sans-serif'],
        gentium: ['"Gentium Book Plus"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: '#2563EB', // Vibrant Royal Ocean Blue
        'primary-dark': '#1D4ED8',
        'primary-light': '#EFF6FF',
        secondary: '#10B981', // Fresh Emerald Green
        'secondary-light': '#ECFDF5',
        accent: '#F59E0B', // Warm Amber Gold
        'accent-gold': '#FCD34D',
        background: '#F8FAFC', // Crisp Arctic Pearl Slate 50
        surface: '#FFFFFF',
        'text-primary': '#0F172A', // Slate 900 Charcoal Obsidian
        'text-secondary': '#475569', // Slate 600
        highlight: '#38BDF8', // Sky 400
        error: '#EF4444',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(37, 99, 235, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'card': '0 10px 30px -4px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.25)',
        'gold-glow': '0 0 20px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        },
      },
    },
  },
  plugins: [],
};
