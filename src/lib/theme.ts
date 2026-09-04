/**
 * Theme registry + helpers.
 * Colours live in src/styles/tokens.css; this file only switches
 * `data-theme` and lets JS (SVG, WebGL) read the resolved tokens.
 */

export const THEMES = [
  { id: 'paper', label: 'Paper', note: 'Warm ivory · ink · vermilion' },
  { id: 'ink', label: 'Ink', note: 'Charcoal · bone · ember' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'paper'
const STORAGE_KEY = 'nexusquiz.theme'
const EVENT = 'nx-theme'

export function isTheme(v: unknown): v is ThemeId {
  return typeof v === 'string' && THEMES.some((t) => t.id === v)
}

export function getTheme(): ThemeId {
  const attr = document.documentElement.getAttribute('data-theme')
  return isTheme(attr) ? attr : DEFAULT_THEME
}

export function applyTheme(id: ThemeId, persist = true) {
  document.documentElement.setAttribute('data-theme', id)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = readToken('--nx-canvas')
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* private mode — ignore */
    }
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }))
}

/** Called once before first paint (main.tsx). */
export function initTheme() {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  // Legacy ids from the first token system map onto the two current systems.
  const legacy: Record<string, ThemeId> = { editorial: 'paper', obsidian: 'ink', oxblood: 'ink', acid: 'ink', mono: 'ink' }
  const resolved = isTheme(stored) ? stored : stored && legacy[stored] ? legacy[stored] : DEFAULT_THEME
  applyTheme(resolved, false)
}

export function onThemeChange(cb: (id: ThemeId) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<ThemeId>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}

/** Resolved value of a CSS custom property on <html>, trimmed. */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** `--nx-accent-rgb` → "255 106 60" → "#ff6a3c" (for WebGL / SVG attributes). */
export function tokenHex(name: string): string {
  const raw = readToken(name)
  const parts = raw.split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(Number)
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return '#' + parts.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')
  }
  return raw || '#000000'
}
