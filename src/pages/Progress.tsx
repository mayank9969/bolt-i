import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory } from '@/api/quizApi'
import type { HistoryEntry } from '@/types/quiz'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { formatPercent, labelCategory } from '@/lib/format'
import { normaliseCategoryId } from '@/lib/categories'

export default function Progress() {
  useWorld({ mode: 'quiet' })
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
  }, [])

  const stats = useMemo(() => {
    const h = history ?? []
    const score = h.reduce((s, x) => s + x.score, 0)
    const marks = h.reduce((s, x) => s + x.total_marks, 0)
    const byCat: Record<string, { score: number; marks: number }> = {}
    const cats = new Set<string>()
    let perfect = false
    h.forEach((a) => {
      const id = normaliseCategoryId(a.category)
      if (id && id !== 'all' && id !== 'mixed') cats.add(id)
      const slot = (byCat[id] ??= { score: 0, marks: 0 })
      slot.score += a.score
      slot.marks += a.total_marks
      if (a.total_marks > 0 && a.score >= a.total_marks) perfect = true
    })
    const weakest = Object.entries(byCat)
      .filter(([, v]) => v.marks > 0)
      .sort((a, b) => a[1].score / a[1].marks - b[1].score / b[1].marks)[0]
    return {
      n: h.length,
      overall: marks ? (score / marks) * 100 : 0,
      byCat,
      weakest: weakest?.[0] ?? null,
      milestones: [
        { name: 'First quiz', detail: 'Complete your first quiz.', achieved: h.length > 0 },
        { name: 'Perfect round', detail: 'Finish a quiz with full marks.', achieved: perfect },
        { name: 'Subject explorer', detail: 'Answer questions in three categories.', achieved: cats.size >= 3 },
        { name: 'Comeback', detail: 'Needs per-question review from the engine.', achieved: false },
        { name: 'Three-day challenge streak', detail: 'Complete daily challenges on three consecutive days.', achieved: false },
      ],
    }
  }, [history])

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
      <Reveal>
        <p className="opener">
          <span>Progress</span>
        </p>
        <h1 className="t-hero text-fg mt-4">What the archive shows.</h1>
      </Reveal>
      {error && <p className="mt-6 text-warm-text">{error}</p>}
      <p className="t-lead text-fg-2 mt-6">
        {stats.n} attempts · overall {formatPercent(stats.overall)}
      </p>
      {stats.weakest && (
        <p className="mt-4 text-fg-2">
          Recommended next:{' '}
          <Link className="link-rule" to="/setup" state={{ category: stats.weakest }}>
            {labelCategory(stats.weakest)}
          </Link>
        </p>
      )}
      <ul className="mt-8 grid gap-2">
        {Object.entries(stats.byCat).map(([id, v]) => (
          <li key={id} className="flex justify-between border-b border-line py-3">
            <span>{labelCategory(id)}</span>
            <span className="t-meta">{v.marks ? formatPercent((v.score / v.marks) * 100) : '—'}</span>
          </li>
        ))}
      </ul>
      <h2 className="t-title text-fg mt-12">Learning milestones</h2>
      <ul className="mt-4 grid gap-3">
        {stats.milestones.map((m) => (
          <li key={m.name} className="rounded-xl border border-line p-4">
            <p className="font-medium text-fg">
              {m.achieved ? '✓' : '·'} {m.name}
            </p>
            <p className="t-meta text-fg-2 mt-1">{m.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
