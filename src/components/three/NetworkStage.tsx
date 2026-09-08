import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { buildNetwork } from './network'
import { getScene, setScene, subscribeScene, threeDisabled, useHover, type HoverInfo } from './store'

const NetworkScene = lazy(() => import('./NetworkScene'))

/**
 * The one persistent stage. Lives in Layout, fixed behind the UI.
 * - lazy-loads three.js only when it will actually render
 * - falls back to a static SVG network when WebGL is missing or the
 *   user prefers reduced motion (still on-brand, zero cost)
 * - feeds cursor + scroll into the scene store (no React re-renders)
 * - renders the accessible hover label for Home (plain DOM, not WebGL)
 */
export default function NetworkStage() {
  const [mode, setMode] = useState<'webgl' | 'static' | 'pending'>('pending')

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
      setMode(!ok || mq.matches || threeDisabled() ? 'static' : 'webgl')
    }
    decide()
    // if the OS setting flips while the app is open, swap to the still network live
    mq.addEventListener?.('change', decide)
    return () => mq.removeEventListener?.('change', decide)
  }, [])

  useEffect(() => {
    if (mode !== 'webgl') return
    const fine = window.matchMedia('(pointer: fine)').matches
    const onScroll = () => {
      const vh = window.innerHeight || 1
      setScene({ scroll: Math.min(1, window.scrollY / (vh * 1.4)) })
    }
    const onMove = (e: MouseEvent) => {
      setScene({ px: (e.clientX / window.innerWidth) * 2 - 1, py: -((e.clientY / window.innerHeight) * 2 - 1), pointerIn: true })
    }
    const onLeave = () => setScene({ pointerIn: false })
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
  }, [mode])

  if (mode === 'pending') return null

  return (
    <>
      <div className="network-stage fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        {mode === 'webgl' ? (
          <Suspense fallback={null}>
            <NetworkScene />
          </Suspense>
        ) : (
          <StaticNetwork />
        )}
      </div>
      {mode === 'webgl' && <HoverLabel />}
    </>
  )
}

/** Small editorial label that follows the hovered node (Home). */
function HoverLabel() {
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const cb = useCallback((h: HoverInfo | null) => setHover(h), [])
  useHover(cb)
  const labels = getScene().clusterLabels
  return (
    <AnimatePresence>
      {hover && (
        <motion.div
          key="hover-label"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed z-[5] pointer-events-none hidden md:block"
          style={{ left: hover.x, top: hover.y, transform: 'translate(14px, -50%)' }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-px bg-line-strong" />
            <span className="t-label text-fg-2 bg-canvas/80 backdrop-blur-sm px-2 py-1 rounded">
              {labels[hover.cluster]} · {hover.tier === 1 ? 'topic' : 'question'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Non-WebGL / reduced-motion / opted-out fallback: the same network drawn once
 * as SVG. It still follows the page (presence + activation from the store) so
 * the product keeps its identity — it just never moves.
 */
function StaticNetwork() {
  const net = useMemo(() => buildNetwork({ leaves: 20 }), [])
  const [page, setPage] = useState(() => ({ presence: 1, activation: getScene().activation, quiet: false }))
  useEffect(() => {
    const read = () => {
      const s = getScene()
      const presence = s.mode === 'quiet' ? 0.3 : s.mode === 'atmospheric' ? 0.6 : s.mode === 'responsive' ? 0.75 : 0.85
      const activation = s.clusterWeights ? 1 : s.activation
      setPage((p) => (p.presence === presence && p.activation === activation ? p : { presence, activation, quiet: s.mode === 'quiet' }))
    }
    read()
    return subscribeScene(read)
  }, [])
  // simple orthographic-ish projection with depth scaling
  const pts = useMemo(() => {
    const out: { x: number; y: number; d: number; tier: number; cluster: number }[] = []
    for (let i = 0; i < net.count; i++) {
      const x = net.home[i * 3]
      const y = net.home[i * 3 + 1]
      const z = net.home[i * 3 + 2]
      const d = 1 / (1 + (2 - z) * 0.12)
      out.push({ x: (x + 0.6) * 78 * d, y: -(y - 0.3) * 78 * d, d, tier: net.tier[i], cluster: net.cluster[i] })
    }
    return out
  }, [net])
  return (
    <svg
      className="absolute inset-0 w-full h-full transition-opacity duration-500"
      style={{ opacity: page.presence }}
      viewBox="-360 -260 720 520"
      preserveAspectRatio="xMidYMid slice"
    >
      <g>
        {Array.from({ length: net.edgeCount }, (_, e) => {
          if (net.edgeKind[e] === 3) return null
          const a = pts[net.edges[e * 2]]
          const b = pts[net.edges[e * 2 + 1]]
          const depth = (a.d + b.d) / 2
          return <line key={e} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--nx-3d-strut)" strokeWidth={net.edgeKind[e] === 0 ? 1.2 : 0.7} strokeOpacity={0.15 + depth * 0.35} />
        })}
      </g>
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={(p.tier === 0 ? 16 : p.tier === 1 ? 6 : 3) * p.d}
          fill={p.tier === 0 ? 'var(--nx-3d-core)' : net.activationRank[i] <= page.activation ? 'var(--nx-accent)' : 'var(--nx-3d-node)'}
          fillOpacity={0.35 + p.d * 0.65}
          stroke={p.tier === 0 ? 'none' : 'var(--nx-line-strong)'}
        />
      ))}
    </svg>
  )
}
