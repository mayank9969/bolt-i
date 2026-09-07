import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useQuiz } from '@/context/QuizContext'
import { submitQuiz } from '@/api/quizApi'
import { ArrowLeft, ArrowRight, Check } from '@/components/ui/Icons'
import { pulseNetwork, useNetwork } from '@/components/three/store'
import { labelCategory, labelDifficulty } from '@/lib/format'
import { repairText } from '@/lib/text'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * QUIZ — the answering surface.
 *
 * One column, one job. Reading order is fixed: where am I → the question →
 * the answers → what happens next. Everything else (category, tier, format,
 * keyboard hints) is a single quiet line of context, never a row of badges.
 *
 * Rules the page keeps:
 *  · an answer can always be changed until Finish is pressed
 *  · Next requires an answer; Skip (same button, unanswered) never does
 *  · every question is reachable from the progress strip
 *  · Enter continues only when there is an answer, so it can't skip by accident
 */
export default function Quiz() {
  const navigate = useNavigate()
  const { session, finishSession } = useQuiz()
  const reduceMotion = useReducedMotion()

  const questions = useMemo(() => session?.questions ?? [], [session])
  const total = questions.length

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(() => Array(total).fill(''))
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Set once the server has scored the session, so the "no session → setup" guard below
  // doesn't fire while this page is still mounted during its exit transition.
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!session && !finishedRef.current) navigate('/setup', { replace: true })
  }, [session, navigate])

  // QUIZ — focus mode: the network recedes into the paper; activation tracks answered count.
  const answeredCount = answers.filter((a) => a.trim() !== '').length
  useNetwork(
    { mode: 'quiet', camera: 'far', density: 0.4, activation: total ? 0.1 + (answeredCount / total) * 0.5 : 0.1 },
    [answeredCount, total],
  )
  // moving between questions sends one quiet signal
  useEffect(() => {
    pulseNetwork(0.5)
  }, [index])

  const current = questions[index]
  const isMCQ = current?.question_type === 'mcq'
  const optionEntries = useMemo(() => (isMCQ && current?.options ? Object.entries(current.options) : []), [isMCQ, current])
  const currentAnswer = answers[index] ?? ''
  const hasAnswer = currentAnswer.trim() !== ''
  const isLast = index === total - 1
  const unanswered = total - answeredCount

  // On arrival at a question: typed → cursor in the field; choice → focus the
  // question itself so screen readers read it, then Tab lands on the answers.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (isMCQ) headingRef.current?.focus({ preventScroll: true })
      else inputRef.current?.focus({ preventScroll: true })
    }, reduceMotion ? 0 : 120)
    return () => window.clearTimeout(t)
  }, [index, isMCQ, reduceMotion])

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
      if (to < 0 || to >= total || to === index) return
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

  // The primary button: Next when answered, Skip when not, Finish on the last question.
  const advance = useCallback(() => {
    if (submitting) return
    if (isLast) finish()
    else go(index + 1)
  }, [submitting, isLast, finish, go, index])

  // Keyboard: A–D choose, ↑/↓ move the choice, Enter continues (only with an answer), ←/→ move between questions.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'
      if (isMCQ && !typing && optionEntries.length) {
        const k = e.key.toUpperCase()
        const hit = optionEntries.findIndex(([key]) => key === k)
        if (hit >= 0) {
          setAnswer(optionEntries[hit][0])
          optionRefs.current[hit]?.focus()
          return
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const cur = optionEntries.findIndex(([key]) => key === currentAnswer)
          const step = e.key === 'ArrowDown' ? 1 : -1
          const nextIdx = cur < 0 ? (step > 0 ? 0 : optionEntries.length - 1) : (cur + step + optionEntries.length) % optionEntries.length
          setAnswer(optionEntries[nextIdx][0])
          optionRefs.current[nextIdx]?.focus()
          return
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        if (!hasAnswer) return
        e.preventDefault()
        advance()
      } else if (e.key === 'ArrowLeft' && !typing) go(index - 1)
      else if (e.key === 'ArrowRight' && !typing) go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMCQ, optionEntries, setAnswer, advance, go, index, currentAnswer, hasAnswer])

  if (!session) return null

  // Empty state — the server returned a session with no questions.
  if (!current) {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="surface-strong rounded-2xl p-8 max-w-md text-center" role="alert">
          <p className="t-h3 text-fg">No questions came back for this selection.</p>
          <p className="t-body text-fg-2 mt-2">Try a different region or tier.</p>
          <Link to="/setup" className="btn-primary mt-6">Back to setup</Link>
        </div>
      </div>
    )
  }

  const status = submitting
    ? 'Sending your answers to be scored…'
    : !hasAnswer
      ? isLast
        ? unanswered > 1
          ? `${unanswered} questions are unanswered — they’ll count as wrong if you finish now.`
          : 'This question is unanswered — it’ll count as wrong if you finish now.'
        : `${isMCQ ? 'Choose an answer' : 'Type an answer'} to continue, or skip and come back later.`
      : isLast
        ? unanswered > 0
          ? `${unanswered} earlier question${unanswered === 1 ? ' is' : 's are'} unanswered — use the strip above to go back.`
          : 'All answered. Finish to see your score.'
        : 'Saved. You can change any answer until you finish.'

  const primaryLabel = submitting ? 'Scoring…' : isLast ? 'Finish quiz' : hasAnswer ? 'Next' : 'Skip'

  const slide = reduceMotion ? 0 : 20

  return (
    <div className="relative flex-1 flex flex-col">
      {/* ── Where am I ──────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-canvas/90 backdrop-blur-md border-b border-line">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-3 pb-1">
          <div className="flex items-baseline justify-between gap-4">
            <p className="t-h3 text-fg num whitespace-nowrap">
              Question {index + 1} <span className="text-fg-3 font-normal">of {total}</span>
            </p>
            <p className="figcap num whitespace-nowrap">
              <span className="hidden sm:inline">{labelCategory(session.category)} · {labelDifficulty(session.difficulty)} · </span>
              {answeredCount} of {total} answered
            </p>
          </div>

          {/* progress strip: one segment per question — filled = answered, ringed = current; every segment is a link */}
          <div className="flex gap-1 mt-1.5" role="list" aria-label="Questions">
            {questions.map((_, i) => {
              const done = answers[i]?.trim() !== ''
              const active = i === index
              return (
                <button
                  key={i}
                  type="button"
                  role="listitem"
                  aria-label={`Question ${i + 1}${done ? ', answered' : ', not answered'}${active ? ', current' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  title={`Question ${i + 1}${done ? ' · answered' : ''}`}
                  onClick={() => go(i)}
                  className="progress-seg"
                  data-done={done}
                  data-active={active}
                >
                  <span className="progress-seg-bar" />
                </button>
              )
            })}
          </div>
          <p className="sr-only" aria-live="polite">{answeredCount} of {total} answered</p>
        </div>
      </div>

      {/* ── The question ────────────────────────────────── */}
      <div className="flex-1 flex items-start md:items-center justify-center px-5 sm:px-6 pt-8 pb-4 md:py-14">
        <div className="w-full max-w-2xl quiz-paper">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={index}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? slide : -slide, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? -slide : slide, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
              aria-labelledby="quiz-question"
            >
              {/* one line of context — never a row of badges */}
              <p className="figcap num">
                {labelCategory(current.category)} · {labelDifficulty(current.difficulty)} · {isMCQ ? 'Choose one' : 'Type the answer'}
              </p>

              <h1
                id="quiz-question"
                ref={headingRef}
                tabIndex={-1}
                className="t-question text-fg text-pretty max-w-[38ch] mt-3 outline-none"
              >
                {repairText(current.question)}
              </h1>

              <div className="mt-8">
                {isMCQ ? (
                  <div role="radiogroup" aria-labelledby="quiz-question" className="grid gap-2">
                    {optionEntries.map(([key, text], i) => {
                      const selected = currentAnswer === key
                      return (
                        <button
                          key={key}
                          ref={(el) => { optionRefs.current[i] = el }}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          tabIndex={selected || (!hasAnswer && i === 0) ? 0 : -1}
                          disabled={submitting}
                          onClick={() => setAnswer(key)}
                          data-selected={selected}
                          className="choice"
                        >
                          <span className="choice-key" aria-hidden="true">{key}</span>
                          <span className="choice-text t-answer">{repairText(text)}</span>
                          <span className="choice-mark" aria-hidden="true">
                            <Check className="w-4 h-4" strokeWidth={2.4} />
                          </span>
                          {selected && <span className="sr-only">Selected</span>}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="quiz-answer" className="t-label text-fg-2 block mb-2">Your answer</label>
                    <input
                      id="quiz-answer"
                      ref={inputRef}
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type here…"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      disabled={submitting}
                      enterKeyHint={isLast ? 'done' : 'next'}
                      aria-describedby="quiz-answer-hint"
                      className="field px-4 py-3.5 t-answer !rounded-xl num max-w-xl"
                    />
                    <p id="quiz-answer-hint" className="t-caption text-fg-3 mt-2">
                      {current.difficulty === 'hard'
                        ? 'Hard tier: must match exactly, including spacing and capital letters.'
                        : current.difficulty === 'medium'
                          ? 'Medium tier: capital letters don’t matter; extra spaces are ignored.'
                          : 'Easy tier: capital letters don’t matter.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
          </AnimatePresence>

          {/* ── What happens next ─────────────────────────── */}
          <div className="quiz-controls">
            <p className={`t-caption num ${!hasAnswer && isLast ? 'text-warn' : 'text-fg-3'}`} aria-live="polite">
              {status}
            </p>
            <div className="flex items-center justify-between gap-3 mt-3">
              <button type="button" onClick={() => go(index - 1)} disabled={index === 0 || submitting} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <p className="hidden sm:flex items-center gap-1.5 t-caption text-fg-3" aria-hidden="true">
                {isMCQ ? <kbd className="key">A–{optionEntries[optionEntries.length - 1]?.[0] ?? 'D'}</kbd> : <kbd className="key">Type</kbd>}
                <span>then</span>
                <kbd className="key">Enter</kbd>
              </p>

              <button
                type="button"
                onClick={advance}
                disabled={submitting}
                aria-busy={submitting || undefined}
                className={hasAnswer || isLast ? 'btn-primary min-w-[8.5rem]' : 'btn-secondary min-w-[8.5rem]'}
              >
                {submitting && <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />}
                {primaryLabel}
                {!submitting && (isLast ? <Check className="w-4 h-4" /> : <ArrowRight className="arrow w-4 h-4" />)}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="mt-4 px-4 py-3 rounded-xl bg-err/10 border border-err/30 text-sm"
              >
                <p className="text-err font-medium">Your answers couldn’t be scored.</p>
                <p className="text-fg-2 mt-1">
                  {error}. Nothing was lost — check the server window is still open, then press <strong>Finish quiz</strong> again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
