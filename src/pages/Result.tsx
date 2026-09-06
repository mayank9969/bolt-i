import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuiz } from '@/context/QuizContext'
import Reveal from '@/components/Reveal'
import { pulseNetwork, useNetwork } from '@/components/three/store'
import CountUp from '@/components/ui/CountUp'
import MagneticLink from '@/components/ui/MagneticLink'
import { ArrowRight, Check, Cross, Refresh } from '@/components/ui/Icons'
import Tier from '@/components/ui/Tier'
import { formatScore, labelCategory, performanceTone, toneText, toneVar } from '@/lib/format'
import { repairText } from '@/lib/text'

const ease = [0.22, 1, 0.36, 1] as const

export default function Result() {
  const navigate = useNavigate()
  const { result, config } = useQuiz()

  useEffect(() => {
    if (!result) navigate('/setup', { replace: true })
  }, [result, navigate])

  const pct = result?.percentage ?? 0
  const category = result?.category ?? 'all'
  // RESULT — activated: the camera starts near a core and pulls back while the score lights the network.
  useNetwork(
    { mode: 'activated', camera: 'reveal', density: 0.85, activation: Math.max(0.05, pct / 100), focusCluster: -1 },
    [pct],
  )
  useEffect(() => {
    if (!result) return
    const t1 = setTimeout(() => pulseNetwork(3), 400)
    const t2 = setTimeout(() => pulseNetwork(2), 1600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [result])

  if (!result) return null

  const tone = performanceTone(pct)
  const headline = pct >= 90 ? 'Exceptional.' : pct >= 80 ? 'Outstanding.' : pct >= 65 ? 'Strong work.' : pct >= 50 ? 'Solid effort.' : pct > 0 ? 'Keep going.' : 'Reset and retry.'
  const sub =
    pct >= 80
      ? 'You clearly know this region. Try a harder tier next.'
      : pct >= 50
        ? 'You have the fundamentals. Review the misses and go again.'
        : 'Every attempt is a data point. Review the answers and rebuild from there.'

  const review = result.review
  const n = review.length

  return (
    <div className="relative flex-1">
      {/* ── The number ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-10 items-end">
          <div className="lg:col-span-7">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease }} className="opener">
              <span>Quiz complete</span>
              <span className="text-fg-3/70">·</span>
              <span>{labelCategory(category)}</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease }} className="relative mt-6">
              <div className="wash absolute -inset-x-10 -inset-y-6 pointer-events-none" aria-hidden="true" />
              <p className="relative t-score text-fg num" aria-label={`${pct} percent accuracy`}>
                <CountUp value={pct} decimals={pct % 1 === 0 ? 0 : 1} delay={0.4} duration={1.6} />
                <span className="text-[0.4em] align-top ml-1 text-fg-2">%</span>
              </p>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45, ease }} className="t-title text-fg mt-4">
              {headline.replace('.', '')}
              <span className="text-fg-2">.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.7 }} className="text-fg-2 mt-4 max-w-md text-pretty">
              {sub}
            </motion.p>
          </div>

          {/* ledger */}
          <motion.dl
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease }}
            className="lg:col-span-5 surface rounded-2xl p-6 sm:p-8 grid grid-cols-2 gap-x-8"
          >
            <Ledger label="Score" delay={0.7}>
              <CountUp value={result.score} decimals={Number.isInteger(result.score) ? 0 : 1} delay={0.7} />
              <span className="text-lg text-fg-3"> / {formatScore(result.total_marks)}</span>
            </Ledger>
            <Ledger label="Questions" delay={0.8}>
              <CountUp value={result.total_questions} delay={0.8} />
            </Ledger>
            <Ledger label="Correct" delay={0.9} tone="ok">
              <CountUp value={result.correct_answers} delay={0.9} />
            </Ledger>
            <Ledger label="Incorrect" delay={1.0} tone={result.wrong_answers ? 'err' : undefined}>
              <CountUp value={result.wrong_answers} delay={1.0} />
            </Ledger>
            <div className="col-span-2 pt-5 flex flex-wrap items-center gap-2">
              <span className="chip">{labelCategory(result.category)}</span>
              <Tier difficulty={result.difficulty} />
              {config && <span className="chip num">{config.questionCount} requested</span>}
            </div>
          </motion.dl>
        </div>

        {/* path strip: every question as a node, in order */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.1 }} className="mt-14">
          <div className="flex items-center justify-between figcap mb-3">
            <span>Your path through the network</span>
            <span>
              <span className={toneText[tone]}>{result.correct_answers}</span> of {n} activated
            </span>
          </div>
          <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Answers in order">
            {review.map((item, i) => (
              <li key={i} className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
                <motion.a
                  href={`#q${i + 1}`}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.05, type: 'spring', stiffness: 380, damping: 22 }}
                  className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center ${
                    item.is_correct ? 'bg-accent border-accent text-fg-inverse' : 'bg-canvas border-line-strong text-fg-3'
                  }`}
                  aria-label={`Question ${i + 1}: ${item.is_correct ? 'correct' : 'incorrect'}`}
                  title={`Q${i + 1} · ${item.is_correct ? 'correct' : 'incorrect'}`}
                >
                  {item.is_correct ? <Check className="w-2.5 h-2.5" /> : <Cross className="w-2.5 h-2.5" />}
                </motion.a>
                {i < n - 1 && (
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.25 + i * 0.05, duration: 0.3, ease }}
                    className={`h-px flex-1 origin-left ${item.is_correct && review[i + 1].is_correct ? 'bg-accent' : 'bg-line-strong'}`}
                  />
                )}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* actions */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.3, ease }} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <MagneticLink to="/setup" className="btn-primary btn-lg">
            <Refresh className="w-5 h-5" />
            Play again
          </MagneticLink>
          <Link to="/history" className="link-rule text-sm">
            See it in your history
            <ArrowRight className="arrow w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Review ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 pb-24 md:pb-32">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-8 items-baseline border-t border-line-strong pt-10 mb-8">
            <span className="lg:col-span-2 index">Review</span>
            <h2 className="lg:col-span-10 t-section text-fg">Every answer, explained.</h2>
          </div>
        </Reveal>

        <ol className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-2" />
          <div className="lg:col-span-10 border-t border-line quiz-paper">
            {review.map((item, i) => {
              const ok = item.is_correct
              const shown = (v: string) => repairText(item.question_type === 'mcq' && item.options ? `${v} — ${item.options[v] ?? '—'}` : v || '—')
              return (
                <Reveal key={i} delay={Math.min(i * 0.03, 0.2)} y={12}>
                  <li id={`q${i + 1}`} className="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[4rem_1fr_auto] gap-x-4 gap-y-3 py-6 border-b border-line scroll-mt-28">
                    <div className="flex flex-col items-start gap-2">
                      <span className="t-caption text-fg-3 num">{String(i + 1).padStart(2, '0')}</span>
                      <span className={`inline-flex items-center gap-1.5 t-label ${ok ? 'text-ok' : 'text-err'}`}>
                        {ok ? <Check className="w-3 h-3" /> : <Cross className="w-3 h-3" />}
                        <span className="hidden sm:inline">{ok ? 'Right' : 'Wrong'}</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="t-h3 text-fg leading-snug text-pretty">{repairText(item.question)}</p>
                      <dl className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div>
                          <dt className="figcap">Your answer</dt>
                          {item.user_answer.trim() ? (
                            <dd className={`mt-1 num ${ok ? 'text-ok' : 'text-err line-through decoration-err/60'}`}>{shown(item.user_answer)}</dd>
                          ) : (
                            <dd className="mt-1 text-fg-3 italic">Not answered</dd>
                          )}
                        </div>
                        {!ok && (
                          <div>
                            <dt className="figcap">Correct answer</dt>
                            <dd className="mt-1 num text-fg">{shown(item.correct_answer)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <div className="col-start-2 sm:col-start-3 flex sm:flex-col items-center sm:items-end gap-2">
                      <span className={`t-h3 num ${ok ? 'text-fg' : 'text-fg-3'}`}>{ok ? `+${formatScore(item.marks)}` : '0'}</span>
                      <Tier difficulty={item.difficulty} />
                    </div>
                  </li>
                </Reveal>
              )
            })}
          </div>
        </ol>
      </section>

      {/* tone-coloured hairline at the very top of the page: performance, not decoration */}
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.max(0.02, pct / 100) }}
        transition={{ duration: 1.6, delay: 0.4, ease }}
        className="fixed top-16 left-0 right-0 h-[2px] origin-left z-40"
        style={{ background: toneVar[tone] }}
      />
    </div>
  )
}

function Ledger({ label, children, delay, tone }: { label: string; children: React.ReactNode; delay: number; tone?: 'ok' | 'err' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease }} className="py-4 border-b border-line">
      <dt className="figcap">{label}</dt>
      <dd className={`t-stat-sm mt-1.5 num ${tone === 'ok' ? 'text-ok' : tone === 'err' ? 'text-err' : 'text-fg'}`}>{children}</dd>
    </motion.div>
  )
}
