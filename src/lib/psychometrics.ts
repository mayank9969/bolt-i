import type { HistoryEntry } from '@/types/quiz'

/** z for ~95% Wilson interval */
const Z95 = 1.96

export type Interval = { p: number; lo: number; hi: number }

export function wilson(successes: number, n: number, z = Z95): Interval | null {
  if (n <= 0) return null
  const p = successes / n
  const z2 = z * z
  const den = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)
  return { p, lo: Math.max(0, (centre - margin) / den), hi: Math.min(1, (centre + margin) / den) }
}

/** Laplace / Beta(1,1) posterior mean — shrinks sparse proportions toward 0.5 */
export function bayesSmooth(successes: number, n: number, alpha = 1, beta = 1): number | null {
  if (n < 0) return null
  return (alpha + successes) / (alpha + beta + n)
}

export function rollingAverage(values: number[], window: number): number[] {
  if (window <= 0) return []
  return values.map((_, i) => {
    const from = Math.max(0, i - window + 1)
    const slice = values.slice(from, i + 1)
    return slice.reduce((s, x) => s + x, 0) / slice.length
  })
}

export function describe(values: number[]) {
  const n = values.length
  if (!n) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((s, x) => s + x, 0) / n
  const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / n
  const sd = Math.sqrt(variance)
  const q = (p: number) => {
    const idx = (n - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return sorted[lo]
    return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo)
  }
  return {
    n,
    mean,
    sd,
    min: sorted[0],
    max: sorted[n - 1],
    median: q(0.5),
    q1: q(0.25),
    q3: q(0.75),
  }
}

export type CttBand = {
  difficulty: 'easy' | 'medium' | 'hard'
  n: number
  p: number
  discrimination: number | null
}

/**
 * Classical Test Theory on sittings grouped by the engine's difficulty label.
 * Difficulty index p = proportion correct. Discrimination = upper–lower
 * difference (high vs low overall sittings) when at least 4 sittings exist
 * in that band. No invented items.
 */
export function cttByDifficulty(history: HistoryEntry[]): CttBand[] {
  const bands = ['easy', 'medium', 'hard'] as const
  const out: CttBand[] = []
  for (const d of bands) {
    const items = history.filter((h) => h.difficulty === d && h.total_questions > 0)
    if (!items.length) continue
    const correct = items.reduce((s, h) => s + h.correct_answers, 0)
    const total = items.reduce((s, h) => s + h.total_questions, 0)
    const p = total ? correct / total : 0
    let discrimination: number | null = null
    if (items.length >= 4) {
      const ranked = [...items].sort((a, b) => a.percentage - b.percentage)
      const cut = Math.max(1, Math.floor(ranked.length / 3))
      const low = ranked.slice(0, cut)
      const high = ranked.slice(-cut)
      const pOf = (xs: HistoryEntry[]) => {
        const t = xs.reduce((s, h) => s + h.total_questions, 0)
        const c = xs.reduce((s, h) => s + h.correct_answers, 0)
        return t ? c / t : 0
      }
      discrimination = pOf(high) - pOf(low)
    }
    out.push({ difficulty: d, n: items.length, p, discrimination })
  }
  return out
}

/** 1PL needs a person × item matrix. Attempt rows alone are not enough. */
export function irtReady(history: HistoryEntry[]): { ready: boolean; reason: string } {
  const n = history.length
  if (n < 30) {
    return {
      ready: false,
      reason: `Item Response Theory needs a person-by-item matrix and a stable sample. ${n} sitting${n === 1 ? '' : 's'} is not enough for reliable calibration, so IRT is withheld.`,
    }
  }
  return {
    ready: false,
    reason:
      'The engine stores sitting totals, not per-question response vectors. IRT stays off until item-level answers exist for calibration.',
  }
}

export function sittingSeries(history: HistoryEntry[]) {
  const chronological = [...history].sort((a, b) => a.attempt - b.attempt)
  const pct = chronological.map((h) => h.percentage)
  const roll = rollingAverage(pct, 5)
  const correct = chronological.reduce((s, h) => s + h.correct_answers, 0)
  const total = chronological.reduce((s, h) => s + h.total_questions, 0)
  return {
    chronological,
    pct,
    roll,
    wilson: wilson(correct, total),
    describe: describe(pct),
    bayesOverall: total ? bayesSmooth(correct, total) : null,
    correct,
    total,
  }
}

export function sparseSubjects(history: HistoryEntry[], norm: (id: string) => string) {
  const map = new Map<string, { c: number; t: number; n: number }>()
  history.forEach((h) => {
    const id = norm(h.category)
    if (!id || id === 'all') return
    const slot = map.get(id) ?? { c: 0, t: 0, n: 0 }
    slot.c += h.correct_answers
    slot.t += h.total_questions
    slot.n += 1
    map.set(id, slot)
  })
  return [...map.entries()].map(([id, v]) => ({
    id,
    n: v.n,
    raw: v.t ? v.c / v.t : 0,
    smoothed: bayesSmooth(v.c, v.t) ?? 0,
    sparse: v.n < 4 || v.t < 20,
  }))
}
