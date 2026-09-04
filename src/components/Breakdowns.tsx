import { motion } from 'framer-motion'
import type { HistoryEntry } from '@/types/quiz'
import { difficultyLevel, formatPercent, labelCategory, performanceTone, toneBg, toneText } from '@/lib/format'

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
      <h3 className="font-display text-lg text-fg">By topic</h3>
      <p className="text-xs text-fg-3 mt-0.5 mb-5">Attempts and average accuracy</p>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.id}>
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-fg font-medium">{labelCategory(r.id)}</span>
              <span className="text-fg-2 num text-xs">
                {r.count} {r.count === 1 ? 'quiz' : 'quizzes'} · <span className={toneText[performanceTone(r.avg)]}>{formatPercent(r.avg, 0)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full track">
              <motion.div
                className="h-full rounded-full fill"
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

  return (
    <div className="surface rounded-2.5xl p-5 sm:p-6 h-full">
      <h3 className="font-display text-lg text-fg">By difficulty</h3>
      <p className="text-xs text-fg-3 mt-0.5 mb-5">Where you spend your time</p>
      <div className="flex items-end gap-4 h-36">
        {data.map((d, i) => (
          <div key={d.t} className="flex-1 flex flex-col items-center gap-2 h-full">
            <span className={`text-xs font-medium num ${toneText[performanceTone(d.avg)]}`}>{formatPercent(d.avg, 0)}</span>
            <div className="w-full flex-1 flex items-end">
              <motion.div
                className={`w-full rounded-t-lg ${toneBg[performanceTone(d.avg)]} opacity-70`}
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max((d.count / max) * 100, 10)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-[11px] text-fg-2 capitalize inline-flex items-center gap-1.5">
              <span className="tier text-fg-2" data-level={difficultyLevel(d.t)} aria-hidden="true"><i /><i /><i /></span>
              {d.t} <span className="text-fg-3">· {d.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
