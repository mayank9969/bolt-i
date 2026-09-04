import { Suspense, lazy, useEffect, useState } from 'react'
import { setScene } from './store'

const NexusScene = lazy(() => import('./NexusScene'))

/**
 * The one persistent stage. Lives in Layout, fixed behind the UI.
 * - lazy-loads three.js only when it will actually render
 * - falls back to a static SVG lattice when WebGL is missing or the
 *   user prefers reduced motion (still on-brand, zero cost)
 * - feeds cursor + scroll into the scene store (no React re-renders)
 */
export default function NexusStage() {
  const [mode, setMode] = useState<'webgl' | 'static' | 'pending'>('pending')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let ok = false
    try {
      const c = document.createElement('canvas')
      ok = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      ok = false
    }
    setMode(!ok || reduce ? 'static' : 'webgl')
  }, [])

  // scroll → depth; pointer → reveal tilt
  useEffect(() => {
    if (mode !== 'webgl') return
    const fine = window.matchMedia('(pointer: fine)').matches
    const onScroll = () => {
      const vh = window.innerHeight || 1
      setScene({ scroll: Math.min(1, window.scrollY / (vh * 1.4)) })
    }
    const onMove = (e: MouseEvent) => {
      setScene({ px: (e.clientX / window.innerWidth) * 2 - 1, py: -((e.clientY / window.innerHeight) * 2 - 1) })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    if (fine) window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
    }
  }, [mode])

  if (mode === 'pending') return null

  return (
    <div className="nexus-stage fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {mode === 'webgl' ? (
        <Suspense fallback={null}>
          <NexusScene />
        </Suspense>
      ) : (
        <StaticLattice />
      )}
    </div>
  )
}

/** Non-WebGL fallback: the same idea drawn once as SVG. */
function StaticLattice() {
  // a small deterministic set of points on a circle + interior
  const pts: [number, number][] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < 40; i++) {
    const y = 1 - (i / 39) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    const z = Math.sin(th) * r
    const depth = 0.6 + (z + 1) * 0.2
    pts.push([Math.cos(th) * r * 150 * depth, y * 150 * depth])
  }
  const edges: [number, number][] = []
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    near.forEach(({ j }) => i < j && edges.push([i, j]))
  })
  return (
    <svg className="absolute right-[-6%] top-[12%] w-[min(60vw,640px)] h-auto opacity-70 hidden md:block" viewBox="-200 -200 400 400">
      {edges.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="var(--nx-3d-strut)" strokeWidth="1" strokeOpacity="0.6" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 5 : 3.5} fill={i % 5 === 0 ? 'var(--nx-accent)' : 'var(--nx-3d-node)'} stroke="var(--nx-line-strong)" />
      ))}
      <circle cx="0" cy="0" r="18" fill="var(--nx-3d-core)" />
    </svg>
  )
}
