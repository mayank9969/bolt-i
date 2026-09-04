import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Reveal from '@/components/Reveal'
import SceneLayer from '@/components/SceneLayer'
import MagneticLink from '@/components/ui/MagneticLink'
import { ArrowRight, Clock, Code, Layers, Shield, Sigma, Target, Trend } from '@/components/ui/Icons'
import { getCategories } from '@/api/quizApi'
import type { CategoriesResponse } from '@/types/quiz'
import { difficultyLevel, labelCategory } from '@/lib/format'

const ease = [0.22, 1, 0.36, 1] as const

export default function Home() {
  const [catalog, setCatalog] = useState<CategoriesResponse | null>(null)

  useEffect(() => {
    getCategories().then(setCatalog).catch(() => setCatalog(null))
  }, [])

  const categoryCount = catalog?.categories.length ?? 0
  const questionCount = catalog?.total_questions ?? 0

  return (
    <div className="relative">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        <SceneLayer variant="hero" />
        {/* readability scrim on the text side */}
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/70 to-transparent pointer-events-none md:from-canvas/95 md:via-canvas/50" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full py-20 md:py-24">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full surface mb-7"
            >
              <span className="relative flex h-2 w-2 ml-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-pulse-soft" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-xs sm:text-[13px] text-fg-2 tracking-wide">
                {catalog ? `${questionCount} questions across ${categoryCount} topics` : 'Adaptive quizzes · Real-time scoring'}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease }}
              className="font-display font-semibold text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl text-fg tracking-tight text-balance"
            >
              Test your knowledge.
              <br />
              <span className="hl">Build your mastery.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="mt-6 text-base sm:text-lg text-fg-2 leading-relaxed max-w-xl text-pretty"
            >
              NEXUSQuiz turns practice into progression. Pick a topic, set the difficulty,
              and get scored instantly — every attempt is tracked so you can watch yourself improve.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease }}
              className="mt-9 flex flex-col sm:flex-row gap-3"
            >
              <MagneticLink to="/setup" className="btn-primary btn-lg group">
                Start Quiz
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </MagneticLink>
              <MagneticLink to="/history" strength={0.1} className="btn-secondary btn-lg">
                <Clock className="w-5 h-5 text-fg-2" />
                View History
              </MagneticLink>
            </motion.div>

            {/* quick facts */}
            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-12 grid grid-cols-3 gap-4 max-w-md"
            >
              <Fact value={catalog ? String(categoryCount) : '—'} label="Topics" />
              <Fact value="3" label="Difficulty tiers" />
              <Fact value="2" label="Question formats" />
            </motion.dl>
          </div>
        </div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[22px] h-9 rounded-full border border-line-strong flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-1.5 rounded-full bg-accent" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Topics (real data) ───────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal>
                <span className="eyebrow">Topics</span>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-fg mt-3">
                  Two disciplines. <br className="hidden sm:block" />
                  Three tiers each.
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-5 text-fg-2 leading-relaxed text-pretty max-w-md">
                  Every question is hand-written and stored in the NEXUS question bank. Mix topics,
                  mix difficulties, or go deep on a single tier — the choice is yours.
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
                    <Link to="/setup" state={{ category: cat.id }} className="block surface surface-hover rounded-2.5xl p-6 sm:p-7 h-full group">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl surface-recessed flex items-center justify-center text-fg">
                          {cat.id === 'python' ? <Code className="w-6 h-6" /> : <Sigma className="w-6 h-6" />}
                        </div>
                        <span className="chip">{total ? `${total} questions` : 'Topic'}</span>
                      </div>
                      <h3 className="font-display text-2xl text-fg mt-6">{labelCategory(cat.id)}</h3>
                      <p className="text-sm text-fg-2 mt-1.5">
                        {cat.id === 'python'
                          ? 'Syntax, data structures, functions and idioms.'
                          : 'Algebra, calculus, matrices, probability and more.'}
                      </p>
                      <div className="mt-6 flex items-center gap-2">
                        {(['easy', 'medium', 'hard'] as const).map((d) => (
                          <span key={d} className="chip">
                            <span className="tier" data-level={difficultyLevel(d)} aria-hidden="true"><i /><i /><i /></span>
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

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8"><div className="hairline" /></div>

      {/* ── Why NEXUS ────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">Why NEXUSQuiz</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-fg mt-3 text-balance">
              Built to make progress visible
            </h2>
            <p className="mt-4 text-fg-2 text-pretty">
              Focused sessions, honest scoring and a history that tells the real story.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.07}>
                <div className="surface surface-hover rounded-2.5xl p-6 h-full">
                  <div className="w-11 h-11 rounded-xl surface-recessed flex items-center justify-center text-accent mb-5">
                    {f.icon}
                  </div>
                  <h3 className="font-display text-lg text-fg">{f.title}</h3>
                  <p className="text-sm text-fg-2 leading-relaxed mt-2">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flow ─────────────────────────────────────────────── */}
      <section className="relative py-6 md:py-12 px-5 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="surface-strong rounded-4xl p-7 sm:p-10 md:p-12 overflow-hidden relative">
              <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-accent/[0.07] blur-[100px] pointer-events-none" />
              <span className="eyebrow">How it works</span>
              <div className="grid md:grid-cols-3 gap-8 md:gap-6 mt-6 relative">
                {steps.map((s, i) => (
                  <div key={s.title} className="relative">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-accent tracking-widest">0{i + 1}</span>
                      <span className="hairline flex-1" />
                    </div>
                    <h3 className="font-display text-xl text-fg mt-4">{s.title}</h3>
                    <p className="text-sm text-fg-2 leading-relaxed mt-2">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-5 sm:px-6 lg:px-8">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-5xl text-fg text-balance leading-tight">
            Ready when you are.
          </h2>
          <p className="mt-4 text-fg-2 max-w-lg mx-auto text-pretty">
            A quiz takes a couple of minutes. Mastery takes a few more.
          </p>
          <div className="mt-8 flex justify-center">
            <MagneticLink to="/setup" className="btn-primary btn-lg group">
              Start Quiz
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticLink>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-2xl sm:text-3xl text-fg num">{value}</dd>
      <dd className="text-[11px] sm:text-xs text-fg0 uppercase tracking-wider mt-0.5">{label}</dd>
    </div>
  )
}

const features = [
  {
    title: 'Adaptive difficulty',
    desc: 'Easy, medium and hard tiers — or mix them all — with marks that scale to the challenge.',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    title: 'Two answer formats',
    desc: 'Multiple-choice for speed, typed answers for precision. Each is validated by its own rules.',
    icon: <Target className="w-5 h-5" />,
  },
  {
    title: 'Server-side scoring',
    desc: 'Answers are checked by the NEXUS engine — never exposed to the browser before you submit.',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    title: 'Progress you can see',
    desc: 'Every attempt is saved. Track trends, accuracy and your strongest topics over time.',
    icon: <Trend className="w-5 h-5" />,
  },
]

const steps = [
  { title: 'Configure', desc: 'Choose a topic, a difficulty tier and how many questions you want.' },
  { title: 'Answer', desc: 'Move through a focused, distraction-free session. One question at a time.' },
  { title: 'Review', desc: 'See your score, revisit every answer and watch your history grow.' },
]
