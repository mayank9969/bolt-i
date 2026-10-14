import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import Reveal from '@/components/Reveal'
import MagneticLink from '@/components/ui/MagneticLink'
import CountUp from '@/components/ui/CountUp'
import { ArrowRight, Shield } from '@/components/ui/Icons'
import { categoryIcon, categoryLabel } from '@/lib/categories'
import { getCategories, getHistory } from '@/api/quizApi'
import type { CategoriesResponse, HistoryEntry } from '@/types/quiz'
import { reviewTopics } from '@/lib/review'
import { difficultyLevel, labelCategory } from '@/lib/format'
import { setWorld, useWorld } from '@/components/three/world'
import { hasExhibit } from '@/lib/exhibits'

const ease = [0.22, 1, 0.36, 1] as const
const enter = (i: number) => ({ duration: 0.9, delay: 0.15 + i * 0.1, ease })

export default function Home() {
  const [catalog, setCatalog] = useState<CategoriesResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 70])
  const copyO = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  useEffect(() => {
    getCategories().then(setCatalog).catch(() => setCatalog(null))
    getHistory().then(setHistory).catch(() => setHistory(null))
  }, [])
  // real history → regions whose latest attempt still had wrong answers (terracotta markers on the map)
  const review = useMemo(() => reviewTopics(history), [history])

  const cats = catalog?.categories ?? []
  const categoryCount = cats.length
  const questionCount = catalog?.total_questions ?? 0

  // HOME — the archipelago is the hero: full presence, interactive, scroll-guided reveal.
  useWorld({ mode: 'hero' })

  return (
    <div className="relative">
      {/* ── Hero: copy on the left, the world on the right (below on phones) ── */}
      <section ref={heroRef} className="relative min-h-[100svh] -mt-16 pt-16 flex flex-col !pointer-events-none">
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-page mx-auto w-full px-5 sm:px-6 lg:px-8 pt-10 pb-6 md:pb-10">
          <motion.div style={{ y: copyY, opacity: copyO }} className="grid lg:grid-cols-12 gap-x-10 items-center">
            <div className="lg:col-span-5 xl:col-span-5 hero-paper pointer-events-auto">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={enter(0)} className="opener">
                <span>The Knowledge Archipelago</span>
              </motion.p>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={enter(1)} className="t-hero text-fg mt-6 max-w-[12ch] text-balance">
                Every subject<br /> is an <span className="t-italic text-accent">island.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={enter(2)} className="t-lead text-fg-2 mt-7 max-w-md text-pretty">
                {catalog ? `${categoryCount} islands, ${questionCount} questions.` : 'A small world of islands.'} Explore the map, open an island’s field guide, and start a quiz
                there — every answer scored on the server, never in your browser.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={enter(3)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <MagneticLink to="/setup" className="btn-primary btn-lg">
                  Start a quiz
                  <ArrowRight className="arrow w-5 h-5" />
                </MagneticLink>
                <Link to="/about" className="link-rule text-sm">
                  How it works
                </Link>
              </motion.div>

              {review.length > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={enter(4)} className="mt-7 flex items-start gap-2.5 text-sm text-fg-2 max-w-md">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-warm shrink-0" aria-hidden="true" />
                  <span>
                    <span className="text-warm-text font-medium">Terracotta markers</span> stand on {review.length === 1 ? 'the island' : `${review.length} islands`} where your latest attempt left wrong answers:{' '}
                    {review.slice(0, 3).map((r) => categoryLabel(r.id)).join(', ')}
                    {review.length > 3 ? ` and ${review.length - 3} more` : ''}.
                  </span>
                </motion.p>
              )}
            </div>
            {/* the right column is left open for the map; on phones the map sits in this reserved space */}
            <div className="lg:col-span-7 min-h-[46svh] lg:min-h-0" aria-hidden="true" />
          </motion.div>
        </div>

        {/* island index: the keyboard / no-3D way to reach every field guide */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="relative z-10 max-w-page mx-auto w-full px-5 sm:px-6 lg:px-8 pb-6 pointer-events-auto"
          aria-label="Islands"
        >
          <div className="flex items-center justify-between gap-6 figcap mb-3">
            <span className="inline-flex items-center gap-3">
              <span className="w-8 h-px bg-line-strong" />
              Fig. 01 — {catalog ? `${categoryCount} islands · ${cats.filter((c) => hasExhibit(c.id)).length} exhibits open · tap an island` : 'the archipelago, live'}
            </span>
            <span className="hidden md:inline-flex items-center gap-3">
              Scroll to move in
              <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} className="block w-px h-6 bg-line-strong origin-top" />
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {cats.map((c) => {
              const rv = review.find((r) => r.id === c.id || (c.id === 'math' && r.id === 'maths'))
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className="island-chip"
                    onMouseEnter={() => setWorld({ hover: c.id })}
                    onMouseLeave={() => setWorld({ hover: null })}
                    onFocus={() => setWorld({ hover: c.id })}
                    onBlur={() => setWorld({ hover: null })}
                    onClick={() => setWorld({ selected: c.id, hover: c.id })}
                    aria-haspopup="dialog"
                  >
                    <RegionIcon id={c.id} className="w-3.5 h-3.5" />
                    {labelCategory(c.id)}
                    {hasExhibit(c.id) && <span className="island-chip-tag">Exhibit</span>}
                    {rv && <span className="w-1.5 h-1.5 rounded-full bg-warm" aria-label="worth revisiting" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </motion.nav>
      </section>

      {/* ── Manifesto: one line, huge, ruled ───────────────────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-24 md:pt-36 pb-16 md:pb-24">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <span className="lg:col-span-2 index">01 — Idea</span>
            <h2 className="lg:col-span-10 t-section text-fg max-w-[24ch] text-balance">
              Knowledge isn’t a list you finish. It’s a place you get to know — island by island.
            </h2>
          </div>
        </Reveal>
      </section>

      {/* ── Regions: real catalogue, ruled rows not cards ──────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-24 md:pb-36">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-baseline mb-6">
            <span className="lg:col-span-2 index">02 — Islands</span>
            <p className="lg:col-span-6 text-fg-2 max-w-prose text-pretty">
              {catalog ? `${categoryCount} regions` : 'Many regions'}, three tiers each, two answer formats. Each region below is a live cluster in the network — the numbers come straight from the question bank.
            </p>
          </div>
        </Reveal>

        <div className="border-t border-line-strong">
          {catalog
            ? cats.map((c, i) => {
                const total = Object.values(c.difficulties).reduce((a, b) => a + b, 0)
                return (
                  <Reveal key={c.id} delay={i * 0.06} y={12}>
                    <Link
                      to="/setup"
                      state={{ category: c.id }}
                      className="group row items-center grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] hover:bg-hover transition-colors -mx-4 px-4 rounded-lg"
                    >
                      <span className="t-caption text-fg-3 num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex items-center gap-4 min-w-0">
                        <span className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center text-fg shrink-0 group-hover:border-accent group-hover:text-accent transition-colors">
                          <RegionIcon id={c.id} className="w-4 h-4" />
                        </span>
                        <span className="t-h3-lg text-fg text-balance leading-tight">{labelCategory(c.id)}</span>
                      </span>
                      <span className="hidden md:flex items-center gap-5">
                        {Object.entries(c.difficulties)
                          .sort(([a], [b]) => ['easy', 'medium', 'hard'].indexOf(a) - ['easy', 'medium', 'hard'].indexOf(b))
                          .map(([d, n]) => (
                            <span key={d} className="inline-flex items-center gap-2 t-caption text-fg-2">
                              <span className="tier text-fg-2" data-level={difficultyLevel(d)} aria-hidden="true"><i /><i /><i /></span>
                              <span className="num">{n}</span>
                              <span className="sr-only">{d}</span>
                            </span>
                          ))}
                      </span>
                      <span className="flex items-center gap-3 text-sm text-fg-2 num">
                        {total} <span className="hidden sm:inline">questions</span>
                        <ArrowRight className="arrow w-4 h-4 text-fg-3 group-hover:text-fg" />
                      </span>
                    </Link>
                  </Reveal>
                )
              })
            : [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[73px] border-b border-line skeleton" />)}
          <Reveal delay={0.14} y={12}>
            <Link to="/setup" state={{ category: 'all' }} className="group row items-center grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] hover:bg-hover transition-colors -mx-4 px-4 rounded-lg">
              <span className="t-caption text-fg-3 num">{String(categoryCount + 1).padStart(2, '0')}</span>
              <span className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-full bg-accent text-fg-inverse flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-current" />
                </span>
                <span className="t-h3-lg text-fg">Mixed <span className="text-fg-2 font-normal">— every island, one voyage</span></span>
              </span>
              <span className="hidden md:block t-caption text-fg-2">Every region, every tier, one session</span>
              <span className="flex items-center gap-3 text-sm text-fg-2 num">
                {catalog ? questionCount : '—'} <span className="hidden sm:inline">questions</span>
                <ArrowRight className="arrow w-4 h-4 text-fg-3 group-hover:text-fg" />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── How it scores: asymmetric editorial band ───────────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-24 md:pb-36">
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-12">
          <Reveal className="lg:col-span-5">
            <span className="index">03 — Scoring</span>
            <h2 className="t-section text-fg mt-4 text-balance">Marks scale with the tier. Nothing is graded in your browser.</h2>
            <p className="text-fg-2 mt-6 max-w-prose text-pretty">
              Easy, medium and hard questions are worth 2, 4 and 6 marks; multiple-choice is half. Answers never leave the server, so the score you see is the score you earned.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-fg-2">
              <Shield className="w-4 h-4 text-accent" />
              Server-side validation · single-use sessions
            </div>
          </Reveal>

          <div className="lg:col-span-7 lg:pl-10">
          <div className="grid sm:grid-cols-3 gap-px bg-line-strong border border-line-strong rounded-2xl overflow-hidden shadow-card">
            {[
              ['Easy', 2, 'Fundamentals, warm-up pace'],
              ['Medium', 4, 'Solid understanding required'],
              ['Hard', 6, 'Exact answers, no leniency'],
            ].map(([name, marks, blurb], i) => (
              <Reveal key={String(name)} delay={i * 0.07} className="bg-canvas">
                <div className="p-6 sm:p-7 h-full flex flex-col">
                  <span className="tier text-accent" data-level={String(i + 1)} aria-hidden="true"><i /><i /><i /></span>
                  <span className="stat-big text-fg mt-6 num">
                    <CountUp value={Number(marks)} />
                  </span>
                  <span className="t-label text-fg-3 mt-2">marks · {String(name)}</span>
                  <p className="text-sm text-fg-2 mt-5 leading-relaxed">{String(blurb)}</p>
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── Ink band: the journey through the pages ────────────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-24 md:pb-36">
        <Reveal>
          <div className="panel-ink rounded-2xl md:rounded-3xl p-7 sm:p-10 md:p-14 relative overflow-hidden">
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <span className="eyebrow">The path</span>
                <h2 className="t-section mt-4 text-balance">One world, five views.</h2>
                <p className="muted text-sm mt-5 max-w-sm leading-relaxed">The same archipelago follows you through the product and frames what you are doing — never in the way of a question.</p>
              </div>
              <ol className="lg:col-span-8 grid sm:grid-cols-2 gap-x-10">
                {[
                  ['Home', 'Explore', 'The whole archipelago, close enough to touch; scrolling moves you in.'],
                  ['Setup', 'Approach', 'Choose an island and the camera settles beside it.'],
                  ['Quiz', 'Ashore', 'The map is put away so the question owns the page.'],
                  ['Result', 'Return', 'The island you quizzed on waits behind your printed score.'],
                  ['History', 'Chart', 'Islands your latest attempt left unfinished carry a terracotta marker.'],
                ].map(([page, state, desc], i) => (
                  <li key={page} className="py-5 border-b" style={{ borderColor: 'rgb(var(--nx-panel-text-rgb) / 0.14)' }}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="t-h3">{page}</span>
                      <span className="index">0{i + 1} · {state}</span>
                    </div>
                    <p className="muted text-sm mt-2 leading-relaxed">{desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-28 md:pb-40">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-end border-t border-line-strong pt-10">
            <h2 className="lg:col-span-8 t-title text-fg text-balance">
              Pick an island. <span className="text-fg-2">Then go ashore.</span>
            </h2>
            <div className="lg:col-span-4 flex lg:justify-end">
              <MagneticLink to="/setup" className="btn-primary btn-lg">
                Start a quiz
                <ArrowRight className="arrow w-5 h-5" />
              </MagneticLink>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

function RegionIcon({ id, className }: { id: string; className?: string }) {
  const Icon = categoryIcon(id)
  return <Icon className={className} />
}
