import type { Difficulty } from '@/types/quiz'
import { categoryLabel } from '@/lib/categories'

export function formatPercent(p: number, decimals = 1): string {
  const rounded = Math.round(p * 10 ** decimals) / 10 ** decimals
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(decimals)}%`
}

export function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function labelCategory(id: string): string {
  return categoryLabel(id)
}

export function labelDifficulty(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

/**
 * Difficulty is shown as *intensity* (1–3 lit segments), not as a
 * green/amber/red rainbow. Colour is reserved for performance.
 */
export function difficultyLevel(d: string): '1' | '2' | '3' | 'mixed' {
  if (d === 'easy') return '1'
  if (d === 'medium') return '2'
  if (d === 'hard') return '3'
  return 'mixed'
}

/** Performance tone — the only place the semantic palette drives a number. */
export type Tone = 'success' | 'warning' | 'error' | 'accent' | 'neutral'

export function performanceTone(pct: number): Tone {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

export const toneText: Record<Tone, string> = {
  success: 'text-ok',
  warning: 'text-warn',
  error: 'text-err',
  accent: 'text-accent',
  neutral: 'text-fg',
}
export const toneBg: Record<Tone, string> = {
  success: 'bg-ok',
  warning: 'bg-warn',
  error: 'bg-err',
  accent: 'bg-accent',
  neutral: 'bg-fg',
}
/** CSS colour expression for inline styles / SVG (theme-aware). */
export const toneVar: Record<Tone, string> = {
  success: 'var(--nx-success)',
  warning: 'var(--nx-warning)',
  error: 'var(--nx-error)',
  accent: 'var(--nx-accent)',
  neutral: 'var(--nx-text)',
}
export const toneSoftVar: Record<Tone, string> = {
  success: 'var(--nx-success-soft)',
  warning: 'var(--nx-warning-soft)',
  error: 'var(--nx-error-soft)',
  accent: 'var(--nx-accent-soft)',
  neutral: 'var(--nx-card)',
}
