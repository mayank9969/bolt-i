import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getWorld, setWorld, useWorldSlice } from './three/world'
import { fieldGuide } from '@/lib/fieldGuide'
import { hasExhibit } from '@/lib/exhibits'
import { categoryIcon, categoryLabel } from '@/lib/categories'
import { DIFFICULTY_ORDER, labelDifficulty } from '@/lib/format'
import { ArrowRight, Cross } from './ui/Icons'
import type { CategoryInfo } from '@/types/quiz'
import type { ReviewTopic } from '@/lib/review'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * FIELD GUIDE — the editorial panel an island opens.
 * Plain DOM, in Layout: works with the WebGL map, the static map, and the
 * keyboard index on Home. Content = API data (question counts per tier, real
 * review state) + the curated entry in src/lib/fieldGuide.ts when one exists.
 */
export default function FieldGuide() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryInfo[]>(getWorld().categories)
  const [review, setReview] = useState<Record<string, ReviewTopic>>(getWorld().review)
  // islands with an exhibit open the Exhibit instead
  useWorldSlice((s) => (s.selected && hasExhibit(s.selected) ? null : s.selected), setSelected)
  useWorldSlice((s) => s.categories, setCategories)
  useWorldSlice((s) => s.review, setReview)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<Element | null>(null)

  const close = () => {
    const id = getWorld().selected
    setWorld({ selected: null, hover: id })
  }

  useEffect(() => {
    if (!selected) {
      const el = returnTo.current as HTMLElement | null
      if (el && typeof el.focus === 'function') el.focus()
      return
    }
    returnTo.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const cat = useMemo(() => categories.find((c) => c.id === selected || c.id.replace(/^math$/, 'maths') === selected) ?? null, [categories, selected])
  const guide = selected ? fieldGuide(selected) : null
  const rv = selected ? review[selected] : undefined
  const Icon = selected ? categoryIcon(selected) : null
  const total = cat ? Object.values(cat.difficulties).reduce((a, b) => a + b, 0) : 0

  return (
    <AnimatePresence>
      {selected && (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label="Close field guide"
            className="fixed inset-0 z-[60] bg-canvas/40 backdrop-blur-[2px] cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fg-title"
            className="field-guide fixed z-[61] inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[min(32rem,92vw)] max-h-[78svh] md:max-h-none overflow-y-auto"
            initial={{ opacity: 0, y: 40, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="fg-inner">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full border border-line-strong bg-card flex items-center justify-center text-fg">{Icon && <Icon className="w-4 h-4" />}</span>
                  <span className="eyebrow">Field guide · island {String(Math.max(1, categories.findIndex((c) => c.id === selected) + 1)).padStart(2, '0')}</span>
                </div>
                <button ref={closeRef} type="button" onClick={close} className="w-10 h-10 -mr-2 -mt-2 rounded-full flex items-center justify-center text-fg-2 hover:text-fg hover:bg-hover focus-visible:shadow-focus" aria-label="Close">
                  <Cross className="w-4 h-4" />
                </button>
              </div>

              <h2 id="fg-title" className="t-title text-fg mt-6 text-balance">
                {categoryLabel(selected)}
              </h2>
              {guide ? (
                <p className="t-lead text-fg-2 mt-3 text-pretty">{guide.summary}</p>
              ) : (
                <p className="t-lead text-fg-2 mt-3 text-pretty">A region of the question bank. No editorial note has been written for it yet — the numbers below come straight from the bank.</p>
              )}

              {/* from the API: what is actually in the bank */}
              {cat && (
                <dl className="mt-6 grid grid-cols-3 gap-px bg-line-strong border border-line-strong rounded-2xl overflow-hidden">
                  {DIFFICULTY_ORDER.filter((d) => cat.difficulties[d] !== undefined).map((d) => (
                    <div key={d} className="bg-card p-3.5">
                      <dt className="t-label text-fg-3">{labelDifficulty(d)}</dt>
                      <dd className="num text-fg t-h3 mt-1">{cat.difficulties[d]}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {cat && <p className="t-caption text-fg-3 mt-2">{total} questions in this region.</p>}

              {/* real review state */}
              {rv && (
                <p className="mt-5 flex items-start gap-2.5 text-sm text-fg-2">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-warm shrink-0" aria-hidden="true" />
                  <span>
                    <span className="text-warm-text font-medium">Worth revisiting.</span> Your latest attempt here scored {rv.percentage}% with {rv.wrong} wrong.
                  </span>
                </p>
              )}

              {/* one verified turning point */}
              {guide && (
                <section className="mt-8 border-t border-line-strong pt-6" aria-label="A turning point in this field">
                  <span className="eyebrow">A turning point</span>
                  <h3 className="t-h3-lg text-fg mt-3">{guide.fact.title}</h3>
                  <p className="t-body text-fg-2 mt-3 text-pretty">{guide.fact.text}</p>
                  <p className="t-body text-fg mt-3 text-pretty">
                    <span className="font-medium">Why it matters.</span> {guide.fact.why}
                  </p>
                  <a href={guide.fact.source.url} target="_blank" rel="noopener noreferrer" className="link-rule text-sm mt-4 inline-flex items-center gap-1.5">
                    Source: {guide.fact.source.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </section>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  type="button"
                  className="btn-primary btn-lg group"
                  onClick={() => {
                    const id = selected
                    close()
                    navigate('/setup', { state: { category: id } })
                  }}
                >
                  Start a {categoryLabel(selected)} quiz
                  <ArrowRight className="arrow w-5 h-5" />
                </button>
                <button type="button" onClick={close} className="link-rule text-sm">
                  Back to the map
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
