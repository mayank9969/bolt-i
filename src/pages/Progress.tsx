import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory } from '@/api/quizApi'
import type { HistoryEntry } from '@/types/quiz'
import { useWorld } from '@/components/three/world'
import Reveal from '@/components/Reveal'
import { formatPercent, labelCategory } from '@/lib/format'
import { normaliseCategoryId } from '@/lib/categories'
import { useQuiz } from '@/context/QuizContext'
import { launchSitting, mixedFive } from '@/lib/launchSitting'

export default function Progress() {
  useWorld({ mode: 'quiet' })
  const navigate = useNavigate()
  const { beginSession } = useQuiz()
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
  }, [])

  const stats = useMemo(() => {
    const h = history ?? []
    const score = h.reduce((s, x) => s + x.score, 0)
    const marks = h.reduce((s, x) => s + x.total_marks, 0)
    const byCat: Record<string, { score: number; marks: number; pcts: number[] }> = {}
    const cats = new Set<string>()
    let perfect = false
    h.forEach((a) => {
      const id = normaliseCategoryId(a.category)
      if (id && id !== 'all' && id !== 'mixed') cats.add(id)
      const slot = (byCat[id] ??= { score: 0, marks: 0, pcts: [] })
      slot.score += a.score
      slot.marks += a.total_marks
      slot.pcts.push(a.percentage)
      if (a.total_marks > 0 && a.score >= a.total_marks) perfect = true
    })
    const weakest = Object.entries(byCat)
      .filter(([, v]) => v.marks > 0)
      .sort((a, b) => a[1].score / a[1].marks - b[1].score / b[1].marks)[0]
    const comeback = Object.values(byCat).some((v) => v.pcts.length >= 2 && v.pcts[v.pcts.length - 1] > v.pcts[0])
    return {
      n: h.length,
      overall: marks ? (score / marks) * 100 : 0,
      byCat,
      weakest: weakest?.[0] ?? null,
      milestones: [
        { name: 'First quiz', detail: 'A scored sitting in the engine.', achieved: h.length > 0 },
        { name: 'Perfect round', detail: 'Full marks on one sitting.', achieved: perfect },
        { name: 'Subject explorer', detail: 'Scored sittings in three islands.', achieved: cats.size >= 3 },
        { name: 'Comeback', detail: 'Later sitting on an island beat an earlier one.', achieved: comeback },
        { name: 'Ten sittings', detail: 'Ten scored attempts in History.', achieved: h.length >= 10 },
      ],
    }
  }, [history])

  const sitWeak = async () => {
    if (!stats.weakest) return
    setBusy(true)
    await launchSitting(
      mixedFive(stats.weakest),
      beginSession,
      () => navigate('/quiz'),
      (config) => navigate('/setup', { state: config }),
    )
    setBusy(false)
  }

  return (
    <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 archive-ed">
      <Reveal>
        <p className="ed-eyebrow">History · progress</p>
        <h1 className="ed-display mt-4 text-balance">What history shows.</h1>
        <p className="ed-lede mt-5">
          Engine sittings only. Numbers in teal. The recommended five is the island that still needs the most light.
        </p>
      </Reveal>
      {error && <p className="mt-6 text-warm-text">{error}</p>}

      <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-4">
        <p>
          <span className="block t-caption text-fg-3">Attempts</span>
          <span className="num text-accent text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-none">{stats.n}</span>
        </p>
        <p>
          <span className="block t-caption text-fg-3">Overall</span>
          <span className="num text-accent text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-none">
            {formatPercent(stats.overall)}
          </span>
        </p>
        {stats.weakest && (
          <button type="button" className="btn-primary btn-sm mt-2" disabled={busy} onClick={() => void sitWeak()}>
            {busy ? 'Opening…' : `Sit five · ${labelCategory(stats.weakest)}`}
          </button>
        )}
      </div>

      <ul className="mt-12 grid gap-1">
        {Object.entries(stats.byCat).map(([id, v]) => {
          const pct = v.marks ? (v.score / v.marks) * 100 : 0
          return (
            <li key={id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-b border-line py-4">
              <span className="text-fg font-medium">{labelCategory(id)}</span>
              <span className="num text-accent font-semibold">{v.marks ? formatPercent(pct) : '—'}</span>
              <span className="col-span-2 h-1.5 rounded-full bg-line overflow-hidden">
                <span className="block h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
              </span>
            </li>
          )
        })}
      </ul>

      <h2 className="ed-display mt-16 text-[clamp(1.6rem,3vw,2.1rem)]">Learning milestones</h2>
      <ul className="mt-6 grid sm:grid-cols-2 gap-3">
        {stats.milestones.map((m) => (
          <li key={m.name} className="rounded-xl border border-line px-4 py-4">
            <p className="font-medium text-fg">
              <span className={m.achieved ? 'text-accent' : 'text-fg-3'}>{m.achieved ? '✓' : '·'}</span> {m.name}
            </p>
            <p className="t-meta text-fg-2 mt-1">{m.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
