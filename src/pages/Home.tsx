import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Reveal from '@/components/Reveal'
import MagneticLink from '@/components/ui/MagneticLink'
import CountUp from '@/components/ui/CountUp'
import { ArrowRight, Clock, Code, Shield, Sigma, Target, Trend } from '@/components/ui/Icons'
import { getCategories } from '@/api/quizApi'
import type { CategoriesResponse } from '@/types/quiz'
import { difficultyLevel, labelCategory } from '@/lib/format'
import { useLattice } from '@/components/three/store'

const ease = [0.22, 1, 0.36, 1] as const
const stagger = (i: number) => ({ duration: 0.7, delay: 0.08 + i * 0.09, ease })

export default function Home() {
  const [catalog, setCatalog] = useState<CategoriesResponse | null>(null)

  useEffect(() => {
    getCategories().then(setCatalog).catch(() => setCatalog(null))
  }, [])

  // The lattice establishes the world: full presence, medium density.
  useLattice({ layout: 'hero', mode: 'establish', progress: 0.42, density: 0.6, sector: -1, litCount: -1 })

  const categoryCount = catalog?.categories.length ?? 0
  const questionCount = catalog?.total_questions ?? 0

  return (
    <div className="relative">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100svh-4rem)] flex items-end md:items-center overflow-hidden">
        {/* readability scrim behind the copy (mobile: the object sits above the copy) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-canvas via-canvas/60 to-transparent md:bg-gradient-to-r md:from-canvas md:via-canvas/70 md:to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-40 pb-14 md:py-24">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 xl:col-span-6">
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={stagger(0)} className="rule text-fg-3">
                <span className="eyebrow">NEXUSQuiz</span>
                <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-fg-3">
                  {catalog ? `${questionCount} questions · ${categoryCount} topics` : 'Maths · Python'}
                </span>
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stagger(1)}
                className="font-display t-hero text-fg mt-7"
              >
                Test your knowledge.
                <br />
                <span className="hl">Build your mastery.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stagger(2)}
                className="mt-7 t-lead text-fg-2 max-w-lg text-pretty"
              >
                Pick a topic, set the tier, answer one question at a time. Every attempt is scored on the server
                and added to a history you can actually learn from.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stagger(3)}
                className="mt-9 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <MagneticLink to="/setup" className="btn-primary btn-lg group">
                  Start Quiz
                  <ArrowRight className="w-5 h-5 transition-transform duration-base ease-out group-hover:translate-x-1" />
                </MagneticLink>
                <MagneticLink to="/history" strength={0.1} className="btn-secondary btn-lg">
                  <Clock className="w-5 h-5 text-fg-2" />
                  View History
                </MagneticLink>
              </motion.div>

              {/* quick facts — small, mono, ruled */}
              <motion.dl
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.55 }}
                className="mt-14 grid grid-cols-3 max-w-md divide-x divide-line border-y border-line"
              >
                <Fact value={catalog ? String(categoryCount) : '—'} label="Topics" />
                <Fact value="3" label="Tiers" />
                <Fact value="2" label="Formats" />
              </motion.dl>
            </div>
          </div>
        </div>

        {/* caption for the object — editorial figure label */}
        <motion.figcaption
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute right-6 lg:right-10 bottom-8 hidden md:flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-fg-3"
        >
          <span className="w-8 h-px bg-line-strong" />
          Fig. 01 — The Nexus · {catalog ? `${questionCount} nodes` : 'knowledge lattice'}
        </motion.figcaption>
      </section>

      {/* ── Topics (real data) ───────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <span className="index">01</span>
                <h2 className="font-display t-section text-fg mt-3">
                  Two disciplines. <br className="hidden sm:block" />
                  Three tiers each.
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-5 text-fg-2 leading-relaxed text-pretty max-w-md">
                  Every question is hand-written and stored in the NEXUS question bank. Mix topics, mix
                  difficulties, or go deep on a single tier.
                </p>
                <Link to="/setup" className="btn-accent mt-6 -ml-4 group">
                  Configure a quiz
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {(catalog?.categories ?? [{ id: 'maths', difficulties: {} }, { id: 'python', difficulties: {} }]).map((cat, i) => {
                const total = Object.values(cat.difficulties).reduce((a, b) => a + b, 0)
                return (
                  <Reveal key={cat.id} delay={0.05 + i * 0.08}>
                    <Link
                      to="/setup"
                      state={{ category: cat.id }}
                      className="block surface surface-hover rounded-2.5xl p-6 sm:p-7 h-full group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl surface-recessed flex items-center justify-center text-fg">
                          {cat.id === 'python' ? <Code className="w-6 h-6" /> : <Sigma className="w-6 h-6" />}
                        </div>
                        <span className="chip">{total ? `${total} questions` : 'Topic'}</span>
                      </div>
                      <h3 className="font-display text-2xl text-fg mt-8">{labelCategory(cat.id)}</h3>
                      <p className="text-sm text-fg-2 mt-1.5">
                        {cat.id === 'python'
                          ? 'Syntax, data structures, functions and idioms.'
                          : 'Algebra, calculus, matrices, probability and more.'}
                      </p>
                      <div className="mt-6 flex items-center gap-2">
                        {(['easy', 'medium', 'hard'] as const).map((d) => (
                          <span key={d} className="chip">
                            <span className="tier" data-level={difficultyLevel(d)} aria-hidden="true">
                              <i />
                              <i />
                              <i />
                            </span>
                            {d}
                            {cat.difficulties[d] ? <span className="text-fg-3">· {cat.difficulties[d]}</span> : null}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why NEXUS — editorial bento, controlled variation ─── */}
      <section className="relative py-6 md:py-12 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal className="max-w-2xl">
            <span className="index">02</span>
            <h2 className="font-display t-section text-fg mt-3">Built to make progress visible</h2>
          </Reveal>

          <div className="grid md:grid-cols-6 gap-4 mt-10">
            {/* 1 — large feature: the ink panel */}
            <Reveal className="md:col-span-4">
              <div className="panel-ink rounded-3xl p-7 sm:p-10 h-full flex flex-col justify-between min-h-[320px]">
                <div>
                  <span className="eyebrow">Server-side scoring</span>
                  <h3 className="font-display text-3xl sm:text-4xl mt-4 max-w-md">
                    Answers never reach the browser before you submit.
                  </h3>
                </div>
                <div className="mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <p className="muted text-sm max-w-sm leading-relaxed">
                    The NEXUS engine checks every response with its own validation rules — exact match, case-insensitive
                    or whitespace-normalised depending on the tier.
                  </p>
                  <Shield className="w-9 h-9 shrink-0 opacity-80" />
                </div>
              </div>
            </Reveal>

            {/* 2 — big statistic */}
            <Reveal delay={0.06} className="md:col-span-2">
              <div className="surface rounded-3xl p-7 h-full flex flex-col justify-between">
                <span className="eyebrow-muted">Question bank</span>
                <div>
                  <p className="stat-big text-fg mt-6">
                    {catalog ? <CountUp value={questionCount} duration={1.2} /> : '—'}
                  </p>
                  <p className="text-sm text-fg-2 mt-3">
                    hand-written questions across {catalog ? categoryCount : 'two'} topics and three tiers.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* 3 — compact */}
            <Reveal delay={0.08} className="md:col-span-2">
              <div className="surface surface-hover rounded-3xl p-7 h-full">
                <div className="w-11 h-11 rounded-xl surface-recessed flex items-center justify-center text-accent mb-6">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl text-fg">Two answer formats</h3>
                <p className="text-sm text-fg-2 leading-relaxed mt-2">
                  Multiple-choice for speed, typed answers for precision.
                </p>
              </div>
            </Reveal>

            {/* 4 — horizontal feature with the tier meter as the visual */}
            <Reveal delay={0.1} className="md:col-span-4">
              <div className="surface surface-hover rounded-3xl p-7 h-full grid sm:grid-cols-[1fr_auto] gap-8 items-center">
                <div>
                  <h3 className="font-display text-xl text-fg">Marks that scale with the challenge</h3>
                  <p className="text-sm text-fg-2 leading-relaxed mt-2 max-w-md">
                    Easy, medium and hard tiers — or mix them all. Multiple-choice questions are worth half a typed
                    answer at the same tier.
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
                  {(
                    [
                      ['easy', '2'],
                      ['medium', '4'],
                      ['hard', '6'],
                    ] as const
                  ).map(([d, m]) => (
                    <div key={d}>
                      <dt className="tier text-fg-2 mb-2" data-level={difficultyLevel(d)} aria-label={d}>
                        <i />
                        <i />
                        <i />
                      </dt>
                      <dd className="font-display text-3xl text-fg num">{m}</dd>
                      <dd className="text-[11px] font-mono uppercase tracking-wider text-fg-3 mt-1">{d}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            {/* 5 — trend sparkline (illustrative geometry, no fake numbers) */}
            <Reveal delay={0.12} className="md:col-span-3">
              <Link to="/history" className="surface surface-hover rounded-3xl p-7 h-full flex flex-col group">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl surface-recessed flex items-center justify-center text-accent">
                    <Trend className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-fg-3 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="font-display text-xl text-fg mt-6">Progress you can see</h3>
                <p className="text-sm text-fg-2 leading-relaxed mt-2">
                  Every attempt is saved. Trends, accuracy and your strongest topics build up over time.
                </p>
              </Link>
            </Reveal>

            {/* 6 — the flow */}
            <Reveal delay={0.14} className="md:col-span-3">
              <div className="surface rounded-3xl p-7 h-full">
                <span className="eyebrow-muted">How it works</span>
                <ol className="mt-5 space-y-4">
                  {steps.map((s, i) => (
                    <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-3 items-baseline">
                      <span className="index">0{i + 1}</span>
                      <div>
                        <p className="font-display text-lg text-fg">{s.title}</p>
                        <p className="text-sm text-fg-2 leading-relaxed">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 px-5 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h2 className="font-display t-title text-fg text-balance">Ready when you are.</h2>
          <p className="mt-4 text-fg-2 max-w-lg mx-auto text-pretty">A quiz takes a couple of minutes. Mastery takes a few more.</p>
          <div className="mt-8 flex justify-center">
            <MagneticLink to="/setup" className="btn-primary btn-lg group">
              Start Quiz
              <ArrowRight className="w-5 h-5 transition-transform duration-base group-hover:translate-x-1" />
            </MagneticLink>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="py-4 first:pl-0 pl-5">
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-2xl sm:text-3xl text-fg num">{value}</dd>
      <dd className="font-mono text-[10px] sm:text-[11px] text-fg-3 uppercase tracking-[0.18em] mt-1">{label}</dd>
    </div>
  )
}

const steps = [
  { title: 'Configure', desc: 'Topic, tier, and how many questions.' },
  { title: 'Answer', desc: 'One focused question at a time.' },
  { title: 'Review', desc: 'Score, every answer, and your history.' },
]
