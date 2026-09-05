import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { applyTheme, getTheme, onThemeChange, type ThemeId } from '@/lib/theme'

/**
 * Paper ⇄ Ink toggle. One control, two complete systems.
 * Rendered as a switch so assistive tech reads its state.
 */
export default function ThemeSwitcher({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeId>(() => getTheme())
  useEffect(() => onThemeChange(setTheme), [])
  const dark = theme === 'ink'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to Paper (light) theme' : 'Switch to Ink (dark) theme'}
      title={dark ? 'Paper theme' : 'Ink theme'}
      onClick={() => applyTheme(dark ? 'paper' : 'ink')}
      className={`group relative inline-flex items-center h-9 pl-1 pr-2.5 gap-2 rounded-full border border-line bg-card hover:border-line-strong transition-colors ${className}`}
    >
      <span className="relative w-7 h-7 rounded-full overflow-hidden border border-line-strong shrink-0" aria-hidden="true">
        {/* two halves: paper and ink — the knob shows which one is active */}
        <span className="absolute inset-0" data-theme="paper" style={{ background: 'var(--nx-canvas)' }} />
        <motion.span
          className="absolute inset-0"
          data-theme="ink"
          style={{ background: 'var(--nx-canvas)' }}
          initial={false}
          animate={{ clipPath: dark ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
      </span>
      <span className="t-caption font-medium text-fg-2 group-hover:text-fg transition-colors hidden sm:inline">
        {dark ? 'Ink' : 'Paper'}
      </span>
    </button>
  )
}
