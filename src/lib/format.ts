import type { Difficulty } from '@/types/quiz'

export function formatPercent(p: number, decimals = 1): string {
  const rounded = Math.round(p * 10 ** decimals) / 10 ** decimals
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(decimals)}%`
}

export function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function labelCategory(id: string): string {
  const map: Record<string, string> = {
    all: 'All Topics',
    maths: 'Maths',
    math: 'Maths',
    python: 'Python',
  }
  return map[id] ?? id.charAt(0).toUpperCase() + id.slice(1)
}

export function labelDifficulty(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

export function difficultyTone(d: string): 'success' | 'warning' | 'danger' | 'accent' {
  if (d === 'easy') return 'success'
  if (d === 'medium') return 'warning'
  if (d === 'hard') return 'danger'
  return 'accent'
}

export function performanceTone(pct: number): 'success' | 'warning' | 'danger' {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'danger'
}

export const toneText: Record<string, string> = {
  success: 'text-success-400',
  warning: 'text-warning-400',
  danger: 'text-danger-400',
  accent: 'text-accent-300',
}
export const toneBg: Record<string, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  accent: 'bg-accent-400',
}
export const toneHex: Record<string, string> = {
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  accent: '#2cc4f5',
}
