import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuiz } from '@/context/QuizContext'
import Reveal from '@/components/Reveal'
import SceneLayer from '@/components/SceneLayer'
import CountUp from '@/components/ui/CountUp'
import MagneticLink from '@/components/ui/MagneticLink'
import { ArrowRight, Check, Clock, Cross, Refresh } from '@/components/ui/Icons'
import Tier from '@/components/ui/Tier'
import { formatScore, labelCategory, performanceTone, toneSoftVar, toneText, toneVar } from '@/lib/format'
import { repairText } from '@/lib/text'

const ease = [0.22, 1, 0.36, 1] as const

export default function Result() {
  const navigate = useNavigate()
  const { result, config } = useQuiz()

  useEffect(() => {
    if (!result) navigate('/setup', { replace: true })
  }, [result, navigate])

  if (!result) return null

  const pct = result.percentage
  const tone = performanceTone(pct)
  const headline = pct >= 90 ? 'Exceptional.' : pct >= 80 ? 'Outstanding.' : pct >= 65 ? 'Strong work.' : pct >= 50 ? 'Solid effort.' : pct > 0 ? 'Keep going.' : 'Reset and retry.'
  const sub =
    pct >= 80
      ? 'You clearly know this material. Try a harder tier next.'
      : pct >= 50
        ? 'You’ve got the fundamentals. Review the misses below and go again.'
        : 'Every attempt is progress. Review the answers and rebuild from there.'

  const R = 84
  const C = 2 * Math.PI * R
  const offset = C - (Math.min(pct, 100) / 100) * C

  return (
    <div className="relative flex-1 overflow-hidden">
      <SceneLayer variant="ambient" opacity={0.3} />
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-canvas/80 to-canvas pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 py-12 md:py-16">
        {/* ── Header ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="text-center">
          <span className="inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full surface text-xs text-fg-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-fg-inverse" style={{ background: toneVar[tone] }}>
              <Check className="w-3 h-3" />
            </span>
            Quiz complete
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-fg mt-5">{headline}</h1>
          <p className="text-fg-2 mt-3 max-w-md mx-auto text-pretty">{sub}</p>
        </motion.div>

        {/* ── Score card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="surface-strong rounded-3xl md:rounded-4xl p-6 sm:p-8 md:p-10 mt-10 relative overflow-hidden"
        >
          {/* performance tint — one soft field, no halo */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[120px] pointer-events-none" style={{ background: toneSoftVar[tone] }} />

          <div className="relative grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center">
            {/* ring */}
            <div className="relative w-52 h-52 sm:w-56 sm:h-56 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={R} fill="none" stroke="var(--nx-track)" strokeWidth="10" />
                <motion.circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  stroke={toneVar[tone]}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.3, ease, delay: 0.35 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-5xl sm:text-[3.4rem] leading-none text-score num">
                  <CountUp value={pct} decimals={pct % 1 === 0 ? 0 : 1} delay={0.35} duration={1.3} suffix="%" />
                </span>
                <span className="eyebrow-muted mt-2">Accuracy</span>
              </div>
            </div>

            {/* stats */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Score" delay={0.45}>
                  <span className="text-accent">
                    <CountUp value={result.score} decimals={Number.isInteger(result.score) ? 0 : 1} delay={0.45} />
                  </span>
                  <span className="text-base text-fg-3 font-sans"> / {formatScore(result.total_marks)}</span>
                </Stat>
                <Stat label="Questions" delay={0.5}>
                  <CountUp value={result.total_questions} delay={0.5} />
                </Stat>
                <Stat label="Correct" delay={0.55} icon={<Check className="w-3.5 h-3.5 text-ok" />}>
                  <span className="text-ok"><CountUp value={result.correct_answers} delay={0.55} /></span>
                </Stat>
                <Stat label="Incorrect" delay={0.6} icon={<Cross className="w-3.5 h-3.5 text-err" />}>
                  <span className={result.wrong_answers ? 'text-err' : 'text-fg-3'}><CountUp value={result.wrong_answers} delay={0.6} /></span>
                </Stat>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span className="chip">{labelCategory(result.category)}</span>
                <Tier difficulty={result.difficulty} />
                {config && <span className="chip num">{config.questionCount} requested</span>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Actions ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="grid sm:grid-cols-3 gap-3 mt-6"
        >
          <MagneticLink to="/setup" className="btn-primary btn-lg group sm:col-span-1">
            <Refresh className="w-5 h-5" />
            Play again
          </MagneticLink>
          <Link to="/history" className="btn-secondary btn-lg">
            <Clock className="w-5 h-5 text-fg-2" />
            View history
          </Link>
          <Link to="/" className="btn-secondary btn-lg">
            Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* ── Review ──────────────────────────────────── */}
        <div className="mt-14">
          <Reveal>
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="eyebrow">Review</span>
                <h2 className="font-display text-2xl sm:text-3xl text-fg mt-1">Every answer, explained</h2>
              </div>
              <span className="text-xs text-fg-3 num hidden sm:block">
                <span className={toneText[tone]}>{result.correct_answers}</span> of {result.total_questions} correct
              </span>
            </div>
          </Reveal>

          <ol className="space-y-3">
            {result.review.map((item, i) => {
              const ok = item.is_correct
              const shown = (v: string) => repairText(item.question_type === 'mcq' && item.options ? `${v} — ${item.options[v] ?? '—'}` : v || '—')
              return (
                <Reveal key={i} delay={Math.min(i * 0.04, 0.3)} y={16}>
                  <li className={`surface rounded-2xl p-5 sm:p-6 border-l-[3px] ${ok ? 'border-l-ok' : 'border-l-err'}`}>
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ok ? 'bg-ok/15 text-ok' : 'bg-err/15 text-err'}`}>
                        {ok ? <Check className="w-4 h-4" /> : <Cross className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-fg font-medium leading-relaxed">
                            <span className="text-fg-3 font-mono text-xs mr-2">{String(i + 1).padStart(2, '0')}</span>
                            {repairText(item.question)}
                          </p>
                          <span className={`chip shrink-0 num hidden sm:inline-flex ${ok ? 'chip-success' : ''}`}>{ok ? `+${formatScore(item.marks)}` : '0'} pts</span>
                        </div>
                        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                          <div className={`rounded-lg px-3 py-2 font-mono ${ok ? 'bg-ok/10 text-ok' : 'bg-err/10 text-err'}`}>
                            <span className="block text-[10px] uppercase tracking-wider text-fg-3 font-sans mb-0.5">Your answer</span>
                            {shown(item.user_answer)}
                          </div>
                          {!ok && (
                            <div className="rounded-lg px-3 py-2 font-mono bg-ok/10 text-ok">
                              <span className="block text-[10px] uppercase tracking-wider text-fg-3 font-sans mb-0.5">Correct answer</span>
                              {shown(item.correct_answer)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                </Reveal>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, children, delay, icon }: { label: string; children: React.ReactNode; delay: number; icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      className="surface rounded-2xl p-4 sm:p-5"
    >
      <p className="eyebrow-muted flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="font-display text-2xl sm:text-3xl text-fg mt-1.5 num">{children}</p>
    </motion.div>
  )
}
