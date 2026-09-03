import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getCategories, startQuiz } from '@/api/quizApi'
import { useQuiz } from '@/context/QuizContext'
import type { CategoryInfo, DifficultyChoice } from '@/types/quiz'
import Reveal from '@/components/Reveal'
import SceneLayer from '@/components/SceneLayer'
import { ArrowRight, Check, Code, Layers, Minus, Plus, Sigma } from '@/components/ui/Icons'
import { DIFFICULTY_ORDER, labelCategory, labelDifficulty } from '@/lib/format'

const DIFFICULTY_META: Record<DifficultyChoice, { blurb: string; marks: string; tone: string }> = {
  easy: { blurb: 'Warm up. Fundamentals only.', marks: '2 marks', tone: 'success' },
  medium: { blurb: 'Solid understanding required.', marks: '4 marks', tone: 'warning' },
  hard: { blurb: 'For when you want to be tested.', marks: '6 marks', tone: 'danger' },
  mixed: { blurb: 'A blend from every tier.', marks: 'Varies', tone: 'accent' },
}

const PRESETS = [5, 10, 15, 20]
const MAX_COUNT = 50

export default function Setup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { beginSession } = useQuiz()

  const [catalog, setCatalog] = useState<CategoryInfo[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [category, setCategory] = useState<string>((location.state as { category?: string } | null)?.category ?? 'all')
  const [difficulty, setDifficulty] = useState<DifficultyChoice>('easy')
  const [count, setCount] = useState(10)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    getCategories()
      .then((res) => setCatalog(res.categories))
      .catch((e: Error) => setLoadError(e.message))
  }, [])

  // Only the difficulties that actually exist in the bank.
  const difficulties = useMemo<DifficultyChoice[]>(() => {
    if (!catalog) return []
    const present = new Set<string>()
    catalog.forEach((c) => Object.keys(c.difficulties).forEach((d) => present.add(d)))
    const ordered = DIFFICULTY_ORDER.filter((d) => present.has(d))
    return ordered.length > 1 ? [...ordered, 'mixed'] : ordered
  }, [catalog])

  useEffect(() => {
    if (difficulties.length && !difficulties.includes(difficulty)) setDifficulty(difficulties[0])
  }, [difficulties, difficulty])

  // How many questions the current selection can actually provide.
  const available = useMemo(() => {
    if (!catalog) return 0
    const cats = category === 'all' ? catalog : catalog.filter((c) => c.id === category)
    return cats.reduce((sum, c) => {
      if (difficulty === 'mixed') return sum + Object.values(c.difficulties).reduce((a, b) => a + b, 0)
      return sum + (c.difficulties[difficulty] ?? 0)
    }, 0)
  }, [catalog, category, difficulty])

  const maxCount = Math.max(1, Math.min(available || MAX_COUNT, MAX_COUNT))

  useEffect(() => {
    if (count > maxCount) setCount(maxCount)
  }, [maxCount, count])

  const handleStart = async () => {
    setError('')
    if (!catalog) return
    setStarting(true)
    try {
      const config = { category, difficulty, questionCount: count }
      const session = await startQuiz(config)
      beginSession(config, session)
      navigate('/quiz')
    } catch (e) {
      setError((e as Error).message)
      setStarting(false)
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <SceneLayer variant="ambient" opacity={0.35} />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-975/40 via-ink-975/70 to-ink-975 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <Reveal>
          <div className="text-center mb-10 md:mb-12">
            <span className="eyebrow">Configure</span>
            <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mt-3">Set up your quiz</h1>
            <p className="text-ink-300 mt-3 text-pretty">Choose what you want to be tested on. You can change this any time.</p>
          </div>
        </Reveal>

        {loadError ? (
          <Reveal>
            <div className="surface-strong rounded-3xl p-10 text-center">
              <p className="text-danger-300 font-medium">{loadError}</p>
              <p className="text-ink-400 text-sm mt-2">Make sure the NEXUSQuiz server is running, then reload.</p>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.1}>
            <div className="surface-strong rounded-3xl md:rounded-4xl p-5 sm:p-8 md:p-10 space-y-9">
              {/* Category */}
              <Section title="Category" hint={catalog ? undefined : 'Loading…'}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {catalog ? (
                    <>
                      <ChoiceCard
                        selected={category === 'all'}
                        onClick={() => setCategory('all')}
                        icon={<Layers className="w-5 h-5" />}
                        title="All"
                        sub={`${catalog.reduce((s, c) => s + Object.values(c.difficulties).reduce((a, b) => a + b, 0), 0)} questions`}
                      />
                      {catalog.map((c) => (
                        <ChoiceCard
                          key={c.id}
                          selected={category === c.id}
                          onClick={() => setCategory(c.id)}
                          icon={c.id === 'python' ? <Code className="w-5 h-5" /> : <Sigma className="w-5 h-5" />}
                          title={labelCategory(c.id)}
                          sub={`${Object.values(c.difficulties).reduce((a, b) => a + b, 0)} questions`}
                        />
                      ))}
                    </>
                  ) : (
                    [0, 1, 2].map((i) => <Skeleton key={i} />)
                  )}
                </div>
              </Section>

              {/* Difficulty */}
              <Section title="Difficulty">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {(difficulties.length ? difficulties : (['easy', 'medium', 'hard', 'mixed'] as DifficultyChoice[])).map((d) => {
                    const meta = DIFFICULTY_META[d]
                    const selected = difficulty === d
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!catalog}
                        data-selected={selected}
                        onClick={() => setDifficulty(d)}
                        className="choice p-4 sm:p-5"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`w-2 h-2 rounded-full ${toneDot[meta.tone]} ${selected ? 'shadow-[0_0_10px_currentColor]' : 'opacity-60'}`} />
                          <span className="text-[11px] font-mono text-ink-500">{meta.marks}</span>
                        </div>
                        <p className={`font-display text-lg mt-3 ${selected ? 'text-ink-50' : 'text-ink-100'}`}>{labelDifficulty(d)}</p>
                        <p className="text-xs text-ink-400 mt-1 leading-snug">{meta.blurb}</p>
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* Count */}
              <Section
                title="Number of questions"
                hint={catalog ? `${available} available` : undefined}
              >
                <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-stretch">
                  <div className="surface rounded-2xl p-2 flex items-center gap-2">
                    <Stepper onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} label="Fewer">
                      <Minus className="w-5 h-5" />
                    </Stepper>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label="Number of questions"
                        value={count}
                        min={1}
                        max={maxCount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (Number.isNaN(v)) return setCount(1)
                          setCount(Math.max(1, Math.min(v, maxCount)))
                        }}
                        className="w-full bg-transparent text-center font-display text-3xl text-ink-50 outline-none num"
                      />
                      <p className="text-[11px] text-ink-500 -mt-0.5">of {maxCount} max</p>
                    </div>
                    <Stepper onClick={() => setCount((c) => Math.min(maxCount, c + 1))} disabled={count >= maxCount} label="More">
                      <Plus className="w-5 h-5" />
                    </Stepper>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 w-full">
                      {PRESETS.map((n) => {
                        const disabled = n > maxCount
                        return (
                          <button
                            key={n}
                            type="button"
                            disabled={disabled}
                            data-selected={count === n}
                            onClick={() => setCount(n)}
                            className="choice !rounded-xl px-3 py-2.5 text-center text-sm font-medium text-ink-200 num disabled:opacity-30"
                          >
                            {n}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {/* range slider */}
                <input
                  type="range"
                  min={1}
                  max={maxCount}
                  value={count}
                  aria-label="Number of questions slider"
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="nx-range mt-4"
                  style={{ ['--p' as string]: `${((count - 1) / Math.max(maxCount - 1, 1)) * 100}%` }}
                />
              </Section>

              {/* Summary + CTA */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-ink-300">
                  <span className="text-ink-500">You'll get</span>
                  <span className="chip chip-accent num">{count} questions</span>
                  <span className="chip">{labelCategory(category)}</span>
                  <span className={`chip chip-${DIFFICULTY_META[difficulty].tone}`}>{labelDifficulty(difficulty)}</span>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-4 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/25 text-danger-300 text-sm">{error}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!catalog || starting || available === 0}
                  className="btn-primary btn-lg w-full group"
                >
                  {starting ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-ink-975/30 border-t-ink-975 animate-spin" />
                      Preparing your quiz
                    </>
                  ) : (
                    <>
                      Start Quiz
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </Reveal>
        )}
      </div>

      <style>{`
        .nx-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px;
          background: linear-gradient(90deg, #2cc4f5 var(--p), rgba(28,37,64,0.9) var(--p)); outline: none; }
        .nx-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
          background: #eafcff; border: 3px solid #2cc4f5; box-shadow: 0 0 0 4px rgba(44,196,245,0.15), 0 4px 12px rgba(0,0,0,0.4); cursor: pointer; transition: transform .2s; }
        .nx-range::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .nx-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #eafcff; border: 3px solid #2cc4f5; cursor: pointer; }
      `}</style>
    </div>
  )
}

const toneDot: Record<string, string> = {
  success: 'bg-success-400 text-success-400',
  warning: 'bg-warning-400 text-warning-400',
  danger: 'bg-danger-400 text-danger-400',
  accent: 'bg-accent-300 text-accent-300',
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="font-sans text-sm font-medium text-ink-200 tracking-wide">{title}</h2>
        {hint && <span className="text-xs text-ink-500 num">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  sub,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  sub: string
}) {
  return (
    <button type="button" data-selected={selected} onClick={onClick} className="choice p-4 sm:p-5 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'bg-accent-400 text-ink-975' : 'bg-ink-900/80 border border-ink-700/60 text-accent-300'
        }`}
      >
        {icon}
      </div>
      <div className="sm:mt-4 flex-1 min-w-0">
        <p className={`font-display text-lg leading-tight ${selected ? 'text-ink-50' : 'text-ink-100'}`}>{title}</p>
        <p className="text-xs text-ink-400 mt-0.5 num">{sub}</p>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="sm:absolute sm:top-4 sm:right-4 w-5 h-5 rounded-full bg-accent-400 text-ink-975 flex items-center justify-center shrink-0"
          >
            <Check className="w-3 h-3" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

function Stepper({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-12 h-12 rounded-xl bg-ink-900/80 border border-ink-700/60 text-ink-100 flex items-center justify-center hover:border-accent-400/40 hover:text-accent-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function Skeleton() {
  return <div className="h-[104px] rounded-2xl bg-ink-900/60 border border-ink-800/60 animate-pulse" />
}
