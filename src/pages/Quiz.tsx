import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuiz } from '@/context/QuizContext'
import { submitQuiz } from '@/api/quizApi'
import { ArrowLeft, ArrowRight, Check } from '@/components/ui/Icons'
import { difficultyTone, labelCategory, labelDifficulty } from '@/lib/format'
import { repairText } from '@/lib/text'

const ease = [0.22, 1, 0.36, 1] as const

export default function Quiz() {
  const navigate = useNavigate()
  const { session, finishSession } = useQuiz()

  const questions = useMemo(() => session?.questions ?? [], [session])
  const total = questions.length

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(() => Array(total).fill(''))
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session) navigate('/setup', { replace: true })
  }, [session, navigate])

  const current = questions[index]
  const isMCQ = current?.question_type === 'mcq'
  const currentAnswer = answers[index] ?? ''
  const answeredCount = answers.filter((a) => a.trim() !== '').length
  const isLast = index === total - 1

  useEffect(() => {
    if (!isMCQ) inputRef.current?.focus()
  }, [index, isMCQ])

  const setAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => {
        const next = [...prev]
        next[index] = value
        return next
      })
    },
    [index],
  )

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= total) return
      setDirection(to > index ? 1 : -1)
      setIndex(to)
    },
    [index, total],
  )

  const finish = useCallback(async () => {
    if (!session || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await submitQuiz(session.session_id, answers)
      finishSession(result)
      navigate('/result', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }, [session, submitting, answers, finishSession, navigate])

  const next = useCallback(() => {
    if (!currentAnswer.trim()) return
    if (isLast) finish()
    else go(index + 1)
  }, [currentAnswer, isLast, finish, go, index])

  // Keyboard: A–D pick options, Enter continues, arrows navigate.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'
      if (isMCQ && !typing && current?.options) {
        const k = e.key.toUpperCase()
        if (current.options[k]) {
          setAnswer(k)
          return
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' && !typing) go(index - 1)
      else if (e.key === 'ArrowRight' && !typing && currentAnswer.trim()) go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMCQ, current, setAnswer, next, go, index, currentAnswer])

  if (!session || !current) return null

  const progress = (answeredCount / total) * 100
  const tone = difficultyTone(current.difficulty)

  return (
    <div className="relative flex-1 flex flex-col">
      {/* ── Progress header ─────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-ink-975/85 backdrop-blur-xl border-b border-ink-800/60">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4 mb-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-display text-base sm:text-lg text-ink-50 num whitespace-nowrap">
                Question <span className="text-accent-300">{index + 1}</span>
                <span className="text-ink-500"> / {total}</span>
              </span>
              <span className="hidden sm:inline text-ink-700">·</span>
              <span className="hidden sm:inline text-xs text-ink-400 truncate">
                {labelCategory(session.category)} · {labelDifficulty(session.difficulty)}
              </span>
            </div>
            <span className="text-xs text-ink-400 num whitespace-nowrap">
              {answeredCount} answered
            </span>
          </div>
          {/* segmented bar */}
          <div className="flex gap-1">
            {questions.map((_, i) => {
              const done = answers[i]?.trim() !== ''
              const active = i === index
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to question ${i + 1}`}
                  onClick={() => go(i)}
                  className="relative h-1.5 flex-1 rounded-full bg-ink-800/80 overflow-hidden group"
                >
                  <motion.span
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-300 to-accent-500"
                    initial={false}
                    animate={{ opacity: done ? 1 : active ? 0.45 : 0, boxShadow: done ? '0 0 10px rgba(44,196,245,0.6)' : 'none' }}
                    transition={{ duration: 0.35, ease }}
                  />
                  {active && <span className="absolute inset-0 rounded-full ring-1 ring-accent-300/70" />}
                </button>
              )
            })}
          </div>
          <div className="sr-only" aria-live="polite">{Math.round(progress)}% complete</div>
        </div>
      </div>

      {/* ── Question ────────────────────────────────────── */}
      <div className="flex-1 flex items-start md:items-center justify-center px-5 sm:px-6 py-8 md:py-12">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={index}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? -28 : 28, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease }}
            >
              <div className="surface-strong rounded-3xl md:rounded-4xl p-6 sm:p-8 md:p-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent-400/[0.08] blur-[90px] pointer-events-none" />

                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="chip">{labelCategory(current.category)}</span>
                  <span className={`chip chip-${tone}`}>{current.difficulty}</span>
                  <span className="chip">{isMCQ ? 'Multiple choice' : 'Typed answer'}</span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl md:text-[2.15rem] leading-snug text-ink-50 text-pretty">
                  {repairText(current.question)}
                </h1>

                <div className="mt-8">
                  {isMCQ && current.options ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(current.options).map(([key, text], i) => {
                        const selected = currentAnswer === key
                        return (
                          <motion.button
                            key={key}
                            type="button"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease }}
                            onClick={() => setAnswer(key)}
                            data-selected={selected}
                            aria-pressed={selected}
                            className="choice p-4 sm:p-5 flex items-start gap-4"
                          >
                            <span
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-display text-base shrink-0 transition-colors ${
                                selected ? 'bg-accent-400 text-ink-975' : 'bg-ink-900/80 border border-ink-700/60 text-ink-300'
                              }`}
                            >
                              {selected ? <Check className="w-4 h-4" /> : key}
                            </span>
                            <span className={`text-[15px] sm:text-base leading-relaxed pt-1.5 font-mono ${selected ? 'text-ink-50' : 'text-ink-200'}`}>
                              {repairText(text)}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35, ease }}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer…"
                        autoComplete="off"
                        spellCheck={false}
                        className="field px-5 py-4 text-lg font-mono"
                      />
                      <p className="text-xs text-ink-500 mt-3">
                        {current.difficulty === 'hard'
                          ? 'Hard tier: answers must match exactly, including spacing and case.'
                          : current.difficulty === 'medium'
                            ? 'Medium tier: case doesn’t matter, extra spaces are ignored.'
                            : 'Easy tier: case doesn’t matter.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Controls ─────────────────────────────────── */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-500">
              <kbd className="px-1.5 py-0.5 rounded bg-ink-900 border border-ink-800 font-mono">{isMCQ ? 'A–D' : 'Type'}</kbd>
              <span>then</span>
              <kbd className="px-1.5 py-0.5 rounded bg-ink-900 border border-ink-800 font-mono">Enter</kbd>
            </div>

            <button
              type="button"
              onClick={next}
              disabled={!currentAnswer.trim() || submitting}
              className={`btn-primary group ${isLast ? 'min-w-[9.5rem]' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-ink-975/30 border-t-ink-975 animate-spin" />
                  Scoring
                </>
              ) : isLast ? (
                <>
                  Finish quiz
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/25 text-danger-300 text-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {isLast && answeredCount < total && (
            <p className="mt-4 text-center text-xs text-ink-500">
              {total - answeredCount} question{total - answeredCount === 1 ? '' : 's'} still unanswered — they’ll be marked wrong.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
