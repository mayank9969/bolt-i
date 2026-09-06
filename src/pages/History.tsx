import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getHistory } from '@/api/quizApi'
import type { HistoryEntry } from '@/types/quiz'
import Reveal from '@/components/Reveal'
import TrendChart from '@/components/TrendChart'
import { CategoryBreakdown, DifficultyBreakdown } from '@/components/Breakdowns'
import Tier from '@/components/ui/Tier'
import { ArrowRight, Cross } from '@/components/ui/Icons'
import { useNetwork } from '@/components/three/store'
import { formatPercent, formatScore, labelCategory, performanceTone, toneText } from '@/lib/format'

type Filter = 'all' | string
const ease = [0.22, 1, 0.36, 1] as const

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
  }, [])

  // The engine has stored both 'math' and 'maths' over time — group them under one label for filtering/display.
  const norm = (c: string) => (c === 'math' ? 'maths' : c)
  const categories = useMemo(() => Array.from(new Set((history ?? []).map((h) => norm(h.category)).filter((c) => c !== 'all'))), [history])
  const visible = useMemo(() => (history ?? []).filter((h) => filter === 'all' || norm(h.category) === filter), [history, filter])
  const newestFirst = useMemo(() => [...visible].reverse(), [visible])

  const stats = useMemo(() => {
    const n = visible.length
    const avg = n ? visible.reduce((s, h) => s + h.percentage, 0) / n : 0
    const q = visible.reduce((s, h) => s + h.total_questions, 0)
    const c = visible.reduce((s, h) => s + h.correct_answers, 0)
    const best = n ? Math.max(...visible.map((h) => h.percentage)) : 0
    return { n, avg, q, c, best, accuracy: q ? (c / q) * 100 : 0 }
  }, [visible])

  // HISTORY — accumulated: each region is "established" in proportion to real practice there.
  // weight = attempts in that region (saturating) × mean accuracy; 'all'/mixed attempts feed the bridge region.
  const weights = useMemo<[number, number, number]>(() => {
    if (!history || history.length === 0) return [0, 0, 0]
    const ids = [categories[0], categories[1]]
    const w = (pred: (h: HistoryEntry) => boolean) => {
      const items = history.filter(pred)
      if (!items.length) return 0
      const acc = items.reduce((s, h) => s + h.percentage, 0) / items.length / 100
      const sat = 1 - Math.exp(-items.length / 4)
      return Math.min(1, 0.15 + sat * 0.55 + acc * 0.3)
    }
    return [ids[0] ? w((h) => norm(h.category) === ids[0]) : 0, ids[1] ? w((h) => norm(h.category) === ids[1]) : 0, w((h) => h.category === 'all' || h.category === 'mixed')]
  }, [history, categories])

  useNetwork(
    {
      mode: 'accumulated',
      camera: 'archive',
      density: 0.5 + Math.min(1, (history?.length ?? 0) / 20) * 0.5,
      activation: stats.avg / 100,
      clusterWeights: history && history.length ? weights : null,
      focusCluster: filter === 'all' ? -1 : Math.min(1, categories.indexOf(filter)),
      clusterLabels: [labelCategory(categories[0] ?? 'maths'), labelCategory(categories[1] ?? 'python'), 'Mixed'],
    },
    [history, weights, filter, categories],
  )

  return (
    <div className="relative flex-1">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* ── Header ──────────────────────────────────────── */}
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-x-10 gap-y-8 items-end">
            <div className="lg:col-span-8">
              <span className="opener">Accumulated knowledge</span>
              <h1 className="t-title text-fg mt-5 text-balance">
                {history && history.length ? (
                  <>
                    <span className="num">{history.length}</span> attempt{history.length === 1 ? '' : 's'}, <span className="t-italic">and the network remembers each one.</span>
                  </>
                ) : (
                  <>Your history</>
                )}
              </h1>
            </div>
            {categories.length > 0 && (
              <div className="lg:col-span-4 flex lg:justify-end">
                <div role="tablist" aria-label="Filter by region" className="flex items-center gap-1 border border-line-strong rounded-full p-1 bg-canvas/80 backdrop-blur-sm shadow-card">
                  {(['all', ...categories] as Filter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f)}
                      className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'text-fg' : 'text-fg-2 hover:text-fg'}`}
                    >
                      {filter === f && <motion.span layoutId="history-filter" className="absolute inset-0 rounded-full bg-selected/10 border border-selected" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      <span className="relative z-10">{f === 'all' ? 'All' : labelCategory(f)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {error ? (
          <div className="surface-strong rounded-2xl p-10 mt-12 text-center" role="alert">
            <div className="w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center bg-err/10 text-err">
              <Cross className="w-5 h-5" />
            </div>
            <p className="text-fg font-medium">{error}</p>
            <p className="text-fg-2 text-sm mt-2">Make sure the NEXUSQuiz server is running, then reload.</p>
          </div>
        ) : history === null ? (
          <div className="grid sm:grid-cols-4 gap-px mt-12 border-t border-line">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 skeleton" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Reveal>
            <div className="mt-16 grid lg:grid-cols-12 gap-8 border-t border-line-strong pt-10">
              <p className="lg:col-span-2 index">Empty</p>
              <div className="lg:col-span-10">
                <h2 className="t-section text-fg">Nothing lit yet.</h2>
                <p className="text-fg-2 mt-4 max-w-md text-pretty">Your first quiz will show up here, and the network will start remembering which regions you have practised.</p>
                <Link to="/setup" className="btn-primary btn-lg mt-8">
                  Start your first quiz <ArrowRight className="arrow w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            {/* ── Ledger of big numbers ─────────────────────── */}
            <Reveal delay={0.05}>
              <dl className="mt-14 grid grid-cols-2 lg:grid-cols-4 border-t border-line-strong">
                <Big label="Quizzes taken" value={String(stats.n)} />
                <Big label="Average score" value={formatPercent(stats.avg, 1)} tone={performanceTone(stats.avg)} />
                <Big label="Overall accuracy" value={formatPercent(stats.accuracy, 0)} sub={`${stats.c} / ${stats.q} correct`} />
                <Big label="Best result" value={formatPercent(stats.best, 1)} tone={performanceTone(stats.best)} />
              </dl>
            </Reveal>

            {/* ── Regions established (drives the network) ─── */}
            <Reveal delay={0.08}>
              <div className="mt-16 grid lg:grid-cols-12 gap-x-10 gap-y-6">
                <div className="lg:col-span-4">
                  <span className="index">01 — Regions</span>
                  <h2 className="t-section text-fg mt-3">Established knowledge</h2>
                  <p className="text-sm text-fg-2 mt-3 max-w-sm text-pretty">How settled each region of the network is — attempts there, weighted by accuracy. This is exactly what lights the scene behind you.</p>
                </div>
                <ul className="lg:col-span-8 border-t border-line">
                  {[
                    [labelCategory(categories[0] ?? 'maths'), weights[0], history.filter((h) => norm(h.category) === categories[0]).length],
                    [labelCategory(categories[1] ?? 'python'), weights[1], history.filter((h) => norm(h.category) === categories[1]).length],
                    ['Mixed', weights[2], history.filter((h) => h.category === 'all' || h.category === 'mixed').length],
                  ].map(([name, w, n], i) => (
                    <li key={String(name)} className="grid grid-cols-[1fr_auto] sm:grid-cols-[10rem_1fr_auto] items-center gap-x-6 gap-y-2 py-5 border-b border-line">
                      <span className="t-h3 text-fg">{String(name)}</span>
                      <div className="col-span-2 sm:col-span-1 h-px bg-line-strong relative">
                        <motion.span
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: Number(w) }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.1, delay: i * 0.1, ease }}
                          className="absolute inset-y-[-1px] left-0 right-0 origin-left bg-accent"
                        />
                        {/* nodes along the line: one per attempt (max 12) */}
                        {Array.from({ length: Math.min(12, Number(n)) }, (_, k) => (
                          <span key={k} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" style={{ left: `${((k + 1) / 13) * Number(w) * 100}%` }} />
                        ))}
                      </div>
                      <span className="text-right t-caption text-fg-2 num sm:w-24">
                        {Number(n)} {Number(n) === 1 ? 'attempt' : 'attempts'}
                        <span className="block figcap mt-0.5">{Math.round(Number(w) * 100)}% set</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* ── Trend + breakdowns, ruled columns ─────────── */}
            <Reveal delay={0.1}>
              <div className="mt-16 grid lg:grid-cols-12 gap-x-10 gap-y-10">
                <div className="lg:col-span-4">
                  <span className="index">02 — Trend</span>
                  <h2 className="t-section text-fg mt-3">Over time</h2>
                </div>
                <div className="lg:col-span-8 grid md:grid-cols-5 gap-x-10 gap-y-10">
                  <div className="md:col-span-3 border-t border-line">
                    <TrendChart history={visible} />
                  </div>
                  <div className="md:col-span-2 grid gap-8">
                    <div className="border-t border-line">
                      <CategoryBreakdown history={visible} />
                    </div>
                    <div className="border-t border-line">
                      <DifficultyBreakdown history={visible} />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ── Attempts ──────────────────────────────────── */}
            <div className="mt-20 grid lg:grid-cols-12 gap-x-10">
              <Reveal className="lg:col-span-4">
                <span className="index">03 — Attempts</span>
                <h2 className="t-section text-fg mt-3">Every session</h2>
                <p className="t-caption text-fg-3 mt-3 num">{newestFirst.length} shown · newest first</p>
              </Reveal>
              <ol className="lg:col-span-8 border-t border-line-strong mt-6 lg:mt-0">
                {newestFirst.map((h, i) => {
                  const tone = performanceTone(h.percentage)
                  return (
                    <motion.li
                      key={h.attempt}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.4, ease }}
                      className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_7rem_7rem_6rem] items-center gap-x-4 gap-y-1 py-4 border-b border-line hover:bg-hover -mx-3 px-3 rounded-lg transition-colors"
                    >
                      <span className="t-caption text-fg-3 num">{String(h.attempt).padStart(2, '0')}</span>
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="t-h3 text-fg truncate">{labelCategory(h.category)}</span>
                        <Tier difficulty={h.difficulty} />
                      </div>
                      <span className="hidden sm:block text-sm text-fg-2 num">{h.correct_answers} / {h.total_questions} right</span>
                      <span className="hidden sm:block text-sm text-fg-2 num">{formatScore(h.score)} / {formatScore(h.total_marks)}</span>
                      <span className="text-right">
                        <span className={`t-h3 num ${toneText[tone]}`}>{formatPercent(h.percentage, 1)}</span>
                      </span>
                      <span className="col-start-2 col-span-2 sm:hidden t-caption text-fg-2 num">
                        {h.correct_answers} / {h.total_questions} right · {formatScore(h.score)} / {formatScore(h.total_marks)} marks
                      </span>
                    </motion.li>
                  )
                })}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Big({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: ReturnType<typeof performanceTone> }) {
  return (
    <div className="py-6 pr-6 border-b border-line lg:border-b-0 lg:border-r last:border-r-0 last:pr-0 lg:pl-6 first:pl-0">
      <dt className="figcap">{label}</dt>
      <dd className={`t-stat mt-3 num ${tone ? toneText[tone] : 'text-fg'}`}>{value}</dd>
      {sub && <dd className="t-caption text-fg-3 mt-2 num">{sub}</dd>}
    </div>
  )
}
