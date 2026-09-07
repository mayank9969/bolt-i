/** @type {import('tailwindcss').Config} */

/** Tailwind colour backed by a token triplet so opacity modifiers work: bg-accent/10 */
const t = (name) => `rgb(var(--nx-${name}-rgb) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: { xs: '400px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      fontFamily: {
        /* ONE typeface for the whole product. `display` and `mono` are kept as aliases so
           nothing can accidentally fall back to a second family. */
        sans: ['"Geist Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Geist Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Geist Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      /* ── Every colour maps to a design token (src/styles/tokens.css) ── */
      colors: {
        canvas: t('canvas'),
        elevated: t('elevated'),
        surface: t('surface'),
        card: { DEFAULT: t('card'), strong: t('card-strong') },

        fg: { DEFAULT: t('text'), 2: t('text-2'), 3: t('text-3'), inverse: t('text-inverse') },

        line: {
          DEFAULT: 'var(--nx-line)',
          subtle: 'var(--nx-line-subtle)',
          strong: 'var(--nx-line-strong)',
        },

        accent: { DEFAULT: t('accent'), 2: t('accent-2'), dark: t('accent-dark'), b: t('accent-b') },
        cta: { DEFAULT: t('cta'), hover: t('cta-hover'), text: t('cta-text') },

        ok: t('success'),
        warn: t('warning'),
        err: t('error'),

        selected: t('selected'),
        progress: t('progress'),
        score: t('score'),
        disabled: { DEFAULT: 'var(--nx-disabled)', text: t('disabled-text') },
        track: 'var(--nx-track)',
        hover: 'var(--nx-hover)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      maxWidth: {
        page: '80rem',
        prose2: '68ch',
      },
      boxShadow: {
        card: 'var(--nx-shadow-1)',
        'card-hover': 'var(--nx-shadow-2)',
        inset: 'var(--nx-shadow-inset)',
        focus: '0 0 0 3px var(--nx-accent-glow)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '320ms',
        slow: '640ms',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 26s ease-in-out infinite reverse',
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
      },
    },
  },
  plugins: [],
}
