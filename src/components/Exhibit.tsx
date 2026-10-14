import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getWorld, setWorld, useWorldSlice } from './three/world'
import { exhibitFor, type Exhibit as ExhibitData } from '@/lib/exhibits'
import { categoryIcon, categoryLabel } from '@/lib/categories'
import { ArrowRight, Cross } from './ui/Icons'
import type { CategoryInfo } from '@/types/quiz'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * EXHIBIT — the readable half of a miniature museum.
 * Opens when `world.selected` is a category with an entry in src/lib/exhibits.ts.
 * The 3D diorama (if WebGL is on) plays behind; this card carries the whole
 * story on its own — three beats, why it matters, sources, the quiz action —
 * so nothing depends on 3D or on game controls. ← → / 1 2 3 step the beats;
 * Esc goes back to the islands.
 */
export default function Exhibit() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [beat, setBeat] = useState<0 | 1 | 2>(0)
  const [categories, setCategories] = useState<CategoryInfo[]>(getWorld().categories)
  const [staticMode, setStaticMode] = useState(false)
  useWorldSlice((s) => s.selected, setSelected)
  useWorldSlice((s) => s.beat, setBeat)
  useWorldSlice((s) => s.categories, setCategories)
  const data = useMemo(() => exhibitFor(selected), [selected])
  const open = !!data
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<Element | null>(null)

  // the static plate is shown whenever the live diorama is not (no WebGL / reduced motion / 3D off)
  useEffect(() => {
    const el = document.querySelector('.archipelago-stage')
    setStaticMode(!el || el.getAttribute('data-kind') !== 'webgl')
  }, [open])

  const close = () => {
    const id = getWorld().selected
    setWorld({ selected: null, hover: id, beat: 0 })
  }
  const go = (b: number) => setWorld({ beat: Math.max(0, Math.min(2, b)) as 0 | 1 | 2 })

  useEffect(() => {
    if (!open) {
      const el = returnTo.current as HTMLElement | null
      if (el && typeof el.focus === 'function') el.focus()
      return
    }
    returnTo.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(getWorld().beat + 1)
      else if (e.key === 'ArrowLeft') go(getWorld().beat - 1)
      else if (e.key === '1' || e.key === '2' || e.key === '3') go(Number(e.key) - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cat = data ? categories.find((c) => c.id === data.id) ?? null : null
  const total = cat ? Object.values(cat.difficulties).reduce((a, b) => a + b, 0) : 0
  const Icon = data ? categoryIcon(data.id) : null
  const current = data?.beats[beat]

  return (
    <AnimatePresence>
      {data && current && (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label="Back to the islands"
            className="fixed inset-0 z-[60] cursor-default exhibit-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />
          <motion.section
            key="exhibit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ex-title"
            className="exhibit fixed z-[61] inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[min(34rem,94vw)] max-h-[78svh] md:max-h-none flex flex-col"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="ex-head">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-full border border-line-strong bg-elevated flex items-center justify-center text-fg shrink-0">{Icon && <Icon className="w-4 h-4" />}</span>
                <span className="eyebrow truncate">Exhibit · {categoryLabel(data.id)}</span>
              </div>
              <button ref={closeRef} type="button" onClick={close} className="w-10 h-10 rounded-full flex items-center justify-center text-fg-2 hover:text-fg hover:bg-hover focus-visible:shadow-focus shrink-0" aria-label="Back to the islands">
                <Cross className="w-4 h-4" />
              </button>
            </div>
            <div className="ex-inner">
              <h2 id="ex-title" className="t-title text-fg text-balance">
                {data.title}
              </h2>
              <p className="text-fg-2 mt-2 text-pretty">{data.subtitle}</p>

              {/* static plate: the diorama drawn flat when the live one is not available */}
              {staticMode && (
                <div className="mt-6 rounded-2xl border border-line bg-surface overflow-hidden" aria-hidden="true">
                  <Plate kind={data.diorama} beat={beat} />
                </div>
              )}

              {/* three beats */}
              <div className="mt-7" role="group" aria-label="Story beats">
                <ol className="grid grid-cols-3 gap-1.5">
                  {data.beats.map((b, i) => (
                    <li key={b.key}>
                      <button
                        type="button"
                        className="beat-tab"
                        aria-current={i === beat ? 'step' : undefined}
                        onClick={() => go(i)}
                      >
                        <span className="t-label">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-sm font-medium">{b.label}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.article
                    key={current.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, ease }}
                    className="mt-5"
                    aria-live="polite"
                  >
                    <span className="index">{current.when}</span>
                    <h3 className="t-h3-lg text-fg mt-2 text-balance">{current.title}</h3>
                    <p className="t-body text-fg-2 mt-3 text-pretty">{current.text}</p>
                  </motion.article>
                </AnimatePresence>
                <div className="mt-4 flex items-center justify-between">
                  <button type="button" className="link-rule text-sm disabled:opacity-40" onClick={() => go(beat - 1)} disabled={beat === 0}>
                    ← Previous
                  </button>
                  <button type="button" className="link-rule text-sm disabled:opacity-40" onClick={() => go(beat + 1)} disabled={beat === 2}>
                    Next →
                  </button>
                </div>
              </div>

              {/* why it matters */}
              <section className="mt-8 border-t border-line-strong pt-6" aria-label="Why it matters">
                <span className="eyebrow">Why it matters</span>
                <p className="t-body text-fg mt-3 text-pretty">{data.why}</p>
              </section>

              {/* sources */}
              <section className="mt-7" aria-label="Sources">
                <span className="eyebrow">Sources</span>
                <ul className="mt-3 space-y-2">
                  {data.sources.map((src) => (
                    <li key={src.url}>
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="link-rule text-sm inline-flex items-start gap-1.5">
                        <span>{src.label}</span>
                        <span aria-hidden="true" className="shrink-0">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              {/* what the bank actually holds here */}
              {cat && (
                <p className="t-caption text-fg-3 mt-7">
                  {total} {categoryLabel(data.id)} questions in the bank
                  {Object.keys(cat.difficulties).length ? ` · ${Object.entries(cat.difficulties).map(([d, n]) => `${n} ${d}`).join(', ')}` : ''}.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 pb-2">
                <button
                  type="button"
                  className="btn-primary btn-lg group"
                  onClick={() => {
                    const id = data.id
                    close()
                    navigate('/setup', { state: { category: id } })
                  }}
                >
                  Start the {categoryLabel(data.id)} quiz
                  <ArrowRight className="arrow w-5 h-5" />
                </button>
                <button type="button" onClick={close} className="link-rule text-sm">
                  Back to the islands
                </button>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}

/* ── static plates: the same three beats as flat, printable figures ───── */
function Plate({ kind, beat }: { kind: ExhibitData['diorama']; beat: 0 | 1 | 2 }) {
  const ink = 'var(--nx-text)'
  const teal = 'var(--nx-accent)'
  const warm = 'var(--nx-warm)'
  const land = 'var(--nx-3d-land-1)'
  return (
    <svg viewBox="0 0 320 150" className="w-full h-auto block" role="img">
      <rect x="40" y="118" width="240" height="6" rx="3" fill={land} />
      {kind === 'zero' && beat === 0 && (
        <g>
          <rect x="70" y="106" width="180" height="10" rx="2" fill={ink} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="86" y={96 - i * 9} width="36" height="7" rx="3.5" fill={land} stroke={ink} strokeWidth="1" />
          ))}
          {[0, 1].map((i) => (
            <rect key={i} x="198" y={96 - i * 9} width="36" height="7" rx="3.5" fill={land} stroke={ink} strokeWidth="1" />
          ))}
          <ellipse cx="160" cy="100" rx="12" ry="4" fill="none" stroke={warm} strokeWidth="2" />
        </g>
      )}
      {kind === 'zero' && beat === 1 && (
        <g>
          <circle cx="160" cy="78" r="26" fill="none" stroke={teal} strokeWidth="9" />
          <rect x="96" y="92" width="22" height="5" fill={ink} />
          <rect x="104.5" y="83.5" width="5" height="22" fill={ink} />
          <rect x="202" y="92" width="22" height="5" fill={ink} />
        </g>
      )}
      {kind === 'zero' && beat === 2 && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={104 + i * 34} y={112 - 14 - i * 22} width="16" height={14 + i * 22} fill={i === 3 ? teal : ink} />
              <circle cx={112 + i * 34} cy="118" r="4" fill="none" stroke={teal} strokeWidth="2" />
            </g>
          ))}
        </g>
      )}
      {kind === 'python' && beat === 0 && (
        <g>
          <rect x="84" y="36" width="152" height="60" fill={land} stroke={ink} strokeWidth="1" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x="96" y={44 + i * 7} width="128" height="2.5" fill={ink} />
          ))}
        </g>
      )}
      {kind === 'python' && beat === 1 && (
        <g>
          {[0, 1, 2, 1, 0].map((ind, i) => (
            <rect key={i} x={96 + ind * 22} y={58 + i * 11} width={128 - ind * 30} height="5" rx="2" fill={i === 2 ? teal : ink} />
          ))}
        </g>
      )}
      {kind === 'python' && beat === 2 && (
        <g>
          <rect x="150" y="70" width="20" height="20" fill={teal} />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            const d = 46 + ((i * 37) % 23)
            return <rect key={i} x={160 + Math.cos(a) * d - 4} y={80 + Math.sin(a) * d * 0.55 - 4} width="8" height="8" fill={ink} />
          })}
        </g>
      )}
    </svg>
  )
}
