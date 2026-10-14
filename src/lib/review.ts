import type { HistoryEntry } from '@/types/quiz'
import { normaliseCategoryId } from './categories'

/**
 * "Worth revisiting" — derived ONLY from real history returned by GET /api/history.
 *
 * A category is worth revisiting when its most recent attempt (highest attempt
 * number) still had wrong answers. 'all' / 'mixed' attempts are skipped because
 * they do not identify one region. Returned most-wrong first. Empty history →
 * empty list → the loom shows no terracotta at all (nothing is invented).
 */
export interface ReviewTopic {
  id: string
  wrong: number
  percentage: number
  attempt: number
}

export function reviewTopics(history: HistoryEntry[] | null | undefined): ReviewTopic[] {
  if (!history || history.length === 0) return []
  const latest = new Map<string, HistoryEntry>()
  for (const h of history) {
    if (h.category === 'all' || h.category === 'mixed') continue
    const id = normaliseCategoryId(h.category)
    const prev = latest.get(id)
    if (!prev || h.attempt > prev.attempt) latest.set(id, h)
  }
  const out: ReviewTopic[] = []
  latest.forEach((h, id) => {
    if (h.wrong_answers > 0) out.push({ id, wrong: h.wrong_answers, percentage: h.percentage, attempt: h.attempt })
  })
  return out.sort((a, b) => b.wrong - a.wrong || a.percentage - b.percentage)
}
