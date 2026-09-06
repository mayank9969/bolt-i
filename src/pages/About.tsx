import { Link } from 'react-router-dom'
import Reveal from '@/components/Reveal'
import { useNetwork } from '@/components/three/store'
import { LogoMark } from '@/components/Logo'
import Tier from '@/components/ui/Tier'
import { ArrowRight, Bolt, Layers, Shield, Sparkle, Target, Trend } from '@/components/ui/Icons'

export default function About() {
  // ABOUT — atmospheric: museum-slow, off to the side, never competing with the text.
  useNetwork({ mode: 'atmospheric', camera: 'museum', density: 0.55, activation: 0.3 })
  return (
    <div className="relative flex-1">
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* ── Intro ───────────────────────────────────── */}
        <Reveal>
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
            <LogoMark size={72} className="hidden md:block" />
            <div>
              <span className="opener">About</span>
              <h1 className="t-title text-fg mt-5 text-balance">
                A quiz platform built around one idea: <span className="text-accent">progression.</span>
              </h1>
              <p className="text-fg-2 mt-6 text-lg leading-relaxed text-pretty max-w-2xl">
                NEXUSQuiz is a focused place to test what you know in Maths and Python. No clutter, no gimmicks —
                just well-written questions, honest scoring and a history that shows how far you’ve come.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── Meaning ─────────────────────────────────── */}
        <Reveal delay={0.08}>
          <div className="panel-ink rounded-3xl md:rounded-4xl p-7 sm:p-10 mt-16 relative overflow-hidden">
            <span className="eyebrow">The name</span>
            <div className="grid sm:grid-cols-3 gap-8 mt-6">
              {[
                { k: 'Connection', d: 'Topics link together. Algebra feeds calculus; syntax feeds idioms. Mixed quizzes join the dots.' },
                { k: 'Intelligence', d: 'Marks scale with difficulty and format, and every answer is validated by a consistent rule set.' },
                { k: 'Progression', d: 'Each attempt becomes a data point. Over time the trend matters more than any single score.' },
              ].map((item, i) => (
                <div key={item.k}>
                  <div className="flex items-center gap-3">
                    <span className="index">0{i + 1}</span>
                    <span className="hairline flex-1" />
                  </div>
                  <h3 className="t-h3 mt-4">{item.k}</h3>
                  <p className="text-sm muted leading-relaxed mt-2">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Features ────────────────────────────────── */}
        <div className="mt-14">
          <Reveal>
            <span className="index">What you get</span>
            <h2 className="t-section text-fg mt-3">Everything you need to practise properly</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line-strong border border-line-strong rounded-2xl overflow-hidden mt-8">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05} className="bg-canvas">
                <div className="p-6 sm:p-7 h-full group hover:bg-hover transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-accent">{f.icon}</span>
                    <span className="index">0{i + 1}</span>
                  </div>
                  <h3 className="t-h3 text-fg mt-6">{f.title}</h3>
                  <p className="text-sm text-fg-2 leading-relaxed mt-2">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── Scoring ─────────────────────────────────── */}
        <Reveal>
          <div className="mt-14 grid md:grid-cols-2 gap-4">
            <div className="surface rounded-2xl p-6 sm:p-8">
              <span className="eyebrow">Scoring</span>
              <h3 className="t-h3 text-fg mt-2">Marks per question</h3>
              <ul className="mt-5 space-y-3">
                {[
                  ['easy', '2 marks'],
                  ['medium', '4 marks'],
                  ['hard', '6 marks'],
                ].map(([tier, marks]) => (
                  <li key={tier} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
                    <Tier difficulty={tier} />
                    <span className="text-sm font-medium text-fg num">{marks}</span>
                  </li>
                ))}
              </ul>
              <p className="t-caption text-fg-3 mt-4">Multiple-choice questions are worth half the marks of a typed answer at the same tier.</p>
            </div>
            <div className="surface rounded-2xl p-6 sm:p-8">
              <span className="eyebrow">Validation</span>
              <h3 className="t-h3 text-fg mt-2">How answers are checked</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  ['Multiple choice', 'Exact option letter.'],
                  ['Easy · typed', 'Case-insensitive match.'],
                  ['Medium · typed', 'Case-insensitive, whitespace normalised.'],
                  ['Hard · typed', 'Exact match — spacing and case matter.'],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2.5 border-b border-line last:border-0">
                    <span className="text-fg-2 sm:w-40 shrink-0">{k}</span>
                    <span className="text-fg">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* ── Credits + CTA ───────────────────────────── */}
        <Reveal>
          <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-line-strong pt-8">
            <div>
              <p className="text-fg font-medium">Built by Mayank Sarwal</p>
              <p className="text-sm text-fg-2 mt-1">Designed as a personal product — every pixel and every rule.</p>
            </div>
            <Link to="/setup" className="btn-primary btn-lg group shrink-0">
              Start a quiz
              <ArrowRight className="arrow w-5 h-5" />
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
