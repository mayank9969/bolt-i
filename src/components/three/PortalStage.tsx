import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { getWorld, setWorld, subscribeWorld, threeDisabled } from './world'
import { fieldGuide } from '@/lib/fieldGuide'
import { exhibitFor, hasExhibit } from '@/lib/exhibits'
import { categoryLabel } from '@/lib/categories'
import { Cross } from '@/components/ui/Icons'
import type { CategoryInfo } from '@/types/quiz'

import PortalCanvas from './PortalCanvas'

/**
 * Full-screen subject portal. Island click opens this — not a zoom of the map.
 * Orbit 360°, zoom, reset, close. Auto-rotate pauses while the pointer is down.
 */
export default function PortalStage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryInfo[]>(getWorld().categories)
  const [note, setNote] = useState<{ title: string; text: string; source?: string } | null>(null)
  const [kind, setKind] = useState<'webgl' | 'static'>('webgl')
  const resetRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    const sync = () => {
      const s = getWorld()
      setSelected(s.selected)
      setCategories(s.categories)
    }
    sync()
    return subscribeWorld(sync)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => {
      let ok = false
      try {
        const c = document.createElement('canvas')
        ok = !!(c.getContext('webgl2') || c.getContext('webgl'))
      } catch {
        ok = false
      }
      setKind(!ok || mq.matches || threeDisabled() ? 'static' : 'webgl')
    }
    decide()
    mq.addEventListener?.('change', decide)
    return () => mq.removeEventListener?.('change', decide)
  }, [])

  useEffect(() => {
    if (!selected) {
      setNote(null)
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWorld({ selected: null, hover: selected, beat: 0 })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [selected])

  const cat = useMemo(
    () => categories.find((c) => c.id === selected || (selected === 'maths' && c.id === 'math')) ?? null,
    [categories, selected],
  )
  const total = cat ? Object.values(cat.difficulties).reduce((a, b) => a + b, 0) : 0
  const guide = selected ? fieldGuide(selected) : null
  const exhibit = selected ? exhibitFor(selected) : null

  if (!selected) return null

  const close = () => setWorld({ selected: null, hover: selected, beat: 0 })
  const startQuiz = () => {
    close()
    navigate('/setup', { state: { category: selected } })
  }

  const ui = (
    <div
      className="portal-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-title"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'var(--nx-3d-sky)' }}
    >
      <div className="portal-stage" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {kind === 'webgl' ? (
            <PortalCanvas
              id={selected}
              onNote={setNote}
              registerReset={(fn) => {
                resetRef.current = fn
              }}
            />
        ) : (
          <div className="portal-fallback" aria-hidden="true">
            <p className="t-meta">{categoryLabel(selected)}</p>
            <p className="text-fg-2 mt-2">{guide?.summary ?? `${total} questions in this subject.`}</p>
          </div>
        )}
      </div>

      <div className="portal-bar">
        <div className="min-w-0">
          <p className="eyebrow" id="portal-title">
            {hasExhibit(selected) ? 'Exhibit' : 'Subject'} · {categoryLabel(selected)}
          </p>
          <p className="t-meta text-fg mt-1">
            {exhibit?.title ?? guide?.fact.title ?? `${total} questions`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className="island-chip"
            onClick={(e) => {
              e.stopPropagation()
              resetRef.current?.()
            }}
          >
            Reset view
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={startQuiz}>
            Start a quiz
          </button>
          <button type="button" className="island-chip" onClick={close} aria-label="Close exhibit">
            <Cross className="w-3.5 h-3.5" />
            Close
          </button>
        </div>
      </div>

      {note && (
        <aside className="portal-note" aria-live="polite">
          <h3 className="t-meta text-fg">{note.title}</h3>
          <p className="text-fg-2 mt-2 text-pretty text-sm">{note.text}</p>
          {note.source && (
            <p className="t-meta mt-2">
              <a href={note.source} target="_blank" rel="noreferrer" className="text-accent">
                Source
              </a>
            </p>
          )}
          <button type="button" className="island-chip mt-3" onClick={() => setNote(null)}>
            Hide
          </button>
        </aside>
      )}
    </div>
  )
  return createPortal(ui, document.body)
}
