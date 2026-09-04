import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Reveal from '@/components/Reveal'
import MagneticLink from '@/components/ui/MagneticLink'
import CountUp from '@/components/ui/CountUp'
import { ArrowRight, Code, Shield, Sigma } from '@/components/ui/Icons'
import { getCategories } from '@/api/quizApi'
import type { CategoriesResponse } from '@/types/quiz'
import { difficultyLevel, labelCategory } from '@/lib/format'
import { useNetwork } from '@/components/three/store'

const ease = [0.22, 1, 0.36, 1] as const
const enter = (i: number) => ({ duration: 0.9, delay: 0.15 + i * 0.1, ease })

export default function Home() {
  const [catalog, setCatalog] = useState<CategoriesResponse | null>(null)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const copyO = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  useEffect(() => {
    getCategories().then(setCatalog).catch(() => setCatalog(null))
  }, [])

  const cats = catalog?.categories ?? []
  const categoryCount = cats.length
  const questionCount = catalog?.total_questions ?? 0

  // HOME — the network is alive: full presence, hover on, slow drift, scroll dollies the camera in.
  useNetwork(
    {
      mode: 'alive',
      camera: 'hero',
      density: 0.65,
      activation: 0.16,
      hoverable: true,
      clusterLabels: [labelCategory(cats[0]?.id ?? 'maths'), labelCategory(cats[1]?.id ?? 'python'), 'Mixed'],
    },
    [cats.length],
  )

  return (
    <div className="relative">
      {/* ── Hero: type set into the network ──────────────────────── */}
      <section ref={heroRef} className="relative min-h-[100svh] -mt-16 pt-16 flex flex-col">
        {/* readability wash: the network stays fully visible above, the copy sits on paper */}
        <div className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none bg-gradient-to-t from-canvas via-canvas/70 to-transparent" aria-hidden="true" />
        <div className="relative z-10 flex-1 flex flex-col justify-end max-w-page mx-auto w-full px-5 sm:px-6 lg:px-8 pb-10 md:pb-14">
          <motion.div style={{ y: copyY, opacity: copyO }} className="grid lg:grid-cols-12 gap-x-10 gap-y-10 items-end">
            {/* headline: bottom-left, big serif */}
            <div className="lg:col-span-8 xl:col-span-7">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={enter(0)} className="opener">
                <span>Living knowledge network</span>
                <span className="hidden sm:inline text-fg-3/70">·</span>
                <span className="hidden sm:inline">{catalog ? `${questionCount} questions` : 'Maths · Python'}</span>
              </motion.p>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={enter(1)} className="font-display t-hero text-fg mt-6 max-w-[14ch]">
                Every question is a <span className="t-italic text-accent">node.</span>
                <br />
                Every answer, a <span className="t-italic">connection.</span>
              </motion.h1>
            </div>

            {/* lede + actions: bottom-right column */}
            <div className="lg:col-span-4 xl:col-span-5 lg:pl-8 xl:pl-16 lg:border-l lg:border-line">
              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={enter(2)} className="t-lead text-fg-2 max-w-md text-pretty">
                NEXUSQuiz maps what you know in Maths and Python as a network you can watch grow. Pick a region, set the tier, and light it up — one honest, server-scored answer at a time.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={enter(3)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <MagneticLink to="/setup" className="btn-primary btn-lg">
                  Enter the network
                  <ArrowRight className="arrow w-5 h-5" />
                </MagneticLink>
                <Link to="/about" className="link-rule text-sm">
                  How it works
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* figure caption + scroll hint, pinned to the hero's lower edge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="relative z-10 max-w-page mx-auto w-full px-5 sm:px-6 lg:px-8 pb-6 flex items-center justify-between figcap"
        >
          <span className="hidden md:inline-flex items-center gap-3">
            <span className="w-8 h-px bg-line-strong" />
            Fig. 01 — three regions of knowledge, {catalog ? `${questionCount} nodes` : 'live'}
          </span>
          <span className="inline-flex items-center gap-3">
            Scroll to move through it
            <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} className="block w-px h-6 bg-line-strong origin-top" />
          </span>
        </motion.div>
      </section>

      {/* ── Manifesto: one line, huge, ruled ───────────────────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-24 md:pt-36 pb-16 md:pb-24">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <span className="lg:col-span-2 index">01 — Idea</span>
            <h2 className="lg:col-span-10 font-display t-section text-fg max-w-[24ch] text-balance">
              Knowledge isn’t a list you finish. It’s a <span className="t-italic">structure</span> you build — and it should look like one.
            </h2>
          </div>
        </Reveal>
      </section>

      {/* ── Regions: real catalogue, ruled rows not cards ──────────── */}
      <section className="relative max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-24 md:pb-36">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-baseline mb-6">
            <span className="lg:col-span-2 index">02 — Regions</span>
            <p className="lg:col-span-6 text-fg-2 max-w-prose text-pretty">
              Two disciplines, three tiers each, two answer formats. Each region below is a live cluster in the network — the numbers come straight from the question bank.
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
                      className="group row grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] hover:bg-hover transition-colors -mx-4 px-4 rounded-lg"
                    >
                      <span className="font-mono text-xs text-fg-3 num">0{i + 1}</span>
                      <span className="flex items-center gap-4 min-w-0">
                        <span className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center text-fg shrink-0 group-hover:border-accent group-hover:text-accent transition-colors">
                          {c.id === 'python' ? <Code className="w-4 h-4" /> : <Sigma className="w-4 h-4" />}
                        </span>
                        <span className="font-display text-3xl md:text-4xl text-fg truncate">{labelCategory(c.id)}</span>
                      </span>
                      <span className="hidden md:flex items-center gap-5">
                        {Object.entries(c.difficulties)
                          .sort(([a], [b]) => ['easy', 'medium', 'hard'].indexOf(a) - ['easy', 'medium', 'hard'].indexOf(b))
                          .map(([d, n]) => (
                            <span key={d} className="inline-flex items-center gap-2 text-xs text-fg-2">
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
            : [0, 1].map((i) => <div key={i} className="h-[73px] border-b border-line skeleton" />)}
          <Reveal delay={0.14} y={12}>
            <Link to="/setup" state={{ category: 'all' }} className="group row grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] hover:bg-hover transition-colors -mx-4 px-4 rounded-lg">
              <span className="font-mono text-xs text-fg-3 num">0{categoryCount + 1}</span>
              <span className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-full bg-accent text-fg-inverse flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-current" />
                </span>
                <span className="font-display text-3xl md:text-4xl text-fg">Mixed <span className="t-italic text-fg-2">— cross the bridges</span></span>
              </span>
              <span className="hidden md:block text-xs text-fg-2">Every region, every tier, one session</span>
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
            <h2 className="font-display t-section text-fg mt-4 text-balance">Marks scale with the tier. Nothing is graded in your browser.</h2>
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
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-fg-3 mt-2">marks · {String(name)}</span>
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
          <div className="panel-ink rounded-3xl md:rounded-4xl p-7 sm:p-10 md:p-14 relative overflow-hidden">
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <span className="eyebrow">The path</span>
                <h2 className="font-display t-section mt-4 text-balance">One network, five states.</h2>
                <p className="muted text-sm mt-5 max-w-sm leading-relaxed">The same structure follows you through the product and changes with what you do — it is the interface, not a backdrop.</p>
              </div>
              <ol className="lg:col-span-8 grid sm:grid-cols-2 gap-x-10">
                {[
                  ['Home', 'Alive', 'Signals travel between regions; the camera drifts through depth.'],
                  ['Setup', 'Responsive', 'Choose a region and it moves toward you; the tier sets how dense it is.'],
                  ['Quiz', 'Quiet', 'It recedes into the paper so the question owns the page.'],
                  ['Result', 'Activated', 'Your score lights the network from its cores outward.'],
                  ['History', 'Accumulated', 'Regions you have practised stay established, attempt after attempt.'],
                ].map(([page, state, desc], i) => (
                  <li key={page} className="py-5 border-b" style={{ borderColor: 'rgb(var(--nx-cta-text-rgb) / 0.14)' }}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-display text-2xl">{page}</span>
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
            <h2 className="lg:col-span-8 font-display t-title text-fg text-balance">
              Start with a region. <span className="t-italic text-fg-2">Watch it light up.</span>
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
