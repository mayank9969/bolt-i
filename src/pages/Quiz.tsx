import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuiz } from '@/context/QuizContext'
import { submitQuiz } from '@/api/quizApi'
import { ArrowLeft, ArrowRight, Check } from '@/components/ui/Icons'
import Tier from '@/components/ui/Tier'
import { pulseNetwork, useNetwork } from '@/components/three/store'
import { labelCategory, labelDifficulty } from '@/lib/format'
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
  // Set once the server has scored the session, so the "no session → setup" guard below
  // doesn't fire while this page is still mounted during its exit transition.
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!session && !finishedRef.current) navigate('/setup', { replace: true })
  }, [session, navigate])

  // QUIZ — focus mode: the network recedes into the paper; activation tracks answered count.
  const answeredForScene = answers.filter((a) => a.trim() !== '').length
  useNetwork(
    { mode: 'quiet', camera: 'far', density: 0.4, activation: total ? 0.1 + (answeredForScene / total) * 0.5 : 0.1 },
    [answeredForScene, total],
  )
  // moving between questions sends one quiet signal
  useEffect(() => {
    pulseNetwork(0.5)
  }, [index])

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
      finishedRef.current = true
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

  return (
    <div className="relative flex-1 flex flex-col">
      {/* ── Progress header ─────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-canvas/90 backdrop-blur-md border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4 mb-2.5">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="t-h3 text-fg num whitespace-nowrap">
                <span className="text-accent">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-fg-3 text-base"> / {String(total).padStart(2, '0')}</span>
              </span>
              <span className="hidden sm:inline figcap truncate">
                {labelCategory(session.category)} · {labelDifficulty(session.difficulty)}
              </span>
            </div>
            <span className="figcap whitespace-nowrap">
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
                  aria-current={active ? 'step' : undefined}
                  className="relative h-1.5 flex-1 rounded-full track group"
                >
                  <motion.span
                    className="absolute inset-0 rounded-full fill"
                    initial={false}
                    animate={{ opacity: done ? 1 : active ? 0.4 : 0 }}
                    transition={{ duration: 0.35, ease }}
                  />
                  {active && <span className="absolute inset-0 rounded-full ring-1 ring-accent" />}
                </button>
              )
            })}
          </div>
          <div className="sr-only" aria-live="polite">{Math.round(progress)}% complete</div>
        </div>
      </div>

      {/* ── Question ────────────────────────────────────── */}
      <div className="flex-1 flex items-start md:items-center justify-center px-5 sm:px-6 py-10 md:py-14">
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
              <div className="relative pl-5 sm:pl-8 border-l border-line-strong">
                {/* current-question marker: a single accent rule on the margin line */}
                <span className="absolute -left-px top-1 h-12 w-[2px] bg-accent" aria-hidden="true" />

                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="chip">{labelCategory(current.category)}</span>
                  <Tier difficulty={current.difficulty} />
                  <span className="chip">{isMCQ ? 'Multiple choice' : 'Typed answer'}</span>
                </div>

                <h1 className="t-question text-fg text-pretty max-w-[26ch]">
                  {repairText(current.question)}
                </h1>

                <div className="mt-10">
                  {isMCQ && current.options ? (
                    <div className="grid gap-2.5">
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
                            className="group choice px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-4"
                          >
                            <span className="choice-key">
                              {selected ? <Check className="w-4 h-4" /> : key}
                            </span>
                            <span className={`flex-1 t-answer ${selected ? 'text-fg font-medium' : 'text-fg-2 group-hover:text-fg'}`}>
                              {repairText(text)}
                            </span>
                            {/* state is also spoken as text, not colour alone */}
                            <span className={`t-label shrink-0 ${selected ? 'text-accent' : 'text-fg-3 opacity-0 group-hover:opacity-100'}`}>
                              {selected ? 'Selected' : key}
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
                        className="field px-5 py-4 t-answer !text-lg !rounded-xl num"
                      />
                      <p className="t-caption text-fg-3 mt-3">
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

            <div className="hidden sm:flex items-center gap-1.5 t-caption text-fg-3">
              <kbd className="key">{isMCQ ? 'A–D' : 'Type'}</kbd>
              <span>then</span>
              <kbd className="key">Enter</kbd>
            </div>

            <button
              type="button"
              onClick={next}
              disabled={!currentAnswer.trim() || submitting}
              className={`btn-primary group ${isLast ? 'min-w-[9.5rem]' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-cta-text/30 border-t-cta-text animate-spin" />
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
                  <ArrowRight className="arrow w-4 h-4" />
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
                role="alert"
                className="mt-4 px-4 py-3 rounded-xl bg-err/10 border border-err/30 text-err text-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {isLast && answeredCount < total && (
            <p className="mt-4 text-center t-caption text-warn">
              {total - answeredCount} question{total - answeredCount === 1 ? '' : 's'} still unanswered — they’ll be marked wrong.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
