import { motion } from 'framer-motion'
import type { HistoryEntry } from '@/types/quiz'
import { formatPercent, labelCategory, toneBg, toneText } from '@/lib/format'

interface Props {
  history: HistoryEntry[]
}

export function CategoryBreakdown({ history }: Props) {
  const groups: Record<string, { count: number; pct: number }> = {}
  history.forEach((h) => {
    const g = (groups[h.category] ??= { count: 0, pct: 0 })
    g.count += 1
    g.pct += h.percentage
  })
  const rows = Object.entries(groups)
    .map(([id, g]) => ({ id, count: g.count, avg: g.pct / g.count }))
    .sort((a, b) => b.count - a.count)
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="surface rounded-2.5xl p-5 sm:p-6 h-full">
      <h3 className="font-display text-lg text-ink-50">By topic</h3>
      <p className="text-xs text-ink-500 mt-0.5 mb-5">Attempts and average accuracy</p>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.id}>
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-ink-100 font-medium">{labelCategory(r.id)}</span>
              <span className="text-ink-400 num text-xs">
                {r.count} {r.count === 1 ? 'quiz' : 'quizzes'} · <span className="text-accent-200">{formatPercent(r.avg, 0)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-900/80 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-300 to-accent-500"
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.count / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DifficultyBreakdown({ history }: Props) {
  const tiers = ['easy', 'medium', 'hard', 'mixed'] as const
  const data = tiers
    .map((t) => {
      const items = history.filter((h) => h.difficulty === t)
      return {
        t,
        count: items.length,
        avg: items.length ? items.reduce((s, h) => s + h.percentage, 0) / items.length : 0,
      }
    })
    .filter((d) => d.count > 0)
  const max = Math.max(...data.map((d) => d.count), 1)
  const tone = (t: string) => (t === 'easy' ? 'success' : t === 'medium' ? 'warning' : t === 'hard' ? 'danger' : 'accent')

  return (
    <div className="surface rounded-2.5xl p-5 sm:p-6 h-full">
      <h3 className="font-display text-lg text-ink-50">By difficulty</h3>
      <p className="text-xs text-ink-500 mt-0.5 mb-5">Where you spend your time</p>
      <div className="flex items-end gap-4 h-36">
        {data.map((d, i) => (
          <div key={d.t} className="flex-1 flex flex-col items-center gap-2 h-full">
            <span className={`text-xs font-medium num ${toneText[tone(d.t)]}`}>{formatPercent(d.avg, 0)}</span>
            <div className="w-full flex-1 flex items-end">
              <motion.div
                className={`w-full rounded-t-lg ${toneBg[tone(d.t)]} opacity-80`}
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max((d.count / max) * 100, 10)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-[11px] text-ink-400 capitalize">
              {d.t} <span className="text-ink-600">· {d.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
