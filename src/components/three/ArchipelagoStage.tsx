import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { getCategories, getHistory } from '@/api/quizApi'
import { reviewTopics, type ReviewTopic } from '@/lib/review'
import { buildIslands, type Island } from './islands'
import { getWorld, setWorld, subscribeWorld, threeDisabled, useWorldSlice, type WorldMode } from './world'
import { hasExhibit } from '@/lib/exhibits'
import type { CategoryInfo } from '@/types/quiz'

const ArchipelagoScene = lazy(() => import('./ArchipelagoScene'))

/**
 * The one persistent stage (lives in Layout, fixed behind the UI).
 * - loads the real catalogue + history once and publishes them to the world store
 * - lazy-loads three.js only when it will render
 * - static SVG archipelago when WebGL is missing, reduced motion is on, or 3D is opted out —
 *   still hoverable / clickable / keyboard-reachable, so the field guide works everywhere
 * - feeds scroll + pointer into the store (no React re-renders per frame)
 */
export default function ArchipelagoStage() {
  const [kind, setKind] = useState<'webgl' | 'static' | 'pending'>('pending')
  const [mode, setMode] = useState<WorldMode>(getWorld().mode)
  useWorldSlice((s) => s.mode, setMode)
  // lets CSS open a pointer path through <main> to the map on the home hero
  useEffect(() => {
    document.documentElement.dataset.world = mode
    return () => {
      delete document.documentElement.dataset.world
    }
  }, [mode])

  // real data → store (one fetch each; pages fetch their own copies as before)
  useEffect(() => {
    let alive = true
    getCategories()
      .then((res) => alive && setWorld({ categories: res.categories }))
      .catch(() => undefined)
    getHistory()
      .then((h) => {
        if (!alive) return
        const review: Record<string, ReviewTopic> = {}
        reviewTopics(h).forEach((r) => (review[r.id] = r))
        setWorld({ review })
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
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
    if (kind !== 'webgl') return
    const fine = window.matchMedia('(pointer: fine)').matches
    const onScroll = () => {
      const vh = window.innerHeight || 1
      setWorld({ scroll: Math.min(1, window.scrollY / (vh * 1.2)) })
    }
    const onMove = (e: MouseEvent) => setWorld({ px: (e.clientX / window.innerWidth) * 2 - 1, py: -((e.clientY / window.innerHeight) * 2 - 1), pointerIn: true })
    const onLeave = () => setWorld({ pointerIn: false })
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    if (fine) {
      window.addEventListener('mousemove', onMove, { passive: true })
      document.documentElement.addEventListener('mouseleave', onLeave)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [kind])

  if (kind === 'pending') return null
  const presence = mode === 'hero' ? 1 : mode === 'focus' ? 0.9 : mode === 'quiet' ? 0.34 : 0
  return (
    <div
      className="archipelago-stage fixed inset-0 z-0 transition-opacity duration-700 ease-out"
      data-kind={kind}
      style={{ opacity: presence, pointerEvents: 'none' }}
      aria-hidden={mode === 'hero' || mode === 'focus' ? undefined : true}
    >
      {kind === 'webgl' ? (
        <Suspense fallback={null}>
          <ArchipelagoScene />
        </Suspense>
      ) : (
        <StaticArchipelago interactive={mode === 'hero' || mode === 'focus'} />
      )}
    </div>
  )
}

/**
 * Static fallback: the same islands (same layout function) drawn once as SVG.
 * Islands are real buttons, so hover, tap and keyboard all open the field guide.
 */
function StaticArchipelago({ interactive }: { interactive: boolean }) {
  const [categories, setCategories] = useState<CategoryInfo[]>(getWorld().categories)
  const [hover, setHover] = useState<string | null>(null)
  const [review, setReview] = useState<string>('')
  const [narrow, setNarrow] = useState(() => window.innerWidth < 768)
  useWorldSlice((s) => s.categories, setCategories)
  useWorldSlice((s) => s.hover, setHover)
  useEffect(() => subscribeWorld((s) => setReview(Object.keys(s.review).sort().join('|'))), [])
  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < 768)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])
  const { islands, bridges } = useMemo(() => buildIslands(categories), [categories])
  const reviewSet = useMemo(() => new Set(review.split('|').filter(Boolean)), [review])
  // simple oblique projection: x → right, z → down (foreshortened), y → up
  const P = (i: Island, dy = 0) => ({ x: 360 + i.x * 46 + (narrow ? 0 : 120), y: 260 + i.z * 30 - (i.y + dy) * 40 + (narrow ? 90 : 0) })
  const sorted = [...islands].map((isl, idx) => ({ isl, idx })).sort((a, b) => a.isl.z - b.isl.z)
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 720 520" preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }}>
      <g fill="none" stroke="var(--nx-3d-bridge)" strokeWidth={2} strokeLinecap="round">
        {bridges.map((b, i) => {
          const a = P(islands[b.a], islands[b.a].layers.length * 0.12)
          const c = P(islands[b.b], islands[b.b].layers.length * 0.12)
          const mx = (a.x + c.x) / 2
          const my = Math.min(a.y, c.y) - 22
          return <path key={i} d={`M${a.x} ${a.y} Q${mx} ${my} ${c.x} ${c.y}`} />
        })}
      </g>
      {sorted.map(({ isl }) => {
        const p = P(isl)
        const r = isl.r * 46
        const hot = hover === isl.id
        return (
          <g
            key={isl.id}
            transform={`translate(${p.x} ${p.y - (hot ? 6 : 0)})`}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : -1}
            aria-label={`${isl.label} — open field guide`}
            style={{ pointerEvents: interactive ? 'auto' : 'none', cursor: 'pointer', transition: 'transform .3s' }}
            onMouseEnter={() => setWorld({ hover: isl.id })}
            onMouseLeave={() => setWorld({ hover: null })}
            onFocus={() => setWorld({ hover: isl.id })}
            onBlur={() => setWorld({ hover: null })}
            onClick={() => setWorld({ selected: isl.id, hover: isl.id, beat: 0 })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setWorld({ selected: isl.id, hover: isl.id })
              }
            }}
          >
            {/* rock */}
            <path d={`M${-r} 0 L${-r * 0.2} ${r * 1.2} L${r * 0.1} ${r * 1.25} L${r} 0 Z`} fill="var(--nx-3d-rock)" />
            {/* plateaus */}
            {isl.layers.map(([k, h], i) => (
              <ellipse key={i} cx={(isl.seed - 0.5) * r * 0.2 * i} cy={-i * h * 40} rx={r * k} ry={r * k * 0.46} fill={`var(--nx-3d-land-${Math.min(3, i + 1)})`} stroke={hot ? 'var(--nx-accent)' : 'none'} strokeWidth={hot ? 1.5 : 0} />
            ))}
            {/* prop */}
            <rect x={-2} y={-isl.layers.length * 5 - 16} width={4} height={16} fill="var(--nx-text)" />
            {reviewSet.has(isl.id) && <circle cx={r * 0.5} cy={-isl.layers.length * 5 - 2} r={4} fill="var(--nx-warm)" />}
            {hasExhibit(isl.id) && <ellipse cx={0} cy={0} rx={r * 1.15} ry={r * 0.52} fill="none" stroke="var(--nx-accent)" strokeWidth={2} />}
            {hot && (
              <text x={0} y={-isl.layers.length * 5 - 26} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--nx-text)">
                {isl.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
