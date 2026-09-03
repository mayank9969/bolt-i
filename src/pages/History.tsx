import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getHistory } from '@/api/quizApi'
import type { HistoryEntry } from '@/types/quiz'
import Reveal from '@/components/Reveal'
import TrendChart from '@/components/TrendChart'
import { CategoryBreakdown, DifficultyBreakdown } from '@/components/Breakdowns'
import { ArrowRight, Clock, Code, Layers, Sigma } from '@/components/ui/Icons'
import {
  difficultyTone,
  formatPercent,
  formatScore,
  labelCategory,
  labelDifficulty,
  performanceTone,
  toneBg,
  toneText,
} from '@/lib/format'

type Filter = 'all' | string

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
  }, [])

  const categories = useMemo(() => Array.from(new Set((history ?? []).map((h) => h.category))), [history])
  const visible = useMemo(
    () => (history ?? []).filter((h) => filter === 'all' || h.category === filter),
    [history, filter],
  )
  const newestFirst = useMemo(() => [...visible].reverse(), [visible])

  const stats = useMemo(() => {
    const n = visible.length
    const avg = n ? visible.reduce((s, h) => s + h.percentage, 0) / n : 0
    const q = visible.reduce((s, h) => s + h.total_questions, 0)
    const c = visible.reduce((s, h) => s + h.correct_answers, 0)
    const best = n ? Math.max(...visible.map((h) => h.percentage)) : 0
    return { n, avg, q, c, best, accuracy: q ? (c / q) * 100 : 0 }
  }, [visible])

  return (
    <div className="relative flex-1">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* ── Header ──────────────────────────────────── */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="eyebrow">Progress</span>
              <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mt-3">Your history</h1>
              <p className="text-ink-300 mt-3 text-pretty max-w-lg">Every attempt, recorded by the NEXUS engine. Filter by topic to see how you’re trending.</p>
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-900/60 border border-ink-800/60 self-start md:self-auto">
                {(['all', ...categories] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'text-ink-50' : 'text-ink-400 hover:text-ink-100'}`}
                  >
                    {filter === f && (
                      <motion.span layoutId="history-filter" className="absolute inset-0 rounded-lg bg-ink-800 border border-ink-700/60" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative z-10">{f === 'all' ? 'All' : labelCategory(f)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {error ? (
          <div className="surface-strong rounded-3xl p-10 text-center">
            <p className="text-danger-300 font-medium">{error}</p>
            <p className="text-ink-400 text-sm mt-2">Make sure the NEXUSQuiz server is running, then reload.</p>
          </div>
        ) : history === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-ink-900/60 border border-ink-800/60 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Reveal>
            <div className="surface-strong rounded-4xl p-12 sm:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-ink-900/80 border border-ink-700/60 flex items-center justify-center mx-auto mb-6 text-accent-300">
                <Clock className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl text-ink-50">No attempts yet</h2>
              <p className="text-ink-400 mt-2 max-w-sm mx-auto">Your first quiz will show up here, along with trends and breakdowns as you go.</p>
              <Link to="/setup" className="btn-primary mt-8">
                Start your first quiz <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        ) : (
          <>
            {/* ── Summary ───────────────────────────────── */}
            <Reveal delay={0.05}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <Summary label="Quizzes taken" value={String(stats.n)} />
                <Summary label="Average score" value={formatPercent(stats.avg, 1)} tone={performanceTone(stats.avg)} />
                <Summary label="Overall accuracy" value={formatPercent(stats.accuracy, 0)} sub={`${stats.c} / ${stats.q} correct`} />
                <Summary label="Best result" value={formatPercent(stats.best, 1)} tone="accent" />
              </div>
            </Reveal>

            {/* ── Analytics ─────────────────────────────── */}
            <Reveal delay={0.1}>
              <div className="grid lg:grid-cols-5 gap-4 mb-12">
                <div className="lg:col-span-3">
                  <TrendChart history={visible} />
                </div>
                <div className="lg:col-span-2 grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <CategoryBreakdown history={visible} />
                  <DifficultyBreakdown history={visible} />
                </div>
              </div>
            </Reveal>

            {/* ── Attempts ──────────────────────────────── */}
            <Reveal delay={0.12}>
              <div className="flex items-end justify-between mb-4">
                <h2 className="font-display text-2xl text-ink-50">Attempts</h2>
                <span className="text-xs text-ink-500 num">{newestFirst.length} shown · newest first</span>
              </div>
            </Reveal>

            <div className="hidden md:grid grid-cols-[3rem_1fr_7rem_6rem_7rem_8rem] gap-4 px-5 pb-2 text-[11px] uppercase tracking-wider text-ink-500">
              <span>#</span>
              <span>Quiz</span>
              <span>Questions</span>
              <span>Correct</span>
              <span>Score</span>
              <span className="text-right">Accuracy</span>
            </div>

            <ol className="space-y-2.5">
              {newestFirst.map((h, i) => {
                const tone = performanceTone(h.percentage)
                return (
                  <motion.li
                    key={h.attempt}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="surface surface-hover rounded-2xl px-5 py-4"
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[3rem_1fr_7rem_6rem_7rem_8rem] gap-x-4 gap-y-3 items-center">
                      <span className="font-mono text-xs text-ink-500 num">{String(h.attempt).padStart(2, '0')}</span>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-ink-900/80 border border-ink-700/60 flex items-center justify-center text-accent-300 shrink-0">
                          {h.category === 'python' ? <Code className="w-5 h-5" /> : h.category === 'all' ? <Layers className="w-5 h-5" /> : <Sigma className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-ink-50 font-medium truncate">{labelCategory(h.category)}</p>
                          <span className={`chip chip-${difficultyTone(h.difficulty)} mt-1`}>{labelDifficulty(h.difficulty)}</span>
                        </div>
                      </div>

                      {/* accuracy — appears first on mobile (col 3), last on desktop */}
                      <div className="md:order-last text-right">
                        <p className={`font-display text-2xl num ${toneText[tone]}`}>{formatPercent(h.percentage, 1)}</p>
                        <div className="w-20 h-1 rounded-full bg-ink-900/80 overflow-hidden ml-auto mt-1.5">
                          <div className={`h-full rounded-full ${toneBg[tone]}`} style={{ width: `${Math.min(h.percentage, 100)}%` }} />
                        </div>
                      </div>

                      <Cell label="Questions" value={String(h.total_questions)} />
                      <Cell label="Correct" value={String(h.correct_answers)} className="text-success-400" />
                      <Cell label="Score" value={`${formatScore(h.score)} / ${formatScore(h.total_marks)}`} />
                    </div>
                  </motion.li>
                )
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}

function Summary({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' | 'warning' | 'danger' | 'accent' }) {
  return (
    <div className="surface rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`font-display text-3xl mt-2 num ${tone ? toneText[tone] : 'text-ink-50'}`}>{value}</p>
      {sub && <p className="text-xs text-ink-500 mt-1 num">{sub}</p>}
    </div>
  )
}

function Cell({ label, value, className = 'text-ink-100' }: { label: string; value: string; className?: string }) {
  return (
    <div className="col-span-1 md:col-auto">
      <p className="md:hidden text-[10px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`text-sm font-medium num ${className}`}>{value}</p>
    </div>
  )
}
