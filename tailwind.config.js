/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: ['chip-accent', 'chip-success', 'chip-warning', 'chip-danger'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Deep navy base scale
        ink: {
          50: '#f4f6fb',
          100: '#e6eaf4',
          200: '#c7d0e4',
          300: '#9fadcc',
          400: '#7285ad',
          500: '#52648d',
          600: '#3d4c70',
          700: '#2c3856',
          800: '#1c2540',
          900: '#111930',
          950: '#0a0f1f',
          975: '#070b16',
        },
        // Electric cyan accent
        accent: {
          50: '#eafcff',
          100: '#c9f6ff',
          200: '#97edff',
          300: '#5ddcff',
          400: '#2cc4f5',
          500: '#0aa3d4',
          600: '#0083ae',
          700: '#006890',
          800: '#005574',
          900: '#00435c',
        },
        success: { 300: '#86efac', 400: '#4ade80', 500: '#22c55e' },
        warning: { 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b' },
        danger: { 300: '#fca5a5', 400: '#f87171', 500: '#ef4444' },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -12px rgba(0,0,0,0.5)',
        'card-hover': '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 50px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(44,196,245,0.12)',
        glow: '0 0 0 1px rgba(44,196,245,0.35), 0 0 32px -6px rgba(44,196,245,0.45)',
        'glow-sm': '0 0 0 1px rgba(44,196,245,0.25), 0 0 20px -6px rgba(44,196,245,0.35)',
        cta: '0 10px 30px -10px rgba(44,196,245,0.55), 0 0 0 1px rgba(93,220,255,0.25) inset',
        'cta-hover': '0 16px 40px -10px rgba(44,196,245,0.7), 0 0 0 1px rgba(93,220,255,0.4) inset',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'drift': 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 26s ease-in-out infinite reverse',
        'shimmer': 'shimmer 2.6s linear infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '33%': { transform: 'translate3d(2%, -3%, 0)' },
          '66%': { transform: 'translate3d(-2%, 2%, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
