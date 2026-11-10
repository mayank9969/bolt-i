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
import { useWorld } from '@/components/three/world'

import { formatPercent, formatScore, labelCategory, performanceTone, toneText } from '@/lib/format'
import HistoryStats from '@/components/HistoryStats'
import { categoryCluster, normaliseCategoryId } from '@/lib/categories'
const familyOf = (id: string): 0 | 1 => (categoryCluster(id) === 1 ? 1 : 0)

type Filter = 'all' | string
const ease = [0.22, 1, 0.36, 1] as const

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
  }, [])

  // The engine has stored both 'math' and 'maths' over time — group them under one label for filtering/display.
  const norm = normaliseCategoryId
  const categories = useMemo(() => Array.from(new Set((history ?? []).map((h) => norm(h.category)).filter((c) => c !== 'all'))), [history])
  const visible = useMemo(() => (history ?? []).filter((h) => filter === 'all' || norm(h.category) === filter), [history, filter])
  const newestFirst = useMemo(() => [...visible].reverse(), [visible])

  const stats = useMemo(() => {
    const n = visible.length
    const avg = n ? visible.reduce((s, h) => s + h.percentage, 0) / n : 0
    const q = visible.reduce((s, h) => s + h.total_questions, 0)
    const c = visible.reduce((s, h) => s + h.correct_answers, 0)
    const best = n ? Math.max(...visible.map((h) => h.percentage)) : 0
    const last = n ? visible[visible.length - 1] : null
    const prev = n > 1 ? visible[visible.length - 2] : null
    const delta = last && prev ? last.percentage - prev.percentage : null
    return { n, avg, q, c, best, accuracy: q ? (c / q) * 100 : 0, last, delta }
  }, [visible])

  // HISTORY — accumulated: each region is "established" in proportion to real practice there.
  // weight = attempts in that region (saturating) × mean accuracy; 'all'/mixed attempts feed the bridge region.
  const establish = (items: HistoryEntry[]) => {
    if (!items.length) return 0
    const acc = items.reduce((s, h) => s + h.percentage, 0) / items.length / 100
    const sat = 1 - Math.exp(-items.length / 4)
    return Math.min(1, 0.15 + sat * 0.55 + acc * 0.3)
  }
  // per-region establishment, most practised first (drives the list below)
  const regions = useMemo(
    () =>
      categories
        .map((id) => {
          const items = (history ?? []).filter((h) => norm(h.category) === id)
          const avg = items.reduce((s, h) => s + h.percentage, 0) / items.length
          return { id, n: items.length, w: establish(items), avg }
        })
        .sort((a, b) => b.n - a.n || b.w - a.w),
    [history, categories],
  )
  const mixedItems = useMemo(() => (history ?? []).filter((h) => h.category === 'all' || h.category === 'mixed'), [history])
  // the two families' establishment (for the summary strip below); mixed attempts counted separately
  const weights = useMemo<[number, number, number]>(() => {
    if (!history || history.length === 0) return [0, 0, 0]
    const fam = (f: 0 | 1) => history.filter((h) => h.category !== 'all' && h.category !== 'mixed' && familyOf(norm(h.category)) === f)
    return [establish(fam(0)), establish(fam(1)), establish(mixedItems)]
  }, [history, mixedItems])

  // HISTORY — a filtered region frames its island; otherwise the archipelago rests far behind the archive
  useWorld({ mode: filter === 'all' ? 'quiet' : 'focus', focus: filter === 'all' ? null : filter }, [filter])

  return (
    <div className="relative flex-1 archive-ed">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* ── Header ──────────────────────────────────────── */}
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-x-10 gap-y-8 items-end">
            <div className="lg:col-span-8">
              <p className="ed-eyebrow">History</p>
              <h1 className="ed-display mt-4 text-balance">
                {history && history.length ? (
                  <>A record of returning</>
                ) : (
                  <>Your history</>
                )}
              </h1>
              <p className="ed-lede mt-5">
                {history && history.length
                  ? `${history.length} scored sitting${history.length === 1 ? '' : 's'} from the quiz engine. Read top to bottom: totals, where you practised, how scores moved, then each attempt.`
                  : 'When you finish a quiz, the engine stores it here. Nothing is guessed.'}
              </p>
              {history && history.length > 0 && (
                <p className="flex flex-wrap gap-1.5 mt-4" aria-hidden="true">
                  {history.slice(-24).map((h) => (
                    <span key={h.attempt} className="arch-dot" title={`Attempt ${h.attempt}`} />
                  ))}
                </p>
              )}
            </div>
            {categories.length > 0 && (
              <div className="lg:col-span-4 flex lg:justify-end min-w-0">
                <div role="tablist" aria-label="Filter by region" className="flex flex-nowrap items-center gap-1 lg:justify-end overflow-x-auto max-w-full pb-1 [scrollbar-width:none]">
                  {(['all', ...categories] as Filter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f)}
                      className={`relative h-10 px-4 rounded-full text-sm font-medium border transition-colors ${filter === f ? 'text-fg border-transparent' : 'text-fg-2 border-line-strong bg-canvas/80 hover:text-fg hover:border-fg-3'}`}
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
          <div className="surface-strong rounded-2xl p-8 mt-12 text-center" role="alert">
            <div className="w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center bg-err/10 text-err">
              <Cross className="w-5 h-5" />
            </div>
            <p className="text-fg font-medium">{error}</p>
            <p className="text-fg-2 text-sm mt-2">Make sure the VEYRA server is running, then reload.</p>
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
                <p className="text-fg-2 mt-4 max-w-md text-pretty">Your first quiz will show up here, and the map will start remembering which islands you have visited.</p>
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
              <dl className="mt-14 grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8 border-t border-line-strong pt-8">
                <Big label="Quizzes taken" value={String(stats.n)} sub="How many sittings the engine stored" />
                <Big label="Average score" value={formatPercent(stats.avg, 1)} tone={performanceTone(stats.avg)} sub="Mean of those sitting percents" />
                <Big label="Overall accuracy" value={formatPercent(stats.accuracy, 0)} sub={`${stats.c} of ${stats.q} questions right`} />
                <Big label="Best result" value={formatPercent(stats.best, 1)} tone={performanceTone(stats.best)} sub="Highest single sitting" />
                <Big
                  label="Last sitting"
                  value={stats.last ? formatPercent(stats.last.percentage, 0) : '—'}
                  tone={stats.last ? performanceTone(stats.last.percentage) : undefined}
                  sub={
                    stats.delta == null
                      ? undefined
                      : `${stats.delta >= 0 ? '+' : ''}${formatPercent(stats.delta, 0)} vs previous`
                  }
                />
              </dl>
            </Reveal>

            {/* ── Islands established ─── */}
            <Reveal delay={0.08}>
              <div className="mt-16 grid lg:grid-cols-12 gap-x-10 gap-y-6">
                <div className="lg:col-span-4">
                  <span className="index">01 — Subjects</span>
                  <h2 className="ed-kicker" style={{ fontFamily: 'var(--ed-display)', fontSize: 'clamp(1.4rem,2.2vw,1.8rem)' }}>Where you sat</h2>
                  <p className="text-sm text-fg-2 mt-3 max-w-sm text-pretty">
                    One line per island. The bar grows with how often you sat there and how those sittings scored. Tap a line to show only that subject.
                  </p>
                </div>
                <ul className="lg:col-span-8 border-t border-line">
                  {[
                    ...regions.map((r) => [r.id, labelCategory(r.id), r.w, r.n, r.avg] as const),
                    ...(mixedItems.length
                      ? ([['mixed', 'Mixed', weights[2], mixedItems.length, mixedItems.reduce((s, h) => s + h.percentage, 0) / mixedItems.length] as const])
                      : []),
                  ].map(([id, name, w, n, avg], i) => (
                    <motion.li
                      key={String(id)}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.45, ease }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(id === 'mixed' ? 'all' : String(id))
                          setShowAll(false)
                        }}
                        className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[10rem_1fr_auto] items-center gap-x-6 gap-y-2 py-5 border-b border-line text-left hover:bg-hover -mx-2 px-2 rounded-lg"
                      >
                        <span className="t-h3 text-fg">{String(name)}</span>
                        <SubjectWave weight={Number(w)} delay={i * 0.1} />
                        <span className="text-right t-caption text-fg-2 num sm:w-28">
                          {Number(n)} {Number(n) === 1 ? 'sitting' : 'sittings'}
                          <span className="block figcap mt-0.5">{formatPercent(Number(avg), 0)} avg</span>
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* ── Trend + breakdowns, ruled columns ─────────── */}
            <Reveal delay={0.1}>
              <div className="mt-16 grid lg:grid-cols-12 gap-x-10 gap-y-10">
                <div className="lg:col-span-4">
                  <span className="index">02 — Trend</span>
                  <h2 className="ed-kicker" style={{ fontFamily: 'var(--ed-display)', fontSize: 'clamp(1.4rem,2.2vw,1.8rem)' }}>How scores moved</h2>
                  <p className="text-sm text-fg-2 mt-3 max-w-sm text-pretty">
                    Left to right is time. Each point is one quiz. The dashed line is your average so far. Hover a point to read that sitting.
                  </p>
                </div>
                <div className="lg:col-span-8 grid md:grid-cols-5 gap-x-10 gap-y-10 column-paper lg:before:hidden">
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

            <HistoryStats history={visible} />

            {/* ── Attempts ──────────────────────────────────── */}
            <div className="mt-20 grid lg:grid-cols-12 gap-x-10">
              <Reveal className="lg:col-span-4">
                <span className="index">03 — Attempts</span>
                <h2 className="ed-kicker" style={{ fontFamily: 'var(--ed-display)', fontSize: 'clamp(1.4rem,2.2vw,1.8rem)' }}>Each sitting</h2>
                <p className="text-sm text-fg-2 mt-3 max-w-sm text-pretty">
                  Newest first. The teal bar under the percent is that sitting’s score. Ten show at a time so the page stays light.
                </p>
                <p className="t-caption text-fg-3 mt-3 num">{newestFirst.length} · newest first</p>
                <Link to="/progress" className="link-rule mt-4 inline-block text-sm">
                  Open progress
                </Link>
              </Reveal>
              <ol className="lg:col-span-8 border-t border-line-strong mt-6 lg:mt-0">
                {(showAll ? newestFirst : newestFirst.slice(0, 10)).map((h, i) => {
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
                      <span className="text-right min-w-[4.5rem]">
                        <span className={`t-h3 num ${toneText[tone]}`}>{formatPercent(h.percentage, 1)}</span>
                        <span className="mt-1 block h-1 rounded-full bg-line overflow-hidden">
                          <span className="block h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, h.percentage))}%` }} />
                        </span>
                      </span>
                      <span className="col-start-2 col-span-2 sm:hidden t-caption text-fg-2 num">
                        {h.correct_answers} / {h.total_questions} right · {formatScore(h.score)} / {formatScore(h.total_marks)} marks
                      </span>
                    </motion.li>
                  )
                })}
              </ol>
              {newestFirst.length > 10 && (
                <div className="lg:col-start-5 lg:col-span-8 mt-4">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAll((s) => !s)}>
                    {showAll ? 'Show fewer' : `Show all ${newestFirst.length}`}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SubjectWave({ weight, delay }: { weight: number; delay: number }) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <div className="h-2 rounded-sm bg-line overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.round(weight * 100)}%` }}
          viewport={{ once: true }}
          transition={{ delay, duration: 0.8, ease }}
        />
      </div>
    </div>
  )
}

function Big({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: ReturnType<typeof performanceTone> }) {
  return (
    <motion.div
      className="arch-stat"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease }}
    >
      <dt>{label}</dt>
      <dd className={tone ? toneText[tone] : ''}>{value}</dd>
      {sub && <p className="t-caption mt-2 num text-fg-3">{sub}</p>}
    </motion.div>
  )
}
