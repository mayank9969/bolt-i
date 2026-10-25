import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from '@/components/ui/Icons'
import { categoryLabel, normaliseCategoryId } from '@/lib/categories'
import { getCategories, getHistory } from '@/api/quizApi'
import type { CategoriesResponse, HistoryEntry } from '@/types/quiz'
import { reviewTopics } from '@/lib/review'
import { formatPercent, labelCategory } from '@/lib/format'
import ArchipelagoStage from '@/components/three/ArchipelagoStage'
import { getWorld, setWorld, useWorld, useWorldSlice } from '@/components/three/world'


export default function Home() {
  const [catalog, setCatalog] = useState<CategoriesResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)

  useEffect(() => {
    getCategories().then(setCatalog).catch(() => setCatalog(null))
    getHistory().then(setHistory).catch(() => setHistory(null))
  }, [])
  const review = useMemo(() => reviewTopics(history), [history])

  const cats = catalog?.categories ?? []
  const [hover, setHover] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  useWorldSlice((s) => s.hover, setHover)
  useWorldSlice((s) => s.selected, setSelected)
  useWorld({ mode: 'hero' })

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const dueNames = review.slice(0, 3).map((r) => categoryLabel(r.id)).join(', ')
  const byCat = useMemo(() => {
    const map: Record<string, { score: number; marks: number }> = {}
    ;(history ?? []).forEach((h) => {
      const id = normaliseCategoryId(h.category)
      if (!id || id === 'all' || id === 'mixed') return
      const s = (map[id] ??= { score: 0, marks: 0 })
      s.score += h.score
      s.marks += h.total_marks
    })
    return Object.entries(map)
      .map(([id, v]) => ({ id, pct: v.marks ? (v.score / v.marks) * 100 : 0 }))
      .sort((a, b) => a.pct - b.pct)
  }, [history])

  const lead = !history
    ? 'Loading your archive…'
    : review.length
      ? `${review.length} island${review.length === 1 ? '' : 's'} still have wrong answers from your latest attempt${dueNames ? `: ${dueNames}` : ''}.`
      : history.length
        ? 'Nothing is marked due. Your sittings are in the archive — start a fresh quiz when you want one.'
        : 'Sit a quiz and this page will show what to review tomorrow. Nothing here is invented.'

  return (
    <div className="almanac relative">
      <section className="relative pt-6 pb-4">
        <div className="relative z-10 max-w-page mx-auto w-full px-5 sm:px-6 lg:px-8">
          <div className="almanac-hero">
            <div>
              <p className="almanac-kicker">
                {today}
                {history && history.length > 0 ? ` · ${history.length} attempt${history.length === 1 ? '' : 's'} on record` : ''}
              </p>
              <h1 className="almanac-display">
                What you’ll
                <br />
                <span className="acc">remember</span>
                <br />
                tomorrow.
              </h1>
              <p className="almanac-lead">{lead}</p>
              {review.length > 0 ? (
                <Link className="almanac-btn" to="/setup" state={{ category: review[0].id }}>
                  Review {review.length} island{review.length === 1 ? '' : 's'} <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link className="almanac-btn" to="/setup">
                  Start a quiz <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link className="almanac-link" to="/setup">
                or start a fresh quiz
              </Link>
            </div>
            <div>
              <div className="mt-10">
                <p className="figcap mb-3 inline-flex items-center gap-3">
                  <span className="w-8 h-px bg-line-strong" />
                  The archipelago
                </p>
                <div
                  id="island-stage"
                  className="island-frame"
                  role="img"
                  aria-label="Knowledge archipelago — click an island to enter its exhibit."
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a, canvas, .veyra-html-root, #stage')) return
                    const id = getWorld().hover
                    if (id) setWorld({ selected: id, hover: id, beat: 0 })
                    else setWorld({ explore: true })
                  }}
                >
                  <ArchipelagoStage />
                </div>
              </div>
              <p className="almanac-legend">paper = your regions · terracotta = worth revisiting · teal paths = studied together</p>
            </div>
          </div>

          <hr className="my-10 border-line" />
          <p className="almanac-kicker mb-4">Today</p>
          <ul className="almanac-grid">
            <li className="almanac-card">
              <p className="almanac-kicker">Daily challenge</p>
              <h3 className="text-xl font-bold mt-2 text-fg">5 questions, mixed for today</h3>
              <p className="text-fg-2 text-sm mt-2 mb-4">The same length as newest.py’s daily five. The engine draws live questions.</p>
              <Link className="almanac-btn" to="/setup" state={{ category: 'all', difficulty: 'mixed', questionCount: 5, daily: true }}>
                Start →
              </Link>
            </li>
            <li className="almanac-card">
              <p className="almanac-kicker">Smart review</p>
              <h3 className="text-xl font-bold mt-2 text-fg">
                {review.length ? `${review.length} island${review.length === 1 ? '' : 's'} with leftover misses` : 'Nothing due from history'}
              </h3>
              <p className="text-fg-2 text-sm mt-2 mb-4">Based only on your latest attempt per island.</p>
              <Link className="almanac-btn" to="/progress">
                Review →
              </Link>
            </li>
            <li className="almanac-card">
              <p className="almanac-kicker">Missed questions</p>
              <h3 className="text-xl font-bold mt-2 text-fg">
                {review.reduce((s, r) => s + r.wrong, 0) || 0} wrong answers on latest sittings
              </h3>
              <p className="text-fg-2 text-sm mt-2 mb-4">The engine cannot yet replay a specific miss list without an API change.</p>
              <Link className="almanac-btn" to="/setup">
                Practise →
              </Link>
            </li>
          </ul>

          {byCat.length > 0 && (
            <>
              <hr className="my-10 border-line" />
              <div className="flex justify-between items-baseline gap-4">
                <p className="almanac-kicker">Retention by region</p>
                <Link to="/progress" className="almanac-link" style={{ marginLeft: 0 }}>
                  Progress →
                </Link>
              </div>
              <ul className="grid sm:grid-cols-2 gap-4 mt-4">
                {byCat.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <div className="flex justify-between text-sm">
                      <span>{labelCategory(r.id)}</span>
                      <span className="num">{formatPercent(r.pct, 0)}</span>
                    </div>
                    <div className={`almanac-bar ${r.pct < 60 ? 'low' : ''}`}>
                      <i style={{ width: `${Math.max(4, Math.min(100, r.pct))}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {cats.length > 0 && (
            <div className="category-dock mt-10">
              <div className="flex items-center justify-between gap-6 figcap mb-3">
                <span className="inline-flex items-center gap-3 min-w-0">
                  <span className="w-8 h-px bg-line-strong shrink-0" />
                  <span className="truncate">{cats.length} categories</span>
                </span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {cats.map((c) => {
                  const on = hover === c.id || selected === c.id
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="dock-chip"
                        aria-pressed={on}
                        onMouseEnter={() => setWorld({ hover: c.id })}
                        onMouseLeave={() => setWorld({ hover: selected })}
                        onClick={() => setWorld({ selected: c.id, hover: c.id, beat: 0 })}
                      >
                        {labelCategory(c.id)}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
