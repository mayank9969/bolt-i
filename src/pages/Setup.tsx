import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getCategories, startQuiz } from '@/api/quizApi'
import { useQuiz } from '@/context/QuizContext'
import type { CategoryInfo, DifficultyChoice } from '@/types/quiz'
import Reveal from '@/components/Reveal'
import { pulseNetwork, useNetwork } from '@/components/three/store'
import { ArrowRight, Check, Code, Cross, Minus, Plus, Sigma } from '@/components/ui/Icons'
import Tier from '@/components/ui/Tier'
import { DIFFICULTY_ORDER, difficultyLevel, labelCategory, labelDifficulty } from '@/lib/format'

const DIFFICULTY_META: Record<DifficultyChoice, { blurb: string; marks: string }> = {
  easy: { blurb: 'Fundamentals only.', marks: '2 marks' },
  medium: { blurb: 'Solid understanding.', marks: '4 marks' },
  hard: { blurb: 'Exact answers.', marks: '6 marks' },
  mixed: { blurb: 'A blend of every tier.', marks: 'Varies' },
}

const PRESETS = [5, 10, 15, 20]
const MAX_COUNT = 50
const ease = [0.22, 1, 0.36, 1] as const

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

  // SETUP — responsive: the chosen region comes forward, the tier sets density, the size sets activation.
  const clusterIndex = useMemo(() => {
    if (category === 'all') return 2
    const idx = (catalog ?? []).findIndex((c) => c.id === category)
    return idx >= 0 ? Math.min(idx, 1) : 2
  }, [category, catalog])
  useNetwork(
    {
      mode: 'responsive',
      camera: 'side',
      focusCluster: clusterIndex,
      density: difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : difficulty === 'hard' ? 1 : 0.8,
      activation: 0.1 + (count / MAX_COUNT) * 0.6,
      clusterLabels: [labelCategory(catalog?.[0]?.id ?? 'maths'), labelCategory(catalog?.[1]?.id ?? 'python'), 'Mixed'],
    },
    [clusterIndex, difficulty, count, catalog],
  )
  // a selection sends a signal through the chosen region
  useEffect(() => {
    if (catalog) pulseNetwork(1)
  }, [category, difficulty, catalog])

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

  const totalOf = (c: CategoryInfo) => Object.values(c.difficulties).reduce((a, b) => a + b, 0)

  return (
    <div className="relative flex-1">
      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16 grid lg:grid-cols-12 gap-10">
        {/* left: the form, as three numbered movements */}
        <div className="lg:col-span-7 xl:col-span-6 max-w-2xl">
          <Reveal>
            <span className="opener">Choose your path</span>
            <h1 className="font-display t-title text-fg mt-5 text-balance">
              Which part of the network <span className="t-italic">do you want to light?</span>
            </h1>
          </Reveal>

          {loadError ? (
            <Reveal>
              <div className="surface-strong rounded-2xl p-8 mt-10 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center bg-err/10 text-err">
                  <Cross className="w-5 h-5" />
                </div>
                <p className="text-fg font-medium">{loadError}</p>
                <p className="text-fg-2 text-sm mt-2">Make sure the NEXUSQuiz server is running, then reload.</p>
              </div>
            </Reveal>
          ) : (
            <div className="mt-12 space-y-14">
              {/* 01 Region */}
              <Movement index="01" title="Region" hint={catalog ? `${catalog.length + 1} available` : 'Loading…'}>
                <div role="radiogroup" aria-label="Region" className="border-t border-line-strong">
                  {catalog ? (
                    <>
                      {catalog.map((c) => (
                        <RegionRow
                          key={c.id}
                          selected={category === c.id}
                          onSelect={() => setCategory(c.id)}
                          icon={c.id === 'python' ? <Code className="w-4 h-4" /> : <Sigma className="w-4 h-4" />}
                          title={labelCategory(c.id)}
                          meta={`${totalOf(c)} questions`}
                          detail={Object.entries(c.difficulties)
                            .sort(([a], [b]) => DIFFICULTY_ORDER.indexOf(a as never) - DIFFICULTY_ORDER.indexOf(b as never))
                            .map(([d, n]) => `${n} ${d}`)
                            .join(' · ')}
                        />
                      ))}
                      <RegionRow
                        selected={category === 'all'}
                        onSelect={() => setCategory('all')}
                        icon={<span className="w-2 h-2 rounded-full bg-current" />}
                        title="Mixed"
                        meta={`${catalog.reduce((s, c) => s + totalOf(c), 0)} questions`}
                        detail="Every region, bridges included"
                      />
                    </>
                  ) : (
                    [0, 1, 2].map((i) => <div key={i} className="h-[76px] border-b border-line skeleton" />)
                  )}
                </div>
              </Movement>

              {/* 02 Tier */}
              <Movement index="02" title="Tier">
                <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line-strong border border-line-strong rounded-2xl overflow-hidden">
                  {(difficulties.length ? difficulties : (['easy', 'medium', 'hard', 'mixed'] as DifficultyChoice[])).map((d) => {
                    const meta = DIFFICULTY_META[d]
                    const selected = difficulty === d
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!catalog}
                        onClick={() => setDifficulty(d)}
                        className={`relative text-left p-4 sm:p-5 transition-colors duration-base focus-visible:z-10 ${selected ? 'bg-cta text-cta-text' : 'bg-canvas hover:bg-hover text-fg'}`}
                      >
                        <span className={`tier ${selected ? '' : 'text-fg-2'}`} data-level={difficultyLevel(d)} aria-hidden="true" style={selected ? { color: 'var(--nx-accent-on-ink)' } : undefined}>
                          <i /><i /><i />
                        </span>
                        <p className="font-display text-2xl mt-4">{labelDifficulty(d)}</p>
                        <p className={`text-xs mt-1 ${selected ? 'opacity-70' : 'text-fg-2'}`}>{meta.blurb}</p>
                        <p className={`font-mono text-[10px] tracking-[0.18em] uppercase mt-4 ${selected ? 'opacity-80' : 'text-fg-3'}`}>{meta.marks}</p>
                        {selected && <span className="sr-only">(selected)</span>}
                      </button>
                    )
                  })}
                </div>
              </Movement>

              {/* 03 Size */}
              <Movement index="03" title="Size" hint={catalog ? `${available} available` : undefined}>
                <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-center">
                  <div className="flex items-center gap-3">
                    <Stepper onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} label="Fewer">
                      <Minus className="w-4 h-4" />
                    </Stepper>
                    <div className="relative w-[7.5rem] text-center">
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
                        className="w-full bg-transparent text-center font-display text-6xl leading-none text-fg outline-none num focus-visible:text-accent transition-colors"
                      />
                      <p className="figcap mt-1">of {maxCount}</p>
                    </div>
                    <Stepper onClick={() => setCount((c) => Math.min(maxCount, c + 1))} disabled={count >= maxCount} label="More">
                      <Plus className="w-4 h-4" />
                    </Stepper>
                  </div>
                  <div>
                    <input
                      type="range"
                      min={1}
                      max={maxCount}
                      value={count}
                      aria-label="Number of questions slider"
                      onChange={(e) => setCount(parseInt(e.target.value, 10))}
                      className="nx-range"
                      style={{ ['--p' as string]: `${((count - 1) / Math.max(maxCount - 1, 1)) * 100}%` }}
                    />
                    <div className="mt-4 flex items-center gap-2">
                      {PRESETS.map((n) => {
                        const disabled = n > maxCount
                        const on = count === n
                        return (
                          <button
                            key={n}
                            type="button"
                            disabled={disabled}
                            aria-pressed={on}
                            onClick={() => setCount(n)}
                            className={`h-9 min-w-[2.75rem] px-3 rounded-full border text-sm num transition-colors duration-fast ${
                              on ? 'bg-cta text-cta-text border-cta' : 'border-line-strong text-fg-2 hover:text-fg hover:border-fg-3'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {n}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Movement>

              {/* ticket + go */}
              <Reveal>
                <div className="border-t border-line-strong pt-8">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 font-display text-2xl text-fg">
                    <span className="text-fg-2 text-lg font-sans">You’ll get</span>
                    <span className="num">{count}</span>
                    <span className="text-fg-2">×</span>
                    <span>{labelCategory(category)}</span>
                    <span className="text-fg-2">·</span>
                    <Tier difficulty={difficulty} className="translate-y-[-3px]" />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div role="alert" className="mt-4 px-4 py-3 rounded-xl bg-err/10 border border-err/30 text-err text-sm">{error}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="button" onClick={handleStart} disabled={!catalog || starting || available === 0} className="btn-primary btn-lg mt-6 w-full sm:w-auto sm:min-w-[16rem]">
                    {starting ? (
                      <>
                        <span className="w-5 h-5 rounded-full border-2 border-cta-text/30 border-t-cta-text animate-spin" />
                        Preparing your quiz
                      </>
                    ) : (
                      <>
                        Begin
                        <ArrowRight className="arrow w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </Reveal>
            </div>
          )}
        </div>

        {/* right: the network lives here; only a caption in the DOM */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 items-end justify-end pb-4 pointer-events-none">
          <motion.p key={category + difficulty} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="figcap text-right">
            Fig. 02 — {labelCategory(category)} region · {labelDifficulty(difficulty)} density
          </motion.p>
        </div>
      </div>
    </div>
  )
}

function Movement({ index, title, hint, children }: { index: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-sans text-sm font-medium text-fg tracking-wide flex items-center gap-3">
            <span className="index">{index}</span>
            {title}
          </h2>
          {hint && <span className="text-xs text-fg-3 num">{hint}</span>}
        </div>
        {children}
      </section>
    </Reveal>
  )
}

function RegionRow({ selected, onSelect, icon, title, meta, detail }: { selected: boolean; onSelect: () => void; icon: React.ReactNode; title: string; meta: string; detail: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group w-full text-left grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-4 border-b border-line -mx-3 px-3 rounded-lg transition-colors duration-fast hover:bg-hover ${selected ? 'text-fg' : 'text-fg-2'}`}
    >
      <span className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors duration-base ${selected ? 'bg-accent border-accent text-fg-inverse' : 'border-line-strong text-fg group-hover:border-fg-3'}`}>
        {selected ? <Check className="w-4 h-4" /> : icon}
      </span>
      <span className="min-w-0">
        <span className={`font-display text-3xl leading-none block ${selected ? 'text-fg' : 'text-fg group-hover:text-fg'}`}>{title}</span>
        <span className="block text-xs mt-1.5 text-fg-2">{detail}</span>
      </span>
      <span className="text-right">
        <span className="block text-sm num text-fg-2">{meta}</span>
        <span className={`block font-mono text-[10px] tracking-[0.18em] uppercase mt-1 ${selected ? 'text-accent' : 'text-transparent group-hover:text-fg-3'}`}>{selected ? 'Selected' : 'Select'}</span>
      </span>
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
      className="w-11 h-11 rounded-full border border-line-strong text-fg flex items-center justify-center hover:border-fg-3 hover:bg-hover transition-colors disabled:text-disabled-text disabled:border-line disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}
