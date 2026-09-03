import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import { LogoMark } from '@/components/Logo'
import { ArrowRight, Bolt, Layers, Shield, Sparkle, Target, Trend } from '@/components/ui/Icons'

export default function About() {
  return (
    <div className="relative flex-1">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* ── Intro ───────────────────────────────────── */}
        <Reveal>
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
            <LogoMark size={72} className="hidden md:block" />
            <div>
              <span className="eyebrow">About</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink-50 mt-3 text-balance leading-[1.05]">
                A quiz platform built around one idea: <span className="text-gradient">progression.</span>
              </h1>
              <p className="text-ink-300 mt-6 text-lg leading-relaxed text-pretty max-w-2xl">
                NEXUSQuiz is a focused place to test what you know in Maths and Python. No clutter, no gimmicks —
                just well-written questions, honest scoring and a history that shows how far you’ve come.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── Meaning ─────────────────────────────────── */}
        <Reveal delay={0.08}>
          <div className="surface-strong rounded-4xl p-7 sm:p-10 mt-14 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-400/10 blur-[100px] pointer-events-none" />
            <span className="eyebrow">The name</span>
            <div className="grid sm:grid-cols-3 gap-8 mt-6">
              {[
                { k: 'Connection', d: 'Topics link together. Algebra feeds calculus; syntax feeds idioms. Mixed quizzes join the dots.' },
                { k: 'Intelligence', d: 'Marks scale with difficulty and format, and every answer is validated by a consistent rule set.' },
                { k: 'Progression', d: 'Each attempt becomes a data point. Over time the trend matters more than any single score.' },
              ].map((item, i) => (
                <div key={item.k}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-accent-300 tracking-widest">0{i + 1}</span>
                    <span className="hairline flex-1" />
                  </div>
                  <h3 className="font-display text-xl text-ink-50 mt-4">{item.k}</h3>
                  <p className="text-sm text-ink-400 leading-relaxed mt-2">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Features ────────────────────────────────── */}
        <div className="mt-14">
          <Reveal>
            <span className="eyebrow">What you get</span>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-50 mt-3">Everything you need to practise properly</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="surface surface-hover rounded-2.5xl p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center text-accent-300 mb-5">{f.icon}</div>
                  <h3 className="font-display text-lg text-ink-50">{f.title}</h3>
                  <p className="text-sm text-ink-400 leading-relaxed mt-2">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── Scoring ─────────────────────────────────── */}
        <Reveal>
          <div className="mt-14 grid md:grid-cols-2 gap-4">
            <div className="surface rounded-2.5xl p-6 sm:p-8">
              <span className="eyebrow">Scoring</span>
              <h3 className="font-display text-2xl text-ink-50 mt-2">Marks per question</h3>
              <ul className="mt-5 space-y-3">
                {[
                  ['Easy', '2 marks', 'success'],
                  ['Medium', '4 marks', 'warning'],
                  ['Hard', '6 marks', 'danger'],
                ].map(([tier, marks, tone]) => (
                  <li key={tier} className="flex items-center justify-between py-2.5 border-b border-ink-800/60 last:border-0">
                    <span className={`chip chip-${tone}`}>{tier}</span>
                    <span className="font-mono text-sm text-ink-100">{marks}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-500 mt-4">Multiple-choice questions are worth half the marks of a typed answer at the same tier.</p>
            </div>
            <div className="surface rounded-2.5xl p-6 sm:p-8">
              <span className="eyebrow">Validation</span>
              <h3 className="font-display text-2xl text-ink-50 mt-2">How answers are checked</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  ['Multiple choice', 'Exact option letter.'],
                  ['Easy · typed', 'Case-insensitive match.'],
                  ['Medium · typed', 'Case-insensitive, whitespace normalised.'],
                  ['Hard · typed', 'Exact match — spacing and case matter.'],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2.5 border-b border-ink-800/60 last:border-0">
                    <span className="text-ink-400 sm:w-40 shrink-0">{k}</span>
                    <span className="text-ink-100">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* ── Credits + CTA ───────────────────────────── */}
        <Reveal>
          <div className="mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 surface rounded-2.5xl p-6 sm:p-8">
            <div>
              <p className="text-ink-50 font-medium">Built by Mayank Sarwal</p>
              <p className="text-sm text-ink-400 mt-1">Designed as a personal product — every pixel and every rule.</p>
            </div>
            <Link to="/setup" className="btn-primary btn-lg group shrink-0">
              Start a quiz
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

const features = [
  { title: 'Two disciplines', desc: 'Maths and Python, each with easy, medium and hard tiers.', icon: <Layers className="w-5 h-5" /> },
  { title: 'Mixed mode', desc: 'Blend every topic and tier into a single session when you want variety.', icon: <Sparkle className="w-5 h-5" /> },
  { title: 'Two formats', desc: 'Multiple-choice for recall, typed answers for precision.', icon: <Target className="w-5 h-5" /> },
  { title: 'Instant results', desc: 'Scored the moment you finish, with a full answer-by-answer review.', icon: <Bolt className="w-5 h-5" /> },
  { title: 'Secure scoring', desc: 'Answers live on the server. Nothing is checked — or leaked — in the browser.', icon: <Shield className="w-5 h-5" /> },
  { title: 'Progress tracking', desc: 'Trends, accuracy and per-topic breakdowns built from your real history.', icon: <Trend className="w-5 h-5" /> },
]
