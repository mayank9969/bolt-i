import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { THEMES, applyTheme, getTheme, onThemeChange, type ThemeId } from '@/lib/theme'

/** Compact theme menu. Swatches are rendered from the theme's own tokens. */
export default function ThemeSwitcher({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [theme, setTheme] = useState<ThemeId>(() => getTheme())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => onThemeChange(setTheme), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}. Change theme`}
        className="inline-flex items-center gap-2 h-9 pl-2 pr-3 rounded-lg border border-line bg-card hover:bg-card-strong hover:border-line-strong text-xs font-medium text-fg-2 hover:text-fg transition-colors"
      >
        <Swatch id={theme} />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Theme"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute bottom-full mb-2 ${align === 'right' ? 'right-0' : 'left-0'} z-50 min-w-[15rem] p-1.5 rounded-xl surface-strong`}
          >
            {THEMES.map((t) => {
              const active = t.id === theme
              return (
                <li key={t.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      applyTheme(t.id)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      active ? 'bg-accent/10' : 'hover:bg-card'
                    }`}
                  >
                    <Swatch id={t.id} />
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-medium ${active ? 'text-fg' : 'text-fg-2'}`}>{t.label}</span>
                      <span className="block text-[11px] text-fg-3 truncate">{t.note}</span>
                    </span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A 4-stop swatch scoped to the theme it represents (data-theme on the swatch). */
function Swatch({ id }: { id: ThemeId }) {
  return (
    <span
      data-theme={id}
      aria-hidden="true"
      className="grid grid-cols-2 w-5 h-5 rounded-[5px] overflow-hidden border border-line-strong shrink-0"
      style={{ background: 'var(--nx-canvas)' }}
    >
      <i style={{ background: 'var(--nx-canvas)' }} />
      <i style={{ background: 'var(--nx-card-strong)' }} />
      <i style={{ background: 'var(--nx-accent)' }} />
      <i style={{ background: 'var(--nx-cta)' }} />
    </span>
  )
}
